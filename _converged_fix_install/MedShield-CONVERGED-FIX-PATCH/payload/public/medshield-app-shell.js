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
    ready:false
  };

  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

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
      "从医疗数据进入系统，到风险研判、策略处置、可信验证与安全反馈，系统围绕基层医院的低成本、可解释与可审计需求组织完整安全链路。"
    ));
    const stage=document.createElement("div");
    stage.className="app-overview-stage";
    stage.innerHTML=`
      <div class="app-overview-flow" aria-label="MedShield-AI 核心闭环">
        <div class="app-overview-node"><span>医疗数据对象</span><strong>EMR / 医学影像</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>风险研判</span><strong>UFN-SAR + LightGBM</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>策略决策</span><strong>D + R + A + C + Trap</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>主动防御</span><strong>P0–P3 分级响应</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>可信验证</span><strong>Integrity + Backup</strong></div><div class="app-overview-arrow">→</div>
        <div class="app-overview-node"><span>反馈闭环</span><strong>Audit + Event Pool</strong></div>
      </div>
      <div class="app-overview-metrics" aria-label="正式实验核心结果">
        <div class="app-overview-metric"><strong>18,760</strong><span>受保护资产</span></div>
        <div class="app-overview-metric"><strong>50,000</strong><span>正式实验事件</span></div>
        <div class="app-overview-metric"><strong>98.44%</strong><span>AI Detection Accuracy</span></div>
        <div class="app-overview-metric"><strong>96.10%</strong><span>Attack Containment</span></div>
      </div>
      <div class="app-overview-foot">
        <article><span>BASELINE PROTECTION</span><h3>常驻保护不是事后补救。</h3><p>AES-256-GCM、数据分级和备份作为基础保护持续存在；风险升高后再由 Policy 收紧权限与访问策略。</p></article>
        <article><span>EVIDENCE FIRST</span><h3>正式结果与过程演示明确区分。</h3><p>R / A / P、遏制、完整性与恢复结论读取正式实验输出；权限和网络处置在当前竞赛系统中明确标注为 SIMULATED。</p></article>
      </div>`;
    view.appendChild(stage);
  }

  function moveRisk(view){
    view.appendChild(pageHead(
      "02 · RISK ASSESSMENT",
      "风险研判，不把 AI 做成黑盒。",
      "用户、文件与网络行为形成 U / F / N 风险输入，经 UFN-SAR 与 LightGBM 产生 R 与 A，并作为 Policy Engine 的正式决策输入。"
    ));
    const features=q("#features");
    const recovery=q(".v14-recovery-story",features||document);
    if(recovery) recovery.remove();
    if(features) view.appendChild(features);
  }

  function moveCapabilities(view,recovery){
    view.appendChild(pageHead(
      "03 · DEFENSE CAPABILITIES",
      "从预防、响应，到可信恢复。",
      "这一视图只解释发现风险之后系统如何保护医疗数据：常驻保护打底，Policy 分级响应，完整性与备份保证事件后的可信闭环。"
    ));
    if(recovery) view.appendChild(recovery);
    const caps=q("#capabilities");
    if(caps) view.appendChild(caps);
  }

  function moveConsole(view){
    const anchor=q("#console");
    const sim=q("#sim-lab");
    if(anchor) view.appendChild(anchor);
    if(sim) view.appendChild(sim);
  }

  function evidenceTabButton(key,label){
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="app-evidence-tab";
    btn.dataset.evidenceTab=key;
    btn.textContent=label;
    return btn;
  }

  function moveEvidence(view){
    view.appendChild(pageHead(
      "05 · FORMAL EVIDENCE",
      "用正式实验结果回答“系统是否有效”。",
      "这里集中展示检测、场景表现、防御、恢复、事件样本与能力边界。前端只读正式 run，不重新训练模型或重算安全决策。"
    ));
    const shell=document.createElement("div"); shell.className="app-evidence-shell";
    const tabs=document.createElement("div"); tabs.className="app-evidence-tabs"; tabs.setAttribute("role","tablist");
    [
      ["metrics","核心结果"],["events","正式事件"],["assets","医疗对象"],["limits","能力边界"],["faq","答辩 FAQ"]
    ].forEach(([k,l])=>tabs.appendChild(evidenceTabButton(k,l)));
    shell.appendChild(tabs);

    const defs=[
      ["metrics","#metrics"],["events","#event-samples"],["assets","#assets"],["limits","#limits"],["faq","#competition-faq"]
    ];
    defs.forEach(([key,selector])=>{
      const panel=document.createElement("div"); panel.className="app-evidence-panel"; panel.dataset.evidencePanel=key;
      const node=q(selector); if(node) panel.appendChild(node);
      shell.appendChild(panel);
    });
    view.appendChild(shell);
    setEvidenceTab(app.evidenceTab,false);
  }

  function setEvidenceTab(key,focus=true){
    if(!["metrics","events","assets","limits","faq"].includes(key)) key="metrics";
    app.evidenceTab=key;
    qa("[data-evidence-tab]",app.shell||document).forEach(b=>{
      const on=b.dataset.evidenceTab===key;
      b.classList.toggle("is-active",on); b.setAttribute("aria-selected",String(on));
    });
    qa("[data-evidence-panel]",app.shell||document).forEach(p=>p.classList.toggle("is-active",p.dataset.evidencePanel===key));
    if(focus) q(`[data-evidence-panel="${key}"]`,app.shell||document)?.scrollIntoView({block:"start"});
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
    try{ if("scrollRestoration" in history) history.scrollRestoration="manual"; }catch(_){}
    /* Competition entry rule: every hard page load starts at Home.
       Internal App Shell clicks still use hash routing normally. */
    history.replaceState({view:"home"},"","#home");
    document.body.classList.add("medshield-shell-ready");
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
    const raw=(location.hash||"").slice(1);
    if(EVIDENCE_LEGACY_TAB[raw]) app.evidenceTab=EVIDENCE_LEGACY_TAB[raw];
    setRoute(routeFromHash(),{push:false,scroll:false});
    if(app.activeView==="home") requestAnimationFrame(()=>window.scrollTo(0,0));
    if(app.activeView==="evidence") setEvidenceTab(app.evidenceTab,false);
    setTimeout(killLegacyScrollStories,80);
    setTimeout(killLegacyScrollStories,500);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",build,{once:true});
  else build();
})();
