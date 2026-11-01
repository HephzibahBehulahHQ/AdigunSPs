import { scan, scanFBD } from "./engine.js";
import { simulateElectricalDiagram, validateElectricalDiagram } from "./electrical.js";
import { validateFbdBlocks } from "./fbd-validation.js";
import { validateProject } from "./validation.js";

const bool = (value) => Boolean(value);
function expectedGate(type, values) {
  if (type === "AND") return values.every(bool);
  if (type === "OR") return values.some(bool);
  if (type === "NAND") return !values.every(bool);
  if (type === "NOR") return !values.some(bool);
  if (type === "XOR") return values.filter(bool).length % 2 === 1;
  if (type === "XNOR") return values.filter(bool).length % 2 === 0;
  if (type === "NOT") return !bool(values[0]);
  return undefined;
}

function electricalResult(project, inputs, outputs) {
  const result = simulateElectricalDiagram(project.electrical || { components:[], wires:[] }, inputs, outputs);
  const loads = (project.electrical?.components || []).filter((item) => ["pilotLamp", "buzzer", "heaterElement", "singlePhaseMotor", "threePhaseMotor", "solenoidValve"].includes(item.type));
  return { result, loads:loads.map((item) => ({ reference:item.reference, type:item.type, energized:Boolean(result.componentStates?.[item.id]?.energized) })) };
}

