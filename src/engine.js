// UI-independent, deterministic scan engine for the AdigunSPs ladder subset.
import { stepProcesses } from "./process.js";
import { createExampleElectricalDiagram } from "./electrical.js";

export function scan(project, inputs, state = {}, dt = 100, breakpoints = []) {
  const outputs = { ...(state.outputs || {}) };
  const timers = structuredClone(state.timers || {});
  const counters = structuredClone(state.counters || {});
  const edges = structuredClone(state.edges || {});
  const energized = {};
  const values = { ...(state.values || {}), ...inputs, ...outputs };
  let breakpointSkip = breakpoints.includes(state.breakpointSkip) ? state.breakpointSkip : null;

  for (const [rungIndex, rung] of (project.rungs || []).entries()) {
    if (breakpoints.includes(rung.id)) {
      if (breakpointSkip === rung.id) breakpointSkip = null;
      else return { outputs, timers, counters, edges, energized, values: { ...inputs, ...outputs }, scanMs: dt, breakpointHit: rung.id, breakpointSkip: rung.id, rungIndex };
    }
    const paths = rung.branches?.length ? rung.branches : [rung.contacts || []];
    const pathResults = paths.map((contacts, pathIndex) => {
      let power = true;
      for (const [index, contact] of contacts.entries()) {
        const raw = Boolean(values[contact.tag]);
        const edgeKey = `${rung.id}:${pathIndex}:${index}`, prior = Boolean(edges[edgeKey]);
        const active = contact.mode === "NC" ? !raw : contact.mode === "R_TRIG" ? raw && !prior : contact.mode === "F_TRIG" ? !raw && prior : raw;
        if (["R_TRIG", "F_TRIG"].includes(contact.mode)) edges[edgeKey] = raw;
        energized[`${rung.id}:${pathIndex}:${index}`] = power && active;
        power = power && active;
      }
      return power;
    });
    let power = pathResults.some(Boolean);
    if (rung.timer) {
      const type = rung.timer.type || "TON", preset = Math.max(1, Number(rung.timer.preset) || 1), timer = timers[rung.timer.tag] || { elapsed:0, done:false, prior:false, active:false };
      if (type === "TOF") { if (power) { timer.elapsed = 0; timer.done = true; } else if (timer.done) { timer.elapsed = Math.min(preset, timer.elapsed + dt); timer.done = timer.elapsed < preset; } else timer.elapsed = 0; }
      else if (type === "TP") { if (power && !timer.prior) { timer.elapsed = 0; timer.active = true; } else if (timer.active) { timer.elapsed = Math.min(preset, timer.elapsed + dt); if (timer.elapsed >= preset) timer.active = false; } timer.prior = power; timer.done = timer.active; }
      else { timer.elapsed = power ? Math.min(preset, timer.elapsed + dt) : 0; timer.done = timer.elapsed >= preset; }
      timers[rung.timer.tag] = timer;
      values[`${rung.timer.tag}.DN`] = timer.done;
      values[`${rung.timer.tag}.EN`] = power;
      values[`${rung.timer.tag}.ET`] = timer.elapsed;
      power = rung.timer.output === "DN" ? timer.done : power;
    }
    if (rung.counter) {
      const counter = counters[rung.counter.tag] || { count:0, prior:false };
      if (rung.counter.resetTag && Boolean(values[rung.counter.resetTag])) counter.count = 0;
      else if (power && !counter.prior) counter.count = Math.min(Number(rung.counter.maxCount) || Number.MAX_SAFE_INTEGER, counter.count + 1);
      counter.prior = power;
      counter.done = counter.count >= Math.max(1, Number(rung.counter.preset) || 1);
      counters[rung.counter.tag] = counter;
      values[`${rung.counter.tag}.CV`] = counter.count;
      values[`${rung.counter.tag}.DN`] = counter.done;
      if (rung.counter.countTag) values[rung.counter.countTag] = counter.count;
      power = counter.done;
    }
    if (rung.scale) {
      const instruction = rung.scale, raw = Number(values[instruction.inputTag]), rawMin = Number(instruction.rawMin ?? 0), rawMax = Number(instruction.rawMax ?? 1), scaledMin = Number(instruction.scaledMin ?? 0), scaledMax = Number(instruction.scaledMax ?? 100);
      const valid = [raw, rawMin, rawMax, scaledMin, scaledMax].every(Number.isFinite) && rawMax !== rawMin;
      let scaled = 0;
      if (valid && power) {
        let fraction = (raw - rawMin) / (rawMax - rawMin);
        if (instruction.clamp !== false) fraction = Math.min(1, Math.max(0, fraction));
        scaled = scaledMin + fraction * (scaledMax - scaledMin);
      }
      if (instruction.outputTag) { values[instruction.outputTag] = scaled; outputs[instruction.outputTag] = scaled; }
    }
    if (rung.coil) { const mode = rung.coilMode || "normal", retained = Boolean(outputs[rung.coil]); outputs[rung.coil] = mode === "set" ? retained || power : mode === "reset" ? retained && !power : power; values[rung.coil] = outputs[rung.coil]; }
  }
  return { outputs, timers, counters, edges, energized, values: { ...values, ...outputs }, scanMs: dt, breakpointHit: null, breakpointSkip };
}

