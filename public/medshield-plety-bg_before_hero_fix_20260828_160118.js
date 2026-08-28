(function () {
  "use strict";

  function mountPletyBackground() {

    if (document.querySelector(".plety-bg-root")) {
      return;
    }

    const root = document.createElement("div");
    root.className = "plety-bg-root";
    root.setAttribute("aria-hidden", "true");

    const video = document.createElement("video");

    video.className = "plety-bg-video";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";

    video.src =
      "https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4";

    const overlay = document.createElement("div");
    overlay.className = "plety-bg-overlay";

    const dim = document.createElement("div");
    dim.className = "plety-bg-dim";

    root.appendChild(video);
    root.appendChild(overlay);
    root.appendChild(dim);

    document.body.prepend(root);

    const playPromise = video.play();

    if (
      playPromise &&
      typeof playPromise.catch === "function"
    ) {
      playPromise.catch(function () {});
    }
  }

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      mountPletyBackground,
      { once: true }
    );

  } else {

    mountPletyBackground();

  }

})();
