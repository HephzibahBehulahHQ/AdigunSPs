const studioHash = /^#studio(?:\/(logic|electrical|examples))?$/;

function readView() {
  const match = location.hash.match(studioHash);
  if (match) return { studio:true, tool:match[1] };
  const account = new URLSearchParams(location.search).has("account");
  const authCallback = /(?:^#|&)(?:access_token|refresh_token|error|type)=/.test(location.hash)
    || new URLSearchParams(location.search).has("code");
  return { studio:account || authCallback };
}

export function connectStudioRoutes(onStudioRoute) {
  const overview = document.querySelector("#overviewView");
  const studio = document.querySelector("#studioView");
  const updatePreview = connectPreview(document.querySelector("#overviewTelemetry"));
  let previous;
  function sync() {
    const current = readView();
    if (previous && previous.studio === current.studio && previous.tool === current.tool) return;
    const changedView = previous && previous.studio !== current.studio;
    previous = current;
    if (changedView && !current.studio) {
      for (const dialog of studio.querySelectorAll("dialog[open]")) dialog.close();
    }
    overview.hidden = current.studio;
    studio.hidden = !current.studio;
    updatePreview(!current.studio);
    if (changedView) {
      window.scrollTo(0, 0);
      const focusTarget = current.studio ? studio.querySelector(".studio-back") : overview.querySelector("h1");
      focusTarget.focus({ preventScroll:true });
    }
    if (current.studio) onStudioRoute(current.tool);
  }
  for (const link of document.querySelectorAll("[data-overview-link]")) {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (!location.hash && !location.search) return;
      history.pushState(null, "", location.pathname);
      sync();
    });
  }
  window.addEventListener("popstate", sync);
  window.addEventListener("hashchange", sync);
  sync();
}

function connectPreview(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const { width, height } = canvas;
  const particles = Array.from({ length:40 }, (_, i) => ({
    x:(i * 139) % width, y:(i * 83) % height, speed:4 + (i % 5) * 4,
  }));
  const mono = "14px ui-monospace, monospace";
  let frame = 0;
  let visible = false;
  let paused = false;
  function render(milliseconds) {
    const t = milliseconds / 1000;
    const position = 76 + ((t * 76) % 486);
    const active = position > 282 && position < 402;
    ctx.fillStyle = "#0c1020";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#35345a";
    ctx.beginPath();
    for (let x = 0; x < width; x += 32) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y < height; y += 32) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.globalAlpha = .55;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#6b82b3";
    for (const particle of particles) ctx.fillRect((particle.x + t * particle.speed) % width, particle.y, 2, 2);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8f83d8";
    ctx.strokeRect(44, 207, 552, 48);
    ctx.beginPath();
    for (let x = 65; x < 590; x += 31) { ctx.moveTo(x - 6, 253); ctx.lineTo(x + 7, 227); }
    ctx.stroke();
    ctx.fillStyle = "#62529c";
    ctx.fillRect(position - 21, 165, 42, 42);
    ctx.strokeStyle = "#bba6ff";
    ctx.strokeRect(position - 21, 165, 42, 42);

    ctx.lineWidth = 3;
    ctx.strokeStyle = active ? "#7ff8ec" : "#61739b";
    ctx.beginPath();
    ctx.moveTo(53, 99);
    ctx.lineTo(320, 99);
    ctx.lineTo(320, 185);
    ctx.moveTo(320, 99);
    ctx.lineTo(585, 99);
    ctx.stroke();
    ctx.fillStyle = active ? "#7ff8ec" : "#a6a7d3";
    for (const [x,y] of [[54,99],[320,99],[320,185],[584,99]]) {
      ctx.beginPath();
      ctx.arc(x,y,7,0,2 * Math.PI);
      ctx.fill();
    }
    ctx.font = mono;
    ctx.fillText(active ? "I0.0  ON" : "I0.0  OFF", 48, 79);
    ctx.fillText("PLC SCAN", 284, 79);
    ctx.fillText(active ? "Q0.0  ON" : "Q0.0  OFF", 513, 79);
    ctx.fillStyle = "#a6a7d3";
    ctx.fillText("SENSOR TRACE", 48, 298);
    ctx.beginPath();
    ctx.strokeStyle = "#ae9dff";
    ctx.lineWidth = 2;
    for (let x = 0; x <= 385; x += 5) {
      const y = (Math.floor((x + t * 65) / 42) % 3 === 1) ? 287 : 304;
      if (x) ctx.lineTo(211 + x, y); else ctx.moveTo(211, y);
    }
    ctx.stroke();
    frame = 0;
    if (visible && !paused && !motion.matches && !document.hidden) frame = requestAnimationFrame(render);
  }
  const control = document.querySelector("#overviewPreviewPause");
  control.addEventListener("click", () => {
    paused = !paused;
    control.setAttribute("aria-pressed", String(paused));
    update();
  });
  function update() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (visible && !document.hidden) render(motion.matches ? 3500 : performance.now());
  }
  motion.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  return (next) => { visible = next; update(); };
}
