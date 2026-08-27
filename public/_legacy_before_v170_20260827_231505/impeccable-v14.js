
(function(){
"use strict";
function ready(fn){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",fn,{once:true}):fn()}
ready(function(){
  const apiState=document.getElementById("v14-api-state");
  fetch("/api/health",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(d=>{if(apiState)apiState.textContent=d.ok?"ONLINE":"ERROR"}).catch(()=>{if(apiState){apiState.textContent="OFFLINE";apiState.style.color="#ff7a74"}});

  if(!window.gsap||!window.ScrollTrigger){console.warn("GSAP unavailable");return}
  gsap.registerPlugin(ScrollTrigger);
  if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;

  const hero=document.querySelector(".v14-hero");
  const stage=document.querySelector(".v14-hero-stage");
  if(hero&&stage){
    const tl=gsap.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:hero,start:"top top",end:"bottom top",scrub:1,pin:stage,pinSpacing:false}});
    tl.to("#competition-tech-canvas",{scale:1.08,opacity:.42},0)
      .to(".v14-hero .hero-content",{y:-72,scale:.97,autoAlpha:0},0)
      .to(".v14-float-card",{y:-40,autoAlpha:0,stagger:.03},0);
  }

  const risk=document.querySelector(".v14-risk-story");
  if(risk){
    const score=risk.querySelector(".risk-inner strong");
    const state=risk.querySelector(".risk-inner span");
    const policy=risk.querySelector(".risk-meta span:last-child b");
    const rail=gsap.utils.toArray(".v14-story-rail span");
    const stages=[["0.18","LOW RISK","P0 · NORMAL"],["0.42","OBSERVING","P1 · OBSERVE"],["0.62","MEDIUM RISK","P2 · RESTRICT"],["0.91","HIGH RISK","P3 · HIGH"],["0.91","CONTAINED","P3 · CONTAINED"]];
    ScrollTrigger.create({trigger:risk,start:"top top",end:"bottom bottom",scrub:1,onUpdate(self){const i=Math.min(4,Math.floor(self.progress*5)),s=stages[i];if(score)score.textContent="R = "+s[0];if(state)state.textContent=s[1];if(policy)policy.textContent=s[2];rail.forEach((e,j)=>e.classList.toggle("active",j===i))}});
  }

  const recovery=document.querySelector(".v14-recovery-story");
  if(recovery){
    const steps=gsap.utils.toArray(".v14-recovery-rail span");
    gsap.timeline({defaults:{ease:"none"},scrollTrigger:{trigger:recovery,start:"top top",end:"bottom bottom",scrub:1}})
      .fromTo(recovery.querySelector(".glass-window"),{y:42,scale:.94,autoAlpha:.55},{y:0,scale:1,autoAlpha:1,duration:1})
      .to(recovery.querySelector(".anomaly-scan span"),{scale:1.28,duration:1})
      .to(recovery.querySelector(".recovery-result"),{scale:1.04,duration:1});
    ScrollTrigger.create({trigger:recovery,start:"top top",end:"bottom bottom",onUpdate(self){const i=Math.min(4,Math.floor(self.progress*5));steps.forEach((e,j)=>e.classList.toggle("active",j===i))}});
  }
const footer=document.querySelector(".competition-footer .footer-cta");
  if(footer)gsap.to(footer,{y:0,scale:1,autoAlpha:1,duration:1,ease:"power3.out",scrollTrigger:{trigger:footer,start:"top 88%",once:true}});

  gsap.utils.toArray(".hero-primary,.hero-secondary,.showcase-button,.nav-enter").forEach(btn=>{
    const xTo=gsap.quickTo(btn,"x",{duration:.35,ease:"power3.out"}),yTo=gsap.quickTo(btn,"y",{duration:.35,ease:"power3.out"});
    btn.addEventListener("pointermove",e=>{if(innerWidth<900)return;const r=btn.getBoundingClientRect();xTo(((e.clientX-r.left)/r.width-.5)*6);yTo(((e.clientY-r.top)/r.height-.5)*4)});
    btn.addEventListener("pointerleave",()=>{xTo(0);yTo(0)});
  });

  gsap.utils.toArray(".glass-window,.v14-float-card").forEach(card=>{
    const rx=gsap.quickTo(card,"rotationX",{duration:.4,ease:"power3.out"}),ry=gsap.quickTo(card,"rotationY",{duration:.4,ease:"power3.out"});
    card.addEventListener("pointermove",e=>{if(innerWidth<900)return;const r=card.getBoundingClientRect();rx((.5-(e.clientY-r.top)/r.height)*2.8);ry((((e.clientX-r.left)/r.width)-.5)*3.4)});
    card.addEventListener("pointerleave",()=>{rx(0);ry(0)});
  });

  ScrollTrigger.refresh();
});
})();
