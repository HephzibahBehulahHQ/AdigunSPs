import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { planAdigunBotBuild, adigunBotCanSave } from "../src/adigun-bot-builder.js";
import { scan, scanFBD } from "../src/engine.js";
import { validateFbdBlocks } from "../src/fbd-validation.js";
import { simulateElectricalDiagram, validateElectricalDiagram } from "../src/electrical.js";
import { adigunBotLadderSketch, verifyAdigunBotDraft } from "../src/adigun-bot-verifier.js";
import { applyAdigunBotPlanAtomically, createAdigunBotCanvasPreview, resolveAdigunBotCanvasPreview } from "../src/adigun-bot-preview.js";

const gates = await planAdigunBotBuild("Build a ladder with two switches, an AND gate, a NAND gate, a lamp, and a motor.");
assert.equal(gates.ok,true); assert.equal(gates.project.fbdBlocks.length,2); assert.equal(gates.project.editorType,"FBD");
assert.deepEqual(validateFbdBlocks(gates.project),[]);
const gateScan=scanFBD(gates.project.fbdBlocks,{Switch1:true,Switch2:true},{},gates.project.io.outputs);
assert.equal(gateScan.outputs.Motor,true); assert.equal(gateScan.outputs.Lamp,false);
assert.equal(validateElectricalDiagram(gates.project.electrical,gates.project.tags).some(issue=>issue.level==="error"),false,"generated schematic devices and wires validate");
assert.equal(Object.values(simulateElectricalDiagram(gates.project.electrical,{Switch1:true,Switch2:true},gateScan.outputs).energized).some(Boolean),true,"PLC output energizes the connected contactor and three-phase motor model");
const lampScan=scanFBD(gates.project.fbdBlocks,{Switch1:false,Switch2:false},{},gates.project.io.outputs);
assert.equal(Object.values(simulateElectricalDiagram(gates.project.electrical,{Switch1:false,Switch2:false},lampScan.outputs).energized).some(Boolean),true,"NAND output energizes its connected lamp model");
assert.match(gates.plan[0],/Switch1, Switch2/);

const timer=await planAdigunBotBuild("Make a timer that turns on a lamp after 5 seconds when the button is pressed.");
assert.equal(timer.ok,true); assert.equal(timer.project.rungs[0].timer.preset,5000);
let state=scan(timer.project,{Start:true},{},2500); assert.equal(state.outputs.Lamp,false);
state=scan(timer.project,{Start:true},state,2500); assert.equal(state.outputs.Lamp,true);
assert.equal(validateElectricalDiagram(timer.project.electrical,timer.project.tags).some(issue=>issue.level==="error"),false); assert.equal(Object.values(simulateElectricalDiagram(timer.project.electrical,{Start:true},state.outputs).energized).some(Boolean),true,"timer output drives its wired lamp model");

const motor=await planAdigunBotBuild("Add a start/stop motor circuit"); assert.equal(motor.ok,true);
let motorState=scan(motor.project,{Start:true,Stop:false}); assert.equal(motorState.outputs.Motor,true);
motorState=scan(motor.project,{Start:false,Stop:false},motorState); assert.equal(motorState.outputs.Motor,true);
motorState=scan(motor.project,{Start:false,Stop:true},motorState); assert.equal(motorState.outputs.Motor,false);
assert.equal(validateElectricalDiagram(motor.project.electrical,motor.project.tags).some(issue=>issue.level==="error"),false); const running=scan(motor.project,{Start:true,Stop:false}); assert.equal(Object.values(simulateElectricalDiagram(motor.project.electrical,{Start:true},running.outputs).energized).some(Boolean),true,"ladder motor output energizes its wired contactor and motor");

