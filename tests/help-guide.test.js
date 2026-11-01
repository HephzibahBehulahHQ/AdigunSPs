import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderHelpMarkdown } from "../src/help-markdown.js";

const guide = readFileSync("docs/HELP.md", "utf8");
const quickstart = readFileSync("docs/QUICKSTART.md", "utf8");
const labels = readFileSync("docs/HELP-UI-LABELS.md", "utf8");
const app = readFileSync("src/app.js", "utf8");
const serviceWorker = readFileSync("service-worker.js", "utf8");
const rendered = renderHelpMarkdown(guide);

for (const section of ["getting-started", "navigating-the-interface", "creating-a-project", "saving-your-work", "using-commands", "building-a-project", "using-ready-made-example-projects", "the-live-co-pilot", "troubleshooting"]) {
  assert.match(rendered, new RegExp(`id="${section}"`), `guide renders ${section}`);
  assert.match(rendered, new RegExp(`href="#${section}"`), `contents links to ${section}`);
}
assert.ok(guide.trim().split(/\s+/).length < 2500, "Help guide stays under the requested word limit");
assert.ok(quickstart.trim().split(/\s+/).length < 500, "Quickstart stays within one page");
assert.match(labels, /Undo/);
assert.match(labels, /Command search/);
assert.match(app, /dataset\.appMenu === "help"\) \{ showHelpGuideMenu/);
assert.match(app, /data-help-action="safety"/);
assert.match(app, /data-help-action="resources"/);
assert.match(app, /\.\.\/docs\/HELP\.md/);
assert.match(serviceWorker, /adigunsps-shell-v106/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-tools\.js/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-verifier\.js/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-preview\.js/);
assert.match(serviceWorker, /\.\/src\/adigun-bot-copilot\.js/);
assert.match(serviceWorker, /\.\/src\/help-markdown\.js/);
assert.match(serviceWorker, /\.\/docs\/HELP\.md/);
assert.match(renderHelpMarkdown("## Safe\n\n<script>alert(1)</script>"), /&lt;script&gt;/, "Markdown rendering escapes HTML");
console.log("PASS: Help guide sections, in-menu route, safe rendering, docs, and offline cache");
