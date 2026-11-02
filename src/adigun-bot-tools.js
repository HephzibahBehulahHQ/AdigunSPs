import { scan, scanFBD } from "./engine.js";
import { createElectricalComponent, electricalComponentCatalog, nextElectricalReference, connectElectricalTerminals, simulateElectricalDiagram, validateElectricalDiagram } from "./electrical.js";
import { validateProject } from "./validation.js";

const clone = (value) => structuredClone(value);
const findComponent = (project, idOrReference) => (project.electrical?.components || []).find((item) => item.id === idOrReference || item.reference === idOrReference);
const findRung = (project, id) => (project.rungs || []).find((item) => item.id === id);

function assertProjectShape(value) {
  const candidate = typeof value === "string" ? JSON.parse(value) : clone(value);
  if (!candidate || typeof candidate !== "object" || !Array.isArray(candidate.tags) || !Array.isArray(candidate.rungs) || !candidate.io || !Array.isArray(candidate.io.inputs) || !Array.isArray(candidate.io.outputs)) throw new Error("Project data does not match the supported AdigunSPs project format.");
  candidate.fbdBlocks ||= [];
  candidate.electrical ||= { components:[], wires:[] };
  if (!Array.isArray(candidate.electrical.components) || !Array.isArray(candidate.electrical.wires)) throw new Error("Project electrical data is invalid.");
  return candidate;
}

function runSimulation(project, inputs = {}, state = {}) {
  const plc = project.editorType === "FBD"
    ? scanFBD(project.fbdBlocks, inputs, state, project.io.outputs)
    : scan(project, inputs, state);
  const electrical = simulateElectricalDiagram(project.electrical || { components:[], wires:[] }, inputs, plc.outputs);
  return { outputs:plc.outputs, values:plc.values, electrical:electrical.componentStates, electricalWarnings:electrical.warnings, simulationOnly:true };
}

function renameTag(project, oldName, newName) {
  if (!oldName || !newName || oldName === newName) throw new Error("Provide different non-empty old and new tag names.");
  if (!(project.tags || []).some((tag) => tag.name === oldName)) throw new Error(`Tag ${oldName} does not exist.`);
  if ((project.tags || []).some((tag) => tag.name === newName)) throw new Error(`Tag ${newName} already exists.`);
  for (const tag of project.tags || []) if (tag.name === oldName) tag.name = newName;
  for (const role of ["inputs", "outputs"]) project.io[role] = (project.io[role] || []).map((tag) => tag === oldName ? newName : tag);
  if (Object.hasOwn(project.initialState || {}, oldName)) { project.initialState[newName] = project.initialState[oldName]; delete project.initialState[oldName]; }
  for (const rung of project.rungs || []) {
    for (const branch of rung.branches || []) for (const contact of branch) if (contact.tag === oldName) contact.tag = newName;
    if (rung.coil === oldName) rung.coil = newName;
    if (rung.timer?.tag === oldName) rung.timer.tag = newName;
    if (rung.counter?.tag === oldName) rung.counter.tag = newName;
  }
  for (const block of project.fbdBlocks || []) {
    block.inputs = (block.inputs || []).map((tag) => tag === oldName ? newName : tag);
    if (block.outputTag === oldName) block.outputTag = newName;
    if (block.countTag === oldName) block.countTag = newName;
  }
  for (const component of project.electrical?.components || []) {
    if (component.tag === oldName) component.tag = newName;
    if (component.coilTag === oldName) component.coilTag = newName;
    for (const mapping of Object.values(component.ioMap || {})) if (mapping.tag === oldName) mapping.tag = newName;
  }
  const referenceFields = new Set(["tag","coil","coilTag","inputTag","outputTag","countTag","timerTag","statusTag","targetTag","sourceTag","resetTag"]);
  const referenceArrays = new Set(["inputs","outputs","tags","triggerTags","resetTags"]), keyedTagMaps = new Set(["initialState","inputStates","values","analogValues"]);
  const visit = (value, parent = "") => {
    if (Array.isArray(value)) { if (referenceArrays.has(parent)) return value.map((item) => item === oldName ? newName : visit(item,parent)); value.forEach((item) => visit(item,parent)); return value; }
    if (!value || typeof value !== "object") return value;
    if (keyedTagMaps.has(parent) && Object.hasOwn(value,oldName)) { value[newName] = value[oldName]; delete value[oldName]; }
    for (const [key,item] of Object.entries(value)) {
      if (referenceFields.has(key) && item === oldName) value[key] = newName;
      else if (Array.isArray(item)) value[key] = visit(item,key);
      else if (item && typeof item === "object") visit(item,key);
    }
    return value;
  };
  visit(project);
}

