Warning: truncated output (original token count: 31396)
Total output lines: 882

import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { examples } from "../src/examples.js";
import { applicationMenuLabels, createApplicationMenuEntries } from "../src/app-menus.js";
import { resolveTheme } from "../src/theme.js";
import { ui } from "../src/locale-ui.js";
import { buildLocalizationReport } from "../src/localization.js";
import { hmiScreenCopy } from "../src/hmi-copy.js";
import { defaultProject, getTaskCycleMs, makeProjectFromExample, orderFbdBlocks, runExampleChecks, scan, scanFBD, scanSFC } from "../src/engine.js";
import { validateProject } from "../src/validation.js";
import { countProjectMatches } from "../src/project-search.js";
import { searchExamples } from "../src/example-search.js";
import { validateFbdBlocks, requiredFbdInputs, connectFbdPorts } from "../src/fbd-validation.js";
import { convertLadderToFbd } from "../src/logic-conversion.js";
import { compileStructuredText, executeStructuredText } from "../src/structured-text.js";
import { isApprovedExternalUrl } from "../src/resources.js";
import { evaluateAlarms, createAlarm, setAlarmState, saveRecipe, applyRecipe, captureRecipeInputs, recipeInputChanges, normalizeAlarmHistoryLimit, retainAlarmEvents } from "../src/hmi.js";
import { defaultProcessModel, stepProcesses } from "../src/process.js";
import { renderProcessTwin } from "../src/process-view.js";
import { applyAnalogFaults, applyInputFaults, applyOutputFaults } from "../src/faults.js";
import { createIoScheduleCsv, createIoSchedulePrintHtml, createExampleTestReportCsv, createTrendHistoryCsv, createWiringReferenceHtml, createScenarioTestReportCsv, createScenarioTestReportHtml } from "../src/reports.js";
import { appendTrendSample, trendSampleHeights, trimTrendHistory } from "../src/hmi-history.js";
import { hmiDragPosition, hmiPointerPosition, createSinglePointerGesture } from "../src/hmi-layout.js";
import { fbdBlockPosition, moveFbdBlocks, fbdCanvasSize, fbdVisibleBlockIndices, fbdZoomToFit, copyFbdBlocks, pasteFbdBlocks, assignFbdCopyTags, createFbdInternalBoolTag, removeFbdBlocks } from "../src/fbd-layout.js";
import { runScenario, validateScenario } from "../src/scenarios.js";
import { isHistoricalBreakpoint, shiftHistoricalBreakpoints } from "../src/trace-utils.js";
import { contactSelectionKey, updateContactSelection, removeSelectedContacts, moveContact } from "../src/ld-selection.js";
import { sortProjectsByRecent } from "../src/project-list.js";
import { calculateRungWindow } from "../src/ladder-virtualization.js";
import { ensureHmiScreens, addHmiScreen, selectHmiScreen, renameHmiScreen, deleteActiveHmiScreen } from "../src/hmi-screens.js";
import { recordOperationsScan, calculateOperations, createOperationsReportCsv } from "../src/operations.js";
import { eventLogUi } from "../src/locale-ui.js";
import { resolveProjectLanguage } from "../src/project-language.js";
import { runStandardsChecks, STANDARDS_CHECK_SCOPE } from "../src/standards.js";
import { compileWorkerRequest } from "../src/st-compiler-worker.js";
import { createPlcopenXml, parsePlcopenXml } from "../src/plcopen.js";
import { assertProjectFileSize, normalizeImportedProject } from "../src/project-import.js";
import { formatLocaleDateTime, formatLocaleNumber, formatLocaleTime } from "../src/formatting.js";

