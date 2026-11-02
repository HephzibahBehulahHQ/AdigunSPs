import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { compileStructuredText, executeStructuredText, renameStructuredTextIdentifier, countStructuredTextReferences } from "../src/structured-text.js";
import { compileWorkerRequest } from "../src/st-compiler-worker.js";
import { validateProject } from "../src/validation.js";
import { defaultProject } from "../src/engine.js";

for (const source of ["motor := start;", "MOTOR := START;", "mOtOr := sTaRt;"]) {
 const compiled=compileStructuredText(source,["Motor","Start"]);
 assert.equal(compiled.ok,true,compiled.errors.join("; "));
 assert.equal(compiled.statements[0].target,"Motor");
 const inputs={start:true},prior={motor:false};
 const result=executeStructuredText(JSON.parse(JSON.stringify(compiled)),inputs,prior,["Motor"],{mOtOr:"BOOL"});
 assert.deepEqual(result.outputs,{Motor:true});assert.deepEqual(result.values,{Start:true,Motor:true});assert.deepEqual(result.errors,[]);
 assert.deepEqual(inputs,{start:true});assert.deepEqual(prior,{motor:false});
 const worker=compileWorkerRequest({id:1,source,tags:["Motor","Start"]});assert.deepEqual(worker.result,compiled);
}
const sequence=compileStructuredText("count := COUNT + Increment;\nCOUNT := count + 1;\nMoToR := cOuNt >= 3;",["Count","Increment","Motor"]);
let state={Count:0,Increment:1};let prior={Motor:false};
for(const expected of [{Count:2,Motor:false},{Count:4,Motor:true},{Count:6,Motor:true}]){
 const result=executeStructuredText(sequence,state,prior,["Motor"],{COUNT:"INT",Motor:"BOOL"});assert.equal(result.values.Count,expected.Count);assert.equal(result.outputs.Motor,expected.Motor);assert.ok(!Object.hasOwn(result.values,"count"));state=result.values;prior=result.outputs;
}
const conditional=compileStructuredText("if sTaRt then\n MoToR := true;\nelsif peRMit then\n MOTOR := false;\nelse\n motor := START;\nend_if;",["Start","Permit","Motor"]);
assert.equal(conditional.ok,true);for(const [start,permit,expected] of [[true,false,true],[false,true,false],[false,false,false]])assert.equal(executeStructuredText(conditional,{START:start,permit},{Motor:false},["Motor"],{motor:"BOOL"}).outputs.Motor,expected);
for(const [type,expression,expected] of [["BOOL","0",false],["INT","3.9",3],["REAL","3.9",3.9],["TIME","900.8",900]]){
 const compiled=compileStructuredText(`value := ${expression};`,["Value"]);const result=executeStructuredText(compiled,{}, {},["Value"],{vAlUe:type});assert.deepEqual(result.outputs,{Value:expected});
}
const implicit=compileStructuredText("motor := start;\ncount := COUNT + 1;");const implicitResult=executeStructuredText(implicit,{Start:true,Count:2},{Motor:false},["Motor"],{Count:"INT",Motor:"BOOL"});assert.deepEqual(implicitResult.outputs,{Motor:true});assert.equal(implicitResult.values.Count,3);assert.ok(!Object.hasOwn(implicitResult.values,"count"));
for(const names of [["Motor","motor"],["Motor","Motor"]]){const invalid=compileStructuredText("Motor := TRUE;",names);assert.equal(invalid.ok,false);assert.match(invalid.errors.join(" "),/ignoring case/);assert.deepEqual(executeStructuredText(invalid,{}, {Motor:false},["Motor"]).outputs,{Motor:false});}
assert.equal(compileStructuredText("Motor := Missing;",["Motor","Start"]).ok,false);
for(const [inputs,outputs,types] of [[{Start:true,start:false},{Motor:false},{}],[{}, {Motor:false,motor:true},{}],[{}, {Motor:false},{Motor:"BOOL",motor:"INT"}]]){
 const result=executeStructuredText(compileStructuredText("Motor := TRUE;",["Motor"]),inputs,outputs,["Motor"],types);assert.ok(result.errors.some(e=>e.includes("ambiguous identifiers")));assert.deepEqual(result.outputs,outputs,"ambiguous runtime bindings cannot execute outputs");
}
const special=executeStructuredText(compileStructuredText("__proto__ := TRUE;",["__proto__"]),{}, {},["__proto__"],Object.fromEntries([["__proto__","BOOL"]]));assert.equal(Object.hasOwn(special.outputs,"__proto__"),true);assert.equal(special.outputs.__proto__,true);assert.equal(Object.getPrototypeOf(special.outputs),Object.prototype);assert.equal({}.polluted,undefined);
const project=defaultProject();const variant=project.tags[0].name.toLowerCase()===project.tags[0].name?project.tags[0].name.toUpperCase():project.tags[0].name.toLowerCase();assert.notEqual(variant,project.tags[0].name);project.tags.push({name:variant,type:"BOOL"});assert.ok(validateProject(project).some(issue=>issue.code==="tag-duplicate"));

