(function(){
"use strict";


function ready(fn){

  if(
    document.readyState ===
    "loading"
  ){

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
   1. 删除所有与 Risk / Recovery 相关旧 ScrollTrigger
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


        const riskRelated =

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


        const recoveryRelated =

          recovery &&

          (
            trigger === recovery ||

            (
              trigger &&
              recovery.contains(trigger)
            ) ||

            (
              trigger &&
              trigger.contains &&
              trigger.contains(recovery)
            ) ||

            pin === recovery
          );


        if(
          riskRelated ||
          recoveryRelated
        ){

          st.kill(
            true
          );

        }

      });

  }


  /*
   ==========================================================
   2. 删除旧 Tween
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
   3. 清理旧 GSAP inline styles
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
   ==========================================================
   4. 强制正常文档流
   ==========================================================
  */

  risk.style.setProperty(
    "opacity",
    "1",
    "important"
  );


  risk.style.setProperty(
    "visibility",
    "visible",
    "important"
  );


  risk.style.setProperty(
    "filter",
    "none",
    "important"
  );


  /*
   ==========================================================
   5. 不再给这一段添加任何 ScrollTrigger 动画
   ==========================================================
  */


  requestAnimationFrame(
    function(){

      if(window.ScrollTrigger){

        ScrollTrigger.refresh();

      }

    }
  );


});

})();
