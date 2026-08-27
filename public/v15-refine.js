
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

  const reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if(reduce){
    return;
  }

  /* ------------------------------------------------------
     Hero -> Risk handoff
     ------------------------------------------------------ */

  const hero = document.querySelector(".v14-hero");
  const heroContent = document.querySelector(".v14-hero .hero-content");
  const floats = gsap.utils.toArray(".v14-float-card");
  const runtime = document.querySelector(".v14-runtime-strip");
  const marquee = document.querySelector(
    ".competition-marquee,.trust-marquee,.capability-marquee"
  );
  const risk = document.querySelector(".v14-risk-story");

  if(hero && heroContent){
    gsap.timeline({
      defaults:{ease:"none"},
      scrollTrigger:{
        trigger:hero,
        start:"top top",
        end:"bottom top",
        scrub:.9
      }
    })
    .to(heroContent,{y:-64,autoAlpha:0,duration:.32},.42)
    .to(floats,{y:-34,autoAlpha:0,duration:.22,stagger:.02},.50)
    .to(runtime,{y:-18,autoAlpha:0,duration:.18},.56);

    if(marquee){
      gsap.to(marquee,{
        autoAlpha:.08,
        y:-10,
        ease:"none",
        scrollTrigger:{
          trigger:hero,
          start:"55% top",
          end:"bottom top",
          scrub:.7
        }
      });
    }
  }

  if(risk){
    gsap.fromTo(
      risk,
      {autoAlpha:.25,y:38},
      {
        autoAlpha:1,
        y:0,
        ease:"none",
        scrollTrigger:{
          trigger:risk,
          start:"top 92%",
          end:"top 58%",
          scrub:.7
        }
      }
    );
  }

  /* ------------------------------------------------------
     Recovery compact state sequencer
     ------------------------------------------------------ */

  const recovery = document.querySelector(".v14-recovery-story");
  if(recovery){
    const steps = gsap.utils.toArray(".v14-recovery-rail span");

    if(steps.length){
      let current = 0;

      const activate = (index)=>{
        steps.forEach((el,i)=>{
          el.classList.toggle("active",i===index);
        });
      };

      activate(0);

      const cycle = gsap.timeline({
        repeat:-1,
        repeatDelay:1.1
      });

      steps.forEach((_,i)=>{
        cycle.call(()=>activate(i));
        cycle.to({}, {duration:.72});
      });
    }
  }

  /* ------------------------------------------------------
     Operate mode navigation hint
     ------------------------------------------------------ */

  const consoleEl = document.querySelector(
    "#console,.incident-console,.response-console"
  );
  const nav = document.querySelector(
    ".competition-nav,.site-nav,header nav"
  );

  if(consoleEl && nav){
    ScrollTrigger.create({
      trigger:consoleEl,
      start:"top 25%",
      end:"bottom top",
      onEnter:()=>nav.classList.add("operate-mode"),
      onEnterBack:()=>nav.classList.add("operate-mode"),
      onLeave:()=>nav.classList.remove("operate-mode"),
      onLeaveBack:()=>nav.classList.remove("operate-mode")
    });
  }

  /* ------------------------------------------------------
     Asset cards: restrained hover depth
     ------------------------------------------------------ */

  gsap.utils.toArray(
    ".medical-objects-grid>*,.objects-grid>*,.data-object-grid>*"
  ).forEach(card=>{
    const yTo=gsap.quickTo(card,"y",{duration:.35,ease:"power3.out"});
    card.addEventListener("pointerenter",()=>yTo(-4));
    card.addEventListener("pointerleave",()=>yTo(0));
  });

  /* ------------------------------------------------------
     Evidence reveal
     ------------------------------------------------------ */

  ScrollTrigger.batch(
    ".metric-card,.evidence-card,.metrics-panel",
    {
      start:"top 88%",
      once:true,
      onEnter(batch){
        gsap.fromTo(
          batch,
          {y:22,autoAlpha:.45},
          {
            y:0,
            autoAlpha:1,
            duration:.72,
            stagger:.08,
            ease:"power3.out"
          }
        );
      }
    }
  );

  ScrollTrigger.refresh();
});

})();
