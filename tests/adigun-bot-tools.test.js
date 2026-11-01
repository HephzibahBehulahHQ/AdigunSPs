import assert from "node:assert/strict";
import { emptyProject } from "../src/engine.js";
import { executeAdigunBotTools } from "../src/adigun-bot-tools.js";

const base=emptyProject();
const placed=await executeAdigunBotTools(base,[
  {name:"place_component",arguments:{type:"pushbuttonNO",position:{x:101,y:99},properties:{label:"Start"}}},
  {name:"place_component",arguments:{type:"pushbuttonNC",position:{x:201,y:99}}},
]);
assert.equal(placed.ok,true); assert.equal(placed.project.electrical.components[0].reference,"S1");
assert.deepEqual([placed.project.electrical.components[0].x,placed.project.electrical.components[0].y],[100,100],"component positions snap to the electrical grid");
const incompleteGate={...emptyProject(),editorType:"FBD",tags:[{name:"A",type:"BOOL",role:"input",address:""},{name:"Run",type:"BOOL",role:"output",address:""}],io:{inputs:["A"],outputs:["Run"]},initialState:{A:false,Run:false},fbdBlocks:[{id:"and-1",type:"AND",inputs:["A"],outputTag:"Run"}]};
const completedGate=await executeAdigunBotTools(incompleteGate,[{name:"add_fbd_input",arguments:{blockId:"and-1"}}]);
assert.equal(completedGate.ok,true,completedGate.error); assert.equal(completedGate.project.fbdBlocks[0].inputs.length,2); assert.equal(completedGate.project.io.inputs.length,2); assert.equal(completedGate.project.initialState.Switch2,false);
const staleIndexProject={...incompleteGate,tags:[...incompleteGate.tags,{name:"Other",type:"BOOL",role:"internal",address:""}],fbdBlocks:[{id:"or-1",type:"OR",inputs:["A","A"],outputTag:"Other"},...incompleteGate.fbdBlocks]};
const byStableId=await executeAdigunBotTools(staleIndexProject,[{name:"add_fbd_input",arguments:{blockId:"and-1",blockIndex:0}}]);
assert.equal(byStableId.ok,true,byStableId.error); assert.deepEqual(byStableId.project.fbdBlocks[0].inputs,["A","A"]); assert.equal(byStableId.project.fbdBlocks[1].inputs.length,2,"stable block ID takes precedence over a stale canvas index");
const [start,stop]=placed.project.electrical.components;
const edited=await executeAdigunBotTools(placed.project,[{name:"set_property",arguments:{componentId:start.id,key:"normallyClosed",value:true}}]);
assert.equal(edited.ok,true); assert.equal(edited.project.electrical.components[0].normallyClosed,true);
const connected=await executeAdigunBotTools(placed.project,[{name:"connect",arguments:{source:start.id,sourcePort:"14",target:stop.reference,targetPort:"21"}}]);
assert.equal(connected.ok,true); assert.equal(connected.project.electrical.wires.length,1);
const junction=await executeAdigunBotTools(connected.project,[{name:"create_junction",arguments:{wireId:connected.project.electrical.wires[0].id,position:{x:160,y:100}}}]);
assert.equal(junction.ok,true); assert.equal(junction.project.electrical.components.at(-1).type,"junction"); assert.equal(junction.project.electrical.wires.length,2);

