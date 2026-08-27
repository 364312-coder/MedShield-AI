
(function(){
"use strict";

function ready(fn){
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",fn,{once:true});
  else fn();
}

function esc(v){
  return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

function currentIncident(){
  try{
    return getIncidents().find(x => x.id === state.selectedIncidentId) || getIncidents()[0];
  }catch(_){ return null; }
}

function stageStatus(n){
  const s = Number(state?.stage || 0);
  if(s >= n) return "DONE";
  if(s + 1 === n) return "ACTIVE";
  return "WAIT";
}

function formalScenarioText(item){
  try{
    const metrics = state?.metrics?.scenario_metrics?.[item?.anomaly];
    if(!metrics) return "系统演示事件，不映射为正式场景指标";
    const rate = metrics.detection_rate;
    if(rate === null || rate === undefined) return "正式 FULL run 已包含该场景";
    return `正式场景检出率 ${(Number(rate)*100).toFixed(2)}%`;
  }catch(_){
    return "正式运行上下文已加载";
  }
}

function richHTML(item){
  if(!item) return "";

  const trap = item.trap ? "TRUE" : "FALSE";
  const isImage = /影像|image/i.test(item.assetType || "") || /IMAGE/.test(item.anomaly || "");
  const isEmr = /病历|EMR/i.test(item.assetType || "") || /EMR/.test(item.anomaly || "");

  const assetProtection = isImage
    ? [["原始对象","源医学影像不修改"],["派生副本","PNG / Array 水印"],["完整性","水印 + Hash 证据"],["备份","Local + Cold Verified"]]
    : isEmr
    ? [["静态保护","AES-256-GCM"],["完整性","EMR 独立证据链"],["审计","HMAC / Append-only"],["备份","Local + Cold Verified"]]
    : [["访问控制","分级权限"],["静态保护","AES-256-GCM"],["审计","不可变事件链"],["备份","Local + Cold Verified"]];

  const impact = item.policy === "P3"
    ? [["账号","冻结高风险会话"],["访问","限制 D3 资源"],["网络","阻断异常外联"],["业务","保留必要连续性"]]
    : item.policy === "P2"
    ? [["账号","强化验证"],["访问","权限收紧"],["网络","限流 / 监控"],["业务","持续运行"]]
    : [["账号","正常"],["访问","常规权限"],["网络","持续监测"],["业务","无干扰"]];

  return `
    <section class="v163-intel-grid">
      <article class="v163-block v163-risk-block">
        <header><span>RISK INTELLIGENCE</span><b>实时风险解释</b></header>
        <div class="v163-driver-grid">
          <div><small>行为异常</small><strong>${item.risk >= .85 ? "HIGH" : item.risk > .6 ? "MEDIUM" : "LOW"}</strong></div>
          <div><small>数据等级</small><strong>${esc(item.dataLevel)}</strong></div>
          <div><small>异常类型</small><strong>${esc(item.anomaly)}</strong></div>
          <div><small>综合风险</small><strong>R=${esc(Number(item.risk).toFixed(2))}</strong></div>
        </div>
        <div class="v163-policy-chain">
          <span>D=${esc(item.dataLevel)}</span><i>+</i><span>R=${esc(Number(item.risk).toFixed(2))}</span><i>+</i>
          <span>A=${esc(item.anomaly)}</span><i>+</i><span>C</span><i>+</i><span class="${item.trap ? "hot" : ""}">Trap=${trap}</span>
          <em>→</em><strong>${esc(item.policy)}</strong>
        </div>
        <p>${item.trap ? "Trap=true 作为独立 Policy 上下文，不进入 AI 特征。" : "当前事件按正常上下文进入策略编译，Trap=false。"}</p>
      </article>

      <article class="v163-block">
        <header><span>ASSET SECURITY PROFILE</span><b>资产保护画像</b></header>
        <div class="v163-kv-list">
          ${assetProtection.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}
        </div>
      </article>

      <article class="v163-block">
        <header><span>IMPACT SCOPE</span><b>影响范围</b></header>
        <div class="v163-kv-list">
          ${impact.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}
        </div>
      </article>
    </section>

    <section class="v163-decision">
      <div class="v163-decision-head">
        <div><span>POLICY RATIONALE</span><h4>策略决策依据</h4></div>
        <strong>${esc(item.policy)}</strong>
      </div>
      <div class="v163-decision-flow">
        <div><small>01</small><b>识别异常</b><span>${esc(item.anomaly)}</span></div><i>→</i>
        <div><small>02</small><b>计算风险</b><span>R = ${esc(Number(item.risk).toFixed(2))}</span></div><i>→</i>
        <div><small>03</small><b>读取上下文</b><span>${item.trap ? "Trap 命中" : "业务上下文"}</span></div><i>→</i>
        <div><small>04</small><b>编译策略</b><span>${esc(item.policy)}</span></div><i>→</i>
        <div><small>05</small><b>实施约束</b><span>${esc(item.result)}</span></div>
      </div>
    </section>

    <section class="v163-timeline">
      <header><div><span>INCIDENT LIFECYCLE</span><h4>处置生命周期</h4></div><b>STATEFUL / D1 PERSISTED</b></header>
      <div class="v163-life">
        ${[[1,"DETECT","事件载入"],[2,"ANALYZE","风险分析"],[3,"DEFEND","执行策略"],[4,"VERIFY","完整性验证"],[5,"RECOVER","可信恢复"],[6,"AUDIT","生成审计"]]
          .map(([n,en,cn])=>`<div class="${stageStatus(n).toLowerCase()}"><span>${String(n).padStart(2,"0")}</span><b>${en}</b><small>${cn}</small><em>${stageStatus(n)}</em></div>`).join("")}
      </div>
    </section>

    <section class="v163-formal-context">
      <div><span>FORMAL RUN CONTEXT</span><h4>正式运行证据关联</h4></div>
      <div class="v163-formal-stats">
        <div><small>FULL RUN</small><b>50,000 events</b></div>
        <div><small>ASSETS</small><b>18,760</b></div>
        <div><small>TRAP</small><b>300</b></div>
        <div><small>F1</small><b>97.36%</b></div>
        <div><small>CONTAINMENT</small><b>96.10%</b></div>
      </div>
      <p>${esc(formalScenarioText(item))}。单个工单风险分数用于处置实例展示，不作为正式场景总体统计均值。</p>
    </section>
  `;
}

function enhance(){
  const panel = document.querySelector(".case-panel");
  if(!panel) return;

  let host = panel.querySelector(".v163-rich-host");
  if(!host){
    host = document.createElement("div");
    host.className = "v163-rich-host";
    panel.appendChild(host);
  }
  host.innerHTML = richHTML(currentIncident());
}

ready(function(){
  try{
    if(typeof renderConsole === "function" && !renderConsole.__v163){
      const original = renderConsole;
      renderConsole = function(){
        const result = original.apply(this,arguments);
        queueMicrotask(enhance);
        return result;
      };
      renderConsole.__v163 = true;
    }
  }catch(_){}

  enhance();
});
})();
