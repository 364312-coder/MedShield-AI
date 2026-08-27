(function () {
  "use strict";

  const originalGetIncidents = getIncidents;
  const originalRenderQueue = renderQueue;

  let v159Filter = "ALL";

  function formalRate(name) {
    const value = state.metrics?.scenario_metrics?.[name]?.detection_rate;
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "正式场景已纳入 FULL run";
    }
    return `正式场景检出率：${(Number(value) * 100).toFixed(2)}%`;
  }

  function evidenceTemplate({
    behavior,
    data,
    model,
    defense,
    integrity = ["未发现高可信完整性异常", "维持常规完整性检查"],
    recovery = ["无需执行 Cold 恢复", "保持业务连续性"],
    audit
  }) {
    return { behavior, data, model, defense, integrity, recovery, audit };
  }

  const extraIncidents = () => [
    {
      id: "emr-leak",
      source: "FORMAL",
      sourceLabel: "正式场景",
      riskTag: "高风险",
      title: "电子病历异常外传",
      assetType: "电子病历",
      dataLevel: "D3",
      status: "待分析",
      risk: 0.89,
      anomaly: "EMR_LEAKAGE",
      policy: "P3",
      result: "已遏制 / 已入池",
      assetVisual: "emr",
      overview: "正式 EMR_LEAKAGE 场景的处置实例。风险分数用于当前工单演示，不代表该场景总体均值。",
      evidence: evidenceTemplate({
        behavior: ["病历读取量异常升高", "导出行为偏离正常画像", "外联流量同步增加"],
        data: ["数据等级：D3", "资产类型：电子病历", "Trap：否"],
        model: ["A = EMR_LEAKAGE", "处置实例风险：R = 0.89", "建议 P3 高风险处置"],
        defense: ["冻结高风险会话", "阻断异常导出", "限制 D3 EMR 访问", "写入安全事件候选池"],
        audit: ["事件类型：电子病历异常外传", formalRate("EMR_LEAKAGE"), "来源：正式 FULL run 场景 + 处置实例"]
      })
    },
    {
      id: "data-exfil",
      source: "FORMAL",
      sourceLabel: "正式场景",
      riskTag: "高风险",
      title: "敏感数据外传",
      assetType: "医疗数据",
      dataLevel: "D3",
      status: "待分析",
      risk: 0.88,
      anomaly: "DATA_EXFILTRATION",
      policy: "P3",
      result: "传输已阻断",
      assetVisual: "emr",
      overview: "正式 DATA_EXFILTRATION 场景的处置实例，用于展示从检测到阻断的闭环。",
      evidence: evidenceTemplate({
        behavior: ["持续读取高敏感资产", "外传字节量异常", "目的端行为异常"],
        data: ["数据等级：D3", "对象：跨类型医疗数据", "Trap：否"],
        model: ["A = DATA_EXFILTRATION", "处置实例风险：R = 0.88", "建议 P3"],
        defense: ["阻断异常传输", "冻结相关会话", "限制敏感资源访问"],
        audit: ["事件类型：敏感数据外传", formalRate("DATA_EXFILTRATION"), "来源：正式 FULL run 场景 + 处置实例"]
      })
    },
    {
      id: "multi-source",
      source: "FORMAL",
      sourceLabel: "正式场景",
      riskTag: "高风险",
      title: "多源联合攻击",
      assetType: "多源资产",
      dataLevel: "D3",
      status: "待分析",
      risk: 0.93,
      anomaly: "MULTI_SOURCE_ATTACK",
      policy: "P3",
      result: "联合攻击已遏制",
      assetVisual: "image",
      overview: "正式 MULTI_SOURCE_ATTACK 场景处置实例，同时涉及账号、网络与医疗资产访问异常。",
      evidence: evidenceTemplate({
        behavior: ["账号行为异常", "文件访问异常", "网络行为异常同时出现"],
        data: ["数据等级：D3", "涉及 EMR / IMAGE", "多源信号联合"],
        model: ["A = MULTI_SOURCE_ATTACK", "处置实例风险：R = 0.93", "建议 P3"],
        defense: ["冻结高风险会话", "跨资产限制访问", "阻断异常网络通道"],
        audit: ["事件类型：多源联合攻击", formalRate("MULTI_SOURCE_ATTACK"), "来源：正式 FULL run 场景 + 处置实例"]
      })
    },
    {
      id: "slow-exfil",
      source: "FORMAL",
      sourceLabel: "未见攻击",
      riskTag: "高风险",
      title: "慢速数据外传",
      assetType: "医疗数据",
      dataLevel: "D3",
      status: "待分析",
      risk: 0.86,
      anomaly: "SLOW_DATA_EXFILTRATION",
      policy: "P3",
      result: "慢速外传已识别",
      assetVisual: "emr",
      overview: "正式 unseen 场景 SLOW_DATA_EXFILTRATION 的处置实例，用于体现对未见攻击的识别能力。",
      evidence: evidenceTemplate({
        behavior: ["单次传输量不高", "长时间累计外传", "访问与网络信号组合异常"],
        data: ["数据等级：D3", "场景：Unseen Attack", "Trap：否"],
        model: ["A = SLOW_DATA_EXFILTRATION", "处置实例风险：R = 0.86", "未见攻击检测"],
        defense: ["停止可疑慢速传输", "收紧会话权限", "提升持续监测等级"],
        audit: ["事件类型：慢速数据外传", formalRate("SLOW_DATA_EXFILTRATION"), "正式 run 未见攻击检测率：100%"]
      })
    },
    {
      id: "normal-burst",
      source: "FORMAL",
      sourceLabel: "正常样本",
      riskTag: "低风险",
      title: "正常高频业务访问",
      assetType: "电子病历",
      dataLevel: "D2",
      status: "正常",
      risk: 0.19,
      anomaly: "NORMAL",
      policy: "P0",
      result: "保持基础防护",
      assetVisual: "emr",
      overview: "正常高频业务访问实例，用于展示系统不会把所有高频行为都判定为攻击。",
      evidence: evidenceTemplate({
        behavior: ["访问频率较高但符合工作流", "访问对象与角色权限一致", "网络行为无异常"],
        data: ["数据等级：D2", "场景：NORMAL", "Trap：否"],
        model: ["A = NORMAL", "处置实例风险：R = 0.19", "Policy = P0"],
        defense: ["维持常驻基础防护", "不冻结账号", "不影响业务连续性"],
        audit: ["事件类型：正常高频业务访问", "来源：正式 NORMAL 场景", "结论：不升级防御"]
      })
    },
    {
      id: "trap-image",
      source: "DEMO",
      sourceLabel: "Trap 演示",
      trap: true,
      riskTag: "高风险",
      title: "Trap 医学影像被访问",
      assetType: "Trap 医学影像",
      dataLevel: "D3",
      status: "待处置",
      risk: 0.92,
      anomaly: "TRAP_ACCESS",
      policy: "P3",
      result: "Trap 上下文触发 P3",
      assetVisual: "image",
      overview: "系统演示事件。Trap 是 Policy 的独立布尔上下文，不进入 AI 特征。",
      evidence: evidenceTemplate({
        behavior: ["访问诱捕影像资产", "会话上下文需要立即升级", "AI 特征不包含 Trap"],
        data: ["Trap：是", "资产类型：医学影像", "Trap 仅进入 Policy"],
        model: ["AI 风险与 Trap 独立", "FinalPolicy 使用 Trap=true", "策略升级至 P3"],
        defense: ["冻结可疑会话", "阻止继续访问敏感资产", "记录 Trap 命中"],
        audit: ["事件类型：Trap 医学影像访问", "来源：系统能力演示", "边界：不是正式实验场景指标"]
      })
    },
    {
      id: "trap-emr",
      source: "DEMO",
      sourceLabel: "Trap 演示",
      trap: true,
      riskTag: "高风险",
      title: "Trap 电子病历被访问",
      assetType: "Trap EMR",
      dataLevel: "D3",
      status: "待处置",
      risk: 0.90,
      anomaly: "TRAP_ACCESS",
      policy: "P3",
      result: "Trap 上下文触发 P3",
      assetVisual: "emr",
      overview: "系统演示事件。Trap EMR 用于辅助策略判断，不参与 AI 模型特征。",
      evidence: evidenceTemplate({
        behavior: ["会话访问诱捕 EMR", "访问行为与业务角色不一致", "Trap 不进入 AI 特征"],
        data: ["Trap：是", "资产类型：电子病历", "独立 Policy 上下文"],
        model: ["AI 输出保持独立", "Trap=true 参与策略编译", "策略升级至 P3"],
        defense: ["冻结会话", "限制 D3 数据访问", "记录诱捕命中"],
        audit: ["事件类型：Trap EMR 访问", "来源：系统能力演示", "边界：不是正式实验场景指标"]
      })
    },
    {
      id: "off-hours-emr",
      source: "DEMO",
      sourceLabel: "行为演示",
      riskTag: "中风险",
      title: "非工作时段批量访问 EMR",
      assetType: "电子病历",
      dataLevel: "D2",
      status: "待分析",
      risk: 0.72,
      anomaly: "ACCOUNT_ABUSE",
      policy: "P2",
      result: "访问范围已收紧",
      assetVisual: "emr",
      overview: "系统能力演示事件，用于展示时间上下文与批量访问组合异常的处置。",
      evidence: evidenceTemplate({
        behavior: ["非工作时段访问", "短时间批量读取 EMR", "访问范围扩大"],
        data: ["数据等级：D2", "资产类型：电子病历", "Trap：否"],
        model: ["演示异常类型：ACCOUNT_ABUSE", "处置实例风险：R = 0.72", "建议 P2"],
        defense: ["降低访问权限", "要求权限复核", "提高审计频率"],
        audit: ["事件类型：非工作时段批量访问", "来源：系统能力演示", "不作为正式场景指标"]
      })
    },
    {
      id: "privilege-probe",
      source: "DEMO",
      sourceLabel: "行为演示",
      riskTag: "中风险",
      title: "连续权限探测",
      assetType: "账号 / 权限",
      dataLevel: "D2",
      status: "待分析",
      risk: 0.74,
      anomaly: "PRIVILEGE_PROBE",
      policy: "P2",
      result: "权限探测已限制",
      assetVisual: "emr",
      overview: "系统能力演示事件，展示连续触达越权边界时的策略收紧。",
      evidence: evidenceTemplate({
        behavior: ["连续请求未授权资源", "权限边界触达次数异常", "访问模式重复"],
        data: ["数据等级：D2", "对象：账号 / 权限", "Trap：否"],
        model: ["演示异常：PRIVILEGE_PROBE", "处置实例风险：R = 0.74", "建议 P2"],
        defense: ["限制账号权限", "增加认证要求", "记录权限探测轨迹"],
        audit: ["事件类型：连续权限探测", "来源：系统能力演示", "不作为正式场景指标"]
      })
    },
    {
      id: "suspicious-export",
      source: "DEMO",
      sourceLabel: "导出演示",
      riskTag: "高风险",
      title: "可疑批量导出任务",
      assetType: "医疗数据",
      dataLevel: "D3",
      status: "待分析",
      risk: 0.84,
      anomaly: "SUSPICIOUS_EXPORT",
      policy: "P3",
      result: "导出任务已阻断",
      assetVisual: "emr",
      overview: "系统能力演示事件，展示高敏感数据批量导出时的主动防御。",
      evidence: evidenceTemplate({
        behavior: ["批量导出 D3 数据", "任务规模偏离正常业务", "导出目标异常"],
        data: ["数据等级：D3", "对象：医疗数据导出", "Trap：否"],
        model: ["演示异常：SUSPICIOUS_EXPORT", "处置实例风险：R = 0.84", "建议 P3"],
        defense: ["停止导出任务", "冻结会话", "保留审计证据"],
        audit: ["事件类型：可疑批量导出", "来源：系统能力演示", "不作为正式场景指标"]
      })
    },
    {
      id: "abnormal-api",
      source: "DEMO",
      sourceLabel: "接口演示",
      riskTag: "中风险",
      title: "异常接口调用",
      assetType: "API / 服务",
      dataLevel: "D2",
      status: "待分析",
      risk: 0.69,
      anomaly: "ABNORMAL_API",
      policy: "P2",
      result: "接口访问已限流",
      assetVisual: "emr",
      overview: "系统能力演示事件，用于展示异常接口访问频率与权限上下文的联合处置。",
      evidence: evidenceTemplate({
        behavior: ["API 调用速率异常", "请求路径偏离正常模式", "权限上下文可疑"],
        data: ["数据等级：D2", "对象：医疗服务 API", "Trap：否"],
        model: ["演示异常：ABNORMAL_API", "处置实例风险：R = 0.69", "建议 P2"],
        defense: ["接口限流", "收紧调用权限", "提高审计频率"],
        audit: ["事件类型：异常接口调用", "来源：系统能力演示", "不作为正式场景指标"]
      })
    },
    {
      id: "cold-restore",
      source: "DEMO",
      sourceLabel: "恢复演示",
      riskTag: "中风险",
      title: "Cold Backup 恢复请求",
      assetType: "备份 / 恢复",
      dataLevel: "D3",
      status: "待验证",
      risk: 0.63,
      anomaly: "RECOVERY_REQUEST",
      policy: "P2",
      result: "Cold 恢复成功",
      assetVisual: "emr",
      overview: "恢复能力演示事件。正式 run 中恢复请求为 2 次，Cold restore 成功率为 100%。",
      evidence: evidenceTemplate({
        behavior: ["完整性验证后进入恢复评估", "业务对象需要可信版本", "Cold Backup 可用"],
        data: ["数据等级：D3", "对象：可信备份", "Local / Cold 均已验证"],
        model: ["恢复请求不等同于攻击类型", "处置实例风险：R = 0.63", "Policy = P2"],
        defense: ["限制当前对象写入", "验证 Cold Backup", "执行可信恢复"],
        integrity: ["恢复前：待验证", "Cold Backup：Verified", "恢复后：正常"],
        recovery: ["正式 run 恢复请求：2", "正式 run Cold restore：2", "正式恢复成功率：100%"],
        audit: ["事件类型：Cold Backup 恢复请求", "来源：恢复能力演示 + 正式恢复统计", "结论：恢复成功"]
      })
    }
  ];

  getIncidents = function () {
    const base = originalGetIncidents().map((item) => {
      const map = {
        "img-leak": ["FORMAL", "正式场景"],
        "account-abuse": ["FORMAL", "正式场景"],
        "img-tamper": ["DEMO", "完整性演示"],
        "emr-tamper": ["DEMO", "完整性演示"]
      };
      const meta = map[item.id] || ["DEMO", "系统演示"];
      return {
        ...item,
        source: meta[0],
        sourceLabel: meta[1],
        trap: false
      };
    });
    return [...base, ...extraIncidents()];
  };

  function ensureFilterBar() {
    const queue = document.getElementById("incident-queue");
    if (!queue || document.getElementById("v159-filter-bar")) return;

    const bar = document.createElement("div");
    bar.id = "v159-filter-bar";
    bar.className = "v159-filter-bar";
    bar.innerHTML = `
      <button data-filter="ALL" class="active">全部</button>
      <button data-filter="HIGH">高风险</button>
      <button data-filter="FORMAL">正式场景</button>
      <button data-filter="DEMO">Demo</button>
      <button data-filter="TRAP">Trap</button>
      <button data-filter="DONE">已处置</button>
    `;
    queue.parentNode.insertBefore(bar, queue);

    bar.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        v159Filter = button.dataset.filter;
        bar.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === button));
        renderQueue();
      });
    });
  }

  function isCompleted(item) {
    return Number(state.backendIncidents?.[item.id]?.stage || 0) >= 5;
  }

  function matchesFilter(item) {
    if (v159Filter === "ALL") return true;
    if (v159Filter === "HIGH") return item.riskTag === "高风险";
    if (v159Filter === "FORMAL") return item.source === "FORMAL";
    if (v159Filter === "DEMO") return item.source === "DEMO";
    if (v159Filter === "TRAP") return Boolean(item.trap);
    if (v159Filter === "DONE") return isCompleted(item);
    return true;
  }

  renderQueue = function () {
    ensureFilterBar();

    const incidents = getIncidents();
    const visible = incidents.filter(matchesFilter);

    const completed = incidents.filter(isCompleted).length;
    byId("pending-count").textContent = String(incidents.length - completed);
    byId("high-risk-count").textContent = String(
      incidents.filter((i) => i.riskTag === "高风险").length
    );

    byId("incident-queue").innerHTML = visible.map((item) => {
      const persisted = state.backendIncidents[item.id];
      const status = persisted?.status || item.status;
      const sourceClass = item.source === "FORMAL" ? "formal" : "demo";
      const riskClass =
        item.riskTag === "中风险" ? "mid" :
        item.riskTag === "低风险" ? "low" : "";

      return `
        <button class="queue-card ${item.id === state.selectedIncidentId ? "active" : ""}"
                data-id="${safeText(item.id)}" type="button">
          <div class="v159-card-top">
            <span class="risk ${riskClass}">${safeText(item.riskTag)}</span>
            <span class="v159-source ${sourceClass}">${safeText(item.sourceLabel)}</span>
          </div>
          <strong>${safeText(item.title)}</strong>
          <small>${safeText(item.dataLevel)} · ${safeText(item.assetType)} · ${safeText(status)}</small>
        </button>
      `;
    }).join("");

    if (!visible.length) {
      byId("incident-queue").innerHTML =
        `<div class="v159-empty">当前筛选条件下没有事件</div>`;
    }

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
  };

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      ensureFilterBar();
      try { renderQueue(); } catch (_) {}
    }, 0);
  }, { once: true });
})();
