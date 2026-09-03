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
      "正式实验验证",
      "验证风险感知、策略处置、主动防御、联合完整性与条件恢复是否形成完整闭环；正式实验结论与前端过程可视化严格区分。"
    ));

    const shell=document.createElement("div");
    shell.className="evidence-proof-dashboard evidence-proof-v5";
    shell.dataset.evidenceVersion="EVIDENCE_PROOF_V5";
    shell.setAttribute("aria-label","MedShield-AI 正式实验闭环证据");
    shell.innerHTML=`
      <section class="evidence-proof-run" aria-label="正式实验运行口径">
        <div class="evidence-proof-run__identity">
          <span>FORMAL RUN</span>
          <strong>50,000 Events · 15,000 Attack Events</strong>
          <small>Synthetic / Public Experimental Data</small>
        </div>
        <p>这一页验证的不是单个指标，而是 MedShield-AI 从行为风险感知到策略处置、主动防御、联合完整性验证与条件恢复的完整证据链。</p>
      </section>

      <section class="evidence-proof-flow" aria-label="正式实验安全闭环">
        <div class="evidence-proof-flow__node">
          <span>BEHAVIOR</span>
          <strong>U / F / N</strong>
          <small>行为输入</small>
        </div>
        <i aria-hidden="true">→</i>
        <div class="evidence-proof-flow__node evidence-proof-flow__node--ai">
          <span>AI RISK</span>
          <strong>AE + LightGBM</strong>
          <small>R / A</small>
        </div>
        <i aria-hidden="true">→</i>
        <div class="evidence-proof-flow__node">
          <span>POLICY</span>
          <strong>P0–P3</strong>
          <small>R + D + A + C + Trap</small>
        </div>
        <i aria-hidden="true">→</i>
        <div class="evidence-proof-flow__node evidence-proof-flow__node--good">
          <span>DEFENSE</span>
          <strong>14,415</strong>
          <small>Contained · 96.10%</small>
        </div>
        <i aria-hidden="true">→</i>
        <div class="evidence-proof-flow__node">
          <span>INTEGRITY</span>
          <strong>49,998 NORMAL</strong>
          <small>2 High-confidence Anomalies</small>
        </div>
        <i aria-hidden="true">→</i>
        <div class="evidence-proof-flow__node evidence-proof-flow__node--conditional">
          <span>CONDITIONAL RECOVERY</span>
          <strong>2 / 2</strong>
          <small>Cold Backup → Reverify</small>
        </div>
      </section>

      <div class="evidence-proof-primary">
        <section class="evidence-proof-primary__side evidence-proof-primary__side--detection">
          <div class="evidence-proof-section-label"><span>AI RISK DETECTION</span><small>FORMAL EXPERIMENT OUTPUT</small></div>
          <div class="evidence-proof-hero-metric">
            <strong>98.44%</strong>
            <span>Accuracy</span>
          </div>
          <dl class="evidence-proof-stat-list">
            <div><dt>Precision</dt><dd>98.66%</dd></div>
            <div><dt>Recall</dt><dd>96.10%</dd></div>
            <div><dt>F1 Score</dt><dd>97.36%</dd></div>
            <div><dt>AUC</dt><dd>98.61%</dd></div>
          </dl>
          <div class="evidence-proof-output-note"><span>AI OUTPUT</span><strong>R + A</strong><small>AI 到 R/A 为止，不直接输出处置策略。</small></div>
        </section>

        <section class="evidence-proof-primary__side evidence-proof-primary__side--defense">
          <div class="evidence-proof-section-label"><span>DEFENSE EFFECTIVENESS</span><small>Detection → Policy → Containment</small></div>
          <div class="evidence-proof-hero-metric evidence-proof-hero-metric--defense">
            <strong>14,415</strong>
            <span>Contained</span>
          </div>
          <dl class="evidence-proof-stat-list">
            <div><dt>Attack Events</dt><dd>15,000</dd></div>
            <div class="is-alert"><dt>Failed</dt><dd>585</dd></div>
            <div><dt>Containment</dt><dd>96.10%</dd></div>
            <div><dt>False Blocking</dt><dd>1.28%</dd></div>
          </dl>
          <div class="evidence-proof-output-note"><span>POLICY OUTPUT</span><strong>P0 / P1 / P2 / P3</strong><small>Policy Engine 综合 R、D、A、C、Trap 决策。</small></div>
        </section>
      </div>

      <section class="evidence-proof-coverage" aria-label="攻击场景覆盖">
        <div class="evidence-proof-section-label"><span>ATTACK SCENARIO COVERAGE</span><small>正式场景检出表现</small></div>
        <div class="evidence-proof-coverage__rows">
          <div class="evidence-proof-coverage__row" style="--rate:99.96%"><span>Medical Image Leakage</span><i><b></b></i><strong>≈99.96%</strong></div>
          <div class="evidence-proof-coverage__row" style="--rate:99.50%"><span>EMR Leakage</span><i><b></b></i><strong>99.50%</strong></div>
          <div class="evidence-proof-coverage__row" style="--rate:99.79%"><span>Data Exfiltration</span><i><b></b></i><strong>≈99.79%</strong></div>
          <div class="evidence-proof-coverage__row" style="--rate:99.92%"><span>Multi-source Attack</span><i><b></b></i><strong>≈99.92%</strong></div>
          <div class="evidence-proof-coverage__row" style="--rate:100%"><span>Slow Data Exfiltration</span><i><b></b></i><strong>100.00%</strong></div>
          <div class="evidence-proof-coverage__row is-weak" style="--rate:76.46%"><span>Account Abuse <em>CURRENT LIMITATION</em></span><i><b></b></i><strong>76.46%</strong></div>
        </div>
        <p>Account Abuse 是当前薄弱场景，作为后续行为建模与场景覆盖优化重点；不隐藏弱项，也不将场景检出率解释为异常类型分类 Recall。</p>
      </section>

      <div class="evidence-proof-secondary">
        <section class="evidence-proof-lifecycle">
          <div class="evidence-proof-section-label"><span>INTEGRITY & RECOVERY</span><small>联合完整性 → 条件恢复 → 复验</small></div>
          <div class="evidence-proof-lifecycle__branches">
            <div class="evidence-proof-lifecycle__branch evidence-proof-lifecycle__branch--normal">
              <span>NORMAL DATA</span>
              <strong>49,998</strong>
              <i aria-hidden="true">→</i>
              <b>Recovery Not Required</b>
            </div>
            <div class="evidence-proof-lifecycle__branch evidence-proof-lifecycle__branch--anomaly">
              <span>HIGH-CONFIDENCE ANOMALY</span>
              <strong>2</strong>
              <small>Expected 2 · Detected 2</small>
              <div class="evidence-proof-lifecycle__steps">
                <b>Cold Backup</b><i>→</i><b>Recovery</b><i>→</i><b>Reverify</b>
              </div>
              <div class="evidence-proof-lifecycle__result"><strong>2 / 2 SUCCESS</strong><span>Mean Recovery Pipeline Latency ≈ 9.05 ms</span></div>
            </div>
          </div>
          <p>正式结果只确认 2 个高可信完整性异常并完成 2/2 恢复验证，不额外解释为“医学影像篡改”。</p>
        </section>

        <section class="evidence-proof-policy">
          <div class="evidence-proof-section-label"><span>POLICY DISTRIBUTION</span><small>50,000 events</small></div>
          <div class="evidence-proof-policy__rows">
            <div style="--share:67.71%"><span>P0</span><i><b></b></i><strong>33,854</strong><small>67.71%</small></div>
            <div style="--share:1.40%"><span>P1</span><i><b></b></i><strong>698</strong><small>1.40%</small></div>
            <div style="--share:.81%"><span>P2</span><i><b></b></i><strong>407</strong><small>0.81%</small></div>
            <div class="is-alert" style="--share:30.08%"><span>P3</span><i><b></b></i><strong>15,041</strong><small>30.08%</small></div>
          </div>
          <div class="evidence-proof-policy__equation"><span>POLICY ENGINE</span><strong>R + D + A + C + Trap → P0–P3</strong><small>AI does not directly execute policy.</small></div>
        </section>
      </div>

      <section class="evidence-proof-boundary">
        <div class="evidence-proof-section-label"><span>EVIDENCE BOUNDARY</span><small>可验证，但不夸大</small></div>
        <div class="evidence-proof-boundary__columns">
          <div class="is-implemented">
            <strong>✓ IMPLEMENTED</strong>
            <span>AI Risk Detection · R/A</span>
            <span>Policy Decision · P0–P3</span>
            <span>Integrity Verification Pipeline</span>
            <span>Cold-backup Recovery Workflow</span>
          </div>
          <div class="is-partial">
            <strong>△ PARTIAL / SIMULATED</strong>
            <span>Key Enforcement · PARTIAL</span>
            <span>Permission Actions · SIMULATED</span>
            <span>Network Actions · SIMULATED</span>
          </div>
          <div class="is-unavailable">
            <strong>× UNAVAILABLE / NOT IMPLEMENTED</strong>
            <span>DICOM Embedded Watermark Runtime</span>
            <span>EMR Embedded Watermark Runtime</span>
            <span>Unknown Leaked-image Blind Attribution</span>
            <span>Real HIS / PACS Production Control</span>
          </div>
        </div>
      </section>

      <section class="evidence-proof-feedback">
        <div class="evidence-proof-feedback__main">
          <div class="evidence-proof-section-label"><span>CONFIRMED SECURITY FEEDBACK</span><small>Only confirmed representative events enter the pool</small></div>
          <div class="evidence-proof-feedback__flow">
            <strong>Security Event</strong><i>→</i><strong>Event Confirmation</strong><i>→</i><strong>Security Event Pool</strong><i>→</i><strong>Offline Optimization</strong>
          </div>
          <div class="evidence-proof-feedback__modes"><span>Real Deployment · Admin + Audit</span><span>Demo · Ground Truth</span></div>
        </div>
        <div class="evidence-proof-feedback__facts">
          <div><strong>AI Prediction ≠ Training Label</strong><span>仅确认后的代表性事件进入 Event Pool。</span></div>
          <div><strong>3,000 Unseen Attack Events</strong><span>本次正式实验中检出率 100%</span></div>
          <div><strong>Experimental Boundary</strong><span>Synthetic / Public Experimental Data · Frontend visualization ≠ Production Control</span></div>
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
