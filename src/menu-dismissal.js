export function bindMenuDismissal(trigger, panel, onClose, {
  delayMs = 180,
  schedule = setTimeout,
  cancel = clearTimeout,
} = {}) {
  let closeTimer = null;
  let disposed = false;
  const contains = (node) => Boolean(node && (trigger.contains(node) || panel.contains(node)));
  const clearTimer = () => {
    if (closeTimer === null) return;
    cancel(closeTimer);
    closeTimer = null;
  };
  const onLeave = (event) => {
    if (event.pointerType !== "mouse" || contains(event.relatedTarget)) return;
    clearTimer();
    closeTimer = schedule(() => {
      closeTimer = null;
      if (!disposed) onClose();
    }, delayMs);
  };
  const onEnter = (event) => {
    if (event.pointerType === "mouse") clearTimer();
  };
  for (const node of [trigger, panel]) {
    node.addEventListener("pointerleave", onLeave);
    node.addEventListener("pointerenter", onEnter);
  }
  return () => {
    disposed = true;
    clearTimer();
    for (const node of [trigger, panel]) {
      node.removeEventListener("pointerleave", onLeave);
      node.removeEventListener("pointerenter", onEnter);
    }
  };
}
