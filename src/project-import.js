import { electricalComponentCatalog } from "./electrical.js";

const MAX_PROJECT_BYTES = 5 * 1024 * 1024;
const MAX_PROJECT_NODES = 100_000;
const MAX_PROJECT_DEPTH = 48;
const MAX_RUNGS = 2_000;
const MAX_TAGS = 1_000;
const MAX_BRANCHES = 4_096;
const MAX_CONTACTS = 10_000;
const MAX_FUNCTION_BLOCKS = 5_000;
const MAX_PROCESS_MODELS = 250;
const MAX_HMI_SCREENS = 50;
const MAX_HMI_WIDGETS = 1_000;
const MAX_ELECTRICAL_COMPONENTS = 5_000;
const MAX_ELECTRICAL_WIRES = 20_000;
const SUPPORTED_TAG_TYPES = new Set(["BOOL", "INT", "REAL", "TIME"]);
const SUPPORTED_CONTACT_MODES = new Set(["NO", "NC", "R_TRIG", "F_TRIG"]);
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function fail(reason) {
  throw new Error(`Invalid project file: ${reason}`);
}

function inspectJsonValue(value, state, depth = 0) {
  if (++state.nodes > MAX_PROJECT_NODES) fail("too much data.");
  if (depth > MAX_PROJECT_DEPTH) fail("nested data is too deep.");
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > 1_000_000) fail("a text field is too large.");
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("a number is not finite.");
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) inspectJsonValue(item, state, depth + 1);
    return;
  }
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) fail("contains an unsupported data value.");
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) fail("contains an unsafe property name.");
    inspectJsonValue(item, state, depth + 1);
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype);
}

function requireString(value, message, { optional = false, max = 128 } = {}) {
  if (optional && value === undefined) return;
  if (typeof value !== "string" || value.length > max) fail(message);
}

function requireStringList(value, message, maxItems = MAX_TAGS) {
  if (!Array.isArray(value) || value.length > maxItems || value.some((item) => typeof item !== "string" || item.length > 128)) fail(message);
}

