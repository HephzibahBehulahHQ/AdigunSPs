import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { compileStructuredText, executeStructuredText, renameStructuredTextIdentifier, countStructuredTextReferences } from "../src/structured-text.js";
import { compileWorkerRequest } from "../src/st-compiler-worker.js";
import { createApplicationMenuEntries } from "../src/app-menus.js";
import { structuredTextFunctionLibrary, structuredTextLineOffset } from "../src/st-function-library.js";
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
const usedStart=app.indexOf("    const used = project.programUnits?.some(");const usedEnd=app.indexOf("\n",usedStart);
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
// Reusable scalar functions execute with private, freshly initialized storage.
const functionSource=`FUNCTION Bounded : REAL
VAR_INPUT
 Value : REAL;
 Low : REAL;
 High : REAL;
END_VAR
VAR
 Result : REAL;
END_VAR
IF Value < Low THEN Result := Low;
ELSIF Value > High THEN Result := High;
ELSE Result := Value; END_IF;
Bounded := Result;
END_FUNCTION
FUNCTION Twice : INT
VAR_INPUT X : INT; END_VAR
Twice := X * 2;
END_FUNCTION
Output := bounded(Input, 2, 8); Count := TWICE(Output);`;
const fnTags=["Input","Output","Count"], fnCompiled=compileStructuredText(functionSource,fnTags);
assert.equal(fnCompiled.ok,true,fnCompiled.errors.join("; "));
assert.deepEqual(compileWorkerRequest({id:9,source:functionSource,tags:fnTags}).result,fnCompiled);
for(const [Input,Output,Count] of [[-1,2,4],[4.5,4.5,8],[99,8,16]]){
 const result=executeStructuredText(JSON.parse(JSON.stringify(fnCompiled)),{Input},{Output:0,Count:0},["Output","Count"],{Output:"REAL",Count:"INT"});
 assert.deepEqual(result.outputs,{Output,Count});assert.deepEqual(result.errors,[]);assert.equal(Object.hasOwn(result.values,"Result"),false);
}
const nested=compileStructuredText(functionSource.replace("Count := TWICE(Output);","Count := Twice(Bounded(Input, 2, 8));"),fnTags);
assert.equal(nested.ok,true,nested.errors.join("; "));
assert.equal(executeStructuredText(nested,{Input:3.9},{Count:0},["Count"]).outputs.Count,6);
const privateSource=`FUNCTION Gate : BOOL
VAR_INPUT Motor : BOOL; END_VAR
VAR Seen : INT; END_VAR
Seen := Seen + 1; Gate := Motor AND Seen = 1;
END_FUNCTION
Motor := Gate(Start);`;
const privateAst=compileStructuredText(privateSource,["Motor","Start"]);assert.equal(privateAst.ok,true,privateAst.errors.join("; "));
for(let scan=0;scan<3;scan++)assert.equal(executeStructuredText(privateAst,{Start:true},{Motor:false},["Motor"]).outputs.Motor,true,"locals reinitialize each call");
const renamedFn=renameStructuredTextIdentifier(privateSource,"Motor","Drive");
assert.match(renamedFn,/VAR_INPUT Motor : BOOL/);assert.match(renamedFn,/Drive := Gate\(Start\);/);assert.equal(countStructuredTextReferences(privateSource,"Motor"),1);
assert.equal(compileStructuredText(renamedFn,["Drive","Start"]).ok,true);
for(const [source,pattern] of [
 [functionSource.replace("bounded(Input, 2, 8)","bounded(Input)"),/requires 3 arguments/],
 [functionSource.replace("TWICE(Output)","Unknown(Output)"),/not declared/],
 [privateSource.replace("Gate := Motor AND Seen = 1","Gate := Missing"),/Missing.*not declared/],
 [privateSource.replace("Seen : INT;","seen : INT; Seen : INT;"),/declared more than once/],
 [privateSource.replace("Gate := Motor AND Seen = 1","Gate := Gate(Motor)"),/Recursive/],
 [privateSource.replace("Motor : BOOL;","Motor : BOOL"),/semicolon/],
 [privateSource.replace("END_FUNCTION",""),/missing END_FUNCTION/],
 [privateSource+"\nEND_FUNCTION",/no matching FUNCTION/],
 [functionSource.replace("FUNCTION Twice : INT","FUNCTION bounded : INT"),/function.*declared more than once/]
]){const compiled=compileStructuredText(source,fnTags.concat("Motor","Start"));assert.equal(compiled.ok,false);assert.match(compiled.errors.join("; "),pattern);}
const faultyFunction=compileStructuredText("FUNCTION Divide : REAL\nVAR_INPUT X : REAL; END_VAR\nDivide := 1 / X;\nEND_FUNCTION\nOutput := Divide(Input);",["Output","Input"]);
assert.equal(faultyFunction.ok,true);const fnFault=executeStructuredText(faultyFunction,{Input:0},{Output:5},["Output"]);assert.equal(fnFault.outputs.Output,5);assert.match(fnFault.errors.join("; "),/Divide line 3: Division by zero/);
const indirect=compileStructuredText("FUNCTION A : BOOL\nA := B();\nEND_FUNCTION\nFUNCTION B : BOOL\nB := A();\nEND_FUNCTION\nMotor := A();",["Motor"]);assert.equal(indirect.ok,false);assert.match(indirect.errors.join("; "),/Recursive/);
const budgetSource=Array.from({length:15},(_,index)=>`FUNCTION F${index} : INT\nF${index} := ${index===14?"1":`F${index+1}() + F${index+1}()`};\nEND_FUNCTION`).join("\n")+"\nOutput := F0();";
const budgetAst=compileStructuredText(budgetSource,["Output"]);assert.equal(budgetAst.ok,true,budgetAst.errors.join("; "));
const budgetResult=executeStructuredText(budgetAst,{}, {Output:7},["Output"]);assert.equal(budgetResult.outputs.Output,7);assert.match(budgetResult.errors.join("; "),/execution limit/);
const noReturn=compileStructuredText("FUNCTION NoResult : INT\nVAR X : INT; END_VAR\nX := 1;\nEND_FUNCTION\nOutput := NoResult();",["Output"]);assert.equal(noReturn.ok,false);assert.match(noReturn.errors.join("; "),/must assign its result/);
assert.equal(compileStructuredText(privateSource,["Gate","Motor","Start"]).ok,false,"function/global name collision is rejected");
const timeFunction=compileStructuredText("FUNCTION DelayValue : TIME\nVAR_INPUT Ticks : TIME; END_VAR\nDelayValue := Ticks + 1.9;\nEND_FUNCTION\nOutput := DelayValue(Input);",["Output","Input"]);
assert.equal(timeFunction.ok,true,timeFunction.errors.join("; "));assert.equal(executeStructuredText(timeFunction,{Input:3.8},{Output:0},["Output"],{Output:"TIME"}).outputs.Output,4);
assert.equal(compileStructuredText(privateSource.replace("Motor : BOOL;","Motor : STRING;"),["Motor","Start"]).ok,false);
const guideFunction=[...readFileSync("docs/user-guide.md","utf8").matchAll(/```iecst\r?\n([\s\S]*?)```/g)].map(match=>match[1]).find(source=>source.includes("FUNCTION Clamp01"));assert.ok(guideFunction);
const savedGuideProject=JSON.parse(JSON.stringify({editorType:"ST",stSource:guideFunction,tags:[{name:"Raw",type:"REAL"},{name:"Result",type:"REAL"}],io:{inputs:["Raw"],outputs:["Result"]}}));
const guideAst=compileStructuredText(savedGuideProject.stSource,savedGuideProject.tags.map(tag=>tag.name));assert.equal(guideAst.ok,true,guideAst.errors.join("; "));
for(const [Raw,Result] of [[-2,0],[0.4,0.4],[3,1]])assert.equal(executeStructuredText(guideAst,{Raw},{Result:0},savedGuideProject.io.outputs,{Result:"REAL"}).outputs.Result,Result);
for(const locale of ["en","de","yo","pcm"]){
 const library=structuredTextFunctionLibrary({stSource:functionSource,tags:fnTags.map(name=>({name}))},locale);
 assert.ok(library.title);assert.match(library.html,/Bounded\(Value: REAL, Low: REAL, High: REAL\) : REAL/);assert.match(library.html,/data-st-function-line="1"/);assert.match(library.html,/aria-label="[^"]+: Bounded"/);assert.match(library.html,/id="openFunctionSource"/);
 assert.ok(structuredTextFunctionLibrary({stSource:"",tags:[]},locale).html.includes("END_FUNCTION"));
 const malicious=structuredTextFunctionLibrary({stSource:"Output := <script>;",tags:[{name:"Output"}]},locale);assert.ok(!malicious.html.includes("<script>"));
}
assert.equal(structuredTextLineOffset("first\r\nsecond\nthird",2),7);assert.equal(structuredTextLineOffset("first\nsecond",100),12);assert.equal(structuredTextLineOffset("abc",0),0);
const functionPanelStart=app.indexOf("function showStructuredTextFunctions(");
const functionPanelCode=app.slice(functionPanelStart,app.indexOf("function action(name)",functionPanelStart));
for(const access of ["member","guest","guest-expired"]){
 const sourceEditor={focus(){this.focused=true;},setSelectionRange(start,end){this.selection=[start,end];}};
 const definitionButton={dataset:{stFunctionLine:"3"}},openButton={},panel={querySelectorAll:()=>[definitionButton]},dialog={close(){this.closed=true;}};
 const fixture={project:{editorType:"ST",stSource:functionSource},language:"en",accountAccess:access,workspaceView:"hmi",structuredTextFunctionLibrary,structuredTextLineOffset,modal(){},showAccount(){fixture.needsAccount=true;},applyWorkspaceView(){fixture.applied=true;},setEditorMode(){throw Error("already ST");},$:selector=>({"#modal":dialog,"#modalContent":panel,"#stSource":sourceEditor,"#openFunctionSource":openButton})[selector]};
 runInNewContext(functionPanelCode,fixture);fixture.showStructuredTextFunctions();definitionButton.onclick();
 if(access==="guest-expired"){assert.equal(fixture.needsAccount,true);assert.equal(dialog.closed,undefined);assert.equal(sourceEditor.selection,undefined);}
 else{assert.equal(fixture.workspaceView,"logic");assert.equal(fixture.applied,true);assert.equal(sourceEditor.focused,true);assert.deepEqual(sourceEditor.selection,[structuredTextLineOffset(functionSource,3),structuredTextLineOffset(functionSource,3)]);}
}
const paletteStart=app.indexOf("  for (const entry of Object.values(createApplicationMenuEntries(language)).flat())");assert.ok(paletteStart>0);
for(const language of ["en","de","yo","pcm"]){
 const commands=[{label:"Existing save",action:"save"}],fixture={commands,language,createApplicationMenuEntries};runInNewContext(app.slice(paletteStart,app.indexOf("\n",paletteStart)),fixture);
 const entries=Object.values(createApplicationMenuEntries(language)).flat();assert.ok(entries.every(entry=>commands.some(command=>command.action===entry.action)));assert.equal(new Set(commands.map(command=>command.action)).size,commands.length);assert.equal(commands.find(command=>command.action==="save").label,"Existing save");assert.ok(commands.find(command=>command.action==="st-functions").label);
}
console.log("PASS: ST canonical case binding, typed outputs, state continuity, worker parity, ambiguity rejection, unique tag editing, layout-independent statements, source locations and isolated scalar functions");
