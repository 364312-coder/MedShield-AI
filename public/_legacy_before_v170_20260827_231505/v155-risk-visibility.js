(function(){
"use strict";

function ready(fn){

  if(document.readyState === "loading"){

    document.addEventListener(
      "DOMContentLoaded",
      fn,
      { once:true }
    );

  }else{

    fn();

  }

}


ready(function(){

  const risk =
    document.querySelector(
      ".v14-risk-story"
    );

  if(!risk){
    return;
  }


  /*
   * 1. Kill all ScrollTriggers whose trigger belongs to Risk Story.
   * These older triggers are the main reason the section remains dim.
   */

  if(window.ScrollTrigger){

    ScrollTrigger.getAll().forEach(function(st){

      const trigger = st.trigger;

      if(
        trigger === risk ||
        (
          trigger &&
          risk.contains(trigger)
        )
      ){

        st.kill();

      }

    });

  }


  /*
   * 2. Remove GSAP inline alpha/filter/transform remnants.
   */

  const targets = [
    risk,
    ...risk.querySelectorAll("*")
  ];


  targets.forEach(function(el){

    el.style.removeProperty("opacity");
    el.style.removeProperty("visibility");
    el.style.removeProperty("filter");

  });


  /*
   * Do NOT clear transform on every child:
   * some console widgets rely on transform.
   */

  risk.style.opacity = "1";
  risk.style.visibility = "visible";
  risk.style.filter = "none";


  const copy =
    risk.querySelector(
      ".showcase-copy"
    );

  const visual =
    risk.querySelector(
      ".showcase-visual"
    );

  const rail =
    risk.querySelector(
      ".v14-story-rail"
    );


  if(copy){

    copy.style.opacity = "1";
    copy.style.visibility = "visible";

  }


  if(visual){

    visual.style.opacity = "1";
    visual.style.visibility = "visible";

  }


  if(rail){

    rail.style.opacity = "1";
    rail.style.visibility = "visible";

  }


  /*
   * 3. Recreate ONE lightweight entrance.
   * Never leave the section below opacity 1.
   */

  if(
    window.gsap &&
    window.ScrollTrigger
  ){

    gsap.registerPlugin(
      ScrollTrigger
    );


    const tl =
      gsap.timeline({

        scrollTrigger:{

          trigger:risk,

          start:"top 88%",

          once:true

        }

      });


    if(rail){

      tl.fromTo(
        rail,
        {
          y:8,
          autoAlpha:.75
        },
        {
          y:0,
          autoAlpha:1,
          duration:.35,
          ease:"power2.out",
          clearProps:"opacity,visibility,transform"
        }
      );

    }


    if(copy){

      tl.fromTo(
        copy,
        {
          x:-12,
          autoAlpha:.78
        },
        {
          x:0,
          autoAlpha:1,
          duration:.45,
          ease:"power3.out",
          clearProps:"opacity,visibility,transform"
        },
        "-=.20"
      );

    }


    if(visual){

      tl.fromTo(
        visual,
        {
          x:12,
          autoAlpha:.78
        },
        {
          x:0,
          autoAlpha:1,
          duration:.45,
          ease:"power3.out",
          clearProps:"opacity,visibility,transform"
        },
        "-=.38"
      );

    }


    ScrollTrigger.refresh();

  }

});

})();