function validateOptionalProjectData(project) {
  if (project.fbdBlocks !== undefined) {
    if (!Array.isArray(project.fbdBlocks) || project.fbdBlocks.length > MAX_FUNCTION_BLOCKS) fail(`function block data must contain at most ${MAX_FUNCTION_BLOCKS} blocks.`);
    for (const [index, block] of project.fbdBlocks.entries()) {
      if (!isRecord(block)) fail(`function block ${index + 1} must be an object.`);
      requireString(block.type, `function block ${index + 1} has an invalid type.`, { max: 32 });
      requireString(block.outputTag, `function block ${index + 1} has an invalid output tag.`, { optional: true });
      if (block.inputs !== undefined) requireStringList(block.inputs, `function block ${index + 1} inputs must be a list of tag names.`, MAX_TAGS);
      for (const field of ["preset", "rawMin", "rawMax", "scaledMin", "scaledMax", "x", "y"]) {
        if (block[field] !== undefined && !Number.isFinite(block[field])) fail(`function block ${index + 1} has an invalid ${field} value.`);
      }
    }
  }

  if (project.sfc !== undefined) {
    const sfc = project.sfc;
    if (!isRecord(sfc)) fail("sequential chart data must be an object.");
    requireString(sfc.initialStep, "sequential chart has an invalid initial step.", { optional: true });
    if (sfc.outputs !== undefined) requireStringList(sfc.outputs, "sequential chart outputs must be a list of tag names.");
    if (sfc.steps !== undefined) {
      if (!Array.isArray(sfc.steps) || sfc.steps.length > MAX_RUNGS) fail("sequential chart steps must be a bounded list.");
      for (const [index, step] of sfc.steps.entries()) {
        if (!isRecord(step)) fail(`sequential chart step ${index + 1} must be an object.`);
        requireString(step.id, `sequential chart step ${index + 1} has an invalid ID.`);
        requireString(step.name, `sequential chart step ${index + 1} has an invalid name.`, { optional: true });
        if (step.actions !== undefined) requireStringList(step.actions, `sequential chart step ${index + 1} actions must be a list of tag names.`);
      }
    }
    if (sfc.transitions !== undefined) {
      if (!Array.isArray(sfc.transitions) || sfc.transitions.length > MAX_RUNGS * 4) fail("sequential chart transitions must be a bounded list.");
      for (const [index, transition] of sfc.transitions.entries()) {
        if (!isRecord(transition)) fail(`sequential chart transition ${index + 1} must be an object.`);
        for (const field of ["id", "from", "to"]) requireString(transition[field], `sequential chart transition ${index + 1} has an invalid ${field}.`);
        requireString(transition.condition, `sequential chart transition ${index + 1} has an invalid condition.`, { optional: true });
        requireString(transition.mode, `sequential chart transition ${index + 1} has an invalid mode.`, { optional: true, max: 32 });
      }
    }
  }

  if (project.processes !== undefined) {
    if (!Array.isArray(project.processes) || project.processes.length > MAX_PROCESS_MODELS) fail(`process models must contain at most ${MAX_PROCESS_MODELS} entries.`);
    for (const [index, process] of project.processes.entries()) {
      if (!isRecord(process)) fail(`process model ${index + 1} must be an object.`);
      for (const field of ["id", "type", "outputTag"]) requireString(process[field], `process model ${index + 1} has an invalid ${field}.`);
      for (const field of ["name", "controlTag", "inputTag", "secondaryTag"]) requireString(process[field], `process model ${index + 1} has an invalid ${field}.`, { optional: true });
      for (const field of ["initial", "capacity", "fillRate", "drainRate", "speed", "length", "ratedSpeed", "responseSeconds", "ambient", "heatRate", "coolingRate", "passiveCoolingRate", "maxFlow", "head", "maxHead", "setpoint", "kp", "ki", "kd", "min", "max"]) {
        if (process[field] !== undefined && !Number.isFinite(process[field])) fail(`process model ${index + 1} has an invalid ${field} value.`);
      }
    }
  }

  if (project.hmi !== undefined) {
    if (!isRecord(project.hmi)) fail("HMI data must be an object.");
    const screens = project.hmi.screens;
    if (screens !== undefined) {
      if (!Array.isArray(screens) || screens.length > MAX_HMI_SCREENS) fail(`HMI screens must contain at most ${MAX_HMI_SCREENS} entries.`);
      let widgetCount = 0;
      for (const [index, screen] of screens.entries()) {
        if (!isRecord(screen)) fail(`HMI screen ${index + 1} must be an object.`);
        requireString(screen.id, `HMI screen ${index + 1} has an invalid ID.`);
        requireString(screen.title, `HMI screen ${index + 1} has an invalid title.`, { optional: true });
        if (screen.widgets !== undefined) {
          if (!Array.isArray(screen.widgets)) fail(`HMI screen ${index + 1} widgets must be a list.`);
          widgetCount += screen.widgets.length;
          if (widgetCount > MAX_HMI_WIDGETS) fail(`HMI data must contain at most ${MAX_HMI_WIDGETS} widgets.`);
          for (const [widgetIndex, widget] of screen.widgets.entries()) validateHmiWidget(widget, `HMI screen ${index + 1} widget ${widgetIndex + 1}`);
        }
      }
    }
    if (project.hmi.widgets !== undefined) {
      if (!Array.isArray(project.hmi.widgets)) fail("HMI widgets must be a list.");
      if (project.hmi.widgets.length > MAX_HMI_WIDGETS) fail(`HMI data must contain at most ${MAX_HMI_WIDGETS} widgets.`);
      for (const [index, widget] of project.hmi.widgets.entries()) validateHmiWidget(widget, `HMI widget ${index + 1}`);
    }
  }

  if (project.electrical !== undefined) {
    const diagram = project.electrical;
    if (!isRecord(diagram)) fail("electrical diagram data must be an object.");
    if (!Array.isArray(diagram.components) || diagram.components.length > MAX_ELECTRICAL_COMPONENTS) fail(`electrical components must contain at most ${MAX_ELECTRICAL_COMPONENTS} entries.`);
    if (!Array.isArray(diagram.wires) || diagram.wires.length > MAX_ELECTRICAL_WIRES) fail(`electrical wires must contain at most ${MAX_ELECTRICAL_WIRES} entries.`);
    if (diagram.inputStates !== undefined && !isRecord(diagram.inputStates)) fail("electrical input states must be an object.");
    const componentsById = new Map(), componentTerminals = new Map(), references = new Set();
    for (const [index, component] of diagram.components.entries()) {
      if (!isRecord(component)) fail(`electrical component ${index + 1} must be an object.`);
      for (const field of ["id", "type", "reference"]) requireString(component[field], `electrical component ${index + 1} has an invalid ${field}.`);
      const definition = electricalComponentCatalog[component.type];
      if (!definition) fail(`electrical component ${index + 1} uses an unsupported component type.`);
      if (componentsById.has(component.id)) fail(`electrical component ${index + 1} has a duplicate ID.`);
      if (references.has(component.reference.toLocaleUpperCase())) fail(`electrical component ${index + 1} has a duplicate reference.`);
      componentsById.set(component.id, component);
      references.add(component.reference.toLocaleUpperCase());
      if (!Number.isFinite(component.x) || !Number.isFinite(component.y)) fail(`electrical component ${index + 1} has invalid coordinates.`);
      if (component.terminals !== undefined) requireStringList(component.terminals, `electrical component ${index + 1} terminals must be a list.`, 128);
      const terminals = component.terminals || definition.terminals;
      if (terminals.length !== definition.terminals.length || terminals.some((terminal, terminalIndex) => terminal !== definition.terminals[terminalIndex])) fail(`electrical component ${index + 1} terminals do not match the supported component definition.`);
      componentTerminals.set(component.id, new Set(terminals));
      for (const field of ["tag", "coilTag"]) requireString(component[field], `electrical component ${index + 1} has an invalid ${field} value.`, { optional: true });
      for (const field of ["closed", "tripped", "normallyClosed"]) if (component[field] !== undefined && typeof component[field] !== "boolean") fail(`electrical component ${index + 1} has an invalid ${field} value.`);
      for (const field of ["ratedVoltageV", "ratedCurrentA", "nominalVoltageV", "signalValue"]) if (component[field] !== undefined && component[field] !== null && !Number.isFinite(component[field])) fail(`electrical component ${index + 1} has an invalid ${field} value.`);
      for (const field of ["manufacturer", "partNumber", "label"]) requireString(component[field], `electrical component ${index + 1} has an invalid ${field} value.`, { optional: true, max: 256 });
      if (component.ioMap !== undefined && !isRecord(component.ioMap)) fail(`electrical component ${index + 1} I/O map must be an object.`);
      if (component.ioMap) for (const [channel, mapping] of Object.entries(component.ioMap)) {
        if (!isRecord(mapping)) fail(`electrical component ${index + 1} has an invalid I/O mapping for ${channel}.`);
        requireString(mapping.tag, `electrical component ${index + 1} has an invalid I/O tag.`, { optional: true });
        requireString(mapping.address, `electrical component ${index + 1} has an invalid I/O address.`, { optional: true });
      }
    }
    for (const [index, wire] of diagram.wires.entries()) {
      if (!isRecord(wire) || !isRecord(wire.from) || !isRecord(wire.to)) fail(`electrical wire ${index + 1} has invalid endpoints.`);
      for (const endpoint of [wire.from, wire.to]) {
        requireString(endpoint.componentId, `electrical wire ${index + 1} has an invalid component reference.`);
        requireString(endpoint.terminal, `electrical wire ${index + 1} has an invalid terminal reference.`);
        if (!componentsById.has(endpoint.componentId) || !componentTerminals.get(endpoint.componentId).has(endpoint.terminal)) fail(`electrical wire ${index + 1} references an unknown component terminal.`);
      }
    }
  }
}

