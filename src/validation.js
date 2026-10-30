import { validateFbdBlocks } from "./fbd-validation.js";
import { validateElectricalDiagram } from "./electrical.js";

export function validateProject(project) {
  const issues = [];
  const tags = new Map();
  for (const tag of project.tags || []) {
    if (!tag.name?.trim()) issues.push({ level: "error", code: "tag-name", message: "Every tag needs a name." });
    else if (tags.has(tag.name)) issues.push({ level: "error", code: "tag-duplicate", message: `Tag ${tag.name} is defined more than once.` });
    else tags.set(tag.name, tag);
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
    if (rung.timer && rung.timer.type && !["TON", "TOF", "TP"].includes(rung.timer.type)) issues.push({ level:"error", code:"timer-type", message:`Timer ${rung.timer.tag} has an unsupported type ${rung.timer.type}.` });
    if (rung.timer && (!Number.isFinite(Number(rung.timer.preset)) || Number(rung.timer.preset) <= 0)) issues.push({ level: "error", code: "timer-preset", message: `Timer ${rung.timer.tag} needs a preset greater than zero.` });
    if (rung.scale) {
      const input = tags.get(rung.scale.inputTag), output = tags.get(rung.scale.outputTag), range = [rung.scale.rawMin, rung.scale.rawMax, rung.scale.scaledMin, rung.scale.scaledMax].map(Number);
      if (!input || !["INT", "REAL"].includes(input.type)) issues.push({ level:"error", code:"ld-scale-input", message:`LD SCALE input ${rung.scale.inputTag || "(missing)"} must be a declared numeric tag.` });
      if (!output || !["INT", "REAL"].includes(output.type)) issues.push({ level:"error", code:"ld-scale-output", message:`LD SCALE output ${rung.scale.outputTag || "(missing)"} must be a declared numeric tag.` });
      if (!range.every(Number.isFinite) || range[0] === range[1]) issues.push({ level:"error", code:"ld-scale-range", message:"LD SCALE needs finite limits and a nonzero raw range." });
    }
  }
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
    for (const alarm of hmi.alarms || []) {
      if (!alarm.tag || !tags.has(alarm.tag)) issues.push({ level: "warning", code: "alarm-tag-undefined", message: `HMI alarm ${alarm.message || alarm.id} uses an undeclared tag.` });
      else if (tags.get(alarm.tag).type !== "BOOL") issues.push({ level: "error", code: "alarm-tag-type", message: `HMI alarm ${alarm.message || alarm.id} requires a BOOL tag.` });
      if (!["high", "medium", "low"].includes(alarm.priority)) issues.push({ level: "error", code: "alarm-priority", message: `HMI alarm ${alarm.message || alarm.id} has an invalid priority.` });
    }
    for (const recipe of hmi.recipes || []) {
      if (!Number.isInteger(recipe.version) || recipe.version < 1) issues.push({ level: "error", code: "recipe-version", message: `Recipe ${recipe.name} has an invalid version.` });
      for (const [name, value] of Object.entries(recipe.values || {})) {
        if (!inputNames.has(name)) issues.push({ level: "warning", code: "recipe-input", message: `Recipe ${recipe.name} includes non-input tag ${name}.` });
        if (typeof value !== "boolean") issues.push({ level: "error", code: "recipe-value-type", message: `Recipe ${recipe.name} value for ${name} must be Boolean.` });
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
