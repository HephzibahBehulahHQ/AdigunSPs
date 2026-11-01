import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyzeAdigunCopilot, nextAdigunCopilotSuggestion, dismissAdigunCopilotSuggestion } from "../src/adigun-bot-copilot.js";
import { planAdigunBotCopilotFix } from "../src/adigun-bot-builder.js";
import { verifyAdigunBotDraft } from "../src/adigun-bot-verifier.js";
import { createAdigunBotCanvasPreview, resolveAdigunBotCanvasPreview } from "../src/adigun-bot-preview.js";
import { connectElectricalTerminals, createElectricalComponent } from "../src/electrical.js";
import { emptyProject, scanFBD } from "../src/engine.js";

const gate={...emptyProject(),editorType:"FBD",tags:[{name:"A",type:"BOOL",role:"input",address:""},{name:"Run",type:"BOOL",role:"output",address:""}],io:{inputs:["A"],outputs:["Run"]},initialState:{A:false,Run:false},fbdBlocks:[{id:"and-1",type:"AND",inputs:["A"],outputTag:"Run"}]};
const incomplete=analyzeAdigunCopilot({project:gate,language:"en"});
assert.equal(incomplete[0].type,"missing-fbd-input");assert.equal(incomplete[0].action.type,"add-fbd-input");

const ambiguous={...emptyProject(),rungs:[],fbdBlocks:[],electrical:{components:[createElectricalComponent("pushbuttonNO",1)],wires:[]}};
assert.ok(analyzeAdigunCopilot({project:ambiguous}).some((item)=>item.type==="ambiguous-goal"));
assert.ok(!analyzeAdigunCopilot({project:ambiguous,goal:"motor controls"}).some((item)=>item.type==="ambiguous-goal"),"session goal removes the repeated goal question");
const unusedTimer={...emptyProject(),editorType:"FBD",tags:[{name:"Start",type:"BOOL",role:"input",address:""},{name:"Done",type:"BOOL",role:"internal",address:""}],io:{inputs:["Start"],outputs:[]},fbdBlocks:[{id:"timer-1",type:"TON",inputs:["Start"],outputTag:"Done",preset:1000}]};
assert.ok(analyzeAdigunCopilot({project:unusedTimer}).some((item)=>item.type==="unused-timer"));
assert.ok(!analyzeAdigunCopilot({project:{...unusedTimer,io:{inputs:["Start"],outputs:["Done"]}}}).some((item)=>item.type==="unused-timer"),"timer output assigned to a project output is connected");
const lamp=createElectricalComponent("pilotLamp",1),relay=createElectricalComponent("relayCoil",1),wires=[];
for(const [a,ap,b,bp] of [[lamp,"X1",relay,"A1"],[lamp,"X2",relay,"A2"]]){const connected=connectElectricalTerminals({components:[lamp,relay],wires},{componentId:a.id,terminal:ap},{componentId:b.id,terminal:bp});assert.equal(connected.ok,true);wires.push(connected.wire);}
const unpowered={...emptyProject(),tags:[{name:"Lamp",type:"BOOL",role:"output",address:"Q0.0"}],io:{inputs:[],outputs:["Lamp"]},electrical:{components:[{...lamp,tag:"Lamp"},relay],wires,inputStates:{}}};
assert.ok(analyzeAdigunCopilot({project:unpowered}).some((item)=>item.type==="unpowered-output"),"fully wired output load with no source path is reported from electrical simulation");
const firstSeenAt=new Map(),floater={...ambiguous,io:{inputs:[],outputs:[]}};
assert.ok(!analyzeAdigunCopilot({project:floater,firstSeenAt,now:1000,stuckAfterMs:5000}).some((item)=>item.type==="floating-component"));
assert.ok(analyzeAdigunCopilot({project:floater,firstSeenAt,now:6001,stuckAfterMs:5000}).some((item)=>item.type==="floating-component"),"unwired terminal warning appears only after the stuck interval");
const candidate=await planAdigunBotCopilotFix(gate,incomplete[0].action);
assert.equal(verifyAdigunBotDraft(candidate).passed,true,"suggested gate fix passes its truth-table checks");
let result=scanFBD(candidate.project.fbdBlocks,{A:true,Switch2:true},{},["Run"]);assert.equal(result.outputs.Run,true);
result=scanFBD(candidate.project.fbdBlocks,{A:true,Switch2:false},{},["Run"]);assert.equal(result.outputs.Run,false);
const preview=createAdigunBotCanvasPreview(gate,candidate.project);
assert.deepEqual(resolveAdigunBotCanvasPreview(preview,"discard").project,gate,"discard rolls back a suggested change");
assert.throws(()=>resolveAdigunBotCanvasPreview(preview,"commit"),/no longer active/);

const state={active:null,lastShownAt:0,dismissed:new Set()},now=100000;
const first=nextAdigunCopilotSuggestion(incomplete,state,{now});assert.equal(first.id,incomplete[0].id);
assert.equal(nextAdigunCopilotSuggestion(incomplete,state,{now:now+1,dragging:true}),null,"no prompt while user is dragging");
assert.equal(nextAdigunCopilotSuggestion(incomplete,state,{now:now+1,typingUntil:now+2000}),null,"no prompt while user is typing");
assert.equal(nextAdigunCopilotSuggestion(incomplete,state,{now:now+10000}),first,"current suggestion stays stable inside the rate window");
dismissAdigunCopilotSuggestion(state);assert.equal(nextAdigunCopilotSuggestion(incomplete,state,{now:now+26000}),null,"dismissal suppresses the same finding after cooldown");
assert.equal(nextAdigunCopilotSuggestion(incomplete,state,{now:now+100000,enabled:false}),null,"disabled co-pilot remains silent");
const app=readFileSync("src/app.js","utf8"),html=readFileSync("index.html","utf8"),help=readFileSync("docs/HELP.md","utf8");
assert.match(html,/id="adigunCopilotPanel"/);assert.match(app,/id="liveCopilotToggle"/);assert.match(app,/adigunsps:canvas-state-changed/);assert.match(app,/startAdigunCopilotObservers\(\)/);assert.match(help,/## The live co-pilot/);
assert.match(app,/adigunBotWindow\?\.setBadge\(true\)/,"new co-pilot suggestions mark the Bot launcher");
assert.match(app,/New Adigun BOT suggestion is ready/,"co-pilot changes announce a notification without opening the Bot window");
console.log("PASS: co-pilot findings, stuck timers, goal prompts, action preview rollback, dismissal, idle suppression, and rate limiting");