function validateHmiWidget(widget, label) {
  if (!isRecord(widget)) fail(`${label} must be an object.`);
  requireString(widget.id, `${label} has an invalid ID.`);
  requireString(widget.type, `${label} has an invalid type.`, { max: 32 });
  requireString(widget.tag, `${label} has an invalid tag.`);
  requireString(widget.label, `${label} has an invalid label.`, { optional: true });
  for (const field of ["col", "row", "offsetX", "offsetY"]) if (widget[field] !== undefined && !Number.isFinite(widget[field])) fail(`${label} has an invalid ${field} value.`);
}

export function normalizeImportedProject(value) {
  if (!isRecord(value)) fail("the root must be an object.");
  inspectJsonValue(value, { nodes: 0 });
  if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 120) fail("the project name must contain 1–120 characters.");
  if (!Array.isArray(value.rungs) || value.rungs.length > MAX_RUNGS) fail(`the project must contain no more than ${MAX_RUNGS} ladder networks.`);
  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.length > MAX_TAGS)) fail(`the tag list must contain at most ${MAX_TAGS} entries.`);
  if (value.io !== undefined && !isRecord(value.io)) fail("I/O configuration must be an object.");
  if (value.initialState !== undefined && !isRecord(value.initialState)) fail("initial values must be an object.");
  validateOptionalProjectData(value);

  const project = structuredClone(value);
  project.tags ||= [];
  project.io ||= { inputs: [], outputs: [] };
  for (const key of ["inputs", "outputs"]) {
    if (project.io[key] === undefined) project.io[key] = [];
    if (!Array.isArray(project.io[key]) || project.io[key].length > MAX_TAGS || project.io[key].some((name) => typeof name !== "string" || name.length > 128)) fail(`I/O ${key} must be a list of tag names.`);
  }
  project.initialState ||= {};

  for (const [index, tag] of project.tags.entries()) {
    if (!isRecord(tag) || typeof tag.name !== "string" || !tag.name.trim() || tag.name.length > 128) fail(`tag ${index + 1} has an invalid name.`);
    if (tag.type === undefined) tag.type = "BOOL";
    if (!SUPPORTED_TAG_TYPES.has(tag.type)) fail(`tag ${tag.name} has unsupported type ${String(tag.type)}.`);
  }

  let branchCount = 0, contactCount = 0;
  for (const [index, rung] of project.rungs.entries()) {
    if (!isRecord(rung)) fail(`network ${index + 1} must be an object.`);
    if (rung.branches !== undefined && !Array.isArray(rung.branches)) fail(`network ${index + 1} has an invalid branch list.`);
    if (rung.contacts !== undefined && !Array.isArray(rung.contacts)) fail(`network ${index + 1} has an invalid contact list.`);
    const branches = rung.branches?.length ? rung.branches : [rung.contacts || []];
    branchCount += branches.length;
    if (branchCount > MAX_BRANCHES) fail(`the project exceeds ${MAX_BRANCHES} branches.`);
    for (const branch of branches) {
      if (!Array.isArray(branch)) fail(`network ${index + 1} contains a malformed branch.`);
      contactCount += branch.length;
      if (contactCount > MAX_CONTACTS) fail(`the project exceeds ${MAX_CONTACTS} contacts.`);
      for (const contact of branch) {
        if (!isRecord(contact) || typeof contact.tag !== "string" || !contact.tag.trim() || contact.tag.length > 128) fail(`network ${index + 1} contains a contact with an invalid tag.`);
        if (contact.mode !== undefined && !SUPPORTED_CONTACT_MODES.has(contact.mode)) fail(`network ${index + 1} contains an unsupported contact mode.`);
        contact.mode ||= "NO";
      }
    }
    if (rung.coil !== undefined && (typeof rung.coil !== "string" || rung.coil.length > 128)) fail(`network ${index + 1} has an invalid output tag.`);
    rung.branches = branches;
  }
  return project;
}

export function assertProjectFileSize(size) {
  if (!Number.isFinite(size) || size < 0 || size > MAX_PROJECT_BYTES) fail("the file must be no larger than 5 MiB.");
}