export function scanFBD(blocks, inputs, state = {}, outputNames = [], dt = 100, valueInputs = {}) {
  const plan = orderFbdBlocks(blocks || []);
  const outputs = { ...(state.outputs || {}) }, values = { ...inputs, ...outputs, ...valueInputs }, timers = structuredClone(state.timers || {}), counters = structuredClone(state.counters || {}), edges = structuredClone(state.edges || {}), outputSet = new Set(outputNames), errors = [...plan.errors];
  if (errors.length) return { outputs, values, timers, counters, edges, errors, energized:{}, scanMs:dt };
  for (const block of plan.blocks) {
    const tags = block.inputs || [], source = tags.map((tag) => Boolean(values[tag])), numeric = tags.map((tag) => Number(values[tag])); let value = false;
    if (block.type === "AND") value = source.length > 0 && source.every(Boolean);
    if (block.type === "OR") value = source.some(Boolean);
    if (block.type === "NOT") value = !Boolean(values[tags[0]]);
    if (block.type === "TRUE") value = true;
    if (block.type === "FALSE") value = false;
    if (["TON", "TOF", "TP"].includes(block.type)) { const preset = Math.max(1, Number(block.preset) || 1), timer = timers[block.id] || { elapsed:0, done:false, prior:false, active:false }; if (block.type === "TOF") { if (source[0]) { timer.elapsed = 0; timer.done = true; } else if (timer.done) { timer.elapsed = Math.min(preset, timer.elapsed + dt); timer.done = timer.elapsed < preset; } else timer.elapsed = 0; } else if (block.type === "TP") { if (source[0] && !timer.prior) { timer.elapsed = 0; timer.active = true; } else if (timer.active) { timer.elapsed = Math.min(preset, timer.elapsed + dt); if (timer.elapsed >= preset) timer.active = false; } timer.prior = source[0]; timer.done = timer.active; } else { timer.elapsed = source[0] ? Math.min(preset, timer.elapsed + dt) : 0; timer.done = timer.elapsed >= preset; } timers[block.id] = timer; value = timer.done; values[`${block.outputTag}.EN`] = source[0]; values[`${block.outputTag}.ET`] = timer.elapsed; }
    if (block.type === "R_TRIG" || block.type === "F_TRIG") { const prior = Boolean(edges[block.id]?.prior), current = source[0] || false; value = block.type === "R_TRIG" ? !prior && current : prior && !current; edges[block.id] = { prior:current }; }
    if (block.type === "CTU") { const counter = counters[block.id] || { count:0, prior:false }; if (source[1]) counter.count = 0; else if (source[0] && !counter.prior) counter.count = Math.min(Number(block.maxCount) || Number.MAX_SAFE_INTEGER, counter.count + 1); counter.prior = source[0]; value = counter.count >= Math.max(1, Number(block.preset) || 1); counters[block.id] = counter; if (block.outputTag) values[`${block.outputTag}.CV`] = counter.count; if (block.countTag) { values[block.countTag] = counter.count; if (outputSet.has(block.countTag)) outputs[block.countTag] = counter.count; } }
    if (["ADD", "SUB", "MUL", "DIV"].includes(block.type)) { const left = numeric[0] || 0, right = numeric[1] || 0; value = block.type === "ADD" ? left + right : block.type === "SUB" ? left - right : block.type === "MUL" ? left * right : right === 0 ? 0 : left / right; }
    if (["GT", "LT", "EQ"].includes(block.type)) value = block.type === "GT" ? numeric[0] > numeric[1] : block.type === "LT" ? numeric[0] < numeric[1] : numeric[0] === numeric[1];
    if (block.type === "SCALE") { const [raw] = numeric, rawMin = Number(block.rawMin ?? 0), rawMax = Number(block.rawMax ?? 1), scaledMin = Number(block.scaledMin ?? 0), scaledMax = Number(block.scaledMax ?? 100); if (![raw, rawMin, rawMax, scaledMin, scaledMax].every(Number.isFinite) || rawMax === rawMin) { value = 0; errors.push(`SCALE ${block.id} needs finite values and a nonzero raw range.`); } else { let fraction = (raw - rawMin) / (rawMax - rawMin); if (block.clamp !== false) fraction = Math.min(1, Math.max(0, fraction)); value = scaledMin + fraction * (scaledMax - scaledMin); } }
    if (block.outputTag) { values[block.outputTag] = value; if (outputSet.has(block.outputTag)) outputs[block.outputTag] = value; }
  }
  return { outputs, values, timers, counters, edges, errors, energized: {}, scanMs: dt };
}

