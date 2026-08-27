
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
  /* No opacity, no ScrollTrigger, no backend changes.
     Only refresh layout-sensitive GSAP measurements if present. */
  if(window.ScrollTrigger){
    requestAnimationFrame(function(){
      ScrollTrigger.refresh();
    });
  }
});
})();
