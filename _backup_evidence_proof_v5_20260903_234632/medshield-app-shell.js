(function(){
  "use strict";

  const ROUTES = ["home","overview","risk","capabilities","console","evidence"];
  const LEGACY_ROUTE_MAP = {
    about:"home",features:"risk",assets:"evidence","event-samples":"evidence",metrics:"evidence",limits:"evidence","competition-faq":"evidence"
  };
  const EVIDENCE_LEGACY_TAB = {
    assets:"assets","event-samples":"events",metrics:"metrics",limits:"limits","competition-faq":"faq"
  };

  const app = {
    activeView:"home",
    evidenceTab:"metrics",
    shell:null,
    viewHost:null,
    views:new Map(),
    ready:false,
    undo:[]
  };

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function moveExisting(node,parent){
    if(!node||!parent)return;
    const oldParent=node.parentNode;
    const oldNext=node.nextSibling;
    if(oldParent){
      app.undo.push(()=>{
        try{oldParent.insertBefore(node,oldNext&&oldNext.parentNode===oldParent?oldNext:null);}catch(_){ }
      });
    }
    parent.appendChild(node);
  }

  function rollbackBuild(){
    for(let i=app.undo.length-1;i>=0;i--){try{app.undo[i]();}catch(_){ }}
    app.undo=[];
    try{app.shell?.remove?.();}catch(_){ }
    app.shell=null; app.viewHost=null; app.views.clear(); app.ready=false;
    document.body.classList.remove("medshield-shell-ready","is-home","is-app");
  }

  function routeFromHash(){
    const raw=(location.hash||"#home").slice(1).trim();
    if(ROUTES.includes(raw)) return raw;
    return LEGACY_ROUTE_MAP[raw] || "home";
  }

  function createView(name, className=""){
    const section=document.createElement("section");
    section.className=`app-view app-view-${name} ${className}`.trim();
    section.dataset.view=name;
    section.hidden=true;
    app.viewHost.appendChild(section);
    app.views.set(name,section);
    return section;
  }

  function pageHead(kicker,title,description){
    const el=document.createElement("header");
    el.className="app-page-head";
    el.innerHTML=`<div><span class="eyebrow">${kicker}</span><h1>${title}</h1></div><p>${description}</p>`;
    return el;
  }

  function buildOverview(view){
    view.appendChild(pageHead(
      "01 · SYSTEM OVERVIEW",
      "一条闭环，看懂 MedShield-AI。",
      "医疗数据先按 D1–D3 与 Trap 建立属性并进入 B(D) 常驻保护，再进行风险研判、Policy 决策、主动防御、联合完整性验证、条件恢复与确认反馈。"
    ));
    const stage=document.createElement("div");
    stage.className="app-overview-stage";
    stage.innerHTML=`
      <div class="app-overview-flow" aria-label="MedShield-AI 核心闭环">
        <div class="app-overview-node"><span>医疗数据与属性</span><strong>EMR / 医学影像 · D1–D3 + Trap</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>常驻保护 B(D)</span><strong>AES-256-GCM · 权限 · 水印身份 · 备份</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>风险研判</span><strong>U/F/N → AE → E_AE → LightGBM → R/A</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>策略决策</span><strong>D + R + A + C + Trap → P0–P3</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>防御 · 验证 · 恢复</span><strong>主动防御 → Joint Integrity → 条件恢复</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>确认与反馈</span><strong>Event Confirmation → Event Pool → 离线优化</strong></div>
      </div>
      <div class="app-overview-metrics" aria-label="正式实验核心结果">
        <div class="app-overview-metric"><strong>18,760</strong><span>受保护资产</span></div>
        <div class="app-overview-metric"><strong>50,000</strong><span>正式实验事件</span></div>
        <div class="app-overview-metric"><strong>98.44%</strong><span>AI Detection Accuracy</span></div>
        <div class="app-overview-metric"><strong>96.10%</strong><span>Attack Containment</span></div>
      </div>
      <div class="app-overview-foot">
        <article><span>BASELINE PROTECTION</span><h3>常驻保护不是事后补救。</h3><p>B(D) 常驻安全底线持续存在：AES-256-GCM、权限、密钥、水印 / 内容身份与备份始终启用；风险升高后 Policy 只能继续收紧，不能降低原有保护。</p></article>
        <article><span>EVIDENCE FIRST</span><h3>正式结果与过程演示明确区分。</h3><p>R / A / P、遏制、完整性与恢复结论读取正式实验输出；权限和网络处置在当前竞赛系统中明确标注为 SIMULATED。</p></article>
      </div>`;
    view.appendChild(stage);
  }

  function moveRisk(view){
    view.appendChild(pageHead(
      "02 · RISK ASSESSMENT",
      "风险研判，不把 AI 做成黑盒。",
      "U / F / N 经 AutoEncoder 与 LightGBM 形成正式 R / A；AI 风险感知到此结束。Trap 作为独立 Policy Context，仅进入 Policy Engine。"
    ));
    const features=q("#features");
    if(features) moveExisting(features,view);
  }

  function moveCapabilities(view,recovery){
    view.appendChild(pageHead(
      "03 · DEFENSE CAPABILITIES",
      "从预防、响应，到可信恢复。",
      "这一视图只解释发现风险之后系统如何保护医疗数据：常驻保护打底，Policy 分级响应，完整性与备份保证事件后的可信闭环。"
    ));
    if(recovery) moveExisting(recovery,view);
    const caps=q("#capabilities");
    if(caps) moveExisting(caps,view);
  }

  function moveConsole(view){
    const anchor=q("#console");
    const sim=q("#sim-lab");
    if(anchor) moveExisting(anchor,view);
    if(sim) moveExisting(sim,view);
  }

  function evidenceTabButton(key,label){
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="app-evidence-tab";
    btn.dataset.evidenceTab=key;
    btn.textContent=label;
    return btn;
  }

  const EVIDENCE_TABS = [
    ["metrics","核心结果"],
    ["scenarios","场景表现"],
    ["defense","防御恢复"],
    ["events","正式事件"],
    ["assets","医疗对象"],
    ["limits","能力边界"],
    ["faq","答辩 FAQ"]
  ];

  function evidenceSection(title,kicker,description){
    const section=document.createElement("section");
    section.className="section metrics-section app-evidence-derived";
    section.innerHTML=`<div class="section-head"><span>${kicker}</span><h2>${title}</h2><p>${description}</p></div><div class="metrics-layout"></div>`;
    return section;
  }

  function moveEvidence(view){
    view.appendChild(pageHead(
      "05 · EXPERIMENT VERIFICATION",
      "实验验证 · 正式实验结果与证据",
      "基于正式实验输出验证风险感知、策略处置、完整性与条件恢复效果；过程动画与正式实验结论严格区分，并明确当前能力边界。"
    ));

    const shell=document.createElement("div");
    shell.className="evidence-final-dashboard";
    shell.setAttribute("aria-label","MedShield-AI 正式实验验证总览");
    shell.innerHTML=`
      <div class="evidence-final-legend">
        <div><span>SIMULATION</span><strong>过程可视化</strong><small>Process Visualization</small></div>
        <div><span>FORMAL</span><strong>正式实验输出</strong><small>Experiment Output</small></div>
        <p>动画用于解释处理流程；正式结论读取自实验结果，不在浏览器重新训练模型。</p>
      </div>

      <section class="evidence-final-block evidence-final-core">
        <div class="evidence-final-block-head"><span>01</span><strong>核心指标 · AI 检测性能与处置效果</strong><b>FORMAL · EXPERIMENT OUTPUT</b></div>
        <div class="evidence-final-metric-row">
          <div><span>Accuracy</span><strong>98.44%</strong><small>准确率</small></div>
          <div><span>Precision</span><strong>98.66%</strong><small>精确率</small></div>
          <div><span>Recall</span><strong>96.10%</strong><small>召回率</small></div>
          <div><span>F1 Score</span><strong>97.36%</strong><small>F1 得分</small></div>
          <div><span>AUC</span><strong>98.61%</strong><small>ROC AUC</small></div>
          <div class="is-alert"><span>Attack Containment</span><strong>96.10%</strong><small>攻击遏制成功率</small></div>
        </div>
      </section>

      <div class="evidence-final-grid evidence-final-grid--upper">
        <section class="evidence-final-block evidence-final-scenarios">
          <div class="evidence-final-block-head"><span>02</span><strong>场景表现 · 六类攻击场景检出率</strong><b>FORMAL</b></div>
          <div class="evidence-final-scenario-grid">
            <div><span>Image Leakage</span><strong>≈99.96%</strong><small>医学影像外传</small></div>
            <div><span>EMR Leakage</span><strong>99.50%</strong><small>EMR 数据泄露</small></div>
            <div><span>Data Exfiltration</span><strong>≈99.79%</strong><small>数据外传</small></div>
            <div><span>Multi-source Attack</span><strong>≈99.92%</strong><small>多源协同攻击</small></div>
            <div><span>Slow Data Exfiltration</span><strong>100%</strong><small>慢速数据外传</small></div>
            <div class="is-weak"><span>Account Abuse</span><strong>76.46%</strong><small>当前弱场景</small></div>
          </div>
          <p class="evidence-final-note">Account Abuse 为当前弱场景，后续重点优化行为建模与对抗样本覆盖；场景检出率不等同于异常类型分类 Recall。</p>
        </section>

        <section class="evidence-final-block evidence-final-containment">
          <div class="evidence-final-block-head"><span>03</span><strong>正式处置结果 · Detection → Policy → Containment</strong><b>FORMAL</b></div>
          <div class="evidence-final-containment-body">
            <div class="evidence-final-outcome-list">
              <div><span>攻击事件总数</span><strong>15,000</strong></div>
              <div><span>成功遏制</span><strong>14,415</strong><small>96.10%</small></div>
              <div class="is-alert"><span>未成功遏制</span><strong>585</strong><small>3.90%</small></div>
              <div><span>误阻断率</span><strong>1.28%</strong></div>
            </div>
            <div class="evidence-final-policy">
              <div class="evidence-final-policy-bar" aria-label="P0 67.71%, P1 1.40%, P2 0.81%, P3 30.08%">
                <i style="--share:67.708%"></i><i style="--share:1.396%"></i><i style="--share:.814%"></i><i style="--share:30.082%"></i>
              </div>
              <div class="evidence-final-policy-list">
                <div><span>P0</span><strong>33,854</strong><small>67.71%</small></div>
                <div><span>P1</span><strong>698</strong><small>1.40%</small></div>
                <div><span>P2</span><strong>407</strong><small>0.81%</small></div>
                <div><span>P3</span><strong>15,041</strong><small>30.08%</small></div>
              </div>
              <p>Policy 由 R / D / A / C / Trap 综合决策，AI 不直接执行防御策略。</p>
            </div>
          </div>
        </section>
      </div>

      <div class="evidence-final-grid evidence-final-grid--lower">
        <section class="evidence-final-block evidence-final-integrity">
          <div class="evidence-final-block-head"><span>04</span><strong>完整性验证与条件恢复 · 数据完整性生命周期</strong><b>FORMAL</b></div>
          <div class="evidence-final-integrity-stats">
            <div><span>Integrity NORMAL</span><strong>49,998</strong></div>
            <div class="is-alert"><span>High-confidence anomaly</span><strong>2</strong></div>
            <div><span>Expected anomaly</span><strong>2</strong></div>
            <div class="is-alert"><span>Detected anomaly</span><strong>2</strong></div>
            <div><span>Recovery requested</span><strong>2</strong></div>
            <div><span>Attempted</span><strong>2</strong></div>
            <div><span>Success</span><strong>2</strong></div>
            <div><span>Cold backup</span><strong>2</strong></div>
          </div>
          <div class="evidence-final-recovery-flow">
            <div><strong>Integrity = NORMAL</strong><span>Recovery Not Required</span></div>
            <div class="is-alert"><strong>Integrity Anomaly Detected</strong><span>Affected Data → Cold Backup → Recovery → Reverify</span></div>
            <div><strong>Mean Recovery Pipeline Latency</strong><span>≈ 9.05 ms</span></div>
          </div>
          <p class="evidence-final-note">正式结果仅确认 2 个高可信完整性异常并完成 2/2 恢复验证；不将其额外解释为“医学影像篡改”。</p>
        </section>

        <section class="evidence-final-block evidence-final-boundary">
          <div class="evidence-final-block-head"><span>05</span><strong>能力边界 · Capability Boundary</strong><b>FORMAL</b></div>
          <div class="evidence-final-boundary-grid">
            <div class="is-ok"><strong>IMPLEMENTED</strong><span>AI 风险检测 R / A</span><span>Policy 决策 P0–P3</span><span>完整性验证流水线</span><span>冷备份恢复流程</span></div>
            <div class="is-partial"><strong>PARTIAL / SIMULATED</strong><span>Key Enforcement · PARTIAL</span><span>Permission Actions · SIMULATED</span><span>Network Actions · SIMULATED</span></div>
            <div class="is-unavailable"><strong>UNAVAILABLE / NOT IMPLEMENTED</strong><span>DICOM embedded watermark runtime</span><span>EMR embedded watermark runtime</span><span>Unknown leaked-image blind attribution</span><span>Real HIS / PACS control</span></div>
          </div>
        </section>
      </div>

      <section class="evidence-final-block evidence-final-eventpool">
        <div class="evidence-final-block-head"><span>06</span><strong>事件确认与事件池 · Event Pool</strong><b>CONFIRMED FEEDBACK ONLY</b></div>
        <div class="evidence-final-eventpool-body">
          <div class="evidence-final-event-flow"><span>Security Event</span><i>→</i><span>Event Confirmation</span><i>→</i><span>Security Event Pool</span></div>
          <div><strong>真实部署</strong><span>管理员 + 审计确认</span><strong>Demo</strong><span>Ground Truth 确认</span></div>
          <div class="is-principle"><strong>AI Prediction ≠ Training Label</strong><span>仅确认后的代表性事件进入 Event Pool，并用于周期性离线优化。</span></div>
          <div><strong>3,000 个未见攻击事件</strong><span>本次正式实验中检出率 100%</span></div>
          <div><strong>Synthetic / Public Experimental Data</strong><span>Frontend visualization ≠ Production Control</span></div>
        </div>
      </section>
    `;
    view.appendChild(shell);
  }

  function setEvidenceTab(key,focus=true){
    const keys=EVIDENCE_TABS.map(([k])=>k);
    if(!keys.includes(key)) key="metrics";
    app.evidenceTab=key;
    qa("[data-evidence-tab]",app.shell||document).forEach(b=>{
      const on=b.dataset.evidenceTab===key;
      b.classList.toggle("is-active",on); b.setAttribute("aria-selected",String(on));
    });
    qa("[data-evidence-panel]",app.shell||document).forEach(p=>{
      const on=p.dataset.evidencePanel===key;
      p.classList.toggle("is-active",on);
      if(on) p.scrollTop=0;
    });
    if(focus && app.activeView==="evidence"){
      const active=q(`[data-evidence-panel="${key}"]`,app.shell||document);
      if(active) active.scrollTop=0;
    }
  }


  function killLegacyScrollStories(){
    try{
      if(!window.ScrollTrigger || !ScrollTrigger.getAll) return;
      ScrollTrigger.getAll().forEach(st=>{
        const trigger=st?.trigger;
        if(trigger && app.shell?.contains(trigger)) st.kill(false);
      });
      ScrollTrigger.refresh(true);
    }catch(_){/* non-fatal */}
  }

  function updateNav(route){
    qa(".competition-nav-links [data-route]").forEach(a=>a.classList.toggle("is-active",a.dataset.route===route));
    const enter=q(".nav-enter");
    if(enter){
      if(route==="home"){
        enter.href="#overview"; enter.dataset.route="overview"; enter.firstChild.nodeValue="进入系统 ";
      }else{
        enter.href="#console"; enter.dataset.route="console"; enter.firstChild.nodeValue="动态演示 ";
      }
    }
  }

  function setRoute(route,{push=false,scroll=true}={}){
    if(!ROUTES.includes(route)) route="home";
    if(push && location.hash!==`#${route}`) history.pushState({view:route},"",`#${route}`);
    app.activeView=route;
    document.body.classList.toggle("is-home",route==="home");
    document.body.classList.toggle("is-app",route!=="home");
    app.views.forEach((view,name)=>{
      const on=name===route;
      view.hidden=!on; view.classList.toggle("is-active",on); view.inert=!on;
    });
    updateNav(route);
    if(scroll) window.scrollTo({top:0,left:0,behavior:"auto"});
    try{window.ScrollTrigger?.refresh?.(true);}catch(_){ }
  }

  function wireEvents(){
    document.addEventListener("click",e=>{
      const tab=e.target.closest("[data-evidence-tab]");
      if(tab){e.preventDefault();setEvidenceTab(tab.dataset.evidenceTab);return;}
      const link=e.target.closest("[data-route]");
      if(link){
        e.preventDefault();
        const route=link.dataset.route;
        setRoute(route,{push:true,scroll:true});
      }
    });
    window.addEventListener("hashchange",()=>{
      const raw=(location.hash||"").slice(1);
      if(EVIDENCE_LEGACY_TAB[raw]) app.evidenceTab=EVIDENCE_LEGACY_TAB[raw];
      const route=routeFromHash();
      setRoute(route,{push:false,scroll:true});
      if(route==="evidence" && EVIDENCE_LEGACY_TAB[raw]) setEvidenceTab(EVIDENCE_LEGACY_TAB[raw],false);
    });
    window.addEventListener("popstate",()=>setRoute(routeFromHash(),{push:false,scroll:true}));
  }

  function build(){
    if(app.ready) return;
    try{
    try{ if("scrollRestoration" in history) history.scrollRestoration="manual"; }catch(_){}
    /* Preserve the current valid view. Only a blank/unknown hash starts at Home. */
    const initialRaw=(location.hash||"").slice(1).trim();
    if(!initialRaw || (!ROUTES.includes(initialRaw) && !LEGACY_ROUTE_MAP[initialRaw])){
      history.replaceState({view:"home"},"","#home");
    }
    app.undo=[];
    const shell=document.createElement("div"); shell.id="medshield-app-shell";
    const host=document.createElement("div"); host.className="app-view-host"; shell.appendChild(host);
    app.shell=shell; app.viewHost=host;
    const hero=q("#about");
    (hero?.nextElementSibling || document.body.firstChild)?.before?.(shell);
    if(!shell.isConnected) document.body.appendChild(shell);

    createView("overview"); createView("risk"); createView("capabilities"); createView("console"); createView("evidence");
    buildOverview(app.views.get("overview"));
    const recovery=q(".v14-recovery-story");
    moveRisk(app.views.get("risk"));
    moveCapabilities(app.views.get("capabilities"),recovery);
    moveConsole(app.views.get("console"));
    moveEvidence(app.views.get("evidence"));

    const navBrand=q(".competition-nav .competition-brand");
    if(navBrand){ navBrand.href="#home"; navBrand.dataset.route="home"; }

    wireEvents();
    app.ready=true;
    document.body.classList.add("medshield-shell-ready");
    const raw=(location.hash||"").slice(1);
    if(EVIDENCE_LEGACY_TAB[raw]) app.evidenceTab=EVIDENCE_LEGACY_TAB[raw];
    setRoute(routeFromHash(),{push:false,scroll:false});
    if(app.activeView==="home") requestAnimationFrame(()=>window.scrollTo(0,0));
    if(app.activeView==="evidence") setEvidenceTab(app.evidenceTab,false);
    setTimeout(killLegacyScrollStories,80);
    setTimeout(killLegacyScrollStories,500);
    }catch(error){
      console.error("[MedShield App Shell] initialization failed; restoring legacy page.",error);
      rollbackBuild();
    }
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build,{once:true});
  else build();
})();
