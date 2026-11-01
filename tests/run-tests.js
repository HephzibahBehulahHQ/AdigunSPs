Warning: truncated output (original token count: 24402)
Total output lines: 660

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { examples } from "../src/examples.js";
import { applicationMenuLabels, createApplicationMenuEntries } from "../src/app-menus.js";
import { resolveTheme } from "../src/theme.js";
import { ui } from "../src/locale-ui.js";
import { buildLocalizationReport } from "../src/localization.js";
import { defaultProject, getTaskCycleMs, makeProjectFromExample, orderFbdBlocks, runExampleChecks, scan, scanFBD, scanSFC } from "../src/engine.js";
import { validateProject } from "../src/validation.js";
import { countProjectMatches } from "../src/project-search.js";
import { validateFbdBlocks, requiredFbdInputs, connectFbdPorts } from "../src/fbd-validation.js";
import { convertLadderToFbd } from "../src/logic-conversion.js";
import { compileStructuredText, executeStructuredText } from "../src/structured-text.js";
import { isApprovedExternalUrl } from "../src/resources.js";
import { evaluateAlarms, createAlarm, setAlarmState, saveRecipe, applyRecipe } from "../src/hmi.js";
import { defaultProcessModel, stepProcesses } from "../src/process.js";
import { renderProcessTwin } from "../src/process-view.js";
import { applyAnalogFaults, applyInputFaults, applyOutputFaults } from "../src/faults.js";
import { createIoScheduleCsv, createIoSchedulePrintHtml, createExampleTestReportCsv, createTrendHistoryCsv, createWiringReferenceHtml, createScenarioTestReportCsv, createScenarioTestReportHtml } from "../src/reports.js";
import { appendTrendSample, trendSampleHeights, trimTrendHistory } from "../src/hmi-history.js";
import { hmiDragPosition } from "../src/hmi-layout.js";
import { fbdBlockPosition, moveFbdBlocks, fbdCanvasSize, fbdVisibleBlockIndices, fbdZoomToFit, copyFbdBlocks, pasteFbdBlocks, assignFbdCopyTags, createFbdInternalBoolTag, removeFbdBlocks } from "../src/fbd-layout.js";
import { runScenario, validateScenario } from "../src/scenarios.js";
import { isHistoricalBreakpoint, s…23402 tokens truncated…].every((locale) => app.includes(`${locale}{title:"`)), "SFC steps and transitions have a localized accessible outline");
assert.ok(app.includes("updateContactSelection(selectedContacts, location, event.shiftKey)") && app.includes("deleteSelectedContacts()") && serviceWorker.includes("./src/ld-selection.js"), "LD supports additive contact selection, group delete, and offline module caching");
assert.ok(app.includes("setupContactPointerDrag(canvas)") && app.includes('canvas.addEventListener("pointerdown"') && app.includes('window.addEventListener("pointermove"') && app.includes('window.addEventListener("pointerup"'), "LD contact drag supports pointer and touch interactions");
assert.ok(app.includes('contact:null') && app.includes('tile.dataset.contact = contactIndex'), "LD contact pointer targets support append and positional drops");
assert.ok(app.includes("keyboardContactTarget(location, event.key)") && app.includes("event.shiftKey && event.key.startsWith(\"Arrow\")") && app.includes("focusSelectedContact()"), "LD contacts can be moved and refocused with keyboard controls");
assert.ok(html.includes('id="contextMenu"') && app.includes('showContextMenu(event') && app.includes('menu.onkeydown') && ["Aktionen im KOP-Editor", "Àwọn àṣẹ olóòtú ladder", "Ladder editor actions"].every((label) => app.includes(label)), "LD context actions are rendered with keyboard support and localized labels");
assert.ok(html.includes('id="panelLayoutButton"') && app.includes("function showPanelLayout()") && app.includes('id="panelLeftToggle"') && app.includes('id="panelRightToggle"'), "view provides persisted project and inspector panel controls");
assert.match(app, /setPointerCapture\(event\.pointerId\)/, "HMI widgets support pointer and touch repositioning");
console.log(`PASS: ${examples.length} examples, ${examples.reduce((n, e) => n + e.testCases.length, 0)} cases, process models, LD TON/TOF/TP, replay, breakpoints, ST, FBD, SFC, HMI, validation and UI bindings`)
