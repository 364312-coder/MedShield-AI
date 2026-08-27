
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
  if(!window.gsap || !window.ScrollTrigger){
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Compact risk story:
     keep motion, but prevent long pinned dead zone. */
  const risk = document.querySelector(".v14-risk-story");

  if(risk){
    const rail = document.querySelector(".v14-story-rail");

    if(rail){
      gsap.fromTo(
        rail,
        {autoAlpha:.45,y:10},
        {
          autoAlpha:1,
          y:0,
          duration:.5,
          ease:"power2.out",
          scrollTrigger:{
            trigger:risk,
            start:"top 86%",
            once:true
          }
        }
      );
    }
  }

  /* Dark UI benefits from smaller, purposeful pulses only. */
  gsap.utils.toArray(
    ".capability-row,.queue-panel,.case-panel,.evidence-panel"
  ).forEach(function(el){
    const borderTo = gsap.quickTo(
      el,
      "--v151-hover",
      {duration:.3,ease:"power2.out"}
    );

    el.addEventListener("pointerenter",function(){
      el.style.borderColor="rgba(88,201,231,.20)";
    });

    el.addEventListener("pointerleave",function(){
      el.style.borderColor="";
    });
  });

  ScrollTrigger.refresh();
});

})();
