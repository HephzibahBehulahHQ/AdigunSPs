import assert from "node:assert/strict";
import { executeProgramUnit, executeProgramTasks } from "../src/program-unit.js";
import { compileStructuredText } from "../src/structured-text.js";

const image = { Start: true };
const ladder = { language: "LD", outputs: ["Ready"], rungs: [{ id: "shared", contacts: [{ tag: "Start" }], timer: { tag: "T", preset: 200, output: "DN" }, coil: "Ready" }] };
const first = executeProgramUnit(ladder, image);
assert.equal(first.writes.Ready, false);
assert.equal(executeProgramUnit(ladder, image, first.state).writes.Ready, true);
assert.equal(executeProgramUnit(ladder, image).writes.Ready, false);
const ready = { ...image, Ready: true };
const fbd = executeProgramUnit({ language: "FBD", outputs: ["Go"], blocks: [{ id: "shared", type: "AND", inputs: ["Ready"], outputTag: "Go" }] }, ready);
assert.deepEqual(fbd.writes, { Go: true });
const st = executeProgramUnit({ language: "ST", outputs: ["Permit"], compiled: compileStructuredText("Permit := Go;", ["Go", "Permit"]) }, { ...ready, ...fbd.writes });
assert.deepEqual(st.writes, { Permit: true });
const sfc = executeProgramUnit({ language: "SFC", outputs: ["Motor"], chart: { steps: [{ id: "idle" }, { id: "run", actions: ["Motor"] }], transitions: [{ from: "idle", to: "run", condition: "Permit" }] } }, st.writes);
assert.deepEqual(sfc.writes, { Motor: true });
assert.equal(sfc.state.activeStep, "run");
assert.deepEqual(image, { Start: true });
const invalid = executeProgramUnit({ language: "ST", outputs: ["Motor"], compiled: compileStructuredText("Motor := 1 / 0;", ["Motor"]) }, { Motor: true });
assert.deepEqual(invalid.writes, {});
assert.match(invalid.errors.join(" "), /Division by zero/);
console.log("PASS: four-language program hand-off, isolated timer state and fault rollback");

const task = [{ name: "Fast", cycleMs: 50, programs: ["Ladder"] }];
const units = [{ ...ladder, name: "Ladder" }];
const tick = executeProgramTasks(units, task, image, {}, 100);
assert.equal(tick.image.Ready, false);
assert.equal(tick.state.units.ladder.timers.T.elapsed, 100);
assert.equal(executeProgramTasks(units, task, image, tick.state, 100).image.Ready, true);

const { normalizeImportedProject } = await import("../src/project-import.js");
const project = { name: "Mixed", rungs: [], io: { inputs: ["Start"], outputs: ["Ready", "Permit"] }, programUnits: [
  { ...ladder, name: "Ladder" },
  { name: "Check", language: "ST", outputs: ["Permit"], source: "Permit := Ready;" }
], tasks: [{name:"Cyclic",cycleMs:100,programs:["Ladder","Check"]}] };
assert.deepEqual(normalizeImportedProject(JSON.parse(JSON.stringify(project))).programUnits.map(unit => unit.name), ["Ladder", "Check"]);
assert.throws(() => normalizeImportedProject({ ...project, tasks: [{name:"Cyclic",cycleMs:100,programs:["Unknown"]}] }), /not declared/);

const counter = {
  name: "Counter", language: "ST", outputs: ["Result"], sharedNames: ["Start", "Result"],
  types: { CounterValue: "INT", Result: "INT" },
  compiled: compileStructuredText("CounterValue := CounterValue + 1; Result := CounterValue;", ["CounterValue", "Result"])
};
const seeded = { Start: true, CounterValue: 10, Result: 0 };
const counted = executeProgramTasks([counter], undefined, seeded);
assert.equal(counted.image.Result, 11);
assert.equal(counted.image.CounterValue, 10);
assert.equal(executeProgramTasks([counter], undefined, seeded, counted.state).image.Result, 12);
assert.equal(executeProgramTasks([counter], undefined, seeded).image.Result, 11);

const { cyclicTaskEditor } = await import("../src/cyclic-task-ui.js");
const mixedTaskView = cyclicTaskEditor(project);
assert.deepEqual(mixedTaskView.programNames, ["Ladder", "Check"]);
assert.match(mixedTaskView.html, /id="cyclicTaskForm"/);

const { traceSectionValues } = await import("../src/trace-utils.js");
const restoredTick = JSON.parse(JSON.stringify(tick.state));
assert.deepEqual(executeProgramTasks(units, task, image, restoredTick), executeProgramTasks(units, task, image, tick.state));
assert.equal(traceSectionValues({ mixedState: restoredTick }, "mixedState")["Unit ladder"].timers.T.elapsed, 100);

const { renameProgramUnitTag, programUnitUsesTag } = await import("../src/program-unit.js");
const editableUnits = normalizeImportedProject(project).programUnits;
for (const unit of editableUnits) {
  assert.equal(programUnitUsesTag(unit, "Ready"), true);
  renameProgramUnitTag(unit, "Ready", "Available");
  assert.equal(programUnitUsesTag(unit, "Ready"), false);
  assert.equal(programUnitUsesTag(unit, "Available"), true);
}

const { validateMixedProgramUnits } = await import("../src/validation.js");
const badUnitProject = normalizeImportedProject(project);
badUnitProject.programUnits[1].source = "Permit := Unknown;";
assert.match(validateMixedProgramUnits(badUnitProject)[0].message, /Check.*Unknown/);
badUnitProject.programUnits[1].source = "Permit := Ready;";
assert.deepEqual(validateMixedProgramUnits(badUnitProject), []);

const { runScenario } = await import("../src/scenarios.js");
const failedScenario = runScenario({frames:[{expectedOutputs:{Ready:false}}]}, {...project,tags:[{name:"Ready",type:"BOOL"}]}, () => { throw new Error("Invalid unit"); });
assert.equal(failedScenario.results[0].pass, false);
assert.equal(failedScenario.results[0].error, "Invalid unit");