export function scanSFC(model, inputs, state = {}) {
  const steps = model?.steps || [], activeStep = steps.find((step) => step.id === state.activeStep) || steps[0];
  const values = { ...inputs, ...(state.outputs || {}) }, transitions = (model?.transitions || []).filter((item) => item.from === activeStep?.id);
  const transition = transitions.find((item) => { const raw = Boolean(values[item.condition]); return item.mode === "NC" ? !raw : raw; });
  const nextStep = transition ? steps.find((step) => step.id === transition.to) : activeStep;
  const outputs = Object.fromEntries((model.outputs || []).map((name) => [name, false]));
  for (const action of nextStep?.actions || []) outputs[action] = true;
  return { outputs, values: { ...inputs, ...outputs }, activeStep: nextStep?.id || null, energized: {}, timers: state.timers || {} };
}

export function orderFbdBlocks(blocks = []) {
  const producers = new Map(), errors = [];
  for (const [index, block] of blocks.entries()) {
    if (!block.outputTag) continue;
    if (producers.has(block.outputTag)) errors.push(`FBD output ${block.outputTag} is produced by more than one block.`);
    else producers.set(block.outputTag, index);
  }
  if (errors.length) return { blocks:[], errors };
  const outgoing = blocks.map(() => []), indegree = blocks.map(() => 0);
  for (const [index, block] of blocks.entries()) {
    const dependencies = new Set((block.inputs || []).map((tag) => producers.get(tag)).filter((producer) => producer !== undefined && producer !== index));
    if ((block.inputs || []).includes(block.outputTag) && block.outputTag) dependencies.add(index);
    for (const dependency of dependencies) { outgoing[dependency].push(index); indegree[index] += 1; }
  }
  const ready = indegree.map((degree, index) => degree === 0 ? index : -1).filter((index) => index >= 0), ordered = [];
  while (ready.length) {
    const index = ready.shift(); ordered.push(blocks[index]);
    for (const dependent of outgoing[index]) { indegree[dependent] -= 1; if (indegree[dependent] === 0) { ready.push(dependent); ready.sort((a, b) => a - b); } }
  }
  if (ordered.length !== blocks.length) return { blocks:[], errors:["FBD block dependencies contain a cycle."] };
  return { blocks:ordered, errors:[] };
}