function executeOne(project, call, context, effects) {
  const input = call.arguments || call.input || {};
  switch (call.name) {
    case "place_component": {
      const type = String(input.type || ""), spec = electricalComponentCatalog[type];
      if (!spec) throw new Error(`Unsupported component type: ${type}`);
      const x = Number(input.position?.x ?? 120), y = Number(input.position?.y ?? 120);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Component position must use finite coordinates.");
      const reference = nextElectricalReference(type, project.electrical.components), sequence = Number(reference.slice(spec.prefix.length));
      const component = createElectricalComponent(type, sequence, x, y);
      project.electrical.components.push(component);
      for (const [key,value] of Object.entries(input.properties || {})) executeOne(project,{name:"set_property",arguments:{componentId:component.id,key,value}},context,effects);
      return { componentId:component.id, reference:component.reference };
    }
    case "connect": {
      const from = findComponent(project, input.source), to = findComponent(project, input.target);
      if (!from || !to) throw new Error("Both connection components must exist by ID or reference.");
      const result = connectElectricalTerminals(project.electrical, { componentId:from.id, terminal:input.sourcePort }, { componentId:to.id, terminal:input.targetPort });
      if (!result.ok) throw new Error(result.error);
      project.electrical.wires.push(result.wire);
      return { wireId:result.wire.id };
    }
    case "set_property": {
      const rung = input.rungId ? findRung(project,input.rungId) : null;
      if (input.rungId) {
        const allowedRung = new Set(["comment","label","coil","coilMode","timer","counter","scale","mcr"]);
        if (!rung || !allowedRung.has(input.key)) throw new Error("Unknown rung or unsupported editable rung property.");
        if (input.key === "mcr" && ![null,"start","end"].includes(input.value)) throw new Error("MCR must be start, end, or null.");
        if (input.key === "coilMode" && !["normal","set","reset"].includes(input.value)) throw new Error("Coil mode must be normal, set, or reset.");
        rung[input.key] = ["timer","counter","scale"].includes(input.key) && input.value ? clone(input.value) : input.value;
        return { rungId:rung.id, key:input.key, value:rung[input.key] };
      }
      const component = findComponent(project, input.componentId);
      const allowed = new Set(["label","tag","coilTag","coilRef","normallyClosed","closed","tripped","nominalVoltageV","ratedVoltageV","ratedCurrentA","x","y","rotation","ioMap"]);
      if (!component || !allowed.has(input.key)) throw new Error("Unknown component or unsupported editable property.");
      if (["x","y","nominalVoltageV","ratedVoltageV","ratedCurrentA"].includes(input.key) && input.value !== null && !Number.isFinite(Number(input.value))) throw new Error(`${input.key} must be a finite number or null.`);
      if (input.key === "rotation" && ![0,90,180,270].includes(Number(input.value))) throw new Error("Rotation must be 0, 90, 180, or 270 degrees.");
      if (["normallyClosed","closed","tripped"].includes(input.key) && typeof input.value !== "boolean") throw new Error(`${input.key} must be true or false.`);
      if (["label","tag","coilTag","coilRef"].includes(input.key) && typeof input.value !== "string") throw new Error(`${input.key} must be text.`);
      if (input.key === "ioMap" && (!input.value || typeof input.value !== "object" || Array.isArray(input.value) || Object.entries(input.value).some(([channel,mapping]) => !Object.hasOwn(component.ioMap || {},channel) || !mapping || typeof mapping.tag !== "string" || typeof mapping.address !== "string" || !mapping.address.trim()))) throw new Error("I/O mapping must use defined device channels with text tags and non-empty addresses.");
      component[input.key] = ["x","y"].includes(input.key) ? Math.round(Number(input.value) / 20) * 20 : ["nominalVoltageV","ratedVoltageV","ratedCurrentA"].includes(input.key) && input.value !== null ? Number(input.value) : input.value;
      return { componentId:component.id, key:input.key, value:component[input.key] };
    }
    case "add_contact": {
      const rung = findRung(project,input.rungId), branchIndex = Number(input.branchIndex ?? 0), mode = input.mode || "NO";
      if (!rung || !Number.isInteger(branchIndex) || !["NO","NC","R_TRIG","F_TRIG"].includes(mode) || typeof input.tag !== "string" || !input.tag.trim()) throw new Error("A valid rung, branch, contact mode, and tag are required.");
      rung.branches ||= [rung.contacts || []];
      if (!rung.branches[branchIndex]) throw new Error("The target rung branch does not exist.");
      const contact = { tag:input.tag.trim(), mode }, branch = rung.branches[branchIndex];
      const index = Number.isInteger(input.position) ? Math.max(0,Math.min(branch.length,input.position)) : branch.length;
      branch.splice(index,0,contact);
      return { rungId:rung.id, branchIndex, contactIndex:index, contact };
    }
    case "add_fbd_input": {
      const block = input.blockId ? project.fbdBlocks.find((item) => item.id === input.blockId) : Number.isInteger(input.blockIndex) ? project.fbdBlocks[input.blockIndex] : null;
      if (!block || !["AND","OR"].includes(block.type)) throw new Error("A supported AND/OR block is required for this input suggestion.");
      const inputs = block.inputs || [], connected = inputs.filter(Boolean).length;
      if (connected >= 8) throw new Error("The function block already has its maximum supported inputs.");
      const baseName = String(input.tag || `Switch${(project.io.inputs || []).length + 1}`).trim(), existing = new Set((project.tags || []).map((tag) => tag.name));
      let tagName = baseName, suffix = 2; while (!tagName || existing.has(tagName)) tagName = `${baseName}${suffix++}`;
      project.tags ||= []; project.io.inputs ||= []; project.initialState ||= {};
      project.tags.push({name:tagName,type:"BOOL",role:"input",address:""}); project.io.inputs.push(tagName); project.initialState[tagName] = false;
      const emptyIndex = inputs.findIndex((tag) => !tag);
      if (emptyIndex >= 0) inputs[emptyIndex] = tagName; else inputs.push(tagName);
      block.inputs = inputs;
      return {blockId:block.id||null,blockIndex:project.fbdBlocks.indexOf(block),tag:tagName,inputIndex:emptyIndex>=0?emptyIndex:inputs.length-1,simulationOnly:true};
    }
    case "add_comment":
    case "add_label": {
      const rung = findRung(project, input.rungId);
      if (!rung) throw new Error("The target rung does not exist.");
      if (call.name === "add_comment") rung.comment = String(input.text || "").trim();
      else rung.label = String(input.text || "").trim();
      return { rungId:rung.id, text:call.name === "add_comment" ? rung.comment : rung.label };
    }
    case "rename_tag":
      renameTag(project, input.oldName, input.newName);
      return { oldName:input.oldName, newName:input.newName };
    case "delete": {
      if (input.confirmed !== true) throw new Error("Deletion requires explicit confirmation in the approved plan.");
      const id = input.componentOrWireId || input.id, components = project.electrical.components, wires = project.electrical.wires;
      const component = findComponent(project, id);
      if (component) {
        project.electrical.components = components.filter((item) => item.id !== component.id);
        project.electrical.wires = wires.filter((wire) => wire.from.componentId !== component.id && wire.to.componentId !== component.id);
        return { deleted:component.reference, removedWires:wires.length - project.electrical.wires.length };
      }
      const wireIndex = wires.findIndex((wire) => wire.id === id);
      if (wireIndex >= 0) { const [wire] = wires.splice(wireIndex,1); return { deleted:wire.id }; }
      const rungIndex = project.rungs.findIndex((rung) => rung.id === id);
      if (rungIndex >= 0) { const [rung] = project.rungs.splice(rungIndex,1); return { deleted:rung.id }; }
      throw new Error(`Nothing with ID or reference ${id} exists.`);
    }
    case "create_rung": {
      const id = String(input.rungId || crypto.randomUUID());
      if (project.rungs.some((item) => item.id === id)) throw new Error(`Rung ID ${id} already exists.`);
      const rung = { id, comment:String(input.comment || `Rung ${project.rungs.length + 1}`), branches:[[]], coil:"" };
      const index = Number.isInteger(input.position) ? Math.max(0, Math.min(project.rungs.length, input.position)) : project.rungs.length;
      project.rungs.splice(index,0,rung);
      return { rungId:rung.id, position:index };
    }
    case "create_branch": {
      const rung = findRung(project,input.rungId);
      if (!rung) throw new Error("The target rung does not exist.");
      rung.branches ||= [rung.contacts || []]; rung.branches.push([]);
      return { branchId:`${rung.id}:${rung.branches.length - 1}`, rungId:rung.id };
    }
    case "create_junction": {
      const diagram = project.electrical, index = diagram.wires.findIndex((wire) => wire.id === input.wireId);
      if (index < 0) throw new Error("The target wire does not exist.");
      const [wire] = diagram.wires.splice(index,1), reference = nextElectricalReference("junction", diagram.components), component = createElectricalComponent("junction", Number(reference.slice(1)), Number(input.position?.x ?? 120), Number(input.position?.y ?? 120));
      diagram.components.push(component);
      for (const [endpoint, pin] of [[wire.from,"1"],[wire.to,"2"]]) {
        const result = connectElectricalTerminals(diagram, endpoint, { componentId:component.id, terminal:pin });
        if (!result.ok) throw new Error(result.error);
        diagram.wires.push(result.wire);
      }
      return { junctionId:component.id, reference:component.reference };
    }
    case "simulate":
      return runSimulation(project, input.inputs || {}, input.state || {});
    case "snapshot":
      return clone(project);
    case "restore":
    case "import_project": {
      const restored = assertProjectShape(input.project ?? input.json);
      Object.keys(project).forEach((key) => delete project[key]); Object.assign(project, restored);
      return { projectId:project.id, name:project.name };
    }
    case "export_project":
      if ((input.format || "json").toLowerCase() !== "json") throw new Error("Only JSON project export is supported by this tool.");
      return JSON.stringify(project);
    case "save_local":
      if (context.accountAccess !== "member") throw new Error("Sign in to save your project.");
      if (typeof context.saveLocal !== "function") throw new Error("Local save handler is not configured.");
      effects.push(() => context.saveLocal(clone(project)));
      return { queued:true, destination:"local" };
    case "save_cloud":
      if (context.accountAccess !== "member") throw new Error("Sign in to save your project.");
      if (typeof context.saveCloud !== "function") throw new Error("Cloud save handler is not configured.");
      effects.push(() => context.saveCloud(clone(project)));
      return { queued:true, destination:"cloud" };
    case "ask_user":
      return { needsUserInput:true, question:String(input.question || "") };
    case "preview_plan":
      if (!Array.isArray(input.plan)) throw new Error("A plan array is required for preview.");
      return { preview:clone(input.plan), requiresApproval:true };
    default:
      throw new Error(`Unknown Adigun BOT tool: ${call.name}`);
  }
}

