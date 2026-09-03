(function(){
  "use strict";

  const VERSION = "V2-SINGLE-OWNER";

  const SCENARIOS = [
    "IMAGE_LEAKAGE",
    "EMR_LEAKAGE",
    "DATA_EXFILTRATION",
    "ACCOUNT_ABUSE",
    "MULTI_SOURCE_ATTACK",
    "SLOW_DATA_EXFILTRATION"
  ];

  const ENGLISH = {
    IMAGE_LEAKAGE:"IMAGE LEAKAGE",
    EMR_LEAKAGE:"EMR LEAKAGE",
    DATA_EXFILTRATION:"DATA EXFILTRATION",
    ACCOUNT_ABUSE:"ACCOUNT ABUSE",
    MULTI_SOURCE_ATTACK:"MULTI-SOURCE ATTACK",
    SLOW_DATA_EXFILTRATION:"SLOW DATA EXFILTRATION"
  };

  const PHASE_LABEL = {
    READY:"READY",
    ATTACKING:"ATTACK ACTIVE",
    ANALYZING:"ANALYZING",
    DECISION_READY:"DECISION REQUIRED",
    DEFENDING:"DEFENDING",
    DEFENSE_DONE:"DEFENSE RECORDED",
    VERIFYING:"VERIFYING",
    INTEGRITY_DONE:"INTEGRITY RECORDED",
    RECOVERING:"RECOVERING",
    RECOVERY_DONE:"RECOVERY RECORDED",
    AUDITING:"AUDITING",
    COMPLETE:"COMPLETE"
  };

  const sim = {
    mode:"single",
    selected:["IMAGE_LEAKAGE"],
    cases:[],
    activeId:null,
    logs:[],
    started:false,
    sequence:0,
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

  function metricForScenario(name){
    try { return state.metrics?.scenario_metrics?.[name] || null; } catch(_){ return null; }
  }

  function rowsForScenario(name){
    try {
      return (state.rows || []).filter(row => row && row.scenario === name && row.event_id);
    } catch(_){ return []; }
  }

  function pickFormalRow(name){
    const rows = rowsForScenario(name);
    if(!rows.length) return null;
    const confirmed = rows.filter(row => truthy(row.event_confirmed));
    const source = confirmed.length ? confirmed : rows;
    const detected = source.find(row => text(row.A).trim() && text(row.A).trim() !== "NORMAL" && text(row.P).trim());
    return detected || source[0];
  }

  function makeCase(name,rowOverride=null){
    const row = rowOverride || pickFormalRow(name);
    if(!row) return null;
    const id = row.event_id || `SIM-${name}`;
    return {
      id,
      scenario:name,
      row,
      phase:"READY",
      selectedAt:sim.sequence++,
      source:"results.csv"
    };
  }

  function activeCase(){ return sim.cases.find(c=>c.id===sim.activeId) || sim.cases[0] || null; }

  function log(type,message,tone=""){
    sim.logs.push({
      time:new Date().toLocaleTimeString("zh-CN",{hour12:false}),
      type,
      message,
      tone
    });
    if(sim.logs.length>120) sim.logs=sim.logs.slice(-120);
    renderLog();
  }

  function clearLog(){ sim.logs=[]; renderLog(); }

  function renderLog(){
    const host=el("simv2-stream-body");
    if(!host) return;
    if(!sim.logs.length){
      host.innerHTML='<div class="sim-stream-line"><time>--:--:--</time><b>SYSTEM</b><span>等待实验启动。</span></div>';
      return;
    }
    host.innerHTML=sim.logs.map(item=>`<div class="sim-stream-line ${esc(item.tone)}"><time>${esc(item.time)}</time><b>${esc(item.type)}</b><span>${esc(item.message)}</span></div>`).join("");
    host.scrollTop=host.scrollHeight;
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
        <span><strong>${esc(ENGLISH[name])}</strong><small>${esc(scenarioLabel(name))}</small></span>
        <span class="rate"><b>${rate}</b><span>${events} events</span></span>
      </button>`;
    }).join("");

    const hint=el("sim-selection-hint");
    if(hint) hint.textContent=sim.mode==="parallel"?"选择 2–4 个场景":"选择 1 个场景";
    const count=el("sim-selected-count");
    if(count) count.textContent=`${sim.selected.length} INCIDENT${sim.selected.length===1?"":"S"}`;
    const start=el("sim-start");
    if(start) start.disabled=sim.selected.length<selectionMinimum();
  }

  function systemPhase(){
    if(!sim.started) return {label:"READY",tone:""};
    if(sim.cases.some(c=>["ATTACKING","ANALYZING","DEFENDING","VERIFYING","RECOVERING","AUDITING"].includes(c.phase))) return {label:"PROCESSING",tone:"warn"};
    if(sim.cases.some(c=>c.phase==="DECISION_READY")) return {label:"OPERATOR ACTION REQUIRED",tone:"alert"};
    if(sim.cases.every(c=>c.phase==="COMPLETE")) return {label:"SIMULATION COMPLETE",tone:""};
    return {label:"ACTIVE",tone:"warn"};
  }

  function caseStatus(c){
    if(c.phase==="DEFENSE_DONE") return value(c.row.containment,"DEFENSE RECORDED");
    if(c.phase==="INTEGRITY_DONE") return value(c.row.integrity_state,"INTEGRITY RECORDED");
    if(c.phase==="RECOVERY_DONE") return value(c.row.recovery_status,"RECOVERY RECORDED");
    return PHASE_LABEL[c.phase] || c.phase;
  }

  function renderQueue(){
    const host=el("sim-incident-queue");
    if(!host) return;
    if(!sim.cases.length){
      host.innerHTML='<div class="sim-no-data">尚未启动事件回放。</div>';
    }else{
      host.innerHTML=sim.cases.map((c,index)=>{
        const active=c.id===sim.activeId;
        const failed=text(c.row.containment).toUpperCase()==="FAILED" && phaseOrder(c.phase)>=phaseOrder("DEFENSE_DONE");
        return `<button class="sim-case-row ${active?"active":""} ${failed?"failed":""} ${c.phase==="COMPLETE"?"complete":""}" type="button" data-case-id="${esc(c.id)}">
          <span class="row-top"><span>${String(index+1).padStart(2,"0")} / ${esc(c.row.D || "--")}</span><b>${esc(caseStatus(c))}</b></span>
          <strong>${esc(ENGLISH[c.scenario])}</strong>
          <small>${esc((c.id||"").slice(0,22))}${c.id.length>22?"…":""}</small>
        </button>`;
      }).join("");
    }
    const pending=el("simv2-pending-count");
    if(pending) pending.textContent=String(sim.cases.filter(c=>c.phase!=="COMPLETE").length);
    const active=el("simv2-active-count");
    if(active) active.textContent=String(sim.cases.filter(c=>!["READY","COMPLETE"].includes(c.phase)).length);
  }

  function selectedFlowClasses(c){
    if(!c) return [];
    const s=c.scenario;
    const arr=["source","access","engine"];
    if(s==="IMAGE_LEAKAGE") arr.push("image","network");
    if(s==="EMR_LEAKAGE") arr.push("emr","network");
    if(s==="DATA_EXFILTRATION") arr.push("network");
    if(s==="ACCOUNT_ABUSE") arr.push("emr");
    if(s==="MULTI_SOURCE_ATTACK") arr.push("emr","image","network");
    if(s==="SLOW_DATA_EXFILTRATION") arr.push("network");
    if(phaseOrder(c.phase)>=phaseOrder("VERIFYING")) arr.push("trust");
    return arr;
  }

  function renderFlow(){
    const c=activeCase();
    const workspace=el("sim-workspace");
    const canvas=el("sim-flow-canvas");
    if(!workspace||!canvas) return;
    workspace.classList.remove("running","defending","verified");
    const liveCases=sim.cases.filter(x=>x.phase!=="COMPLETE");
    if(liveCases.some(x=>["ATTACKING","ANALYZING","DECISION_READY"].includes(x.phase))) workspace.classList.add("running");
    if(liveCases.some(x=>["DEFENDING","DEFENSE_DONE"].includes(x.phase))) workspace.classList.add("defending");
    if(liveCases.some(x=>phaseOrder(x.phase)>=phaseOrder("VERIFYING"))) workspace.classList.add("verified");

    canvas.querySelectorAll(".sim-flow-node").forEach(node=>node.classList.remove("active","alert"));
    const combined=new Set();
    liveCases.forEach(item=>selectedFlowClasses(item).forEach(name=>combined.add(name)));
    combined.forEach(name=>canvas.querySelector(`.sim-flow-node.${name}`)?.classList.add("active"));

    const currentClasses=selectedFlowClasses(c);
    if(c && ["DECISION_READY","DEFENDING"].includes(c.phase)){
      ["emr","image","network"].forEach(name=>{
        if(currentClasses.includes(name)) canvas.querySelector(`.sim-flow-node.${name}`)?.classList.add("alert");
      });
    }

    const lanes=el("sim-parallel-lanes");
    if(lanes){
      lanes.innerHTML=sim.cases.map(item=>{
        const tone=item.phase==="COMPLETE"?"done":item.id===sim.activeId?"current":(["DECISION_READY","DEFENDING"].includes(item.phase)?"alert":"");
        return `<span class="sim-parallel-lane ${tone}">${esc(ENGLISH[item.scenario])} · ${esc(caseStatus(item))}</span>`;
      }).join("");
    }

    const caption=el("sim-flow-caption");
    if(caption){
      if(!c) caption.textContent="选择场景后启动正式事件回放";
      else if(c.phase==="ATTACKING") caption.textContent=`${ENGLISH[c.scenario]} 已激活：正在进行场景路径可视化（非新增测量数据）`;
      else if(c.phase==="ANALYZING") caption.textContent=`正在回放 ${ENGLISH[c.scenario]} 的正式事件分析阶段`;
      else if(c.phase==="DECISION_READY") caption.textContent="正式 R / A / P 已读取，等待操作员推进处置";
      else if(c.phase==="DEFENDING") caption.textContent="正在可视化策略执行过程；权限与网络动作属于 SIMULATED";
      else if(c.phase==="VERIFYING") caption.textContent="正在进入完整性证据阶段";
      else if(c.phase==="RECOVERING") caption.textContent="正在可视化可信恢复过程";
      else if(c.phase==="COMPLETE") caption.textContent="事件回放完成，正式结果与审计字段已解锁";
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
    rows.push(["Event",(r.event_id||"").slice(0,18)+(text(r.event_id).length>18?"…":"")]);
    rows.push(["Scenario",r.scenario]);
    rows.push(["D",r.D]);
    rows.push(["Trap",r.Trap]);
    rows.push(["Risk",analysisVisible?risk(r.R):"LOCKED",analysisVisible&&text(r.P)==="P3"?"hot":""]);
    rows.push(["AI Output",analysisVisible?value(r.A):"LOCKED"]);
    rows.push(["Policy",analysisVisible?value(r.P):"LOCKED"]);
    if(defenseVisible) rows.push(["Containment",value(r.containment),text(r.containment)==="CONTAINED"?"good":text(r.containment)==="FAILED"?"hot":""]);
    if(integrityVisible) rows.push(["Integrity",value(r.integrity_state),text(r.integrity_state)==="NORMAL"?"good":text(r.integrity_state).includes("ANOMALY")?"hot":""]);
    if(recoveryVisible) rows.push(["Recovery",value(r.recovery_status)]);
    if(recoveryVisible) rows.push(["Recovery Source",value(r.recovery_source)]);
    if(auditVisible) rows.push(["Event Pool",value(r.event_pool_decision)]);
    if(auditVisible) rows.push(["Pipeline",n(r.total_pipeline_ms)!==null?`${Number(r.total_pipeline_ms).toFixed(2)} ms`:"--"]);
    return rows;
  }

  function renderDecision(){
    const c=activeCase();
    const panel=el("sim-decision-panel");
    const zone=el("sim-action-zone");
    const label=el("sim-decision-state");
    if(!panel||!zone||!label) return;
    if(!c){
      label.textContent="STANDBY";
      panel.innerHTML='<div class="sim-decision-empty">选择场景并启动回放后，正式事件的 R / A / P 将按阶段解锁。</div>';
      zone.innerHTML="";
      return;
    }
    label.textContent=PHASE_LABEL[c.phase]||c.phase;
    const analysisVisible=phaseOrder(c.phase)>=phaseOrder("DECISION_READY");
    panel.innerHTML=`
      <span class="sim-decision-kicker">RECORDED RISK</span>
      <div class="sim-risk-value ${analysisVisible?"":"pending"}">${analysisVisible?risk(c.row.R):"--"}</div>
      <div class="sim-decision-list">
        ${decisionRows(c).map(([k,v,tone])=>`<div><span>${esc(k)}</span><b class="${esc(tone||"")}">${esc(v)}</b></div>`).join("")}
      </div>`;

    zone.innerHTML=actionMarkup(c);
  }

  function actionMarkup(c){
    const recoveryNeeded=!isNotNeeded(c.row.recovery_status) || !isNotNeeded(c.row.recovery_source);
    if(c.phase==="READY") return '<button type="button" data-sim-action="analyze">开始分析回放</button>';
    if(c.phase==="ATTACKING") return '<button type="button" disabled>攻击场景已激活…</button>';
    if(c.phase==="ANALYZING") return '<button type="button" disabled>正在读取正式决策…</button>';
    if(c.phase==="DECISION_READY") return '<button type="button" data-sim-action="defend">执行策略回放</button><button class="secondary" type="button" data-sim-action="inspect">查看真实字段</button>';
    if(c.phase==="DEFENDING") return '<button type="button" disabled>策略执行可视化中…</button>';
    if(c.phase==="DEFENSE_DONE") return '<button type="button" data-sim-action="verify">验证完整性</button>';
    if(c.phase==="VERIFYING") return '<button type="button" disabled>完整性证据读取中…</button>';
    if(c.phase==="INTEGRITY_DONE") return recoveryNeeded ? '<button type="button" data-sim-action="recover">启动可信恢复回放</button>' : '<button type="button" data-sim-action="audit">生成审计结论</button>';
    if(c.phase==="RECOVERING") return '<button type="button" disabled>可信恢复可视化中…</button>';
    if(c.phase==="RECOVERY_DONE") return '<button type="button" data-sim-action="audit">生成审计结论</button>';
    if(c.phase==="AUDITING") return '<button type="button" disabled>审计字段读取中…</button>';
    if(c.phase==="COMPLETE") return '<button class="secondary" type="button" data-sim-action="replay">重新回放此事件</button>';
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
    renderFlow();
    renderDecision();
    renderSystem();
    renderLog();
  }

  function cancelTimelines(){
    sim.timelines.forEach(t=>{ try{ t.kill(); }catch(_){} });
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
    sim.cases.forEach(c=>log("EVENT",`${c.row.event_id} · scenario=${c.row.scenario} · D=${c.row.D}`));
    render();

    const activateCase=(c)=>{
      c.phase="ANALYZING";
      log("SENSOR",`${c.row.event_id}: 场景信号进入 UFN-SAR + LightGBM 分析阶段。`);
      render();
    };
    const revealDecision=(c)=>{
      c.phase="DECISION_READY";
      log("AI",`${c.row.event_id}: R=${risk(c.row.R)}, A=${value(c.row.A)}, P=${value(c.row.P)}`,text(c.row.P)==="P3"?"alert":"");
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
    if(!c||c.phase!=="DECISION_READY") return;
    c.phase="DEFENDING";
    log("POLICY",`${c.row.event_id}: 执行策略回放 ${value(c.row.P)}；Permission / Network 为 SIMULATED。`,"alert");
    render();
    const finish=()=>{
      c.phase="DEFENSE_DONE";
      log("DEFENSE",`${c.row.event_id}: containment=${value(c.row.containment)}`,text(c.row.containment)==="CONTAINED"?"good":"alert");
      render();
    };
    const t=timeline();
    if(t){ t.to("#sim-workspace .sim-flow-node.engine",{x:2,duration:.18,yoyo:true,repeat:3,ease:"power1.inOut"}).call(finish); }
    else setTimeout(finish,850);
  }

  function verify(c){
    if(!c||c.phase!=="DEFENSE_DONE") return;
    c.phase="VERIFYING";
    log("VERIFY",`${c.row.event_id}: 正在读取正式完整性结果。`);
    render();
    const finish=()=>{
      c.phase="INTEGRITY_DONE";
      const tone=text(c.row.integrity_state)==="NORMAL"?"good":"alert";
      log("INTEGRITY",`${c.row.event_id}: integrity_state=${value(c.row.integrity_state)}`,tone);
      render();
    };
    const t=timeline();
    if(t){ t.to("#sim-workspace .sim-flow-node.trust",{x:2,duration:.2,yoyo:true,repeat:2,ease:"power1.inOut"}).call(finish); }
    else setTimeout(finish,700);
  }

  function recover(c){
    if(!c||c.phase!=="INTEGRITY_DONE") return;
    c.phase="RECOVERING";
    log("RECOVERY",`${c.row.event_id}: recovery_status=${value(c.row.recovery_status)}, source=${value(c.row.recovery_source)}`);
    render();
    const finish=()=>{
      c.phase="RECOVERY_DONE";
      log("RECOVERY",`${c.row.event_id}: 正式恢复结果已记录。`,`good`);
      render();
    };
    const t=timeline();
    if(t){ t.to("#sim-workspace .sim-flow-node.trust",{x:3,duration:.22,yoyo:true,repeat:4,ease:"power1.inOut"}).call(finish); }
    else setTimeout(finish,950);
  }

  function audit(c){
    if(!c||!["INTEGRITY_DONE","RECOVERY_DONE"].includes(c.phase)) return;
    c.phase="AUDITING";
    log("AUDIT",`${c.row.event_id}: 正在读取 event_pool_decision 与 pipeline 字段。`);
    render();
    const finish=()=>{
      c.phase="COMPLETE";
      log("AUDIT",`${c.row.event_id}: pool=${poolLabel(c.row.event_pool_decision)}, pipeline=${n(c.row.total_pipeline_ms)!==null?Number(c.row.total_pipeline_ms).toFixed(2)+" ms":"--"}.`,"good");
      render();
    };
    const t=timeline();
    if(t){ t.call(finish,[],.45); }
    else setTimeout(finish,450);
  }

  function replay(c){
    if(!c) return;
    c.phase="ATTACKING";
    log("SYSTEM",`${c.row.event_id}: 重新开始正式事件回放。`);
    render();
    const analyze=()=>{ c.phase="ANALYZING"; log("SENSOR",`${c.row.event_id}: 场景信号进入分析阶段。`); render(); };
    const finish=()=>{ c.phase="DECISION_READY"; log("AI",`${c.row.event_id}: R=${risk(c.row.R)}, A=${value(c.row.A)}, P=${value(c.row.P)}`); render(); };
    const t=timeline();
    if(t){ t.call(analyze,[],.14).call(finish,[],.40); }
    else { setTimeout(analyze,140); setTimeout(finish,400); }
  }

  function inspect(c){
    if(!c) return;
    const r=c.row;
    log("EVIDENCE",`${r.event_id}: D=${value(r.D)}, Trap=${value(r.Trap)}, ground_truth=${value(r.ground_truth)}, event_confirmed=${value(r.event_confirmed)}.`);
    log("EVIDENCE",`${r.event_id}: R=${risk(r.R)}, A=${value(r.A)}, P=${value(r.P)}, containment=${value(r.containment)}.`);
    render();
  }

  function reset(){
    cancelTimelines();
    sim.started=false;
    sim.cases=[];
    sim.activeId=null;
    sim.logs=[];
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
    else {
      const preferred=["IMAGE_LEAKAGE","EMR_LEAKAGE","ACCOUNT_ABUSE"];
      sim.selected=preferred.filter(x=>SCENARIOS.includes(x));
    }
    document.querySelectorAll("[data-sim-mode]").forEach(btn=>{
      const on=btn.dataset.simMode===mode;
      btn.classList.toggle("active",on);
      btn.setAttribute("aria-selected",String(on));
    });
    render();
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
      return;
    }
    if(e.target.closest("#sim-start")){ startSimulation(); return; }
    if(e.target.closest("#sim-reset")){ reset(); return; }
    if(e.target.closest("#sim-clear-stream")){ clearLog(); return; }
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
    const analyze=()=>{ c.phase="ANALYZING"; log("SENSOR",`${c.row.event_id}: 场景信号进入分析阶段。`); render(); };
    const finish=()=>{ c.phase="DECISION_READY"; log("AI",`${c.row.event_id}: R=${risk(c.row.R)}, A=${value(c.row.A)}, P=${value(c.row.P)}`); render(); };
    if(t){ t.call(analyze,[],.14).call(finish,[],.40); }
    else { setTimeout(analyze,140); setTimeout(finish,400); }
    location.hash="#console";
  }

  function mount(){
    const root=el("sim-lab");
    if(!root || root.dataset.simMounted==="1") return;
    root.dataset.simMounted="1";
    root.addEventListener("click",handleClick);
    render();
  }


  window.MedShieldSimulationLabV2={
    mount,
    render,
    clearLog,
    reset,
    start:startSimulation,
    loadFormalRow
  };

  window.addEventListener("medshield:formal-data-ready",()=>{ mount(); render(); });

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,0),{once:true});
  }else{
    setTimeout(mount,0);
  }
})();
