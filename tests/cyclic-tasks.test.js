import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {validateCyclicTasks,cyclicTaskSchedule} from "../src/cyclic-tasks.js";
import {compileStructuredText,executeStructuredText} from "../src/structured-text.js";
import {cyclicTaskEditor,readCyclicTaskRows} from "../src/cyclic-task-ui.js";
import {normalizeImportedProject} from "../src/project-import.js";
import {traceSectionValues} from "../src/trace-utils.js";
import {validateProject} from "../src/validation.js";
import {createApplicationMenuEntries} from "../src/app-menus.js";

const programs=["Fast","Slow"],tasks=[{name:"fast task",cycleMs:100,priority:10,enabled:true,programs:["Fast"]},{name:"slow task",cycleMs:250,priority:0,enabled:true,programs:["Slow"]}];
assert.deepEqual(validateCyclicTasks(tasks,programs),[]);
let clock=null,releases=[];
for(let scan=1;scan<=5;scan++){const schedule=cyclicTaskSchedule(tasks,programs,100,clock);assert.deepEqual(schedule.errors,[]);clock=JSON.parse(JSON.stringify(schedule.state));releases.push(...schedule.releases.map(release=>[release.at,release.task]));assert.equal(clock.timeMs,scan*100);}
assert.deepEqual(releases,[[100,"fast task"],[200,"fast task"],[250,"slow task"],[300,"fast task"],[400,"fast task"],[500,"slow task"],[500,"fast task"]]);
const changedCase=tasks.map(task=>({...task,name:task.name.toUpperCase(),programs:task.programs.map(name=>name.toLowerCase())}));assert.equal(cyclicTaskSchedule(changedCase,programs,100,clock).state.timeMs,600);
assert.equal(cyclicTaskSchedule(tasks.map(task=>({...task,cycleMs:task.cycleMs+1})),programs,100,clock).state.timeMs,100);
assert.equal(cyclicTaskSchedule(tasks,programs,10,clock).state.timeMs,510);
for(const [bad,pattern] of [
 [[],/1–16/],[[{...tasks[0],cycleMs:0},tasks[1]],/cycle/],[[{...tasks[0],priority:null},tasks[1]],/priority/],[[{...tasks[0],enabled:1},tasks[1]],/enabled/],
 [[{...tasks[0],name:"SAME"},{...tasks[1],name:"same"}],/repeats/],[[{...tasks[0],programs:["Fast","FAST"]},tasks[1]],/more than once/],[[tasks[0]],/Slow.*assigned/],[[{...tasks[0],programs:["Unknown"]},tasks[1]],/not declared/],[[null],/object/]
])assert.match(validateCyclicTasks(bad,programs).join("; "),pattern);
assert.match(cyclicTaskSchedule(tasks,programs,0).errors.join("; "),/duration/);
assert.match(cyclicTaskSchedule([{...tasks[0],cycleMs:1,programs}],programs,60000).errors.join("; "),/1024/);
assert.match(cyclicTaskSchedule(tasks,programs,100,{schema:clock.schema,timeMs:Number.MAX_SAFE_INTEGER}).errors.join("; "),/clock/);
const tie=cyclicTaskSchedule(tasks.map(task=>({...task,cycleMs:100,priority:0})),programs,100);assert.deepEqual(tie.releases.map(release=>release.task),["fast task","slow task"]);
const source=`RootCount := RootCount + 1;
PROGRAM Fast
FastCount := FastCount + 1; Winner := 1;
END_PROGRAM
PROGRAM Slow
SlowCount := SlowCount + 1; Winner := 2;
END_PROGRAM`;
const names=["RootCount","FastCount","SlowCount","Winner"],types=Object.fromEntries(names.map(name=>[name,"INT"])),ast=compileStructuredText(source,names);assert.equal(ast.ok,true,ast.errors.join("; "));
let previous={outputs:{RootCount:0,FastCount:0,SlowCount:0,Winner:0},programState:{},taskState:null};
for(let scan=1;scan<=5;scan++){previous=executeStructuredText(ast,{},previous.outputs,names,types,previous.programState,{tasks,dtMs:100,previousState:previous.taskState});assert.deepEqual(previous.errors,[]);assert.equal(previous.outputs.RootCount,scan);assert.equal(previous.outputs.FastCount,scan);assert.equal(previous.outputs.SlowCount,Math.floor(scan*100/250));}
assert.equal(previous.outputs.Winner,1,"higher priority Slow executes first at t=500; Fast writes last");
const saved=JSON.parse(JSON.stringify(previous));const next=executeStructuredText(ast,{},previous.outputs,names,types,previous.programState,{tasks,dtMs:100,previousState:previous.taskState});assert.deepEqual(JSON.parse(JSON.stringify(executeStructuredText(ast,{},saved.outputs,names,types,saved.programState,{tasks,dtMs:100,previousState:saved.taskState}))),JSON.parse(JSON.stringify(next)));
const rapid=executeStructuredText(ast,{}, {},names,types,{}, {tasks:[{name:"rapid",cycleMs:10,programs:["Slow","Fast"]}],dtMs:100});assert.equal(rapid.outputs.FastCount,10);assert.equal(rapid.outputs.SlowCount,10);assert.equal(rapid.outputs.RootCount,1);assert.equal(rapid.outputs.Winner,1);
const disabled=executeStructuredText(ast,{},previous.outputs,names,types,previous.programState,{tasks:tasks.map(task=>({...task,enabled:false})),dtMs:100});assert.equal(disabled.outputs.FastCount,5);assert.equal(disabled.outputs.RootCount,6);
const failed=executeStructuredText(ast,{},previous.outputs,names,types,previous.programState,{tasks:[{...tasks[0],cycleMs:1,programs}],dtMs:60000,previousState:previous.taskState});assert.ok(failed.errors.length);assert.deepEqual(failed.outputs,previous.outputs);assert.equal(failed.taskState,previous.taskState);assert.equal(failed.programState,previous.programState);
const project={id:"task-test",name:"Task test",editorType:"ST",rungs:[],tags:names.map(name=>({name,type:"INT"})),io:{inputs:[],outputs:names},stSource:source,tasks};assert.deepEqual(normalizeImportedProject(JSON.parse(JSON.stringify(project))).tasks,tasks);
const editableInvalid=normalizeImportedProject({...project,tasks:[{...tasks[0],programs:["Unknown"]},tasks[1]]});assert.ok(validateProject(editableInvalid).some(issue=>issue.message.includes("not declared")));assert.throws(()=>normalizeImportedProject({...project,tasks:[{...tasks[0],cycleMs:0},tasks[1]]}),/cycle/);assert.ok(validateProject({...project,tasks:[]}).some(issue=>issue.code==="task-config"));
for(const locale of ["en","de","yo","pcm"]){const view=cyclicTaskEditor(project,locale);assert.ok(view.copy.title);assert.match(view.html,/id="cyclicTaskForm"/);assert.match(view.html,/data-task-field="priority"/);assert.ok(createApplicationMenuEntries(locale).project.some(entry=>entry.action==="cyclic-tasks"));assert.ok(!cyclicTaskEditor({...project,tasks:[{...tasks[0],name:'<img src=x onerror=1>'},tasks[1]]},locale).html.includes("<img"));}
const fields={name:{value:"  Main  "},cycleMs:{value:"100"},priority:{value:"0"},programs:{value:" Slow, Fast "},enabled:{checked:true}};const row={querySelector:selector=>fields[selector.match(/"([^" ]+)"/)[1]]};assert.deepEqual(readCyclicTaskRows({querySelectorAll:()=>[row]}),[{name:"Main",cycleMs:100,priority:0,programs:["Slow","Fast"],enabled:true}]);
const app=readFileSync("src/app.js","utf8"),start=app.indexOf("function showCyclicTasks("),end=app.indexOf("function showStructuredTextFunctions(",start);
for(const scenario of ["save","expired","stale","invalid","default"]){
 const current=structuredClone(project),elements={"#cyclicTaskForm":{querySelectorAll:()=>[]},"#openTaskPrograms":{},"#defaultCyclicTasks":{},"#addCyclicTask":{},"#cyclicTaskErrors":{},"#modal":{close(){}}};let history=0,persisted=0,account=0,toast=0;
 const fixture={project:current,language:"en",accountAccess:scenario==="expired"?"guest-expired":"member",cyclicTaskEditor,readCyclicTaskRows:()=>scenario==="invalid"?[]:structuredClone(tasks),validateCyclicTasks,modal(){},pushHistory(){history++;},persist(){persisted++;},showAccount(){account++;},toast(){toast++;},getTaskCycleMs:()=>100,$:selector=>elements[selector]};runInNewContext(app.slice(start,end),fixture);fixture.showCyclicTasks();if(scenario==="stale")current.stSource+=" ";if(scenario==="default")elements["#defaultCyclicTasks"].onclick();else elements["#cyclicTaskForm"].onsubmit({preventDefault(){}});
 if(scenario==="save"){assert.equal(history,1);assert.equal(persisted,1);assert.deepEqual(current.tasks,tasks);}else if(scenario==="default"){assert.equal(history,1);assert.equal(current.tasks,undefined);}else{assert.equal(history,0);assert.equal(persisted,0);if(scenario==="expired")assert.equal(account,1);if(scenario==="stale")assert.equal(toast,1);if(scenario==="invalid")assert.match(elements["#cyclicTaskErrors"].textContent,/1–16/);}
}
assert.ok(app.includes("task:project.task, tasks:project.tasks"));assert.ok(app.includes("expected.state?.taskState"));
assert.deepEqual(traceSectionValues({taskState:{schema:"private cache key",timeMs:500}},"taskState"),{timeMs:500});assert.deepEqual(traceSectionValues({programState:{fast:{schema:"private cache key",values:{x:2}}}},"programState"),{fast:{x:2}});
const scanStart=app.indexOf('  if (project.editorType === "ST") {',app.indexOf("function doScan(")),scanEnd=app.indexOf('\n  else if (project.editorType === "FBD")',scanStart);
const scanFixture={dt:100,project,sim:{values:{},outputs:{}},inputs:{},connectedAnalogInputs:{},tags:{signals:names,outputs:names},compiledST:null,compiledSTSignature:"",compileStructuredText,executeStructuredText,stCompileSignature:(source,tags)=>JSON.stringify([source,tags]),logEvent(){}};
for(let scan=1;scan<=5;scan++)runInNewContext(app.slice(scanStart,scanEnd),scanFixture);assert.equal(scanFixture.sim.outputs.FastCount,5);assert.equal(scanFixture.sim.outputs.SlowCount,2);assert.equal(scanFixture.sim.taskState.timeMs,500);
const snapshot=JSON.parse(JSON.stringify(scanFixture.sim));runInNewContext(app.slice(scanStart,scanEnd),scanFixture);const replayed=JSON.parse(JSON.stringify(scanFixture.sim));scanFixture.sim=snapshot;runInNewContext(app.slice(scanStart,scanEnd),scanFixture);assert.deepEqual(JSON.parse(JSON.stringify(scanFixture.sim)),replayed);
const documentedSource=[...readFileSync("docs/user-guide.md","utf8").matchAll(/```iecst\r?\n([\s\S]*?)```/g)].map(match=>match[1]).find(source=>source.includes("PROGRAM CounterStage"));const documentedAst=compileStructuredText(documentedSource,["CountView","Complete"]);assert.equal(documentedAst.ok,true);
const documentedTasks=[{name:"Counter",cycleMs:100,priority:0,enabled:true,programs:["CounterStage"]},{name:"Indicator",cycleMs:200,priority:1,enabled:true,programs:["Indicate"]}];let documented={outputs:{},programState:{},taskState:null};
for(let scan=1;scan<=4;scan++){documented=executeStructuredText(documentedAst,{},documented.outputs,["CountView","Complete"],{CountView:"INT",Complete:"BOOL"},documented.programState,{tasks:documentedTasks,dtMs:100,previousState:documented.taskState});assert.equal(documented.outputs.CountView,scan);assert.equal(Boolean(documented.outputs.Complete),scan===4);}
for(const draftAction of ["add","remove"]){
 const current=structuredClone(project),removeButton={dataset:{removeCyclicTask:"0"}},elements={"#cyclicTaskForm":{querySelectorAll:()=>[removeButton]},"#openTaskPrograms":{},"#defaultCyclicTasks":{},"#addCyclicTask":{},"#modal":{close(){}}};let lastDraft,changes=0;
 const fixture={project:current,language:"en",accountAccess:"member",cyclicTaskEditor:(project,locale,draft)=>{lastDraft=draft;return cyclicTaskEditor(project,locale,draft);},readCyclicTaskRows:()=>structuredClone(tasks),validateCyclicTasks,modal(){},pushHistory(){changes++;},persist(){changes++;},getTaskCycleMs:()=>100,$:selector=>elements[selector]};runInNewContext(app.slice(start,end),fixture);fixture.showCyclicTasks();if(draftAction==="add")elements["#addCyclicTask"].onclick();else removeButton.onclick();assert.equal(changes,0);assert.deepEqual(current.tasks,tasks);assert.equal(lastDraft.length,draftAction==="add"?3:1);
}
console.log("PASS: cyclic task timing, priorities, assignment/import validation, bounded releases, state recovery and four-locale editor save guards");
