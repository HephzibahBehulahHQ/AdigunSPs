Warning: truncated output (original token count: 65713)
Total output lines: 1191

import { scan, scanFBD, scanSFC, defaultProject, makeProjectFromExample, runExampleChecks, getTaskCycleMs } from "./engine.js";
import { store } from "./store.js";
import { validateProject } from "./validation.js";
import { compileStructuredText, executeStructuredText } from "./structured-text.js";
import { runStandardsChecks } from "./standards.js";
import { appendResourceAudit, checkResourceLink, isApprovedExternalUrl, readResourceAudit, readResourceRegistry, removeResource, resources, saveResource } from "./resources.js";
import { evaluateAlarms, createAlarm, setAlarmState, saveRecipe, applyRecipe } from "./hmi.js";
import { stepProcesses, defaultProcessModel } from "./process.js";
import { brand, brandPresentation } from "./brand.js";
import { resolveTheme } from "./theme.js";
import { simulateElectricalDiagram } from "./electrical.js";
import { countProjectMatches } from "./project-search.js";
import { renderProcessTwin } from "./process-view.js";
import { applyAnalogFaults, applyInputFaults, applyOutputFaults } from "./faults.js";
import { createIoScheduleCsv, createIoSchedulePrintHtml, createExampleTestReportCsv, createTrendHistoryCsv, createWiringReferenceHtml, createHardwareBomCsv, createHardwareBomPrintHtml, createScenarioTestReportCsv, createScenarioTestReportHtml, createPanelLayoutReferenceHtml } from "./reports.js";
import { validateHardwareItem } from "./hardware.js";
import { hmiDragPosition } from "./hmi-layout.js";
import { validateScenario, runScenario } from "./scenarios.js";
import { appendTrendSample, trendSampleHeights, trimTrendHistory } from "./hmi-history.js";
import { isHistoricalBreakpoint, shiftHistoricalBreakpoints } from "./trace-utils.js";
import { sortProjectsByRecent } from "./project-list.js";
import { recordOperationsScan, calculateOperations, createOperationsReportCsv } from "./operations.js";
import { resolveProjectLanguage } from "./project-language.js";
import { ensureHmiScreens, addHmiScreen, selectHmiScreen, renameHmiScreen, deleteActiveHmiScreen } from "./hmi-screens.js";

let examplesPromise;
const loadExamples = () => examplesPromise ||= import("./examples.js").then((module) => module.examples);
import { contactSelectionKey, updateContactSelection, removeSelectedContacts, moveContact } from "./ld-selection.js";
import { fbdBlockPosition, moveFbdBlocks, fbdCanvasSize, fbdVisibleBlockIndices, fbdZoomToFit, copyFbdBlocks, pasteFbdBlocks, assignFbdCopyTags, removeFbdBlocks, FBD_GRID } from "./fbd-layout.js";
import { validateFbdBlocks, connectFbdPorts, requiredFbdInputs } from "./fbd-validation.js";
import { convertLadderToFbd } from "./logic-conversion.js";
import { formatLocaleDateTime, formatLocaleNumber, formatLocaleTime } from "./formatting.js";

import { ui, eventLogUi } from "./locale-ui.js";
import { buildLocalizationReport} from "./localization.js";
import { applicationMenuLabels, createApplicationMenuEntries } from "./app-menus.js";
import { calculateRungWindow } from "./ladder-virtualization.js";
import { createPlcopenXml, parsePlcopenXml } from "./plcopen.js";
import { adigunAiLabels, answerAdigunQuestion } from "./adigun-ai.js";
import { createProtocolMemory, simulateModbusTcp } from "./protocol-sim.js";
import { renderElectricalWorkspace } from "./electrical-ui.js";
const $ = (s) => document.querySelector(s);

const tour = {
  en: { title:"Quick tour", steps:[["Inputs", "Open I/O to toggle simulated sensor and button inputs."], ["Trace the rung", "Select a contact or coil to inspect and edit it. Energized paths turn green during scans."], ["Run a scan", "Use Step for one scan, Run for continuous scans, Pause to hold, and Reset to clear timer/output state."], ["Learn from examples", "Open the Example browser to load one of the 200 tested learning projects."]], previous:"Back", next:"Next", finish:"Finish", start:"Start quick tour", continue:"Continue", welcome:"Build and simulate PLC logic locally. No physical controller is connected." },
  de: { title:"Kurze Einführung", steps:[["Eingänge", "Öffne E/A und schalte simulierte Sensoren und Taster."], ["Strompfad ansehen", "Wähle Kontakt oder Spule zum Bearbeiten. Aktive Pfade leuchten bei Scans grün."], ["Scan ausführen", "Schritt führt einen Scan aus, Start läuft kontinuierlich, Pause hält an, Reset löscht Timer und Ausgänge."], ["Mit Beispielen lernen", "Öffne die Beispiele und lade eines der 200 geprüften Lernprojekte."]], previous:"Zurück", next:"Weiter", finish:"Fertig", start:"Kurze Einführung starten", continue:"Weiter", welcome:"Erstelle und simuliere SPS-Logik lokal. Es ist keine physische Steuerung verbunden." },
  yo: { title:"Ìrìnàjò kúkúrú", steps:[["Àwọn ìwọlé", "Ṣí I/O láti tan tàbí pa sensọ̀ àti bọ́tìnì ìṣàfarawé."], ["Tẹ̀lé rung", "Yan contact tàbí coil láti ṣàtúnṣe. Ọ̀nà tó ṣiṣẹ́ máa di àwọ̀ ewé."], ["Ṣe scan", "Step ṣe scan kan, Run ń ṣe scan léraléra, Pause dá a dúró, Reset tún aago àti ìjáde bẹ̀rẹ̀."], ["Kẹ́kọ̀ọ́ láti àpẹẹrẹ", "Ṣí ibi àpẹẹrẹ kí o gbé ọ̀kan nínú àwọn iṣẹ́ ẹ̀kọ́ 200 wọlé."]], previous:"Padà", next:"Tẹ̀síwájú", finish:"Parí", start:"Bẹ̀rẹ̀ ìrìnàjò", continue:"Tẹ̀síwájú", welcome:"Ṣẹ̀dá kí o sì ṣe àfarawé ìṣàkóso PLC lórí ẹ̀rọ yìí. Kò sí PLC gidi tó sopọ̀ mọ́ ọn." },
  pcm: { title:"Quick tour", steps:[["Inputs", "Open I/O make you toggle simulated sensor and button inputs."], ["Follow the rung", "Select contact or coil make you edit am. Active path go show green during scan."], ["Run one scan", "Step do one scan, Run dey scan continously, Pause hold am, Reset clear timer and output."], ["Learn with examples", "Open Examples make you load one of the 200 tested learning projects."]], previous:"Go back", next:"Next", finish:"Finish", start:"Start quick tour", continue:"Continue", welcome:"Build and simulate PLC logic for this device. No physical controller connect." },
};
let language = localStorage.getItem("adigun-language") || "en";
let adigunAiMessages = [];
let protocolMemory = createProtocolMemory();
let protocolTraffic = [];
let workspaceView = localStorage.getItem("adigun-workspace-view") || "logic";
let panelLayout = (() => { try { return { left:true, right:true, ...JSON.parse(localStorage.getItem("adigun-panel-layout") || "{}") }; } catch { return { left:true, right:true }; } })();
const preferences = (() => { try { return { autosave:true, speed:"normal", contrast:false, dyslexia:false, snap:true, trendRetention:60, theme:"system", ...JSON.parse(localStorage.getItem("adigun-preferences") || "{}") }; } catch { return { autosave:true, speed:"normal", contrast:false, dyslexia:false, snap:true, trendRetention:60, theme:"system" }; } })();
let project;
let sim = { outputs: {}, timers: {}, energized: {}, values: {} };
let runTimer = null, scans = 0, zoom = 100, selection = null, selectedContacts = new Set(), history = [], future = [], grid = true, copiedRung = null, copiedFbdBlocks = null, panSpaceHeld = false, canvasPan = null, viewProjectId = null;
let traceFrames = [], traceRecording = false, traceReplay = false, traceCursor = 0, traceInitial = null, traceInitialFaults = [], traceProjectKey = "", traceMismatches = [], traceBreakpoints = new Set();
let simulationFaults = [], contactPointerDrag = null, suppressContactClick = false, sessionOperations = { elapsedMs:0, outputRuntimeMs:{} };
const forcedInputs = {};
const ladderRungHeights = new Map();
const fbdBlockHeights = new Map();
let ladderVirtualFrame = 0, ladderVirtualEventsBound = false, ladderPrinting = false;
let fbdVirtualFrame = 0, fbdVirtualEventsBound = false;
const breakpoints = new Set();
let lastScanMs = 0, compiledST = null, compiledSTSignature = "", stCompilerWorker = null, stCompileSequence = 0;
const pendingSTCompiles = new Map();
const eventLog = [];
const hmiHistory = {};
const t = (key) => ui[language]?.[key] || ui.en[key] || key;

