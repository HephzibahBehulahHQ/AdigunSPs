import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { connectElectricalTerminals, createElectricalComponent, createExampleElectricalDiagram, duplicateElectricalComponent, electricalComponentCatalog, moveElectricalComponent, nextElectricalReference, rotateElectricalComponent, simulateElectricalDiagram, updateElectricalComponentProperties, validateElectricalDiagram } from "../src/electrical.js";
import { validateProject } from "../src/validation.js";
import { electricalSimulationStatus, electricalSymbolSvg, renderElectricalWorkspace } from "../src/electrical-ui.js";
import { makeProjectFromExample, scan } from "../src/engine.js";
import { normalizeImportedProject } from "../src/project-import.js";

const electricalUiSource=readFileSync(new URL("../src/electrical-ui.js",import.meta.url),"utf8");
{
  const component=createElectricalComponent("pilotLamp",1,200,200),headEvents={},boardEvents={},card={style:{}};
  const head={dataset:{dragComponent:component.id},addEventListener:(name,handler)=>headEvents[name]=handler,setPointerCapture(){}};
  const board={getBoundingClientRect:()=>({left:-300,top:-200}),addEventListener:(name,handler)=>boardEvents[name]=handler,querySelector:()=>card};
  const root={dataset:{},innerHTML:"",querySelector:s=>s==="#electricalBoard"?board:null,querySelectorAll:s=>s==="[data-drag-component]"?[head]:[]};
  const previousCss=globalThis.CSS;globalThis.CSS={escape:value=>value};
  try{
    renderElectricalWorkspace(root,{tags:[],electrical:{components:[component],wires:[]}});
    headEvents.pointerdown({button:0,clientX:-80,clientY:10,pointerId:1,preventDefault(){}});
    boardEvents.pointermove({clientX:-80,clientY:10});
    assert.deepEqual([component.x,component.y],[200,200],"drag starts without jumping on a scrolled canvas");
    boardEvents.pointermove({clientX:-40,clientY:70});
    assert.deepEqual([component.x,component.y],[240,260],"drag follows pointer delta without double-counting canvas scroll");
  }finally{if(previousCss===undefined)delete globalThis.CSS;else globalThis.CSS=previousCss;}
}
for(const type of Object.keys(electricalComponentCatalog))for(const rotation of [0,90,180,270])for(const edge of [-10000,10000]){
  const component=moveElectricalComponent({...createElectricalComponent(type,1),rotation},edge,edge);
  const height=Math.max(80,32+Math.ceil(component.terminals.length/2)*22),r=rotation*Math.PI/180;
  for(const [x,y]of [[0,0],[120,0],[120,height],[0,height]]){
    const px=component.x+60+(x-60)*Math.cos(r)-(y-40)*Math.sin(r),py=component.y+40+(x-60)*Math.sin(r)+(y-40)*Math.cos(r);
    assert.ok(px>=-1e-6&&px<=2200+1e-6&&py>=-1e-6&&py<=1400+1e-6,`${type} at ${rotation}° stays inside canvas`);
  }
}
{
  const component=createElectricalComponent("pilotLamp",1,20,20),listeners={};
  let history=0,changes=0,focus=0;
  const head={dataset:{dragComponent:component.id},addEventListener:(name,handler)=>{listeners[name]=handler;},focus:()=>{focus++;}};
  const root={dataset:{},innerHTML:"",querySelector:(selector)=>selector.startsWith("[data-drag-component=")?head:null,querySelectorAll:(selector)=>selector==="[data-drag-component]"?[head]:[]};
  const previousCss=globalThis.CSS;
  globalThis.CSS={escape:value=>value};
  try {
    renderElectricalWorkspace(root,{tags:[],electrical:{components:[component],wires:[]}},{onBeforeChange:()=>history++,onChange:()=>changes++});
    const press=(key,shiftKey=false)=>listeners.keydown({key,shiftKey,preventDefault(){},stopPropagation(){}});
    press("ArrowRight");assert.equal(component.x,40,"arrow moves one grid step");
    press("ArrowDown",true);assert.equal(component.y,120,"Shift moves five grid steps");
    press("ArrowLeft",true);assert.equal(component.x,0,"keyboard movement stays inside the canvas origin");
    assert.equal(history,3,"each keyboard move records undo history");
    assert.equal(changes,3,"each keyboard move persists its change");
    assert.equal(focus,3,"focus returns to the moved component header");
    press("Enter");assert.equal(changes,3,"unrelated keys do not move components");
    listeners.click({detail:0});
    assert.equal(root.dataset.selectedComponent,component.id,"keyboard activation opens the component properties");
    assert.equal(changes,3,"keyboard selection does not mark the project changed");
    assert.equal(focus,4,"keyboard selection keeps focus on the component header");
  } finally { if(previousCss===undefined)delete globalThis.CSS;else globalThis.CSS=previousCss; }
}
for (const [type,allowed,rejected] of [["digitalInputModule4","Digital","Analog"],["analogInputModule2","Analog","Digital"]]) {
  const root={dataset:{},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};
  renderElectricalWorkspace(root,{tags:[{name:"Digital",type:"BOOL",role:"input"},{name:"Analog",type:"REAL",role:"input"}],electrical:{components:[createElectricalComponent(type,1)],wires:[]}});
  assert.ok(root.innerHTML.includes(`value="${allowed}"`),`${type} offers compatible tags`);
  assert.ok(!root.innerHTML.includes(`value="${rejected}"`),`${type} excludes incompatible tag types`);
}
for (const language of ["en","de","yo","pcm"]) for (const tripped of [false,true]) {
  const fuse={...createElectricalComponent("fuse",1),tripped};
  const root={dataset:{},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};
  renderElectricalWorkspace(root,{tags:[],electrical:{components:[fuse],wires:[]}},{language});
  assert.ok(root.innerHTML.includes('name="tripped"'),`${language} fuse properties render`);
  assert.equal(root.innerHTML.includes("checked disabled"),tripped,`${language} blown fuse cannot be reset`);
}
const helpGuide=readFileSync(new URL("../docs/HELP.md",import.meta.url),"utf8");
const userGuide=readFileSync(new URL("../docs/user-guide.md",import.meta.url),"utf8");
assert.match(electricalUiSource,/name="coilRef"/u,"auxiliary-contact properties expose a coil association control");
assert.match(electricalUiSource,/coilRef\)\)\.map/u,"linked auxiliary contacts are removed from manual input controls");
assert.match(electricalUiSource,/previousReference!==selected\.reference/u,"renaming a coil updates linked auxiliary contacts");
assert.equal((electricalUiSource.match(/coilLink:/gu)||[]).length,4,"coil association labels are localized in all supported languages");
assert.equal((electricalUiSource.match(/contactClosedState:"/gu)||[]).length,4,"live contact state labels are localized in all supported languages");
assert.equal((electricalUiSource.match(/fuseReplaceHint:"/gu)||[]).length,4,"fuse replacement guidance is localized in all supported languages");
assert.match(electricalUiSource,/selected\.tripped\?"checked disabled"/u,"blown fuses cannot be cleared from the property editor");
assert.ok(helpGuide.includes("delete and replace it")&&userGuide.includes("Blow fuse (manual test)"),"Help and user guide explain fuse replacement behavior");
assert.match(electricalUiSource,/data-contact-state=/u,"schematic controls expose computed open/closed contact state accessibly");

const supply = createElectricalComponent("supply24vdc",1,103,103);
const fuse = createElectricalComponent("fuse",1);
const blownFuse = updateElectricalComponentProperties(fuse,{tripped:true});
assert.equal(blownFuse.tripped,true,"the fuse test trip opens the replaceable fuse element");
assert.equal(updateElectricalComponentProperties(blownFuse,{tripped:false}).tripped,true,"a blown fuse stays open until it is replaced");
assert.equal(createElectricalComponent("fuse",2).tripped,false,"a newly added replacement fuse starts intact");
const button = {...createElectricalComponent("pushbuttonNO",1,220,103),tag:"Start"};
const lamp = {...createElectricalComponent("pilotLamp",1,340,103),tag:"Lamp"};
const diagram = {components:[supply,button,lamp],wires:[]};
for (const [from,to] of [
  [{componentId:supply.id,terminal:"+"},{componentId:button.id,terminal:"13"}],
  [{componentId:button.id,terminal:"14"},{componentId:lamp.id,terminal:"X1"}],
  [{componentId:lamp.id,terminal:"X2"},{componentId:supply.id,terminal:"−"}],
]) { const result = connectElectricalTerminals(diagram,from,to); assert.equal(result.ok,true); diagram.wires.push(result.wire); }

assert.ok(Object.keys(electricalComponentCatalog).length >= 25,"catalog covers generic PLC, controls, protection, motors, actuators, power, and wiring categories");
for(const [type,spec] of Object.entries(electricalComponentCatalog)) {
  assert.ok(spec.name?.trim() && spec.category?.trim() && spec.prefix?.trim(),`${type} has a user-facing name, category, and reference prefix`);
  assert.ok(Array.isArray(spec.terminals) && spec.terminals.length > 0,`${type} exposes at least one electrical terminal`);
  assert.equal(new Set(spec.terminals).size,spec.terminals.length,`${type} has unique terminal designations`);
  const component=createElectricalComponent(type,1);
  assert.deepEqual(component.terminals,spec.terminals,`${type} instance persists the catalog terminal layout`);
  assert.match(component.reference,new RegExp(`^${spec.prefix}\\d+$`),`${type} receives a reference designation`);
  for(const channels of Object.values(spec.channels||{}))for(const channel of channels)assert.ok(spec.terminals.some((pin)=>pin===channel||pin.startsWith(`${channel}+`)||pin.startsWith(`${channel}−`)),`${type} channel ${channel} maps to a declared terminal`);
  for(const pair of [...(spec.mainPairs||[]),...(spec.coil?[spec.coil]:[]),...(spec.auxNOPair?[spec.auxNOPair]:[]),...(spec.auxNCPair?[spec.auxNCPair]:[]),...Object.values(spec.positionPairs||{})])assert.ok(pair.every((pin)=>spec.terminals.includes(pin)),`${type} internal pair ${pair.join("/")} uses declared terminals`);
  assert.match(electricalSymbolSvg(component),/^<svg class="electrical-standard-symbol"[\s\S]*<\/svg>$/u,`${type} renders a named electrical schematic symbol`);
}
assert.notEqual(electricalSymbolSvg({...createElectricalComponent("pushbuttonNO",1),normallyClosed:false}),electricalSymbolSvg({...createElectricalComponent("pushbuttonNO",1),normallyClosed:true}),"editable contact behavior is reflected in its schematic symbol");
assert.notEqual(electricalSymbolSvg({...createElectricalComponent("circuitBreaker",1),closed:true}),electricalSymbolSvg({...createElectricalComponent("circuitBreaker",1),closed:false}),"breaker contact position is reflected in its schematic symbol");
assert.match(electricalSymbolSvg({...createElectricalComponent("fuse",1),tripped:true}),/FU · OPEN/u,"a tripped fuse is visibly open in the schematic");
assert.equal(button.x,220,"components snap to a 20-unit grid");
assert.equal(validateElectricalDiagram(diagram).some((issue) => issue.level === "error"),false,"wired generic circuit is structurally valid");
assert.equal(simulateElectricalDiagram(diagram,{Start:false}).energized[lamp.id],false,"open normally-open contact leaves lamp de-energized");
assert.equal(simulateElectricalDiagram(diagram,{Start:true}).energized[lamp.id],true,"closed contact completes supply-to-load paths");
assert.ok(simulateElectricalDiagram(diagram,{Start:true}).energizedWires.includes(diagram.wires[0].id),"supply-connected schematic wires are marked live for the animated conductor path");
assert.ok(!simulateElectricalDiagram(diagram,{Start:false}).energizedWires.includes(diagram.wires[1].id),"open contacts isolate downstream wires from the energized path");
const breaker=createElectricalComponent("circuitBreaker",1),fuseComponent=createElectricalComponent("fuse",1),protectionCircuit={components:[supply,breaker,fuseComponent,lamp],wires:[]};
for(const [from,to] of [[{componentId:supply.id,terminal:"+"},{componentId:breaker.id,terminal:"1"}],[{componentId:breaker.id,terminal:"2"},{componentId:fuseComponent.id,terminal:"1"}],[{componentId:fuseComponent.id,terminal:"2"},{componentId:lamp.id,terminal:"X1"}],[{componentId:lamp.id,terminal:"X2"},{componentId:supply.id,terminal:"−"}]]){const result=connectElectricalTerminals(protectionCircuit,from,to);assert.equal(result.ok,true);protectionCircuit.wires.push(result.wire);}
assert.equal(simulateElectricalDiagram(protectionCircuit,{}).energized[lamp.id],true,"closed generic protection devices pass the circuit path");breaker.closed=false;assert.equal(simulateElectricalDiagram(protectionCircuit,{}).energized[lamp.id],false,"opening the breaker property interrupts its wired load");breaker.closed=true;fuseComponent.tripped=true;assert.equal(simulateElectricalDiagram(protectionCircuit,{}).energized[lamp.id],false,"tripping the fuse property interrupts its wired load");
const selector=createElectricalComponent("selectorSwitch",1),selectorLampI=createElectricalComponent("pilotLamp",10),selectorLampII=createElectricalComponent("pilotLamp",11),selectorReturn=createElectricalComponent("junction",10),selectorCircuit={components:[supply,selector,selectorLampI,selectorLampII,selectorReturn],wires:[]};
for(const [from,to] of [[{componentId:supply.id,terminal:"+"},{componentId:selector.id,terminal:"11"}],[{componentId:selector.id,terminal:"12"},{componentId:selectorLampI.id,terminal:"X1"}],[{componentId:selector.id,terminal:"14"},{componentId:selectorLampII.id,terminal:"X1"}],[{componentId:selectorLampI.id,terminal:"X2"},{componentId:selectorReturn.id,terminal:"1"}],[{componentId:selectorLampII.id,terminal:"X2"},{componentId:selectorReturn.id,terminal:"2"}],[{componentId:selectorReturn.id,terminal:"3"},{componentId:supply.id,terminal:"−"}]]){const result=connectElectricalTerminals(selectorCircuit,from,to);assert.equal(result.ok,true,"SPDT selector terminals connect");selectorCircuit.wires.push(result.wire);}
const selectorIResult=simulateElectricalDiagram(selectorCircuit);assert.equal(selectorIResult.energized[selectorLampI.id],true,"selector position I connects common 11 to normally-closed terminal 12");assert.equal(selectorIResult.energized[selectorLampII.id],false,"selector position I isolates normally-open terminal 14");selector.selectorPosition="II";const selectorIIResult=simulateElectricalDiagram(selectorCircuit);assert.equal(selectorIIResult.energized[selectorLampI.id],false,"selector position II opens terminal 12");assert.equal(selectorIIResult.energized[selectorLampII.id],true,"selector position II connects common 11 to terminal 14");assert.equal(selectorIIResult.componentStates[selector.id].selectorPosition,"II","selector position is exposed in runtime state");assert.ok(validateElectricalDiagram(selectorCircuit).every((issue)=>issue.code!=="electrical-selector-position"),"supported selector positions pass diagram validation");selector.selectorPosition="III";assert.ok(validateElectricalDiagram(selectorCircuit).some((issue)=>issue.code==="electrical-selector-position"),"unsupported selector positions are rejected");
assert.match(electricalUiSource,/name="selectorPosition"/u,"selector position is editable in the component inspector");assert.equal((electricalUiSource.match(/selectorPosition:/gu)||[]).length,4,"selector positions are described in all four supported locales");
const legacySelector={...structuredClone(selector),terminals:["13","14"]},legacySelectorDiagram={components:[supply,legacySelector,selectorLampII,selectorReturn],wires:selectorCircuit.wires.filter((wire)=>![wire.from,wire.to].some((endpoint)=>(endpoint.componentId===selector.id&&endpoint.terminal==="12")||endpoint.componentId===selectorLampI.id)).map((wire)=>({ ...wire,from:{...wire.from,terminal:wire.from.componentId===selector.id&&wire.from.terminal==="11"?"13":wire.from.terminal},to:{...wire.to,terminal:wire.to.componentId===selector.id&&wire.to.terminal==="11"?"13":wire.to.terminal} })),inputStates:{SA1:true}};
const migratedSelector=normalizeImportedProject({name:"Legacy selector migration",rungs:[],tags:[],electrical:legacySelectorDiagram}),migratedSelectorComponent=migratedSelector.electrical.components.find((item)=>item.id===selector.id);assert.deepEqual(migratedSelectorComponent.terminals,["11","12","14"],"legacy selector imports upgrade to the SPDT terminal layout");assert.equal(migratedSelectorComponent.selectorPosition,"II","legacy active input preserves its prior closed-contact state");assert.equal(simulateElectricalDiagram(migratedSelector.electrical).energized[selectorLampII.id],true,"a migrated active selector still energizes its previously wired load");
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
const relaySupply=createElectricalComponent("supply24vdc",20),relay=createElectricalComponent("relayCoil",20),linkedNO={...createElectricalComponent("auxiliaryNO",21),coilRef:relay.reference},relayLamp=createElectricalComponent("pilotLamp",20),positiveRail=createElectricalComponent("dcPowerRail",20),negativeRail=createElectricalComponent("dcPowerRail",21),relayCircuit={components:[relaySupply,relay,linkedNO,relayLamp,positiveRail,negativeRail],wires:[]};
for(const [from,to] of [[{componentId:relaySupply.id,terminal:"+"},{componentId:positiveRail.id,terminal:"1"}],[{componentId:positiveRail.id,terminal:"2"},{componentId:relay.id,terminal:"A1"}],[{componentId:positiveRail.id,terminal:"3"},{componentId:linkedNO.id,terminal:"13"}],[{componentId:relay.id,terminal:"A2"},{componentId:negativeRail.id,terminal:"1"}],[{componentId:relaySupply.id,terminal:"−"},{componentId:negativeRail.id,terminal:"2"}],[{componentId:linkedNO.id,terminal:"14"},{componentId:relayLamp.id,terminal:"X1"}],[{componentId:relayLamp.id,terminal:"X2"},{componentId:negativeRail.id,terminal:"3"}]]){const result=connectElectricalTerminals(relayCircuit,from,to);assert.equal(result.ok,true,"relay circuit terminals connect");relayCircuit.wires.push(result.wire);}
const energizedRelayResult=simulateElectricalDiagram(relayCircuit);assert.equal(energizedRelayResult.energized[relayLamp.id],true,"linked NO auxiliary contact closes when its relay coil is powered");assert.equal(energizedRelayResult.componentStates[relay.id].energized,true,"relay coil retains its load energized state alongside its coil state");assert.equal(energizedRelayResult.componentStates[linkedNO.id].contactClosed,true,"linked contact exposes its computed closed position");assert.notEqual(electricalSymbolSvg({...linkedNO,...energizedRelayResult.componentStates[linkedNO.id]}),electricalSymbolSvg({...linkedNO,contactClosed:false}),"NO contact symbol changes blade position with relay state");
const deenergizedRelay=structuredClone(relayCircuit);deenergizedRelay.wires=deenergizedRelay.wires.filter((wire)=>![wire.from,wire.to].some((endpoint)=>endpoint.componentId===relay.id&&endpoint.terminal==="A1"));const deenergizedRelayResult=simulateElectricalDiagram(deenergizedRelay);assert.equal(deenergizedRelayResult.energized[relayLamp.id],false,"linked NO auxiliary contact opens when its relay coil is de-energized");assert.equal(deenergizedRelayResult.componentStates[linkedNO.id].contactClosed,false,"linked contact exposes its computed open position");
const relayB=createElectricalComponent("relayCoil",21),relayAContact={...createElectricalComponent("auxiliaryNO",22),coilRef:relay.reference},relayCascade={components:[relaySupply,relay,relayAContact,relayB,positiveRail,negativeRail],wires:[]};
for(const [from,to] of [[{componentId:relaySupply.id,terminal:"+"},{componentId:positiveRail.id,terminal:"1"}],[{componentId:positiveRail.id,terminal:"2"},{componentId:relay.id,terminal:"A1"}],[{componentId:relay.id,terminal:"A2"},{componentId:negativeRail.id,terminal:"1"}],[{componentId:positiveRail.id,terminal:"3"},{componentId:relayAContact.id,terminal:"13"}],[{componentId:relayAContact.id,terminal:"14"},{componentId:relayB.id,terminal:"A1"}],[{componentId:relayB.id,terminal:"A2"},{componentId:negativeRail.id,terminal:"2"}],[{componentId:relaySupply.id,terminal:"−"},{componentId:negativeRail.id,terminal:"3"}]]){const result=connectElectricalTerminals(relayCascade,from,to);assert.equal(result.ok,true,"cascaded relay terminals connect");relayCascade.wires.push(result.wire);}
assert.equal(simulateElectricalDiagram(relayCascade).componentStates[relayB.id].coilEnergized,true,"cascaded coil state settles through linked auxiliary contacts");
const invalidRelay=structuredClone(relayCircuit);invalidRelay.components.find((component)=>component.type==="auxiliaryNO").coilRef="K999";assert.ok(validateElectricalDiagram(invalidRelay).some((issue)=>issue.code==="electrical-coil-reference"),"an auxiliary contact cannot reference a missing coil");
const roundTrippedRelay=normalizeImportedProject({name:"Relay contact persistence",rungs:[],tags:[],electrical:JSON.parse(JSON.stringify(relayCircuit))});assert.equal(roundTrippedRelay.electrical.components.find((component)=>component.type==="auxiliaryNO").coilRef,relay.reference,"coil association survives validated project import");
assert.throws(()=>normalizeImportedProject({name:"Invalid relay contact",rungs:[],tags:[],electrical:invalidRelay}),/missing or unsupported coil/u,"project import rejects broken coil associations");
const shortedSupply=createElectricalComponent("supply24vdc",3),shortJunction=createElectricalComponent("junction",1),shortedLamp=createElectricalComponent("pilotLamp",2),shortedCircuit={components:[shortedSupply,shortJunction,shortedLamp],wires:[]};
for(const [from,to] of [[{componentId:shortedSupply.id,terminal:"+"},{componentId:shortJunction.id,terminal:"1"}],[{componentId:shortedSupply.id,terminal:"−"},{componentId:shortJunction.id,terminal:"2"}],[{componentId:shortJunction.id,terminal:"3"},{componentId:shortedLamp.id,terminal:"X1"}],[{componentId:shortJunction.id,terminal:"4"},{componentId:shortedLamp.id,terminal:"X2"}]]){const result=connectElectricalTerminals(shortedCircuit,from,to);assert.equal(result.ok,true);shortedCircuit.wires.push(result.wire);}
const shortResult=simulateElectricalDiagram(shortedCircuit,{});assert.equal(shortResult.energized[shortedLamp.id],false,"a load across shorted DC supply poles is de-energized");assert.ok(shortResult.faults.some((issue)=>issue.code==="electrical-source-short"),"shorted supply poles are reported as a simulation fault");assert.equal(electricalSimulationStatus(shortResult,shortedCircuit.components,{on:"On",off:"Off"}).includes("source poles are shorted"),true,"runtime simulation faults are surfaced to the schematic status message");assert.equal(shortResult.warnings.some((issue)=>issue.level==="error"),false,"simulation faults stay separate from non-fatal schematic warnings");
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
const floatingPlcIssues=validateElectricalDiagram({components:[mappedPlc],wires:[]},[{name:"Start",role:"input",type:"BOOL"}]).filter((issue)=>issue.code==="electrical-floating-terminal");
assert.ok(floatingPlcIssues.some((issue)=>issue.message.includes("terminal I1 ")),"a mapped PLC channel without a wire remains a visible warning");
assert.ok(floatingPlcIssues.some((issue)=>issue.message.includes("terminal PE ")),"an unconnected PLC protective-earth terminal remains a visible warning");
assert.equal(floatingPlcIssues.some((issue)=>issue.message.includes("terminal I3 ")||issue.message.includes("terminal Q4 ")),false,"unmapped spare PLC channels do not appear as wiring warnings");
const railOnly=createElectricalComponent("dcPowerRail",1);
assert.equal(validateElectricalDiagram({components:[railOnly],wires:[]}).some((issue)=>issue.code==="electrical-floating-terminal"),false,"unused distribution rail taps are not reported as floating device terminals");
const generatedElectrical=createExampleElectricalDiagram([{name:"Start",type:"BOOL",role:"input",address:"I0.0"},{name:"Lamp",type:"BOOL",role:"output",address:"Q0.0"}],{inputs:["Start"],outputs:["Lamp"]});
assert.equal(validateElectricalDiagram(generatedElectrical,[{name:"Start",type:"BOOL",role:"input"},{name:"Lamp",type:"BOOL",role:"output"}]).some((issue)=>issue.code==="electrical-floating-terminal"),false,"generated example schematics connect the PLC earth and omit warnings for unused channels and rail taps");
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

