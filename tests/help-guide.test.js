import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderHelpMarkdown } from "../src/help-markdown.js";

const guide = readFileSync("docs/HELP.md", "utf8");
const quickstart = readFileSync("docs/QUICKSTART.md", "utf8");
const userGuide = readFileSync("docs/user-guide.md", "utf8");
const labels = readFileSync("docs/HELP-UI-LABELS.md", "utf8");
const app = readFileSync("src/app.js", "utf8");
const serviceWorker = readFileSync("service-worker.js", "utf8");
const rendered = renderHelpMarkdown(guide);

for (const section of ["getting-started", "taking-the-onboarding-tour", "navigating-the-interface", "creating-a-project", "saving-your-work", "using-commands", "building-a-project", "using-ready-made-example-projects", "hosted-ai-privacy", "the-live-co-pilot", "troubleshooting"]) {
  assert.match(rendered, new RegExp(`id="${section}"`), `guide renders ${section}`);
  assert.match(rendered, new RegExp(`href="#${section}"`), `contents links to ${section}`);
}
for (const [, anchor] of guide.matchAll(/\]\(#([^)]+)\)/g)) assert.ok(rendered.includes(`id="${anchor}"`), `Help contents target ${anchor} exists`);
assert.ok(guide.trim().split(/\s+/).length < 2500, "Help guide stays under the requested word limit");
assert.match(guide,/PLC\/scan\/cycle\/autosave/);
assert.match(userGuide,/### Status strip[\s\S]*Grid: 20 px[\s\S]*no hardware connected/);
assert.ok(quickstart.trim().split(/\s+/).length < 500, "Quickstart stays within one page");
assert.match(guide, /select the profile icon[\s\S]*?labelled \*\*Sign in\*\*[\s\S]*?\*\*Account\*\*/i, "Help identifies the current profile icon labels");
assert.match(guide, /email and password[\s\S]*?Create account[\s\S]*?Forgot password/i, "Help explains password sign-in and signup confirmation");
assert.doesNotMatch(guide, /enter the email code|open the sign-in link/i, "Help does not describe the retired OTP/magic-link login flow");
assert.match(userGuide, /## Account access and guest work[\s\S]*?Forgot password[\s\S]*?reset-password[\s\S]*?four minutes/i, "User Guide explains password login, recovery, and guest access");
assert.match(userGuide, /six-step tour covers[\s\S]*?Physical-device control is not available/i, "User Guide explains the current tour and hardware boundary");
assert.match(labels, /Undo/);
assert.match(labels, /Command search/);
assert.match(app, /dataset\.appMenu === "help"\) \{ showHelpGuideMenu/);
assert.match(app, /data-help-action="safety"/);
assert.match(app, /data-help-action="resources"/);
assert.match(app, /\.\.\/docs\/HELP\.md/);
assert.match(serviceWorker, /adigunsps-shell-v\d+/, "Help assets belong to a versioned application shell");
assert.match(rendered, /id="using-the-bot-window"/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-tools\.js/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-verifier\.js/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-preview\.js/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-copilot\.js/);
assert.match(serviceWorker, /\.\/src\/help-markdown\.js/);
assert.match(serviceWorker, /\.\/docs\/HELP\.md/);
const tourSource = app.slice(app.indexOf("const tour = {"), app.indexOf("\n};", app.indexOf("const tour = {")));
for (const locale of ["en", "de", "yo", "pcm"]) {
  const localeTour = tourSource.match(new RegExp(`${locale}: \\{ title:"[^"]+", steps:\\[(.*?)\\], previous:`, "s"));
  assert.ok(localeTour, `onboarding tour exists in ${locale}`);
  assert.equal((localeTour[1].match(/\["/g) || []).length, 6, `${locale} onboarding tour has six steps`);
  assert.match(localeTour[1], /hardware|Hardware|ìṣòwò|gidi/i, `${locale} tour explains hardware-model limits`);
}
assert.match(tourSource, /1,000 simulation-checked learning projects/);
assert.match(tourSource, /This build does not connect to physical hardware/);
assert.match(app, /<p class="safety-copy">\$\{tour\[language\]\.welcome\}<\/p>/, "welcome popup shows the new subtitle");
assert.doesNotMatch(app, /<p class="safety-copy">\$\{tour\[language\]\.welcome\}<\/p><p class="safety-copy"><strong>\$\{t\("safety"\)\}/, "welcome popup no longer repeats the long safety warning");
assert.match(rendered, /id="taking-the-onboarding-tour"/);
assert.match(guide, /Physical control unavailable/);
assert.match(guide, /Window \/ Settings[\s\S]*?open phone drawers here, close with \*\*×\*\*/);
assert.match(userGuide, /Choose \*\*Panel layout\*\*[\s\S]*?Tap the \*\*×\*\* at the top of the open side panel to close it/);
assert.match(renderHelpMarkdown("## Safe\n\n<script>alert(1)</script>"), /&lt;script&gt;/, "Markdown rendering escapes HTML");
console.log("PASS: Help guide, localized six-step tour, popup copy, safe rendering, and offline cache");