const rungProject=emptyProject(); rungProject.tags=[{name:"Start",type:"BOOL",role:"input",address:"I0.0"},{name:"Run",type:"BOOL",role:"output",address:"Q0.0"}]; rungProject.io={inputs:["Start"],outputs:["Run"]}; rungProject.initialState={Start:false,Run:false}; rungProject.electrical.inputStates={Run:true}; rungProject.alarms=[{tag:"Run"}]; rungProject.rungs=[{id:"r1",comment:"Old",branches:[[{tag:"Start",mode:"NO"}]],coil:"Run"}];
const annotate=await executeAdigunBotTools(rungProject,[{name:"add_comment",arguments:{rungId:"r1",text:"Enable"}},{name:"add_label",arguments:{rungId:"r1",text:"Run logic"}},{name:"rename_tag",arguments:{oldName:"Run",newName:"Motor"}}]);
assert.equal(annotate.ok,true); assert.equal(annotate.project.rungs[0].comment,"Enable"); assert.equal(annotate.project.rungs[0].label,"Run logic"); assert.equal(annotate.project.rungs[0].coil,"Motor"); assert.equal(annotate.project.alarms[0].tag,"Motor"); assert.equal(annotate.project.electrical.inputStates.Motor,true);
const simulated=await executeAdigunBotTools(annotate.project,[{name:"simulate",arguments:{inputs:{Start:true}}}]);
assert.equal(simulated.ok,true); assert.equal(simulated.results[0].result.outputs.Motor,true);
const snapshot=await executeAdigunBotTools(annotate.project,[{name:"snapshot"}]);
const restored=await executeAdigunBotTools(base,[{name:"restore",arguments:{project:snapshot.results[0].result}}]);
assert.equal(restored.ok,true); assert.equal(restored.project.rungs[0].coil,"Motor");
assert.match((await executeAdigunBotTools(restored.project,[{name:"export_project",arguments:{format:"json"}}])).results[0].result,/"Motor"/);
const ladder=emptyProject(); ladder.tags=[{name:"Start",type:"BOOL",role:"input",address:"I0.0"},{name:"Stop",type:"BOOL",role:"input",address:"I0.1"},{name:"Motor",type:"BOOL",role:"output",address:"Q0.0"}]; ladder.io={inputs:["Start","Stop"],outputs:["Motor"]}; ladder.initialState={Start:false,Stop:false};
const ladderPlan=await executeAdigunBotTools(ladder,[
  {name:"create_rung",arguments:{rungId:"r2",comment:"Seal-in"}},
  {name:"create_branch",arguments:{rungId:"r2"}},
  {name:"add_contact",arguments:{rungId:"r2",branchIndex:0,tag:"Start",mode:"NO"}},
  {name:"add_contact",arguments:{rungId:"r2",branchIndex:0,tag:"Stop",mode:"NC"}},
  {name:"add_contact",arguments:{rungId:"r2",branchIndex:1,tag:"Motor",mode:"NO"}},
  {name:"add_contact",arguments:{rungId:"r2",branchIndex:1,tag:"Stop",mode:"NC"}},
  {name:"set_property",arguments:{rungId:"r2",key:"coil",value:"Motor"}},
]);
assert.equal(ladderPlan.ok,true,ladderPlan.error); assert.equal(ladderPlan.project.rungs[0].branches.length,2);
let ladderSim=(await executeAdigunBotTools(ladderPlan.project,[{name:"simulate",arguments:{inputs:{Start:true,Stop:false}}}])).results[0].result;
assert.equal(ladderSim.outputs.Motor,true);
ladderSim=(await executeAdigunBotTools(ladderPlan.project,[{name:"simulate",arguments:{inputs:{Start:false,Stop:false},state:{outputs:ladderSim.outputs}}}])).results[0].result;
assert.equal(ladderSim.outputs.Motor,true,"generated seal-in branch holds output after start release");

const noConfirm=await executeAdigunBotTools(connected.project,[{name:"delete",arguments:{id:start.id}}]);
assert.equal(noConfirm.ok,false); assert.equal(noConfirm.project.electrical.components.length,2,"unconfirmed deletion rolls back");
const deleted=await executeAdigunBotTools(connected.project,[{name:"delete",arguments:{id:start.id,confirmed:true}}]);
assert.equal(deleted.ok,true); assert.equal(deleted.project.electrical.components.length,1); assert.equal(deleted.project.electrical.wires.length,0);
const rollback=await executeAdigunBotTools(base,[{name:"place_component",arguments:{type:"pilotLamp"}},{name:"set_property",arguments:{componentId:"missing",key:"closed",value:true}}]);
assert.equal(rollback.ok,false); assert.equal(rollback.project.electrical.components.length,0,"a later failing tool restores the original project snapshot");
let localSaves=0, cloudSaves=0;
const guestSave=await executeAdigunBotTools(base,[{name:"save_local"}],{accountAccess:"guest",saveLocal:()=>localSaves++});
assert.equal(guestSave.ok,false); assert.equal(localSaves,0,"guest local saving is denied");
const memberSave=await executeAdigunBotTools(base,[{name:"save_local"}],{accountAccess:"member",saveLocal:()=>{localSaves++;}});
assert.equal(memberSave.ok,true); assert.equal(localSaves,1);
const memberCloud=await executeAdigunBotTools(base,[{name:"save_cloud"}],{accountAccess:"member",saveCloud:()=>{cloudSaves++;}});
assert.equal(memberCloud.ok,true); assert.equal(cloudSaves,1);
const cloudCountBeforeGuest=cloudSaves;
const guestCloud=await executeAdigunBotTools(base,[{name:"save_cloud"}],{accountAccess:"guest",saveCloud:()=>cloudSaves++});
assert.equal(guestCloud.ok,false); assert.equal(cloudSaves,cloudCountBeforeGuest,"guest cloud saving is denied");
assert.equal((await executeAdigunBotTools(base,[{name:"ask_user",arguments:{question:"Which input should be used?"}}])).results[0].result.needsUserInput,true);
assert.equal((await executeAdigunBotTools(base,[{name:"preview_plan",arguments:{plan:["Create a rung"]}}])).results[0].result.requiresApproval,true);
console.log("PASS: Adigun BOT project tools cover component placement, wiring, edits, simulation, snapshots, rollback, confirmation, and member-only saves");
