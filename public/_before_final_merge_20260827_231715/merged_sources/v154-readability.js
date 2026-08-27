(function(){
"use strict";

function ready(fn){

  if(document.readyState==="loading"){

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

  /*
   * Older v1.4 / v1.5 animations can leave capability rows
   * with inline autoAlpha/opacity/visibility.
   *
   * Remove only those animation side effects.
   */

  const section =
    document.querySelector(
      ".capability-architecture"
    );

  if(!section){
    return;
  }


  if(window.ScrollTrigger){

    ScrollTrigger.getAll().forEach(function(trigger){

      const target =
        trigger.trigger;

      if(
        target &&
        (
          target.classList?.contains(
            "capability-row"
          ) ||
          section.contains(target)
        )
      ){

        /*
         * Do not kill every animation in the whole page.
         * Only remove capability-row reveal triggers.
         */

        if(
          target.classList?.contains(
            "capability-row"
          )
        ){

          trigger.kill();

        }

      }

    });

  }


  const rows =
    section.querySelectorAll(
      ".capability-row"
    );


  rows.forEach(function(row){

    row.style.opacity = "1";
    row.style.visibility = "visible";
    row.style.filter = "none";
    row.style.transform = "none";


    row.querySelectorAll(
      ".cap-copy, .cap-copy *, .cap-visual"
    ).forEach(function(el){

      el.style.removeProperty(
        "opacity"
      );

      el.style.removeProperty(
        "visibility"
      );

      el.style.removeProperty(
        "filter"
      );

    });

  });


  /*
   * Reintroduce only a very small entrance animation.
   * It ends at full opacity and never leaves rows dimmed.
   */

  if(
    window.gsap &&
    window.ScrollTrigger
  ){

    gsap.registerPlugin(
      ScrollTrigger
    );


    ScrollTrigger.batch(
      ".capability-row",
      {

        start:"top 92%",

        once:true,

        onEnter:function(batch){

          gsap.fromTo(
            batch,
            {
              y:12,
              opacity:.82
            },
            {
              y:0,
              opacity:1,
              duration:.5,
              stagger:.06,
              ease:"power2.out",
              clearProps:"transform,opacity"
            }
          );

        }

      }
    );


    ScrollTrigger.refresh();

  }

});

})();
