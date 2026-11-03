const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

export function createFloatingWindow({ panel, trigger, storageKey, topBoundary = () => 0, onOpen = () => {}, onClose = () => {} }) {
  const titlebar = panel.querySelector("[data-window-titlebar]");
  const resizeHandle = panel.querySelector("[data-window-resize]");
  const content = panel.querySelector("[data-window-content]");
  const controls = [...panel.querySelectorAll("[data-window-action]")];
  const defaults = { x: 24, y: 82, width: 390, height: 540, open: false, minimized: false, maximized: false };
  let state = { ...defaults, ...read() };
  let previous = state.previous || null;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!value || typeof value !== "object") return {};
      return {
        x: finite(value.x, defaults.x), y: finite(value.y, defaults.y),
        width: finite(value.width, defaults.width), height: finite(value.height, defaults.height),
        open: value.open === true, minimized: value.minimized === true, maximized: value.maximized === true,
        previous: value.previous && typeof value.previous === "object" ? { x:finite(value.previous.x, defaults.x), y:finite(value.previous.y, defaults.y), width:finite(value.previous.width, defaults.width), height:finite(value.previous.height, defaults.height) } : null,
      };
    } catch { return {}; }
  }
  function finite(value, fallback) { return Number.isFinite(value) ? value : fallback; }
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify({ ...state, previous })); } catch {} }
  function bounds() {
    const mobile = matchMedia("(max-width: 600px)").matches;
    const top = Math.ceil(topBoundary());
    return { top, height: Math.max(0, innerHeight - top), mobile };
  }
  function constrain() {
    const view = bounds();
    if (view.mobile) { state.x = 0; state.y = view.top; state.width = innerWidth; state.height = view.height; return; }
    state.width = clamp(state.width, 320, Math.min(900, innerWidth - 32));
    state.height = clamp(state.height, Math.min(400, view.height), Math.min(800, view.height));
    state.x = clamp(state.x, 0, Math.max(0, innerWidth - 72));
    state.y = clamp(state.y, view.top, innerHeight - (state.minimized ? 48 : state.height));
  }
  function render() {
    constrain();
    panel.hidden = !state.open;
    panel.classList.toggle("is-minimized", state.minimized);
    panel.classList.toggle("is-maximized", state.maximized);
    const view = bounds();
    panel.style.left = `${state.x}px`; panel.style.top = `${state.y}px`;
    panel.style.width = `${view.mobile ? innerWidth : state.width}px`;
    panel.style.height = `${view.mobile ? state.minimized ? 56 : view.height : state.minimized ? 48 : state.height}px`;
    content.hidden = state.minimized;
    resizeHandle.hidden = state.minimized || state.maximized || view.mobile;
    for (const button of controls) {
      const action = button.dataset.windowAction;
      button.hidden = (action === "maximize" && state.maximized) || (action === "restore" && !state.maximized);
    }
    trigger.setAttribute("aria-expanded", String(state.open));
    persist();
  }
  function open({ focus = true } = {}) { const wasClosed = !state.open; state.open = true; state.minimized = false; render(); setBadge(false); if (wasClosed) onOpen(); if (focus) panel.querySelector("#adigunAiQuestion")?.focus(); }
  function close({ returnFocus = true } = {}) { state.open = false; render(); onClose(); if (returnFocus) trigger.focus(); }
  function minimize() { state.minimized = true; render(); }
  function maximize() {
    state.minimized = false;
    if (state.maximized) { state.maximized = false; if (previous) Object.assign(state, previous); }
    else { previous = { x: state.x, y: state.y, width: state.width, height: state.height }; state.maximized = true; const view = bounds(); state.x = view.mobile ? 0 : 16; state.y = view.mobile ? 0 : 16; state.width = view.mobile ? innerWidth : Math.min(1100, innerWidth - 32); state.height = view.mobile ? innerHeight : Math.min(900, innerHeight - 32); }
    render();
  }
  function pointerStart(event, mode) {
    if (event.button !== 0 || bounds().mobile || (mode === "drag" && event.target.closest("button"))) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect(), start = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (next) => {
      if (mode === "drag") { state.x = start.left + next.clientX - start.x; state.y = start.top + next.clientY - start.y; }
      else { state.width = start.width + next.clientX - start.x; state.height = start.height + next.clientY - start.y; }
      render();
    };
    const end = () => { target.removeEventListener("pointermove", move); target.removeEventListener("pointerup", end); target.removeEventListener("pointercancel", end); };
    target.addEventListener("pointermove", move); target.addEventListener("pointerup", end); target.addEventListener("pointercancel", end);
  }
  titlebar.addEventListener("pointerdown", (event) => pointerStart(event, "drag"));
  resizeHandle.addEventListener("pointerdown", (event) => pointerStart(event, "resize"));
  controls.forEach((button) => button.addEventListener("click", () => ({ close, minimize, maximize, restore:maximize })[button.dataset.windowAction]?.()));
  trigger.addEventListener("click", () => { if (!state.open) open(); else { if (state.minimized) { state.minimized = false; render(); } setBadge(false); panel.focus(); } });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && state.open && !document.querySelector("dialog[open]")) { event.preventDefault(); close(); } });
  window.addEventListener("resize", render);
  render();
  function setBadge(value = true) { const locale=document.documentElement?.lang||"en",labels={en:"Adigun BOT, new activity",de:"Adigun BOT, neue Aktivität",yo:"Adigun BOT, ìṣẹ̀lẹ̀ tuntun",pcm:"Adigun BOT, new activity"}; trigger.classList.toggle("has-unread", value); trigger.setAttribute("aria-label", value ? labels[locale]||labels.en : "Adigun BOT"); }
  window.addEventListener("adigunsps:bot-notification", (event) => { if (!state.open) { setBadge(true); const toast = document.querySelector("#toast"); if (toast && event.detail?.message) { toast.textContent = event.detail.message; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2500); } } });
  return { open, close, minimize, maximize, isOpen:() => state.open, setBadge, panel };
}
