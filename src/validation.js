import { compileStructuredText } from "./structured-text.js";
import { validateCyclicTasks } from "./cyclic-tasks.js";
import { validateFbdBlocks } from "./fbd-validation.js";
import { validateElectricalDiagram } from "./electrical.js";

const taskProgramCache = new WeakMap();
const mixedValidationCache = new WeakMap();

export function validateMixedProgramUnits(project) {
  if (!project.programUnits?.length) return [];
  const signature = JSON.stringify([project.programUnits, project.tags, project.io]);
  const cached = mixedValidationCache.get(project);
  if (cached?.signature === signature) return cached.issues;
  const issues = [];
  const names = new Set([...(project.tags || []).map(tag => tag.name), ...(project.io?.inputs || []), ...(project.io?.outputs || [])]);
  for (const unit of project.programUnits) {
    const report = message => issues.push({level:"error", code:"program-unit", message:unit.name + " | " + message});
    if (unit.language === "ST") {
      for (const error of compileStructuredText(unit.source,[...names]).errors) report(error);
    } else if (unit.language === "LD" || unit.language === "FBD") {
      const body = {tags:project.tags, io:project.io, rungs:unit.rungs, fbdBlocks:unit.blocks};
      for (const issue of validateProject(body)) if (issue.level === "error") report(issue.message);
    } else if (unit.language === "SFC") {
      const steps = unit.chart?.steps || [];
      const ids = new Set(steps.map(step => step.id));
      if (!steps.length || ids.size !== steps.length) report("Chart requires uniquely identified steps.");
      for (const step of steps) for (const output of step.actions || []) {
        if (!unit.outputs.includes(output)) report("Step action requires a declared unit output: " + output);
      }
      for (const transition of unit.chart?.transitions || []) {
        if (!ids.has(transition.from) || !ids.has(transition.to)) report("Transition references a missing step.");
        if (!names.has(transition.condition)) report("Transition references an undeclared tag: " + transition.condition);
      }
    }
  }
  mixedValidationCache.set(project,{signature,issues});
  return issues;
}


