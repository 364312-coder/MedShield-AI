const dataRoot = "./public/data";

const steps = [
  { index: "01", title: "医疗资产登记", body: "建立资产身份与基础元数据，为后续保护提供统一对象。", group: "base" },
  { index: "02", title: "D1 / D2 / D3 分级", body: "按数据敏感级别分类；Trap 作为独立诱捕上下文，不混入 AI 特征。", group: "base" },
  { index: "03", title: "加密与双备份", body: "AES-GCM 基础保护，同时建立 Local 与 Cold 可验证备份。", group: "base" },
  { index: "04", title: "行为事件进入", body: "接收正常访问、账号滥用、外泄和多源攻击等行为场景。", group: "ai" },
  { index: "05", title: "构建 U/F/N/C 特征", body: "形成 50 维行为特征，描述用户、文件、网络与上下文行为。", group: "ai" },
  { index: "06", title: "UFN-SAR 表征", body: "建立正常画像并提取语义残差，形成轻量风险表示。", group: "ai" },
  { index: "07", title: "LightGBM 风险检测", body: "输出风险分数 R 与异常类型 A，为策略层提供证据。", group: "ai" },
  { index: "08", title: "Policy 策略决策", body: "结合数据等级、风险、异常和上下文，生成 P0–P3 动作计划。", group: "policy" },
  { index: "09", title: "主动防御执行", body: "按策略执行权限、密钥、网络与水印相关防御动作。", group: "policy" },
  { index: "10", title: "联合完整性判断", body: "综合适用的加密认证、水印/身份等证据判断可信状态。", group: "verify" },
  { index: "11", title: "可信数据恢复", body: "在需要时从已验证的备份路径恢复，并再次确认恢复后状态。", group: "verify" },
  { index: "12", title: "处置效果评估", body: "记录检测、遏制、误阻断、恢复和流水线性能结果。", group: "verify" },
  { index: "13", title: "安全事件池", body: "确认事件后选择性 APPEND，常规正常事件可跳过。", group: "verify" },
  { index: "14", title: "运行时反馈", body: "形成反馈与弱点报告；正式运行中不进行在线训练。", group: "verify" }
];

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
  SLOW_DATA_EXFILTRATION: "慢速数据外泄"
};

const integrityNames = {
  NORMAL: "正常",
  SUSPICIOUS: "可疑",
  HIGH_CONFIDENCE_ANOMALY: "高可信完整性异常",
  UNKNOWN: "未知"
};

const poolNames = {
  APPEND: "入池",
  SKIP: "跳过",
  PENDING: "待定"
};

const fmtInt = new Intl.NumberFormat("zh-CN");
const fmtPct = (value, digits = 2) => `${(Number(value) * 100).toFixed(digits)}%`;
const fmtMs = (value) => `${Number(value).toFixed(2)} ms`;

