import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {compileStructuredText,executeStructuredText,renameStructuredTextIdentifier,countStructuredTextReferences} from "../src/structured-text.js";
import {compileWorkerRequest} from "../src/st-compiler-worker.js";
import {structuredTextFunctionLibrary,structuredTextProgramLibrary,structuredTextBlockLibrary,structuredTextLineOffset} from "../src/st-function-library.js";
import {createApplicationMenuEntries} from "../src/app-menus.js";
import {traceSectionValues} from "../src/trace-utils.js";

const source=`FUNCTION_BLOCK EdgeCounter
VAR_INPUT IN : BOOL; Reset : BOOL; END_VAR
VAR_OUTPUT Q : BOOL; Count : INT; END_VAR
VAR Previous : BOOL; END_VAR
IF Reset THEN Count := 0;
ELSIF IN AND NOT Previous THEN Count := Count + 1;
END_IF;
Q := Count >= 2; Previous := IN;
END_FUNCTION_BLOCK
PROGRAM Control
VAR First : EdgeCounter; Second : EdgeCounter; END_VAR
First(IN := Start, Reset := Stop);
Second(IN := Other, Reset := Stop);
Motor := First.Q; CountView := First.Count; OtherCount := Second.Count;
END_PROGRAM`;
const names=["Start","Stop","Other","Motor","CountView","OtherCount"],outputs=["Motor","CountView","OtherCount"],types={Start:"BOOL",Stop:"BOOL",Other:"BOOL",Motor:"BOOL",CountView:"INT",OtherCount:"INT"};
const compiled=compileStructuredText(source,names);assert.equal(compiled.ok,true,compiled.errors.join("; "));assert.equal(compiled.functionBlocks.length,1);assert.equal(compiled.programs[0].instances.length,2);assert.deepEqual(compileWorkerRequest({id:1,source,tags:names}).result,compiled);
let prior={outputs:{},programState:{},taskState:null};const frames=[[true,false,false,1,0],[false,false,true,1,1],[true,false,true,2,1],[true,false,false,2,1],[true,true,false,0,0]];
for(const [Start,Stop,Other,CountView,OtherCount] of frames){
 const untouched=JSON.stringify(prior.programState),result=executeStructuredText(JSON.parse(JSON.stringify(compiled)),{Start,Stop,Other},prior.outputs,outputs,types,prior.programState);
 assert.deepEqual(result.errors,[]);assert.deepEqual(result.outputs,{Motor:CountView>=2,CountView,OtherCount});assert.equal(JSON.stringify(prior.programState),untouched);assert.equal(result.programState.control.instances.first.values.count,CountView);assert.equal(result.programState.control.instances.second.values.count,OtherCount);assert.equal(Object.keys(result.values).some(key=>key.startsWith("Control.First.")),false);prior=JSON.parse(JSON.stringify(result));
}
const cold=executeStructuredText(compiled,{Start:true,Stop:false,Other:false},{},outputs,types);assert.equal(cold.outputs.CountView,1);
const repeated=compileStructuredText(source.replace("First(IN := Start, Reset := Stop);","First(IN := TRUE); First(IN := FALSE); First(IN := TRUE);"),names);assert.equal(repeated.ok,true,repeated.errors.join("; "));assert.equal(executeStructuredText(repeated,{Stop:false,Other:false},{},outputs,types).outputs.CountView,2);
const setter=compileStructuredText(source.replace("First(IN := Start, Reset := Stop);","First.IN := Start; First.Reset := Stop; First();"),names);assert.equal(setter.ok,true,setter.errors.join("; "));assert.equal(executeStructuredText(setter,{Start:true,Stop:false,Other:false},{},outputs,types).outputs.CountView,1);
const nestedArgument=compileStructuredText(source.replace("First(IN := Start, Reset := Stop);","First(IN := Both(Start, TRUE), Reset := Stop);")+"\nFUNCTION Both : BOOL\nVAR_INPUT A : BOOL; B : BOOL; END_VAR\nBoth := A AND B;\nEND_FUNCTION",names);assert.equal(nestedArgument.ok,true,nestedArgument.errors.join("; "));assert.equal(executeStructuredText(nestedArgument,{Start:true,Stop:false,Other:false},{},outputs,types).outputs.CountView,1);
const skipped=compileStructuredText(source.replace("First(IN := Start, Reset := Stop);","IF Other THEN First(IN := Start, Reset := Stop); END_IF;"),names);assert.equal(skipped.ok,true);const held=executeStructuredText(skipped,{Start:false,Stop:true,Other:false},cold.outputs,outputs,types,cold.programState);assert.equal(held.outputs.CountView,1,"uncalled instance retains state");
const renamed=renameStructuredTextIdentifier(source,"Start","Begin");assert.match(renamed,/First\(IN := Begin/);assert.equal(compileStructuredText(renamed,names.map(name=>name==="Start"?"Begin":name)).ok,true);
assert.equal(countStructuredTextReferences(source,"IN"),0);assert.equal(renameStructuredTextIdentifier(source,"IN","Signal"),source,"named labels and block-private names are not global references");assert.equal(countStructuredTextReferences(source,"First.Count"),0);
const sharedName=source.replace("IN := Start","IN := IN");assert.equal(countStructuredTextReferences(sharedName,"IN"),1);const renamedLabel=renameStructuredTextIdentifier(sharedName,"IN","Signal");assert.match(renamedLabel,/First\(IN := Signal/);assert.match(renamedLabel,/VAR_INPUT IN : BOOL/);
for(const [bad,pattern] of [
 [source.replace("Motor := First.Q","First.Q := TRUE; Motor := First.Q"),/read-only/],
 [source.replace("Previous := IN","IN := FALSE; Previous := IN"),/read-only/],
 [source.replace("Motor := First.Q","Motor := First.Previous"),/not declared/],
 [source.replace("First(IN := Start, Reset := Stop)","First(IN := Start, IN := Stop)"),/repeated/],
 [source.replace("First(IN := Start, Reset := Stop)","First(Q := Start)"),/not an input/],
 [source.replace("First(IN := Start, Reset := Stop)","First(Start, Stop)"),/named block inputs/],
 [source.replace("First(IN := Start, Reset := Stop)","Unknown(IN := Start)"),/not declared/],
 [source.replace("Second : EdgeCounter","first : EdgeCounter"),/declared more than once/],
 [source.replace("First : EdgeCounter","First : MissingType"),/program locals require/],
 [source.replace("END_FUNCTION_BLOCK",""),/missing END_FUNCTION_BLOCK/],
 [source+"\nEND_FUNCTION_BLOCK",/no matching declaration/],
 [source.replace("VAR Previous : BOOL;","VAR Previous : EdgeCounter;"),/scalar/],
 [source.replace("Q := Count >= 2","Q := Missing"),/not declared/]
]){const result=compileStructuredText(bad,names);assert.equal(result.ok,false);assert.match(result.errors.join("; "),pattern);}
assert.equal(compileStructuredText(source,[...names,"EdgeCounter"]).ok,false);
const collision=compileStructuredText(source,[...names,"Control.First.Q"]);assert.equal(collision.ok,false);assert.match(collision.errors.join("; "),/collides/);
const badFunction=compileStructuredText("FUNCTION F : INT\nVAR_INPUT X : INT; END_VAR\nX := 1; F := X;\nEND_FUNCTION\nCountView := F(2);",names);assert.equal(badFunction.ok,false);assert.match(badFunction.errors.join("; "),/read-only/);
const faultSource=`FUNCTION_BLOCK Divide
VAR_INPUT X : REAL; END_VAR
VAR_OUTPUT Q : REAL; END_VAR
VAR Seen : INT; END_VAR
Seen := Seen + 1; Q := 10 / X;
END_FUNCTION_BLOCK
PROGRAM Main
VAR B : Divide; END_VAR
B(X := Input); Output := B.Q;
END_PROGRAM`,faultAst=compileStructuredText(faultSource,["Input","Output"]);assert.equal(faultAst.ok,true,faultAst.errors.join("; "));
const good=executeStructuredText(faultAst,{Input:2},{},["Output"],{Output:"REAL"}),failed=executeStructuredText(faultAst,{Input:0},good.outputs,["Output"],{Output:"REAL"},good.programState);assert.equal(good.outputs.Output,5);assert.equal(failed.outputs.Output,5);assert.deepEqual(failed.programState.main.instances.b.values,good.programState.main.instances.b.values);assert.match(failed.errors.join("; "),/Main.B line 5: Division by zero/);
const tasks=[{name:"Control task",cycleMs:100,priority:0,programs:["Control"]}];const scheduled=executeStructuredText(compiled,{Start:true,Stop:false,Other:false},{},outputs,types,{}, {tasks,dtMs:300});assert.equal(scheduled.outputs.CountView,1,"held input image creates one edge across three releases");
const layoutChange=compileStructuredText(source.replace("Previous : BOOL;","Previous : BOOL; Extra : INT;"),names);assert.equal(layoutChange.ok,true);assert.equal(executeStructuredText(layoutChange,{Start:true,Stop:false,Other:false},scheduled.outputs,outputs,types,scheduled.programState).outputs.CountView,1);
const app=readFileSync("src/app.js","utf8"),begin=app.indexOf('  if (project.editorType === "ST") {',app.indexOf("function doScan(")),end=app.indexOf('\n  else if (project.editorType === "FBD")',begin);
const fixture={dt:100,project:{id:"blocks",editorType:"ST",stSource:source,tags:names.map(name=>({name,type:types[name]})),tasks},sim:{values:{},outputs:{}},inputs:{Start:true,Stop:false,Other:false},connectedAnalogInputs:{},tags:{signals:names,outputs},compiledST:null,compiledSTSignature:"",compileStructuredText,executeStructuredText,stCompileSignature:(source,tags)=>JSON.stringify([source,tags]),logEvent(){}};
runInNewContext(app.slice(begin,end),fixture);const snapshot=JSON.parse(JSON.stringify(fixture.sim));fixture.inputs.Start=false;runInNewContext(app.slice(begin,end),fixture);fixture.inputs.Start=true;runInNewContext(app.slice(begin,end),fixture);assert.equal(fixture.sim.outputs.CountView,2);const expected=JSON.parse(JSON.stringify(fixture.sim));fixture.sim=snapshot;fixture.inputs.Start=false;runInNewContext(app.slice(begin,end),fixture);fixture.inputs.Start=true;runInNewContext(app.slice(begin,end),fixture);assert.deepEqual(JSON.parse(JSON.stringify(fixture.sim)),expected);
for(const locale of ["en","de","yo","pcm"]){const project={stSource:source,tags:names.map(name=>({name}))},view=structuredTextBlockLibrary(project,locale);assert.ok(view.title);assert.match(view.html,/EdgeCounter\(IN: BOOL, Reset: BOOL\)/);assert.match(view.html,/Q: BOOL, Count: INT/);assert.ok(!view.html.includes("undefined"));assert.match(structuredTextProgramLibrary(project,locale).html,/First: EdgeCounter, Second: EdgeCounter/);assert.ok(createApplicationMenuEntries(locale).programs.some(entry=>entry.action==="st-function-blocks"&&entry.label));assert.match(structuredTextBlockLibrary({stSource:"",tags:[]},locale).html,/FUNCTION_BLOCK/);}
const preview=traceSectionValues(snapshot,"programState");assert.equal(preview.control["[instances]"].first.count,1);assert.ok(!JSON.stringify(preview).includes("schema"));
const manyInstances=source.replace("First : EdgeCounter; Second : EdgeCounter;",Array.from({length:65},(_,index)=>`B${index} : EdgeCounter;`).join(" ")).replaceAll("First(","B0(").replaceAll("Second(","B1(").replaceAll("First.","B0.").replaceAll("Second.","B1.");assert.match(compileStructuredText(manyInstances,names).errors.join("; "),/64 function-block instances/);
const manyCalls=compileStructuredText(source.replace("First(IN := Start, Reset := Stop);","First(IN := Start);".repeat(10001)),names);assert.equal(manyCalls.ok,true,manyCalls.errors.join("; "));const overrun=executeStructuredText(manyCalls,{Start:true,Other:false},cold.outputs,outputs,types,cold.programState);assert.deepEqual(overrun.outputs,cold.outputs);assert.equal(overrun.programState,cold.programState);assert.equal(overrun.errors.length,1);assert.match(overrun.errors[0],/execution limit/);
const typeSource=`FUNCTION_BLOCK Typed
VAR_INPUT V : REAL; END_VAR
VAR_OUTPUT Count : INT; Ready : BOOL; Delay : TIME; END_VAR
VAR Acc : REAL; END_VAR
Acc := Acc + V; Count := Acc; Ready := Count >= 2; Delay := Delay + 1.9;
END_FUNCTION_BLOCK
PROGRAM Main
VAR T : Typed; END_VAR
T(V := Input); CountView := T.Count; Motor := T.Ready;
END_PROGRAM`;
const typeAst=compileStructuredText(typeSource,["Input","CountView","Motor"]);assert.equal(typeAst.ok,true,typeAst.errors.join("; "));let typedState={};for(let scan=1;scan<=2;scan++){const result=executeStructuredText(typeAst,{Input:1.25},{},["CountView","Motor"],types,typedState);assert.equal(result.programState.main.instances.t.values.delay,scan);assert.equal(result.programState.main.instances.t.values.acc,scan*1.25);assert.equal(result.outputs.CountView,scan);assert.equal(result.outputs.Motor,scan===2);typedState=result.programState;}
const header=source.slice(0,source.indexOf("PROGRAM Control")),separate=compileStructuredText(header+"PROGRAM Left\nVAR M : EdgeCounter; END_VAR\nM(IN := Start); CountView := M.Count;\nEND_PROGRAM\nPROGRAM Right\nVAR M : EdgeCounter; END_VAR\nM(IN := Other); OtherCount := M.Count;\nEND_PROGRAM",names);assert.equal(separate.ok,true,separate.errors.join("; "));const separateResult=executeStructuredText(separate,{Start:true,Other:false},{},outputs,types);assert.equal(separateResult.programState.left.instances.m.values.count,1);assert.equal(separateResult.programState.right.instances.m.values.count,0);
const panelStart=app.indexOf("function showStructuredTextFunctions("),panelEnd=app.indexOf("function action(name)",panelStart);let title,focused=false;const open={},editor={focus(){focused=true;},setSelectionRange(){}};
const panelFixture={project:{stSource:source,tags:names.map(name=>({name})),editorType:"ST"},language:"en",accountAccess:"member",structuredTextFunctionLibrary,structuredTextProgramLibrary,structuredTextBlockLibrary,structuredTextLineOffset,modal(value){title=value;},applyWorkspaceView(){},$:selector=>({"#modal":{close(){}},"#modalContent":{querySelectorAll:()=>[]},"#openFunctionSource":open,"#stSource":editor})[selector]};runInNewContext(app.slice(panelStart,panelEnd),panelFixture);panelFixture.showStructuredTextFunctions("functionBlocks");assert.equal(title,"Function blocks");open.onclick();assert.equal(focused,true);
const guide=[...readFileSync("docs/user-guide.md","utf8").matchAll(/```iecst\r?\n([\s\S]*?)```/g)].map(match=>match[1]).find(source=>source.includes("FUNCTION_BLOCK MemoryLatch"));assert.ok(guide);
const guideAst=compileStructuredText(guide,["Start","Stop","Motor"]);assert.equal(guideAst.ok,true,guideAst.errors.join("; "));let latch={outputs:{},programState:{}};
for(const [Start,Stop,Motor] of [[false,false,false],[true,false,true],[false,false,true],[true,true,false]]){latch=executeStructuredText(guideAst,{Start,Stop},latch.outputs,["Motor"],{Motor:"BOOL"},latch.programState);assert.deepEqual(latch.errors,[]);assert.equal(latch.outputs.Motor,Motor);}
const retainedInput=compileStructuredText(source.replace("First(IN := Start, Reset := Stop);","IF Other THEN First.IN := Start; END_IF; First();"),names);assert.equal(retainedInput.ok,true,retainedInput.errors.join("; "));let retained={outputs:{},programState:{}};
for(const [Start,Other,CountView] of [[true,true,1],[false,false,1],[false,true,1],[true,true,2]]){retained=executeStructuredText(retainedInput,{Start,Other,Stop:false},retained.outputs,outputs,types,retained.programState);assert.equal(retained.outputs.CountView,CountView);}
assert.match(compileStructuredText(source.replaceAll("EdgeCounter","INT"),names).errors.join("; "),/cannot reuse a scalar type name/);
const labelComment=source.replace("IN := Start","IN (* label note *) := IN");assert.equal(countStructuredTextReferences(labelComment,"IN"),1);assert.match(renameStructuredTextIdentifier(labelComment,"IN","Signal"),/IN \(\* label note \*\) := Signal/);
console.log("PASS: stateful ST block instances, named inputs, retained outputs/locals, atomic failed calls, scope-safe renaming and application/task/trace recovery");
