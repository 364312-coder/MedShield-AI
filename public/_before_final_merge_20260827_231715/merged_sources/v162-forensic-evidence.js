
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
   * Impeccable/GSAP-performance rule:
   * transform-only micro interactions.
   * No opacity / autoAlpha / ScrollTrigger scrub.
   */
  if(!window.gsap) return;

  gsap.utils.toArray(
    '.case-panel [class*="step"], .evidence-panel > div'
  ).forEach(function(el){

    const xTo = gsap.quickTo(el,"x",{
      duration:.22,
      ease:"power3.out"
    });

    el.addEventListener("pointerenter",function(){
      xTo(2);
    });

    el.addEventListener("pointerleave",function(){
      xTo(0);
    });

  });
});
})();
