const dataRoot = "./data";

const scenarioNames = {
  NORMAL: "正常行为",
  ACCOUNT_ABUSE: "账号滥用",
  DATA_EXFILTRATION: "数据外泄",
  EMR_LEAKAGE: "电子病历泄露",
  IMAGE_LEAKAGE: "医学影像泄露",
  MULTI_SOURCE_ATTACK: "多源攻击",
  SLOW_DATA_EXFILTRATION: "慢速数据外泄"
};

const anomalyNames = {
  NORMAL: "正常",
  ACCOUNT_ABUSE: "账号滥用",
  DATA_EXFILTRATION: "数据外泄",
  EMR_LEAKAGE: "电子病历泄露",
  IMAGE_LEAKAGE: "医学影像泄露",
  MULTI_SOURCE_ATTACK: "多源攻击",
  SLOW_DATA_EXFILTRATION: "慢速数据外泄",
  INTEGRITY_ANOMALY: "完整性异常",
  TAMPERING: "疑似篡改"
};

const integrityNames = {
  NORMAL: "正常",
  SUSPICIOUS: "可疑",
  HIGH_CONFIDENCE_ANOMALY: "高可信完整性异常",
  UNKNOWN: "未知"
};

const poolNames = {
  APPEND: "已入池",
  SKIP: "跳过",
  PENDING: "待定"
};

const fmtInt = new Intl.NumberFormat("zh-CN");
const fmtPct = (value, digits = 2) => `${(Number(value) * 100).toFixed(digits)}%`;
const fmtMs = (value) => `${Number(value).toFixed(2)} ms`;

let state = {
  summary: null,
  metrics: null,
  config: null,
  behavior: null,
  rows: [],
  selectedIncidentId: "img-leak",
  stage: 0,
  logs: [],
  selectedRow: null,
  backendIncidents: {},
  backendAvailable: false
};

