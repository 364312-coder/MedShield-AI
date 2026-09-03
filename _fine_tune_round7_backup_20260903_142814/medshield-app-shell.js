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
      "用户、文件与网络行为形成 U / F / N，经 AutoEncoder 产生异常偏离 E_AE，再由 LightGBM 输出 R 与 A；Policy Engine 另行综合 D、C 与 Trap 生成 P0–P3。"
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
      "05 · FORMAL EVIDENCE",
      "用正式实验结果回答“系统是否有效”。",
      "实验验证采用独立子视图：核心结果、场景表现与防御恢复可连续点击切换，不需要在一条长页面中来回拖动。"
    ));
    const shell=document.createElement("div"); shell.className="app-evidence-shell";
    const nav=document.createElement("div"); nav.className="app-evidence-nav";
    const tabs=document.createElement("div"); tabs.className="app-evidence-tabs"; tabs.setAttribute("role","tablist");
    EVIDENCE_TABS.forEach(([k,l])=>tabs.appendChild(evidenceTabButton(k,l)));
    nav.appendChild(tabs); shell.appendChild(nav);

    const metrics=q("#metrics");
    const scenarioPanel=q("#scenario-metrics")?.closest(".metric-panel");
    const policyPanel=q("#policy-metrics")?.closest(".metric-panel");
    const recoveryPanel=q("#recovery-metrics")?.closest(".metric-panel");

    const scenarios=evidenceSection("攻击场景表现","SCENARIO PERFORMANCE","按正式攻击场景查看异常检出表现，用于验证不同异常行为场景下的风险感知能力；场景检出率不等同于异常类型分类 Recall。");
    if(scenarioPanel) moveExisting(scenarioPanel,q(".metrics-layout",scenarios));

    const defense=evidenceSection("防御、完整性与恢复","DEFENSE & RECOVERY","集中查看策略分布、防御处置、完整性与恢复相关正式结果，用于验证检测之后的策略处置闭环是否有效。");
    const defenseLayout=q(".metrics-layout",defense);
    if(policyPanel) moveExisting(policyPanel,defenseLayout);
    if(recoveryPanel) moveExisting(recoveryPanel,defenseLayout);

    const defs=[
      ["metrics",metrics],
      ["scenarios",scenarios],
      ["defense",defense],
      ["events",q("#event-samples")],
      ["assets",q("#assets")],
      ["limits",q("#limits")],
      ["faq",q("#competition-faq")]
    ];
    defs.forEach(([key,node])=>{
      const panel=document.createElement("div"); panel.className="app-evidence-panel"; panel.dataset.evidencePanel=key;
      if(node) moveExisting(node,panel);
      shell.appendChild(panel);
    });

    const metricsLayout=q('[data-evidence-panel="metrics"] .metrics-layout',shell);
    if(metricsLayout){
      const summary=document.createElement("aside");
      summary.className="app-evidence-core-summary";
      summary.innerHTML=`
        <div class="app-core-conclusion"><span>FORMAL FULL RUN</span><strong>98.44%</strong><b>总体 Accuracy</b><p>在 50,000 条正式事件中完成风险感知、策略处置与联合完整性验证，并仅对确认异常事件执行恢复验证。</p></div>
        <div class="app-core-outcomes">
          <div><strong>96.10%</strong><span>攻击遏制率</span></div>
          <div><strong>100%</strong><span>本次正式 run 未见攻击检出率 · 3,000 events</span></div>
        </div>
        <div class="app-core-scale" aria-label="正式实验规模">
          <div><strong>50,000</strong><span>正式事件</span></div>
          <div><strong>15,000</strong><span>攻击事件</span></div>
          <div><strong>3,000</strong><span>未见攻击</span></div>
          <div><strong>18,760</strong><span>受保护资产</span></div>
        </div>
        <div class="app-core-evidence-strip">
          <div><span>完整性异常</span><strong>2 / 2 检出</strong></div>
          <div><span>恢复</span><strong>2 / 2 成功</strong></div>
          <div><span>误阻断率</span><strong>1.28%</strong></div>
        </div>
        <div class="app-core-provenance"><span>FULL RUN</span><b>run_20260826_153334</b><span>Seed 20270130</span><span>CPU</span><span>Corrective Rebuild v1.1.0</span></div>
        <button class="app-core-next" type="button" data-evidence-tab="scenarios">下一步：查看场景表现 →</button>`;
      metricsLayout.appendChild(summary);
    }

    view.appendChild(shell);
    setEvidenceTab(app.evidenceTab,false);
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