function toast(message) { const node = $("#toast"); node.textContent = message; node.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove("show"), 1900); }
function logEvent(type, message, detail = {}) { eventLog.unshift({ time:new Date().toISOString(), scan:scans, type, message, ...detail }); if (eventLog.length > 500) eventLog.length = 500; }
function projectRungs(p) { return p.rungs.map((r) => ({ ...r, branches: r.branches?.length ? r.branches : [r.contacts || []] })); }
function serializeProject() { return { ...project, rungs: projectRungs(project) }; }
function reportLanguage() { return resolveProjectLanguage(project, language); }
function stCompileSignature(source, tags) { return JSON.stringify([source, tags]); }
function getSTCompilerWorker() {
  if (stCompilerWorker) return stCompilerWorker;
  try {
    const worker = new Worker(new URL("./st-compiler-worker.js", import.meta.url), { type:"module" });
    worker.onmessage = ({ data }) => { const pending = pendingSTCompiles.get(data.id); if (!pending) return; clearTimeout(pending.timeout); pendingSTCompiles.delete(data.id); pending.resolve(data.result); };
    worker.onerror = () => { for (const [id, pending] of pendingSTCompiles) { clearTimeout(pending.timeout); pendingSTCompiles.delete(id); pending.resolve(compileStructuredText(pending.source, pending.tags)); } worker.terminate(); stCompilerWorker = null; };
    stCompilerWorker = worker;
  } catch { stCompilerWorker = null; }
  return stCompilerWorker;
}
function compileSTSource(source, tags) {
  const worker = getSTCompilerWorker(); if (!worker) return Promise.resolve(compileStructuredText(source, tags));
  const id = ++stCompileSequence;
  return new Promise((resolve) => {
    const timeout = setTimeout(() => { const pending = pendingSTCompiles.get(id); if (!pending) return; pendingSTCompiles.delete(id); resolve(compileStructuredText(source, tags)); }, 10000);
    pendingSTCompiles.set(id, { source, tags, resolve, timeout });
    try { worker.postMessage({ id, source, tags }); } catch { clearTimeout(timeout); pendingSTCompiles.delete(id); resolve(compileStructuredText(source, tags)); }
  });
}
function pushHistory() { history.push(structuredClone(project)); if (history.length > 60) history.shift(); future = []; }
async function persist(show = false, force = false) { if (!project) return; if (!preferences.autosave && !force) { $("#saveState").textContent = language === "de" ? "Nicht gespeichert" : "Unsaved changes"; return; } project.updatedAt = Date.now(); $("#saveState").textContent = t("saving"); try { await store.save(serializeProject()); $("#saveState").textContent = t("saved"); if (show) toast(t("savedToast")); } catch { $("#saveState").textContent = "Storage unavailable"; toast("Browser storage unavailable"); } }
function inferTags() {
  const roles = new Map((project.tags || []).map((tag) => [tag.name, tag.role]));
  const inputs = new Set((project.io?.inputs || []).filter((name) => roles.get(name) !== "internal" && roles.get(name) !== "output"));
  const outputs = new Set(project.io?.outputs || []), signals = new Set(inputs);
  project.rungs.forEach((r) => { (r.branches || [r.contacts || []]).flat().forEach((c) => { if (roles.get(c.tag) !== "output") signals.add(c.tag); }); if (r.coil) outputs.add(r.coil); });
  for (const [name, role] of roles) { if (role === "input") inputs.add(name); if (role === "output") outputs.add(name); if (role !== "output") signals.add(name); }
  outputs.forEach((name) => signals.delete(name)); inputs.forEach((name) => signals.add(name));
  return { inputs: [...inputs], outputs: [...outputs], signals: [...signals] };
}
function analogInputNames() { const inputs = new Set(inferTags().inputs); return (project.tags || []).filter((tag) => tag.type !== "BOOL" && inputs.has(tag.name)).map((tag) => tag.name); }
function analogRuntimeValues(values = sim.values) { return applyAnalogFaults(values || {}, simulationFaults, analogInputNames()); }
function simulatedRuntimeValues(values = sim.values) { return applyInputFaults(analogRuntimeValues(values), simulationFaults); }
function traceNumericInputs() { return Object.fromEntries(analogInputNames().map((name) => [name, sim.values[name] ?? project.initialState?.[name] ?? 0])); }
function rungPaths(rung) { return rung.branches?.length ? rung.branches : [rung.contacts || []]; }
function commitContactMove(source, target) {
  const result = moveContact(project.rungs, source, target);
  if (!result.moved) return false;
  pushHistory(); project.rungs = result.rungs; selectedContacts.clear(); selection = { ...result.destination, kind:"contact" }; render(); persist();
  return true;
}
function keyboardContactTarget(location, key) {
  const paths = rungPaths(project.rungs[location.rung]), path = paths[location.branch];
  if (key === "ArrowLeft" && location.contact > 0) return { ...location, contact:location.contact - 1 };
  if (key === "ArrowRight" && location.contact < path.length - 1) return { ...location, contact:location.contact + 2 < path.length ? location.contact + 2 : null };
  const direction = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
  if (!direction) return null;
  let rung = location.rung, branch = location.branch + direction;
  if (branch < 0 || branch >= paths.length) { rung += direction; if (!project.rungs[rung]) return null; const nextPaths = rungPaths(project.rungs[rung]); branch = direction < 0 ? nextPaths.length - 1 : 0; }
  const targetPath = rungPaths(project.rungs[rung])[branch];
  return targetPath?.length ? { rung, branch, contact:Math.min(location.contact, targetPath.length - 1) } : null;
}
function focusSelectedContact() { const target = selection; if (!target || target.kind !== "contact") return; requestAnimationFrame(() => $("#ladderCanvas").querySelector(`.contact[data-rung="${target.rung}"][data-branch="${target.branch}"][data-contact="${target.contact}"]`)?.focus()); }
function setupContactPointerDrag(canvas) {
  if (canvas.dataset.pointerDragSetup) return; canvas.dataset.pointerDragSetup = "true";
  const clearTargets = () => canvas.querySelectorAll(".drop-target,.is-dragging").forEach((node) => node.classList.remove("drop-target","is-dragging"));
  canvas.addEventListener("pointerdown", (event) => {
    const tile = event.target.closest(".contact"); if (!tile || event.button !== 0) return;
    contactPointerDrag = { pointerId:event.pointerId, source:{ rung:Number(tile.dataset.rung), branch:Number(tile.dataset.branch), contact:Number(tile.dataset.contact) }, startX:event.clientX, startY:event.clientY, active:false, tile };
    tile.setPointerCapture?.(event.pointerId);
  });
  window.addEventListener("pointermove", (event) => {
    if (!contactPointerDrag || event.pointerId !== contactPointerDrag.pointerId) return;
    if (!contactPointerDrag.active && Math.hypot(event.clientX - contactPointerDrag.startX, event.clientY - contactPointerDrag.startY) < 8) return;
    contactPointerDrag.active = true; event.preventDefault(); clearTargets(); contactPointerDrag.tile.classList.add("is-dragging");
    const hit = document.elementFromPoint(event.clientX, event.clientY), target = hit?.closest(".contact,.logic-branch"); if (target && canvas.contains(target)) target.classList.add("drop-target");
  }, { passive:false });
  window.addEventListener("pointerup", (event) => {
    if (!contactPointerDrag || event.pointerId !== contactPointerDrag.pointerId) return;
    const drag = contactPointerDrag; contactPointerDrag = null; clearTargets();
    if (!drag.active) return;
    suppressContactClick = true; setTimeout(() => { suppressContactClick = false; }, 0);
    const hit = document.elementFromPoint(event.clientX, event.clientY), contact = hit?.closest(".contact"), row = hit?.closest(".logic-branch"), target = contact ? { rung:Number(contact.dataset.rung), branch:Number(contact.dataset.branch), contact:Number(contact.dataset.contact) } : row ? { rung:Number(row.dataset.rung), branch:Number(row.dataset.branch), contact:null } : null;
    if (target && canvas.contains(hit)) commitContactMove(drag.source, target);
  });
  window.addEventListener("pointercancel", (event) => { if (contactPointerDrag?.pointerId === event.pointerId) { contactPointerDrag = null; clearTargets(); } });
}
const contextCopy = {
  en:{ menu:"Ladder editor actions", fbdMenu:"Function block editor actions", editContact:"Edit contact", deleteContacts:"Delete selected contacts", editCoil:"Edit coil", addContact:"Add contact", addBranch:"Add parallel branch", addTimer:"Add timer", addCounter:"Add counter", duplicateRung:"Duplicate rung", deleteRung:"Delete rung", copyBlocks:"Copy selected blocks", cutBlocks:"Cut selected blocks", duplicateBlocks:"Duplicate selected blocks", deleteBlocks:"Delete selected blocks" },
  de:{ menu:"Aktionen im KOP-Editor", fbdMenu:"Aktionen im Funktionsplan-Editor", editContact:"Kontakt bearbeiten", deleteContacts:"Ausgewählte Kontakte löschen", editCoil:"Spule bearbeiten", addContact:"Kontakt hinzufügen", addBranch:"Parallelen Zweig hinzufügen", addTimer:"Zeitglied hinzufügen", addCounter:"Zähler hinzufügen", duplicateRung:"Netzwerk duplizieren", deleteRung:"Netzwerk löschen", copyBlocks:"Ausgewählte Bausteine kopieren", cutBlocks:"Ausgewählte Bausteine ausschneiden", duplicateBlocks:"Ausgewählte Bausteine duplizieren", deleteBlocks:"Ausgewählte Bausteine löschen" },
  yo:{ menu:"Àwọn àṣẹ olóòtú ladder", fbdMenu:"Àwọn àṣẹ olóòtú block iṣẹ́", editContact:"Ṣàtúnṣe contact", deleteContacts:"Pa àwọn contact tí a yan rẹ́", editCoil:"Ṣàtúnṣe coil", addContact:"Fi contact kún un", addBranch:"Fi ẹ̀ka parallel kún un", addTimer:"Fi aago kún un", addCounter:"Fi kọ́ńtà kún un", duplicateRung:"Ṣe ẹ̀dà rung", deleteRung:"Pa rung rẹ́", copyBlocks:"Da àwọn block tí a yan kọ́", cutBlocks:"Ge àwọn block tí a yan kúrò", duplicateBlocks:"Ṣe ẹ̀dà àwọn block tí a yan", deleteBlocks:"Pa àwọn block tí a yan rẹ́" },
  pcm:{ menu:"Ladder editor actions", fbdMenu:"Function block editor actions", editContact:"Edit contact", deleteContacts:"Delete contacts wey you select", editCoil:"Edit coil", addContact:"Add contact", addBranch:"Add parallel branch", addTimer:"Add timer", addCounter:"Add counter", duplicateRung:"Copy rung", deleteRung:"Delete rung", copyBlocks:"Copy blocks wey you select", cutBlocks:"Cut blocks wey you select", duplicateBlocks:"Duplicate blocks wey you select", deleteBlocks:"Delete blocks wey you select" },
};
const fbdValidationCopy = {
  en:{valid:"Connections valid",review:"Review block",missing:"Input {tag} is undeclared or unconnected",numeric:"{tag} must be numeric",bool:"{tag} must be BOOL",duplicate:"Output {tag} has more than one producer",cycle:"Function block dependencies contain a cycle",count:"Input count does not match this function",output:"Output tag is missing or undeclared",outputType:"Output {tag} must be {expected}",countTag:"Counter value tag is missing or undeclared",countType:"Counter value tag must be numeric",preset:"Timer/counter preset must be positive",scale:"SCALE ranges are invalid",type:"Function block type is unsupported"},
  de:{valid:"Verbindungen gültig",review:"Baustein prüfen",missing:"Eingang {tag} ist nicht deklariert oder verbunden",numeric:"{tag} muss numerisch sein",bool:"{tag} muss BOOL sein",duplicate:"Ausgang {tag} wird mehrfach erzeugt",cycle:"Abhängigkeiten der Funktionsbausteine enthalten einen Zyklus",count:"Anzahl der Eingänge passt nicht zur Funktion",output:"Ausgangs-Tag fehlt oder ist nicht deklariert",outputType:"Ausgang {tag} muss {expected} sein",countTag:"Zählwert-Tag fehlt oder ist nicht deklariert",countType:"Zählwert-Tag muss numerisch sein",preset:"Zeit-/Zählvorgabe muss positiv sein",scale:"SCALE-Bereiche sind ungültig",type:"Funktionsbausteintyp wird nicht unterstützt"},
  yo:{valid:"Àwọn ìsopọ̀ dára",review:"Ṣàyẹ̀wò block yìí",missing:"A kò kéde input {tag} tàbí kò ní ìsopọ̀",numeric:"{tag} gbọ́dọ̀ jẹ́ nọ́ńbà",bool:"{tag} gbọ́dọ̀ jẹ́ BOOL",duplicate:"Block ju ọkan lọ ń ṣe output {tag}",cycle:"Ìgbẹ́kẹ̀lé àwọn function block ní cycle",count:"Iye input kò bá iṣẹ́ yìí mu",output:"Output tag kò sí tàbí a kò kéde rẹ̀",outputType:"Output {tag} gbọ́dọ̀ jẹ́ {expected}",countTag:"Counter tag kò sí tàbí a kò kéde rẹ̀",countType:"Counter tag gbọ́dọ̀ jẹ́ nọ́ńbà",preset:"Preset timer/counter gbọ́dọ̀ ju odo lọ",scale:"Àwọn range SCALE kò bófin mu",type:"A kò ṣe atilẹyin fún irú function block yìí"},
  pcm:{valid:"Connection dem okay",review:"Check this block",missing:"Input {tag} no dey declared or connected",numeric:"{tag} suppose be numeric",bool:"{tag} suppose be BOOL",duplicate:"More than one block dey produce output {tag}",cycle:"Function block connections get a cycle",count:"Input number no match this function",output:"Output tag no dey or no declare am",outputType:"Output {tag} suppose be {expected}",countTag:"Counter value tag no dey or no declare am",countType:"Counter value tag suppose be numeric",preset:"Timer/counter preset suppose pass zero",scale:"SCALE ranges no correct",type:"This function block type no dey supported"},
};
const fbdAccessibilityCopy = {
  en:{title:"Function block outline",block:"Block",inputs:"Inputs",output:"Output",wiringHelp:"Keyboard wiring: focus an output port and press Enter, then focus an input port and press Enter. Press Escape to cancel.",chooseInput:"Output selected. Choose an input port.",chooseOutput:"Choose an output port first.",connected:"Function block connection added.",typeError:"Connection rejected: incompatible BOOL and numeric types.",cycleError:"Connection rejected: it would create a dependency cycle.",cancelled:"Connection cancelled."},
  de:{title:"Funktionsplanübersicht",block:"Baustein",inputs:"Eingänge",output:"Ausgang",wiringHelp:"Tastaturverbindung: Ausgangsport fokussieren und Enter drücken, dann Eingangsport fokussieren und Enter drücken. Escape bricht ab.",chooseInput:"Ausgang gewählt. Eingangsport wählen.",chooseOutput:"Zuerst einen Ausgangsport wählen.",connected:"Funktionsbaustein verbunden.",typeError:"Verbindung abgelehnt: BOOL- und Zahlentypen sind inkompatibel.",cycleError:"Verbindung abgelehnt: Es entstünde ein Abhängigkeitszyklus.",cancelled:"Verbindung abgebrochen."},
  yo:{title:"Àkótán function block",block:"Block",inputs:"Àwọn input",output:"Output",wiringHelp:"Ìsopọ̀ pẹ̀lú keyboard: yan output port, tẹ Enter; lẹ́yìn náà yan input port, tẹ Enter. Tẹ Escape láti fagilé.",chooseInput:"A ti yan output. Yan input port.",chooseOutput:"Yan output port kọ́kọ́.",connected:"A ti so function block pọ̀.",typeError:"A kọ ìsopọ̀ náà: BOOL àti nọ́ńbà kò bá ara wọn mu.",cycleError:"A kọ ìsopọ̀ náà: yóò dá dependency cycle sílẹ̀.",cancelled:"A fagilé ìsopọ̀ náà."},
  pcm:{title:"Function block outline",block:"Block",inputs:"Inputs",output:"Output",wiringHelp:"Keyboard wiring: select output port and press Enter, then select input port and press Enter. Press Escape to cancel.",chooseInput:"Output don select. Choose input port.",chooseOutput:"Choose output port first.",connected:"Function block connection don add.",typeError:"Connection no work: BOOL and numeric types no match.",cycleError:"Connection no work: e go create dependency cycle.",cancelled:"Connection don cancel."},
};
const sfcAccessibilityCopy = {
  en:{title:"Sequence chart outline",step:"Step",transition:"Transition",condition:"Condition"},
  de:{title:"Ablaufkettenübersicht",step:"Schritt",transition:"Transition",condition:"Bedingung"},
  yo:{title:"Àkótán sequence chart",step:"Ìgbésẹ̀",transition:"Ìyípadà",condition:"Ipò"},
  pcm:{title:"Sequence chart outline",step:"Step",transition:"Transition",condition:"Condition"},
};
function fbdIssueText(issue) { const copy = fbdValidationCopy[language] || fbdValidationCopy.en, key = ({ "fbd-input-tag":"missing", "fbd-numeric-type":"numeric", "fbd-input-type":"bool", "fbd-dependency":"duplicate", "fbd-cycle":"cycle", "fbd-input-count":"count", "fbd-output":"output", "fbd-output-tag":"output", "fbd-output-type":"outputType", "fbd-count-tag":"countTag", "fbd-count-type":"countType", "fbd-preset":"preset", "fbd-scale-range":"scale", "fbd-type":"type" })[issue.code]; return (copy[key] || copy.review).replace("{tag}", issue.tag || "").replace("{expected}", issue.expected === "numeric" ? (language === "de" ? "numerisch" : "numeric") : issue.expected || ""); }
let fbdKeyboardWireStart = null;
function announceFbdWire(text) { const live = $("#fbdWireAnnouncement"); if (live) live.textContent = text; }
function cancelFbdKeyboardWire() { if (fbdKeyboardWireStart == null) return false; fbdKeyboardWireStart = null; $("#fbdBlocks")?.classList.remove("keyboard-wiring"); announceFbdWire((fbdAccessibilityCopy[language] || fbdAccessibilityCopy.en).cancelled); return true; }
function handleFbdPortKeydown(event) {
  if (event.key === "Escape") { if (cancelFbdKeyboardWire()) event.preventDefault(); return; }
  if (!(["Enter", " "].includes(event.key))) return;
  const output = event.currentTarget.hasAttribute("data-fbd-output-handle"), copy = fbdAccessibilityCopy[language] || fbdAccessibilityCopy.en;
  if (output) { event.preventDefault(); fbdKeyboardWireStart = Number(event.currentTarget.dataset.fbdOutputHandle); $("#fbdBlocks").classList.add("keyboard-wiring"); announceFbdWire(copy.chooseInput); return; }
  if (fbdKeyboardWireStart == null) { event.preventDefault(); announceFbdWire(copy.chooseOutput); return; }
  const sourceIndex = fbdKeyboardWireStart, targetIndex = Number(event.currentTarget.dataset.fbdInputHandle), inputIndex = Number(event.currentTarget.dataset.fbdInputIndex), result = connectFbdPorts(project.fbdBlocks || [], sourceIndex, targetIndex, inputIndex);
  event.preventDefault();
  if (!result.ok) { announceFbdWire(result.code === "cycle" ? copy.cycleError : copy.typeError); return; }
  pushHistory(); project.fbdBlocks = result.blocks; fbdKeyboardWireStart = null; $("#fbdBlocks").classList.remove("keyboard-wiring"); render(); persist();
  requestAnimationFrame(() => { const target = $("#fbdBlocks").querySelector(`[data-fbd-input-handle="${targetIndex}"][data-fbd-input-index="${inputIndex}"]`); target?.focus(); announceFbdWire(copy.connected); });
}
const edgeContactCopy = {
  en:{ rise:"Rising edge (one scan)", fall:"Falling edge (one scan)", rising:"Rising edge", falling:"Falling edge", riseMark:"P", fallMark:"N" },
  de:{ rise:"Positive Flanke (ein Zyklus)", fall:"Negative Flanke (ein Zyklus)", rising:"Positive Flanke", falling:"Negative Flanke", riseMark:"P", fallMark:"N" },
  yo:{ rise:"Ìlọ sókè (scan kan)", fall:"Ìṣubú (scan kan)", rising:"Ìlọ sókè", falling:"Ìṣubú", riseMark:"P", fallMark:"N" },
  pcm:{ rise:"Rising edge (one scan)", fall:"Falling edge (one scan)", rising:"Rising edge", falling:"Falling edge", riseMark:"P", fallMark:"N" },
};
const operationsCopy = {
  en:{ button:"⌁ Operations", title:"Operations estimates", note:"Session-only simulated runtime. Energy and cost are estimates from the loads and tariff you enter; cost uses the same currency unit as your tariff. This is not metering or a maintenance/safety assessment.", tariff:"Your tariff per kWh", threshold:"Optional duty-cycle review threshold (%)", output:"Output", load:"Entered load (kW)", average:"Estimated average power (kW)", runtime:"Session runtime (h)", duty:"Duty cycle (%)", energy:"Estimated energy (kWh)", cost:"Estimated cost", advisory:"Review threshold exceeded", elapsed:"Simulated time (h)", save:"Save assumptions", refresh:"Refresh metrics", export:"Export CSV", none:"No output tags are configured.", invalid:"Enter non-negative numeric values; duty threshold must be at most 100.", unentered:"Enter a value to calculate" },
  de:{ button:"⌁ Betrieb", title:"Betriebsschätzungen", note:"Simulierte Laufzeit nur für diese Sitzung. Energie und Kosten sind Schätzungen aus Ihren Eingaben; die Kosten verwenden dieselbe Währungseinheit wie Ihr Tarif. Keine Messung und keine Wartungs- oder Sicherheitsbewertung.", tariff:"Ihr Tarif je kWh", threshold:"Optionaler Prüfschwellenwert für Tastgrad (%)", output:"Ausgang", load:"Eingegebene Last (kW)", average:"Geschätzte mittlere Leistung (kW)", runtime:"Laufzeit dieser Sitzung (h)", duty:"Tastgrad (%)", energy:"Geschätzte Energie (kWh)", cost:"Geschätzte Kosten", advisory:"Prüfschwelle überschritten", elapsed:"Simulierte Zeit (h)", save:"Eingaben speichern", refresh:"Werte aktualisieren", export:"CSV exportieren", none:"Keine Ausgangs-Tags konfiguriert.", invalid:"Werte müssen nichtnegative Zahlen sein; der Tastgrad-Schwellenwert darf höchstens 100 betragen.", unentered:"Wert eingeben, um zu berechnen" },
  yo:{ button:"⌁ Iṣẹ́ ẹ̀rọ", title:"Ìṣírò iṣẹ́ ẹ̀rọ", note:"Àkókò iṣẹ́ ìṣàfarawé fún ìgbà yìí nìkan. Ìṣírò agbára àti owó dá lórí iye tí ìwọ tẹ̀ sí i; owó náà lo ẹyọ owó kan náà bí owó kWh rẹ. Kì í ṣe ìwọ̀n gidi tàbí àyẹ̀wò ààbò/ìtọ́jú.", tariff:"Owó rẹ fún kWh", threshold:"Ààlà ìṣàyẹ̀wò duty cycle (àṣàyàn, %)", output:"Àbájáde", load:"Agbára tí o tẹ̀ sí i (kW)", average:"Agbára àárín tí a fojú díwọ̀n (kW)", runtime:"Àkókò iṣẹ́ ìgbà yìí (wákàtí)", duty:"Duty cycle (%)", energy:"Agbára tí a fojú díwọ̀n (kWh)", cost:"Owó tí a fojú díwọ̀n", advisory:"Ó kọjá ààlà ìṣàyẹ̀wò", elapsed:"Àkókò ìṣàfarawé (wákàtí)", save:"Fipamọ́ àwọn iye wọ̀nyí", refresh:"Tún ìṣírò ṣe", export:"Gbé CSV jáde", none:"Kò sí tag àbájáde tí a ṣètò.", invalid:"Lo nọ́ńbà tí kò kéré sí odo; duty threshold kò gbọ́dọ̀ ju 100 lọ.", unentered:"Tẹ iye kan láti ṣírò" },
  pcm:{ button:"⌁ Operations", title:"Operations estimate", note:"This session simulation runtime only. Energy and cost na estimate from load and tariff wey you enter, and cost dey use the same currency unit as the tariff. E no be meter or maintenance/safety check.", tariff:"Your tariff per kWh", threshold:"Optional duty-cycle review limit (%)", output:"Output", load:"Load wey you enter (kW)", average:"Estimated average power (kW)", runtime:"Runtime this session (h)", duty:"Duty cycle (%)", energy:"Estimated energy (kWh)", cost:"Estimated cost", advisory:"E pass review limit", elapsed:"Simulated time (h)", save:"Save the inputs", refresh:"Refresh numbers", export:"Export CSV", none:"No output tags dey configured.", invalid:"Enter numbers wey no be below zero; duty limit no fit pass 100.", unentered:"Enter value to calculate" },
};
function showContextMenu(event, entries, menuLabel = (contextCopy[language] || contextCopy.en).menu) {
  event.preventDefault(); const menu = $("#contextMenu"); menu.setAttribute("aria-label", menuLabel); menu.innerHTML = entries.map((entry, index) => `${entry.separator ? `<div class="menu-separator" role="separator"></div>` : `<button type="button" role="menuitem" tabindex="-1" class="${entry.danger ? "danger" : ""}" data-context-index="${index}">${escapeHtml(entry.label)}</button>`}`).join("");
  menu.hidden = false; const width = menu.offsetWidth, height = menu.offsetHeight; menu.style.left = `${Math.max(8, Math.min(event.clientX, innerWidth - width - 8))}px`; menu.style.top = `${Math.max(8, Math.min(event.clientY, innerHeight - height - 8))}px`;
  menu.querySelectorAll("[data-context-index]").forEach((button) => button.addEventListener("click", () => { const entry = entries[Number(button.dataset.contextIndex)]; hideContextMenu(); entry.action(); }));
  menu.onkeydown = (keyEvent) => { const buttons = [...menu.querySelectorAll("[role=menuitem]")], index = buttons.indexOf(document.activeElement); if (keyEvent.key === "Escape") { keyEvent.preventDefault(); hideContextMenu(); } else if (["ArrowDown", "ArrowUp"].includes(keyEvent.key)) { keyEvent.preventDefault(); buttons[(index + (keyEvent.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length]?.focus(); } };
  requestAnimationFrame(() => menu.querySelector("[role=menuitem]")?.focus());
}
function hideContextMenu() { const menu = $("#contextMenu"); menu.hidden = true; menu.innerHTML = ""; }
function rungLayoutInfo(rung, index) {
  const branches = rungPaths(rung), signature = JSON.stringify([rung.comment || "", branches.map((branch) => branch.length), Boolean(rung.timer), Boolean(rung.counter), Boolean(rung.scale)]), key = rung.id || `rung-${index}`;
  const cached = ladderRungHeights.get(key);
  const estimate = Math.max(126, 78 + 50 * Math.max(1, branches.length) + (rung.scale ? 36 : 0));
  return { key, signature, height:cached?.signature === signature ? cached.height : estimate };
}
function bindLadderVirtualization(wrap) {
  if (ladderVirtualEventsBound) return;
  ladderVirtualEventsBound = true;
  wrap.addEventListener("scroll", () => {
    if (project.rungs.length <= 80 || ladderPrinting || project.editorType && project.editorType !== "LD" || ladderVirtualFrame) return;
    ladderVirtualFrame = requestAnimationFrame(() => { ladderVirtualFrame = 0; renderLadder(); });
  }, { passive:true });
  window.addEventListener("beforeprint", () => { ladderPrinting = true; renderLadder(); });
  window.addEventListener("afterprint", () => { ladderPrinting = false; renderLadder(); });
}
function renderLadder() {
  const canvas = $("#ladderCanvas"), wrap = $("#canvasWrap"), mode = project.editorType || "LD"; wrap.classList.toggle("hidden", workspaceView === "hmi" || workspaceView === "electrical" || mode !== "LD"); setupContactPointerDrag(canvas); bindLadderVirtualization(wrap); canvas.style.transform = `scale(${zoom / 100})`; canvas.innerHTML = "";
  const virtualized = project.rungs.length > 80 && !ladderPrinting && (project.editorType || "LD") === "LD", layout = project.rungs.map(rungLayoutInfo), scale = zoom / 100;
  const canvasTop = canvas.getBoundingClientRect().top - (wrap.getBoundingClientRect().top + wrap.clientTop) + wrap.scrollTop;
  const windowRange = virtualized ? calculateRungWindow(layout.map((item) => item.height), Math.max(0, wrap.scrollTop - canvasTop), wrap.clientHeight, scale, Number.parseFloat(getComputedStyle(canvas).rowGap) || 16) : { start:0, end:project.rungs.length, top:0, bottom:0, total:0 };
  canvas.setAttribute("aria-setsize", String(project.rungs.length));
  const addSpacer = (height, label) => { if (height <= 0) return; const spacer = document.createElement("div"); spacer.className = "rung-virtual-spacer"; spacer.setAttribute("aria-hidden", "true"); spacer.dataset.virtualSpace = label; spacer.style.height = `${height}px`; canvas.append(spacer); };
  addSpacer(windowRange.top, "before");
  const multiSelectHint = ({ en:"Shift-click to add or remove from selection", de:"Umschalt-Klick fügt zur Auswahl hinzu oder entfernt", yo:"Tẹ Shift láti fi kún àṣàyàn tàbí yọ kúrò", pcm:"Hold Shift click to add or remove selection" })[language];
  const moveHint = ({ en:"Shift+Arrow keys move", de:"Umschalt+Pfeiltasten verschieben", yo:"Lo Shift àti ọfà láti gbé e", pcm:"Hold Shift with arrow keys to move" })[language];
  project.rungs.slice(windowRange.start, windowRange.end).forEach((rung, windowIndex) => {
    const rungIndex = windowRange.start + windowIndex, rungLayout = layout[rungIndex];
    const card = document.createElement("article"); card.className = `rung ${selection?.rung === rungIndex ? "selected" : ""}`; card.setAttribute("role", "listitem"); card.dataset.rung = rungIndex;
    const counterText = ({ en:"CTU Counter", de:"CTU-Zähler", yo:"CTU Kọ́ńtà", pcm:"CTU Counter" })[language];
    card.innerHTML = `<div class="rung-head"><span class="rung-num">NETWORK ${String(rungIndex + 1).padStart(2, "0")}</span><input class="rung-comment" aria-label="Rung comment" value="${escapeAttr(rung.comment || `Rung ${rungIndex + 1}`)}"><span>— LAD</span></div><div class="rail"></div><div class="rung-wire"></div><div class="rung-logic"></div><div class="rung-tools"><button data-rung-action="add" title="Add series contact">＋</button><button data-rung-action="branch" title="Add parallel branch">Y</button><button data-rung-action="remove-branch" title="Remove selected branch">−Y</button><button data-rung-action="timer" title="Add TON timer">T</button><button data-rung-action="counter" title="${counterText}">C</button><button data-rung-action="delete" title="Delete rung">×</button></div>`;
    const breakpointButton = document.createElement("button"); breakpointButton.dataset.rungAction = "breakpoint"; breakpointButton.title = "Toggle LD breakpoint"; breakpointButton.textContent = breakpoints.has(rung.id) ? "●" : "○"; breakpointButton.classList.toggle("active", breakpoints.has(rung.id)); card.querySelector(".rung-tools").prepend(breakpointButton);
    const logic = card.querySelector(".rung-logic"), paths = rungPaths(rung);
    card.querySelector('[data-rung-action="remove-branch"]').disabled = paths.length < 2;
    const pathHost = paths.length > 1 ? document.createElement("div") : logic;
    if (paths.length > 1) { pathHost.className = "parallel-paths"; card.classList.add("has-parallel"); }
    paths.forEach((branch, branchIndex) => {
      const row = document.createElement("div"); row.className = "logic-branch"; row.dataset.rung = rungIndex; row.dataset.branch = branchIndex;
      branch.forEach((contact, contactIndex) => {
        const tile = document.createElement("div"); const active = sim.energized[`${rung.id}:${branchIndex}:${contactIndex}`];
        const location = { rung:rungIndex, branch:branchIndex, contact:contactIndex, kind:"contact" }, selected = selectedContacts.has(contactSelectionKey(location)) || (!selectedContacts.size && selection?.rung === rungIndex && selection?.branch === branchIndex && selection?.contact === contactIndex);
        const edgeCopy = edgeContactCopy[language] || edgeContactCopy.en, edgeMode = contact.mode === "R_TRIG" || contact.mode === "F_TRIG", modeLabel = contact.mode === "R_TRIG" ? edgeCopy.rising : contact.mode === "F_TRIG" ? edgeCopy.falling : contact.mode === "NC" ? t("normallyClosed") : t("normallyOpen"), edgeMark = contact.mode === "R_TRIG" ? edgeCopy.riseMark : edgeCopy.fallMark;
        tile.className = `contact ${contact.mode === "NC" ? "nc" : ""} ${edgeMode ? "edge-contact" : ""} ${active ? "energized" : ""} ${selected ? "selected" : ""}`;
        tile.dataset.rung = rungIndex; tile.dataset.branch = branchIndex; tile.dataset.contact = contactIndex;
        tile.setAttribute("role", "button"); tile.setAttribute("tabindex", "0"); tile.setAttribute("aria-label", `${contact.tag} ${modeLabel}. ${multiSelectHint}. ${moveHint}. Drag by touch or mouse to move or reorder.`); tile.innerHTML = `<span class="contact-bars">${contact.mode === "NC" ? "<i></i>" : edgeMode ? `<b class="edge-mark" title="${escapeAttr(contact.mode === "R_TRIG" ? edgeCopy.rise : edgeCopy.fall)}">${edgeMark}</b>` : ""}</span><span class="contact-label">${escapeHtml(contact.tag)}</span>`;
        tile.addEventListener("click", (event) => { if (suppressContactClick) { suppressContactClick = false; return; } selectedContacts = updateContactSelection(selectedContacts, location, event.shiftKey); selection = selectedContacts.has(contactSelectionKey(location)) ? location : selectedContacts.size ? { ...JSON.parse([...selectedContacts].at(-1)), kind:"contact" } : null; render(); });
        tile.addEventListener("contextmenu", (event) => { const key = contactSelectionKey(location); if (!selectedContacts.has(key)) selectedContacts = updateContactSelection(new Set(), location); selection = location; render(); const copy = contextCopy[language] || contextCopy.en; showContextMenu(event, [{ label:copy.editContact, act…45713 tokens truncated…String([60, 300, 1000].includes(Number(preferences.trendRetention)) ? Number(preferences.trendRetention) : 60);
  $("#localizationReport").onclick = showLocalizationReport;
  $("#settingsDone").onclick = () => { const cycleMs = Number($("#taskCycleMs").value); if (!Number.isInteger(cycleMs) || cycleMs < 1 || cycleMs > 60000) { toast(copy.invalidCycle); return; } project.task = { ...(project.task || {}), name:$("#taskName").value.trim() || "Main", mode:"cyclic", cycleMs }; preferences.autosave = $("#prefAutosave").checked; preferences.speed = $("#prefSpeed").value; preferences.theme = $("#prefTheme").value; preferences.trendRetention = Number($("#prefTrendRetention").value); trimTrendHistory(hmiHistory, preferences.trendRetention); preferences.contrast = $("#prefContrast").checked; preferences.dyslexia = $("#prefFont").checked; localStorage.setItem("adigun-preferences", JSON.stringify(preferences)); applyPreferences(); $("#modal").close(); updateStatus(); if (runTimer) { const delay = preferences.speed === "slow" ? 1000 : preferences.speed === "fast" ? 100 : 500; clearInterval(runTimer); runTimer = setInterval(() => doScan(), delay); } persist(); };
}
function showAdigunAI() {
  const c = adigunAiLabels(language);
  const transcript = () => adigunAiMessages.map((message) => `<article class="ai-message ${message.role}"><b>${message.role === "user" ? "You" : escapeHtml(c.name)}</b><p>${escapeHtml(message.text)}</p></article>`).join("");
  modal(c.title, `<div class="modal-body adigun-ai"><p class="safety-copy">${escapeHtml(c.privacy)}</p><div id="adigunAiTranscript" class="ai-messages" aria-live="polite">${transcript() || `<p class="safety-copy">${escapeHtml(c.source)}</p>`}</div><form id="adigunAiForm" class="ai-form"><label class="field" for="adigunAiQuestion">${escapeHtml(c.title)}<textarea id="adigunAiQuestion" rows="2" maxlength="1000" placeholder="${escapeAttr(c.placeholder)}" required></textarea></label><div class="modal-actions"><button class="secondary" type="button" data-ai-question="scan">${escapeHtml(c.explain)}</button><button class="secondary" type="button" data-ai-question="project">${escapeHtml(c.reviewAction)}</button><button class="secondary" type="button" data-ai-question="network">${escapeHtml(c.network)}</button><button class="primary" type="submit">${escapeHtml(c.ask)}</button><button class="secondary" type="button" id="adigunAiClear">${escapeHtml(c.clear)}</button></div></form><p class="safety-copy">${escapeHtml(c.source)}</p></div>`);
  const ask = (question) => {
    if (!question.trim()) return;
    const diagnostics = validateProject(project);
    adigunAiMessages.push({ role:"user", text:question.trim() }, { role:"assistant", text:answerAdigunQuestion({ question, project, selection, diagnostics, language, mode:project.editorType }) });
    if (adigunAiMessages.length > 40) adigunAiMessages.splice(0, adigunAiMessages.length - 40);
    showAdigunAI();
    $("#adigunAiQuestion").focus();
  };
  $("#adigunAiForm").onsubmit = (event) => { event.preventDefault(); ask($("#adigunAiQuestion").value); };
  document.querySelectorAll("[data-ai-question]").forEach((button) => button.onclick = () => ask(button.dataset.aiQuestion === "scan" ? c.scan : button.dataset.aiQuestion === "project" ? "Review project" : "Explain selected network"));
  $("#adigunAiClear").onclick = () => { adigunAiMessages = []; showAdigunAI(); };
}
const resourceUiCopy = {
  en:{title:"External resources",scope:"Local owner registry for this browser only. There are no accounts or organization-wide approvals. Only exact approved HTTPS URLs can open. Link checks may be blocked by the remote site; blocked checks are shown as unverified.",url:"HTTPS URL",en:"English description",de:"German description",yo:"Yoruba description",pcm:"Nigerian Pidgin description",add:"Add resource",invalid:"Enter a valid HTTPS URL and a short description in all four languages.",approve:"Approve URL",revoke:"Revoke approval",approveConfirm:"Approve this exact HTTPS URL for opening?",open:"Open",openConfirm:"Open this approved external resource in a new tab?",remove:"Remove",removeConfirm:"Remove this local resource?",check:"Check link",available:"Available",broken:"Broken link",unverified:"Unverified (network or CORS blocked)",unchecked:"Not checked",unapproved:"Not approved",audit:"Download access audit",empty:"No resources have been added.",saved:"Resource saved locally."},
  de:{title:"Externe Ressourcen",scope:"Lokale Ressourcenliste nur für diesen Browser. Es gibt keine Konten oder organisationsweiten Freigaben. Nur exakt freigegebene HTTPS-URLs lassen sich öffnen. Link-Prüfungen können blockiert sein und werden dann als ungeprüft angezeigt.",url:"HTTPS-URL",en:"Englische Beschreibung",de:"Deutsche Beschreibung",yo:"Yoruba-Beschreibung",pcm:"Nigerianische Pidgin-Beschreibung",add:"Ressource hinzufügen",invalid:"Gib eine gültige HTTPS-URL und kurze Beschreibungen in allen vier Sprachen ein.",approve:"URL freigeben",revoke:"Freigabe widerrufen",approveConfirm:"Diese genaue HTTPS-URL zum Öffnen freigeben?",open:"Öffnen",openConfirm:"Diese freigegebene externe Ressource in einem neuen Tab öffnen?",remove:"Entfernen",removeConfirm:"Diese lokale Ressource entfernen?",check:"Link prüfen",available:"Verfügbar",broken:"Link defekt",unverified:"Ungeprüft (Netzwerk oder CORS blockiert)",unchecked:"Nicht geprüft",unapproved:"Nicht freigegeben",audit:"Zugriffsprotokoll laden",empty:"Keine Ressourcen hinzugefügt.",saved:"Ressource lokal gespeichert."},
  yo:{title:"Àwọn orísun ìta",scope:"Àtòjọ orísun lórí browser yìí nìkan. Kò sí account tàbí ìfọwọ́sí àjọ. HTTPS URL tí a fọwọ́ sí gan-an nìkan ni a lè ṣí. Nẹ́tíwọ́ọ̀kì lè dí àyẹ̀wò link; a ó fi hàn pé a kò lè fìdí rẹ̀ múlẹ̀.",url:"HTTPS URL",en:"Àpèjúwe Gẹ̀ẹ́sì",de:"Àpèjúwe Jámánì",yo:"Àpèjúwe Yorùbá",pcm:"Àpèjúwe Pidgin Nàìjíríà",add:"Fi orísun kún un",invalid:"Tẹ HTTPS URL tó pé àti àpèjúwe kúkúrú ní gbogbo èdè mẹ́rin.",approve:"Fọwọ́ sí URL",revoke:"Yọ ìfọwọ́sí kúrò",approveConfirm:"Ṣé o fẹ́ fọwọ́ sí HTTPS URL yìí gan-an kí a lè ṣí i?",open:"Ṣí i",openConfirm:"Ṣí orísun ìta tí a fọwọ́ sí yìí nínú tab tuntun?",remove:"Yọ kúrò",removeConfirm:"Yọ orísun agbègbè yìí kúrò?",check:"Ṣàyẹ̀wò link",available:"Ó wà",broken:"Link kò ṣiṣẹ́",unverified:"A kò fìdí rẹ̀ múlẹ̀ (nẹ́tíwọ́ọ̀kì tàbí CORS dí i)",unchecked:"A kò tíì ṣàyẹ̀wò",unapproved:"A kò fọwọ́ sí i",audit:"Gbé àkọsílẹ̀ ìwọlé jáde",empty:"A kò tíì fi orísun kún un.",saved:"A fipamọ́ orísun sí ẹ̀rọ yìí."},
  pcm:{title:"External resources",scope:"This resource list dey only for this browser. No account or company-wide approval dey. Only the exact HTTPS URL wey get approval fit open. Remote site fit block link check; if so, we go show am as unverified.",url:"HTTPS URL",en:"English description",de:"German description",yo:"Yoruba description",pcm:"Nigerian Pidgin description",add:"Add resource",invalid:"Enter correct HTTPS URL and short description for all four languages.",approve:"Approve URL",revoke:"Cancel approval",approveConfirm:"Approve this exact HTTPS URL make e fit open?",open:"Open",openConfirm:"Open this approved outside resource for new tab?",remove:"Remove",removeConfirm:"Remove this local resource?",check:"Check link",available:"Available",broken:"Link no work",unverified:"Unverified (network or CORS block am)",unchecked:"Never check am",unapproved:"No approval",audit:"Download access log",empty:"No resource don add.",saved:"Resource don save for this device."}
};
const protocolUiCopy = {
  en:{ title:"Modbus TCP simulator", notice:"Educational protocol simulator only. It builds and parses Modbus TCP frames locally; no network socket, physical PLC, or remote device is contacted.", request:"Request frame (hex)", run:"Send to simulator", reset:"Reset memory", response:"Response frame (hex)", invalid:"Invalid frame", traffic:"Traffic monitor", empty:"No frames yet.", memory:"Initial simulated memory: coils 0–1 are ON/OFF; holding register 0 = 1234; input register 0 = 5678.", error:"Request rejected" },
  de:{ title:"Modbus-TCP-Simulator", notice:"Nur ein Lernsimulator. Er erstellt und verarbeitet Modbus-TCP-Frames lokal. Es wird keine Netzwerkverbindung, SPS oder externes Gerät kontaktiert.", request:"Anfrageframe (Hex)", run:"An Simulator senden", reset:"Speicher zurücksetzen", response:"Antwortframe (Hex)", invalid:"Ungültiger Frame", traffic:"Datenverkehr", empty:"Noch keine Frames.", memory:"Simulierter Anfangsspeicher: Spulen 0–1 EIN/AUS; Holding-Register 0 = 1234; Eingangsregister 0 = 5678.", error:"Anfrage abgelehnt" },
  yo:{ title:"Ìṣàfarawé Modbus TCP", notice:"Ìṣàfarawé ẹ̀kọ́ nìkan. Ó ń ṣe àti ka Modbus TCP frame lórí ẹ̀rọ yìí; kò sopọ̀ mọ́ nẹ́tíwọ́ọ̀kì, PLC gidi tàbí ẹ̀rọ òkèèrè.", request:"Frame ìbéèrè (hex)", run:"Fi ránṣẹ́ sí ìṣàfarawé", reset:"Tún memory bẹ̀rẹ̀", response:"Frame ìdáhùn (hex)", invalid:"Frame kò pé", traffic:"Àbójútó ìfiranṣẹ́", empty:"Kò sí frame síbẹ̀.", memory:"Memory ìṣàfarawé: coil 0–1 TAN/PÀ; holding register 0 = 1234; input register 0 = 5678.", error:"A kọ ìbéèrè yìí" },
  pcm:{ title:"Modbus TCP simulator", notice:"Na learning simulator only. E dey build and check Modbus TCP frames for this device; e no connect network, physical PLC, or outside device.", request:"Request frame (hex)", run:"Send am to simulator", reset:"Reset memory", response:"Response frame (hex)", invalid:"Frame no correct", traffic:"Traffic monitor", empty:"No frame yet.", memory:"Simulated memory start: coil 0–1 ON/OFF; holding register 0 = 1234; input register 0 = 5678.", error:"Request no pass" }
};
function showProtocolSimulator() {
  const c = protocolUiCopy[language] || protocolUiCopy.en, rows = protocolTraffic.map((item) => `<tr><td>${escapeHtml(item.request)}</td><td>${escapeHtml(item.response)}</td></tr>`).join("");
  modal(c.title, `<div class="modal-body"><p class="safety-copy">${escapeHtml(c.notice)}</p><p class="safety-copy">${escapeHtml(c.memory)}</p><label class="field" for="protocolRequest">${escapeHtml(c.request)}<textarea id="protocolRequest" rows="2" maxlength="780" spellcheck="false">12 34 00 00 00 06 01 03 00 00 00 02</textarea></label><div class="modal-actions"><button class="primary" id="runProtocolRequest">${escapeHtml(c.run)}</button><button class="secondary" id="resetProtocolMemory">${escapeHtml(c.reset)}</button></div><label class="field">${escapeHtml(c.response)}<textarea id="protocolResponse" rows="2" readonly></textarea></label><div id="protocolError" class="safety-copy" aria-live="polite"></div><h3>${escapeHtml(c.traffic)}</h3><div class="table-wrap protocol-traffic"><table><thead><tr><th>${escapeHtml(c.request)}</th><th>${escapeHtml(c.response)}</th></tr></thead><tbody id="protocolTrafficRows">${rows || `<tr><td colspan="2">${escapeHtml(c.empty)}</td></tr>`}</tbody></table></div></div>`);
  $("#runProtocolRequest").onclick = () => {
    const result = simulateModbusTcp($("#protocolRequest").value, protocolMemory);
    if (result.ok) protocolMemory = result.memory;
    const response = result.response || `${c.error}: ${result.error || c.invalid}`;
    $("#protocolResponse").value = response;
    $("#protocolError").textContent = result.exception ? `${c.error} · exception ${result.exception}` : result.error ? `${c.error}: ${result.error}` : "";
    protocolTraffic.unshift({ request:result.request || $("#protocolRequest").value, response });
    protocolTraffic = protocolTraffic.slice(0, 50);
    $("#protocolTrafficRows").innerHTML = protocolTraffic.map((item) => `<tr><td>${escapeHtml(item.request)}</td><td>${escapeHtml(item.response)}</td></tr>`).join("");
  };
  $("#resetProtocolMemory").onclick = () => { protocolMemory = createProtocolMemory(); protocolTraffic = []; $("#protocolResponse").value = ""; $("#protocolError").textContent = ""; $("#protocolTrafficRows").innerHTML = `<tr><td colspan="2">${escapeHtml(c.empty)}</td></tr>`; };
}
function showResources() {
  const c = resourceUiCopy[language] || resourceUiCopy.en, statusText = (status) => ({ available:c.available, broken:c.broken, unverified:c.unverified, unapproved:c.unapproved })[status] || c.unchecked;
  const rows = readResourceRegistry().map((resource) => `<article class="resource-card"><strong>${escapeHtml(resource.description?.[language] || resource.description?.en || resource.host)}</strong><code>${escapeHtml(resource.host)}</code><div class="resource-url">${escapeHtml(resource.url)}</div><p class="safety-copy">${statusText(resource.check?.status)}</p><div class="modal-actions"><button class="secondary" data-resource-check="${escapeAttr(resource.id)}">${c.check}</button><button class="secondary" data-resource-approval="${escapeAttr(resource.id)}">${resource.approved ? c.revoke : c.approve}</button><button class="primary" data-resource-open="${escapeAttr(resource.id)}" ${resource.approved ? "" : "disabled"}>${c.open}</button>${resource.builtIn ? "" : `<button class="danger-button" data-resource-remove="${escapeAttr(resource.id)}">${c.remove}</button>`}</div></article>`).join("");
  const audit = readResourceAudit();
  modal(c.title, `<div class="modal-body"><p class="safety-copy">${c.scope}</p><div class="resource-list">${rows || `<p>${c.empty}</p>`}</div><h3>${c.add}</h3><form id="resourceForm"><label class="field">${c.url}<input id="resourceUrl" type="url" placeholder="https://example.org/guide" required maxlength="500"></label><div class="input-row">${[["en",c.en],["de",c.de],["yo",c.yo],["pcm",c.pcm]].map(([key,label]) => `<label class="field">${label}<input id="resourceDescription-${key}" maxlength="240" required></label>`).join("")}</div><div class="modal-actions"><button class="primary" type="submit">${c.add}</button><button class="secondary" type="button" id="resourceAudit" ${audit.length ? "" : "disabled"}>${c.audit}</button></div></form></div>`);
  $("#resourceForm").onsubmit = (event) => { event.preventDefault(); try { saveResource({ url:$("#resourceUrl").value, description:Object.fromEntries(["en", "de", "yo", "pcm"].map((key) => [key, $(`#resourceDescription-${key}`).value])) }); showResources(); toast(c.saved); } catch { toast(c.invalid); } };
  $("#resourceAudit").onclick = () => { const data = new Blob([JSON.stringify({ schema:"adigunsps-resource-access-v1", events:readResourceAudit() }, null, 2)], { type:"application/json" }), link = document.createElement("a"); link.href = URL.createObjectURL(data); link.download = "adigunsps-resource-access.json"; link.click(); URL.revokeObjectURL(link.href); };
  document.querySelectorAll("[data-resource-approval]").forEach((button) => button.onclick = () => { const resource = readResourceRegistry().find((item) => item.id === button.dataset.resourceApproval); if (!resource) return; const approved = !resource.approved; if (approved && !confirm(c.approveConfirm)) return; saveResource({ ...resource, approved }); showResources(); });
  document.querySelectorAll("[data-resource-remove]").forEach((button) => button.onclick = () => { if (!confirm(c.removeConfirm)) return; removeResource(button.dataset.resourceRemove); showResources(); });
  document.querySelectorAll("[data-resource-open]").forEach((button) => button.onclick = () => { const resource = readResourceRegistry().find((item) => item.id === button.dataset.resourceOpen); if (!resource || !isApprovedExternalUrl(resource.url)) return; if (!confirm(c.openConfirm)) return; appendResourceAudit({ resourceId:resource.id, host:resource.host, action:"open" }); window.open(resource.url, "_blank", "noopener,noreferrer"); });
  document.querySelectorAll("[data-resource-check]").forEach((button) => button.onclick = async () => { const resource = readResourceRegistry().find((item) => item.id === button.dataset.resourceCheck); if (!resource) return; const check = await checkResourceLink(resource); saveResource({ ...resource, check }); showResources(); });
}
function showHelp() { const repo = resources.find((resource) => resource.id === "source-repository"), presentation = brandPresentation(language, currentBrandTheme()); modal(t("titleHelp"), `<div class="modal-body"><section class="about-brand"><div class="about-brand-logos"><img src="${presentation.companyLogo}" alt="${presentation.companyName} official corporate logo"><div class="about-product-wordmark">${presentation.productName}<small>${presentation.divisionLabel}</small></div></div><p class="brand-attribution">${presentation.attribution}</p></section><p class="safety-copy"><strong>${t("safety")}</strong></p><p class="safety-copy">Use the input switches to test the ladder. Run scans continuously, Step for one scan, and Reset to clear timers and outputs. Projects and recovery snapshots stay in this browser. Export a JSON file for a portable copy.</p><p class="safety-copy">Keyboard: Ctrl/⌘+K command search · Ctrl/⌘+F find · Ctrl/⌘+C/X/V copy/cut/paste rung · Ctrl/⌘+Z/Y undo/redo · Delete removes the selected contact.</p><p><button class="secondary" id="sourceRepository">${escapeHtml(repo.description[language])} ↗</button></p><div class="modal-actions"><button class="primary" id="helpTour">${tour[language].start}</button></div></div>`); $("#helpTour").onclick = () => showTutorial(0); $("#sourceRepository").onclick = () => { if (isApprovedExternalUrl(repo.url) && confirm(`Open ${repo.host} in a new tab?`)) appendResourceAudit({ resourceId:repo.id, host:repo.host, action:"open" }); window.open(repo.url, "_blank", "noopener,noreferrer"); }; }
function showApplicationMenu(event) {
  const entries = createApplicationMenuEntries(language)[event.currentTarget.dataset.appMenu].map((entry) => ({ label:entry.label, action:() => action(entry.action) }));
  showContextMenu(event, entries);
}
function action(name) {
  if (name === "adigun-ai") { showAdigunAI(); return; }
  if (name === "resources") { showResources(); return; }
  if (name === "protocol-simulator") { showProtocolSimulator(); return; }
  if (name === "export-plcopen") { exportPlcopenProject(); return; }
  if (name === "io") { showIo(); return; }
  if (name === "faults") { showFaults(); return; }
  if (name === "operations") { showOperations(); return; }
  if (name === "standards") { showStandardsChecker(); return; }
  if (name === "scenario") { showScenarioRunner(); return; }
  if (name === "watch") { showWatch(); return; }
  if (name === "print") { window.print(); return; }
  if (name === "panel-layout") { showPanelLayout(); return; }
  if (name === "fullscreen") { document.fullscreenElement ? document.exitFullscreen() : $(".editor-area").requestFullscreen?.(); return; }
  if (name === "hardware-inventory") { showHardwareInventory(); return; }
  if (name === "device-configuration") { showDeviceConfiguration(); return; }
  if (name === "language") { $("#languageButton").click(); return; }
  if (name.startsWith("mode-")) { const mode = name.slice(5); $("#editorMode").value = mode; setEditorMode(mode); return; }
  if (name === "settings") { showSettings(); return; }
  if (name === "record") { toggleTraceRecording(); return; }
  if (name === "replay") { replayTrace(); return; }
  if (name === "trace") { showTrace(); return; }
  if (name === "events") { showEvents(); return; }
  if (name === "copy") { copyRung(); return; }
  if (name === "cut") { copyRung(true); return; }
  if (name === "paste") { pasteRung(); return; }
  if (name === "find" || name === "replace") { showFindReplace(); return; }
  if (name === "add-fbd-block") { addFbdBlock(); return; }
  if (name === "add-sfc-step") { addSfcStep(); return; }
  if (name === "add-sfc-transition") { addSfcTransition(); return; }
  if (name === "compile-st") { compileST(true); return; }
  if (name === "save") { persist(true, true); return; }
  if (name === "save-as") { const copyName = prompt(t("saveAs"), `${project.name} copy`); if (copyName?.trim()) { project = { ...structuredClone(project), id: crypto.randomUUID(), name: copyName.trim(), lastOpenedAt:Date.now() }; persist(true, true); render(); } return; }
  if (name === "new") { project = defaultProject(); project.lastOpenedAt = Date.now(); stopSimulation(); persist(); render(); } else if (name === "examples") showExamples(); else if (name === "import") importProject(); else if (name === "export") exportProject(); else if (name === "add-rung") addRung(); else if (name === "add-contact") { if (selection?.rung != null) rungAction("add", selection.rung); else addRung(); } else if (name === "undo") undo(); else if (name === "redo") redo(); else if (name === "run") runSimulation(); else if (name === "pause") { if (runTimer) { clearInterval(runTimer); runTimer = null; logEvent("pause", "Simulation paused"); window.adigunPaused = true; updateStatus(); } } else if (name === "step") { if (runTimer) return; doScan(); } else if (name === "stop") { stopSimulation(); toast(t("resetDone")); } else if (name === "zoom-in") setZoom(zoom + 10); else if (name === "zoom-out") setZoom(zoom - 10); else if (name === "grid") { grid = !grid; $("#canvasWrap").classList.toggle("no-grid", !grid); $("#gridToggle").classList.toggle("active", grid); } else if (name === "projects") showProjects(); else if (name === "tags") showTags(); else if (name === "help") showHelp();
}
function applyLocale() {
  for (const button of document.querySelectorAll("[data-app-menu]")) button.textContent = applicationMenuLabels[language]?.[button.dataset.appMenu] || applicationMenuLabels.en[button.dataset.appMenu];
  const panelTitle = ({ en:"Panel layout", de:"Panelanordnung", yo:"Ìṣètò pánẹ́lì", pcm:"Panel layout" })[language]; $("#panelLayoutButton").title = panelTitle; $("#panelLayoutButton").setAttribute("aria-label", panelTitle);
  $("#operationsButton").textContent = operationsCopy[language].button; $("#operationsButton").title = operationsCopy[language].title;
  const electricalTabLabel = ({en:"Components",de:"Komponenten",yo:"Àwọn component",pcm:"Components"})[language]; $("#electricalTabLabel").textContent = electricalTabLabel; $("#electricalTab").setAttribute("aria-label",electricalTabLabel);
  const chrome = {
    en: { project:"PROJECT", inputs:"SIMULATED INPUTS", outputs:"OUTPUTS", properties:"PROPERTIES", watch:"WATCH", status:"Project saved on this device", offline:"Offline ready", program:"Program Main [LD]", tags:"Tags & I/O", library:"Example library", education:"Educational simulation only", hardware:"No hardware connected", routine:"Main routine", snap:"Snap", minimap:"Minimap", commands:"commands", scanTime:"Scan time", cycle:"Cycle", new:t("new"), examples:t("examples"), save:t("save"), saveAs:t("saveAs"), import:t("import"), export:t("export"), run:t("run"), pause:t("pause"), step:t("step"), stop:t("reset"), contact:t("addContact"), rung:t("addRung") },
    de: { project:"PROJEKT", inputs:"SIMULIERTE EINGÄNGE", outputs:"AUSGÄNGE", properties:"EIGENSCHAFTEN", watch:"BEOBACHTEN", status:"Projekt auf diesem Gerät gespeichert", offline:"Offline bereit", program:"Programm Main [LD]", tags:"Tags & E/A", library:"Beispiele", education:"Nur Lernsimulation", hardware:"Keine Hardware verbunden", routine:"Hauptroutine", snap:"Rasterfang", minimap:"Übersicht", commands:"Befehle", scanTime:"Zykluszeit", cycle:"Zyklus", new:t("new"), examples:t("examples"), save:t("save"), saveAs:t("saveAs"), import:t("import"), export:t("export"), run:t("run"), pause:t("pause"), step:t("step"), stop:t("reset"), contact:t("addContact"), rung:t("addRung") },
    yo: { project:"IṢẸ́", inputs:"ÀWỌN ÌWỌLÉ ÌṢÀFARAWÉ", outputs:"ÀWỌN ÌJÁDE", properties:"ÀWỌN ÀBÙDÁ", watch:"ṢÀKÍYÈSÍ", status:"A fipamọ́ iṣẹ́ sí ẹ̀rọ yìí", offline:"Ṣetan láìsí ayélujára", program:"Ètò Main [LD]", tags:"Tags àti I/O", library:"Àwọn àpẹẹrẹ", education:"Fún ẹ̀kọ́ nìkan", hardware:"Kò sí ẹ̀rọ PLC tó sopọ̀", routine:"Ètò pàtàkì", snap:"Mú mọ́ grid", minimap:"Àwòrán kékeré", commands:"àṣẹ", scanTime:"Àkókò scan", cycle:"Yípo", new:t("new"), examples:t("examples"), save:t("save"), saveAs:t("saveAs"), import:t("import"), export:t("export"), run:t("run"), pause:t("pause"), step:t("step"), stop:t("reset"), contact:t("addContact"), rung:t("addRung") },
    pcm: { project:"PROJECT", inputs:"INPUT WEY SIMULATION DEY CONTROL", outputs:"OUTPUTS", properties:"PROPERTIES", watch:"WATCH", status:"Project don save for this device", offline:"Ready without internet", program:"Program Main [LD]", tags:"Tags and I/O", library:"Example library", education:"Na learning simulation only", hardware:"No hardware connect", routine:"Main program", snap:"Snap", minimap:"Minimap", commands:"commands", scanTime:"Scan time", cycle:"Cycle", new:t("new"), examples:t("examples"), save:t("save"), saveAs:t("saveAs"), import:t("import"), export:t("export"), run:t("run"), pause:t("pause"), step:t("step"), stop:t("reset"), contact:t("addContact"), rung:t("addRung") },
  }[language];
  document.documentElement.lang = { en:"en", de:"de", yo:"yo", pcm:"pcm" }[language];
  $("#projectHeading").textContent = chrome.project; $("#inputsHeading").textContent = chrome.inputs; $("#outputsHeading").textContent = chrome.outputs; $("#propertiesTab").textContent = chrome.properties; $("#watchTab").textContent = chrome.watch;
  $("#programTreeLabel").textContent = chrome.program; $("#programTabLabel").textContent = chrome.program.replace(" [LD]", ""); $("#tagsTreeLabel").textContent = chrome.tags; $("#exampleTreeLabel").textContent = chrome.library; $("#educationLabel").textContent = chrome.education; $("#noHardwareLabel").textContent = chrome.hardware; $("#programCrumb").textContent = t("program"); $("#subbarTitle").textContent = chrome.routine; $("#ladderBadge").textContent = language === "de" ? "KOP" : "LADDER"; $("#snapLabelText").textContent = chrome.snap; $("#snapToggle").checked = preferences.snap; $("#minimapButton").textContent = chrome.minimap; $("#commandHint").textContent = chrome.commands; $("#offlineLabel").textContent = chrome.offline; $("#scanTimeLabel").textContent = chrome.scanTime; $("#cycleLabel").textContent = chrome.cycle; $("#savedOnDeviceLabel").textContent = chrome.status;
  for (const [actionName, label] of Object.entries({ new:chrome.new, examples:chrome.examples, save:chrome.save, "save-as":chrome.saveAs, import:chrome.import, export:chrome.export, run:chrome.run, pause:chrome.pause, step:chrome.step, stop:chrome.stop, "add-contact":chrome.contact, "add-rung":chrome.rung })) { const span = document.querySelector(`[data-action="${actionName}"] span`); if (span) span.textContent = label; }
  $("#scenarioButton").textContent = ({ en:"▹ Scenario", de:"▹ Szenario", yo:"▹ Ìtẹ̀lé", pcm:"▹ Scenario" })[language];
  $("#exportTrendHistoryButton").textContent = ({ en:"Export trend CSV", de:"Trend-CSV exportieren", yo:"Gba trend CSV jáde", pcm:"Export trend CSV" })[language];
  $("#saveState").textContent = t("saved"); $("#languageStatus").textContent = t("lang"); applyBrand();
}
function currentBrandTheme() { return resolveTheme(preferences.theme, window.matchMedia?.("(prefers-color-scheme: light)").matches || false); }
function renderCorporateFooter() {
  const nav = $("#corporateFooterLinks");
  if (nav) {
    nav.replaceChildren();
    nav.setAttribute("aria-label", t("footerLinks"));
    for (const item of brand.company.links) {
      const link = document.createElement("a");
      link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.dataset.brandLink = item.key; link.textContent = t(item.labelKey);
      link.setAttribute("aria-label", t(item.labelKey));
      nav.append(link);
    }
  }
  const help = $("#footerHelpLink"); if (help) help.textContent = t("footerHelp");
  const year = $("#footerYear"); if (year) year.textContent = `© ${new Date().getFullYear()} ${brand.company.name}`;
}
function applyBrand() { renderCorporateFooter(); const theme = currentBrandTheme(), presentation = brandPresentation(language, theme); document.body.dataset.theme = theme; document.documentElement.style.colorScheme = theme; document.querySelector('meta[name="theme-color"]').content = theme === "light" ? brand.colors.ivory : brand.colors.navy; document.querySelector('meta[name="description"]').content = presentation.description; $("#appManifest").href = presentation.manifest; document.documentElement.style.setProperty("--green", theme === "light" ? "#0B7483" : brand.colors.elektroniker); document.documentElement.style.setProperty("--green2", theme === "light" ? "#DFF6F9" : "#103640"); document.documentElement.style.setProperty("--bg", theme === "light" ? brand.colors.ivory : brand.colors.navy); document.documentElement.style.setProperty("--amber", brand.colors.gold); document.documentElement.style.setProperty("--blue", brand.colors.royalBlue); document.title = `${presentation.productName} — ${presentation.divisionName} — ${presentation.companyName}`; $("#versionProductName").textContent = presentation.productName; $("#headerProductName").textContent = presentation.productName; $("#headerDivisionLabel").textContent = presentation.divisionLabel; $("#footerBrandAttribution").textContent = presentation.attribution; $("#printProductName").textContent = presentation.productName; $("#printDivisionLabel").textContent = presentation.divisionLabel; $("#printBrandAttributionText").textContent = presentation.attribution; for (const id of ["headerCorporateLogo", "footerCorporateLogo", "printCorporateLogo"]) { const image = $("#"+id); if (image) { image.src = presentation.companyLogo; image.alt = `${presentation.companyName} official corporate logo`; } } }
window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", applyBrand);
let fbdWireStart = null;
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && cancelFbdKeyboardWire()) event.preventDefault(); });
const fbdSelection = new Set();
let fbdDrag = null, fbdSuppressClick = false;
const fbdCanvas = $("#fbdBlocks");
fbdCanvas.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest("[data-fbd-drag-handle]"); if (!handle || event.button !== 0) return;
  event.preventDefault(); const id = handle.dataset.fbdDragHandle;
  if (event.shiftKey) { if (fbdSelection.has(id)) fbdSelection.delete(id); else fbdSelection.add(id); }
  else if (!fbdSelection.has(id)) { fbdSelection.clear(); fbdSelection.add(id); }
  fbdCanvas.querySelectorAll("[data-fbd-drag-handle]").forEach((item) => { item.setAttribute("aria-pressed", String(fbdSelection.has(item.dataset.fbdDragHandle))); item.closest(".fbd-block").classList.toggle("selected", fbdSelection.has(item.dataset.fbdDragHandle)); });
  if (!fbdSelection.has(id)) { fbdSuppressClick = true; setTimeout(() => { fbdSuppressClick = false; }, 0); return; }
  const blocks = project.fbdBlocks || [], origins = Object.fromEntries(blocks.map((block,index) => [block.id, fbdBlockPosition(block,index)]));
  fbdDrag = { pointerId:event.pointerId, id, startX:event.clientX, startY:event.clientY, moved:false, ids:[...fbdSelection], origins };
});
document.addEventListener("pointermove", (event) => {
  if (!fbdDrag || event.pointerId !== fbdDrag.pointerId) return;
  const dx = event.clientX - fbdDrag.startX, dy = event.clientY - fbdDrag.startY;
  if (!fbdDrag.moved && Math.hypot(dx,dy) < 3) return;
  if (!fbdDrag.moved) pushHistory(); fbdDrag.moved = true; fbdSuppressClick = true;
  project.fbdBlocks = moveFbdBlocks(project.fbdBlocks || [], fbdDrag.ids, fbdDrag.origins, dx / (zoom / 100), dy / (zoom / 100), preferences.snap);
  for (const [index, block] of project.fbdBlocks.entries()) { const node = fbdCanvas.querySelector(`[data-fbd-node="${index}"]`), position = fbdBlockPosition(block,index); if (node) { node.style.left = `${position.x}px`; node.style.top = `${position.y}px`; } }
  fbdCanvas.style.height = `${Math.max(180, ...project.fbdBlocks.map((block,index) => fbdBlockPosition(block,index).y + 230))}px`;
  drawFbdConnections(fbdCanvas, project.fbdBlocks);
});
document.addEventListener("pointerup", (event) => {
  if (!fbdDrag || event.pointerId !== fbdDrag.pointerId) return;
  if (fbdDrag.moved) persist(); fbdSuppressClick = true; setTimeout(() => { fbdSuppressClick = false; }, 0); fbdDrag = null;
});
fbdCanvas.addEventListener("pointerdown", (event) => { const port = event.target.closest("[data-fbd-output-handle]"); if (!port || event.button !== 0) return; event.preventDefault(); fbdWireStart = { index:Number(port.dataset.fbdOutputHandle) }; fbdCanvas.classList.add("wiring"); });
document.addEventListener("pointermove", (event) => { if (!fbdWireStart) return; const svg = fbdCanvas.querySelector(".fbd-wires"), source = fbdCanvas.querySelector(`[data-fbd-output-handle="${fbdWireStart.index}"]`); if (!svg || !source) return; const box = fbdCanvas.getBoundingClientRect(), from = source.getBoundingClientRect(), x1 = from.left - box.left + from.width / 2, y1 = from.top - box.top + from.height / 2, x2 = event.clientX - box.left, y2 = event.clientY - box.top, bend = Math.max(24, Math.abs(x2 - x1) / 2); svg.querySelector(".fbd-wire-preview")?.remove(); svg.insertAdjacentHTML("beforeend", `<path class="fbd-wire-preview" d="M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}"/>`); });
document.addEventListener("pointerup", (event) => { if (!fbdWireStart) return; const start = fbdWireStart; fbdWireStart = null; fbdCanvas.classList.remove("wiring"); const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-fbd-input-handle]"); fbdCanvas.querySelector(".fbd-wire-preview")?.remove(); if (!target) return; const targetIndex = Number(target.dataset.fbdInputHandle), inputIndex = Number(target.dataset.fbdInputIndex), result = connectFbdPorts(project.fbdBlocks || [], start.index, targetIndex, inputIndex); if (!result.ok) { const copy = fbdAccessibilityCopy[language] || fbdAccessibilityCopy.en; announceFbdWire(result.code === "cycle" ? copy.cycleError : copy.typeError); return; } pushHistory(); project.fbdBlocks = result.blocks; render(); persist(); });
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => action(button.dataset.action)));
$("#editorMode").addEventListener("change", (event) => setEditorMode(event.target.value));
$("#snapToggle").addEventListener("change", () => { preferences.snap = $("#snapToggle").checked; if (preferences.snap) { pushHistory(); for (const widget of project.hmi?.widgets || []) { widget.offsetX = 0; widget.offsetY = 0; } } localStorage.setItem("adigun-preferences", JSON.stringify(preferences)); renderHmi(); persist(); });
let stEditRecorded = false, stSaveTimer, stCompileTimer;
$("#stSource").addEventListener("focus", () => { if (!stEditRecorded) { pushHistory(); stEditRecorded = true; } });
$("#stSource").addEventListener("input", () => { project.stSource = $("#stSource").value; compiledST = null; compiledSTSignature = ""; $("#compileState").textContent = "Compiling…"; clearTimeout(stSaveTimer); clearTimeout(stCompileTimer); stSaveTimer = setTimeout(() => persist(), 350); stCompileTimer = setTimeout(() => compileST(false), 350); });
$("#stSource").addEventListener("blur", () => { stEditRecorded = false; });
$("#projectMenu").addEventListener("click", () => showProjects()); $("#paletteButton").addEventListener("click", showPalette); $("#helpButton").addEventListener("click", showHelp); $("#footerHelpLink").addEventListener("click", showHelp); $("#zoomFit").addEventListener("click", fitZoom); $("#minimapButton").addEventListener("click", () => $("#minimap").classList.toggle("hidden")); $("#fullscreenButton").addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : $(".editor-area").requestFullscreen?.()); $("#languageButton").addEventListener("click", () => { const order = ["en", "de", "yo", "pcm"]; language = order[(order.indexOf(language) + 1) % order.length]; localStorage.setItem("adigun-language", language); $("#languageButton").textContent = language.toUpperCase(); applyLocale(); toast(t("languageChanged")); render(); });
document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase(), modifier = event.ctrlKey || event.metaKey, active = document.activeElement;
  if (event.key === "Escape" && $("#modal").open) { $("#modal").close(); return; }
  if (event.key === "Escape" && !$("#contextMenu").hidden) { hideContextMenu(); return; }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) || active.isContentEditable) return;
  if (modifier && key === "k") { event.preventDefault(); showPalette(); }
  else if (modifier && key === "f") { event.preventDefault(); showFindReplace(); }
  else if (modifier && key === "c") { event.preventDefault(); if (project.editorType === "FBD") copyFbdSelection(); else copyRung(); }
  else if (modifier && key === "x") { event.preventDefault(); if (project.editorType === "FBD") copyFbdSelection(true); else copyRung(true); }
  else if (modifier && key === "v") { event.preventDefault(); if (project.editorType === "FBD") pasteFbdSelection(); else pasteRung(); }
  else if (modifier && key === "z") { event.preventDefault(); undo(); }
  else if (modifier && key === "y") { event.preventDefault(); redo(); }
  else if (key === "delete" && project.editorType === "FBD" && fbdSelection.size) { event.preventDefault(); deleteFbdSelection(); }
  else if (key === "delete" && selection?.kind === "contact") { event.preventDefault(); if (selectedContacts.size > 1) deleteSelectedContacts(); else $("#removeContact")?.click(); }
});
document.addEventListener("pointerdown", (event) => { const menu = $("#contextMenu"); if (!menu.hidden && !menu.contains(event.target)) hideContextMenu(); });
async function init() { try { const projects = await store.all(); project = sortProjectsByRecent(projects)[0] || defaultProject(); project.lastOpenedAt = Date.now(); if (!projects.length) await store.save(project); else await store.touch(project); } catch { project = defaultProject(); project.lastOpenedAt = Date.now(); } language = localStorage.getItem("adigun-language") || "en"; $("#languageButton").textContent = language.toUpperCase(); applyLocale(); sim.values = { ...(project.initialState || {}) }; render(); if (!localStorage.getItem("adigun-safety-seen")) showWelcome(); }
applyPreferences(); $("#settingsButton").addEventListener("click", showSettings); document.querySelectorAll("[data-app-menu]").forEach((button) => button.addEventListener("click", showApplicationMenu)); $("#logicTab").addEventListener("click", () => { workspaceView = "logic"; localStorage.setItem("adigun-workspace-view", workspaceView); render(); }); $("#electricalTab").addEventListener("click", () => { workspaceView = "electrical"; localStorage.setItem("adigun-workspace-view", workspaceView); render(); }); $("#hmiTab").addEventListener("click", () => { workspaceView = "hmi"; localStorage.setItem("adigun-workspace-view", workspaceView); render(); }); $("#processesButton").addEventListener("click", showProcessManager); $("#addAlarmButton").addEventListener("click", showAlarmSetup); $("#manageAlarmsButton").addEventListener("click", showAlarmManager); $("#recipesButton").addEventListener("click", showRecipes); $("#alarmHistoryButton").addEventListener("click", showAlarmHistory); $("#exportTrendHistoryButton").addEventListener("click", exportTrendHistory);
$("#adigunAiButton").addEventListener("click", showAdigunAI);
applyPanelLayout(); $("#panelLayoutButton").addEventListener("click", showPanelLayout);
init();
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("./service-worker.js").catch(() => {});

