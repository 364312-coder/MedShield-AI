(function () {
  "use strict";

  function mountHeroBackground() {

    const hero =
      document.querySelector(
        ".competition-hero"
      );

    if (!hero) {
      console.warn(
        "[Plety BG] .competition-hero not found"
      );
      return;
    }


    /* 删除旧的全站背景 */

    document
      .querySelectorAll(
        ".plety-bg-root"
      )
      .forEach(function (el) {

        el.remove();

      });


    /* 新背景直接放进 Hero */

    const root =
      document.createElement(
        "div"
      );

    root.className =
      "plety-bg-root";

    root.setAttribute(
      "aria-hidden",
      "true"
    );


    const video =
      document.createElement(
        "video"
      );

    video.className =
      "plety-bg-video";

    video.autoplay =
      true;

    video.muted =
      true;

    video.loop =
      true;

    video.playsInline =
      true;

    video.preload =
      "auto";


    video.src =
      "https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4";


    const overlay =
      document.createElement(
        "div"
      );

    overlay.className =
      "plety-bg-overlay";


    root.appendChild(
      video
    );

    root.appendChild(
      overlay
    );


    hero.prepend(
      root
    );


    const playPromise =
      video.play();


    if (
      playPromise &&
      typeof playPromise.catch ===
      "function"
    ) {

      playPromise.catch(
        function () {}
      );

    }

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      mountHeroBackground,
      { once:true }
    );

  }
  else {

    mountHeroBackground();

  }

})();
