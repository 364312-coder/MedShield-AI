(function(){
  "use strict";

  const VERSION = "V2-FINAL-SINGLE-OWNER";

  const SCENARIOS = [
    "IMAGE_LEAKAGE",
    "EMR_LEAKAGE",
    "DATA_EXFILTRATION",
    "ACCOUNT_ABUSE",
    "MULTI_SOURCE_ATTACK",
    "SLOW_DATA_EXFILTRATION"
  ];

  const SCENARIO_CODE = {
    IMAGE_LEAKAGE:"IMAGE_LEAKAGE",
    EMR_LEAKAGE:"EMR_LEAKAGE",
    DATA_EXFILTRATION:"DATA_EXFILTRATION",
    ACCOUNT_ABUSE:"ACCOUNT_ABUSE",
    MULTI_SOURCE_ATTACK:"MULTI_SOURCE_ATTACK",
    SLOW_DATA_EXFILTRATION:"SLOW_DATA_EXFILTRATION"
  };

  const PHASE_LABEL = {
    READY:"等待启动",
    ATTACKING:"攻击已触发",
    ANALYZING:"AI 风险分析",
    DECISION_READY:"等待人工决策",
    DEFENDING:"主动防御中",
    DEFENSE_DONE:"防御结果已记录",
    VERIFYING:"完整性验证中",
    INTEGRITY_DONE:"完整性结果已记录",
    RECOVERING:"可信恢复中",
    RECOVERY_DONE:"恢复结果已记录",
    AUDITING:"审计归档中",
    COMPLETE:"处置闭环完成"
  };

  const LOG_TYPE_LABEL = {
    SYSTEM:"系统",
    EVENT:"事件",
    SENSOR:"感知",
    AI:"AI",
    POLICY:"策略",
    DEFENSE:"防御",
    VERIFY:"验证",
    INTEGRITY:"完整性",
    RECOVERY:"恢复",
    AUDIT:"审计",
    EVIDENCE:"证据"
  };

  const PROCESS = [
    ["01","攻击触发"],
    ["02","AI 风险分析"],
    ["03","策略决策"],
    ["04","主动防御"],
    ["05","完整性验证"],
    ["06","恢复与审计"]
  ];

  const sim = {
    mode:"single",
    selected:["IMAGE_LEAKAGE"],
    cases:[],
    activeId:null,
    logs:[],
    started:false,
    timelines:[]
  };

  function el(id){ return document.getElementById(id); }
  function text(v){ return String(v ?? ""); }
  function esc(v){ return text(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function truthy(v){ return ["true","1","yes"].includes(text(v).trim().toLowerCase()); }
  function n(v){ const x=Number(v); return Number.isFinite(x)?x:null; }
  function risk(v){ const x=n(v); return x===null?"--":x.toFixed(2); }
  function value(v,fallback="--"){ const s=text(v).trim(); return s?s:fallback; }
  function isNotNeeded(v){ return ["","NONE","NOT_NEEDED","NOT_APPLICABLE","SKIP"].includes(text(v).trim().toUpperCase()); }
  function scenarioLabel(name){ return (typeof scenarioNames!=="undefined" && scenarioNames[name]) || name; }
  function anomalyLabel(name){ return (typeof anomalyNames!=="undefined" && anomalyNames[name]) || name; }
  function poolLabel(name){ return (typeof poolNames!=="undefined" && poolNames[name]) || name; }
  function integrityLabel(name){ return (typeof integrityNames!=="undefined" && integrityNames[name]) || name; }

  function phaseOrder(phase){
    return ["READY","ATTACKING","ANALYZING","DECISION_READY","DEFENDING","DEFENSE_DONE","VERIFYING","INTEGRITY_DONE","RECOVERING","RECOVERY_DONE","AUDITING","COMPLETE"].indexOf(phase);
  }

  function processStep(c){
    if(!c) return -1;
    if(c.phase==="READY" || c.phase==="ATTACKING") return 0;
    if(c.phase==="ANALYZING") return 1;
    if(c.phase==="DECISION_READY") return 2;
    if(c.phase==="DEFENDING") return 3;
    if(c.phase==="DEFENSE_DONE" || c.phase==="VERIFYING") return 4;
    return 5;
  }

  function completedStepCount(c){
    if(!c) return 0;
    if(c.phase==="COMPLETE") return 6;
    const step=processStep(c);
    if(c.phase==="DEFENSE_DONE") return 4;
    if(c.phase==="INTEGRITY_DONE") return 5;
    if(c.phase==="RECOVERY_DONE") return 5;
    return Math.max(0,step);
  }

  function recoveryNeeded(c){
    return !!c && (!isNotNeeded(c.row.recovery_status) || !isNotNeeded(c.row.recovery_source));
  }

  function metricForScenario(name){
    try { return state.metrics?.scenario_metrics?.[name] || null; } catch(_){ return null; }
  }

  function rowsForScenario(name){
    try { return (state.rows || []).filter(row => row && row.scenario===name && row.event_id); }
    catch(_){ return []; }
  }

  function pickFormalRow(name){
    const rows=rowsForScenario(name);
    if(!rows.length) return null;
    const confirmed=rows.filter(row=>truthy(row.event_confirmed));
    const source=confirmed.length?confirmed:rows;
    const detected=source.find(row=>text(row.A).trim() && text(row.A).trim()!=="NORMAL" && text(row.P).trim());
    return detected || source[0] || null;
  }

  function makeCase(name,rowOverride=null){
    const row=rowOverride || pickFormalRow(name);
    if(!row) return null;
    const id=row.event_id || `SIM-${name}`;
    return {id,scenario:name,row,phase:"READY"};
  }

  function activeCase(){ return sim.cases.find(c=>c.id===sim.activeId) || sim.cases[0] || null; }

  function log(type,message,tone=""){
    const now=new Date();
    sim.logs.push({
      time:now.toLocaleTimeString("zh-CN",{hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"}),
      type:LOG_TYPE_LABEL[type] || type,
      rawType:type,
      message,
      tone
    });
    if(sim.logs.length>160) sim.logs=sim.logs.slice(-160);
    renderLog();
  }

  function clearLog(){ sim.logs=[]; renderLog(); }

  function logMarkup(item,index,dialog=false){
    const tag=dialog?"div":"button";
    const attrs=dialog?"":`type="button" data-open-stream="1" data-log-index="${index}"`;
    return `<${tag} class="sim-stream-line ${esc(item.tone)}" ${attrs}><time>${esc(item.time)}</time><b>${esc(item.type)}</b><span>${esc(item.message)}</span></${tag}>`;
  }

  function renderLog(){
    const host=el("simv2-stream-body");
    if(host){
      if(!sim.logs.length){
        host.innerHTML='<div class="sim-stream-empty">等待实验启动。事件触发后，攻击、AI 分析、策略、防御、验证、恢复与审计过程会按顺序记录在这里。</div>';
      }else{
        host.innerHTML=sim.logs.map((item,index)=>logMarkup(item,index,false)).join("");
        host.scrollTop=host.scrollHeight;
      }
    }
    renderDialog();
  }

  function selectionLimit(){ return sim.mode==="parallel"?4:1; }
  function selectionMinimum(){ return sim.mode==="parallel"?2:1; }

  function renderScenarioList(){
    const host=el("sim-scenario-list");
    if(!host) return;
    host.innerHTML=SCENARIOS.map((name,index)=>{
      const m=metricForScenario(name);
      const selected=sim.selected.includes(name);
      const rate=m && typeof m.detection_rate==="number" ? `${(m.detection_rate*100).toFixed(2)}%` : "--";
      const events=m && Number.isFinite(Number(m.events)) ? Number(m.events).toLocaleString("zh-CN") : "--";
      return `<button class="sim-scenario-row ${selected?"selected":""}" type="button" data-scenario="${esc(name)}" aria-pressed="${selected}">
        <span class="idx">${String(index+1).padStart(2,"0")}</span>
        <span class="scenario-copy"><strong class="scenario-name">${esc(scenarioLabel(name))}</strong><small class="scenario-code">${esc(SCENARIO_CODE[name])}</small></span>
        <span class="rate"><b>${esc(rate)}</b><span>正式检出率 · ${esc(events)} 条</span></span>
        <em class="select-mark">✓ 已选择</em>
      </button>`;
    }).join("");

    const hint=el("sim-selection-hint");
    if(hint) hint.textContent=sim.mode==="parallel"?"请选择 2–4 个场景":"请选择 1 个场景";
    const count=el("sim-selected-count");
    if(count) count.textContent=`${sim.selected.length} 个事件`;
    const start=el("sim-start");
    if(start) start.disabled=sim.selected.length<selectionMinimum() || sim.selected.length>selectionLimit();
  }

  function systemPhase(){
    if(!sim.started || !sim.cases.length) return {label:"系统就绪",tone:""};
    if(sim.cases.every(c=>c.phase==="COMPLETE")) return {label:"全部事件闭环完成",tone:""};
    if(sim.cases.some(c=>c.phase==="DECISION_READY")) return {label:"等待人工决策",tone:"warn"};
    if(sim.cases.some(c=>["ATTACKING","ANALYZING"].includes(c.phase))) return {label:"攻击与分析进行中",tone:"alert"};
    if(sim.cases.some(c=>["DEFENDING","VERIFYING","RECOVERING","AUDITING"].includes(c.phase))) return {label:"处置进行中",tone:"warn"};
    return {label:"等待下一步操作",tone:"warn"};
  }

  function caseStatus(c){
    if(!c) return "--";
    if(c.phase==="INTEGRITY_DONE") return integrityLabel(value(c.row.integrity_state,"完整性已记录"));
    if(c.phase==="RECOVERY_DONE") return value(c.row.recovery_status,"恢复已记录");
    return PHASE_LABEL[c.phase] || c.phase;
  }

  function renderQueue(){
    const host=el("sim-incident-queue");
    if(host){
      if(!sim.cases.length){
        host.innerHTML='<div class="sim-no-data">尚未启动事件回放。</div>';
      }else{
        host.innerHTML=sim.cases.map((c,index)=>{
          const active=c.id===sim.activeId;
          const failed=text(c.row.containment).toUpperCase()==="FAILED" && phaseOrder(c.phase)>=phaseOrder("DEFENSE_DONE");
          return `<button class="sim-case-row ${active?"active":""} ${failed?"failed":""} ${c.phase==="COMPLETE"?"complete":""}" type="button" data-case-id="${esc(c.id)}">
            <div class="row-top"><span>事件 ${String(index+1).padStart(2,"0")}</span><b>${esc(caseStatus(c))}</b></div>
            <strong>${esc(scenarioLabel(c.scenario))}</strong>
            <small>${esc(c.id)}</small>
          </button>`;
        }).join("");
      }
    }
    const pending=el("simv2-pending-count");
    if(pending) pending.textContent=String(sim.cases.filter(c=>c.phase!=="COMPLETE").length);
    const active=el("simv2-active-count");
    if(active) active.textContent=String(sim.cases.filter(c=>c.phase!=="COMPLETE").length);
  }

  function selectedFlowClasses(c){
    if(!c) return [];
    const s=c.scenario;
    const arr=["source","access","engine"];
    if(["EMR_LEAKAGE","ACCOUNT_ABUSE","MULTI_SOURCE_ATTACK"].includes(s)) arr.push("emr");
    if(["IMAGE_LEAKAGE","MULTI_SOURCE_ATTACK"].includes(s)) arr.push("image");
    if(["DATA_EXFILTRATION","SLOW_DATA_EXFILTRATION","IMAGE_LEAKAGE","EMR_LEAKAGE","MULTI_SOURCE_ATTACK"].includes(s)) arr.push("network");
    if(phaseOrder(c.phase)>=phaseOrder("VERIFYING")) arr.push("trust");
    return arr;
  }

  function phaseSituation(c){
    if(!c) return {
      title:"等待启动",
      detail:"选择攻击场景并启动回放后，这里会持续说明系统当前正在做什么。",
      next:"选择场景并启动实验"
    };
    const name=scenarioLabel(c.scenario);
    if(c.phase==="ATTACKING") return {title:`攻击触发：${name}`,detail:"正式事件已载入，当前仅对攻击场景与数据路径进行可视化，不生成新的测量数据。",next:"系统将进入 AI 风险分析"};
    if(c.phase==="ANALYZING") return {title:"AI 风险分析",detail:`UFN-SAR + LightGBM 正在读取 ${name} 对应正式事件的既有分析结果；前端不重新计算风险。`,next:"等待正式 R / A / P 解锁"};
    if(c.phase==="DECISION_READY") return {title:"策略决策已就绪",detail:`正式字段已读取：R=${risk(c.row.R)}，A=${anomalyLabel(value(c.row.A))}，P=${value(c.row.P)}。`,next:"点击“执行策略回放”"};
    if(c.phase==="DEFENDING") return {title:"主动防御执行中",detail:`正在可视化 ${value(c.row.P)} 策略执行过程。Permission / Network 动作为 SIMULATED。`,next:"等待正式遏制结果"};
    if(c.phase==="DEFENSE_DONE") return {title:"主动防御结果已记录",detail:`正式 containment=${value(c.row.containment)}。攻击处置完成后仍需验证医疗数据是否可信。`,next:"点击“验证完整性”"};
    if(c.phase==="VERIFYING") return {title:"完整性验证",detail:"正在读取正式事件中的完整性状态，验证攻击处置后数据是否仍然可信。",next:"等待正式完整性结果"};
    if(c.phase==="INTEGRITY_DONE") return {title:"完整性结果已记录",detail:`正式 integrity_state=${integrityLabel(value(c.row.integrity_state))}。`,next:recoveryNeeded(c)?"点击“启动可信恢复回放”":"点击“生成审计结论”"};
    if(c.phase==="RECOVERING") return {title:"可信恢复",detail:`正在可视化正式恢复记录，recovery_source=${value(c.row.recovery_source)}。`,next:"等待正式恢复结果"};
    if(c.phase==="RECOVERY_DONE") return {title:"恢复结果已记录",detail:`正式 recovery_status=${value(c.row.recovery_status)}，恢复路径已完成回放。`,next:"点击“生成审计结论”"};
    if(c.phase==="AUDITING") return {title:"审计与事件反馈",detail:"正在读取 event_pool_decision 与 total_pipeline_ms 等正式字段。",next:"等待审计归档"};
    if(c.phase==="COMPLETE") return {title:"处置闭环完成",detail:"攻击、决策、防御、完整性、恢复（如需要）和审计结果均已解锁。",next:"查看完整事件流或重新回放"};
    return {title:caseStatus(c),detail:"当前事件等待下一步操作。",next:"继续处置"};
  }

  function renderFocus(){
    const c=activeCase();
    const s=phaseSituation(c);
    if(el("sim-focus-title")) el("sim-focus-title").textContent=s.title;
    if(el("sim-focus-detail")) el("sim-focus-detail").textContent=s.detail;
    if(el("sim-focus-next")) el("sim-focus-next").textContent=s.next;
  }

  function renderProcess(){
    const c=activeCase();
    const step=processStep(c);
    const completed=completedStepCount(c);
    document.querySelectorAll("#sim-process-steps [data-process-step]").forEach(node=>{
      const idx=Number(node.dataset.processStep);
      node.classList.toggle("done",!!c && idx<completed);
      node.classList.toggle("current",!!c && c.phase!=="COMPLETE" && idx===step);
      if(c && c.phase==="COMPLETE") node.classList.add("done");
    });
    const caseLabel=el("sim-process-case");
    if(caseLabel) caseLabel.textContent=c?`${scenarioLabel(c.scenario)} · ${caseStatus(c)}`:"尚未启动事件";
    renderDialogProcess();
  }

  function renderFlow(){
    const c=activeCase();
    const workspace=el("sim-workspace");
    const canvas=el("sim-flow-canvas");
    if(!workspace || !canvas) return;

    workspace.dataset.phase=(c?.phase || "READY").toLowerCase();
    workspace.classList.remove("running","defending","verified");
    const liveCases=sim.cases.filter(x=>x.phase!=="COMPLETE");
    if(liveCases.some(x=>["ATTACKING","ANALYZING","DECISION_READY"].includes(x.phase))) workspace.classList.add("running");
    if(liveCases.some(x=>["DEFENDING","DEFENSE_DONE"].includes(x.phase))) workspace.classList.add("defending");
    if(liveCases.some(x=>phaseOrder(x.phase)>=phaseOrder("VERIFYING"))) workspace.classList.add("verified");

    canvas.querySelectorAll(".sim-flow-node").forEach(node=>node.classList.remove("active","threat","focus","success"));
    const combined=new Set();
    liveCases.forEach(item=>selectedFlowClasses(item).forEach(name=>combined.add(name)));
    combined.forEach(name=>canvas.querySelector(`.sim-flow-node.${name}`)?.classList.add("active"));

    if(c){
      const path=selectedFlowClasses(c);
      if(c.phase==="ATTACKING") path.filter(x=>["source","access","emr","image","network"].includes(x)).forEach(name=>canvas.querySelector(`.sim-flow-node.${name}`)?.classList.add("threat"));
      if(c.phase==="ANALYZING" || c.phase==="DECISION_READY") canvas.querySelector(".sim-flow-node.engine")?.classList.add("focus");
      if(c.phase==="DEFENDING" || c.phase==="DEFENSE_DONE") canvas.querySelector(".sim-flow-node.engine")?.classList.add("focus");
      if(["VERIFYING","INTEGRITY_DONE","RECOVERING","RECOVERY_DONE","AUDITING"].includes(c.phase)) canvas.querySelector(".sim-flow-node.trust")?.classList.add("focus");
      if(c.phase==="COMPLETE") canvas.querySelector(".sim-flow-node.trust")?.classList.add("success");
    }

    const lanes=el("sim-parallel-lanes");
    if(lanes){
      lanes.innerHTML=sim.cases.map(item=>{
        const tone=item.phase==="COMPLETE"?"done":item.id===sim.activeId?"current":(["DECISION_READY","DEFENDING"].includes(item.phase)?"alert":"");
        return `<span class="sim-parallel-lane ${tone}">${esc(scenarioLabel(item.scenario))} · ${esc(caseStatus(item))}</span>`;
      }).join("");
    }

    const caption=el("sim-flow-caption");
    if(caption){
      if(!c) caption.textContent="选择场景后启动正式事件回放";
      else if(c.phase==="ATTACKING") caption.textContent=`${scenarioLabel(c.scenario)} 已激活 · 当前为过程可视化`;
      else if(c.phase==="ANALYZING") caption.textContent=`正在读取 ${scenarioLabel(c.scenario)} 的正式分析结果`;
      else if(c.phase==="DECISION_READY") caption.textContent="正式 R / A / P 已解锁 · 等待操作员推进处置";
      else if(c.phase==="DEFENDING") caption.textContent="策略执行回放中 · Permission / Network = SIMULATED";
      else if(c.phase==="VERIFYING") caption.textContent="正在读取正式完整性证据";
      else if(c.phase==="RECOVERING") caption.textContent="正在可视化可信恢复记录";
      else if(c.phase==="COMPLETE") caption.textContent="事件闭环完成 · 正式结果与审计字段已解锁";
      else caption.textContent=`当前阶段：${caseStatus(c)}`;
    }
  }

  function decisionRows(c){
    if(!c) return [];
    const r=c.row;
    const analysisVisible=phaseOrder(c.phase)>=phaseOrder("DECISION_READY");
    const defenseVisible=phaseOrder(c.phase)>=phaseOrder("DEFENSE_DONE");
    const integrityVisible=phaseOrder(c.phase)>=phaseOrder("INTEGRITY_DONE");
    const recoveryVisible=phaseOrder(c.phase)>=phaseOrder("RECOVERY_DONE");
    const auditVisible=c.phase==="COMPLETE";
    const rows=[];
    rows.push(["事件 ID",(r.event_id||"").slice(0,18)+(text(r.event_id).length>18?"…":"")]);
    rows.push(["攻击场景",scenarioLabel(r.scenario)]);
    rows.push(["数据等级 D",value(r.D)]);
    rows.push(["Trap 诱饵",value(r.Trap)]);
    rows.push(["风险 R",analysisVisible?risk(r.R):"未解锁",analysisVisible&&text(r.P)==="P3"?"hot":""]);
    rows.push(["异常类型 A",analysisVisible?anomalyLabel(value(r.A)):"未解锁"]);
    rows.push(["策略 P",analysisVisible?value(r.P):"未解锁"]);
    if(defenseVisible) rows.push(["遏制结果",value(r.containment),text(r.containment)==="CONTAINED"?"good":text(r.containment)==="FAILED"?"hot":""]);
    if(integrityVisible) rows.push(["完整性",integrityLabel(value(r.integrity_state)),text(r.integrity_state)==="NORMAL"?"good":text(r.integrity_state).includes("ANOMALY")?"hot":""]);
    if(recoveryVisible) rows.push(["恢复状态",value(r.recovery_status)]);
    if(recoveryVisible) rows.push(["恢复来源",value(r.recovery_source)]);
    if(auditVisible) rows.push(["Event Pool",poolLabel(value(r.event_pool_decision))]);
    if(auditVisible) rows.push(["Pipeline",n(r.total_pipeline_ms)!==null?`${Number(r.total_pipeline_ms).toFixed(2)} ms`:"--"]);
    return rows;
  }

  function renderDecision(){
    const c=activeCase();
    const panel=el("sim-decision-panel");
    const zone=el("sim-action-zone");
    const label=el("sim-decision-state");
    if(!panel || !zone || !label) return;
    if(!c){
      label.textContent="待机";
      panel.innerHTML='<div class="sim-decision-empty">选择攻击场景并启动回放后，正式事件中的 R / A / P 会按处置阶段逐步解锁。</div>';
      zone.innerHTML="";
      return;
    }
    label.textContent=PHASE_LABEL[c.phase] || c.phase;
    const analysisVisible=phaseOrder(c.phase)>=phaseOrder("DECISION_READY");
    panel.innerHTML=`
      <span class="sim-decision-kicker">正式风险 R</span>
      <div class="sim-risk-value ${analysisVisible?"":"pending"}">${analysisVisible?risk(c.row.R):"--"}</div>
      <div class="sim-decision-list">
        ${decisionRows(c).map(([k,v,tone])=>`<div><span>${esc(k)}</span><b class="${esc(tone||"")}">${esc(v)}</b></div>`).join("")}
      </div>`;
    zone.innerHTML=actionMarkup(c);
  }

  function actionMarkup(c){
    if(c.phase==="READY") return '<button type="button" data-sim-action="analyze">开始分析回放</button>';
    if(c.phase==="ATTACKING") return '<button type="button" disabled>攻击场景已激活…</button>';
    if(c.phase==="ANALYZING") return '<button type="button" disabled>正在读取正式决策…</button>';
    if(c.phase==="DECISION_READY") return '<button type="button" data-sim-action="defend">执行策略回放</button><button class="secondary" type="button" data-sim-action="inspect">弹窗查看正式字段</button>';
    if(c.phase==="DEFENDING") return '<button type="button" disabled>主动防御可视化中…</button>';
    if(c.phase==="DEFENSE_DONE") return '<button type="button" data-sim-action="verify">验证完整性</button>';
    if(c.phase==="VERIFYING") return '<button type="button" disabled>正在读取完整性结果…</button>';
    if(c.phase==="INTEGRITY_DONE") return recoveryNeeded(c)?'<button type="button" data-sim-action="recover">启动可信恢复回放</button>':'<button type="button" data-sim-action="audit">生成审计结论</button>';
    if(c.phase==="RECOVERING") return '<button type="button" disabled>可信恢复可视化中…</button>';
    if(c.phase==="RECOVERY_DONE") return '<button type="button" data-sim-action="audit">生成审计结论</button>';
    if(c.phase==="AUDITING") return '<button type="button" disabled>正在读取审计字段…</button>';
    if(c.phase==="COMPLETE") return '<button type="button" data-sim-action="open-stream">查看完整事件流</button><button class="secondary" type="button" data-sim-action="replay">重新回放此事件</button>';
    return "";
  }

  function renderSystem(){
    const s=systemPhase();
    const holder=el("sim-system-label")?.parentElement;
    if(el("sim-system-label")) el("sim-system-label").textContent=s.label;
    if(holder){ holder.classList.remove("warn","alert"); if(s.tone) holder.classList.add(s.tone); }
  }

  function render(){
    renderScenarioList();
    renderQueue();
    renderProcess();
    renderFocus();
    renderFlow();
    renderDecision();
    renderSystem();
    renderLog();
  }

  function cancelTimelines(){
    sim.timelines.forEach(t=>{ try{t.kill();}catch(_){} });
    sim.timelines=[];
  }

  function timeline(){
    if(window.gsap){
      const t=window.gsap.timeline();
      sim.timelines.push(t);
      return t;
    }
    return null;
  }

  function startSimulation(){
    if(sim.selected.length<selectionMinimum()) return;
    cancelTimelines();
    sim.started=true;
    sim.logs=[];
    sim.cases=sim.selected.map(name=>makeCase(name)).filter(Boolean);
    sim.activeId=sim.cases[0]?.id || null;
    if(!sim.cases.length){
      log("SYSTEM","当前 results.csv 中未找到所选场景的正式事件。","alert");
      render();
      return;
    }
    sim.cases.forEach(c=>c.phase="ATTACKING");
    log("SYSTEM",`已载入 ${sim.cases.length} 个正式事件，来源 results.csv。`);
    sim.cases.forEach(c=>log("EVENT",`${c.row.event_id} · 场景=${scenarioLabel(c.row.scenario)} · D=${value(c.row.D)}`));
    render();

    const activateCase=c=>{
      c.phase="ANALYZING";
      log("SENSOR",`${c.row.event_id}：场景信号进入 UFN-SAR + LightGBM 分析阶段。`);
      render();
    };
    const revealDecision=c=>{
      c.phase="DECISION_READY";
      log("AI",`${c.row.event_id}：正式 R=${risk(c.row.R)}，A=${anomalyLabel(value(c.row.A))}，P=${value(c.row.P)}。`,text(c.row.P)==="P3"?"alert":"");
      render();
    };
    const t=timeline();
    if(t){
      sim.cases.forEach((c,index)=>{
        t.call(()=>activateCase(c),[],0.16+index*0.10);
        t.call(()=>revealDecision(c),[],0.42+index*0.10);
      });
    }else{
      sim.cases.forEach((c,index)=>{
        setTimeout(()=>activateCase(c),160+index*100);
        setTimeout(()=>revealDecision(c),420+index*100);
      });
    }
  }

  function defend(c){
    if(!c || c.phase!=="DECISION_READY") return;
    c.phase="DEFENDING";
    log("POLICY",`${c.row.event_id}：执行策略回放 ${value(c.row.P)}；Permission / Network 为 SIMULATED。`,"alert");
    render();
    const finish=()=>{
      c.phase="DEFENSE_DONE";
      log("DEFENSE",`${c.row.event_id}：正式 containment=${value(c.row.containment)}。`,text(c.row.containment)==="CONTAINED"?"good":"alert");
      render();
    };
    const t=timeline();
    if(t){ t.to("#sim-workspace .sim-flow-node.engine",{x:2,duration:.16,yoyo:true,repeat:3,ease:"power1.inOut"}).call(finish); }
    else setTimeout(finish,680);
  }

  function verify(c){
    if(!c || c.phase!=="DEFENSE_DONE") return;
    c.phase="VERIFYING";
    log("VERIFY",`${c.row.event_id}：正在读取正式完整性结果。`);
    render();
    const finish=()=>{
      c.phase="INTEGRITY_DONE";
      const tone=text(c.row.integrity_state)==="NORMAL"?"good":"alert";
      log("INTEGRITY",`${c.row.event_id}：正式 integrity_state=${integrityLabel(value(c.row.integrity_state))}。`,tone);
      render();
    };
    const t=timeline();
    if(t){ t.to("#sim-workspace .sim-flow-node.trust",{x:2,duration:.18,yoyo:true,repeat:2,ease:"power1.inOut"}).call(finish); }
    else setTimeout(finish,580);
  }

  function recover(c){
    if(!c || c.phase!=="INTEGRITY_DONE" || !recoveryNeeded(c)) return;
    c.phase="RECOVERING";
    log("RECOVERY",`${c.row.event_id}：读取正式恢复记录，status=${value(c.row.recovery_status)}，source=${value(c.row.recovery_source)}。`);
    render();
    const finish=()=>{
      c.phase="RECOVERY_DONE";
      log("RECOVERY",`${c.row.event_id}：正式恢复结果已记录。`,"good");
      render();
    };
    const t=timeline();
    if(t){ t.to("#sim-workspace .sim-flow-node.trust",{x:3,duration:.20,yoyo:true,repeat:3,ease:"power1.inOut"}).call(finish); }
    else setTimeout(finish,820);
  }

  function audit(c){
    if(!c || !["INTEGRITY_DONE","RECOVERY_DONE"].includes(c.phase)) return;
    c.phase="AUDITING";
    log("AUDIT",`${c.row.event_id}：正在读取 Event Pool 与 Pipeline 正式字段。`);
    render();
    const finish=()=>{
      c.phase="COMPLETE";
      log("AUDIT",`${c.row.event_id}：Event Pool=${poolLabel(c.row.event_pool_decision)}，Pipeline=${n(c.row.total_pipeline_ms)!==null?Number(c.row.total_pipeline_ms).toFixed(2)+" ms":"--"}。`,"good");
      render();
    };
    const t=timeline();
    if(t){ t.call(finish,[],.36); }
    else setTimeout(finish,360);
  }

  function replay(c){
    if(!c) return;
    c.phase="ATTACKING";
    log("SYSTEM",`${c.row.event_id}：重新开始正式事件回放。`);
    render();
    const analyze=()=>{ c.phase="ANALYZING"; log("SENSOR",`${c.row.event_id}：场景信号进入分析阶段。`); render(); };
    const finish=()=>{ c.phase="DECISION_READY"; log("AI",`${c.row.event_id}：正式 R=${risk(c.row.R)}，A=${anomalyLabel(value(c.row.A))}，P=${value(c.row.P)}。`); render(); };
    const t=timeline();
    if(t){ t.call(analyze,[],.14).call(finish,[],.40); }
    else { setTimeout(analyze,140); setTimeout(finish,400); }
  }

  function inspect(c){
    if(!c) return;
    const r=c.row;
    log("EVIDENCE",`${r.event_id}：D=${value(r.D)}，Trap=${value(r.Trap)}，ground_truth=${value(r.ground_truth)}，event_confirmed=${value(r.event_confirmed)}。`);
    log("EVIDENCE",`${r.event_id}：R=${risk(r.R)}，A=${anomalyLabel(value(r.A))}，P=${value(r.P)}，containment=${value(r.containment)}。`);
    render();
    openStreamDialog();
  }

  function reset(){
    cancelTimelines();
    sim.started=false;
    sim.cases=[];
    sim.activeId=null;
    sim.logs=[];
    closeStreamDialog();
    render();
  }

  function toggleScenario(name){
    if(sim.started) reset();
    if(sim.mode==="single"){
      sim.selected=[name];
    }else{
      if(sim.selected.includes(name)){
        if(sim.selected.length>1) sim.selected=sim.selected.filter(x=>x!==name);
      }else if(sim.selected.length<selectionLimit()){
        sim.selected=[...sim.selected,name];
      }
    }
    render();
  }

  function setMode(mode){
    if(!["single","parallel"].includes(mode)) return;
    reset();
    sim.mode=mode;
    if(mode==="single") sim.selected=[sim.selected[0]||"IMAGE_LEAKAGE"];
    else sim.selected=["IMAGE_LEAKAGE","EMR_LEAKAGE","ACCOUNT_ABUSE"];
    document.querySelectorAll("[data-sim-mode]").forEach(btn=>{
      const on=btn.dataset.simMode===mode;
      btn.classList.toggle("active",on);
      btn.setAttribute("aria-selected",String(on));
    });
    render();
  }

  function dialogSummaryMarkup(c){
    const analysisVisible=c && phaseOrder(c.phase)>=phaseOrder("DECISION_READY");
    return `
      <div><span>当前攻击</span><b>${esc(c?scenarioLabel(c.scenario):"尚未启动")}</b></div>
      <div><span>当前阶段</span><b>${esc(c?caseStatus(c):"待机")}</b></div>
      <div><span>事件 ID</span><b>${esc(c?c.id:"--")}</b></div>
      <div><span>正式 R</span><b>${esc(c&&analysisVisible?risk(c.row.R):"未解锁")}</b></div>
      <div><span>策略 P</span><b>${esc(c&&analysisVisible?value(c.row.P):"未解锁")}</b></div>`;
  }

  function renderDialogProcess(){
    const host=el("sim-dialog-process");
    if(!host) return;
    const c=activeCase();
    const step=processStep(c);
    const completed=completedStepCount(c);
    host.innerHTML=PROCESS.map(([num,label],idx)=>{
      const done=!!c && (idx<completed || c.phase==="COMPLETE");
      const current=!!c && c.phase!=="COMPLETE" && idx===step;
      return `<li class="${done?"done":""} ${current?"current":""}"><b>${num}</b><span>${esc(label)}</span></li>`;
    }).join("");
  }

  function renderDialog(){
    const summary=el("sim-dialog-summary");
    if(summary) summary.innerHTML=dialogSummaryMarkup(activeCase());
    renderDialogProcess();
    const stream=el("sim-dialog-stream");
    if(stream){
      stream.innerHTML=sim.logs.length?sim.logs.map((item,index)=>logMarkup(item,index,true)).join(""):'<div class="sim-stream-empty">当前还没有事件日志。</div>';
      stream.scrollTop=stream.scrollHeight;
    }
  }

  function openStreamDialog(){
    const dialog=el("sim-stream-dialog");
    if(!dialog) return;
    renderDialog();
    if(typeof dialog.showModal==="function"){
      if(!dialog.open) dialog.showModal();
    }else{
      dialog.setAttribute("open","");
    }
  }

  function closeStreamDialog(){
    const dialog=el("sim-stream-dialog");
    if(!dialog) return;
    if(typeof dialog.close==="function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function handleClick(e){
    const mode=e.target.closest("[data-sim-mode]");
    if(mode){ setMode(mode.dataset.simMode); return; }
    const scenario=e.target.closest("[data-scenario]");
    if(scenario){ toggleScenario(scenario.dataset.scenario); return; }
    const row=e.target.closest("[data-case-id]");
    if(row){ sim.activeId=row.dataset.caseId; render(); return; }
    const action=e.target.closest("[data-sim-action]");
    if(action){
      const c=activeCase();
      if(action.dataset.simAction==="analyze") replay(c);
      if(action.dataset.simAction==="defend") defend(c);
      if(action.dataset.simAction==="verify") verify(c);
      if(action.dataset.simAction==="recover") recover(c);
      if(action.dataset.simAction==="audit") audit(c);
      if(action.dataset.simAction==="replay") replay(c);
      if(action.dataset.simAction==="inspect") inspect(c);
      if(action.dataset.simAction==="open-stream") openStreamDialog();
      return;
    }
    if(e.target.closest("#sim-start")){ startSimulation(); return; }
    if(e.target.closest("#sim-reset")){ reset(); return; }
    if(e.target.closest("#sim-clear-stream")){ clearLog(); return; }
    if(e.target.closest("#sim-open-stream") || e.target.closest("#sim-stream-hint") || e.target.closest("[data-open-stream]")){ openStreamDialog(); return; }
    if(e.target.closest("#sim-close-stream")){ closeStreamDialog(); return; }
  }

  function loadFormalRow(rowIndex){
    const row=state.rows?.[rowIndex];
    if(!row) return;
    cancelTimelines();
    sim.mode="single";
    sim.selected=[row.scenario];
    sim.started=true;
    const c=makeCase(row.scenario,row);
    if(!c) return;
    c.phase="ATTACKING";
    sim.cases=[c];
    sim.activeId=c.id;
    sim.logs=[];
    document.querySelectorAll("[data-sim-mode]").forEach(btn=>{
      const on=btn.dataset.simMode==="single";
      btn.classList.toggle("active",on);
      btn.setAttribute("aria-selected",String(on));
    });
    log("EVENT",`从正式事件样本表载入 ${row.event_id}。`);
    render();
    const t=timeline();
    const analyze=()=>{ c.phase="ANALYZING"; log("SENSOR",`${c.row.event_id}：场景信号进入分析阶段。`); render(); };
    const finish=()=>{ c.phase="DECISION_READY"; log("AI",`${c.row.event_id}：正式 R=${risk(c.row.R)}，A=${anomalyLabel(value(c.row.A))}，P=${value(c.row.P)}。`); render(); };
    if(t){ t.call(analyze,[],.14).call(finish,[],.40); }
    else { setTimeout(analyze,140); setTimeout(finish,400); }
    location.hash="#console";
  }

  function mount(){
    const root=el("sim-lab");
    if(!root || root.dataset.simMounted==="1") return;
    root.dataset.simMounted="1";
    root.dataset.simVersion=VERSION;
    root.addEventListener("click",handleClick);
    const dialog=el("sim-stream-dialog");
    if(dialog){
      dialog.addEventListener("cancel",e=>{ e.preventDefault(); closeStreamDialog(); });
      dialog.addEventListener("click",e=>{
        if(e.target===dialog) closeStreamDialog();
      });
    }
    render();
  }

  window.MedShieldSimulationLabV2={
    mount,
    render,
    clearLog,
    reset,
    start:startSimulation,
    loadFormalRow,
    openStreamDialog
  };

  window.addEventListener("medshield:formal-data-ready",()=>{ mount(); render(); });

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,0),{once:true});
  else setTimeout(mount,0);
})();
