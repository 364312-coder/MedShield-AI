(function(){
  "use strict";

  const VERSION = "V2.3-PROCESS-CLARITY";
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const txt = el => (el?.textContent || "").trim();

  const PHASE_REVERSE = {
    "待命":"STANDBY","就绪":"READY","攻击已触发":"ATTACK ACTIVE","AI 风险分析":"ANALYZING",
    "等待策略执行":"DECISION REQUIRED","主动防御中":"DEFENDING","防御结果已读取":"DEFENSE RECORDED",
    "完整性验证中":"VERIFYING","完整性结果已读取":"INTEGRITY RECORDED","可信恢复中":"RECOVERING",
    "恢复结果已读取":"RECOVERY RECORDED","审计生成中":"AUDITING","闭环完成":"COMPLETE"
  };

  const SCENARIO = {
    IMAGE_LEAKAGE:{cn:"医学影像泄露", object:"医学影像资产", signal:"影像访问 / 外传场景"},
    EMR_LEAKAGE:{cn:"电子病历泄露", object:"EMR 数据", signal:"病历访问 / 泄露场景"},
    DATA_EXFILTRATION:{cn:"数据外传", object:"敏感数据流", signal:"异常数据外传场景"},
    ACCOUNT_ABUSE:{cn:"账号滥用", object:"访问上下文", signal:"账号行为异常场景"},
    MULTI_SOURCE_ATTACK:{cn:"多源攻击", object:"多源安全信号", signal:"用户 / 数据 / 网络多源场景"},
    SLOW_DATA_EXFILTRATION:{cn:"慢速数据外传", object:"持续外传数据流", signal:"低速持续外传场景"}
  };

  const PHASE_INDEX = {
    STANDBY:-1,READY:-1,"ATTACK ACTIVE":0,ANALYZING:1,"DECISION REQUIRED":2,
    DEFENDING:3,"DEFENSE RECORDED":3,VERIFYING:4,"INTEGRITY RECORDED":4,
    RECOVERING:4,"RECOVERY RECORDED":4,AUDITING:4,COMPLETE:4
  };

  function phase(){
    const el = $("#sim-decision-state");
    if(!el) return "READY";
    return el.dataset.phaseCode || PHASE_REVERSE[txt(el)] || txt(el) || "READY";
  }

  function scenarioCode(){
    const active = $("#sim-incident-queue .sim-case-row.active");
    if(active?.dataset.scenarioCode) return active.dataset.scenarioCode;
    const selected = $("#sim-scenario-list .sim-scenario-row.selected");
    if(selected?.dataset.scenario) return selected.dataset.scenario;
    const codeNode = active && $(".simv22-case-code",active);
    const code = txt(codeNode);
    return SCENARIO[code] ? code : null;
  }

  function decisionValue(label){
    const rows = $$("#sim-decision-panel .sim-decision-list > div");
    for(const row of rows){
      if(txt($("span",row)) === label) return txt($("b",row));
    }
    return "--";
  }

  function actionText(){
    const btn = $("#sim-action-zone button:not([disabled])");
    return txt(btn) || "等待系统状态推进";
  }

  function storyMessage(p){
    if(p === "READY" || p === "STANDBY") return ["等待实验启动","选择攻击场景后启动事件回放。","启动事件回放"];
    if(p === "ATTACK ACTIVE") return ["攻击事件已进入模拟环境","系统正在把当前正式事件映射到医疗数据流程中。","等待 AI 风险分析"];
    if(p === "ANALYZING") return ["AI 正在读取正式决策","UFN-SAR + LightGBM 读取该事件已经记录的正式结果；前端不重新计算风险。","等待 R / A / P 解锁"];
    if(p === "DECISION REQUIRED") return ["正式决策已经解锁","现在可以直接看到该事件的风险 R、异常类型 A 与策略 P。","执行策略回放"];
    if(p === "DEFENDING") return ["主动防御正在执行","正在可视化正式策略对应的处置阶段；Permission / Network 明确属于 SIMULATED。","等待遏制结果"];
    if(p === "DEFENSE RECORDED") return ["防御结果已经读取","攻击处置结束并不代表医疗数据仍然可信，下一步进入完整性验证。","验证完整性"];
    if(p === "VERIFYING") return ["正在确认医疗数据是否可信","系统正在读取该正式事件的完整性证据与 integrity_state。","等待完整性结果"];
    if(p === "INTEGRITY RECORDED") {
      const next = actionText();
      return ["完整性结果已经读取", next.includes("恢复") ? "正式结果要求进入可信恢复，恢复完成后还要继续审计。" : "本事件无需恢复，可以直接生成审计结论。", next];
    }
    if(p === "RECOVERING") return ["正在进行可信恢复回放","仅在正式 recovery 字段要求恢复时进入该阶段。","等待恢复结果"];
    if(p === "RECOVERY RECORDED") return ["恢复结果已经读取","可信恢复结果已记录，下一步生成审计与 Event Pool 结论。","生成审计结论"];
    if(p === "AUDITING") return ["正在生成本轮审计结论","读取 event_pool_decision 与 pipeline 字段，形成完整闭环。","等待审计完成"];
    if(p === "COMPLETE") return ["本轮攻防闭环已完成","检测、策略、防御、完整性验证以及必要的恢复与审计已经完成。","可重新回放或切换事件"];
    return ["正在推进当前事件","当前状态正在更新。",actionText()];
  }

  function ensureStoryboard(){
    if($("#simv23-storyboard")) return;
    const stage = $("#sim-lab .sim-flow-stage");
    if(!stage) return;
    const anchor = $("#simv22-phase-banner",stage) || $(".sim-flow-head",stage);
    const el = document.createElement("section");
    el.id = "simv23-storyboard";
    el.className = "simv23-storyboard";
    el.setAttribute("aria-label","当前事件处置链路");
    el.innerHTML = `
      <div class="simv23-story-top">
        <div><span>现在发生了什么</span><strong id="simv23-now">等待实验启动</strong><p id="simv23-explain">选择场景后，系统会按照真实事件字段逐阶段解锁结果。</p></div>
        <div class="simv23-next"><span>下一步</span><b id="simv23-next">启动事件回放</b></div>
      </div>
      <div class="simv23-chain" id="simv23-chain">
        <div class="simv23-node" data-v23-step="0"><i>01</i><span>事件触发</span><b id="simv23-n0">正式攻击场景</b></div>
        <div class="simv23-link"><em></em></div>
        <div class="simv23-node" data-v23-step="1"><i>02</i><span>受影响对象</span><b id="simv23-n1">医疗数据资产</b></div>
        <div class="simv23-link"><em></em></div>
        <div class="simv23-node" data-v23-step="2"><i>03</i><span>AI 风险研判</span><b id="simv23-n2">UFN-SAR + LightGBM</b></div>
        <div class="simv23-link"><em></em></div>
        <div class="simv23-node" data-v23-step="3"><i>04</i><span>策略与防御</span><b id="simv23-n3">等待 P0–P3</b></div>
        <div class="simv23-link"><em></em></div>
        <div class="simv23-node" data-v23-step="4"><i>05</i><span>可信验证</span><b id="simv23-n4">完整性 / 恢复 / 审计</b></div>
      </div>
      <div class="simv23-evidence" id="simv23-evidence" aria-live="polite">
        <div><span>风险 R</span><b id="simv23-risk">未解锁</b></div>
        <div><span>异常类型 A</span><b id="simv23-a">未解锁</b></div>
        <div><span>策略 P</span><b id="simv23-p">未解锁</b></div>
        <div><span>遏制结果</span><b id="simv23-containment">未读取</b></div>
        <div><span>完整性</span><b id="simv23-integrity">未验证</b></div>
      </div>`;
    anchor?.insertAdjacentElement("afterend",el);
  }

  function ensureDialogSummary(){
    const panel = $("#sim-event-dialog .simv22-dialog-panel");
    if(!panel || $("#simv23-dialog-summary",panel)) return;
    const legend = $(".simv22-dialog-legend",panel);
    const bar = document.createElement("div");
    bar.id = "simv23-dialog-summary";
    bar.className = "simv23-dialog-summary";
    bar.innerHTML = `
      <div><span>当前攻击</span><b id="simv23-dialog-scenario">--</b></div>
      <div><span>当前阶段</span><b id="simv23-dialog-phase">--</b></div>
      <div><span>风险 R</span><b id="simv23-dialog-risk">--</b></div>
      <div><span>策略 P</span><b id="simv23-dialog-policy">--</b></div>`;
    if(legend) legend.insertAdjacentElement("afterend",bar);
  }

  function sync(){
    ensureStoryboard();
    ensureDialogSummary();
    const board = $("#simv23-storyboard");
    if(!board) return;

    const p = phase();
    const code = scenarioCode();
    const meta = code ? SCENARIO[code] : null;
    const idx = PHASE_INDEX[p] ?? -1;
    const [now,explain,next] = storyMessage(p);

    $("#simv23-now") && ($("#simv23-now").textContent = now);
    $("#simv23-explain") && ($("#simv23-explain").textContent = explain);
    $("#simv23-next") && ($("#simv23-next").textContent = next);
    $("#simv23-n0") && ($("#simv23-n0").textContent = meta ? meta.cn : "正式攻击场景");
    $("#simv23-n1") && ($("#simv23-n1").textContent = meta ? meta.object : "医疗数据资产");

    const risk = decisionValue("风险 R");
    const a = decisionValue("异常类型 A");
    const policy = decisionValue("策略 P");
    const containment = decisionValue("遏制结果");
    const integrity = decisionValue("完整性结果");

    const unlocked = p === "DECISION REQUIRED" || ["DEFENDING","DEFENSE RECORDED","VERIFYING","INTEGRITY RECORDED","RECOVERING","RECOVERY RECORDED","AUDITING","COMPLETE"].includes(p);
    $("#simv23-risk") && ($("#simv23-risk").textContent = unlocked && risk && risk !== "LOCKED" ? risk : "未解锁");
    $("#simv23-a") && ($("#simv23-a").textContent = unlocked && a && a !== "LOCKED" ? a : "未解锁");
    $("#simv23-p") && ($("#simv23-p").textContent = unlocked && policy && policy !== "LOCKED" ? policy : "未解锁");
    $("#simv23-containment") && ($("#simv23-containment").textContent = containment && containment !== "--" ? containment : "未读取");
    $("#simv23-integrity") && ($("#simv23-integrity").textContent = integrity && integrity !== "--" ? integrity : "未验证");

    $("#simv23-n2") && ($("#simv23-n2").textContent = unlocked ? `R ${risk || "--"} · A ${a || "--"}` : "UFN-SAR + LightGBM");
    $("#simv23-n3") && ($("#simv23-n3").textContent = unlocked ? `策略 ${policy || "--"}${containment && containment !== "--" ? ` · ${containment}` : ""}` : "等待 P0–P3");
    $("#simv23-n4") && ($("#simv23-n4").textContent = integrity && integrity !== "--" ? `完整性 ${integrity}` : "完整性 / 恢复 / 审计");

    $$("[data-v23-step]",board).forEach(node=>{
      const n = Number(node.dataset.v23Step);
      node.classList.toggle("active", n === idx && p !== "COMPLETE");
      node.classList.toggle("done", p === "COMPLETE" || (idx >= 0 && n < idx));
      node.classList.toggle("future", idx < 0 || n > idx);
    });
    $$(".simv23-link",board).forEach((link,n)=>{
      link.classList.toggle("done", p === "COMPLETE" || idx > n);
      link.classList.toggle("active", idx === n + 1);
    });

    board.dataset.phase = p;

    const dlgScenario = $("#simv23-dialog-scenario");
    const dlgPhase = $("#simv23-dialog-phase");
    const dlgRisk = $("#simv23-dialog-risk");
    const dlgPolicy = $("#simv23-dialog-policy");
    if(dlgScenario) dlgScenario.textContent = meta ? `${meta.cn} · ${code}` : "--";
    if(dlgPhase) dlgPhase.textContent = now;
    if(dlgRisk) dlgRisk.textContent = unlocked && risk && risk !== "LOCKED" ? risk : "--";
    if(dlgPolicy) dlgPolicy.textContent = unlocked && policy && policy !== "LOCKED" ? policy : "--";

    const action = $("#sim-action-zone");
    if(action) action.dataset.v23Phase = p;
  }

  function init(){
    if(!$("#sim-lab")) return;
    document.documentElement.dataset.simlabClarity = VERSION;
    ensureStoryboard();
    ensureDialogSummary();
    sync();
    let raf = 0;
    const obs = new MutationObserver(()=>{
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    });
    obs.observe($("#sim-lab"),{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","data-phase-code"]});
    const dialog = $("#sim-event-dialog");
    if(dialog) obs.observe(dialog,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
