
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

  const risk = document.querySelector(".v14-risk-story");
  if(!risk){
    return;
  }

  /* Existing v1.4/v1.5 ScrollTriggers were created for a long pinned scene.
     Kill only the triggers attached to this section/children, then replace
     them with one compact entrance animation. */
  ScrollTrigger.getAll().forEach(function(t){
    const trigger = t.trigger;
    if(
      trigger === risk ||
      (trigger && risk.contains(trigger))
    ){
      t.kill();
    }
  });

  const rail = risk.querySelector(".v14-story-rail");
  const copy = risk.querySelector(".showcase-copy");
  const visual = risk.querySelector(".showcase-visual");

  const tl = gsap.timeline({
    scrollTrigger:{
      trigger:risk,
      start:"top 82%",
      once:true
    }
  });

  if(rail){
    tl.fromTo(
      rail,
      {y:14,autoAlpha:.35},
      {y:0,autoAlpha:1,duration:.45,ease:"power2.out"}
    );
  }

  if(copy){
    tl.fromTo(
      copy,
      {x:-18,autoAlpha:.55},
      {x:0,autoAlpha:1,duration:.52,ease:"power3.out"},
      "-=.25"
    );
  }

  if(visual){
    tl.fromTo(
      visual,
      {x:20,autoAlpha:.55},
      {x:0,autoAlpha:1,duration:.58,ease:"power3.out"},
      "-=.48"
    );
  }

  /* Compact state progression: advance 01–05 over this single section
     without requiring an extra viewport of empty scroll space. */
  const steps = gsap.utils.toArray(".v14-story-rail span");
  const score = risk.querySelector(".risk-inner strong");
  const state = risk.querySelector(".risk-inner span");
  const policy = risk.querySelector(".risk-meta span:last-child b");

  const stages = [
    ["0.18","LOW RISK","P0 · NORMAL"],
    ["0.42","OBSERVING","P1 · OBSERVE"],
    ["0.62","MEDIUM RISK","P2 · RESTRICT"],
    ["0.91","HIGH RISK","P3 · HIGH"],
    ["0.91","CONTAINED","P3 · CONTAINED"]
  ];

  if(steps.length){
    ScrollTrigger.create({
      trigger:risk,
      start:"top 72%",
      end:"bottom 28%",
      scrub:.55,
      onUpdate:function(self){
        const idx = Math.min(
          stages.length - 1,
          Math.floor(self.progress * stages.length)
        );

        const s = stages[idx];

        steps.forEach(function(el,i){
          el.classList.toggle("active",i===idx);
        });

        if(score) score.textContent = "R = " + s[0];
        if(state) state.textContent = s[1];
        if(policy) policy.textContent = s[2];
      }
    });
  }

  ScrollTrigger.refresh();
});

})();