function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`DOM_MISSING:#${id}`);
  }
  return el;
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload && payload.error
      ? payload.error
      : `API 请求失败：${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function syncBackendIncidents() {
  const payload = await apiRequest("/api/incidents");
  state.backendAvailable = true;
  state.backendIncidents = Object.fromEntries(
    (payload.incidents || []).map((item) => [item.id, item])
  );

  const current = state.backendIncidents[state.selectedIncidentId];
  if (current && Number.isFinite(Number(current.stage))) {
    state.stage = Number(current.stage);
  }
}

async function syncAuditLog() {
  if (!state.backendAvailable) return;
  const payload = await apiRequest(`/api/audit?incident_id=${encodeURIComponent(state.selectedIncidentId)}`);
  state.logs = (payload.logs || []).map((item) => {
    const stamp = item.created_at ? item.created_at.replace("T", " ").replace("Z", "") : "--";
    return `[${stamp}] ${item.message}`;
  });
  renderLog();
}

async function loadJson(name) {
  const response = await fetch(`${dataRoot}/${name}`);
  if (!response.ok) throw new Error(`无法读取 ${name}`);
  return response.json();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((item) => item !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

async function loadCsvSample(limit = 500) {
  const response = await fetch(`${dataRoot}/results.csv`);
  if (!response.ok) throw new Error("无法读取 results.csv");
  const text = await response.text();
  const parsed = parseCsv(text);
  const headers = (parsed.shift() ?? []).map((header) => header.replace(/^\uFEFF/, ""));
  return parsed.slice(0, limit).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function getIncidents() {
  const s = state.summary;
  const m = state.metrics;
  return [
    {
      id: "img-leak",
      riskTag: "高风险",
      title: "医学影像异常外传",
      assetType: "医学影像",
      dataLevel: "D3",
      status: "待分析",
      risk: 0.91,
      anomaly: "IMAGE_LEAKAGE",
      policy: "P3",
      result: "已遏制 / 已入池",
      assetVisual: "image",
      overview: "疑似高敏感影像资产被异常访问并出现外传风险。",
      evidence: {
        behavior: ["访问频率高于正常画像", "文件读取模式异常", "网络传输行为异常"],
        data: ["数据等级：D3", "资产类型：医学影像", "Trap：否"],
        model: [`R = 0.91`, "A = IMAGE_LEAKAGE", "建议 P3 高风险处置"],
        defense: ["冻结高风险会话", "限制敏感影像访问", "收紧密钥使用", "写入安全事件候选池"],
        integrity: ["派生副本水印状态：可验证", "AssetID：已匹配", "CopyID：已识别", "源医学影像：未修改"],
        recovery: ["本事件以遏制和追踪为主", "Local / Cold 备份均可用", "无需覆盖恢复"],
        audit: ["事件类型：医学影像异常外传", `正式场景检出率：${fmtPct(m.scenario_metrics.IMAGE_LEAKAGE.detection_rate)}`, "审计结论：可追踪、可复核"]
      }
    },
    {
      id: "img-tamper",
      riskTag: "高风险",
      title: "医学影像完整性异常",
      assetType: "医学影像",
      dataLevel: "D3",
      status: "待验证",
      risk: 0.96,
      anomaly: "INTEGRITY_ANOMALY",
      policy: "P3",
      result: "Cold 恢复成功",
      assetVisual: "image",
      overview: "影像派生副本或关联完整性证据出现高可信异常，需要验证和恢复。",
      evidence: {
        behavior: ["影像文件出现异常修改痕迹", "完整性证据与备份比对不一致", "操作上下文异常"],
        data: ["数据等级：D3", "资产类型：医学影像", "涉及完整性证据"],
        model: [`R = 0.96`, "A = INTEGRITY_ANOMALY", "建议 P3 高风险处置"],
        defense: ["隔离可疑会话", "停止继续分发该副本", "触发完整性验证", "进入恢复评估"],
        integrity: ["完整性状态：高可信异常", "哈希证据：不一致", "备份比对：异常", `正式 run 高可信异常：${fmtInt.format(s.integrity.HIGH_CONFIDENCE_ANOMALY)} 条`],
        recovery: ["恢复来源：Cold Backup", "恢复结果：成功", `平均恢复耗时：${fmtMs(s.recovery.mean_recovery_ms)}`],
        audit: ["事件类型：医学影像完整性异常", "审计结论：已恢复、可复核", "边界：正式 run 未单独拆分标注为“影像篡改”"]
      }
    },
    {
      id: "emr-tamper",
      riskTag: "高风险",
      title: "电子病历疑似篡改",
      assetType: "电子病历",
      dataLevel: "D3",
      status: "待恢复",
      risk: 0.94,
      anomaly: "TAMPERING",
      policy: "P3",
      result: "恢复后正常",
      assetVisual: "emr",
      overview: "电子病历出现认证或完整性异常，需要执行高风险策略和可信恢复。",
      evidence: {
        behavior: ["EMR 访问上下文异常", "敏感字段存在异常修改风险", "操作行为偏离正常画像"],
        data: ["数据等级：D3", "资产类型：电子病历", "加密状态：AES-GCM"],
        model: [`R = 0.94`, "A = TAMPERING", "建议 P3 高风险处置"],
        defense: ["冻结高风险会话", "限制该 EMR 后续修改", "触发认证与备份验证", "记录候选安全事件"],
        integrity: ["AES-GCM 认证状态：异常", "备份状态：Cold 可用", "恢复建议：执行 Cold 恢复"],
        recovery: ["恢复来源：Cold Backup", "恢复结果：成功", "恢复后状态：正常"],
        audit: ["事件类型：电子病历疑似篡改", `正式恢复成功率：${fmtPct(s.recovery.success_rate)}`, "边界：EMR 内嵌水印运行时当前未提供"]
      }
    },
    {
      id: "account-abuse",
      riskTag: "中风险",
      title: "账号滥用",
      assetType: "账号 / 权限",
      dataLevel: "D2",
      status: "待处置",
      risk: 0.78,
      anomaly: "ACCOUNT_ABUSE",
      policy: "P2",
      result: "权限已收紧",
      assetVisual: "emr",
      overview: "账号访问频率和访问对象异常，需要执行中强度权限收紧。",
      evidence: {
        behavior: ["非典型时间访问", "访问对象范围扩大", "多次触达敏感资产"],
        data: ["数据等级：D2", "资产类型：账号与访问权限", "Trap：否"],
        model: [`R = 0.78`, "A = ACCOUNT_ABUSE", "建议 P2 中强度防御"],
        defense: ["限制敏感资产访问", "要求权限复核", "增加审计频率"],
        integrity: ["未发现高可信完整性异常", "维持常规完整性检查", "备份状态：可用"],
        recovery: ["无需执行 Cold 恢复", "保持业务连续性", "事件进入评估"],
        audit: ["事件类型：账号滥用", `正式场景检出率：${fmtPct(m.scenario_metrics.ACCOUNT_ABUSE.detection_rate)}`, "审计结论：已处置、持续观察"]
      }
    }
  ];
}

const stageMeta = [
  { name: "载入事件", action: "载入事件", detail: "安全事件进入处置工单。" },
  { name: "分析事件", action: "分析事件", detail: "AI 风险判定完成。" },
  { name: "执行策略", action: "执行防御策略", detail: "Policy Engine 输出策略并执行模拟防御。" },
  { name: "验证完整性", action: "验证完整性", detail: "检查水印、哈希、AES-GCM 或备份证据。" },
  { name: "执行恢复", action: "执行 Cold 恢复", detail: "必要时从可信备份恢复。" },
  { name: "生成审计", action: "生成审计记录", detail: "形成可追踪、可复核的审计结论。" }
];

function currentIncident() {
  const baseIncident =
    getIncidents().find((item) => item.id === state.selectedIncidentId) || getIncidents()[0];
  const persisted = state.backendIncidents[state.selectedIncidentId];

  if (!persisted) return baseIncident;

  return {
    ...baseIncident,
    status: persisted.status || baseIncident.status,
    risk: persisted.risk_score ?? baseIncident.risk,
    anomaly: persisted.anomaly_type || baseIncident.anomaly,
    policy: persisted.policy || baseIncident.policy,
    result: persisted.result || baseIncident.result
  };
}

function addLog(message) {
  const index = state.logs.length;
  const time = `00:${String(index * 2).padStart(2, "0")}`;
  state.logs.push(`[${time}] ${message}`);
  renderLog();
}

function renderLog() {
  byId("audit-log").innerHTML = state.logs.map((line) => {
    const match = line.match(/^(\[[^\]]+\])\s?(.*)$/);
    if (!match) return `<div class="terminal-line">${safeText(line)}</div>`;
    return `<div class="terminal-line"><span>${safeText(match[1])}</span> ${safeText(match[2])}</div>`;
  }).join("");
  byId("audit-log").scrollTop = byId("audit-log").scrollHeight;
}

function renderQueue() {
  const incidents = getIncidents();
  byId("pending-count").textContent = String(incidents.length - 1);
  byId("high-risk-count").textContent = String(incidents.filter((i) => i.riskTag === "高风险").length);

  byId("incident-queue").innerHTML = incidents.map((item) => `
    <button class="queue-card ${item.id === state.selectedIncidentId ? "active" : ""}" data-id="${item.id}" type="button">
      <span class="risk ${item.riskTag === "中风险" ? "mid" : ""}">${item.riskTag}</span>
      <strong>${item.title}</strong>
      <small>${item.dataLevel} · ${item.assetType} · ${item.status}</small>
    </button>
  `).join("");

  document.querySelectorAll(".queue-card").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedIncidentId = button.dataset.id;
      const persisted = state.backendIncidents[state.selectedIncidentId];
      state.stage = persisted ? Number(persisted.stage || 0) : 0;
      renderConsole();
      try {
        await syncAuditLog();
      } catch (error) {
        console.error(error);
      }
    });
  });
}

function renderConsole() {
  const item = currentIncident();
  renderQueue();

  byId("case-label").textContent = `CASE / ${item.id.toUpperCase()}`;
  byId("case-title").textContent = item.title;
  byId("case-state").textContent = state.stage >= 5 ? "已完成" : item.status;

  byId("case-summary").innerHTML = [
    ["资产类型", item.assetType],
    ["数据等级", item.dataLevel],
    ["风险状态", state.stage >= 1 ? `${item.risk.toFixed(2)} / ${item.riskTag}` : "待分析"],
    ["建议策略", state.stage >= 1 ? item.policy : "待判定"]
  ].map(([label, value]) => `
    <article class="summary-item"><span>${label}</span><strong>${value}</strong></article>
  `).join("");

  byId("case-asset").innerHTML = `
    <div class="asset-preview">
      <div class="asset-visual ${item.assetVisual === "emr" ? "emr" : ""}">
        <strong>${item.assetVisual === "emr" ? "EMR RECORD" : "CT / X-RAY"}</strong>
      </div>
      <div class="asset-meta">
        <h3>${item.assetType}安全对象</h3>
        <p>${item.overview}</p>
        <ul>
          <li>AssetID：AST-${item.id.toUpperCase().slice(0, 4)}-****</li>
          <li>状态：${state.stage >= 5 ? "处置完成" : item.status}</li>
          <li>来源：正式 run 数据支撑 + 前端处置演示</li>
        </ul>
      </div>
    </div>
  `;

  renderActions(item);
  renderStages();
  renderEvidence();
}

function renderActions(item) {
  const actions = stageMeta.slice(1);
  byId("action-bar").innerHTML = actions.map((meta, index) => {
    const targetStage = index + 1;
    const enabled = targetStage === state.stage + 1;
    const done = state.stage >= targetStage;
    return `
      <button class="action-btn ${done ? "done" : ""}" data-target-stage="${targetStage}" type="button" ${enabled ? "" : "disabled"}>
        <span>STEP ${String(targetStage).padStart(2, "0")}</span>
        <strong>${meta.action}</strong>
      </button>
    `;
  }).join("");

  const actionNames = {
    1: "analyze",
    2: "defend",
    3: "integrity",
    4: "recover",
    5: "audit"
  };

  document.querySelectorAll(".action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = Number(button.dataset.targetStage);
      if (target !== state.stage + 1) return;

      button.disabled = true;
      button.classList.add("loading");
      const originalText = button.querySelector("strong").textContent;
      button.querySelector("strong").textContent = "正在执行…";

      try {
        const payload = await apiRequest(
          `/api/incidents/${encodeURIComponent(state.selectedIncidentId)}/action`,
          {
            method: "POST",
            body: JSON.stringify({ action: actionNames[target] })
          }
        );

        if (payload.incident) {
          state.backendIncidents[payload.incident.id] = payload.incident;
          state.stage = Number(payload.incident.stage || target);
        } else {
          state.stage = target;
        }

        await syncAuditLog();
        renderConsole();
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.classList.remove("loading");
        button.querySelector("strong").textContent = originalText;
        window.alert(`后端操作失败：${error.message}`);
      }
    });
  });
}

function addStageLog(item, stage, meta) {
  const logs = {
    1: `AI 风险分析完成：R=${item.risk.toFixed(2)}, A=${item.anomaly}`,
    2: `Policy Engine 输出策略：${item.policy}，${item.result}`,
    3: `完整性验证完成：${item.evidence.integrity[0]}`,
    4: `${item.policy === "P3" ? "Cold 恢复/恢复评估完成" : "恢复评估完成"}：${item.result}`,
    5: `审计记录已生成：${item.title}，结论=${item.result}`
  };
  addLog(logs[stage] || meta.detail);
}

function renderStages() {
  byId("stage-progress").innerHTML = stageMeta.map((meta, index) => `
    <article class="stage-item ${state.stage === index ? "active" : ""} ${state.stage > index ? "done" : ""}">
      <b>${meta.name}</b>
      <span>${index === 0 ? "安全事件已进入工单。" : meta.detail}</span>
      <i></i>
    </article>
  `).join("");
}

function evidenceBlocksForStage(item) {
  const blocks = [
    ["等待分析", ["请选择左侧安全事件，并点击“分析事件”。"]]
  ];

  if (state.stage >= 1) {
    blocks.push(["行为证据", item.evidence.behavior]);
    blocks.push(["数据证据", item.evidence.data]);
    blocks.push(["模型证据", item.evidence.model]);
  }
  if (state.stage >= 2) {
    blocks.push(["策略证据", item.evidence.defense]);
  }
  if (state.stage >= 3) {
    blocks.push(["完整性证据", item.evidence.integrity]);
  }
  if (state.stage >= 4) {
    blocks.push(["恢复证据", item.evidence.recovery]);
  }
  if (state.stage >= 5) {
    blocks.push(["审计结论", item.evidence.audit]);
  }

  return state.stage === 0 ? [blocks[0]] : blocks.slice(1);
}

function renderEvidence() {
  const item = currentIncident();
  byId("evidence-content").innerHTML = evidenceBlocksForStage(item).map(([title, rows]) => `
    <article class="evidence-block">
      <span>${title}</span>
      <ul>${rows.map((row) => `<li>${safeText(row)}</li>`).join("")}</ul>
    </article>
  `).join("");
}

function renderFormalMetrics() {
  const s = state.summary;
  const m = state.metrics;

  const modelRows = [
    ["Accuracy", m.detection.accuracy],
    ["Precision", s.detection.precision],
    ["Recall", s.detection.recall],
    ["F1", s.detection.f1],
    ["AUC", m.detection.auc],
    ["未见攻击检出率", s.seen_unseen.unseen_detection_rate]
  ];

  byId("model-metrics").innerHTML = modelRows.map(([name, value]) => `
    <article class="metric-row">
      <div><strong>${name}</strong><span>${fmtPct(value)}</span></div>
      <p class="rail"><i style="width:${Math.max(0, Math.min(100, value * 100))}%"></i></p>
    </article>
  `).join("");

  const scenarioRows = Object.entries(m.scenario_metrics)
    .filter(([, item]) => typeof item.detection_rate === "number")
    .map(([name, item]) => [scenarioNames[name] ?? name, item.detection_rate, item.events]);

  byId("scenario-metrics").innerHTML = scenarioRows.map(([name, value, events]) => `
    <article class="metric-row">
      <div><strong>${name}</strong><span>${fmtInt.format(events)} 条 · ${fmtPct(value)}</span></div>
      <p class="rail"><i style="width:${Math.max(0, Math.min(100, value * 100))}%"></i></p>
    </article>
  `).join("");

  const policyTotal = Object.values(s.policy).reduce((sum, value) => sum + value, 0);
  byId("policy-metrics").innerHTML = Object.entries(s.policy).map(([policy, count]) => `
    <article class="policy-row">
      <div><strong>${policy}</strong><span>${fmtInt.format(count)} · ${(count / policyTotal * 100).toFixed(1)}%</span></div>
      <p class="rail"><i style="width:${(count / policyTotal * 100).toFixed(2)}%"></i></p>
    </article>
  `).join("");

  const cards = [
    ["攻击遏制率", fmtPct(s.defense.attack_containment_rate)],
    ["恢复成功率", fmtPct(s.recovery.success_rate)],
    ["Cold 恢复次数", fmtInt.format(s.recovery.cold_restore_count)],
    ["平均恢复耗时", fmtMs(s.recovery.mean_recovery_ms)],
    ["P95 流水线延迟", fmtMs(s.performance.p95_pipeline_ms)],
    ["高可信完整性异常", fmtInt.format(s.integrity.HIGH_CONFIDENCE_ANOMALY)]
  ];

  byId("recovery-metrics").innerHTML = cards.map(([name, value]) => `
    <article class="metric-card"><span>${name}</span><strong>${value}</strong></article>
  `).join("");
}

function fillFilters() {
  const scenarioFilter = byId("scenario-filter");
  const policyFilter = byId("policy-filter");

  [...new Set(state.rows.map((row) => row.scenario).filter(Boolean))]
    .sort()
    .forEach((name) => scenarioFilter.add(new Option(scenarioNames[name] ?? name, name)));

  [...new Set(state.rows.map((row) => row.P).filter(Boolean))]
    .sort()
    .forEach((name) => policyFilter.add(new Option(`策略 ${name}`, name)));
}

function renderEvents() {
  const scenario = byId("scenario-filter").value;
  const policy = byId("policy-filter").value;
  const filtered = state.rows
    .filter((row) => scenario === "ALL" || row.scenario === scenario)
    .filter((row) => policy === "ALL" || row.P === policy)
    .slice(0, 50);

  byId("visible-event-count").textContent = fmtInt.format(filtered.length);
  byId("event-table").innerHTML = filtered.map((row) => {
    const rowIndex = state.rows.indexOf(row);
    const integrity = integrityNames[row.integrity_state] ?? row.integrity_state;
    const integrityClass = row.integrity_state === "NORMAL" ? "normal" : "alert";
    return `
      <tr data-row-index="${rowIndex}">
        <td>${safeText((row.event_id || "").slice(0, 14))}...</td>
        <td>${safeText(scenarioNames[row.scenario] ?? row.scenario)}</td>
        <td><span class="pill">${safeText(row.D)}</span></td>
        <td>${Number(row.R || 0).toFixed(2)}</td>
        <td>${safeText(anomalyNames[row.A] ?? row.A)}</td>
        <td><span class="pill">${safeText(row.P)}</span></td>
        <td><span class="status-pill ${integrityClass}">${safeText(integrity)}</span></td>
        <td>${safeText(poolNames[row.event_pool_decision] ?? row.event_pool_decision)}</td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("#event-table tr").forEach((tr) => {
    tr.addEventListener("click", () => loadSampleEvent(Number(tr.dataset.rowIndex)));
  });
}

