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

for (const section of ["getting-started", "taking-the-onboarding-tour", "navigating-the-interface", "program-main", "components-schematic", "hmi", "first-project-use-all-three-workspaces", "creating-a-project", "saving-your-work", "using-commands", "building-a-project", "using-ready-made-example-projects", "hosted-ai-privacy", "the-live-co-pilot", "troubleshooting"]) {
  assert.match(rendered, new RegExp(`id="${section}"`), `guide renders ${section}`);
  assert.match(rendered, new RegExp(`href="#${section}"`), `contents links to ${section}`);
}
for (const [, anchor] of guide.matchAll(/\]\(#([^)]+)\)/g)) assert.ok(rendered.includes(`id="${anchor}"`), `Help contents target ${anchor} exists`);
assert.ok(guide.trim().split(/\s+/).length < 2500, "Help guide stays under the requested word limit");
assert.match(guide,/RUN SIMULATION/);
assert.match(guide,/Schneider XB5AA31[\s\S]*13–14[\s\S]*XB5AA42[\s\S]*21–22/i,"Help identifies both sourced spring-return pushbuttons");
assert.match(userGuide,/XB5AA31[\s\S]*13–14[\s\S]*not simulated/i,"User Guide documents the NO pushbutton terminals and model boundary");
assert.match(userGuide,/XB5AA42[\s\S]*21–22[\s\S]*not simulated/i,"User Guide documents the NC pushbutton terminals and model boundary");
assert.match(guide,/3RU2126-4BC0[\s\S]*95\/96 NC \+ 97\/98 NO[\s\S]*Overload tripped/i,"Help documents the overload relay's verified terminals and trip control");
assert.match(userGuide,/3RU2126-4BC0[\s\S]*95\/96 NC[\s\S]*97\/98 NO[\s\S]*not modeled/i,"User Guide documents the verified overload relay terminals and simulation boundary");
assert.match(userGuide,/### Status strip[\s\S]*Grid: 20 px[\s\S]*no hardware connected/);
assert.ok(quickstart.trim().split(/\s+/).length < 500, "Quickstart stays within one page");
for (const workspace of ["Program Main", "Components / Schematic", "HMI"]) {
  assert.match(guide, new RegExp(workspace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Help guide explains ${workspace}`);
  assert.match(quickstart, new RegExp(workspace.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Quickstart includes ${workspace}`);
}
for (const anchor of ["first-project-across-three-workspaces", "edit-logic", "electrical-components", "hmi-screen", "simulate"]) assert.match(userGuide, new RegExp(`\\(#${anchor}\\)`), `full manual contents links to ${anchor}`);
assert.match(guide, /\*\*Project → Account\*\*/, "Help identifies the wide-screen Account menu path");
assert.match(guide, /email and password[\s\S]*?Create account[\s\S]*?Forgot password/i, "Help explains password sign-in and signup confirmation");
assert.doesNotMatch(guide, /enter the email code|open the sign-in link/i, "Help does not describe the retired OTP/magic-link login flow");
assert.match(userGuide, /## Account access and guest work[\s\S]*?Forgot password[\s\S]*?reset-password[\s\S]*?four minutes/i, "User Guide explains password login, recovery, and guest access");
assert.match(userGuide, /six-step tour covers[\s\S]*?Physical-device control is not available/i, "User Guide explains the current tour and hardware boundary");
assert.match(labels, /Undo/);
assert.match(labels, /Command search/);
assert.match(app, /dataset\.appMenu === "help"\) \{ showHelpGuideMenu/);
assert.match(app, /data-help-action="safety"/);
assert.match(app, /data-help-action="resources"/);
assert.match(app, /topics:\{file:"HELP\.md"/);
assert.match(app, /quickstart:\{file:"QUICKSTART\.md"/);
assert.match(app, /manual:\{file:"user-guide\.md"/);
assert.match(app, /new URL\(`\.\.\/docs\/\$\{helpDocuments\[id\]\.file\}`/);
assert.match(serviceWorker, /\.\/docs\/QUICKSTART\.md/);
assert.match(serviceWorker, /\.\/docs\/user-guide\.md/);
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
assert.match(guide, /Open phone drawers with \*\*Panel layout\*\*\. Close using \*\*×\*\*, \*\*Escape\*\*, or Tab past either end/);
assert.match(userGuide, /Choose \*\*Panel layout\*\*[\s\S]*?press \*\*Escape\*\* to close it and return focus to \*\*Panel layout\*\*/);
assert.match(renderHelpMarkdown("## Safe\n\n<script>alert(1)</script>"), /&lt;script&gt;/, "Markdown rendering escapes HTML");
console.log("PASS: Help guide, localized six-step tour, popup copy, safe rendering, and offline cache");


