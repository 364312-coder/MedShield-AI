(function(){
"use strict";

function ready(fn){
  if(document.readyState === "loading"){
    document.addEventListener(
      "DOMContentLoaded",
      fn,
      {once:true}
    );
  }else{
    fn();
  }
}

ready(function(){

  const risk =
    document.querySelector(".v14-risk-story");

  const recovery =
    document.querySelector(".v14-recovery-story");

  if(window.ScrollTrigger){

    ScrollTrigger.getAll().forEach(function(st){

      const trigger = st.trigger;

      const belongsToRisk =
        risk &&
        trigger &&
        (
          trigger === risk ||
          risk.contains(trigger)
        );

      const belongsToRecovery =
        recovery &&
        trigger &&
        (
          trigger === recovery ||
          recovery.contains(trigger)
        );

      if(
        belongsToRisk ||
        belongsToRecovery
      ){
        st.kill();
      }

    });

  }


  /*
   * Remove all opacity / visibility / filter values
   * written inline by old GSAP animations.
   */

  [risk, recovery].forEach(function(section){

    if(!section){
      return;
    }

    section.style.opacity = "1";
    section.style.visibility = "visible";
    section.style.filter = "none";

    section
      .querySelectorAll("*")
      .forEach(function(el){

        el.style.removeProperty("opacity");
        el.style.removeProperty("visibility");
        el.style.removeProperty("filter");

      });

  });


  /*
   * Rebuild ONLY position-based motion.
   * No autoAlpha.
   * No opacity animation.
   */

  if(
    window.gsap &&
    window.ScrollTrigger &&
    risk
  ){

    gsap.registerPlugin(
      ScrollTrigger
    );

    const rail =
      risk.querySelector(".v14-story-rail");

    const copy =
      risk.querySelector(".showcase-copy");

    const visual =
      risk.querySelector(".showcase-visual");


    if(rail){

      gsap.fromTo(
        rail,
        {
          y:10
        },
        {
          y:0,
          duration:.38,
          ease:"power2.out",
          scrollTrigger:{
            trigger:risk,
            start:"top 88%",
            once:true
          }
        }
      );

    }


    if(copy){

      gsap.fromTo(
        copy,
        {
          x:-14
        },
        {
          x:0,
          duration:.5,
          ease:"power3.out",
          scrollTrigger:{
            trigger:risk,
            start:"top 88%",
            once:true
          }
        }
      );

    }


    if(visual){

      gsap.fromTo(
        visual,
        {
          x:14
        },
        {
          x:0,
          duration:.5,
          ease:"power3.out",
          scrollTrigger:{
            trigger:risk,
            start:"top 88%",
            once:true
          }
        }
      );

    }


    ScrollTrigger.refresh();

  }

});

})();