assert.equal(examples.length, 1000, "there must be exactly 1,000 examples");
assert.deepEqual(examples.reduce((counts, example) => (counts[example.category.en] = (counts[example.category.en] || 0) + 1, counts), {}), {
  "Core / Beginner":200,"Motor Control":200,"Process Control":200,"Safety & Interlocks":200,"Traffic & Lighting":100,"Building Automation":100,
}, "the library contains the requested category totals");
assert.ok(examples.every((example) => example.logic.rungs.length >= 10 && example.logic.rungs.length <= 20), "every example contains 10–20 ladder rungs");
assert.ok(examples.every((example) => example.description?.en && example.howToTest?.en), "every example has a scenario description and test instructions");
const importableDefault = defaultProject(), normalizedDefault = normalizeImportedProject(importableDefault);
assert.deepEqual(normalizedDefault, importableDefault, "native project imports preserve project fields");
assert.notEqual(normalizedDefault, importableDefault, "native project imports do not mutate the parsed input object");
for (const example of examples) {
  const nativeProject = makeProjectFromExample(example), importedProject = normalizeImportedProject(nativeProject);
  assert.deepEqual(importedProject, nativeProject, `${example.id}: supported native project data survives import validation`);
}
const legacyImport = normalizeImportedProject({ name:"Legacy project", rungs:[{ contacts:[{ tag:"Start" }] }] });
assert.deepEqual(legacyImport.rungs[0].branches, [[{ tag:"Start", mode:"NO" }]], "legacy single-path contacts receive the supported NO default");
assert.deepEqual(legacyImport.io, { inputs:[], outputs:[] }, "legacy projects receive safe empty I/O lists");
assert.throws(() => normalizeImportedProject(null), /root must be an object/, "project import rejects a non-object root");
assert.throws(() => normalizeImportedProject({ name:"", rungs:[] }), /project name/, "project import rejects an empty project name");
assert.throws(() => normalizeImportedProject({ name:"Unsafe", rungs:[], ...JSON.parse('{"__proto__":{"polluted":true}}') }), /unsafe property name/, "project import rejects prototype-related keys");
assert.throws(() => normalizeImportedProject({ name:"Bad contact", rungs:[{ branches:[[ { tag:"Start", mode:"EXEC" } ]] }] }), /unsupported contact mode/, "project import rejects unsupported contact instructions");
assert.throws(() => normalizeImportedProject({ name:"Bad shape", rungs:[{ branches:"not branches" }] }), /invalid branch list/, "project import rejects malformed branch containers");
assert.throws(() => normalizeImportedProject({ name:"Bad tag", tags:[{ name:"Level", type:"OBJECT" }], rungs:[] }), /unsupported type/, "project import rejects unsupported tag types");
assert.throws(() => normalizeImportedProject({ name:"Bad FBD", rungs:[], fbdBlocks:{} }), /function block data/, "project import rejects malformed FBD collections");
assert.throws(() => normalizeImportedProject({ name:"Bad FBD block", rungs:[], fbdBlocks:[{ type:"AND", inputs:"Start" }] }), /inputs must be a list/, "project import rejects malformed FBD inputs");
assert.throws(() => normalizeImportedProject({ name:"Bad SFC", rungs:[], sfc:{ steps:"idle" } }), /sequential chart steps/, "project import rejects malformed SFC collections");
assert.throws(() => normalizeImportedProject({ name:"Bad process", rungs:[], processes:[{ id:"tank", type:"tank", outputTag:"Level", fillRate:"fast" }] }), /invalid fillRate/, "project import rejects nonnumeric process configuration");
assert.throws(() => normalizeImportedProject({ name:"Bad HMI", rungs:[], hmi:{ widgets:"lamp" } }), /HMI widgets must be a list/, "project import rejects malformed HMI collections");
assert.throws(() => normalizeImportedProject({ name:"Bad electrical", rungs:[], electrical:{ components:[], wires:[{ from:"PLC", to:{} }] } }), /invalid endpoints/, "project import rejects malformed electrical connections");
assert.throws(() => normalizeImportedProject({ name:"Unknown electrical type", rungs:[], electrical:{ components:[{ id:"bad", type:"vendorCpu999", reference:"PLC1", x:0, y:0 }], wires:[] } }), /unsupported component type/, "project import rejects unverified electrical component types");
assert.throws(() => normalizeImportedProject({ name:"Unknown terminal", rungs:[], electrical:{ components:[{ id:"ps1", type:"supply24vdc", reference:"PS1", x:0, y:0 }], wires:[{ from:{ componentId:"ps1", terminal:"L1" }, to:{ componentId:"ps1", terminal:"+" } }] } }), /unknown component terminal/, "project import rejects wires on terminals absent from the supported component definition");
const extendedImport = normalizeImportedProject({
  name:"Extended project", rungs:[],
  fbdBlocks:[{ id:"and-1", type:"AND", inputs:["Start", "Permit"], outputTag:"Run" }],
  sfc:{ initialStep:"idle", outputs:["Run"], steps:[{ id:"idle", name:"Idle", actions:[] }], transitions:[] },
  processes:[{ id:"tank-1", type:"tank", outputTag:"Level", initial:0, capacity:100, fillRate:10, drainRate:8 }],
  hmi:{ screens:[{ id:"main", title:"Main", widgets:[{ id:"lamp-1", type:"lamp", tag:"Run", label:"Running", col:1, row:1 }] }], activeScreenId:"main" },
  electrical:{ components:[{ id:"ps1", type:"supply24vdc", reference:"PS1", x:0, y:0, terminals:["+", "−"], ioMap:{} }], wires:[], inputStates:{} },
});
assert.equal(extendedImport.fbdBlocks[0].outputTag, "Run", "FBD projects pass optional-shape validation");
assert.equal(extendedImport.sfc.steps[0].id, "idle", "SFC projects pass optional-shape validation");
assert.equal(extendedImport.processes[0].fillRate, 10, "process projects preserve numeric configuration");
assert.equal(extendedImport.hmi.screens[0].widgets[0].tag, "Run", "HMI projects pass optional-shape validation");
assert.equal(extendedImport.electrical.components[0].reference, "PS1", "electrical projects pass optional-shape validation");
assertProjectFileSize(5 * 1024 * 1024);
assert.throws(() => assertProjectFileSize(5 * 1024 * 1024 + 1), /no larger than 5 MiB/, "oversized project files are rejected before reading");
const appSource = readFileSync(new URL("../src/app.js", import.meta.url), "utf8"), importHandler = appSource.slice(appSource.indexOf('$("#fileInput").addEventListener("change"'), appSource.indexOf("async function showPalette"));
assert.ok(importHandler.indexOf("assertProjectFileSize(file.size)") < importHandler.indexOf("await file.text()"), "file size is checked before importing file content");
assert.ok(importHandler.indexOf("normalizeImportedProject(parsed)") < importHandler.indexOf("push…26396 tokens truncated…indexOf("const syncCondition = () =>"), alarmSyncEnd=appSource.indexOf('$("#alarmTag").addEventListener',alarmSyncStart);
const alarmSyncSource=appSource.slice(alarmSyncStart,alarmSyncEnd);
let alarmTagType="REAL",thresholdHidden=true; const boolOption={disabled:false}; const conditionSelect={value:"bool",disabled:false,querySelector:()=>boolOption};
const alarmSyncContext={$:id=>id==="#alarmTag"?{selectedOptions:[{dataset:{type:alarmTagType}}]}:id==="#alarmCondition"?conditionSelect:{classList:{toggle:(_name,hidden)=>{thresholdHidden=hidden;}}}};
runInNewContext("{ "+alarmSyncSource+"syncCondition(); }",alarmSyncContext);
assert.equal(conditionSelect.value,"gte"); assert.equal(boolOption.disabled,true); assert.equal(thresholdHidden,false);
conditionSelect.value="lte"; runInNewContext("{ "+alarmSyncSource+"syncCondition(); }",alarmSyncContext); assert.equal(conditionSelect.value,"lte");
alarmTagType="BOOL"; runInNewContext("{ "+alarmSyncSource+"syncCondition(); }",alarmSyncContext); assert.equal(conditionSelect.value,"bool"); assert.equal(conditionSelect.disabled,true); assert.equal(thresholdHidden,true);
assert.match(appSource,/!\$\("#alarmThreshold"\)\.value\.trim\(\)/,"blank threshold is not silently coerced to zero");

assert.match(appSource,/id="recipeName" maxlength="120" required/,"recipe naming is available inline");
assert.doesNotMatch(appSource,/prompt\("Recipe name"\)/,"recipes do not depend on native prompts");
assert.match(appSource,/saveHmiRecipe\(field.value\)\) showRecipes\(\)/,"recipe list refreshes only after a successful save");

const saveRecipeFlowSource=appSource.slice(appSource.indexOf("function saveHmiRecipe("),appSource.indexOf("function showRecipes()"));
const recipeFlowProject={tags:recipeTags,hmi:{recipes:[]}}; let recipePersisted=0;
const recipeFlowContext={language:"en",project:recipeFlowProject,sim:{values:recipeValues},hmiModel:()=>recipeFlowProject.hmi,inferTags:()=>({inputs:recipeTags.map(tag=>tag.name)}),captureRecipeInputs,saveRecipe,pushHistory:()=>{},logEvent:()=>{},persist:()=>recipePersisted++,toast:()=>{}};
assert.equal(runInNewContext(saveRecipeFlowSource+'saveHmiRecipe("QA numeric inputs");',recipeFlowContext),true);
assert.deepEqual(recipeFlowProject.hmi.recipes[0].values,recipeValues,"actual recipe UI save captures typed inputs");
assert.equal(recipePersisted,1);
assert.equal(runInNewContext(saveRecipeFlowSource+'saveHmiRecipe("   ");',recipeFlowContext),false);
assert.equal(recipePersisted,1,"blank recipe names do not persist anything");

const reviewNumericModel=saveRecipe({},"Review fixture",recipeValues,200);
const comparison=recipeInputChanges(reviewNumericModel,reviewNumericModel.recipes[0].id,{Start:false,Speed:1,Count:7,Delay:1500});
assert.equal(comparison.find(row=>row.tag==="Speed").before,1); assert.equal(comparison.find(row=>row.tag==="Speed").after,12.75);
assert.equal(comparison.find(row=>row.tag==="Start").changed,false);
const reviewSource=appSource.slice(appSource.indexOf("function showRecipeReview("),appSource.indexOf("function refreshHmi("));
assert.ok(reviewSource.includes("recipeReviewApply"));
const reviewProject={tags:recipeTags,initialState:{},hmi:structuredClone(reviewNumericModel)}; const reviewButtons={}; let reviewScans=0,reviewSaves=0,reviewHtml="";
const reviewContext={project:reviewProject,sim:{values:{Start:false,Speed:1,Count:7,Delay:1500}},accountUser:{id:"qa-reviewer"},language:"en",hmiModel:()=>reviewContext.project.hmi,recipeUiCopy:()=>({reviewTitle:"Review",tag:"Tag",before:"Current",after:"Recipe",apply:"Apply",cancel:"Back",unchanged:"Unchanged",invalid:"Invalid",applied:"Applied"}),recipeInputChanges,applyRecipe,captureRecipeInputs,formatLocaleNumber:String,escapeHtml:String,modal:(_title,html)=>{reviewHtml=html;},$:id=>reviewButtons[id]||=(id==="#modal"?{close:()=>{}}:{}),showRecipes:()=>{},inferTags:()=>({inputs:recipeTags.map(tag=>tag.name)}),pushHistory:()=>{},logEvent:()=>{},doScan:()=>reviewScans++,persist:()=>reviewSaves++,toast:()=>{},Date};
runInNewContext(reviewSource+`showRecipeReview("${reviewNumericModel.recipes[0].id}");`,reviewContext);
assert.equal(reviewContext.sim.values.Speed,1,"review opening never applies the recipe"); assert.ok(reviewHtml.includes("12.75"));
reviewButtons["#recipeReviewCancel"].onclick(); assert.equal(reviewSaves,0,"cancel does not persist or apply");
reviewButtons["#recipeReviewApply"].onclick(); assert.equal(reviewContext.sim.values.Speed,12.75); assert.equal(reviewScans,1); assert.equal(reviewSaves,1);
assert.equal(reviewProject.hmi.recipeEvents[0].actor,"qa-reviewer"); assert.equal(reviewProject.hmi.recipeEvents[0].changes.find(row=>row.tag==="Speed").before,1);
reviewContext.project=structuredClone(reviewProject); reviewContext.sim.values.Speed=3; reviewButtons["#recipeReviewApply"].onclick(); assert.equal(reviewContext.sim.values.Speed,3,"stale review cannot change another project");

reviewButtons["#recipeReviewApply"].onclick(); assert.equal(reviewSaves,1,"duplicate apply cannot create duplicate writes");
const recipeCopySource=appSource.slice(appSource.indexOf("function recipeUiCopy("),appSource.indexOf("function showRecipes()"));
for (const locale of ["en","de","yo","pcm"]) { const copy=runInNewContext(recipeCopySource+"recipeUiCopy();",{language:locale}); for(const key of ["title","review","reviewTitle","before","after","apply","cancel","invalid","saved","applied"]) assert.ok(copy[key]?.trim(),`${locale} recipe copy includes ${key}`); }

reviewContext.project=reviewProject; runInNewContext(reviewSource+`showRecipeReview("${reviewNumericModel.recipes[0].id}");`,reviewContext);
reviewContext.project=structuredClone(reviewProject); reviewContext.sim.values.Speed=4; reviewButtons["#recipeReviewApply"].onclick(); assert.equal(reviewContext.sim.values.Speed,4); assert.equal(reviewSaves,1,"a fresh but stale project review cannot write");
reviewContext.project=reviewProject; reviewProject.hmi.recipeEvents=Array.from({length:205},()=>({type:"old"}));
runInNewContext(reviewSource+`showRecipeReview("${reviewNumericModel.recipes[0].id}");`,reviewContext); reviewButtons["#recipeReviewApply"].onclick(); assert.equal(reviewProject.hmi.recipeEvents.length,200,"local recipe event history is bounded");

const alarmHistoryFixture=Array.from({length:2500},(_,index)=>({time:2500-index,type:"raised",tag:"Start"}));
for(const limit of [100,500,2000]) {
 const retained=retainAlarmEvents(alarmHistoryFixture,[{time:3000,type:"configured",tag:"Start"}],limit);
 assert.equal(retained.length,limit); assert.equal(retained[0].time,3000); assert.equal(retained[limit-1].time,2500-(limit-2));
}
assert.equal(alarmHistoryFixture.length,2500,"retention helper does not mutate prior history");
assert.equal(normalizeAlarmHistoryLimit(undefined),500);assert.equal(normalizeAlarmHistoryLimit(-1),500);
assert.equal(normalizeAlarmHistoryLimit(Infinity),500);
const historySource=appSource.slice(appSource.indexOf("function showAlarmHistory()"),appSource.indexOf("function exportTrendHistory()"));
const historyProject={hmi:{alarmEvents:alarmHistoryFixture.slice(0,205),alarmHistoryLimit:500}};const historyFields={"#alarmHistoryLimit":{},"#alarmHistoryExport":{}};let historySnapshot,historyWrites=0;
const historyContext={language:"en",project:historyProject,hmiModel:()=>historyProject.hmi,alarmUiCopy:()=>({history:"History",raised:"Raised",noneEvents:"None",export:"Export"}),modal:()=>{},escapeHtml:String,formatLocaleDateTime:String,$:id=>historyFields[id],normalizeAlarmHistoryLimit,retainAlarmEvents,pushHistory:()=>{historySnapshot=structuredClone(historyProject);},persist:()=>historyWrites++};
runInNewContext(historySource+"showAlarmHistory();",historyContext);
assert.equal(historyFields["#alarmHistoryLimit"].value,"500");
historyFields["#alarmHistoryLimit"].value="100";historyFields["#alarmHistoryLimit"].onchange();
assert.equal(historyProject.hmi.alarmEvents.length,100);assert.equal(historyProject.hmi.alarmHistoryLimit,100);assert.equal(historySnapshot.hmi.alarmEvents.length,205,"undo snapshot precedes retention trimming");assert.equal(historyWrites,1);
const persistedAlarmHistory=JSON.parse(JSON.stringify(historyProject));assert.equal(persistedAlarmHistory.hmi.alarmHistoryLimit,100);
const badHistoryProject=structuredClone(project);badHistoryProject.hmi={alarmHistoryLimit:20};assert.ok(validateProject(badHistoryProject).some(issue=>issue.code==="alarm-history-limit"));

// Hysteresis must suppress chatter, clear at its boundary, and preserve legacy zero-margin alarms.
for (const [operator,threshold,hysteresis,readings,expected] of [
 ["gte",75,5,[74,75,74,71,70,71,75],[false,true,true,true,false,false,true]],
 ["lte",10,2,[11,10,11,11.9,12,11,10],[false,true,true,true,false,false,true]],
 ["gte",0,2,[-1,0,-1,-2],[false,true,true,false]],
 ["lte",-10,2,[-9,-10,-9,-8],[false,true,true,false]],
 ["gte",75,0,[75,74.99],[true,false]],
 ["lte",10,0,[10,10.01],[true,false]]
]) {
 let state=createAlarm({}, {tag:"PV",condition:{kind:"threshold",operator,threshold,hysteresis}},1), transitions=0;
 for (let i=0;i<readings.length;i++) {
  const result=evaluateAlarms(JSON.parse(JSON.stringify(state)),{PV:readings[i]},i+2);
  assert.equal(result.alarms[0].active,expected[i],`${operator} hysteresis at ${readings[i]}`);
  if (i && expected[i]===expected[i-1]) assert.equal(result.events.length,0,"inside band creates no repeated event");
  transitions+=result.events.length; state={...state,alarms:result.alarms};
 }
 assert.ok(transitions>0);
}
for (const margin of [-1,"2",NaN,Infinity,null]) {
 const invalid=structuredClone(thresholdProject);invalid.hmi.alarms[0].tag="TemperaturePV";invalid.hmi.alarms[0].condition={kind:"threshold",operator:"gte",threshold:75,hysteresis:margin};
 assert.ok(validateProject(invalid).some(issue=>issue.code==="alarm-hysteresis"));
 assert.equal(evaluateAlarms(invalid.hmi,{TemperaturePV:80}).alarms[0].active,false);
}
assert.match(appSource,/id="alarmHysteresis" type="number" step="any" min="0" value="0"/);

