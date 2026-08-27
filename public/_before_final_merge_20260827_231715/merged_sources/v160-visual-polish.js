
(function(){
"use strict";
function ready(fn){
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",fn,{once:true});
  else fn();
}
ready(function(){
  if(!window.gsap) return;
  gsap.utils.toArray(".queue-card").forEach(function(card){
    const xTo=gsap.quickTo(card,"x",{duration:.22,ease:"power3.out"});
    card.addEventListener("pointerenter",function(){xTo(card.classList.contains("active")?3:2);});
    card.addEventListener("pointerleave",function(){xTo(card.classList.contains("active")?3:0);});
  });
  gsap.utils.toArray(".metric-card,.evidence-card,.metrics-panel,.medical-objects-grid > *,.objects-grid > *,.data-object-grid > *")
    .forEach(function(card){
      const yTo=gsap.quickTo(card,"y",{duration:.24,ease:"power3.out"});
      card.addEventListener("pointerenter",function(){yTo(-2);});
      card.addEventListener("pointerleave",function(){yTo(0);});
    });
});
})();
