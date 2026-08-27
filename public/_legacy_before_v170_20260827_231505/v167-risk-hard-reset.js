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
    document.querySelector(
      ".v14-risk-story"
    );


  const recovery =
    document.querySelector(
      ".v14-recovery-story"
    );


  if(!risk){
    return;
  }


  /*
   ==========================================================
   1. 找到 Risk Story 的真实父级链
   ==========================================================
  */

  const protectedNodes = new Set();


  function protect(el){

    if(!el){
      return;
    }


    protectedNodes.add(el);


    el.style.setProperty(
      "opacity",
      "1",
      "important"
    );


    el.style.setProperty(
      "visibility",
      "visible",
      "important"
    );


    el.style.setProperty(
      "filter",
      "none",
      "important"
    );


    el.style.setProperty(
      "mix-blend-mode",
      "normal",
      "important"
    );

  }


  protect(risk);
  protect(recovery);


  /*
   Risk 上面最多检查 5 层。

   一旦碰到 body 就停止，
   避免影响全站。
  */

  let parent =
    risk.parentElement;


  let depth = 0;


  while(
    parent &&
    parent !== document.body &&
    depth < 5
  ){

    protect(parent);

    parent =
      parent.parentElement;

    depth++;

  }


  /*
   ==========================================================
   2. 清理旧 GSAP inline styles
   ==========================================================
  */

  [
    risk,
    ...risk.querySelectorAll("*")
  ].forEach(function(el){

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


  /*
   清理后重新锁定关键节点
  */

  protect(risk);

  protect(
    risk.querySelector(
      ".showcase-copy"
    )
  );

  protect(
    risk.querySelector(
      ".showcase-visual"
    )
  );

  protect(
    risk.querySelector(
      ".v14-story-rail"
    )
  );

  protect(recovery);


  /*
   ==========================================================
   3. Kill 所有与这一段有关的旧 ScrollTrigger
   ==========================================================
  */

  if(window.ScrollTrigger){

    ScrollTrigger
      .getAll()
      .forEach(function(st){

        const trigger =
          st.trigger;


        const pin =
          st.pin;


        const belongsToRisk =

          trigger === risk ||

          (
            trigger &&
            risk.contains(trigger)
          ) ||

          (
            trigger &&
            trigger.contains &&
            trigger.contains(risk)
          ) ||

          pin === risk ||

          (
            pin &&
            pin.contains &&
            pin.contains(risk)
          );


        const belongsToRecovery =

          recovery &&

          (
            trigger === recovery ||

            (
              trigger &&
              recovery.contains(trigger)
            ) ||

            pin === recovery
          );


        if(
          belongsToRisk ||
          belongsToRecovery
        ){

          st.kill(
            true
          );

        }

      });

  }


  /*
   ==========================================================
   4. 清掉 GSAP data，避免旧 tween 再把 opacity 写回来
   ==========================================================
  */

  if(window.gsap){

    gsap.killTweensOf(
      risk
    );


    gsap.killTweensOf(
      risk.querySelectorAll("*")
    );


    if(recovery){

      gsap.killTweensOf(
        recovery
      );


      gsap.killTweensOf(
        recovery.querySelectorAll("*")
      );

    }

  }


  /*
   ==========================================================
   5. 再次强制最终状态
   ==========================================================
  */

  requestAnimationFrame(
    function(){

      protectedNodes.forEach(
        protect
      );


      risk
        .querySelectorAll(
          ".showcase-copy, .showcase-visual, .glass-window, .v14-story-rail"
        )
        .forEach(
          protect
        );


      if(window.ScrollTrigger){

        ScrollTrigger.refresh();

      }

    }
  );


  /*
   ==========================================================
   6. Debug
   在浏览器 Console 输出实际 opacity
   ==========================================================
  */

  setTimeout(
    function(){

      console.log(
        "[v1.6.7] Risk computed opacity:",
        getComputedStyle(risk).opacity
      );


      console.log(
        "[v1.6.7] Risk parent opacity:",
        risk.parentElement
          ? getComputedStyle(
              risk.parentElement
            ).opacity
          : "none"
      );


      console.log(
        "[v1.6.7] Risk filter:",
        getComputedStyle(risk).filter
      );

    },
    300
  );


});

})();
