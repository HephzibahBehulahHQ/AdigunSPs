import assert from "node:assert/strict";
import { emptyProject, scan, scanFBD } from "../src/engine.js";
import { connectFbdPorts, validateFbdBlocks } from "../src/fbd-validation.js";
import { validateProject } from "../src/validation.js";

const names = ["A", "B", "C", "Y"];
const tags = names.map((name) => ({ name, type:"BOOL", role:name === "Y" ? "output" : "input" }));
const fresh = emptyProject();
assert.deepEqual(fresh.rungs, [], "new projects start with an empty ladder");
assert.deepEqual(fresh.tags, [], "new projects do not inherit demo tags");
for (const [type, expected] of [["AND",(a,b)=>a&&b],["OR",(a,b)=>a||b],["NAND",(a,b)=>!(a&&b)],["NOR",(a,b)=>!(a||b)],["XOR",(a,b)=>a!==b],["XNOR",(a,b)=>a===b]]) {
  for (const a of [false,true]) for (const b of [false,true]) {
    const blocks = [{ id:"gate", type, inputs:["A","B"], outputTag:"Y" }];
    const result = scanFBD(blocks, { A:a, B:b }, {}, ["Y"]);
    assert.equal(result.outputs.Y, expected(a,b), `${type}(${a},${b})`);
  }
}

for (const type of ["AND", "OR"]) {
  const blocks = [{ id:"three-input", type, inputs:["A","B","C"], outputTag:"Y" }];
  assert.deepEqual(validateFbdBlocks({ tags, io:{ inputs:["A","B","C"], outputs:["Y"] }, fbdBlocks:blocks }), [], `${type} accepts three Boolean inputs`);
  const values = scanFBD(blocks, { A:true, B:false, C:true }, {}, ["Y"]).outputs;
  assert.equal(values.Y, type === "AND" ? false : true, `${type} simulates all three wired inputs`);
}
const inputs = ["A", "B", "C"].map((name) => ({ id:name, type:"TRUE", inputs:[], outputTag:name }));
const connected = connectFbdPorts([...inputs, { id:"gate", type:"AND", inputs:["A","B"], outputTag:"Y" }], 2, 3, 2);
assert.equal(connected.ok, true, "a third AND input can be wired to a real output port");
assert.equal(connected.blocks[3].inputs[2], "C");
console.log("PASS: AND/OR/NAND/NOR/XOR/XNOR truth tables and three-input gates, validation, wiring, and scan simulation");

const timerProject = { rungs:[{ id:"rto", branches:[[{ tag:"Enable", mode:"NO" }]], timer:{ type:"RTO", tag:"T0", preset:100 }, coil:"Q0.0" }] };
let timerState = scan(timerProject,{Enable:true},{},50); assert.equal(timerState.timers.T0.elapsed,50);
timerState = scan(timerProject,{Enable:false},timerState,50); assert.equal(timerState.timers.T0.elapsed,50,"RTO retains elapsed time while disabled");
timerState = scan(timerProject,{Enable:true},timerState,50); assert.equal(timerState.values["T0.DN"],true,"RTO completes at its preset");
const resetTimerProject={rungs:[{id:"rto",branches:[[{tag:"Enable",mode:"NO"}]],timer:{type:"RTO",tag:"T0",preset:100,resetTag:"Reset"},coil:"Q0.0"}]};
timerState=scan(resetTimerProject,{Enable:true,Reset:false},{},50); timerState=scan(resetTimerProject,{Enable:false,Reset:true},timerState,50); assert.equal(timerState.timers.T0.elapsed,0,"LD reset input clears retentive elapsed time");
const counterProject = { rungs:[{ id:"ctd", branches:[[{ tag:"Pulse", mode:"NO" }]], counter:{ type:"CTD", tag:"C0", preset:2 }, coil:"Q0.0" }] };
let counterState = scan(counterProject,{Pulse:true}); counterState = scan(counterProject,{Pulse:false},counterState);
counterState = scan(counterProject,{Pulse:true},counterState); assert.equal(counterState.counters.C0.count,0); assert.equal(counterState.outputs["Q0.0"],true,"CTD output goes true at zero");
const resetProject={rungs:[{id:"count",branches:[[{tag:"Pulse",mode:"NO"}]],counter:{type:"CTU",tag:"C1",preset:2}},{id:"reset",branches:[[{tag:"Reset",mode:"NO"}]],res:{counterTag:"C1"},coil:"Q0.0"}]};
let resetState=scan(resetProject,{Pulse:true,Reset:false}); resetState=scan(resetProject,{Pulse:false,Reset:false},resetState); resetState=scan(resetProject,{Pulse:true,Reset:false},resetState); assert.equal(resetState.counters.C1.count,2);
resetState=scan(resetProject,{Pulse:false,Reset:true},resetState); assert.equal(resetState.counters.C1.count,0,"RES resets a CTU when its rung is energized");
const mcrProject={tags:[{name:"Enable",type:"BOOL",role:"input"},{name:"Command",type:"BOOL",role:"input"},{name:"MCR",type:"BOOL",role:"output"},{name:"Motor",type:"BOOL",role:"output"},{name:"MCR_END",type:"BOOL",role:"output"}],io:{inputs:["Enable","Command"],outputs:["MCR","Motor","MCR_END"]},rungs:[{id:"mcr-start",branches:[[{tag:"Enable",mode:"NO"}]],coil:"MCR",mcr:"start"},{id:"inside",branches:[[{tag:"Command",mode:"NO"}]],coil:"Motor"},{id:"mcr-end",branches:[[]],coil:"MCR_END",mcr:"end"}]};
assert.equal(validateProject(mcrProject).some(issue=>issue.level==="error"),false,"paired MCR section validates");
let mcrState=scan(mcrProject,{Enable:false,Command:true}); assert.equal(mcrState.outputs.Motor,false,"disabled MCR section de-energizes normal coils");
mcrState=scan(mcrProject,{Enable:true,Command:true},mcrState); assert.equal(mcrState.outputs.Motor,true,"enabled MCR section allows its ladder rung");
assert.ok(validateProject({...mcrProject,rungs:mcrProject.rungs.slice(0,2)}).some(issue=>issue.code==="mcr-unclosed"),"unclosed MCR section is rejected");
let fbdState = scanFBD([{id:"rto",type:"RTO",inputs:["Enable","Reset"],outputTag:"Done",preset:100}],{Enable:true,Reset:false},{},[],50);
fbdState = scanFBD([{id:"rto",type:"RTO",inputs:["Enable","Reset"],outputTag:"Done",preset:100}],{Enable:false,Reset:false},fbdState,[],50); assert.equal(fbdState.timers.rto.elapsed,50);
fbdState = scanFBD([{id:"rto",type:"RTO",inputs:["Enable","Reset"],outputTag:"Done",preset:100}],{Enable:false,Reset:true},fbdState,[],50); assert.equal(fbdState.timers.rto.elapsed,0,"FBD reset input clears retentive elapsed time");
const ctdBlock = [{id:"ctd",type:"CTD",inputs:["Pulse","Reset"],outputTag:"Done",preset:1}];
let ctdState = scanFBD(ctdBlock,{Pulse:false,Reset:false},{},[],50); ctdState = scanFBD(ctdBlock,{Pulse:true,Reset:false},ctdState,[],50); assert.equal(ctdState.values.Done,true,"FBD CTD reaches zero after a rising edge");
console.log("PASS: retentive RTO, CTD, RES, and MCR LD/FBD simulation and validation");
