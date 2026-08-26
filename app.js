const dataRoot = "./public/data";

const steps = [
  ["01", "DataRecord", "建立医疗资产身份"],
  ["02", "D1/D2/D3 + Trap", "分级与诱捕信号分离"],
  ["03", "AES + Backup", "加密、Local 与 Cold 双备份"],
  ["04", "BehaviorEvent", "生成医院访问与攻击场景"],
  ["05", "U/F/N/C", "构建 50 维行为特征"],
  ["06", "UFN-SAR", "正常画像与语义残差"],
  ["07", "LightGBM", "输出风险 R 与异常 A"],
  ["08", "Policy", "合成 P0-P3 动作计划"],
  ["09", "Defense", "执行权限、密钥、网络、水印动作"],
  ["10", "Integrity", "联合完整性四态判断"],
  ["11", "Recovery", "必要时从可信备份恢复"],
  ["12", "Evaluation", "计算检测与处置效果"],
  ["13", "Event Pool", "确认事件选择性入池"],
  ["14", "Feedback", "运行时反馈，不在线训练"],
  ["15", "Dashboard", "当前网页展示层"]
];

const fmtInt = new Intl.NumberFormat("en-US");
const fmtPct = (value) => `${(value * 100).toFixed(2)}%`;
const fmtMs = (value) => `${Number(value).toFixed(2)}ms`;

function byId(id) {
  return document.getElementById(id);
}

async function loadJson(name) {
  const response = await fetch(`${dataRoot}/${name}`);
  if (!response.ok) throw new Error(`无法读取 ${name}`);
  return response.json();
}