for (const draft of [gates,timer,motor]) {
  const report=verifyAdigunBotDraft(draft);
  assert.equal(report.passed,true,`${draft.intent} plan simulation passes`);
  assert.ok(report.cases.length>0,`${draft.intent} reports test cases`);
  assert.ok(report.cases.every((item)=>item.passed),`${draft.intent} expected outputs match simulation`);
  assert.ok(Array.isArray(report.warnings),`${draft.intent} surfaces non-blocking project warnings`);
}
assert.match(adigunBotLadderSketch(motor.project),/Start\/stop motor seal-in/);
assert.equal(verifyAdigunBotDraft({ok:true,project:{editorType:"LD",rungs:[],electrical:{components:[],wires:[]}}}).passed,false,"unrecognized draft types cannot be marked verified");
const preview=createAdigunBotCanvasPreview({name:"Current",rungs:[{coil:"Existing"}]},{name:"Draft",rungs:[{coil:"Generated"}]});
assert.equal(resolveAdigunBotCanvasPreview(preview,"discard").project.rungs[0].coil,"Existing","discard preview restores the exact original project");
assert.throws(()=>resolveAdigunBotCanvasPreview(preview,"commit"),/no longer active/,"a discarded plan cannot be committed later");
const commitPreview=createAdigunBotCanvasPreview({name:"Current",rungs:[]},{name:"Draft",rungs:[{coil:"Generated"}]});
assert.equal(resolveAdigunBotCanvasPreview(commitPreview,"commit").project.rungs[0].coil,"Generated","commit selects the generated project only after approval");
const original={name:"Current",rungs:[{coil:"Existing"}]}, failed=applyAdigunBotPlanAtomically(original,[candidate=>candidate.rungs.push({coil:"Partial"}),()=>{throw new Error("injected failure");}]);
assert.equal(failed.ok,false); assert.deepEqual(failed.project,original,"failed plan execution leaves the original project unchanged");

assert.equal(adigunBotCanSave("guest"),false); assert.equal(adigunBotCanSave("guest-expired"),false); assert.equal(adigunBotCanSave("member"),true);
assert.equal((await planAdigunBotBuild("Create an unsupported traffic light sequence")).ok,false);
const named=await planAdigunBotBuild("Build logic with NAND output to buzzer and NOR output to lamp."); assert.equal(named.project.fbdBlocks.find((block)=>block.type==="NAND").outputTag,"Buzzer"); assert.equal(named.project.fbdBlocks.find((block)=>block.type==="NOR").outputTag,"Lamp");
const existing={editorType:"LD",name:"Existing",tags:[{name:"Start",type:"BOOL",role:"input",address:"I0.0"},{name:"Run",type:"BOOL",role:"output",address:"Q0.0"}],io:{inputs:["Start"],outputs:["Run"]},initialState:{Start:false,Run:false},rungs:[{id:"r1",comment:"Latch",branches:[[{tag:"Start",mode:"NO"}]],coil:"Run"}],fbdBlocks:[],electrical:{components:[],wires:[],inputStates:{}}};
const rename=await planAdigunBotBuild("Rename tag Run to PumpMotor everywhere",{project:existing});
assert.equal(rename.ok,true,rename.reason); assert.equal(rename.intent,"project-edit"); assert.equal(rename.project.rungs[0].coil,"PumpMotor"); assert.equal(rename.project.io.outputs[0],"PumpMotor");
const renameVerification=verifyAdigunBotDraft(rename); assert.equal(renameVerification.passed,true,renameVerification.errors.join("; ")); assert.equal(renameVerification.cases.length,3);
const renameInput=await planAdigunBotBuild("Rename tag Start to StartButton",{project:existing});
assert.equal(renameInput.project.rungs[0].branches[0][0].tag,"StartButton"); assert.equal(verifyAdigunBotDraft(renameInput).passed,true,"renamed input keeps representative ladder behavior");
const deleteRung=await planAdigunBotBuild("Remove rung 1",{project:existing});
assert.equal(deleteRung.ok,true,deleteRung.reason); assert.equal(deleteRung.project.rungs.length,0); assert.equal(existing.rungs.length,1,"planning deletion leaves the open project untouched");
assert.equal(verifyAdigunBotDraft(deleteRung).passed,true,"explicitly requested rung deletion has a valid post-edit simulation preview");
assert.equal((await planAdigunBotBuild("Delete rung 9",{project:existing})).ok,false,"missing rungs are not silently ignored");
const ui=readFileSync("src/app.js","utf8"), guide=readFileSync("docs/BOT.md","utf8"), help=readFileSync("docs/HELP.md","utf8");
for(const id of ["botPreviewOnCanvas","botPreviewCommit","botPreviewDiscard","botImportDraft","botSaveLocal","botSaveCloud","botEditDraft","botDiscardDraft","adigunAiVoice","verifyAdigunBotDraft","adigunBotLadderSketch","createAdigunBotCanvasPreview","resolveAdigunBotCanvasPreview","executeAdigunBotTools"]) assert.ok(ui.includes(id),`assistant UI wires ${id}`);
assert.match(guide,/guest sessions can generate and import/i); assert.match(help,/Using Adigun BOT/);
console.log("PASS: Adigun BOT gate, timer, and motor prompt plans produce validated project drafts and expected simulation; guest save denied");
