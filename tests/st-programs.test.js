import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {compileStructuredText,executeStructuredText,renameStructuredTextIdentifier,countStructuredTextReferences} from "../src/structured-text.js";
import {structuredTextProgramLibrary,structuredTextFunctionLibrary,structuredTextLineOffset} from "../src/st-function-library.js";
import {createApplicationMenuEntries} from "../src/app-menus.js";
import {compileWorkerRequest} from "../src/st-compiler-worker.js";

const source=`Ready := Start;
PROGRAM CounterLine
VAR Count : INT; END_VAR
IF Ready THEN Count := Count + 1; ELSE Count := 0; END_IF;
Motor := Count >= 3;
END_PROGRAM
PROGRAM Report
VAR Count : INT; END_VAR
Count := Count + 10;
Lamp := Motor AND Count >= 20;
END_PROGRAM`;
const names=["Start","Ready","Motor","Lamp","Count"],outputs=["Ready","Motor","Lamp"],types={Start:"BOOL",Ready:"BOOL",Motor:"BOOL",Lamp:"BOOL",Count:"INT"};
const compiled=compileStructuredText(source,names);assert.equal(compiled.ok,true,compiled.errors.join("; "));
assert.deepEqual(compiled.programs.map(program=>program.name),["CounterLine","Report"]);
assert.deepEqual(compileWorkerRequest({id:1,source,tags:names}).result,compiled);
let state={},prior={Ready:false,Motor:false,Lamp:false};
for(let scan=1;scan<=3;scan++){
 const result=executeStructuredText(JSON.parse(JSON.stringify(compiled)),{Start:true,Count:99},prior,outputs,types,JSON.parse(JSON.stringify(state)));
 assert.deepEqual(result.outputs,{Ready:true,Motor:scan>=3,Lamp:scan>=3});assert.equal(result.programState.counterline.values.count,scan);assert.equal(result.programState.report.values.count,scan*10);
 assert.equal(result.values.Count,99);assert.equal(Object.hasOwn(result.values,"CounterLine.Count"),false);assert.deepEqual(result.errors,[]);state=result.programState;prior=result.outputs;
}
const stopped=executeStructuredText(compiled,{Start:false},prior,outputs,types,state);assert.equal(stopped.programState.counterline.values.count,0);assert.equal(stopped.outputs.Motor,false);assert.equal(stopped.programState.report.values.count,40);
const cold=executeStructuredText(compiled,{Start:true},{},outputs,types);assert.equal(cold.programState.counterline.values.count,1);assert.equal(cold.programState.report.values.count,10);
const changed=compileStructuredText(source.replace("Count : INT","Count : REAL"),names);assert.equal(changed.ok,true);assert.equal(executeStructuredText(changed,{Start:true},{},outputs,types,state).programState.counterline.values.count,1,"local schema changes reinitialize that program");
const removed=compileStructuredText(source.slice(0,source.indexOf("PROGRAM Report")),names);assert.equal(removed.ok,true);assert.equal(Object.hasOwn(executeStructuredText(removed,{Start:true},{},outputs,types,state).programState,"report"),false);
const withFunction=compileStructuredText(source.replace("Count >= 3","AtLeast(Count, 3)")+`
FUNCTION AtLeast : BOOL
VAR_INPUT X : INT; Minimum : INT; END_VAR
AtLeast := X >= Minimum;
END_FUNCTION`,names);assert.equal(withFunction.ok,true,withFunction.errors.join("; "));assert.equal(executeStructuredText(withFunction,{Start:true},{},outputs,types,state).outputs.Motor,true);
for(const [bad,pattern,extra=[]] of [
 [source.replace("PROGRAM Report","PROGRAM counterline"),/must be distinct/],
 [source.replace("Count : INT;","Count : INT; count : BOOL;"),/declared more than once/],
 [source.replace("Count : INT;","Count : STRING;"),/program locals require/],
 [source.replace("Count : INT;","Count : INT"),/semicolon/],
 [source.replace("END_PROGRAM",""),/nested PROGRAM|missing END_PROGRAM/],
 ["END_PROGRAM\nMotor := TRUE;",/no matching PROGRAM/],
 [source,/private program storage collides/,["CounterLine.Count"]],
 [source.replace("PROGRAM CounterLine","PROGRAM Motor"),/must be distinct/],
 [source.replace("Motor := Count >= 3;","Motor := Report.Count >= 3;"),/not declared/],
 [source.replace("Motor := Count >= 3;","Motor := Missing;"),/not declared/],
 [source.replace("PROGRAM Report", "PROGRAM Report : BOOL"),/PROGRAM Name/]
]){const result=compileStructuredText(bad,names.concat(extra));assert.equal(result.ok,false);assert.match(result.errors.join("; "),pattern);}
const nested=compileStructuredText("PROGRAM Main\nFUNCTION F : BOOL\nF := TRUE;\nEND_FUNCTION\nMotor := TRUE;\nEND_PROGRAM",names);assert.equal(nested.ok,false);assert.match(nested.errors.join("; "),/cannot be nested/);
const renamed=renameStructuredTextIdentifier(source,"Count","GlobalCount");assert.equal(renamed,source,"local shadows are not global references");assert.equal(countStructuredTextReferences(source,"Count"),0);
const globalRename=renameStructuredTextIdentifier(source,"Motor","Drive");assert.match(globalRename,/Drive := Count >= 3/);assert.match(globalRename,/Lamp := Drive/);assert.equal(countStructuredTextReferences(source,"Motor"),2);
assert.equal(compileStructuredText(globalRename,names.map(name=>name==="Motor"?"Drive":name)).ok,true);
const fault=compileStructuredText("PROGRAM Broken\nMotor := 1 / 0;\nEND_PROGRAM",names);assert.equal(fault.ok,true);const failed=executeStructuredText(fault,{}, {Motor:7},["Motor"],types);assert.equal(failed.outputs.Motor,7);assert.match(failed.errors.join("; "),/Broken: Line 2: Division by zero/);