export async function executeAdigunBotTools(currentProject, calls, context = {}) {
  const original = clone(currentProject), candidate = clone(currentProject), results = [], effects = [];
  try {
    if (!Array.isArray(calls)) throw new Error("Tool calls must be an array.");
    if (calls.filter((call) => ["save_local","save_cloud"].includes(call.name)).length > 1) throw new Error("A tool transaction may contain at most one save operation.");
    for (const call of calls) {
      if (!call || typeof call.name !== "string") throw new Error("Each tool call needs a name.");
      if (["save_local","save_cloud"].includes(call.name) && calls.at(-1) !== call) throw new Error("Save must be the final plan step.");
      results.push({ name:call.name, result:executeOne(candidate,call,context,effects) });
    }
    const electricalErrors = validateElectricalDiagram(candidate.electrical || { components:[],wires:[] },candidate.tags || []).filter((item) => item.level === "error");
    if (electricalErrors.length) throw new Error(electricalErrors.map((item) => item.message).join("; "));
    const projectDiagnostics = validateProject(candidate), projectErrors = projectDiagnostics.filter((item) => item.level === "error");
    if (projectErrors.length) throw new Error(projectErrors.map((item) => item.message).join("; "));
    for (const effect of effects) await effect();
    return { ok:true, project:candidate, results, warnings:projectDiagnostics.filter((item) => item.level === "warning") };
  } catch (error) {
    return { ok:false, project:original, results:[], error:error instanceof Error ? error.message : String(error) };
  }
}