export function validateProject(project) {
  const issues = [...validateMixedProgramUnits(project)];
  if (project.tasks !== undefined) {
    const source = typeof project.stSource === "string" ? project.stSource : "";
    let cached = taskProgramCache.get(project);
    if (!cached || cached.source !== source) { cached = {source,names:compileStructuredText(source).programs.map(program=>program.name)}; taskProgramCache.set(project,cached); }
    for (const message of validateCyclicTasks(project.tasks,project.programUnits?.map(unit=>unit.name) ?? cached.names)) issues.push({level:"error",code:"task-config",message});
  }
  const tags = new Map(), foldedTagNames = new Set();
  for (const tag of project.tags || []) {
    if (!tag.name?.trim()) issues.push({ level: "error", code: "tag-name", message: "Every tag needs a name." });
    else if (foldedTagNames.has(tag.name.toLowerCase())) issues.push({ level: "error", code: "tag-duplicate", message: `Tag ${tag.name} is defined more than once (ignoring case).` });
    else { tags.set(tag.name, tag); foldedTagNames.add(tag.name.toLowerCase()); }
  }
  const addresses = new Map();
  for (const tag of project.tags || []) {
    if (!tag.address) continue;
    if (addresses.has(tag.address)) issues.push({ level: "warning", code: "address-duplicate", message: `Address ${tag.address} is shared by ${addresses.get(tag.address)} and ${tag.name}.` });
    else addresses.set(tag.address, tag.name);
  }
  for (const [index, rung] of (project.rungs || []).entries()) {
    if (!rung.coil?.trim()) issues.push({ level: "error", code: "coil-missing", message: `Rung ${index + 1} has no output coil.` });
    if (rung.coilMode && !["normal", "set", "reset"].includes(rung.coilMode)) issues.push({ level:"error", code:"coil-mode", message:`Rung ${index + 1} has an unsupported coil mode.` });
    else if (tags.has(rung.coil) && tags.get(rung.coil).type !== "BOOL") issues.push({ level: "error", code: "coil-type", message: `Output coil ${rung.coil} must use BOOL; it is ${tags.get(rung.coil).type}.` });
    if (!(rung.branches?.length ? rung.branches : [rung.contacts || []]).flat().length) issues.push({ level: "warning", code: "logic-empty", message: `Rung ${index + 1} has no contacts and will always energize its coil.` });
    for (const contact of (rung.branches?.length ? rung.branches : [rung.contacts || []]).flat()) {
      const tag = tags.get(contact.tag);
      if (!contact.tag) issues.push({ level: "error", code: "contact-tag", message: `Rung ${index + 1} has a contact without a tag.` });
      else if (!tag) issues.push({ level: "warning", code: "tag-undefined", message: `Contact ${contact.tag} is not declared in the tag table.` });
      else if (tag.type !== "BOOL") issues.push({ level: "error", code: "contact-type", message: `Contact ${contact.tag} must use BOOL; it is ${tag.type}.` });
      else if (tag?.role === "output") issues.push({ level: "warning", code: "output-contact", message: `Output ${contact.tag} is used as a contact.` });
      if (!["NO", "NC", "R_TRIG", "F_TRIG"].includes(contact.mode)) issues.push({ level: "error", code: "contact-mode", message: `Contact ${contact.tag} has an unknown contact mode.` });
    }
    if (rung.timer && rung.timer.type && !["TON", "TOF", "TP", "RTO"].includes(rung.timer.type)) issues.push({ level:"error", code:"timer-type", message:`Timer ${rung.timer.tag} has an unsupported type ${rung.timer.type}.` });
    if (rung.timer && (!Number.isFinite(Number(rung.timer.preset)) || Number(rung.timer.preset) <= 0)) issues.push({ level: "error", code: "timer-preset", message: `Timer ${rung.timer.tag} needs a preset greater than zero.` });
    if (rung.timer?.type === "RTO" && rung.timer.resetTag && tags.get(rung.timer.resetTag)?.type !== "BOOL") issues.push({ level:"error", code:"timer-reset-tag", message:`RTO reset tag ${rung.timer.resetTag} must be a declared BOOL tag.` });
    if (rung.counter && rung.counter.type && !["CTU", "CTD"].includes(rung.counter.type)) issues.push({level:"error",code:"counter-type",message:`Counter ${rung.counter.tag} has an unsupported type ${rung.counter.type}.`});
    if (rung.counter && (!Number.isFinite(Number(rung.counter.preset)) || Number(rung.counter.preset) <= 0)) issues.push({level:"error",code:"counter-preset",message:`Counter ${rung.counter.tag} needs a preset greater than zero.`});
    if (rung.counter?.resetTag && tags.get(rung.counter.resetTag)?.type !== "BOOL") issues.push({level:"error",code:"counter-reset-tag",message:`Counter reset tag ${rung.counter.resetTag} must be a declared BOOL tag.`});
    if (rung.res && !(project.rungs || []).some((item) => item.counter?.tag === rung.res.counterTag)) issues.push({level:"error",code:"res-target",message:`RES target ${rung.res.counterTag || "(missing)"} must match a declared ladder counter.`});
    if (rung.mcr && !["start", "end"].includes(rung.mcr)) issues.push({level:"error",code:"mcr-type",message:`Rung ${index + 1} has an unsupported MCR instruction.`});
    if (rung.scale) {
      const input = tags.get(rung.scale.inputTag), output = tags.get(rung.scale.outputTag), range = [rung.scale.rawMin, rung.scale.rawMax, rung.scale.scaledMin, rung.scale.scaledMax].map(Number);
      if (!input || !["INT", "REAL"].includes(input.type)) issues.push({ level:"error", code:"ld-scale-input", message:`LD SCALE input ${rung.scale.inputTag || "(missing)"} must be a declared numeric tag.` });
      if (!output || !["INT", "REAL"].includes(output.type)) issues.push({ level:"error", code:"ld-scale-output", message:`LD SCALE output ${rung.scale.outputTag || "(missing)"} must be a declared numeric tag.` });
      if (!range.every(Number.isFinite) || range[0] === range[1]) issues.push({ level:"error", code:"ld-scale-range", message:"LD SCALE needs finite limits and a nonzero raw range." });
    }
  }
  let mcrOpen = false;
  for (const [index, rung] of (project.rungs || []).entries()) {
    if (rung.mcr === "start") { if (mcrOpen) issues.push({level:"error",code:"mcr-nested",message:`MCR at rung ${index + 1} is nested; only one MCR section may be active.`}); mcrOpen = true; }
    if (rung.mcr === "end") { if (!mcrOpen) issues.push({level:"error",code:"mcr-unmatched-end",message:`MCR end at rung ${index + 1} has no preceding start.`}); mcrOpen = false; }
  }
  if (mcrOpen) issues.push({level:"error",code:"mcr-unclosed",message:"MCR start instruction has no matching end instruction."});
  issues.push(...validateFbdBlocks(project));
  if (project.electrical) issues.push(...validateElectricalDiagram(project.electrical, project.tags || []));
  const hmi = project.hmi;
  if (hmi) {
    const inputNames = new Set([...(project.io?.inputs || []), ...(project.tags || []).filter((tag) => tag.role === "input").map((tag) => tag.name)]);
    const outputNames = new Set([...(project.io?.outputs || []), ...(project.tags || []).filter((tag) => tag.role === "output").map((tag) => tag.name)]);
    const screens = Array.isArray(hmi.screens) ? hmi.screens : [], screenIds = new Set(), screenNames = new Set();
    for (const screen of screens) {
      const normalizedName = String(screen?.title || "").trim().toLocaleLowerCase();
      if (!screen?.id || screenIds.has(screen.id)) issues.push({ level:"error", code:"hmi-screen-id", message:"HMI screen IDs must be present and unique." });
      else screenIds.add(screen.id);
      if (!normalizedName || screenNames.has(normalizedName)) issues.push({ level:"error", code:"hmi-screen-name", message:`HMI screen names must be present and unique: ${screen?.title || "(empty)"}.` });
      else screenNames.add(normalizedName);
      if (!Array.isArray(screen?.widgets)) issues.push({ level:"error", code:"hmi-screen-widgets", message:`HMI screen ${screen?.title || screen?.id} must have a widget list.` });
    }
    const widgets = screens.length ? screens.flatMap((screen) => screen.widgets || []) : hmi.widgets || [];
    for (const widget of widgets) {
      if (!["switch", "lamp", "value", "trend"].includes(widget.type)) issues.push({ level: "error", code: "hmi-widget-type", message: `HMI widget ${widget.label || widget.id} has an unsupported type.` });
      if (!widget.tag || !tags.has(widget.tag)) issues.push({ level: "warning", code: "hmi-tag-undefined", message: `HMI widget ${widget.label || widget.id} uses an undeclared tag.` });
      if (widget.type === "switch" && !inputNames.has(widget.tag)) issues.push({ level: "error", code: "hmi-switch-role", message: `HMI switch ${widget.label || widget.id} must use an input tag.` });
      if (widget.type === "lamp" && !outputNames.has(widget.tag)) issues.push({ level: "warning", code: "hmi-lamp-role", message: `HMI lamp ${widget.label || widget.id} is not bound to a declared output.` });
    }
    if (hmi.alarmHistoryLimit !== undefined && ![100,500,2000].includes(hmi.alarmHistoryLimit)) issues.push({ level:"error",code:"alarm-history-limit",message:"Alarm history limit must be 100, 500, or 2000 events." });
    for (const alarm of hmi.alarms || []) {
      if (!alarm.tag || !tags.has(alarm.tag)) issues.push({ level: "warning", code: "alarm-tag-undefined", message: `HMI alarm ${alarm.message || alarm.id} uses an undeclared tag.` });
      else if (alarm.condition?.kind === "threshold") {
        if (!["INT", "REAL", "TIME"].includes(tags.get(alarm.tag).type)) issues.push({ level:"error", code:"alarm-tag-type", message:`HMI threshold alarm ${alarm.message || alarm.id} requires a numeric tag.` });
      } else if (tags.get(alarm.tag).type !== "BOOL") issues.push({ level: "error", code: "alarm-tag-type", message: `HMI alarm ${alarm.message || alarm.id} requires a BOOL tag.` });
      if (alarm.condition && !["bool", "threshold"].includes(alarm.condition.kind)) issues.push({ level:"error", code:"alarm-condition", message:`HMI alarm ${alarm.message || alarm.id} has an unsupported condition.` });
      if (alarm.condition?.kind === "threshold" && (!["gte", "lte"].includes(alarm.condition.operator) || typeof alarm.condition.threshold !== "number" || !Number.isFinite(alarm.condition.threshold))) issues.push({ level:"error", code:"alarm-threshold", message:`HMI alarm ${alarm.message || alarm.id} requires a finite threshold and a supported comparison.` });
      if (alarm.condition?.kind === "threshold" && alarm.condition.hysteresis !== undefined && (typeof alarm.condition.hysteresis !== "number" || !Number.isFinite(alarm.condition.hysteresis) || alarm.condition.hysteresis < 0)) issues.push({ level:"error", code:"alarm-hysteresis", message:`HMI alarm ${alarm.message || alarm.id} requires a finite non-negative hysteresis.` });
      if (!["high", "medium", "low"].includes(alarm.priority)) issues.push({ level: "error", code: "alarm-priority", message: `HMI alarm ${alarm.message || alarm.id} has an invalid priority.` });
    }
    for (const recipe of hmi.recipes || []) {
      if (!Number.isInteger(recipe.version) || recipe.version < 1) issues.push({ level: "error", code: "recipe-version", message: `Recipe ${recipe.name} has an invalid version.` });
      for (const [name, value] of Object.entries(recipe.values || {})) {
        if (!inputNames.has(name)) issues.push({ level: "warning", code: "recipe-input", message: `Recipe ${recipe.name} includes non-input tag ${name}.` });
        const type = tags.get(name)?.type || "BOOL";
        const valid = type === "BOOL" ? typeof value === "boolean" : typeof value === "number" && Number.isFinite(value) && (type !== "INT" || Number.isInteger(value)) && (type !== "TIME" || value >= 0);
        if (!valid) issues.push({ level: "error", code: "recipe-value-type", message: `Recipe ${recipe.name} value for ${name} must match ${type}.` });
      }
    }
  }
  const processInputs = new Set([...(project.io?.inputs || []), ...(project.tags || []).filter((tag) => tag.role === "input").map((tag) => tag.name)]);
  const processTypes = ["tank", "conveyor", "motor", "thermal", "pump", "pid"];
  for (const model of project.processes || []) {
    if (!processTypes.includes(model.type)) issues.push({ level: "error", code: "process-type", message: `Process ${model.name || model.id} has an unsupported model type.` });
    if (!model.outputTag || !tags.has(model.outputTag)) issues.push({ level: "warning", code: "process-output-undefined", message: `Process ${model.name || model.id} has an undeclared output tag.` });
    else if (tags.get(model.outputTag).type === "BOOL") issues.push({ level: "error", code: "process-output-type", message: `Process output ${model.outputTag} must be numeric.` });
    if (model.type !== "pid" && (!model.controlTag || !processInputs.has(model.controlTag))) issues.push({ level: "error", code: "process-control-tag", message: `Process ${model.name || model.id} needs a declared digital run input.` });
    if (model.type === "pid" && (!model.inputTag || !tags.has(model.inputTag) || tags.get(model.inputTag).type === "BOOL")) issues.push({ level: "error", code: "process-pv-tag", message: `PID model ${model.name || model.id} needs a numeric process-variable tag.` });
    for (const field of Object.keys(model).filter((key) => ["capacity", "fillRate", "drainRate", "speed", "length", "ratedSpeed", "responseSeconds", "ambient", "heatRate", "coolingRate", "passiveCoolingRate", "maxFlow", "head", "maxHead", "setpoint", "kp", "ki", "kd", "min", "max"].includes(key))) if (!Number.isFinite(Number(model[field]))) issues.push({ level: "error", code: "process-parameter", message: `Process ${model.name || model.id} parameter ${field} must be numeric.` });
  }
  return issues;
}