export function verifyAdigunBotDraft(draft) {
  if (!draft?.ok || !draft.project) return { ok:false, passed:false, cases:[], errors:["There is no valid Bot project draft to verify."] };
  const project = structuredClone(draft.project), cases = [], errors = [];
  const diagnostics = validateProject(project), warnings = diagnostics.filter((item) => item.level === "warning");
  errors.push(...diagnostics.filter((item) => item.level === "error").map((item) => item.message));
  if (draft.intent === "project-edit" && draft.change?.type === "rename-tag") {
    const baseline = draft.baselineProject, { oldName,newName } = draft.change;
    if (!baseline) errors.push("The original project snapshot is missing; this edit cannot be compared safely.");
    else {
      const oldTag = (baseline.tags || []).find((tag) => tag.name === oldName), newTag = (project.tags || []).find((tag) => tag.name === newName);
      if (!oldTag || !newTag || oldTag.type !== newTag.type || oldTag.role !== newTag.role || oldTag.address !== newTag.address) errors.push("The renamed tag did not preserve its type, role, and address.");
      const inputs = (baseline.io?.inputs || []).filter((name) => (baseline.tags || []).find((tag) => tag.name === name)?.type === "BOOL"), scenarios = [Object.fromEntries(inputs.map((tag) => [tag,false])),Object.fromEntries(inputs.map((tag) => [tag,true])),...inputs.map((active) => Object.fromEntries(inputs.map((tag) => [tag,tag === active])))];
      scenarios.forEach((baselineInputs,index) => {
        const candidateInputs = Object.fromEntries(Object.entries(baselineInputs).map(([tag,value]) => [tag === oldName ? newName : tag,value]));
        const before = baseline.editorType === "FBD" ? scanFBD(baseline.fbdBlocks || [],baselineInputs,{},baseline.io?.outputs || []) : scan(baseline,baselineInputs,{});
        const after = project.editorType === "FBD" ? scanFBD(project.fbdBlocks || [],candidateInputs,{},project.io?.outputs || []) : scan(project,candidateInputs,{});
        const pairs = (baseline.io?.outputs || []).map((tag) => [tag,tag === oldName ? newName : tag]);
        const expected = Object.fromEntries(pairs.map(([beforeTag]) => [beforeTag,bool(before.outputs[beforeTag])]));
        const actual = Object.fromEntries(pairs.map(([,afterTag],pairIndex) => [pairs[pairIndex][0],bool(after.outputs[afterTag])]));
        const passed = pairs.every(([beforeTag,afterTag]) => bool(before.outputs[beforeTag]) === bool(after.outputs[afterTag]));
        cases.push({label:`Rename equivalence scenario ${index + 1}`,inputs:baselineInputs,expected,actual,passed});
        if (!passed) errors.push(`Output behavior changed in rename scenario ${index + 1}.`);
      });
    }
  } else if (draft.intent === "project-edit" && draft.change?.type === "add-fbd-input") {
    const baseline=draft.baselineProject,{blockId,blockIndex,tag}=draft.change,block=Number.isInteger(blockIndex)?project.fbdBlocks?.[blockIndex]:project.fbdBlocks?.find((item)=>item.id===blockId),tagInfo=(project.tags||[]).find((item)=>item.name===tag);
    if(!baseline||!block||!tagInfo||tagInfo.type!=="BOOL"||tagInfo.role!=="input"||!(block.inputs||[]).includes(tag))errors.push("The simulated input is not connected to the requested FBD gate.");
    else {
      for(const value of [false,true]){
        const inputs=Object.fromEntries((project.io?.inputs||[]).map((name)=>[name,block.type==="AND"]));inputs[tag]=value;
        const result=scanFBD(project.fbdBlocks,inputs,{},project.io?.outputs||[]),actual=bool(result.values?.[block.outputTag]??result.outputs?.[block.outputTag]),expected=value;
        cases.push({label:`${block.type} with ${tag} ${value?"ON":"OFF"}`,inputs,expected:{[block.outputTag]:expected},actual:{[block.outputTag]:actual},passed:actual===expected});
        errors.push(...(result.errors||[]));
      }
    }
  } else if (draft.intent === "project-edit" && draft.change?.type === "delete-rung") {
    const baseline = draft.baselineProject, { rungId } = draft.change;
    if (!baseline || baseline.rungs?.length !== project.rungs?.length + 1 || project.rungs.some((rung) => rung.id === rungId)) errors.push("The draft does not contain exactly the requested rung removal.");
    const inputs = (project.io?.inputs || []).filter((name) => (project.tags || []).find((tag) => tag.name === name)?.type === "BOOL"), scenarios = [Object.fromEntries(inputs.map((tag) => [tag,false])),Object.fromEntries(inputs.map((tag) => [tag,true])),...inputs.map((active) => Object.fromEntries(inputs.map((tag) => [tag,tag === active])))];
    scenarios.forEach((values,index) => {
      const result = project.editorType === "FBD" ? scanFBD(project.fbdBlocks || [],values,{},project.io?.outputs || []) : scan(project,values,{});
      const outputs = Object.fromEntries((project.io?.outputs || []).map((tag) => [tag,bool(result.outputs[tag])]));
      cases.push({label:`After requested rung removal · scenario ${index+1}`,inputs:values,expected:outputs,actual:outputs,passed:!result.errors?.length});
      errors.push(...(result.errors || []));
    });
  } else if (project.editorType === "FBD") {
    errors.push(...validateFbdBlocks(project).map((issue) => issue.message));
    const inputs = project.io?.inputs || [];
    for (let mask = 0; mask < 2 ** inputs.length; mask++) {
      const values = Object.fromEntries(inputs.map((tag, index) => [tag, Boolean(mask & (1 << index))]));
      const logic = scanFBD(project.fbdBlocks, values, {}, project.io?.outputs || []);
      const expected = Object.fromEntries(project.fbdBlocks.map((block) => [block.outputTag, expectedGate(block.type, block.inputs.map((tag) => values[tag] ?? logic.outputs[tag]))]));
      const electrical = electricalResult(project, values, logic.outputs);
      cases.push({ label:`Input combination ${mask + 1}`, inputs:values, expected, actual:logic.outputs, loads:electrical.loads, passed:Object.entries(expected).every(([tag, value]) => bool(logic.outputs[tag]) === value) && !logic.errors.length });
      errors.push(...logic.errors);
    }
  } else if (project.editorType === "LD" && project.rungs?.[0]?.timer) {
    const rung = project.rungs[0], startTag = project.io?.inputs?.[0], outputTag = rung.coil, preset = Number(rung.timer.preset), before = Math.max(0, preset - 100);
    let state = scan(project, { [startTag]:true }, {}, before);
    const early = state.outputs[outputTag] ?? false;
    const electricalEarly = electricalResult(project, { [startTag]:true }, state.outputs);
    cases.push({ label:"Before timer preset", inputs:{ [startTag]:true, elapsedMs:before }, expected:{ [outputTag]:false }, actual:{ [outputTag]:bool(early) }, loads:electricalEarly.loads, passed:!early });
    state = scan(project, { [startTag]:true }, state, Math.max(100, preset - before));
    const late = state.outputs[outputTag] ?? false;
    const electricalLate = electricalResult(project, { [startTag]:true }, state.outputs);
    cases.push({ label:"At timer preset", inputs:{ [startTag]:true, elapsedMs:preset }, expected:{ [outputTag]:true }, actual:{ [outputTag]:bool(late) }, loads:electricalLate.loads, passed:Boolean(late) });
  } else if (project.editorType === "LD" && project.rungs?.length) {
    const [start, stop] = project.io?.inputs || [], output = project.io?.outputs?.[0];
    let state = scan(project, { [start]:false, [stop]:false }, {});
    cases.push({ label:"Idle", inputs:{ [start]:false, [stop]:false }, expected:{ [output]:false }, actual:{ [output]:bool(state.outputs[output]) }, passed:!state.outputs[output] });
    state = scan(project, { [start]:true, [stop]:false }, state);
    const started = Boolean(state.outputs[output]);
    cases.push({ label:"Press Start", inputs:{ [start]:true, [stop]:false }, expected:{ [output]:true }, actual:{ [output]:started }, passed:started });
    state = scan(project, { [start]:false, [stop]:false }, state);
    const latched = Boolean(state.outputs[output]);
    cases.push({ label:"Release Start", inputs:{ [start]:false, [stop]:false }, expected:{ [output]:true }, actual:{ [output]:latched }, passed:latched });
    state = scan(project, { [start]:false, [stop]:true }, state);
    const stopped = Boolean(state.outputs[output]);
    const electrical = electricalResult(project, { [start]:false, [stop]:true }, state.outputs);
    cases.push({ label:"Press Stop", inputs:{ [start]:false, [stop]:true }, expected:{ [output]:false }, actual:{ [output]:stopped }, loads:electrical.loads, passed:!stopped });
  } else errors.push("This draft type has no Bot verification scenario yet.");

  errors.push(...validateElectricalDiagram(project.electrical || { components:[], wires:[] }, project.tags || []).filter((issue) => issue.level === "error").map((issue) => issue.message));
  const passed = !errors.length && cases.length > 0 && cases.every((item) => item.passed);
  return { ok:true, passed, cases, errors:[...new Set(errors)], warnings };
}

export function adigunBotLadderSketch(project) {
  const rungs = project?.rungs || [];
  if (rungs.length) return rungs.map((rung, index) => {
    const branches = rung.branches?.length ? rung.branches : [rung.contacts || []];
    const path = branches.map((branch) => branch.map((contact) => `${contact.mode === "NC" ? "[/]" : "[ ]"} ${contact.tag}`).join("──"));
    return `Rung ${index + 1}${rung.comment ? ` · ${rung.comment}` : ""}\n${path.join("  OR  ")} ── ${rung.timer ? `${rung.timer.type} ${rung.timer.preset}ms ── ` : ""}( ${rung.coil || ""} )`;
  }).join("\n\n");
  return (project?.fbdBlocks || []).map((block) => `${block.inputs.join(" + ")} ── ${block.type} ── ( ${block.outputTag} )`).join("\n") || "Empty ladder preview";
}