const app=readFileSync("src/app.js","utf8");
const addStart=app.indexOf('  $("#addTag").onclick =');const addSource=app.slice(addStart,app.indexOf("\n",addStart));
for(const initial of [["tag2"],["tag2","TAG3"]]){
 const fields={};const tags=initial.map(name=>({name}));runInNewContext(addSource,{$:()=>fields,tags,pushHistory:()=>{},renderTagManager:()=>{},persist:()=>{}});fields.onclick();assert.equal(new Set(tags.map(t=>t.name.toLowerCase())).size,tags.length);assert.equal(tags.at(-1).name,initial.length===1?"Tag3":"Tag4");
}
const guardStart=app.indexOf('    if (fieldName === "name" && (!value');const guardEnd=app.indexOf("    pushHistory();",guardStart);const guard=app.slice(guardStart,guardEnd);
for(const language of ["en","de","yo","pcm"]){const tag={name:"Motor"},tags=[tag,{name:"Start"}],field={value:"sTaRt"};const notices=[];const context={fieldName:"name",value:"sTaRt",tag,tags,field,oldName:"Motor",language,toast:message=>notices.push(message)};runInNewContext(`function check(){${guard}return "accepted";}this.check=check;`,context);assert.equal(context.check(),undefined);assert.equal(field.value,"Motor");assert.ok(notices[0]);context.value="mOtOr";assert.equal(context.check(),"accepted","changing only the current tag's spelling is allowed");}

