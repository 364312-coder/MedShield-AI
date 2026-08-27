
(function(){
"use strict";

function ready(fn){
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", fn, {once:true});
  } else {
    fn();
  }
}

ready(function(){

  const oldRisk = document.querySelector(".v14-risk-story");
  if(!oldRisk) return;

  const oldRecovery = document.querySelector(".v14-recovery-story");

  /* =========================================================
     1. Kill EVERY ScrollTrigger related to the old risk node
     ========================================================= */

  if(window.ScrollTrigger){
    ScrollTrigger.getAll().forEach(function(st){

      const t = st.trigger;
      const p = st.pin;

      const hitRisk =
        t === oldRisk ||
        p === oldRisk ||
        (t && t.contains && t.contains(oldRisk)) ||
        (p && p.contains && p.contains(oldRisk)) ||
        (t && oldRisk.contains(t)) ||
        (p && oldRisk.contains(p));

      const hitRecovery =
        oldRecovery && (
          t === oldRecovery ||
          p === oldRecovery ||
          (t && t.contains && t.contains(oldRecovery)) ||
          (p && p.contains && p.contains(oldRecovery)) ||
          (t && oldRecovery.contains(t)) ||
          (p && oldRecovery.contains(p))
        );

      if(hitRisk || hitRecovery){
        try{ st.kill(true); }catch(_){}
      }
    });
  }

  /* =========================================================
     2. Kill GSAP tweens that still reference old nodes
     ========================================================= */

  if(window.gsap){
    try{
      gsap.killTweensOf(oldRisk);
      gsap.killTweensOf(oldRisk.querySelectorAll("*"));
      if(oldRecovery){
        gsap.killTweensOf(oldRecovery);
        gsap.killTweensOf(oldRecovery.querySelectorAll("*"));
      }
    }catch(_){}
  }

  /* =========================================================
     3. Remove pin-spacer wrappers from the old structure
     ========================================================= */

  let riskHost = oldRisk.parentElement;

  if(riskHost && riskHost.classList.contains("pin-spacer")){
    const spacer = riskHost;
    const parent = spacer.parentElement;
    if(parent){
      parent.insertBefore(oldRisk, spacer);
      spacer.remove();
      riskHost = oldRisk.parentElement;
    }
  }

  if(oldRecovery && oldRecovery.parentElement?.classList.contains("pin-spacer")){
    const spacer = oldRecovery.parentElement;
    const parent = spacer.parentElement;
    if(parent){
      parent.insertBefore(oldRecovery, spacer);
      spacer.remove();
    }
  }

  /* =========================================================
     4. Clone the risk node.
        cloneNode removes GSAP's runtime references and listeners.
     ========================================================= */

  const cleanRisk = oldRisk.cloneNode(true);

  /* Remove all inline animation residue from the clone */
  [cleanRisk, ...cleanRisk.querySelectorAll("*")].forEach(function(el){
    el.removeAttribute("style");
    el.removeAttribute("data-gsap");
  });

  cleanRisk.classList.add("v169-clean-risk");

  oldRisk.replaceWith(cleanRisk);

  /* =========================================================
     5. Clone Recovery as well so it is no longer controlled
     ========================================================= */

  let cleanRecovery = null;

  if(oldRecovery && oldRecovery.isConnected){
    cleanRecovery = oldRecovery.cloneNode(true);

    [cleanRecovery, ...cleanRecovery.querySelectorAll("*")].forEach(function(el){
      el.removeAttribute("style");
      el.removeAttribute("data-gsap");
    });

    cleanRecovery.classList.add("v169-clean-recovery");

    oldRecovery.replaceWith(cleanRecovery);
  }

  /* =========================================================
     6. Remove leftover risk-related spacer nodes if any
     ========================================================= */

  document.querySelectorAll(".pin-spacer").forEach(function(spacer){
    const hasRisk =
      spacer.querySelector(".v14-risk-story") ||
      spacer.querySelector(".v14-recovery-story");

    if(hasRisk){
      const parent = spacer.parentElement;
      if(!parent) return;

      while(spacer.firstChild){
        parent.insertBefore(spacer.firstChild, spacer);
      }
      spacer.remove();
    }
  });

  /* =========================================================
     7. Hard-reset parent containers too
     ========================================================= */

  let parent = cleanRisk.parentElement;
  let depth = 0;

  while(parent && parent !== document.body && depth < 4){
    parent.style.removeProperty("opacity");
    parent.style.removeProperty("filter");
    parent.style.removeProperty("visibility");
    parent.style.removeProperty("transform");
    parent.style.removeProperty("height");
    parent.style.removeProperty("min-height");
    depth++;
    parent = parent.parentElement;
  }

  /* =========================================================
     8. No new animation on this section.
        It behaves exactly like a normal content section.
     ========================================================= */

  requestAnimationFrame(function(){
    if(window.ScrollTrigger){
      try{ ScrollTrigger.refresh(true); }catch(_){}
    }
  });

  console.log("[v1.6.9] Risk Story rebuilt as clean DOM section.");

});
})();
