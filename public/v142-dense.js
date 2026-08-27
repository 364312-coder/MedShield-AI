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

  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if(reduce){
    return;
  }

  /* --------------------------------------------------------
     Capability architecture entrance
     -------------------------------------------------------- */

  gsap.set(".capability-row",{
    y:24,
    autoAlpha:.28
  });

  ScrollTrigger.batch(".capability-row",{
    start:"top 88%",
    once:true,
    interval:.10,
    batchMax:2,

    onEnter:function(batch){
      gsap.to(batch,{
        y:0,
        autoAlpha:1,
        duration:.72,
        stagger:.10,
        ease:"power3.out",
        overwrite:true
      });
    }
  });

  /* --------------------------------------------------------
     Right-side micro visuals
     -------------------------------------------------------- */

  gsap.utils.toArray(".capability-row").forEach(function(row){

    const visual =
      row.querySelector(".cap-visual");

    if(!visual){
      return;
    }

    gsap.fromTo(
      visual,
      {
        x:22,
        autoAlpha:.58
      },
      {
        x:0,
        autoAlpha:1,
        ease:"none",

        scrollTrigger:{
          trigger:row,
          start:"top 88%",
          end:"center 58%",
          scrub:.65
        }
      }
    );

  });

  /* --------------------------------------------------------
     AI Risk line
     -------------------------------------------------------- */

  const riskLine =
    document.querySelector(".risk-line");

  if(riskLine){

    gsap.set(riskLine,{
      strokeDasharray:440,
      strokeDashoffset:440
    });

    gsap.to(riskLine,{
      strokeDashoffset:0,
      ease:"none",

      scrollTrigger:{
        trigger:".capability-ai",
        start:"top 88%",
        end:"center 55%",
        scrub:.7
      }
    });

  }

  /* --------------------------------------------------------
     Policy P0 -> P3
     -------------------------------------------------------- */

  const levels =
    gsap.utils.toArray(".policy-levels span");

  if(levels.length){

    ScrollTrigger.create({

      trigger:".capability-policy",
      start:"top 82%",
      end:"bottom 45%",

      onUpdate:function(self){

        const index =
          Math.min(
            levels.length - 1,
            Math.floor(self.progress * levels.length)
          );

        levels.forEach(function(level,i){
          level.classList.toggle(
            "active",
            i === index
          );
        });

      }

    });

  }

  /* --------------------------------------------------------
     Defense progress
     -------------------------------------------------------- */

  const contain =
    document.querySelector(".contain-bar i");

  if(contain){

    gsap.set(contain,{
      scaleX:.03,
      transformOrigin:"left center"
    });

    gsap.to(contain,{
      scaleX:1,
      ease:"none",

      scrollTrigger:{
        trigger:".capability-defense",
        start:"top 86%",
        end:"center 55%",
        scrub:.65
      }
    });

  }

  /* --------------------------------------------------------
     Event Pool subtle breathing
     -------------------------------------------------------- */

  const eventCore =
    document.querySelector(".event-core");

  if(eventCore){

    gsap.to(eventCore,{
      scale:1.06,
      duration:1.7,
      repeat:-1,
      yoyo:true,
      ease:"sine.inOut"
    });

  }

  /* --------------------------------------------------------
     Recovery workflow
     No more giant pinned blank screen
     -------------------------------------------------------- */

  const recovery =
    document.querySelector(".v14-recovery-story");

  if(recovery){

    const steps =
      gsap.utils.toArray(
        ".v14-recovery-rail span"
      );

    if(steps.length){

      const tl =
        gsap.timeline({
          repeat:-1,
          repeatDelay:1.2
        });

      steps.forEach(function(step,index){

        tl.call(function(){

          steps.forEach(function(s,i){
            s.classList.toggle(
              "active",
              i === index
            );
          });

        });

        tl.to(
          {},
          {
            duration:.72
          }
        );

      });

    }

  }

  /* --------------------------------------------------------
     Gentle hover depth
     -------------------------------------------------------- */

  gsap.utils.toArray(".capability-row").forEach(function(row){

    const xTo =
      gsap.quickTo(
        row,
        "x",
        {
          duration:.32,
          ease:"power3.out"
        }
      );

    row.addEventListener(
      "pointermove",
      function(e){

        if(window.innerWidth < 900){
          return;
        }

        const rect =
          row.getBoundingClientRect();

        const local =
          (e.clientX - rect.left) /
          rect.width - .5;

        xTo(local * 3);

      }
    );

    row.addEventListener(
      "pointerleave",
      function(){
        xTo(0);
      }
    );

  });

  ScrollTrigger.refresh();

});

})();