export function runExampleChecks(example) {
  return example.testCases.map((testCase) => {
    let state = {}, result;
    for (const step of testCase.sequence || [{ inputs:testCase.inputs, dt:testCase.dt }]) {
      const inputs = { ...example.initialState, ...(step.inputs || step) }, numericInputs = { ...(testCase.numericInputs || {}), ...(step.numericInputs || {}) }, dt = step.dt || testCase.dt || (example.processes?.length ? 1000 : 100);
      if (example.editorType === "FBD") result = scanFBD(example.fbdBlocks, inputs, state, example.io.outputs, dt, numericInputs);
      else result = scan(example.logic, { ...inputs, ...numericInputs }, state, dt);
      if (example.processes?.length) {
        const processStep = stepProcesses(example.processes, { ...result.values, ...numericInputs }, state.processStates || {}, dt);
        result = { ...result, processValues:processStep.values, processStates:processStep.states, values:{ ...result.values, ...numericInputs, ...processStep.values } };
      } else result.values = { ...result.values, ...numericInputs };
      state = result;
    }
    const resultTag = example.logic.outputTag || example.logic.rungs[0].coil;
    const actual = example.processes?.length ? result?.processValues?.[resultTag] : example.editorType === "FBD" || example.logic.rungs.some((rung) => rung.scale) ? result?.outputs[resultTag] : Boolean(result?.outputs[resultTag]);
    const pass = typeof testCase.expected === "number" ? Math.abs(Number(actual) - testCase.expected) < 1e-6 : actual === testCase.expected;
    return { name: testCase.name, sequence:testCase.sequence || null, pass, expected: testCase.expected, actual };
  });
}

export function makeProjectFromExample(example) {
  const project = {
    id: crypto.randomUUID(), name: example.title.en, language: "en", updatedAt: Date.now(),
    tags: structuredClone(example.tags), io: structuredClone(example.io),
    initialState: { ...example.initialState }, rungs: structuredClone(example.logic.rungs),
    ...(example.editorType ? { editorType:example.editorType } : {}),
    ...(example.fbdBlocks ? { fbdBlocks:structuredClone(example.fbdBlocks) } : {}),
    ...(example.processes ? { processes:structuredClone(example.processes) } : {}),
    exampleId: example.id,
  };
  project.electrical = createExampleElectricalDiagram(project.tags, project.io, project.initialState);
  return project;
}

export function defaultProject() {
  return {
    id: crypto.randomUUID(), name: "My first program", language: "en", updatedAt: Date.now(),
    task: { name:"Main", mode:"cyclic", cycleMs:100 },
    tags: [{ name: "Start", type: "BOOL", address: "I0.0" }, { name: "Stop", type: "BOOL", address: "I0.1" }, { name: "Sensor", type: "BOOL", address: "I0.2" }, { name: "Motor", type: "BOOL", address: "Q0.0" }, { name: "Lamp", type: "BOOL", address: "Q0.1" }],
    io: { inputs: ["Start", "Stop", "Sensor"], outputs: ["Motor", "Lamp"] }, initialState: { Start: false, Stop: false, Sensor: false },
    rungs: [
      { id: crypto.randomUUID(), comment: "Motor enable", branches: [[{ tag: "Start", mode: "NO" }, { tag: "Stop", mode: "NC" }]], coil: "Motor" },
      { id: crypto.randomUUID(), comment: "Sensor on-delay", branches: [[{ tag: "Sensor", mode: "NO" }]], timer: { tag: "T0.0", preset: 1500, output: "DN" }, coil: "Lamp" },
    ],
  };
}

export function getTaskCycleMs(project) {
  const value = Number(project?.task?.cycleMs);
  return Number.isInteger(value) && value >= 1 && value <= 60000 ? value : 100;
}

