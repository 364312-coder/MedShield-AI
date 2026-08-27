(function(){
"use strict";

const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));

function heroProgress(){
  const hero=document.querySelector(".competition-hero");
  if(!hero)return;

  const rect=hero.getBoundingClientRect();
  const travel=Math.max(1,hero.offsetHeight-window.innerHeight);
  const progress=clamp((-rect.top)/travel);

  document.documentElement.style.setProperty(
    "--hero-progress",
    progress.toFixed(4)
  );
}

function prepareWordReveal(){
  const el=document.querySelector(".hero-copy");
  if(!el||el.dataset.motionReady==="1")return;

  const text=el.textContent;
  el.innerHTML="";

  Array.from(text).forEach((char)=>{
    if(/\s/.test(char)){
      el.appendChild(document.createTextNode(char));
      return;
    }

    const span=document.createElement("span");
    span.className="motion-char";
    span.textContent=char;
    el.appendChild(span);
  });

  el.dataset.motionReady="1";
}

function updateWordReveal(){
  const hero=document.querySelector(".competition-hero");
  const chars=document.querySelectorAll(".hero-copy .motion-char");

  if(!hero||!chars.length)return;

  const rect=hero.getBoundingClientRect();
  const travel=Math.max(1,hero.offsetHeight-window.innerHeight);
  const progress=clamp((-rect.top)/travel);

  const local=clamp((progress-.02)/.53);
  const count=Math.floor(chars.length*local);

  chars.forEach((char,index)=>{
    char.classList.toggle("active",index<=count);
  });
}

function ensureRiskBanner(){
  const visual=document.querySelector(
    ".showcase-row:first-child .showcase-visual"
  );

  if(!visual||visual.querySelector(".motion-risk-banner"))return;

  const banner=document.createElement("div");
  banner.className="motion-risk-banner";
  banner.innerHTML=
    '<span id="motion-risk-phase">NORMAL TRAFFIC</span>'+
    '<strong id="motion-risk-value">R = 0.18 · P0</strong>';

  visual.appendChild(banner);
}

function updateRiskStory(){
  const row=document.querySelector(".showcase-row:first-child");
  if(!row)return;

  const score=document.querySelector(".risk-inner strong");
  const riskState=document.querySelector(".risk-inner span");
  const policy=document.querySelector(".risk-meta span:last-child b");
  const phase=document.getElementById("motion-risk-phase");
  const value=document.getElementById("motion-risk-value");
  const banner=document.querySelector(".motion-risk-banner");

  if(!score||!policy||!phase||!value||!banner)return;

  const rect=row.getBoundingClientRect();
  const travel=Math.max(1,row.offsetHeight-window.innerHeight);
  const p=clamp((-rect.top)/travel);

  const stages=[
    {at:0.00,r:"0.18",policy:"P0 · NORMAL",phase:"NORMAL TRAFFIC",state:"LOW RISK"},
    {at:0.20,r:"0.42",policy:"P1 · OBSERVE",phase:"BEHAVIOR SHIFT",state:"OBSERVING"},
    {at:0.40,r:"0.62",policy:"P2 · RESTRICT",phase:"ANOMALY CONFIRMED",state:"MEDIUM RISK"},
    {at:0.62,r:"0.91",policy:"P3 · HIGH",phase:"IMAGE_LEAKAGE",state:"HIGH RISK"},
    {at:0.84,r:"0.91",policy:"P3 · CONTAINED",phase:"DEFENSE EXECUTED",state:"CONTAINED"}
  ];

  let current=stages[0];

  for(const stage of stages){
    if(p>=stage.at)current=stage;
  }

  score.textContent="R = "+current.r;
  policy.textContent=current.policy;

  if(riskState){
    riskState.textContent=current.state;
  }

  phase.textContent=current.phase;
  value.textContent="R = "+current.r+" · "+current.policy;

  banner.classList.toggle("visible",p>.07);
}

function updateRecovery(){
  const row=document.querySelector(".showcase-row.reverse");
  if(!row)return;

  const rect=row.getBoundingClientRect();

  const p=clamp(
    (window.innerHeight*.84-rect.top)/
    (window.innerHeight*.92)
  );

  document.documentElement.style.setProperty(
    "--recovery-progress",
    p.toFixed(4)
  );
}

function updateFooter(){
  const footer=document.querySelector(".competition-footer");
  if(!footer)return;

  const rect=footer.getBoundingClientRect();

  const p=clamp(
    (window.innerHeight-rect.top)/
    (window.innerHeight*.74)
  );

  document.documentElement.style.setProperty(
    "--footer-progress",
    p.toFixed(4)
  );
}

function addMagneticButtons(){
  document.querySelectorAll(
    ".hero-primary,.hero-secondary,.showcase-button,.nav-enter"
  ).forEach((button)=>{

    button.addEventListener("pointermove",(event)=>{
      if(window.innerWidth<900)return;

      const rect=button.getBoundingClientRect();

      const x=
        (event.clientX-rect.left)/rect.width-.5;

      const y=
        (event.clientY-rect.top)/rect.height-.5;

      button.style.transform=
        "translate("+
        (x*5).toFixed(2)+"px,"+
        (y*4-1).toFixed(2)+"px)";
    });

    button.addEventListener("pointerleave",()=>{
      button.style.transform="";
    });

  });
}

function addTilt(){
  document.querySelectorAll(
    ".glass-window,.capability-grid>div"
  ).forEach((card)=>{

    card.addEventListener("pointerenter",()=>{
      card.classList.add("motion-hover");
    });

    card.addEventListener("pointermove",(event)=>{
      if(window.innerWidth<900)return;

      const rect=card.getBoundingClientRect();

      const x=
        (event.clientX-rect.left)/rect.width;

      const y=
        (event.clientY-rect.top)/rect.height;

      const ry=(x-.5)*3.4;
      const rx=(.5-y)*2.6;

      card.style.transform=
        "perspective(1100px) "+
        "rotateX("+rx.toFixed(2)+"deg) "+
        "rotateY("+ry.toFixed(2)+"deg) "+
        "translateY(-2px)";
    });

    card.addEventListener("pointerleave",()=>{
      card.classList.remove("motion-hover");
      card.style.transform="";
    });

  });
}

let ticking=false;

function renderMotion(){
  heroProgress();
  updateWordReveal();
  updateRiskStory();
  updateRecovery();
  updateFooter();
  ticking=false;
}

function schedule(){
  if(ticking)return;
  ticking=true;
  requestAnimationFrame(renderMotion);
}

function init(){
  prepareWordReveal();
  ensureRiskBanner();
  addMagneticButtons();
  addTilt();
  renderMotion();

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
}

if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",init,{once:true});
}else{
  init();
}

})();