const renameSource="mOtOr := START; // Motor stays in this comment\n(* MOTOR stays too *)\nMotorExtra := motor;\nLine.Motor := TRUE;\nText := 'Motor';";
const renamed=renameStructuredTextIdentifier(renameSource,"Motor","Drive");
assert.equal(renamed,"Drive := START; // Motor stays in this comment\n(* MOTOR stays too *)\nMotorExtra := Drive;\nLine.Motor := TRUE;\nText := 'Motor';");
assert.equal(countStructuredTextReferences(renameSource,"MOTOR"),2);
assert.equal(countStructuredTextReferences("(* Motor *) // motor\nText := 'motor';","Motor"),0);
assert.equal(renameStructuredTextIdentifier("Line.MOTOR := TRUE;","Line.Motor","Line.Drive"),"Line.Drive := TRUE;");
const renameProject={tags:[{name:"Motor"},{name:"Start"}],io:{inputs:["Start"],outputs:["Motor"]},rungs:[],stSource:"motor := START;",initialState:{Motor:false,Start:true}};
const renameContext={project:renameProject,simulationFaults:[],compiledST:{old:true},renameStructuredTextIdentifier};
const renameStart=app.indexOf("function renameTag(");runInNewContext(app.slice(renameStart,app.indexOf("const accountCopy =",renameStart)),renameContext);renameContext.renameTag("Motor","Drive");
assert.equal(renameProject.stSource,"Drive := START;");assert.deepEqual(renameProject.io.outputs,["Drive"]);assert.equal(renameContext.compiledST,null);
assert.equal(executeStructuredText(compileStructuredText(renameProject.stSource,renameProject.tags.map(t=>t.name)),{Start:true},{Drive:false},renameProject.io.outputs,{Drive:"BOOL"}).outputs.Drive,true);
const usedStart=app.indexOf("    const used = countStructuredTextReferences(");const usedEnd=app.indexOf("\n",usedStart);
for(const [source,expected] of [["MOTOR := TRUE;",true],["(* Motor *)",false]]){const fixture={project:{rungs:[],stSource:source},tag:{name:"Motor"},countStructuredTextReferences};runInNewContext(app.slice(usedStart,usedEnd)+"this.used=used;",fixture);assert.equal(Boolean(fixture.used),expected);}
// Statement layout must not change execution or diagnostic source locations.
const formatted = `IF Start THEN
  Motor := Start AND
    NOT Stop;
ELSIF Permit THEN
  Motor := FALSE;
ELSE
  Motor := TRUE;
END_IF;
Lamp := Motor;`;
const compact = "IF Start THEN Motor := Start AND NOT Stop; ELSIF Permit THEN Motor := FALSE; ELSE Motor := TRUE; END_IF; Lamp := Motor;";
for (const source of [formatted, compact, compact.replace(/; /g, ";\r\n")]) {
 const ast=compileStructuredText(source,["Start","Stop","Permit","Motor","Lamp"]);assert.equal(ast.ok,true,ast.errors.join("; "));
 for(const Start of [false,true])for(const Stop of [false,true])for(const Permit of [false,true]){
  const expected=Start?!Stop:!Permit;
  const result=executeStructuredText(JSON.parse(JSON.stringify(ast)),{Start,Stop,Permit},{Motor:false,Lamp:false},["Motor","Lamp"],{Motor:"BOOL",Lamp:"BOOL"});
  assert.deepEqual(result.outputs,{Motor:expected,Lamp:expected});assert.deepEqual(result.errors,[]);
 }
 assert.deepEqual(compileWorkerRequest({id:7,source,tags:["Start","Stop","Permit","Motor","Lamp"]}).result,ast);
}
const commented="(* heading\n (* nested note *)\n end *)\nMotor := TRUE; // retained line\nMissing := FALSE;";
const badName=compileStructuredText(commented,["Motor"]);assert.match(badName.errors.join("; "),/Line 5:.*Missing/);
const badMath=compileStructuredText("(* heading\n comment *)\nMotor := 1 /\n 0;",["Motor"]);
assert.equal(badMath.ok,true);assert.match(executeStructuredText(badMath,{}, {Motor:7},["Motor"]).errors.join("; "),/Line 3: Division by zero/);
assert.equal(compileStructuredText("Motor := TRUE (* incomplete",["Motor"]).ok,false);
assert.match(compileStructuredText("Motor := TRUE;\n(* incomplete",["Motor"]).errors.join("; "),/Line 2: block comment/);
assert.equal(compileStructuredText("Motor := TRUE\nLamp := FALSE;",["Motor","Lamp"]).ok,false,"missing terminator cannot merge two assignments");
assert.equal(compileStructuredText("IF Start THEN Motor := TRUE;",["Start","Motor"]).ok,false);
assert.equal(compileStructuredText("IF Start THEN Motor := TRUE ELSE Motor := FALSE; END_IF;",["Start","Motor"]).ok,false);
assert.equal(compileStructuredText("Motor := (* outer (* inner *) end *) TRUE;",["Motor"]).ok,true);
assert.equal(renameStructuredTextIdentifier("(* Motor (* Motor *) Motor *) MOTOR := TRUE;", "Motor","Drive"),"(* Motor (* Motor *) Motor *) Drive := TRUE;");
assert.equal(countStructuredTextReferences("(* Motor (* Motor *) Motor *) MOTOR := TRUE;","Motor"),1);
console.log("PASS: ST canonical case binding, typed outputs, state continuity, worker parity, ambiguity rejection, unique tag editing, layout-independent statements and source locations");
