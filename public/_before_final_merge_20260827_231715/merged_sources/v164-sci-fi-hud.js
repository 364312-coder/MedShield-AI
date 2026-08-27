
(function(){
"use strict";

function ready(fn){
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",fn,{once:true});
  }else{
    fn();
  }
}

ready(function(){
  /*
   * Sci-fi motion is transform-only.
   * No autoAlpha / opacity / scrub.
   */
  if(!window.gsap) return;

  const cards = gsap.utils.toArray(
    ".queue-card, .case-panel [class*='step'], .evidence-panel > div, .metric-card, .evidence-card, .metrics-panel"
  );

  cards.forEach(function(el){
    const yTo = gsap.quickTo(el,"y",{duration:.22,ease:"power3.out"});
    el.addEventListener("pointerenter",function(){ yTo(-1.5); });
    el.addEventListener("pointerleave",function(){ yTo(0); });
  });

  const indicators = gsap.utils.toArray(
    ".console-stats > div::before"
  );

  // No pseudo-element GSAP manipulation: CSS handles status pulse safely.
});
})();
