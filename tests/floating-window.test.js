import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFloatingWindow } from "../src/floating-window.js";

class Element {
  constructor(action = "") { this.dataset = action ? { windowAction:action } : {}; this.style = {}; this.hidden = false; this.listeners = {}; this.attrs = {}; this.classList = { values:new Set(), toggle:(name,on)=>on ? this.classList.values.add(name) : this.classList.values.delete(name), contains:(name)=>this.classList.values.has(name) }; }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  removeEventListener(name, fn) { this.listeners[name] = (this.listeners[name] || []).filter((item)=>item !== fn); }
  fire(name, event = {}) { event.currentTarget = this; event.target ||= this; for (const fn of [...(this.listeners[name] || [])]) fn(event); }
  querySelector(selector) { return this.nodes?.[selector] || null; }
  querySelectorAll() { return this.controls || []; }
  setAttribute(name,value) { this.attrs[name] = value; }
  focus() { this.focused = true; }
  setPointerCapture() {}
  closest() { return this.isButton ? this : null; }
  getBoundingClientRect() { return { left:Number.parseFloat(this.style.left || "24"), top:Number.parseFloat(this.style.top || "82"), width:Number.parseFloat(this.style.width || "390"), height:Number.parseFloat(this.style.height || "540") }; }
}

const values = new Map();
globalThis.localStorage = { getItem:(key)=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,String(value)) };
let mobile = false;
globalThis.matchMedia = () => ({ matches:mobile });
globalThis.innerWidth = 1280; globalThis.innerHeight = 900;
globalThis.window = { listeners:{}, addEventListener(name,fn) { (this.listeners[name] ||= []).push(fn); } };
globalThis.document = { documentElement:{lang:"en"}, listeners:{}, addEventListener(name,fn) { (this.listeners[name] ||= []).push(fn); }, querySelector:()=>null };
function fixture(key = "bot-test") {
  const panel = new Element(), trigger = new Element(), titlebar = new Element(), handle = new Element(), content = new Element(), question = new Element();
  const controls = ["minimize","maximize","restore","close"].map((action)=>{const button=new Element(action);button.isButton=true;return button;}); handle.isButton=true;
  panel.nodes = { "[data-window-titlebar]":titlebar, "[data-window-resize]":handle, "[data-window-content]":content, "#adigunAiQuestion":question }; panel.controls = controls;
  return { panel, trigger, titlebar, handle, content, question, controls, api:createFloatingWindow({ panel, trigger, storageKey:key }) };
}

const ui = fixture();
assert.equal(ui.panel.hidden, true, "window begins closed");
ui.trigger.fire("click");
assert.equal(ui.panel.hidden, false, "AI button opens the panel");
assert.equal(ui.question.focused, true, "opening focuses the chat input");
ui.titlebar.fire("pointerdown", { button:0, pointerId:1, clientX:40, clientY:100, preventDefault(){} });
ui.titlebar.fire("pointermove", { pointerId:1, clientX:140, clientY:160 });
assert.equal(ui.panel.style.left, "124px", "title bar drag moves the window");
ui.handle.fire("pointerdown", { button:0, pointerId:2, clientX:500, clientY:500, preventDefault(){} });
ui.handle.fire("pointermove", { pointerId:2, clientX:560, clientY:580 });
assert.equal(ui.panel.style.width, "450px", "resize handle changes width");
assert.equal(ui.panel.style.height, "620px", "resize handle changes height");
ui.controls[0].fire("click");
assert.equal(ui.content.hidden, true, "minimize hides chat content");
assert.equal(ui.panel.hidden, false, "minimized panel stays visible");
ui.controls[1].fire("click");
assert.equal(ui.panel.classList.contains("is-maximized"), true, "maximize expands the panel");
ui.controls[2].fire("click");
assert.equal(ui.panel.style.left, "124px", "restore returns to the previous position");
ui.controls[3].fire("click");
assert.equal(ui.panel.hidden, true, "close hides the panel");
assert.equal(ui.trigger.focused, true, "close returns focus to the AI button");
const saved = JSON.parse(values.get("bot-test"));
assert.equal(saved.open, false, "closed state is persisted");
assert.equal(saved.x, 124, "drag position is persisted");
assert.equal(saved.width, 450, "resize dimensions are persisted");
const closedReload = fixture("bot-test");
assert.equal(closedReload.panel.hidden, true, "closed window stays closed after reload");
const openState = fixture("bot-open-state"); openState.api.open({ focus:false }); openState.controls[0].fire("click");
const minimizedReload = fixture("bot-open-state");
assert.equal(minimizedReload.panel.hidden, false, "open state restores after reload");
assert.equal(minimizedReload.content.hidden, true, "minimized state restores after reload");
minimizedReload.trigger.fire("click");
assert.equal(minimizedReload.content.hidden, false, "launcher restores a minimized window");
const maximizeState = fixture("bot-max-state"); maximizeState.api.open({ focus:false }); maximizeState.controls[1].fire("click");
const maximizedReload = fixture("bot-max-state");
assert.equal(maximizedReload.panel.classList.contains("is-maximized"), true, "maximized state restores after reload");
maximizedReload.controls[2].fire("click");
assert.equal(maximizedReload.panel.style.width, "390px", "maximized reload retains prior geometry for restore");
minimizedReload.api.setBadge(true);
assert.equal(minimizedReload.trigger.classList.contains("has-unread"), true, "pending activity sets the launcher badge");
minimizedReload.trigger.fire("click");
assert.equal(minimizedReload.trigger.classList.contains("has-unread"), false, "opening clears the unread badge");

mobile = true; globalThis.innerWidth = 390; globalThis.innerHeight = 844;
const phone = fixture("bot-mobile");
phone.api.open({ focus:false });
assert.equal(phone.panel.style.width, "390px", "mobile window spans viewport width");
assert.equal(phone.panel.style.height, "844px", "mobile window spans viewport height");
assert.equal(phone.handle.hidden, true, "mobile resize handle is hidden");

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cache = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const guide = readFileSync(new URL("../docs/HELP.md", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
assert.match(html, /id="adigunBotWindow"[^>]*role="complementary"/);
assert.match(html, /data-window-action="close"[^>]*aria-label="Close Bot window"/);
assert.match(cache, /\.\/src\/floating-window\.js/);
assert.match(css, /\.bot-window\{position:fixed/);
assert.match(css, /body\[data-theme="dark"\] \.analog-value\{[^}]*border-radius:5px\}/, "prior incomplete CSS rule is closed before window styles");
assert.match(guide, /#using-the-bot-window/);
console.log("PASS: Bot open/close, drag, resize, minimize, maximize/restore, focus, persistence, mobile sizing, offline cache, and Help guide");