async function loadCsvSample(limit = 120) {
  const response = await fetch(`${dataRoot}/results.csv`);
  if (!response.ok) throw new Error("无法读取 results.csv");
  const text = await response.text();
  const lines = text.trim().split(/\r?\n/).slice(0, limit + 1);
  const headers = lines.shift().split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function renderFlow() {
  byId("flow-list").innerHTML = steps
    .map(([index, title, body]) => `
      <article class="flow-step">
        <small>STEP ${index}</small>
        <strong>${title}</strong>
        <span>${body}</span>
      </article>
    `)
    .join("");
}

function renderSummary(summary, metrics, config, behavior) {
  byId("asset-total").textContent = fmtInt.format(summary.assets.total);
  byId("event-total").textContent = fmtInt.format(summary.behavior.total_events);
  byId("f1-score").textContent = fmtPct(summary.detection.f1);
  byId("p95-latency").textContent = fmtMs(summary.performance.p95_pipeline_ms);
  byId("seed").textContent = config.seed;
  byId("run-id").textContent = "run_20260826_153334";

  const scores = [
    ["Accuracy", metrics.detection.accuracy],
    ["Precision", summary.detection.precision],
    ["Recall", summary.detection.recall],
    ["F1", summary.detection.f1],
    ["AUC", metrics.detection.auc],
    ["Unseen Detection", summary.seen_unseen.unseen_detection_rate]
  ];

  byId("score-stack").innerHTML = scores.map(([label, value]) => `
    <article class="score-row">
      <div><strong>${label}</strong><span>${fmtPct(value)}</span></div>
      <p class="score-track"><span style="width:${Math.max(0, Math.min(100, value * 100))}%"></span></p>
    </article>
  `).join("");

  const scenarios = Object.entries(metrics.scenario_metrics)
    .filter(([, item]) => typeof item.detection_rate === "number")
    .map(([name, item]) => [name, item.detection_rate, item.events]);

  byId("scenario-bars").innerHTML = scenarios.map(([name, value, events]) => `
    <article class="bar-row">
      <div><strong>${name}</strong><small>${fmtInt.format(events)} events · ${fmtPct(value)}</small></div>
      <p class="bar-track"><span style="width:${Math.max(0, Math.min(100, value * 100))}%"></span></p>
    </article>
  `).join("");

  const policyTotal = Object.values(summary.policy).reduce((sum, value) => sum + value, 0);
  byId("policy-grid").innerHTML = Object.entries(summary.policy).map(([level, count]) => `
    <article class="${level.toLowerCase()}">
      <span>${level} / ${(count / policyTotal * 100).toFixed(1)}%</span>
      <strong>${fmtInt.format(count)}</strong>
    </article>
  `).join("");

  byId("defense-list").innerHTML = [
    ["攻击遏制率", fmtPct(summary.defense.attack_containment_rate)],
    ["正常误阻断率", fmtPct(summary.defense.false_blocking_rate)],
    ["事件池 APPEND", fmtInt.format(summary.feedback.event_pool_appended)],
    ["复用资产 ID", fmtInt.format(behavior.reused_asset_ids)]
  ].map(([label, value]) => `
    <article class="score-row">
      <div><strong>${label}</strong><span>${value}</span></div>
    </article>
  `).join("");

  byId("integrity-grid").innerHTML = [
    ["Local Backup", `${fmtInt.format(summary.backup.local_verified)} / ${fmtInt.format(summary.backup.local_expected)}`],
    ["Cold Backup", `${fmtInt.format(summary.backup.cold_verified)} / ${fmtInt.format(summary.backup.cold_expected)}`],
    ["Integrity NORMAL", fmtInt.format(summary.integrity.NORMAL)],
    ["High Confidence Anomaly", fmtInt.format(summary.integrity.HIGH_CONFIDENCE_ANOMALY)],
    ["Recovery Requested", fmtInt.format(summary.recovery.requested)],
    ["Recovery Success", fmtPct(summary.recovery.success_rate)],
    ["Cold Restore", fmtInt.format(summary.recovery.cold_restore_count)],
    ["Mean Recovery", fmtMs(summary.recovery.mean_recovery_ms)]
  ].map(([label, value]) => `
    <article>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");
}

function fillFilters(rows) {
  const scenarioFilter = byId("scenario-filter");
  const policyFilter = byId("policy-filter");
  [...new Set(rows.map((row) => row.scenario))].sort().forEach((name) => {
    scenarioFilter.add(new Option(name, name));
  });
  [...new Set(rows.map((row) => row.P))].sort().forEach((name) => {
    policyFilter.add(new Option(name, name));
  });
}

function renderEvents(rows) {
  const scenario = byId("scenario-filter").value;
  const policy = byId("policy-filter").value;
  const filtered = rows
    .filter((row) => scenario === "ALL" || row.scenario === scenario)
    .filter((row) => policy === "ALL" || row.P === policy)
    .slice(0, 40);

  byId("event-table").innerHTML = filtered.map((row) => `
    <tr>
      <td>${row.event_id.slice(0, 12)}...</td>
      <td>${row.scenario}</td>
      <td><span class="pill">${row.D}</span></td>
      <td>${Number(row.R).toFixed(2)}</td>
      <td>${row.A}</td>
      <td><span class="pill">${row.P}</span></td>
      <td>${row.integrity_state}</td>
      <td>${row.event_pool_decision}</td>
    </tr>
  `).join("");
}

async function boot() {
  renderFlow();
  const [summary, metrics, config, behavior, rows] = await Promise.all([
    loadJson("summary.json"),
    loadJson("metrics.json"),
    loadJson("run_config.json"),
    loadJson("behavior_manifest.json"),
    loadCsvSample()
  ]);

  renderSummary(summary, metrics, config, behavior);
  fillFilters(rows);
  renderEvents(rows);
  byId("scenario-filter").addEventListener("change", () => renderEvents(rows));
  byId("policy-filter").addEventListener("change", () => renderEvents(rows));
}

boot().catch((error) => {
  document.body.innerHTML = `<main class="section"><h1>数据加载失败</h1><p>${error.message}</p></main>`;
});
