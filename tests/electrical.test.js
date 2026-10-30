import assert from "node:assert/strict";
import { connectElectricalTerminals, createElectricalComponent, createExampleElectricalDiagram, duplicateElectricalComponent, electricalComponentCatalog, moveElectricalComponent, nextElectricalReference, rotateElectricalComponent, simulateElectricalDiagram, validateElectricalDiagram } from "../src/electrical.js";
import { validateProject } from "../src/validation.js";
import { makeProjectFromExample, scan } from "../src/engine.js";

const supply = createElectricalComponent("supply24vdc",1,103,103);
const button = {...createElectricalComponent("pushbuttonNO",1,220,103),tag:"Start"};
const lamp = {...createElectricalComponent("pilotLamp",1,340,103),tag:"Lamp"};
const diagram = {components:[supply,button,lamp],wires:[]};
for (const [from,to] of [
  [{componentId:supply.id,terminal:"+"},{componentId:button.id,terminal:"13"}],
  [{componentId:button.id,terminal:"14"},{componentId:lamp.id,terminal:"X1"}],
  [{componentId:lamp.id,terminal:"X2"},{componentId:supply.id,terminal:"−"}],
]) { const result = connectElectricalTerminals(diagram,from,to); assert.equal(result.ok,true); diagram.wires.push(result.wire); }

assert.ok(Object.keys(electricalComponentCatalog).length >= 25,"catalog covers generic PLC, controls, protection, motors, actuators, power, and wiring categories");
assert.equal(button.x,220,"components snap to a 20-unit grid");
assert.equal(validateElectricalDiagram(diagram).some((issue) => issue.level === "error"),false,"wired generic circuit is structurally valid");
assert.equal(simulateElectricalDiagram(diagram,{Start:false}).energized[lamp.id],false,"open normally-open contact leaves lamp de-energized");
assert.equal(simulateElectricalDiagram(diagram,{Start:true}).energized[lamp.id],true,"closed contact completes supply-to-load paths");
const terminal=createElectricalComponent("terminal",1),terminalCircuit={components:[supply,terminal,button,lamp],wires:[]};
for(const [from,to] of [[{componentId:supply.id,terminal:"+"},{componentId:terminal.id,terminal:"1"}],[{componentId:terminal.id,terminal:"2"},{componentId:button.id,terminal:"13"}],[{componentId:button.id,terminal:"14"},{componentId:lamp.id,terminal:"X1"}],[{componentId:lamp.id,terminal:"X2"},{componentId:supply.id,terminal:"−"}]]){const result=connectElectricalTerminals(terminalCircuit,from,to);assert.equal(result.ok,true);terminalCircuit.wires.push(result.wire);}
assert.equal(simulateElectricalDiagram(terminalCircuit,{Start:true}).energized[lamp.id],true,"the two terminals of a feed-through block preserve circuit continuity");
assert.equal(connectElectricalTerminals(diagram,{componentId:"missing",terminal:"1"},{componentId:lamp.id,terminal:"+"}).ok,false,"unknown endpoints are rejected");
assert.equal(connectElectricalTerminals(diagram,diagram.wires[0].from,diagram.wires[0].to).ok,false,"duplicate wires are rejected");
assert.equal(connectElectricalTerminals(diagram,diagram.wires[0].from,{componentId:supply.id,terminal:"−"}).ok,false,"a branch needs a visible junction or distribution rail");
assert.equal(moveElectricalComponent(button,257,281).x,260,"moves snap to grid");
assert.equal(rotateElectricalComponent(button).rotation,90,"components rotate in right-angle steps");
assert.notEqual(duplicateElectricalComponent(button,"S2").id,button.id,"component copies get new identities");
const stopButton=createElectricalComponent("pushbuttonNC",1);assert.equal(nextElectricalReference("pushbuttonNC",[button,stopButton]),"S2","component reference numbering remains unique across types sharing the IEC S prefix");
assert.equal(validateProject({rungs:[],tags:[],electrical:diagram}).some((issue) => issue.code.startsWith("electrical-") && issue.level === "error"),false,"project validation includes electrical diagrams");
const duplicatedReference = structuredClone(diagram); duplicatedReference.components[2].reference = duplicatedReference.components[1].reference;
assert.ok(validateElectricalDiagram(duplicatedReference).some((issue) => issue.code === "electrical-reference"),"duplicate component references are detected");
const invalidRating = structuredClone(diagram); invalidRating.components[1].ratedCurrentA = 0;
assert.ok(validateElectricalDiagram(invalidRating).some((issue) => issue.code === "electrical-rating"),"invalid component ratings are rejected");
const imported = JSON.parse(JSON.stringify(diagram));
assert.deepEqual(simulateElectricalDiagram(imported,{Start:true}).energized,simulateElectricalDiagram(diagram,{Start:true}).energized,"wires and component properties survive project JSON round-trip");
assert.equal(simulateElectricalDiagram({...diagram,wires:[{}]},{Start:true}).energized[lamp.id],false,"malformed wires do not crash simulation");

