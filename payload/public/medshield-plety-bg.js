(function () {
  "use strict";

  function mountPletyBackground() {

    /*
     * 删除旧版本背景，确保只有一个
     */
    document
      .querySelectorAll(".plety-bg-root")
      .forEach(function (node) {
        node.remove();
      });


    const root =
      document.createElement("div");

    root.className =
      "plety-bg-root";

    root.setAttribute(
      "aria-hidden",
      "true"
    );


    const video =
      document.createElement("video");

    video.className =
      "plety-bg-video";

    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";


    video.src =
      "https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4";


    const overlay =
      document.createElement("div");

    overlay.className =
      "plety-bg-overlay";


    root.appendChild(video);
    root.appendChild(overlay);


    /*
     * 直接挂在 body 第一层。
     * position:fixed，所以从顶部覆盖整个 viewport，
     * 但不会进入正常文档流。
     */
    document.body.prepend(root);


    const playPromise =
      video.play();


    if (
      playPromise &&
      typeof playPromise.catch === "function"
    ) {

      playPromise.catch(function () {});

    }

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      mountPletyBackground,
      { once:true }
    );

  }
  else {

    mountPletyBackground();

  }

})();
