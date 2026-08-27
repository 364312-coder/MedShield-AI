const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: JSON_HEADERS
  });
}

function nowIso() {
  return new Date().toISOString();
}

const ACTIONS = {
  analyze: {
    targetStage: 1,
    status: "已分析",
    message: (row) => `AI 风险分析完成：R=${Number(row.risk_score).toFixed(2)}, A=${row.anomaly_type}`
  },
  defend: {
    targetStage: 2,
    status: "防御已执行",
    message: (row) => `Policy Engine 执行策略：${row.policy}，结果=${row.result}`
  },
  integrity: {
    targetStage: 3,
    status: "完整性已验证",
    message: (row) => `完整性验证完成：事件=${row.title}`
  },
  recover: {
    targetStage: 4,
    status: "恢复评估完成",
    message: (row) => `恢复/恢复评估完成：结果=${row.result}`
  },
  audit: {
    targetStage: 5,
    status: "处置完成",
    message: (row) => `审计记录已生成：${row.title}，结论=${row.result}`
  }
};

async function getIncident(db, id) {
  return db.prepare(
    `SELECT id, title, asset_type, data_level, risk_score, anomaly_type,
            policy, status, stage, result, created_at, updated_at
       FROM incidents
      WHERE id = ?`
  ).bind(id).first();
}

async function listIncidents(db) {
  const result = await db.prepare(
    `SELECT id, title, asset_type, data_level, risk_score, anomaly_type,
            policy, status, stage, result, created_at, updated_at
       FROM incidents
      ORDER BY created_at ASC`
  ).all();
  return result.results || [];
}

async function appendAudit(db, incidentId, action, message) {
  await db.prepare(
    `INSERT INTO audit_logs (incident_id, action, message, created_at)
     VALUES (?, ?, ?, ?)`
  ).bind(incidentId, action, message, nowIso()).run();
}

async function handleAction(request, env, id) {
  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  const meta = ACTIONS[action];

  if (!meta) {
    return json({ error: "未知处置动作" }, 400);
  }

  const incident = await getIncident(env.DB, id);
  if (!incident) {
    return json({ error: "事件不存在" }, 404);
  }

  const currentStage = Number(incident.stage || 0);
  if (meta.targetStage !== currentStage + 1) {
    return json({
      error: `动作顺序不正确：当前阶段=${currentStage}，目标阶段=${meta.targetStage}`
    }, 409);
  }

  const updatedAt = nowIso();

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE incidents
          SET stage = ?, status = ?, updated_at = ?
        WHERE id = ?`
    ).bind(meta.targetStage, meta.status, updatedAt, id),
    env.DB.prepare(
      `INSERT INTO incident_actions
         (incident_id, action, stage, result, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(id, action, meta.targetStage, "SUCCESS", updatedAt)
  ]);

  const updated = await getIncident(env.DB, id);
  await appendAudit(env.DB, id, action, meta.message(updated));

  return json({
    ok: true,
    incident: updated
  });
}

async function handleReset(env, id) {
  const incident = await getIncident(env.DB, id);
  if (!incident) {
    return json({ error: "事件不存在" }, 404);
  }

  const updatedAt = nowIso();
  await env.DB.batch([
    env.DB.prepare(
      `UPDATE incidents
          SET stage = 0, status = '待分析', updated_at = ?
        WHERE id = ?`
    ).bind(updatedAt, id),
    env.DB.prepare(`DELETE FROM incident_actions WHERE incident_id = ?`).bind(id),
    env.DB.prepare(`DELETE FROM audit_logs WHERE incident_id = ?`).bind(id)
  ]);

  await appendAudit(env.DB, id, "reset", `事件已重置：${incident.title}`);

  return json({
    ok: true,
    incident: await getIncident(env.DB, id)
  });
}

async function routeApi(request, env) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/health" && request.method === "GET") {
    const check = await env.DB.prepare("SELECT 1 AS ok").first();
    return json({
      ok: Boolean(check?.ok),
      service: "MedShield-AI Web API",
      time: nowIso()
    });
  }

  if (pathname === "/api/incidents" && request.method === "GET") {
    return json({ incidents: await listIncidents(env.DB) });
  }

  const actionMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/action$/);
  if (actionMatch && request.method === "POST") {
    return handleAction(request, env, decodeURIComponent(actionMatch[1]));
  }

  const resetMatch = pathname.match(/^\/api\/incidents\/([^/]+)\/reset$/);
  if (resetMatch && request.method === "POST") {
    return handleReset(env, decodeURIComponent(resetMatch[1]));
  }

  if (pathname === "/api/audit" && request.method === "GET") {
    const incidentId = url.searchParams.get("incident_id");
    if (!incidentId) return json({ error: "缺少 incident_id" }, 400);

    const result = await env.DB.prepare(
      `SELECT id, incident_id, action, message, created_at
         FROM audit_logs
        WHERE incident_id = ?
        ORDER BY id ASC`
    ).bind(incidentId).all();

    return json({ logs: result.results || [] });
  }

  if (pathname === "/api/audit" && request.method === "DELETE") {
    const incidentId = url.searchParams.get("incident_id");
    if (!incidentId) return json({ error: "缺少 incident_id" }, 400);

    await env.DB.prepare(`DELETE FROM audit_logs WHERE incident_id = ?`)
      .bind(incidentId)
      .run();

    return json({ ok: true });
  }

  return json({ error: "API 路由不存在" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return await routeApi(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({
        error: "服务器内部错误",
        detail: error instanceof Error ? error.message : String(error)
      }, 500);
    }
  }
};
