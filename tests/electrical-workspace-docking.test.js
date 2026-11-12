import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync("index.html","utf8"),app=readFileSync("src/app.js","utf8"),electrical=readFileSync("src/electrical-ui.js","utf8"),menus=readFileSync("src/app-menus.js","utf8"),css=readFileSync("assets/brand/brand-overrides.css","utf8");
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
assert.match(app,/matchMedia\("\(min-width: 1200px\)"\)/);
assert.match(css,/@media\(max-width:1199px\)\{\.header-quick-commands,\.menu-command-dock\{display:none\}\}/);
assert.match(html,/id="editorToolboxDock" class="editor-context-toolbox hidden"/);
assert.match(app,/function setupContextualEditorToolbox\(\)/);
for (const mode of ["LD","FBD","ST","SFC","HMI"]) assert.match(app,new RegExp(`mode:"${mode}"`));
assert.match(app,/group\.hidden = group\.dataset\.editorToolboxMode !== toolboxMode/);
assert.match(app,/document\.querySelectorAll\("#hmiPane \[data-hmi-add\], #editorToolboxDock \[data-hmi-add\]"\)/);

assert.match(css,/@media\(min-width:1200px\)\{\.toolbar\{display:none\}\}/,"the overflowing ribbon must be removed at wide desktop sizes");
assert.match(menus,/online:\[\[[\s\S]*?\["sound","sound"\]\]/,"simulation sound must remain reachable after the ribbon is hidden");
assert.match(menus,/saveAs:"Save as"[\s\S]*?save:"Save"/,"file actions remain translated and menu reachable");