const dc = createElectricalComponent("supply24vdc",2), threePhase = createElectricalComponent("supply3phase",1), coilButton = {...createElectricalComponent("pushbuttonNO",2),tag:"Run"};
const contactor = createElectricalComponent("contactor3P",1), motor = createElectricalComponent("threePhaseMotor",1);
const starter = {components:[dc,threePhase,coilButton,contactor,motor],wires:[]};
for (const [from,to] of [
  [{componentId:dc.id,terminal:"+"},{componentId:coilButton.id,terminal:"13"}],
  [{componentId:coilButton.id,terminal:"14"},{componentId:contactor.id,terminal:"A1"}],
  [{componentId:contactor.id,terminal:"A2"},{componentId:dc.id,terminal:"−"}],
  [{componentId:threePhase.id,terminal:"L1"},{componentId:contactor.id,terminal:"1L1"}],
  [{componentId:contactor.id,terminal:"2T1"},{componentId:motor.id,terminal:"U1"}],
  [{componentId:threePhase.id,terminal:"L2"},{componentId:contactor.id,terminal:"3L2"}],
  [{componentId:contactor.id,terminal:"4T2"},{componentId:motor.id,terminal:"V1"}],
  [{componentId:threePhase.id,terminal:"L3"},{componentId:contactor.id,terminal:"5L3"}],
  [{componentId:contactor.id,terminal:"6T3"},{componentId:motor.id,terminal:"W1"}],
]) { const result=connectElectricalTerminals(starter,from,to);assert.equal(result.ok,true);starter.wires.push(result.wire); }
assert.equal(simulateElectricalDiagram(starter,{Run:false}).energized[motor.id],false,"de-energized contactor leaves all main poles open");
assert.equal(simulateElectricalDiagram(starter,{Run:true}).energized[motor.id],true,"A1/A2 coil voltage closes three main poles and runs the educational motor model");
const shortedSupply=createElectricalComponent("supply24vdc",3),shortJunction=createElectricalComponent("junction",1),shortedLamp=createElectricalComponent("pilotLamp",2),shortedCircuit={components:[shortedSupply,shortJunction,shortedLamp],wires:[]};
for(const [from,to] of [[{componentId:shortedSupply.id,terminal:"+"},{componentId:shortJunction.id,terminal:"1"}],[{componentId:shortedSupply.id,terminal:"−"},{componentId:shortJunction.id,terminal:"2"}],[{componentId:shortJunction.id,terminal:"3"},{componentId:shortedLamp.id,terminal:"X1"}],[{componentId:shortJunction.id,terminal:"4"},{componentId:shortedLamp.id,terminal:"X2"}]]){const result=connectElectricalTerminals(shortedCircuit,from,to);assert.equal(result.ok,true);shortedCircuit.wires.push(result.wire);}
const shortResult=simulateElectricalDiagram(shortedCircuit,{});assert.equal(shortResult.energized[shortedLamp.id],false,"a load across shorted DC supply poles is de-energized");assert.ok(shortResult.faults.some((issue)=>issue.code==="electrical-source-short"),"shorted supply poles are reported as a simulation fault");assert.equal(shortResult.warnings.some((issue)=>issue.level==="error"),false,"simulation faults stay separate from non-fatal schematic warnings");
const phaseSource=createElectricalComponent("supply3phase",2),phaseJunction=createElectricalComponent("junction",2),phaseMotor=createElectricalComponent("threePhaseMotor",2),phaseShort={components:[phaseSource,phaseJunction,phaseMotor],wires:[]};
for(const [from,to] of [[{componentId:phaseSource.id,terminal:"L1"},{componentId:phaseJunction.id,terminal:"1"}],[{componentId:phaseSource.id,terminal:"L2"},{componentId:phaseJunction.id,terminal:"2"}],[{componentId:phaseJunction.id,terminal:"3"},{componentId:phaseMotor.id,terminal:"U1"}],[{componentId:phaseJunction.id,terminal:"4"},{componentId:phaseMotor.id,terminal:"V1"}],[{componentId:phaseSource.id,terminal:"L3"},{componentId:phaseMotor.id,terminal:"W1"}]]){const result=connectElectricalTerminals(phaseShort,from,to);assert.equal(result.ok,true);phaseShort.wires.push(result.wire);}
assert.equal(simulateElectricalDiagram(phaseShort,{}).energized[phaseMotor.id],false,"a three-phase motor requires distinct, non-shorted phase paths");
const disconnectedCoil=structuredClone(starter);disconnectedCoil.wires=disconnectedCoil.wires.filter((wire)=>wire.to.terminal!=="A1");
assert.equal(simulateElectricalDiagram(disconnectedCoil,{Run:true}).energized[motor.id],false,"a true command cannot close a contactor with an unpowered coil");
const overload=createElectricalComponent("overloadNC",1), taggedOverload={...overload,tag:"Trip"};
const tripCircuit={components:[dc,taggedOverload,lamp],wires:[{id:"trip-line",from:{componentId:dc.id,terminal:"+"},to:{componentId:taggedOverload.id,terminal:"95"}},{id:"trip-load",from:{componentId:taggedOverload.id,terminal:"96"},to:{componentId:lamp.id,terminal:"X1"}},{id:"trip-return",from:{componentId:lamp.id,terminal:"X2"},to:{componentId:dc.id,terminal:"−"}}]};
assert.equal(simulateElectricalDiagram(tripCircuit,{}).energized[lamp.id],true,"normally-closed overload contact passes while healthy");
assert.equal(simulateElectricalDiagram(tripCircuit,{Trip:true}).energized[lamp.id],false,"overload trip opens its associated NC control path");
const mappedPlc=createElectricalComponent("genericPlc24v4di4do",1);mappedPlc.ioMap.I1={tag:"Start",address:"I0.0"};
assert.ok(validateElectricalDiagram({components:[mappedPlc],wires:[]},[{name:"Start",role:"output",type:"BOOL"}]).some((issue)=>issue.code==="electrical-io-role"),"PLC address mappings enforce input/output roles");
const logicExample={title:{en:"Circuit integration"},tags:[{name:"Start",role:"input",type:"BOOL",address:"I0.0"},{name:"Lamp",role:"output",type:"BOOL",address:"Q0.0"}],io:{inputs:["Start"],outputs:["Lamp"]},initialState:{Start:false},logic:{rungs:[{contacts:[{tag:"Start",mode:"NO"}],coil:"Lamp"}]}};
const logicProject=makeProjectFromExample(logicExample),plcOff=scan(logicProject,{Start:false},{}),circuitOff=simulateElectricalDiagram(logicProject.electrical,{Start:false},plcOff.outputs),plcOn=scan(logicProject,{Start:true},{}),circuitOn=simulateElectricalDiagram(logicProject.electrical,{Start:true},plcOn.outputs),mappedLamp=logicProject.electrical.components.find((item)=>item.tag==="Lamp");
assert.equal(circuitOff.energized[mappedLamp.id],false,"PLC ladder output off leaves its electrically connected lamp off");
assert.equal(circuitOn.energized[mappedLamp.id],true,"PLC ladder output on energizes the mapped connected load");
const analogTags=[{name:"RawAI",type:"REAL",role:"input",address:"IW0"},{name:"ScaledValue",type:"REAL",role:"output",address:"QW0"}],analogDiagram=createExampleElectricalDiagram(analogTags,{inputs:["RawAI"],outputs:["ScaledValue"]}),analogIn=simulateElectricalDiagram(analogDiagram,{RawAI:250},{}),analogOut=simulateElectricalDiagram(analogDiagram,{RawAI:250},{ScaledValue:25}),analogIndicator=analogDiagram.components.find((item)=>item.tag==="ScaledValue");
assert.equal(analogIn.inputs.RawAI,250,"wired generic analog source delivers a numeric PLC input value");
assert.equal(analogOut.analogOutputs.ScaledValue,25,"mapped analog output module carries its value to the wired indicator");
assert.equal(analogOut.componentStates[analogIndicator.id].signalValue,25,"analog indicator exposes the delivered scalar value");
const throughTerminals=structuredClone(analogDiagram),signalSource=throughTerminals.components.find((item)=>item.type==="analogSignalSource"),inputModule=throughTerminals.components.find((item)=>item.type==="analogInputModule2"),outputModule=throughTerminals.components.find((item)=>item.type==="analogOutputModule2");
const reroutePair=(a,aPositive,aNegative,b,bPositive,bNegative,firstSequence)=>{const matches=(wire,from,pin,to,toPin)=>(wire.from.componentId===from.id&&wire.from.terminal===pin&&wire.to.componentId===to.id&&wire.to.terminal===toPin)||(wire.to.componentId===from.id&&wire.to.terminal===pin&&wire.from.componentId===to.id&&wire.from.terminal===toPin);throughTerminals.wires=throughTerminals.wires.filter((wire)=>!matches(wire,a,aPositive,b,bPositive)&&!matches(wire,a,aNegative,b,bNegative));const blocks=[createElectricalComponent("terminal",firstSequence),createElectricalComponent("terminal",firstSequence+1)];throughTerminals.components.push(...blocks);for(const [from,pin,to,toPin] of [[a,aPositive,blocks[0],"1"],[blocks[0],"2",b,bPositive],[a,aNegative,blocks[1],"1"],[blocks[1],"2",b,bNegative]]){const result=connectElectricalTerminals(throughTerminals, {componentId:from.id,terminal:pin},{componentId:to.id,terminal:toPin});assert.equal(result.ok,true,"analog signal conductor routes cleanly through a feed-through block");throughTerminals.wires.push(result.wire);}};
reroutePair(signalSource,"SIG+","SIG−",inputModule,"AI1+","AI1−",1);reroutePair(outputModule,"AQ1+","AQ1−",analogIndicator,"SIG+","SIG−",3);
const analogThroughResult=simulateElectricalDiagram(throughTerminals,{RawAI:375},{ScaledValue:42});assert.equal(analogThroughResult.inputs.RawAI,375,"analog input scalar values traverse feed-through terminals");assert.equal(analogThroughResult.analogOutputs.ScaledValue,42,"analog output scalar values traverse feed-through terminals");
const shortedAnalog=structuredClone(analogDiagram),shortAnalogSource=shortedAnalog.components.find((item)=>item.type==="analogSignalSource"),shortAnalogModule=shortedAnalog.components.find((item)=>item.type==="analogInputModule2"),shortAnalogJunction=createElectricalComponent("junction",4);shortedAnalog.components.push(shortAnalogJunction);shortedAnalog.wires=shortedAnalog.wires.filter((wire)=>![shortAnalogSource.id,shortAnalogModule.id].includes(wire.from.componentId)||![shortAnalogSource.id,shortAnalogModule.id].includes(wire.to.componentId));
for(const [from,fromPin,to,toPin] of [[shortAnalogSource,"SIG+",shortAnalogJunction,"1"],[shortAnalogSource,"SIG−",shortAnalogJunction,"2"],[shortAnalogJunction,"3",shortAnalogModule,"AI1+"],[shortAnalogJunction,"4",shortAnalogModule,"AI1−"]]){const result=connectElectricalTerminals(shortedAnalog,{componentId:from.id,terminal:fromPin},{componentId:to.id,terminal:toPin});assert.equal(result.ok,true);shortedAnalog.wires.push(result.wire);}
assert.equal(simulateElectricalDiagram(shortedAnalog,{RawAI:900},{}).inputs.RawAI,0,"a short between analog input polarity nets rejects the scalar signal");
const openAnalogInput=structuredClone(analogDiagram);openAnalogInput.wires=openAnalogInput.wires.filter((wire)=>wire.from.componentId!==analogDiagram.components.find((item)=>item.type==="analogSignalSource").id||wire.from.terminal!=="SIG+");
assert.equal(simulateElectricalDiagram(openAnalogInput,{RawAI:250},{}).inputs.RawAI,0,"disconnected analog input resolves to a safe zero instead of passing through its raw numeric source");
const openAnalogOutput=structuredClone(analogDiagram);openAnalogOutput.wires=openAnalogOutput.wires.filter((wire)=>wire.to.componentId!==analogIndicator.id||wire.to.terminal!=="SIG+");
assert.equal(Object.hasOwn(simulateElectricalDiagram(openAnalogOutput,{}, {ScaledValue:25}).analogOutputs,"ScaledValue"),false,"disconnected analog output is not delivered to its indicator");
console.log("PASS: generic industrial categories, digital and scalar analog I/O paths, grid placement, wiring, coil-driven contactor poles, motor state, PLC mapping validation, and JSON persistence");
