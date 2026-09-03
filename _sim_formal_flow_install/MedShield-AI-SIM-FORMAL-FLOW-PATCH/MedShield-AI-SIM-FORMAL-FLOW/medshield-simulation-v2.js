(function(){
  "use strict";

  const VERSION = "V2-FORMAL-FLOW-EXPLAINED-BATCH-EVIDENCE";
  const SCENARIOS = ["IMAGE_LEAKAGE","EMR_LEAKAGE","DATA_EXFILTRATION","ACCOUNT_ABUSE","MULTI_SOURCE_ATTACK","SLOW_DATA_EXFILTRATION"];

  const SCENE = {
    IMAGE_LEAKAGE:{zh:"医学影像泄露",en:"IMAGE_LEAKAGE",desc:"医学影像异常访问并产生外传风险",signals:["f","n"],nodes:["image","network","external"],kind:"burst"},
    EMR_LEAKAGE:{zh:"电子病历泄露",en:"EMR_LEAKAGE",desc:"电子病历异常读取与导出",signals:["u","f","n"],nodes:["actor","emr","network","external"],kind:"burst"},
    DATA_EXFILTRATION:{zh:"数据外传",en:"DATA_EXFILTRATION",desc:"敏感数据经网络出口持续外传",signals:["f","n"],nodes:["network","external"],kind:"stream"},
    ACCOUNT_ABUSE:{zh:"账号滥用",en:"ACCOUNT_ABUSE",desc:"异常账号或权限访问敏感资产",signals:["u"],nodes:["actor","emr"],kind:"access"},
    MULTI_SOURCE_ATTACK:{zh:"多源攻击",en:"MULTI_SOURCE_ATTACK",desc:"用户、文件与网络信号同时异常",signals:["u","f","n"],nodes:["actor","emr","image","network","external"],kind:"multi"},
    SLOW_DATA_EXFILTRATION:{zh:"慢速数据外传",en:"SLOW_DATA_EXFILTRATION",desc:"低频、持续的数据外传行为",signals:["n"],nodes:["network","external"],kind:"slow"}
  };

  const PHASES = [
    ["ATTACKING","异常行为产生"],
    ["ANALYZING","AI 风险感知"],
    ["DECISION_READY","Policy 决策"],
    ["DEFENDING","风险自适应防御"],
    ["VERIFYING","联合完整性验证"],
    ["RECOVERING","条件恢复"],
    ["AUDITING","安全评估与反馈"]
  ];

  const sim={mode:"single",selected:["IMAGE_LEAKAGE"],cases:[],activeId:null,logs:[],started:false,sequence:0,timelines:[],dialogQueue:[],dialogQueueActive:false,batchDialogIds:[]};
  const el=id=>document.getElementById(id);
  const text=v=>String(v??"");
  const esc=v=>text(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const truthy=v=>["true","1","yes"].includes(text(v).trim().toLowerCase());
  const num=v=>{const x=Number(v);return Number.isFinite(x)?x:null;};
  const risk=v=>num(v)===null?"--":Number(v).toFixed(2);
  const value=(v,f="--")=>text(v).trim()||f;
  const isNotNeeded=v=>["","NONE","NOT_NEEDED","NOT_APPLICABLE","SKIP"].includes(text(v).trim().toUpperCase());
  const phaseOrder=p=>["READY","ATTACKING","ANALYZING","DECISION_READY","DEFENDING","DEFENSE_DONE","VERIFYING","INTEGRITY_DONE","RECOVERING","RECOVERY_DONE","AUDITING","COMPLETE"].indexOf(p);
  const activeCase=()=>sim.cases.find(c=>c.id===sim.activeId)||sim.cases[0]||null;
  const scenarioMeta=n=>SCENE[n]||{zh:n,en:n,desc:"正式场景",signals:[],nodes:[],kind:"stream"};
  const scenarioLabel=n=>scenarioMeta(n).zh;

  function metricForScenario(name){try{return state.metrics?.scenario_metrics?.[name]||null;}catch(_){return null;}}
  function rowsForScenario(name){try{return (state.rows||[]).filter(r=>r&&r.scenario===name&&r.event_id);}catch(_){return [];}}
  function pickFormalRow(name){const rows=rowsForScenario(name);if(!rows.length)return null;const confirmed=rows.filter(r=>truthy(r.event_confirmed));const src=confirmed.length?confirmed:rows;return src.find(r=>text(r.A).trim()&&text(r.A).trim()!=="NORMAL"&&text(r.P).trim())||src[0];}
  function makeCase(name,rowOverride=null){const row=rowOverride||pickFormalRow(name);if(!row)return null;return{id:row.event_id||`SIM-${name}`,scenario:name,row,phase:"READY",selectedAt:sim.sequence++,source:"results.csv"};}

  function log(type,message,tone=""){
    sim.logs.push({time:new Date().toLocaleTimeString("zh-CN",{hour12:false}),type,message,tone});
    if(sim.logs.length>160)sim.logs=sim.logs.slice(-160);
    renderLog();
  }

  function renderLog(){
    const host=el("simv2-stream-body"); if(!host)return;
    const html=sim.logs.length?sim.logs.map(i=>`<div class="sim-stream-line ${esc(i.tone)}" ><time>${esc(i.time)}</time><b>${esc(i.type)}</b><span>${esc(i.message)}</span></div>`).join(""):'<div class="sim-stream-line"><time>--:--:--</time><b>系统</b><span>等待实验启动。</span></div>';
    host.innerHTML=html; host.scrollTop=host.scrollHeight;
    renderDialog();
  }
  function clearLog(){sim.logs=[];renderLog();}

  function selectionLimit(){return sim.mode==="parallel"?4:1;}
  function selectionMinimum(){return sim.mode==="parallel"?2:1;}

  function renderScenarioList(){
    const host=el("sim-scenario-list"); if(!host)return;
    host.innerHTML=SCENARIOS.map((name,index)=>{
      const m=metricForScenario(name), selected=sim.selected.includes(name), meta=scenarioMeta(name);
      const rate=m&&typeof m.detection_rate==="number"?`${(m.detection_rate*100).toFixed(2)}%`:"--";
      const events=m&&Number.isFinite(Number(m.events))?Number(m.events).toLocaleString("zh-CN"):"--";
      return `<button class="sim-scenario-row ${selected?"selected":""}" type="button" data-scenario="${esc(name)}" aria-pressed="${selected}" ${sim.started?"disabled aria-disabled=\"true\"":""}>
        <span class="idx">${String(index+1).padStart(2,"0")}</span>
        <span class="scenario-copy"><i>${selected?"✓ 已选择":"攻击场景"}</i><strong>${esc(meta.zh)}</strong><small>${esc(meta.en)} · ${esc(meta.desc)}</small></span>
        <span class="rate"><b>${rate}</b><span>${events} 个正式事件</span></span>
      </button>`;
    }).join("");
    if(el("sim-selection-hint"))el("sim-selection-hint").textContent=sim.mode==="parallel"?"选择 2–4 个场景":"选择 1 个场景";
    if(el("sim-selected-count"))el("sim-selected-count").textContent=`${sim.selected.length} 个事件`;
    if(el("sim-start"))el("sim-start").disabled=sim.selected.length<selectionMinimum();
  }

  function caseStatus(c){
    if(c.phase==="DEFENSE_DONE")return value(c.row.containment,"已记录");
    if(c.phase==="INTEGRITY_DONE")return value(c.row.integrity_state,"已记录");
    if(c.phase==="RECOVERY_DONE")return value(c.row.recovery_status,"已记录");
    return {READY:"等待",ATTACKING:"攻击触发",ANALYZING:"AI分析",DECISION_READY:"等待处置",DEFENDING:"正在防御",VERIFYING:"完整性验证",RECOVERING:"可信恢复",AUDITING:"审计中",COMPLETE:"完成"}[c.phase]||c.phase;
  }

  function renderQueue(){
    const host=el("sim-incident-queue");if(!host)return;
    host.innerHTML=sim.cases.length?sim.cases.map((c,index)=>`<button class="sim-case-row ${c.id===sim.activeId?"active":""} ${c.phase==="COMPLETE"?"complete":""}" type="button" data-case-id="${esc(c.id)}">
      <span class="row-top"><span>${String(index+1).padStart(2,"0")} / ${esc(c.row.D||"--")}</span><b>${esc(caseStatus(c))}</b></span>
      <strong>${esc(scenarioLabel(c.scenario))}</strong><small>${esc((c.id||"").slice(0,21))}${c.id.length>21?"…":""}</small>
    </button>`).join(""):'<div class="sim-no-data">尚未启动事件。</div>';
    if(el("simv2-pending-count"))el("simv2-pending-count").textContent=String(sim.cases.filter(c=>c.phase!=="COMPLETE").length);
    if(el("simv2-active-count"))el("simv2-active-count").textContent=String(sim.cases.filter(c=>!["READY","COMPLETE"].includes(c.phase)).length);
  }

  function formalPhaseIndex(c){
    if(!c)return -1;
    if(c.phase==="ATTACKING")return 0;
    if(c.phase==="ANALYZING")return 1;
    if(c.phase==="DECISION_READY")return 2;
    if(["DEFENDING","DEFENSE_DONE"].includes(c.phase))return 3;
    if(["VERIFYING","INTEGRITY_DONE"].includes(c.phase))return 4;
    if(["RECOVERING","RECOVERY_DONE"].includes(c.phase))return 5;
    if(["AUDITING","COMPLETE"].includes(c.phase))return 6;
    return -1;
  }

  function normalizedVisualStage(c){
    if(!c)return"ready";
    if(["ATTACKING"].includes(c.phase))return"attack";
    if(["ANALYZING"].includes(c.phase))return"analysis";
    if(["DECISION_READY"].includes(c.phase))return"decision";
    if(["DEFENDING","DEFENSE_DONE"].includes(c.phase))return"defense";
    if(["VERIFYING","INTEGRITY_DONE"].includes(c.phase))return"verify";
    if(["RECOVERING","RECOVERY_DONE","AUDITING","COMPLETE"].includes(c.phase))return"recover";
    return"ready";
  }

  function stageText(c){
    if(!c)return["等待启动","选择正式场景后，以 SIMULATION 方式回放处理过程","启动模拟攻击"];
    const m=scenarioMeta(c.scenario);
    const recoveryNeeded=!isNotNeeded(c.row.recovery_status)||!isNotNeeded(c.row.recovery_source);
    if(c.phase==="ATTACKING")return[`${m.zh}异常行为已产生`,`SIMULATION：参数化场景形成可观测 U / F / N，不直接修改 AI 输出`,`进入 AI 风险感知`];
    if(c.phase==="ANALYZING")return["AI 风险感知正在进行","AutoEncoder 衡量正常业务偏离 E_AE，LightGBM 随后形成正式 R / A","等待 FORMAL R / A 解锁"];
    if(c.phase==="DECISION_READY")return["Policy 决策已形成","FORMAL R / A 为 AI 输出；Policy Engine 综合 R、D、A、C、Trap 后生成 P","执行当前 P 策略"];
    if(c.phase==="DEFENDING")return["风险自适应主动防御正在执行","SIMULATION：按 P 展示权限 / 密钥 / 网络等策略动作；正式遏制结论读取自事件记录","等待 FORMAL Containment"];
    if(c.phase==="DEFENSE_DONE")return["主动防御结果已记录",`FORMAL · Containment = ${value(c.row.containment)}`,"进入联合完整性验证"];
    if(c.phase==="VERIFYING")return["联合完整性验证正在进行","密码学认证完整性与水印 / 内容指纹证据共同判断数据可信状态","等待 FORMAL Integrity"];
    if(c.phase==="INTEGRITY_DONE")return["联合完整性结果已记录",`FORMAL · Integrity = ${value(c.row.integrity_state)}`,recoveryNeeded?"确认异常，进入条件恢复":"Integrity 正常：Recovery NOT REQUIRED，进入安全评估"];
    if(c.phase==="RECOVERING")return["条件恢复正在进行","仅对确认异常事件展示 Cold Backup → Recovery → Reverify 流程","等待 FORMAL Recovery"];
    if(c.phase==="RECOVERY_DONE")return["恢复与复验结果已记录",`FORMAL · Recovery = ${value(c.row.recovery_status)}`,"进入安全评估与事件确认"];
    if(c.phase==="AUDITING")return["安全评估与反馈正在生成","事件先确认 / 筛选，再读取 Event Pool 与 Pipeline；AI Prediction ≠ Training Label","等待闭环完成"];
    if(c.phase==="COMPLETE")return["事件闭环完成","FORMAL R / A / P、Containment、Integrity、Recovery 与 Pipeline 已解锁","查看完整证据或重新回放"];
    return["等待操作","正式事件已载入","开始风险感知"];
  }

  function visualSignals(c){
    const meta=c?scenarioMeta(c.scenario):null;
    const active=new Set(meta?.signals||[]);
    document.querySelectorAll("#sim-flow-canvas [data-signal]").forEach(node=>{
      const key=node.dataset.signal, on=c&&phaseOrder(c.phase)>=phaseOrder("ANALYZING")&&active.has(key);
      node.classList.toggle("active",!!on);
      const strong=node.querySelector("strong"); if(strong)strong.textContent=on?"已接收":"等待";
    });
  }

  function renderPhaseRail(){
    const host=el("sim-phase-rail"), c=activeCase(); if(!host)return;
    const currentIndex=formalPhaseIndex(c);
    host.innerHTML=PHASES.map(([_,label],i)=>{
      const current=currentIndex===i, done=currentIndex>i || c?.phase==="COMPLETE";
      return `<div class="sim-phase-step ${current?"is-current":""} ${done?"is-done":""}"><i>${done?"✓":String(i+1).padStart(2,"0")}</i><span>${label}</span></div>`;
    }).join("");
  }

  function renderFlow(){
    const c=activeCase(), canvas=el("sim-flow-canvas"); if(!canvas)return;
    const stage=normalizedVisualStage(c), meta=c?scenarioMeta(c.scenario):null;
    canvas.dataset.stage=stage; canvas.dataset.scenario=c?c.scenario:""; canvas.dataset.kind=meta?.kind||"";

    document.querySelectorAll("#sim-flow-canvas [data-node]").forEach(n=>n.classList.remove("active","focus","blocked","trusted","danger"));
    if(c){
      (meta.nodes||[]).forEach(name=>canvas.querySelector(`[data-node="${name}"]`)?.classList.add("active"));
      if(["attack","analysis","decision"].includes(stage)) (meta.nodes||[]).forEach(name=>canvas.querySelector(`[data-node="${name}"]`)?.classList.add("danger"));
      if(stage==="defense") (meta.nodes||[]).forEach(name=>canvas.querySelector(`[data-node="${name}"]`)?.classList.add("blocked"));
    }

    visualSignals(c);
    const analysisVisible=c&&phaseOrder(c.phase)>=phaseOrder("DECISION_READY");
    if(el("sim-flow-r"))el("sim-flow-r").textContent=analysisVisible?risk(c.row.R):"--";
    if(el("sim-flow-a"))el("sim-flow-a").textContent=analysisVisible?value(c.row.A):"待解锁";
    if(el("sim-flow-p"))el("sim-flow-p").textContent=analysisVisible?value(c.row.P):"--";

    const gate=el("sim-defense-gate"), gateLabel=el("sim-defense-gate-label");
    if(gate){gate.className=`sim-defense-gate ${stage==="defense"?"active":""} ${c&&phaseOrder(c.phase)>=phaseOrder("DEFENSE_DONE")?"result":""}`;}
    if(gateLabel){
      if(!c||phaseOrder(c.phase)<phaseOrder("DECISION_READY"))gateLabel.textContent="等待策略";
      else if(c.phase==="DEFENDING")gateLabel.textContent=`执行 ${value(c.row.P)}`;
      else if(phaseOrder(c.phase)>=phaseOrder("DEFENSE_DONE"))gateLabel.textContent=value(c.row.containment);
      else gateLabel.textContent=`建议 ${value(c.row.P)}`;
    }

    if(el("sim-integrity-visual"))el("sim-integrity-visual").textContent=c&&phaseOrder(c.phase)>=phaseOrder("INTEGRITY_DONE")?value(c.row.integrity_state):stage==="verify"?"验证中":"等待";
    if(el("sim-recovery-visual")){
      let x="等待";
      const recoveryNeeded=c&&(!isNotNeeded(c.row.recovery_status)||!isNotNeeded(c.row.recovery_source));
      if(c&&c.phase==="RECOVERING")x="Cold Backup → Recovery";
      else if(c&&["RECOVERY_DONE","AUDITING"].includes(c.phase))x=value(c.row.recovery_status);
      else if(c&&c.phase==="INTEGRITY_DONE"&&!recoveryNeeded)x="NOT REQUIRED";
      else if(c&&c.phase==="COMPLETE")x=`评估 ${value(c.row.event_pool_decision)}`;
      el("sim-recovery-visual").textContent=x;
    }

    const [title,phase,next]=stageText(c);
    if(el("sim-stage-title"))el("sim-stage-title").textContent=title;
    if(el("sim-current-attack"))el("sim-current-attack").textContent=c?scenarioMeta(c.scenario).zh:"尚未启动";
    if(el("sim-current-phase"))el("sim-current-phase").textContent=phase;
    if(el("sim-next-action"))el("sim-next-action").textContent=next;
    if(el("sim-flow-caption"))el("sim-flow-caption").textContent=c?`${scenarioMeta(c.scenario).zh} · SIMULATION = 过程可视化 · FORMAL = results.csv 正式事件输出。`:"选择场景后启动模拟攻击";

    const lanes=el("sim-parallel-lanes");
    if(lanes)lanes.innerHTML=sim.cases.map(item=>`<span class="sim-parallel-lane ${item.id===sim.activeId?"is-current":""} ${item.phase==="COMPLETE"?"is-done":""}">${esc(scenarioLabel(item.scenario))} · ${esc(caseStatus(item))}</span>`).join("");
    renderPhaseRail();
  }

  function decisionRows(c){
    if(!c)return[]; const r=c.row;
    const analysis=phaseOrder(c.phase)>=phaseOrder("DECISION_READY"), defense=phaseOrder(c.phase)>=phaseOrder("DEFENSE_DONE"), integ=phaseOrder(c.phase)>=phaseOrder("INTEGRITY_DONE"), recover=phaseOrder(c.phase)>=phaseOrder("RECOVERY_DONE"), audit=c.phase==="COMPLETE";
    const rows=[["事件 ID",(r.event_id||"").slice(0,18)+(text(r.event_id).length>18?"…":"")],["场景",scenarioLabel(r.scenario)],["数据等级",r.D],["Trap",r.Trap],["风险 R",analysis?risk(r.R):"待解锁",analysis&&text(r.P)==="P3"?"hot":""],["AI 判定 A",analysis?value(r.A):"待解锁"],["策略 P",analysis?value(r.P):"待解锁"]];
    if(defense)rows.push(["遏制结果",value(r.containment),text(r.containment)==="CONTAINED"?"good":text(r.containment)==="FAILED"?"hot":""]);
    if(integ)rows.push(["完整性",value(r.integrity_state),text(r.integrity_state)==="NORMAL"?"good":text(r.integrity_state).includes("ANOMALY")?"hot":""]);
    if(recover)rows.push(["恢复结果",value(r.recovery_status)],["恢复来源",value(r.recovery_source)]);
    if(audit)rows.push(["Event Pool",value(r.event_pool_decision)],["Pipeline",num(r.total_pipeline_ms)!==null?`${Number(r.total_pipeline_ms).toFixed(2)} ms`:"--"]);
    return rows;
  }

  function actionMarkup(c){
    if(!c)return""; const recoveryNeeded=!isNotNeeded(c.row.recovery_status)||!isNotNeeded(c.row.recovery_source);
    if(c.phase==="ATTACKING")return'<button disabled>攻击路径正在形成…</button>';
    if(c.phase==="ANALYZING")return'<button disabled>AI 正在读取正式决策…</button>';
    if(c.phase==="DECISION_READY")return'<button data-sim-action="defend">执行当前策略</button><button class="secondary" data-sim-action="inspect">查看正式事件字段</button>';
    if(c.phase==="DEFENDING")return'<button disabled>主动防御可视化中…</button>';
    if(c.phase==="DEFENSE_DONE")return'<button data-sim-action="verify">验证医疗数据完整性</button>';
    if(c.phase==="VERIFYING")return'<button disabled>完整性验证中…</button>';
    if(c.phase==="INTEGRITY_DONE")return recoveryNeeded?'<button data-sim-action="recover">启动可信恢复</button>':'<button data-sim-action="audit">生成审计结论</button>';
    if(c.phase==="RECOVERING")return'<button disabled>可信恢复可视化中…</button>';
    if(c.phase==="RECOVERY_DONE")return'<button data-sim-action="audit">生成审计结论</button>';
    if(c.phase==="AUDITING")return'<button disabled>正在生成审计结论…</button>';
    if(c.phase==="COMPLETE"){
      const replayLabel=sim.mode==="parallel"?"重新演示本批事件":"重新演示当前攻击";
      return `<button data-sim-action="inspect">查看完整证据</button><button class="secondary" data-sim-action="replay-all">${replayLabel}</button><button class="secondary" data-sim-action="choose-scenario">选择其他攻击场景</button>`;
    }
    return"";
  }

  function renderDecision(){
    const c=activeCase(), panel=el("sim-decision-panel"), zone=el("sim-action-zone"), label=el("sim-decision-state"); if(!panel||!zone||!label)return;
    if(!c){label.textContent="待命";panel.innerHTML='<div class="sim-decision-empty">启动实验后，正式 R / A / P 将按事件生命周期逐步解锁。</div>';zone.innerHTML="";return;}
    label.textContent=caseStatus(c);
    const analysis=phaseOrder(c.phase)>=phaseOrder("DECISION_READY");
    panel.innerHTML=`<span class="sim-decision-kicker">正式风险 R</span><div class="sim-risk-value ${analysis?"":"pending"}">${analysis?risk(c.row.R):"--"}</div><div class="sim-decision-list">${decisionRows(c).map(([k,v,t])=>`<div><span>${esc(k)}</span><b class="${esc(t||"")}">${esc(v)}</b></div>`).join("")}</div>`;
    zone.innerHTML=actionMarkup(c);
  }

  function systemPhase(){
    if(!sim.started)return["就绪",""];
    if(sim.cases.some(c=>c.phase==="DECISION_READY"))return["等待操作员决策","alert"];
    if(sim.cases.some(c=>["ATTACKING","ANALYZING","DEFENDING","VERIFYING","RECOVERING","AUDITING"].includes(c.phase)))return["处理中","warn"];
    if(sim.cases.length&&sim.cases.every(c=>c.phase==="COMPLETE"))return["实验完成",""];
    return["实验进行中","warn"];
  }
  function renderSystem(){const [label,tone]=systemPhase(), holder=el("sim-system-label")?.parentElement;if(el("sim-system-label"))el("sim-system-label").textContent=label;if(holder){holder.classList.remove("warn","alert");if(tone)holder.classList.add(tone);}document.querySelectorAll("[data-sim-mode]").forEach(b=>{b.disabled=sim.started;b.setAttribute("aria-disabled",String(sim.started));});const batch=el("sim-auto-process");if(batch){const eligible=sim.cases.filter(batchEligible).length;batch.disabled=!eligible;batch.classList.toggle("is-ready",eligible>0);const label=batch.querySelector("span");const hint=batch.querySelector("small");if(label)label.textContent=sim.mode==="parallel"?`一键处理 ${eligible||sim.cases.length||0} 个事件`:"一键完成处置";if(hint)hint.textContent=eligible?"自动执行防御 → 完整性 → 条件恢复/审计":"等待正式 R / A 解锁后由 Policy Engine 决策 P";}const evidence=el("sim-open-stream");if(evidence){const ready=!!activeCase()&&activeCase().phase==="COMPLETE";evidence.disabled=!ready;evidence.title=ready?"打开本事件完整证据":"事件闭环完成后可查看";}}

  function setDialogMode(mode="single"){
    const d=el("sim-stream-dialog"); if(!d)return;
    d.dataset.mode=mode;
    const batch=mode==="batch";
    const summary=el("sim-dialog-summary"), phases=el("sim-dialog-phases"), grid=d.querySelector(".sim-dialog-grid"), batchHost=el("sim-dialog-batch"), closeAll=el("sim-close-all-stream");
    if(summary)summary.hidden=batch;
    if(phases)phases.hidden=batch;
    if(grid)grid.hidden=batch;
    if(batchHost)batchHost.hidden=!batch;
    if(closeAll)closeAll.hidden=!batch;
    const kicker=el("sim-stream-dialog-kicker"), title=el("sim-stream-dialog-title");
    if(kicker)kicker.textContent=batch?"批量事件证据视图":"事件证据视图";
    if(title)title.textContent=batch?"多事件处置结果":"完整事件生命周期";
  }

  function renderSingleDialog(){
    const c=activeCase();
    if(el("sim-dialog-summary"))el("sim-dialog-summary").innerHTML=c?`<div><span>当前攻击</span><strong>${esc(scenarioLabel(c.scenario))}</strong></div><div><span>当前阶段</span><strong>${esc(caseStatus(c))}</strong></div><div><span>正式 R</span><strong>${phaseOrder(c.phase)>=phaseOrder("DECISION_READY")?risk(c.row.R):"待解锁"}</strong></div><div><span>策略 P</span><strong>${phaseOrder(c.phase)>=phaseOrder("DECISION_READY")?esc(value(c.row.P)):"待解锁"}</strong></div>`:'<div><span>状态</span><strong>等待实验启动</strong></div>';
    const currentIndex=formalPhaseIndex(c);
    if(el("sim-dialog-phases"))el("sim-dialog-phases").innerHTML=PHASES.map(([_,label],i)=>`<span class="${currentIndex===i?"is-current":""} ${currentIndex>i||c?.phase==="COMPLETE"?"is-done":""}">${i+1}. ${label}</span>`).join("");
    if(el("sim-dialog-log"))el("sim-dialog-log").innerHTML=sim.logs.length?sim.logs.map(i=>`<div class="sim-dialog-log-line ${esc(i.tone)}"><time>${esc(i.time)}</time><b>${esc(i.type)}</b><span>${esc(i.message)}</span></div>`).join(""):'<p>暂无事件记录。</p>';
    if(el("sim-dialog-fields"))el("sim-dialog-fields").innerHTML=c?decisionRows({...c,phase:"COMPLETE"}).map(([k,v,t])=>`<div><span>${esc(k)}</span><strong class="${esc(t||"")}">${esc(v)}</strong></div>`).join(""):'<p>暂无正式事件字段。</p>';
  }

  function batchRecoveryLabel(c){
    const noRecovery=isNotNeeded(c.row.recovery_status)&&isNotNeeded(c.row.recovery_source);
    if(noRecovery)return"NOT REQUIRED";
    return value(c.row.recovery_status,value(c.row.recovery_source,"--"));
  }

  function batchCardMarkup(c,index){
    const containment=value(c.row.containment,"--"), integrity=value(c.row.integrity_state,"--"), recovery=batchRecoveryLabel(c);
    const pipeline=num(c.row.total_pipeline_ms)!==null?Number(c.row.total_pipeline_ms).toFixed(2)+" ms":"--";
    return `<article class="sim-batch-card" data-batch-card-id="${esc(c.id)}">
      <header>
        <div><span>${String(index+1).padStart(2,"0")} · FORMAL EVENT</span><strong>${esc(scenarioLabel(c.scenario))}</strong><small>${esc(c.id)}</small></div>
        <button type="button" class="sim-batch-card-close" data-batch-close-id="${esc(c.id)}" aria-label="关闭 ${esc(scenarioLabel(c.scenario))} 结果">×</button>
      </header>
      <div class="sim-batch-keyline">
        <div><span>AI · R</span><b>${risk(c.row.R)}</b></div>
        <div><span>AI · A</span><b>${esc(value(c.row.A))}</b></div>
        <div><span>POLICY · P</span><b>${esc(value(c.row.P))}</b></div>
      </div>
      <div class="sim-batch-results">
        <div><span>OUTCOME · Containment</span><strong class="${text(containment)==="CONTAINED"?"good":""}">${esc(containment)}</strong></div>
        <div><span>OUTCOME · Integrity</span><strong class="${text(integrity)==="NORMAL"?"good":""}">${esc(integrity)}</strong></div>
        <div><span>OUTCOME · Recovery</span><strong>${esc(recovery)}</strong></div>
        <div><span>OUTCOME · Pipeline</span><strong>${esc(pipeline)}</strong></div>
      </div>
    </article>`;
  }

  function renderBatchDialog(){
    const host=el("sim-dialog-batch"); if(!host)return;
    const cases=(sim.batchDialogIds||[]).map(id=>sim.cases.find(c=>c.id===id)).filter(Boolean);
    if(!cases.length){host.innerHTML='<div class="sim-batch-empty">所有事件结果已关闭。</div>';return;}
    host.innerHTML=`<div class="sim-batch-toolbar"><div><strong>${cases.length} 个事件已完成处置</strong><span>AI 输出 R/A，Policy 输出 P；处置结果独立展示。每张卡可单独关闭，也可一键关闭全部。</span></div><span class="sim-batch-count">${cases.length} / ${sim.cases.length}</span></div><div class="sim-batch-grid">${cases.map(batchCardMarkup).join("")}</div>`;
  }

  function renderDialog(){
    const d=el("sim-stream-dialog");
    if(d?.dataset.mode==="batch")renderBatchDialog();else renderSingleDialog();
  }

  function render(){renderScenarioList();renderQueue();renderFlow();renderDecision();renderSystem();renderLog();}
  function cancelTimelines(){sim.timelines.forEach(t=>{try{t.kill();}catch(_){}});sim.timelines=[];}
  function timeline(){if(window.gsap){const t=window.gsap.timeline();sim.timelines.push(t);return t;}return null;}

  function startSimulation(){
    if(sim.selected.length<selectionMinimum())return;cancelTimelines();sim.started=true;sim.logs=[];sim.cases=sim.selected.map(n=>makeCase(n)).filter(Boolean);sim.activeId=sim.cases[0]?.id||null;
    if(!sim.cases.length){log("系统","所选场景未找到正式事件。","alert");render();return;}
    sim.cases.forEach(c=>c.phase="ATTACKING");
    log("系统",`已载入 ${sim.cases.length} 个 FORMAL 正式事件；后续攻击与处置路径使用 SIMULATION 流程可视化。`);
    sim.cases.forEach(c=>log("攻击",`${scenarioLabel(c.scenario)} 已触发 · ${c.row.event_id}`,"alert")); render();
    const analyze=c=>{c.phase="ANALYZING";log("AI",`${c.row.event_id}: U / F / N 进入 AutoEncoder → E_AE → LightGBM 风险感知链。`);render();};
    const decision=c=>{c.phase="DECISION_READY";log("决策",`${c.row.event_id}: FORMAL AI 输出 R=${risk(c.row.R)}, A=${value(c.row.A)}；Policy Engine 输出 P=${value(c.row.P)}`,text(c.row.P)==="P3"?"alert":"");render();};
    const t=timeline();
    sim.cases.forEach((c,i)=>{if(t){t.call(()=>analyze(c),[],0.65+i*.18);t.call(()=>decision(c),[],1.35+i*.18);}else{setTimeout(()=>analyze(c),650+i*180);setTimeout(()=>decision(c),1350+i*180);}});
  }

  function defend(c){
    if(!c||c.phase!=="DECISION_READY")return;c.phase="DEFENDING";log("策略",`${c.row.event_id}: 执行 ${value(c.row.P)}；Permission / Network 为 SIMULATED。`,"alert");render();
    const finish=()=>{c.phase="DEFENSE_DONE";log("防御",`${c.row.event_id}: containment=${value(c.row.containment)}`,text(c.row.containment)==="CONTAINED"?"good":"alert");render();};
    const t=timeline();if(t)t.call(finish,[],1.05);else setTimeout(finish,1050);
  }
  function verify(c){
    if(!c||c.phase!=="DEFENSE_DONE")return;c.phase="VERIFYING";log("验证",`${c.row.event_id}: 开始读取密码学 + 水印 / 内容指纹联合完整性结果。`);render();
    const finish=()=>{c.phase="INTEGRITY_DONE";log("完整性",`${c.row.event_id}: integrity_state=${value(c.row.integrity_state)}`,text(c.row.integrity_state)==="NORMAL"?"good":"alert");render();};
    const t=timeline();if(t)t.call(finish,[],.9);else setTimeout(finish,900);
  }
  function recover(c){
    if(!c||c.phase!=="INTEGRITY_DONE")return;c.phase="RECOVERING";log("恢复",`${c.row.event_id}: source=${value(c.row.recovery_source)}，确认数据异常，开始可信冷备份恢复可视化。`);render();
    const finish=()=>{c.phase="RECOVERY_DONE";log("恢复",`${c.row.event_id}: recovery_status=${value(c.row.recovery_status)}`,"good");render();};
    const t=timeline();if(t)t.call(finish,[],1.15);else setTimeout(finish,1150);
  }
  function audit(c){
    if(!c||!["INTEGRITY_DONE","RECOVERY_DONE"].includes(c.phase))return;c.phase="AUDITING";log("审计",`${c.row.event_id}: 先执行事件确认 / 筛选，再读取 Event Pool 与 Pipeline 正式字段；AI Prediction 不直接作为 Training Label。`);render();
    const finish=()=>{c.phase="COMPLETE";log("审计",`${c.row.event_id}: pool=${value(c.row.event_pool_decision)}, pipeline=${num(c.row.total_pipeline_ms)!==null?Number(c.row.total_pipeline_ms).toFixed(2)+" ms":"--"}`,"good");render();
      /* Only the final completed result opens automatically. No intermediate popups. */
      if(sim.mode==="single") setTimeout(openDialog,80);
    };
    const t=timeline();if(t)t.call(finish,[],.55);else setTimeout(finish,550);
  }
  function replayAll(){
    if(!sim.cases.length)return;
    const selected=[...new Set(sim.cases.map(c=>c.scenario).filter(Boolean))];
    cancelTimelines();sim.dialogQueue=[];sim.dialogQueueActive=false;sim.batchDialogIds=[];closeDialog();sim.started=false;sim.logs=[];sim.cases=[];sim.activeId=null;
    if(selected.length)sim.selected=sim.mode==="single"?[selected[0]]:selected.slice(0,selectionLimit());
    render();
    setTimeout(startSimulation,120);
  }
  function chooseScenario(){
    cancelTimelines();closeDialog();
    const current=activeCase();
    const selected=current?[current.scenario]:sim.selected;
    sim.started=false;sim.cases=[];sim.activeId=null;sim.logs=[];
    if(sim.mode==="single"&&selected?.length)sim.selected=[selected[0]];
    render();
  }
  function inspect(){openDialog();}

  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function batchEligible(c){return !!c && ["DECISION_READY","DEFENSE_DONE","INTEGRITY_DONE","RECOVERY_DONE"].includes(c.phase);}
  async function autoProcessCase(c){
    if(!c || c.phase==="COMPLETE")return;
    if(c.phase==="DECISION_READY"){
      defend(c); await delay(1200);
    }
    if(c.phase==="DEFENSE_DONE"){
      verify(c); await delay(1050);
    }
    if(c.phase==="INTEGRITY_DONE"){
      const recoveryNeeded=!isNotNeeded(c.row.recovery_status)||!isNotNeeded(c.row.recovery_source);
      if(recoveryNeeded){recover(c); await delay(1300);} else {audit(c); await delay(700);}
    }
    if(c.phase==="RECOVERY_DONE"){
      audit(c); await delay(700);
    }
  }
  async function autoProcessAll(){
    const cases=sim.cases.filter(batchEligible);
    if(!cases.length)return;
    const btn=el("sim-auto-process");
    if(btn){btn.disabled=true;btn.classList.add("running");}
    log("批量处置",`${cases.length} 个事件开始按正式结果自动推进后续处置。`);
    await Promise.all(cases.map((c,i)=>delay(i*120).then(()=>autoProcessCase(c))));
    log("批量处置",`${cases.length} 个事件已推进到可完成的最终状态。`,"good");
    if(btn)btn.classList.remove("running");
    render();
    /* Multi-event execution opens one combined evidence surface. Each event remains an independent card. */
    const completed=cases.filter(c=>c.phase==="COMPLETE");
    if(completed.length){
      sim.dialogQueue=[];
      sim.dialogQueueActive=false;
      setTimeout(()=>openBatchDialog(completed.map(c=>c.id)),100);
    }

  }

  function reset(){cancelTimelines();sim.started=false;sim.cases=[];sim.activeId=null;sim.logs=[];sim.dialogQueue=[];sim.dialogQueueActive=false;sim.batchDialogIds=[];render();}
  function toggleScenario(name){if(sim.started)return;if(sim.mode==="single")sim.selected=[name];else if(sim.selected.includes(name)){if(sim.selected.length>1)sim.selected=sim.selected.filter(x=>x!==name);}else if(sim.selected.length<selectionLimit())sim.selected=[...sim.selected,name];render();}
  function setMode(mode){if(!["single","parallel"].includes(mode)||sim.started)return;reset();sim.mode=mode;sim.selected=mode==="single"?[sim.selected[0]||"IMAGE_LEAKAGE"]:["IMAGE_LEAKAGE","EMR_LEAKAGE","ACCOUNT_ABUSE"];document.querySelectorAll("[data-sim-mode]").forEach(b=>{const on=b.dataset.simMode===mode;b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});render();}

  function openDialog(){const d=el("sim-stream-dialog");if(!d)return;sim.batchDialogIds=[];setDialogMode("single");renderSingleDialog();if(typeof d.showModal==="function")d.showModal();else d.setAttribute("open","");}
  function openBatchDialog(ids){
    const d=el("sim-stream-dialog");if(!d)return;
    sim.batchDialogIds=[...new Set((ids||[]).filter(Boolean))];
    if(!sim.batchDialogIds.length)return;
    setDialogMode("batch");renderBatchDialog();
    if(typeof d.showModal==="function")d.showModal();else d.setAttribute("open","");
  }
  function closeBatchCard(id){
    sim.batchDialogIds=(sim.batchDialogIds||[]).filter(x=>x!==id);
    if(!sim.batchDialogIds.length){closeDialog();return;}
    renderBatchDialog();
  }
  function showNextQueuedDialog(){
    if(!sim.dialogQueueActive)return;
    const id=sim.dialogQueue.shift();
    if(!id){sim.dialogQueueActive=false;return;}
    sim.activeId=id;render();openDialog();
  }
  function closeDialog(){
    const d=el("sim-stream-dialog");if(!d)return;
    sim.dialogQueue=[];sim.dialogQueueActive=false;sim.batchDialogIds=[];
    if(typeof d.close==="function")d.close();else d.removeAttribute("open");
    setDialogMode("single");
  }

  function handleClick(e){
    const mode=e.target.closest("[data-sim-mode]");if(mode){setMode(mode.dataset.simMode);return;}
    const scenario=e.target.closest("[data-scenario]");if(scenario){toggleScenario(scenario.dataset.scenario);return;}
    const row=e.target.closest("[data-case-id]");if(row){sim.activeId=row.dataset.caseId;render();return;}
    const action=e.target.closest("[data-sim-action]");if(action){
      const c=activeCase();
      const map={defend,recover,verify,audit,inspect,"replay-all":replayAll,"choose-scenario":chooseScenario};
      map[action.dataset.simAction]?.(c);return;
    }
    if(e.target.closest("#sim-start")){startSimulation();return;}
    if(e.target.closest("#sim-auto-process")){autoProcessAll();return;}
    if(e.target.closest("#sim-reset")){reset();return;}
    if(e.target.closest("#sim-clear-stream")){clearLog();return;}
    if(e.target.closest("#sim-open-stream")){if(activeCase()?.phase==="COMPLETE")openDialog();return;}
    const batchClose=e.target.closest("[data-batch-close-id]");if(batchClose){closeBatchCard(batchClose.dataset.batchCloseId);return;}
    if(e.target.closest("#sim-close-all-stream")){closeDialog();return;}
    if(e.target.closest("#sim-close-stream")){closeDialog();return;}
  }

  function loadFormalRow(rowIndex){
    const row=state.rows?.[rowIndex];if(!row)return;cancelTimelines();sim.mode="single";sim.selected=[row.scenario];sim.started=true;const c=makeCase(row.scenario,row);if(!c)return;c.phase="ATTACKING";sim.cases=[c];sim.activeId=c.id;sim.logs=[];document.querySelectorAll("[data-sim-mode]").forEach(b=>{const on=b.dataset.simMode==="single";b.classList.toggle("active",on);b.setAttribute("aria-selected",String(on));});log("攻击",`从正式事件样本载入 ${row.event_id}。`,"alert");render();const t=timeline();const a=()=>{c.phase="ANALYZING";render();};const d=()=>{c.phase="DECISION_READY";log("决策",`${c.row.event_id}: FORMAL AI 输出 R=${risk(c.row.R)}, A=${value(c.row.A)}；Policy Engine 输出 P=${value(c.row.P)}`);render();};if(t){t.call(a,[],.55).call(d,[],1.15);}else{setTimeout(a,550);setTimeout(d,1150);}location.hash="#console";
  }

  function mount(){const root=el("sim-lab");if(!root||root.dataset.simMounted==="1")return;root.dataset.simMounted="1";root.addEventListener("click",handleClick);el("sim-stream-dialog")?.addEventListener("click",e=>{if(e.target===e.currentTarget)closeDialog();});render();}

  window.MedShieldSimulationLabV2={mount,render,clearLog,reset,start:startSimulation,autoProcessAll,loadFormalRow,version:VERSION};
  window.addEventListener("medshield:formal-data-ready",()=>{mount();render();});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(mount,0),{once:true});else setTimeout(mount,0);
})();