// Execute the actual application ST scan branch, including state hand-off and trace recovery.
const app=readFileSync("src/app.js","utf8"),begin=app.indexOf('  if (project.editorType === "ST") {',app.indexOf("function doScan(")),end=app.indexOf('\n  else if (project.editorType === "FBD")',begin);
assert.ok(begin>0&&end>begin);
const fixture={dt:100,project:{id:"program-test",editorType:"ST",stSource:source,tags:names.map(name=>({name,type:types[name]}))},sim:{values:{Count:99},outputs:{}},inputs:{Start:true},connectedAnalogInputs:{},tags:{signals:names,outputs},compiledST:null,compiledSTSignature:"",compileStructuredText,executeStructuredText,stCompileSignature:(source,tags)=>JSON.stringify([source,tags]),logEvent(){}};
for(let scan=1;scan<=2;scan++)runInNewContext(app.slice(begin,end),fixture);
const recorded=JSON.parse(JSON.stringify(fixture.sim));runInNewContext(app.slice(begin,end),fixture);const third=JSON.parse(JSON.stringify(fixture.sim));assert.equal(third.outputs.Motor,true);
fixture.sim=recorded;runInNewContext(app.slice(begin,end),fixture);assert.deepEqual(JSON.parse(JSON.stringify(fixture.sim)),third,"restored program state reproduces the next scan");
fixture.sim={values:{Count:99},outputs:{}};runInNewContext(app.slice(begin,end),fixture);assert.equal(fixture.sim.programState.counterline.values.count,1);assert.equal(fixture.sim.outputs.Motor,false);
assert.ok(app.includes('JSON.stringify(expected.state?.programState || {}) !== JSON.stringify(sim.programState || {})'),"trace replay detects private-state divergence");
for(const locale of ["en","de","yo","pcm"]){
 const panel=structuredTextProgramLibrary({stSource:source,tags:names.map(name=>({name}))},locale);assert.ok(panel.title);assert.match(panel.html,/CounterLine/);assert.match(panel.html,/Report/);assert.match(panel.html,/data-st-function-line="2"/);
 assert.ok(createApplicationMenuEntries(locale).programs.some(entry=>entry.action==="st-programs"&&entry.label));assert.match(structuredTextProgramLibrary({stSource:"",tags:[]},locale).html,/END_PROGRAM/);
}
const panelStart=app.indexOf("function showStructuredTextFunctions("),panelEnd=app.indexOf("function action(name)",panelStart);
let capturedTitle,focused=false;const button={},modal={close(){}},editor={focus(){focused=true;},setSelectionRange(start){this.offset=start;}};
const panelFixture={project:{stSource:source,tags:names.map(name=>({name})),editorType:"ST"},language:"en",accountAccess:"member",workspaceView:"hmi",structuredTextFunctionLibrary,structuredTextProgramLibrary,structuredTextLineOffset,modal(title){capturedTitle=title;},applyWorkspaceView(){},showAccount(){throw Error("unexpected auth gate");},$:selector=>({"#modal":modal,"#modalContent":{querySelectorAll:()=>[]},"#stSource":editor,"#openFunctionSource":button})[selector]};runInNewContext(app.slice(panelStart,panelEnd),panelFixture);panelFixture.showStructuredTextFunctions("programs");assert.equal(capturedTitle,"ST programs");button.onclick();assert.equal(focused,true);assert.equal(panelFixture.workspaceView,"logic");
const replayBegin=app.indexOf("  if (traceReplay) { const expected ="),replayEnd=app.indexOf("\n",replayBegin),expected=JSON.parse(JSON.stringify(third));expected.programState.counterline.values.count=999;
const replayFixture={traceReplay:true,traceCursor:1,traceFrames:[{outputs:third.outputs,timers:{},processValues:{},state:expected}],sim:third,traceMismatches:[],structuredClone};runInNewContext(app.slice(replayBegin,replayEnd),replayFixture);assert.equal(replayFixture.traceMismatches.length,1);assert.equal(replayFixture.traceMismatches[0].expectedProgramState.counterline.values.count,999);assert.equal(replayFixture.traceMismatches[0].actualProgramState.counterline.values.count,3);
assert.ok(app.includes('["values", "outputs", "timers", "processValues", "programState", "taskState"]'),"historical state preview includes program locals");
const guideSource=[...readFileSync("docs/user-guide.md","utf8").matchAll(/```iecst\r?\n([\s\S]*?)```/g)].map(match=>match[1]).find(source=>source.includes("PROGRAM CounterStage"));assert.ok(guideSource);
const guideAst=compileStructuredText(JSON.parse(JSON.stringify({source:guideSource})).source,["CountView","Complete"]);assert.equal(guideAst.ok,true,guideAst.errors.join("; "));
let guideState={},guideOutputs={};for(let scan=1;scan<=3;scan++){const result=executeStructuredText(guideAst,{},guideOutputs,["CountView","Complete"],{CountView:"INT",Complete:"BOOL"},guideState);assert.deepEqual(result.outputs,{CountView:scan,Complete:scan>=3});guideState=result.programState;guideOutputs=result.outputs;}
const typed=compileStructuredText("PROGRAM Typed\nVAR Bit : BOOL; Ticks : TIME; Reading : REAL; END_VAR\nBit := NOT Bit; Ticks := Ticks + 1.9; Reading := Reading + 0.5; Motor := Bit;\nEND_PROGRAM",["Motor"]);assert.equal(typed.ok,true,typed.errors.join("; "));
let typedState={};for(let scan=1;scan<=2;scan++){const result=executeStructuredText(typed,{}, {},["Motor"],{Motor:"BOOL"},typedState);assert.deepEqual({...result.programState.typed.values},{bit:scan%2===1,ticks:scan,reading:scan*0.5});typedState=result.programState;}
const caseOnly=compileStructuredText(source.replace("PROGRAM CounterLine","PROGRAM counterline").replace("Count : INT","count : INT"),names);assert.equal(caseOnly.ok,true,caseOnly.errors.join("; "));assert.equal(executeStructuredText(caseOnly,{Start:true},{},outputs,types,state).programState.counterline.values.count,4);
console.log("PASS: named ST program ordering, isolated retained locals, reset/schema recovery, function calls, diagnostics, rename safety and application scan/trace hand-off");