function byId(id) {
  return document.getElementById(id);
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

async function loadCsvSample(limit = 240) {
  const response = await fetch(`${dataRoot}/results.csv`);
  if (!response.ok) throw new Error("无法读取 results.csv");

  const text = await response.text();
  const parsed = parseCsv(text);
  const headers = parsed.shift() ?? [];

  return parsed.slice(0, limit).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

function renderFlow() {
  byId("flow-list").innerHTML = steps
    .map(
      ({ index, title, body, group }) => `
        <article class="flow-step reveal" data-group="${group}">
          <small>STEP ${index}</small>
          <strong>${title}</strong>
          <span>${body}</span>
        </article>
      `
    )
    .join("");
}

function renderAssets(summary) {
  const items = [
    ["D1 级资产", summary.assets.D1, "基础敏感级别"],
    ["D2 级资产", summary.assets.D2, "中等级别资产"],
    ["D3 级资产", summary.assets.D3, "高敏感医疗数据"],
    ["Trap 诱捕资产", summary.assets.trap, "独立策略上下文"],
    ["正常行为事件", summary.behavior.normal_events, "正式事件总量的一部分"],
    ["攻击行为事件", summary.behavior.attack_events, "含已见与未见攻击"]
  ];

  byId("asset-grid").innerHTML = items
    .map(
      ([label, value, note]) => `
        <article class="asset-card">
          <span>${label}</span>
          <strong>${fmtInt.format(value)}</strong>
          <small>${note}</small>
        </article>
      `
    )
    .join("");
}

function renderDemos(summary, metrics) {
  const imageLeakage = metrics.scenario_metrics.IMAGE_LEAKAGE;
  const integrityRate = summary.integrity.anomaly_detection_rate;

  const cards = [
    {
      number: "场景 01",
      title: "医学影像泄露",
      subtitle: "从异常访问行为识别到策略处置，并结合派生副本水印能力保留追踪证据。",
      metricLabel: "影像泄露异常检出率",
      metricValue: fmtPct(imageLeakage.detection_rate),
      chain: ["影像资产受基础保护", "异常访问 / 泄露行为进入检测", "LightGBM 输出风险 R 与异常 A", "Policy 生成策略并执行防御", "事件确认并进入安全事件池"],
      evidence: `<strong>正式证据：</strong>${fmtInt.format(imageLeakage.events)} 条 IMAGE_LEAKAGE 事件；影像水印正式运行时范围为 PNG/数组派生副本。`,
      warning: false
    },
    {
      number: "场景 02",
      title: "医学影像篡改",
      subtitle: "重点展示完整性验证、异常确认与可信恢复，而不是把篡改简单等同于 AI 分类问题。",
      metricLabel: "完整性异常检出率",
      metricValue: fmtPct(integrityRate),
      chain: ["完整性证据持续保留", "发现高可信完整性异常", "策略层进入高风险处置", "从 Cold 可信备份恢复", "恢复后再次验证为正常"],
      evidence: `<strong>正式证据：</strong>检测到 ${fmtInt.format(summary.integrity.HIGH_CONFIDENCE_ANOMALY)} 条高可信完整性异常，恢复成功率 ${fmtPct(summary.recovery.success_rate)}。正式 run 未将这 2 条异常单独标注为“影像篡改”。`,
      warning: true
    },
    {
      number: "场景 03",
      title: "电子病历篡改",
      subtitle: "以 AES-GCM 认证失败等完整性证据触发异常判断和恢复；不夸大当前 EMR 水印能力。",
      metricLabel: "完整性恢复成功率",
      metricValue: fmtPct(summary.recovery.success_rate),
      chain: ["EMR 常驻加密与备份", "认证 / 完整性证据异常", "联合完整性判断升级", "Cold 备份执行恢复", "恢复后状态重新确认"],
      evidence: `<strong>正式边界：</strong>当前 EMR 内嵌水印运行时未提供；正式 run 的完整性异常未按影像/EMR 单独拆分，因此此卡展示的是完整性与恢复链路证据。`,
      warning: true
    }
  ];

  byId("demo-grid").innerHTML = cards
    .map(
      (item) => `
        <article class="demo-card reveal">
          <div class="demo-top">
            <span class="demo-number">${item.number}</span>
            <h3>${item.title}</h3>
            <p>${item.subtitle}</p>
          </div>
          <div class="demo-body">
            <div class="demo-metric">
              <span>${item.metricLabel}</span>
              <strong>${item.metricValue}</strong>
            </div>
            <div class="demo-chain">
              ${item.chain.map((step) => `<span>${step}</span>`).join("")}
            </div>
            <div class="demo-evidence ${item.warning ? "warning" : ""}">
              ${item.evidence}
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function renderSummary(summary, metrics, config, behavior) {
  byId("asset-total").textContent = fmtInt.format(summary.assets.total);
  byId("event-total").textContent = fmtInt.format(summary.behavior.total_events);
  byId("f1-score").textContent = fmtPct(summary.detection.f1);
  byId("containment-rate").textContent = fmtPct(summary.defense.attack_containment_rate);
  byId("cold-verify-rate").textContent = fmtPct(summary.backup.cold_verify_rate);
  byId("p95-latency").textContent = fmtMs(summary.performance.p95_pipeline_ms);
  byId("seed").textContent = config.seed;
  byId("schema-version").textContent = summary.schema_version;
  byId("run-id").textContent = "run_20260826_153334";

  renderAssets(summary);
  renderDemos(summary, metrics);

  const scores = [
    ["准确率 Accuracy", metrics.detection.accuracy],
    ["精确率 Precision", summary.detection.precision],
    ["召回率 Recall", summary.detection.recall],
    ["F1 分数", summary.detection.f1],
    ["AUC", metrics.detection.auc],
    ["未见攻击检出率", summary.seen_unseen.unseen_detection_rate]
  ];

  byId("score-stack").innerHTML = scores
    .map(
      ([label, value]) => `
        <article class="score-row">
          <div><strong>${label}</strong><span>${fmtPct(value)}</span></div>
          <p class="score-track"><span style="width:${Math.max(0, Math.min(100, value * 100))}%"></span></p>
        </article>
      `
    )
    .join("");

  const scenarios = Object.entries(metrics.scenario_metrics)
    .filter(([, item]) => typeof item.detection_rate === "number")
    .map(([name, item]) => [name, item.detection_rate, item.events]);

  byId("scenario-bars").innerHTML = scenarios
    .map(
      ([name, value, events]) => `
        <article class="bar-row">
          <div>
            <strong>${scenarioNames[name] ?? name}</strong>
            <small>${fmtInt.format(events)} 条 · ${fmtPct(value)}</small>
          </div>
          <p class="bar-track"><span style="width:${Math.max(0, Math.min(100, value * 100))}%"></span></p>
        </article>
      `
    )
    .join("");

  const policyTotal = Object.values(summary.policy).reduce((sum, value) => sum + value, 0);
  byId("policy-grid").innerHTML = Object.entries(summary.policy)
    .map(
      ([level, count]) => `
        <article class="${level.toLowerCase()}">
          <span>策略等级 ${level}</span>
          <strong>${fmtInt.format(count)}</strong>
          <small>占全部事件 ${(count / policyTotal * 100).toFixed(1)}%</small>
        </article>
      `
    )
    .join("");

  const defenseItems = [
    ["攻击遏制率", fmtPct(summary.defense.attack_containment_rate)],
    ["正常业务误阻断率", fmtPct(summary.defense.false_blocking_rate)],
    ["安全事件池入池", fmtInt.format(summary.feedback.event_pool_appended)],
    ["安全事件池跳过", fmtInt.format(summary.feedback.event_pool_skipped)],
    ["复用资产 ID", fmtInt.format(behavior.reused_asset_ids)],
    ["未见攻击事件", fmtInt.format(summary.behavior.unseen_events)]
  ];

  byId("defense-list").innerHTML = defenseItems
    .map(
      ([label, value]) => `
        <article class="score-row">
          <div><strong>${label}</strong><span>${value}</span></div>
        </article>
      `
    )
    .join("");

  const integrityItems = [
    ["Local 备份验证", `${fmtInt.format(summary.backup.local_verified)} / ${fmtInt.format(summary.backup.local_expected)}`],
    ["Cold 备份验证", `${fmtInt.format(summary.backup.cold_verified)} / ${fmtInt.format(summary.backup.cold_expected)}`],
    ["完整性正常", fmtInt.format(summary.integrity.NORMAL)],
    ["高可信完整性异常", fmtInt.format(summary.integrity.HIGH_CONFIDENCE_ANOMALY)],
    ["恢复请求", fmtInt.format(summary.recovery.requested)],
    ["恢复成功率", fmtPct(summary.recovery.success_rate)],
    ["Cold 恢复次数", fmtInt.format(summary.recovery.cold_restore_count)],
    ["平均恢复耗时", fmtMs(summary.recovery.mean_recovery_ms)]
  ];

  byId("integrity-grid").innerHTML = integrityItems
    .map(
      ([label, value]) => `
        <article>
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function fillFilters(rows) {
  const scenarioFilter = byId("scenario-filter");
  const policyFilter = byId("policy-filter");

  [...new Set(rows.map((row) => row.scenario).filter(Boolean))]
    .sort()
    .forEach((name) => scenarioFilter.add(new Option(scenarioNames[name] ?? name, name)));

  [...new Set(rows.map((row) => row.P).filter(Boolean))]
    .sort()
    .forEach((name) => policyFilter.add(new Option(`策略 ${name}`, name)));
}

function renderEvents(rows) {
  const scenario = byId("scenario-filter").value;
  const policy = byId("policy-filter").value;
  const filtered = rows
    .filter((row) => scenario === "ALL" || row.scenario === scenario)
    .filter((row) => policy === "ALL" || row.P === policy)
    .slice(0, 50);

  byId("visible-event-count").textContent = fmtInt.format(filtered.length);

  byId("event-table").innerHTML = filtered
    .map((row) => {
      const integrity = integrityNames[row.integrity_state] ?? row.integrity_state;
      const integrityClass = row.integrity_state === "NORMAL" ? "normal" : "alert";
      return `
        <tr>
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
    })
    .join("");
}

function activateNavigation() {
  const links = [...document.querySelectorAll(".nav a")];
  const targets = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    { rootMargin: "-18% 0px -70% 0px", threshold: [0.1, 0.3, 0.6] }
  );

  targets.forEach((target) => observer.observe(target));
}

function activateReveal() {
  const nodes = [...document.querySelectorAll(".reveal")];
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  nodes.forEach((node) => observer.observe(node));
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

  activateNavigation();
  activateReveal();
}

boot().catch((error) => {
  document.body.innerHTML = `
    <main class="section">
      <h1>数据加载失败</h1>
      <p>${safeText(error.message)}</p>
      <p>请确认 public/data 目录下存在 summary.json、metrics.json、run_config.json、behavior_manifest.json 和 results.csv。</p>
    </main>
  `;
});
