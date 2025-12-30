// Tự động chuyển banner với hiệu ứng fade + click để next
(function () {
  const imgs = [
    "https://png.pngtree.com/thumb_back/fw800/back_our/20190622/ourmid/pngtree-purple-minimalist-music-note-banner-background-image_210612.jpg",
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80&auto=format&fit=crop"
  ];

  const banner = document.querySelector(".banner");
  if (!banner) return;

  // Build DOM
  banner.innerHTML = "";
  banner.style.position = "relative";
  banner.style.overflow = "hidden";

  const img = document.createElement("img");
  img.className = "banner-img";
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.opacity = "0";
  img.style.transition = "opacity 600ms ease";
  img.style.willChange = "opacity";
  banner.appendChild(img);

  const dots = document.createElement("div");
  dots.className = "banner-dots";
  dots.style.position = "absolute";
  dots.style.left = "50%";
  dots.style.transform = "translateX(-50%)";
  dots.style.bottom = "12px";
  dots.style.display = "flex";
  dots.style.gap = "8px";
  dots.style.zIndex = "10";
  banner.appendChild(dots);

  // small prev/next buttons (transparent)
  const btnStyle = "position:absolute;top:50%;transform:translateY(-50%);z-index:11;background:rgba(0,0,0,0.25);border:0;color:#fff;padding:8px;border-radius:50%;cursor:pointer";
  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = "◀";
  prevBtn.style.cssText = btnStyle + ";left:8px;";
  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = "▶";
  nextBtn.style.cssText = btnStyle + ";right:8px;";
  banner.appendChild(prevBtn);
  banner.appendChild(nextBtn);

  // preload
  imgs.forEach(u => { const i = new Image(); i.src = u; });

  let idx = 0;
  let timer = null;
  const delay = 5000;
  const fade = 600;
  let isHover = false;

  function setDotActive(i) {
    Array.from(dots.children).forEach((el, j) => {
      el.style.opacity = j === i ? "1" : "0.45";
      el.style.transform = j === i ? "scale(1.1)" : "scale(1)";
    });
  }

  // create dots
  imgs.forEach((_, i) => {
    const d = document.createElement("button");
    d.style.width = "10px";
    d.style.height = "10px";
    d.style.borderRadius = "50%";
    d.style.border = "none";
    d.style.background = "#fff";
    d.style.opacity = "0.6";
    d.style.padding = "0";
    d.style.cursor = "pointer";
    d.addEventListener("click", () => {
      show(i);
      restart();
    });
    dots.appendChild(d);
  });

  function show(i) {
    const nextIdx = (i + imgs.length) % imgs.length;
    if (nextIdx === idx && img.src) return;
    img.style.opacity = "0";
    setTimeout(() => {
      img.src = imgs[nextIdx];
      // ensure image is visible after load for smoothness
img.onload = () => { img.style.opacity = "1"; };
    }, fade * 0.5);
    idx = nextIdx;
    setDotActive(idx);
  }

  function next() { show(idx + 1); }
  function prev() { show(idx - 1); }

  function start() {
    stop();
    timer = setInterval(() => {
      if (!isHover) next();
    }, delay);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { start(); }

  // interactions
  banner.addEventListener("mouseenter", () => { isHover = true; stop(); });
  banner.addEventListener("mouseleave", () => { isHover = false; start(); });

  nextBtn.addEventListener("click", () => { next(); restart(); });
  prevBtn.addEventListener("click", () => { prev(); restart(); });

  // touch swipe
  let startX = 0;
  banner.addEventListener("touchstart", (e) => {
    stop();
    startX = e.touches[0].clientX;
  }, { passive: true });
  banner.addEventListener("touchend", (e) => {
    const endX = (e.changedTouches && e.changedTouches[0].clientX) || startX;
    const dx = endX - startX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next(); else prev();
    }
    restart();
  });

  // init
  show(0);
  start();

  // expose control
  window._bannerControl = { next, prev, show, start, stop };
})();