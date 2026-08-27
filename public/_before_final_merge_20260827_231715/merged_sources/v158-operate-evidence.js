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
   * This file intentionally does NOT touch Risk Story.
   */

  if(!window.gsap){
    return;
  }


  /* ------------------------------------------------------
     Queue micro-interaction
     ------------------------------------------------------ */

  gsap.utils.toArray(
    ".queue-panel article,.queue-panel .incident-item"
  ).forEach(function(item){

    const xTo =
      gsap.quickTo(
        item,
        "x",
        {
          duration:.25,
          ease:"power3.out"
        }
      );


    item.addEventListener(
      "pointerenter",
      function(){
        xTo(2);
      }
    );


    item.addEventListener(
      "pointerleave",
      function(){
        xTo(0);
      }
    );

  });


  /* ------------------------------------------------------
     Evidence cards
     ------------------------------------------------------ */

  if(window.ScrollTrigger){

    gsap.registerPlugin(
      ScrollTrigger
    );


    ScrollTrigger.batch(
      ".metric-card,.evidence-card,.metrics-panel",
      {

        start:"top 90%",

        once:true,

        onEnter:function(batch){

          gsap.fromTo(
            batch,
            {
              y:16,
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
