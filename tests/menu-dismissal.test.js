import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bindMenuDismissal } from "../src/menu-dismissal.js";

class Target {
  listeners = new Map();
  children = new Set();
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type) { this.listeners.delete(type); }
  contains(node) { return node === this || this.children.has(node); }
  fire(type, event = {}) { this.listeners.get(type)?.({ pointerType: "mouse", ...event }); }
}

let nextTimer = 1;
const timers = new Map();
const schedule = (fn) => { const id = nextTimer++; timers.set(id, fn); return id; };
const cancel = (id) => timers.delete(id);
const trigger = new Target();
const panel = new Target();
const panelItem = new Target();
panel.children.add(panelItem);
let closed = 0;
const cleanup = bindMenuDismissal(trigger, panel, () => closed++, { schedule, cancel });

trigger.fire("pointerleave", { relatedTarget: panelItem });
assert.equal(timers.size, 0, "moving from trigger into panel must not dismiss");
panel.fire("pointerleave", { relatedTarget: null });
assert.equal(timers.size, 1, "leaving both trigger and panel schedules dismissal");
panel.fire("pointerenter");
assert.equal(timers.size, 0, "re-entering before the grace period cancels dismissal");
panel.fire("pointerleave", { relatedTarget: null });
const [timerId, timerCallback] = [...timers.entries()][0];
timers.delete(timerId);
timerCallback();
assert.equal(closed, 1, "leaving the menu closes it after the grace period");

trigger.fire("pointerleave", { pointerType: "touch", relatedTarget: null });
assert.equal(timers.size, 0, "touch uses outside-click dismissal, not hover dismissal");
trigger.fire("pointerleave", { relatedTarget: null });
cleanup();
assert.equal(timers.size, 0, "cleanup cancels pending dismissal");
assert.equal(trigger.listeners.size, 0, "cleanup removes trigger listeners");
assert.equal(panel.listeners.size, 0, "cleanup removes panel listeners");

const app = readFileSync("src/app.js", "utf8");
assert.ok(app.includes("bindMenuDismissal(event.currentTarget, menu, hideContextMenu)"), "application menus bind trigger and panel hover dismissal");
assert.ok(app.includes('menuBar = anchor ? $(".app-menus").getBoundingClientRect() : null') && app.includes('top = menuBar ? menuBar.bottom + 32 : event.clientY'), "application menus open below the full menu bar so sibling buttons remain reachable");
assert.ok(app.includes('document.addEventListener("pointerdown", (event) => { const menu = $("#contextMenu"); if (!menu.hidden && !menu.contains(event.target)) hideContextMenu(); })'), "outside pointerdown closes menus on mouse and touch");
console.log("Menu dismissal tests passed.");
