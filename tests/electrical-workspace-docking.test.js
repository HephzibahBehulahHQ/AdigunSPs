import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("index.html","utf8"),app=readFileSync("src/app.js","utf8"),electrical=readFileSync("src/electrical-ui.js","utf8"),css=readFileSync("assets/brand/brand-overrides.css","utf8");
assert.match(html,/id="electricalToolboxDock" class="electrical-toolbox-dock hidden"/);
assert.match(app,/toolboxHost:\$\("#electricalToolboxDock"\),inspectorHost:\$\("#inspectorContent"\)/);
assert.match(app,/classList\.toggle\("electrical-workspace-active", electrical\)/);
assert.match(electrical,/toolboxHost\.replaceChildren\(\.\.\.\[toolbar,catalog\]\.filter\(Boolean\)\)/);
assert.match(electrical,/inspectorHost\.replaceChildren\(inspector\)/);
assert.match(css,/#electricalPane \.electrical-body\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
assert.match(css,/\.workspace\.electrical-workspace-active \.inspector-content\{min-height:0;overflow:auto/);
console.log("PASS: electrical workspace docking contracts");

assert.match(html,/id="globalQuickCommands" class="header-quick-commands"/);
assert.match(html,/id="menuCommandDock" class="menu-command-dock"/);
assert.match(app,/function setupResponsiveGlobalCommandDocks\(\)/);
assert.match(app,/\[\.\.\.moved\]\.reverse\(\)/);