function loadSampleEvent(rowIndex) {
  const row = state.rows[rowIndex];
  if (!row) return;

  const scenario = row.scenario;
  if (row.integrity_state && row.integrity_state !== "NORMAL") {
    state.selectedIncidentId = "img-tamper";
  } else if (scenario === "IMAGE_LEAKAGE") {
    state.selectedIncidentId = "img-leak";
  } else if (scenario === "ACCOUNT_ABUSE") {
    state.selectedIncidentId = "account-abuse";
  } else if (scenario === "EMR_LEAKAGE") {
    state.selectedIncidentId = "emr-tamper";
  } else {
    state.selectedIncidentId = "img-leak";
  }

  state.stage = 1;
  renderConsole();
  addLog(`从事件样本载入：${row.event_id || "未知事件"}，场景=${scenarioNames[scenario] ?? scenario}`);
  location.hash = "#console";
}

function activateReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  nodes.forEach((node) => observer.observe(node));
}

function activateNav() {
  const links = [...document.querySelectorAll(".main-nav a")];
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!active) return;
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${active.target.id}`));
  }, { rootMargin: "-20% 0px -70% 0px", threshold: [0.1, 0.35, 0.6] });
  sections.forEach((section) => observer.observe(section));
}

async function boot() {
  const [summary, metrics, config, behavior, rows] = await Promise.all([
    loadJson("summary.json"),
    loadJson("metrics.json"),
    loadJson("run_config.json"),
    loadJson("behavior_manifest.json"),
    loadCsvSample()
  ]);

  state.summary = summary;
  state.metrics = metrics;
  state.config = config;
  state.behavior = behavior;
  state.rows = rows;

  try {
    await syncBackendIncidents();
  } catch (error) {
    state.backendAvailable = false;
    console.error("后端 API 不可用：", error);
    throw new Error("后端 API 未连接。请使用 Wrangler 启动或部署全栈版本，而不是 python http.server。");
  }

  renderConsole();
  renderFormalMetrics();
  fillFilters();
  renderEvents();

  await syncAuditLog();

  byId("scenario-filter").addEventListener("change", renderEvents);
  byId("policy-filter").addEventListener("change", renderEvents);
  byId("clear-log").addEventListener("click", async () => {
    try {
      await apiRequest(`/api/audit?incident_id=${encodeURIComponent(state.selectedIncidentId)}`, {
        method: "DELETE"
      });
      await syncAuditLog();
    } catch (error) {
      window.alert(`清空审计日志失败：${error.message}`);
    }
  });

  activateReveal();
  activateNav();
}

function startApp() {
  initNeuralBackground();
  boot().catch((error) => {
    console.error("MedShield-AI initialization failed:", error);
    const message = error && error.message ? error.message : String(error);
    const root = document.body;
    if (root) {
      root.innerHTML = `
        <main class="section">
          <h1>页面初始化失败</h1>
          <p>${safeText(message)}</p>
          <p>当前错误来自页面初始化，不代表正式实验数据缺失。</p>
        </main>
      `;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp, { once: true });
} else {
  startApp();
}


/* ===== V5.2 Neural Float Background ===== */
function initNeuralBackground() {
  const canvas = document.getElementById("neural-background");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0, height = 0, dpr = 1, nodes = [], rafId = null, lastTime = performance.now();
  const pointer = { x:.5, y:.5, tx:.5, ty:.5 };

  function makeNode() {
    const depth = .45 + Math.random() * .9;
    return { x:Math.random(), y:Math.random(), vx:(Math.random()-.5)*.000032*depth, vy:(Math.random()-.5)*.000025*depth, r:.6+Math.random()*1.5, depth, phase:Math.random()*Math.PI*2 };
  }
  function countNodes() {
    const area = Math.max(1, innerWidth * innerHeight);
    const base = Math.round(area / 36000);
    return innerWidth < 760 ? Math.max(20, Math.min(34, base)) : Math.max(34, Math.min(62, base));
  }
  function resize() {
    width = Math.max(1, innerWidth); height = Math.max(1, innerHeight); dpr = Math.min(devicePixelRatio || 1, 1.8);
    canvas.width = Math.floor(width*dpr); canvas.height = Math.floor(height*dpr);
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    nodes = Array.from({length:countNodes()}, makeNode);
  }
  function project(n) {
    const px=(pointer.x-.5)*18*n.depth, py=(pointer.y-.5)*12*n.depth;
    return { x:n.x*width+px+Math.sin(n.phase)*6*n.depth, y:n.y*height+py+Math.cos(n.phase*.82)*4*n.depth };
  }
  function move(dt) {
    const s = reduceMotion ? .12 : Math.min(dt,34);
    for (const n of nodes) {
      n.x += n.vx*s; n.y += n.vy*s; n.phase += .0007*s;
      if (n.x < -.05) n.x = 1.05; if (n.x > 1.05) n.x = -.05;
      if (n.y < -.05) n.y = 1.05; if (n.y > 1.05) n.y = -.05;
    }
  }
  function drawWash() {
    const g=ctx.createRadialGradient(width*(.30+pointer.x*.10),height*(.16+pointer.y*.08),0,width*.42,height*.25,Math.max(width,height)*.65);
    g.addColorStop(0,"rgba(58,205,236,.055)"); g.addColorStop(.38,"rgba(54,112,188,.025)"); g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g; ctx.fillRect(0,0,width,height);
  }
  function drawLinks(p) {
    const md=Math.min(175,Math.max(118,width*.10)), md2=md*md;
    for (let i=0;i<p.length;i++) for (let j=i+1;j<p.length;j++) {
      const dx=p[i].x-p[j].x, dy=p[i].y-p[j].y, d2=dx*dx+dy*dy;
      if (d2>md2) continue;
      const a=(1-d2/md2)*.13;
      const g=ctx.createLinearGradient(p[i].x,p[i].y,p[j].x,p[j].y);
      g.addColorStop(0,`rgba(71,220,247,${a})`); g.addColorStop(1,`rgba(90,141,255,${a*.62})`);
      ctx.beginPath(); ctx.moveTo(p[i].x,p[i].y);
      ctx.quadraticCurveTo((p[i].x+p[j].x)/2+Math.sin((i+j)*.7)*8,(p[i].y+p[j].y)/2+Math.cos((i-j)*.6)*6,p[j].x,p[j].y);
      ctx.strokeStyle=g; ctx.lineWidth=.72; ctx.stroke();
    }
  }
  function drawNodes(p) {
    p.forEach((pt,i)=>{
      const n=nodes[i], pulse=.72+Math.sin(n.phase*1.6)*.18;
      ctx.beginPath(); ctx.arc(pt.x,pt.y,n.r*pulse+.55,0,Math.PI*2);
      ctx.fillStyle=`rgba(126,235,250,${.23+n.depth*.08})`; ctx.fill();
      if (i%7===0) {
        const h=ctx.createRadialGradient(pt.x,pt.y,0,pt.x,pt.y,12+n.depth*8);
        h.addColorStop(0,"rgba(71,220,247,.12)"); h.addColorStop(1,"rgba(71,220,247,0)");
        ctx.fillStyle=h; ctx.fillRect(pt.x-22,pt.y-22,44,44);
      }
    });
  }
  function frame(now) {
    const dt=now-lastTime; lastTime=now; ctx.clearRect(0,0,width,height);
    pointer.x += (pointer.tx-pointer.x)*.032; pointer.y += (pointer.ty-pointer.y)*.032;
    move(dt); drawWash(); const p=nodes.map(project); drawLinks(p); drawNodes(p);
    rafId=requestAnimationFrame(frame);
  }
  function dimByScroll() {
    const hero=document.getElementById("console"); if (!hero) return;
    const r=hero.getBoundingClientRect();
    document.body.classList.toggle("neural-dim", r.bottom < innerHeight*.30);
  }
  addEventListener("pointermove", e=>{ pointer.tx=e.clientX/Math.max(innerWidth,1); pointer.ty=e.clientY/Math.max(innerHeight,1); }, {passive:true});
  addEventListener("pointerleave", ()=>{ pointer.tx=.5; pointer.ty=.5; });
  addEventListener("resize", resize); addEventListener("scroll", dimByScroll, {passive:true});
  document.addEventListener("visibilitychange", ()=>{
    if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId=null; }
    else if (!document.hidden && !rafId && !reduceMotion) { lastTime=performance.now(); rafId=requestAnimationFrame(frame); }
  });
  resize(); dimByScroll();
  if (reduceMotion) { drawWash(); const p=nodes.map(project); drawLinks(p); drawNodes(p); return; }
  rafId=requestAnimationFrame(frame);
}
