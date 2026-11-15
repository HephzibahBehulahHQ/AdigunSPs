import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { connectElectricalTerminals, createElectricalComponent, createExampleElectricalDiagram, duplicateElectricalComponent, electricalComponentBounds, electricalComponentCatalog, moveElectricalComponent, nextElectricalReference, replaceElectricalComponent, rewireElectricalTerminal, rotateElectricalComponent, simulateElectricalDiagram, updateElectricalComponentProperties, validateElectricalDiagram } from "../src/electrical.js";
import { validateProject } from "../src/validation.js";
import { electricalSimulationStatus, electricalSymbolSvg, electricalWirePath, renderElectricalWorkspace } from "../src/electrical-ui.js";
import { makeProjectFromExample, scan } from "../src/engine.js";
import { examples } from "../src/examples.js";
import { normalizeImportedProject } from "../src/project-import.js";

const electricalUiSource=readFileSync(new URL("../src/electrical-ui.js",import.meta.url),"utf8");
{
  const collisions=[];
  for(const example of examples){
    const project=makeProjectFromExample(example),components=project.electrical.components;
    const bounds=components.map(electricalComponentBounds);
    for(let first=0;first<components.length;first++)for(let second=first+1;second<components.length;second++){
      const a=bounds[first],b=bounds[second];
      if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)collisions.push(`${example.id} ${example.title.en}: ${components[first].reference} / ${components[second].reference}`);
    }
  }
  assert.deepEqual(collisions,[],"all generated example schematics place component cards without overlap");
}

{
  const source=createElectricalComponent("supply24vdc",1,80,200),destination=createElectricalComponent("supply24vdc",2,520,200),obstacle=createElectricalComponent("pilotLamp",1,300,200);
  const wire={from:{componentId:source.id,terminal:"+"},to:{componentId:destination.id,terminal:"−"}};
  assert.equal(electricalWirePath(wire,[source,destination,obstacle]),"M80 232L80 180L640 180L640 232","an automatic cable takes a clear corridor around an unrelated component instead of crossing its card");
}
{
  const source=createElectricalComponent("supply24vdc",1,20,200),destination=createElectricalComponent("supply24vdc",2,1000,200),obstacles=[];
  for(const x of [160,280])for(const y of [0,80,160])obstacles.push(createElectricalComponent("pilotLamp",obstacles.length+1,x,y));
  for(const x of [440,560,680])for(const y of [240,320,400,480,560])obstacles.push(createElectricalComponent("pilotLamp",obstacles.length+1,x,y));
  const wire={from:{componentId:source.id,terminal:"+"},to:{componentId:destination.id,terminal:"−"}};
  const path=electricalWirePath(wire,[source,destination,...obstacles]);
  assert.ok(path,"automatic routing finds a path through a multi-wall component maze");
  const points=[...path.matchAll(/[ML](-?[0-9.]+) (-?[0-9.]+)/gu)].map((match)=>({x:Number(match[1]),y:Number(match[2])}));
  assert.ok(points.length>=4,"the grid route adds multiple orthogonal segments");
  const bounds=obstacles.map(item=>({left:item.x,top:item.y,right:item.x+120,bottom:item.y+80})),segments=points.slice(1).map((point,index)=>[points[index],point]);
  for(const [first,second] of segments)for(const box of bounds){
    const crossing=first.y===second.y?first.y>box.top-12&&first.y<box.bottom+12&&Math.max(Math.min(first.x,second.x),box.left-12)<Math.min(Math.max(first.x,second.x),box.right+12):first.x>box.left-12&&first.x<box.right+12&&Math.max(Math.min(first.y,second.y),box.top-12)<Math.min(Math.max(first.y,second.y),box.bottom+12);
    assert.equal(crossing,false,"automatic maze routing never crosses an unrelated component");
  }
}
{
  const psu=createElectricalComponent("sitopPSU100C",1),sensor=createElectricalComponent("ifmPN2070",1);
  assert.deepEqual(psu.terminals,["L","N","PE","+","−A","−B"]);
  assert.equal(psu.manufacturer,"Siemens");assert.equal(psu.partNumber,"6EP1332-5BA00");assert.equal(psu.ratedCurrentA,2.5);assert.equal(electricalComponentCatalog[psu.type].kind,"power-converter");assert.equal(electricalComponentCatalog[psu.type].nominalVoltageV,24);
  assert.deepEqual(sensor.terminals,["1","2","4","3"]);
  assert.equal(sensor.manufacturer,"ifm");assert.equal(sensor.partNumber,"PN-400-SER14-MFRKG/USI /V");
  const diagram={components:[psu,sensor],wires:[]};
  const connected=connectElectricalTerminals(diagram,{componentId:psu.id,terminal:"+"},{componentId:sensor.id,terminal:"1"},[{x:240,y:160},{x:360,y:160}]);
  assert.equal(connected.ok,true,"source-backed device pins support real endpoint connections");
  assert.deepEqual(connected.wire.waypoints,[{x:240,y:160},{x:360,y:160}]);
  assert.match(electricalWirePath(connected.wire,diagram.components),/L240 160L360 160/u,"manual route bends are rendered in order");
  assert.equal(connectElectricalTerminals(diagram,{componentId:psu.id,terminal:"N"},{componentId:sensor.id,terminal:"2"},[{x:2201,y:20}]).ok,false,"route points outside the board are rejected");
  diagram.wires.push(connected.wire);
  assert.ok(!validateElectricalDiagram(diagram).some((issue)=>issue.level==="error"));
  assert.match(electricalSymbolSvg(psu),/SITOP PSU100C/);assert.match(electricalSymbolSvg(sensor),/PN2070/);
  const root={dataset:{selectedComponent:sensor.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};
  renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of [...psu.terminals,...sensor.terminals])assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`${pin} is rendered as an individually connectable pin`);
  assert.match(root.innerHTML,/data-terminal="−A"[^>]*aria-label="PS1 terminal − \(−A\): 0 V DC output terminal \(first of two\)"/u,"first negative output shows its physical mark and distinct internal identity");
  assert.match(root.innerHTML,/data-terminal="−A"[^>]*>−<\/button>/u,"first negative output is visibly marked minus");
  assert.match(root.innerHTML,/data-terminal="−B"[^>]*aria-label="PS1 terminal − \(−B\): 0 V DC output terminal \(second of two\)"/u,"second negative output shows its physical mark and distinct internal identity");
  assert.match(root.innerHTML,/data-terminal="−B"[^>]*>−<\/button>/u,"second negative output is visibly marked minus");
  assert.ok(root.innerHTML.includes("ifm PN2070 data sheet"));
  assert.ok(root.innerHTML.includes("OUT1/IO-Link, pressure physics, accuracy, response and faults are not simulated"));
  const imported=normalizeImportedProject({name:"Routed schematic",rungs:[],tags:[],electrical:diagram});
  assert.deepEqual(imported.electrical.wires[0].waypoints,connected.wire.waypoints,"waypoints survive project import normalization");
  assert.match(electricalUiSource,/Click the canvas to add route bends/u);
}
{
  const supply=createElectricalComponent("supply24vdc",1),sensor=createElectricalComponent("ifmPN2070",1),module=createElectricalComponent("analogInputModule2",1),common=createElectricalComponent("junction",1),diagram={components:[supply,sensor,module,common],wires:[]};
  sensor.tag="Pressure";module.ioMap.AI1={tag:"Pressure",address:"IW0"};
  const wire=(a,at,b,bt)=>{const result=connectElectricalTerminals(diagram,{componentId:a.id,terminal:at},{componentId:b.id,terminal:bt});assert.equal(result.ok,true,`${a.reference}.${at} connects to ${b.reference}.${bt}`);diagram.wires.push(result.wire);};
  wire(supply,"+",sensor,"1");wire(sensor,"2",module,"AI1+");wire(sensor,"3",common,"1");wire(supply,"−",common,"2");wire(module,"AI1−",common,"3");
  assert.equal(simulateElectricalDiagram(diagram,{Pressure:250}).inputs.Pressure,250,"a powered PN2070 OUT2 pin 2 carries the tagged scalar pressure to an analog input");
  assert.ok(!validateElectricalDiagram(diagram,[{name:"Pressure",type:"REAL",role:"input"}]).some((issue)=>issue.level==="error"),"the sensor pressure tag maps to a valid analog input tag");
  const noPower=structuredClone(diagram);noPower.wires=noPower.wires.filter((item)=>!(item.from.componentId===supply.id&&item.from.terminal==="+")&&!(item.to.componentId===supply.id&&item.to.terminal==="+"));
  assert.equal(simulateElectricalDiagram(noPower,{Pressure:250}).inputs.Pressure,0,"the PN2070 cannot emit its analog signal without DC sensor power");
  const lowVoltage=structuredClone(diagram);lowVoltage.components.find((item)=>item.id===supply.id).nominalVoltageV=12;
  assert.equal(simulateElectricalDiagram(lowVoltage,{Pressure:250}).inputs.Pressure,0,"the PN2070 refuses a supply below its documented 18 V minimum");
  const mains=createElectricalComponent("singlePhaseSupply",2),acDiagram={components:[mains,sensor,module,common],wires:[]};
  for(const [a,at,b,bt] of [[mains,"L",sensor,"1"],[sensor,"2",module,"AI1+"],[sensor,"3",common,"1"],[mains,"N",common,"2"],[module,"AI1−",common,"3"]]){const result=connectElectricalTerminals(acDiagram,{componentId:a.id,terminal:at},{componentId:b.id,terminal:bt});assert.equal(result.ok,true);acDiagram.wires.push(result.wire);}
  assert.equal(simulateElectricalDiagram(acDiagram,{Pressure:250}).inputs.Pressure,0,"an AC supply cannot satisfy the PN2070's documented DC power requirement");
}
{
  const mains=createElectricalComponent("singlePhaseSupply",1),psu=createElectricalComponent("sitopPSU100C",1),lamp={...createElectricalComponent("pilotLamp",1),tag:"Lamp"},diagram={components:[mains,psu,lamp],wires:[]};
  const wire=(a,at,b,bt)=>{const result=connectElectricalTerminals(diagram,{componentId:a.id,terminal:at},{componentId:b.id,terminal:bt});assert.equal(result.ok,true,`${a.reference}.${at} connects to ${b.reference}.${bt}`);diagram.wires.push(result.wire);};
  wire(mains,"L",psu,"L");wire(mains,"N",psu,"N");wire(mains,"PE",psu,"PE");wire(psu,"+",lamp,"X1");wire(lamp,"X2",psu,"−B");
  assert.equal(simulateElectricalDiagram(diagram).energized[lamp.id],true,"the sourced SITOP produces its documented 24 V DC output from wired line and neutral paths");
  const noLine=structuredClone(diagram);noLine.wires=noLine.wires.filter((item)=>!(item.from.componentId===mains.id&&item.from.terminal==="L")&&!(item.to.componentId===mains.id&&item.to.terminal==="L"));
  assert.equal(simulateElectricalDiagram(noLine).energized[lamp.id],false,"the SITOP output is disabled when mains line is disconnected");
  const noNeutral=structuredClone(diagram);noNeutral.wires=noNeutral.wires.filter((item)=>!(item.from.componentId===mains.id&&item.from.terminal==="N")&&!(item.to.componentId===mains.id&&item.to.terminal==="N"));
  assert.equal(simulateElectricalDiagram(noNeutral).energized[lamp.id],false,"the SITOP output is disabled when mains neutral is disconnected");
}
{
  const supplyA=createElectricalComponent("supply24vdc",1),supplyB=createElectricalComponent("supply24vdc",2,360,120),supplyC=createElectricalComponent("supply24vdc",3,600,120),lamp=createElectricalComponent("pilotLamp",1,840,120),diagram={components:[supplyA,supplyB,supplyC,lamp],wires:[]};
  const first=connectElectricalTerminals(diagram,{componentId:supplyA.id,terminal:"+"},{componentId:lamp.id,terminal:"X1"},[{x:420,y:340}]);assert.equal(first.ok,true);diagram.wires.push(first.wire);
  const busy=connectElectricalTerminals(diagram,{componentId:supplyC.id,terminal:"+"},{componentId:supplyB.id,terminal:"−"});assert.equal(busy.ok,true);diagram.wires.push(busy.wire);
  const moved=rewireElectricalTerminal(diagram,first.wire.id,"from",{componentId:supplyB.id,terminal:"+"});assert.equal(moved.ok,true,"a connected cable can be moved to another free component terminal");assert.equal(moved.wire.id,first.wire.id,"rewiring preserves the existing cable identity");assert.deepEqual(moved.wire.waypoints,[{x:420,y:340}],"rewiring preserves all manually routed bends");
  assert.equal(rewireElectricalTerminal({...diagram,wires:[moved.wire,...diagram.wires.slice(1)]},first.wire.id,"from",{componentId:supplyC.id,terminal:"+"}).ok,false,"an occupied terminal cannot be double-wired");
  assert.equal(rewireElectricalTerminal(diagram,first.wire.id,"from",{componentId:supplyB.id,terminal:"missing"}).ok,false,"rewiring rejects nonexistent device terminals");
  assert.equal(rewireElectricalTerminal(diagram,"missing-wire","from",{componentId:supplyB.id,terminal:"+"}).ok,false,"rewiring requires an existing completed cable");
}
{
  const contactor=createElectricalComponent("siemensSirius3RT20171WB41",1),expected=["1/L1","3/L2","5/L3","13","A1+","2/T1","4/T2","6/T3","14","A2−"];
  assert.equal(contactor.manufacturer,"Siemens");assert.equal(contactor.partNumber,"3RT2017-1WB41");assert.deepEqual(contactor.terminals,expected);
  assert.equal(electricalComponentCatalog[contactor.type].kind,"contactor");assert.deepEqual(electricalComponentCatalog[contactor.type].mainPairs,[["1/L1","2/T1"],["3/L2","4/T2"],["5/L3","6/T3"]]);assert.deepEqual(electricalComponentCatalog[contactor.type].coil,["A1+","A2−"]);assert.deepEqual(electricalComponentCatalog[contactor.type].auxNOPair,["13","14"]);
  const diagram={components:[contactor,createElectricalComponent("pilotLamp",1,360,120)],wires:[]};
  for(const pin of expected){const peer=createElectricalComponent("terminal",diagram.components.length,600,120+diagram.wires.length*120);diagram.components.push(peer);const result=connectElectricalTerminals(diagram,{componentId:contactor.id,terminal:pin},{componentId:peer.id,terminal:"1"});assert.equal(result.ok,true,`${pin} is a connectable manufacturer terminal`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:contactor.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of expected)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`${pin} is displayed as its own terminal`);
  assert.ok(root.innerHTML.includes("Siemens SIRIUS 3RT2017-1WB41 data sheet"));
  assert.ok(root.innerHTML.includes("20.4–44.4 V"));
  assert.match(electricalSymbolSvg(contactor),/3RT20 · 3 NO/);
  const makeCircuit=(coilSupplyType="supply24vdc",coilVoltage=null,coilConnected=true)=>{
    const source=createElectricalComponent("supply3phase",1),dc=createElectricalComponent(coilSupplyType,2),starter=createElectricalComponent(contactor.type,2),motor=createElectricalComponent("threePhaseMotor",1),circuit={components:[source,dc,starter,motor],wires:[]};
    if(coilVoltage!==null)dc.nominalVoltageV=coilVoltage;
    const wire=(from,fromPin,to,toPin)=>{const result=connectElectricalTerminals(circuit,{componentId:from.id,terminal:fromPin},{componentId:to.id,terminal:toPin});assert.equal(result.ok,true,`${from.reference}.${fromPin} connects to ${to.reference}.${toPin}`);circuit.wires.push(result.wire);};
    for(const [phase,input,output,motorPin] of [["L1","1/L1","2/T1","U1"],["L2","3/L2","4/T2","V1"],["L3","5/L3","6/T3","W1"]]){wire(source,phase,starter,input);wire(starter,output,motor,motorPin);}
    if(coilConnected){wire(dc,coilSupplyType==="singlePhaseSupply"?"L":"+",starter,"A1+");wire(dc,coilSupplyType==="singlePhaseSupply"?"N":"−",starter,"A2−");}
    return {circuit,starter,motor};
  };
  const valid=makeCircuit("supply24vdc",null,false);assert.equal(simulateElectricalDiagram(valid.circuit).energized[valid.motor.id],false,"open contactor poles isolate the three-phase motor before the coil is powered");
  const closedCircuit=makeCircuit(),closed=simulateElectricalDiagram(closedCircuit.circuit);assert.equal(closed.componentStates[closedCircuit.starter.id].coilEnergized,true,"the 24 V DC coil energizes from the connected rated DC source");assert.equal(closed.componentStates[closedCircuit.starter.id].mainContactsClosed,true);assert.equal(closed.energized[closedCircuit.motor.id],true,"the three main poles connect all three phases to the motor");
  assert.notEqual(electricalSymbolSvg({...closedCircuit.starter,...closed.componentStates[closedCircuit.starter.id]}),electricalSymbolSvg({...closedCircuit.starter,mainContactsClosed:false}),"the contactor symbol shows its simulated pole position");
  for(const voltage of [12,48]){const outOfRange=makeCircuit("supply24vdc",voltage),result=simulateElectricalDiagram(outOfRange.circuit);assert.equal(result.componentStates[outOfRange.starter.id].coilEnergized,false,`${voltage} V DC lies outside the documented coil range`);assert.equal(result.energized[outOfRange.motor.id],false);}
  const acCoil=makeCircuit("singlePhaseSupply"),acResult=simulateElectricalDiagram(acCoil.circuit);assert.equal(acResult.componentStates[acCoil.starter.id].coilEnergized,false,"230 V AC cannot energize the documented 24 V DC coil model");assert.equal(acResult.energized[acCoil.motor.id],false);
}
{
  const component=createElectricalComponent("pilotLamp",1,120,120);
  assert.deepEqual([moveElectricalComponent(component,137,143).x,moveElectricalComponent(component,137,143).y],[140,140],"component movement snaps to the grid by default");
  assert.deepEqual([moveElectricalComponent(component,137,143,{snap:false}).x,moveElectricalComponent(component,137,143,{snap:false}).y],[137,143],"the explicit snap-off view state permits pixel movement");
}
{
  const supply=createElectricalComponent("supply24vdc",1),lamp=createElectricalComponent("pilotLamp",1,600,120),wireActions={},terminalActions={},boardActions={},handleActions={},pathAttributes={},resumeActions={};
  const handle={dataset:{wireWaypoint:"",waypointIndex:"0"},setAttribute:(name,value)=>pathAttributes[`handle:${name}`]=value,addEventListener:(name,handler)=>handleActions[name]=handler};
  const resumeEnd={dataset:{resumeWire:""},addEventListener:(name,handler)=>resumeActions[name]=handler};
  const wireSelect={dataset:{selectWire:""},addEventListener:(name,handler)=>wireActions[`select:${name}`]=handler};
  const rewireFrom={dataset:{electricalAction:"rewire-from"},addEventListener:(name,handler)=>wireActions[`rewire-from:${name}`]=handler},rewireTo={dataset:{electricalAction:"rewire-to"},addEventListener:(name,handler)=>wireActions[`rewire-to:${name}`]=handler};
  const board={getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},addEventListener:(name,handler)=>boardActions[name]=handler,querySelector:(selector)=>selector.startsWith("[data-wire-id=")?{setAttribute:(name,value)=>pathAttributes[name]=value}:selector.startsWith("[data-wire-waypoint=")?handle:null};
  const wireButton={dataset:{electricalAction:"wire"},addEventListener:(name,handler)=>wireActions[name]=handler};
  const pins=[{dataset:{terminalComponent:supply.id,terminal:"+"},addEventListener:(name,handler)=>terminalActions.from=handler},{dataset:{terminalComponent:lamp.id,terminal:"X1"},addEventListener:(name,handler)=>terminalActions.to=handler}];
  const root={dataset:{},innerHTML:"",querySelector:(selector)=>selector==="#electricalBoard"?board:null,querySelectorAll:(selector)=>selector==="[data-electrical-action]"?[wireButton,rewireFrom,rewireTo]:selector==="[data-terminal-component]"?pins:selector==="[data-select-wire]"?[wireSelect]:selector==="[data-wire-waypoint]"?[handle]:selector==="[data-resume-wire]"?[resumeEnd]:[]};
  const diagram={components:[supply,lamp],wires:[]};
  const previousCSS=globalThis.CSS;globalThis.CSS={escape:value=>value};
  renderElectricalWorkspace(root,{tags:[],electrical:diagram});wireActions.click();terminalActions.from();boardActions.click({clientX:240,clientY:200,target:{closest:()=>null}});terminalActions.to();
  assert.deepEqual(diagram.wires[0].waypoints,[{x:240,y:200}],"clicking the canvas adds a visible persistent bend between connected terminals");
  assert.ok(root.innerHTML.includes("L240 200"),"the completed connection displays the user-drawn route");
  wireSelect.dataset.selectWire=diagram.wires[0].id;handle.dataset.wireWaypoint=diagram.wires[0].id;wireActions["select:click"]();handleActions.pointerdown({button:0,pointerId:4,preventDefault(){},stopPropagation(){}});boardActions.pointermove({clientX:320,clientY:280});boardActions.pointerup();
  assert.deepEqual(diagram.wires[0].waypoints,[{x:320,y:280}],"selected wire bends can be dragged to new canvas positions");
  handleActions.keydown({key:"Delete",preventDefault(){}});assert.equal(diagram.wires[0].waypoints.length,0,"route bends can be removed from the keyboard");
  wireSelect.dataset.selectWire=diagram.wires[0].id;wireActions["select:click"]();assert.ok(root.innerHTML.includes("Reconnect start"),"selected wires expose an explicit endpoint-reconnect action");wireActions["rewire-from:click"]();pins[0].dataset.terminal="−";terminalActions.from();assert.equal(diagram.wires[0].from.terminal,"−","the selected cable can be reconnected to a different free terminal");
  pins[0].dataset.terminal="+";pins[1].dataset.terminal="X2";wireActions.click();terminalActions.from();boardActions.click({clientX:420,clientY:340,target:{closest:()=>null}});wireActions.click();
  const paused=diagram.wires.find((wire)=>wire.draft);assert.ok(paused,"the existing Connect wire control pauses and persists an unfinished cable");assert.ok(root.innerHTML.includes("electrical-wire-draft-end"),"the paused cable exposes a visible free-end resume handle");assert.ok(!validateElectricalDiagram(diagram).some((issue)=>issue.level==="error"),"a paused cable is not mistaken for a broken complete connection");assert.equal(simulateElectricalDiagram(diagram).energized[lamp.id],false,"paused draft cables are excluded from simulated connectivity");
  const pausedImport=normalizeImportedProject({name:"Paused wire",rungs:[],tags:[],electrical:diagram});assert.equal(pausedImport.electrical.wires.find((wire)=>wire.draft).waypoints[0].x,420,"paused routes survive project import normalization");
  wireActions.click();resumeEnd.dataset.resumeWire=paused.id;resumeActions.click();terminalActions.to();assert.ok(!diagram.wires.some((wire)=>wire.draft),"resuming to a destination terminal completes and replaces the draft cable");assert.deepEqual(diagram.wires.find((wire)=>wire.from.terminal==="+").waypoints,[{x:420,y:340}],"resume preserves the hand-drawn path");
  if(previousCSS===undefined)delete globalThis.CSS;else globalThis.CSS=previousCSS;
}
{
  const component=createElectricalComponent("pilotLamp",1,200,200),headEvents={},cardEvents={},boardEvents={};
  const source=createElectricalComponent("supply24vdc",1,600,200),wire={id:"drag-wire",from:{componentId:component.id,terminal:"X1"},to:{componentId:source.id,terminal:"+"}},wireAttributes={};
  const originalEndpoints=structuredClone(wire);
  let capturedPointer=null;
  const head={dataset:{dragComponent:component.id},addEventListener:(name,handler)=>headEvents[name]=handler,setPointerCapture(){}};
  const card={dataset:{componentId:component.id},style:{},addEventListener:(name,handler)=>cardEvents[name]=handler};
  const board={getBoundingClientRect:()=>({left:-300,top:-200}),setPointerCapture:id=>capturedPointer=id,addEventListener:(name,handler)=>boardEvents[name]=handler,querySelector:s=>s.startsWith("[data-wire-id=")?{setAttribute:(name,value)=>wireAttributes[name]=value}:card};
  const root={dataset:{},innerHTML:"",querySelector:s=>s==="#electricalBoard"?board:null,querySelectorAll:s=>s==="[data-drag-component]"?[head]:s===".electrical-component"?[card]:[]};
  const previousCss=globalThis.CSS;globalThis.CSS={escape:value=>value};
  try{
    renderElectricalWorkspace(root,{tags:[],electrical:{components:[component,source],wires:[wire]}});
    cardEvents.pointerdown({button:0,clientX:-80,clientY:10,pointerId:1,target:{closest:()=>null},preventDefault(){}});
    assert.equal(capturedPointer,1,"the board captures drag pointers so move events reach the editor canvas");
    boardEvents.pointermove({clientX:-80,clientY:10});
    assert.deepEqual([component.x,component.y],[200,200],"drag starts without jumping on a scrolled canvas");
    boardEvents.pointermove({clientX:-40,clientY:70});
    assert.deepEqual([component.x,component.y],[240,260],"drag follows pointer delta without double-counting canvas scroll");
    assert.equal(wireAttributes.d,"M240 292H420V232H600","wire geometry follows the component before pointer release");
    assert.deepEqual(wire,originalEndpoints,"drag preserves terminal connectivity");
    boardEvents.pointermove({clientX:320,clientY:10});
    assert.deepEqual([component.x,component.y],[600,200],"drag may pass across another component on the way to an open position");
    boardEvents.pointermove({clientX:520,clientY:10});
    assert.deepEqual([component.x,component.y],[800,200],"drag reaches an open position beyond the intervening component");
    boardEvents.pointerup();
    assert.deepEqual([component.x,component.y],[800,200],"a clear destination is committed after crossing the intervening component");
    cardEvents.pointerdown({button:0,clientX:520,clientY:10,pointerId:2,target:{closest:()=>null},preventDefault(){}});
    boardEvents.pointermove({clientX:620,clientY:10});
    boardEvents.pointercancel();
    boardEvents.pointermove({clientX:100,clientY:200});
    assert.deepEqual([component.x,component.y],[800,200],"cancelled touch drag restores the last saved position and ignores later pointer motion");
  }finally{if(previousCss===undefined)delete globalThis.CSS;else globalThis.CSS=previousCss;}
}
{
  const component=createElectricalComponent("pilotLamp",1,200,200),obstacleAhead=createElectricalComponent("pilotLamp",2,280,260),obstacleBehind=createElectricalComponent("pilotLamp",3,140,200),events={},card={dataset:{componentId:""},style:{},addEventListener:(name,handler)=>events[`card:${name}`]=handler};card.dataset.componentId=component.id;
  const head={dataset:{dragComponent:component.id},addEventListener:(name,handler)=>events[`head:${name}`]=handler,setPointerCapture(){}};
  const board={getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},addEventListener:(name,handler)=>events[`board:${name}`]=handler,querySelector:()=>card};
  const root={dataset:{},innerHTML:"",querySelector:s=>s==="#electricalBoard"?board:null,querySelectorAll:s=>s==="[data-drag-component]"?[head]:s===".electrical-component"?[card]:[]},previousCss=globalThis.CSS;globalThis.CSS={escape:value=>value};
  try{
    renderElectricalWorkspace(root,{tags:[],electrical:{components:[component,obstacleAhead,obstacleBehind],wires:[]}});
    events["card:pointerdown"]({button:0,clientX:210,clientY:210,pointerId:9,target:{closest:()=>null},preventDefault(){}});
    events["board:pointermove"]({clientX:230,clientY:210});
    assert.equal(component.x,220,"overlap recovery may briefly increase one collision while reducing total collision area");
    events["board:pointermove"]({clientX:430,clientY:210});
    assert.equal(component.x,420,"a component overlapping several saved devices can be dragged completely clear");
    events["board:pointerup"]();
    assert.equal(component.x,420,"the recovered no-overlap position is committed on release");
  }finally{if(previousCss===undefined)delete globalThis.CSS;else globalThis.CSS=previousCss;}
}
{
  const terminal=createElectricalComponent("phoenixPT25PE",1),other=createElectricalComponent("terminal",1,360,120),diagram={components:[terminal,other],wires:[]};
  assert.equal(terminal.manufacturer,"Phoenix Contact");assert.equal(terminal.partNumber,"3209536");assert.deepEqual(terminal.terminals,["1","2"]);
  for(const pin of terminal.terminals){const peer=createElectricalComponent("terminal",diagram.components.length,600,200+diagram.wires.length*100);diagram.components.push(peer);const result=connectElectricalTerminals(diagram,{componentId:terminal.id,terminal:pin},{componentId:peer.id,terminal:"1"});assert.equal(result.ok,true,`PE conductor connection ${pin} is individually connectable`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:terminal.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of terminal.terminals)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`PE connection ${pin} appears as a connectable pin`);
  assert.ok(root.innerHTML.includes("Phoenix Contact PT 2,5-PE product data"));assert.match(electricalSymbolSvg(terminal),/>PE</);
  assert.ok(root.innerHTML.includes("Physical grounding, DIN-rail bonding and current carrying capacity are not simulated"));
}
{
  const contact=createElectricalComponent("siemens3SU1400NOContact",1),peers=contact.terminals.map((_,index)=>createElectricalComponent("terminal",index+1,360,120+index*100)),diagram={components:[contact,...peers],wires:[]};
  assert.equal(contact.manufacturer,"Siemens");assert.equal(contact.partNumber,"3SU1400-1AA10-1BA0");assert.equal(electricalComponentCatalog[contact.type].kind,"contact");assert.equal(contact.normallyClosed,false);assert.deepEqual(contact.terminals,["3","4"]);
  for(let index=0;index<contact.terminals.length;index++){const pin=contact.terminals[index],result=connectElectricalTerminals(diagram,{componentId:contact.id,terminal:pin},{componentId:peers[index].id,terminal:"1"});assert.equal(result.ok,true,`terminal ${pin} is individually connectable`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:contact.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of contact.terminals)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`));assert.ok(root.innerHTML.includes("data-electrical-input=\"S1\""),"the real NO contact is controllable from the manual simulation inputs");assert.ok(root.innerHTML.includes("Siemens SIRIUS ACT 3SU1 data sheet"));assert.match(electricalSymbolSvg(contact),/SIRIUS ACT|3SU1400|normally-open contact/i);
}
{
  const supply=createElectricalComponent("supply24vdc",1,80,80),contact=createElectricalComponent("siemens3SU1400NOContact",1,320,80),lamp=createElectricalComponent("pilotLamp",1,560,80),diagram={components:[supply,contact,lamp],wires:[]};
  for(const [from,to] of [[{componentId:supply.id,terminal:"+"},{componentId:contact.id,terminal:"3"}],[{componentId:contact.id,terminal:"4"},{componentId:lamp.id,terminal:"X1"}],[{componentId:lamp.id,terminal:"X2"},{componentId:supply.id,terminal:"−"}]]){const result=connectElectricalTerminals(diagram,from,to);assert.equal(result.ok,true,"manufacturer-marked NO contact terminals wire into a circuit");diagram.wires.push(result.wire);}
  assert.equal(simulateElectricalDiagram(diagram,{[contact.reference]:false}).energized[lamp.id],false,"the unactuated normally-open contact leaves its load off");
  const closed=simulateElectricalDiagram(diagram,{[contact.reference]:true});assert.equal(closed.energized[lamp.id],true,"manual simulation input closes the Siemens NO path and powers its wired load");assert.equal(closed.componentStates[contact.id].contactClosed,true);
}
{
  const terminal=createElectricalComponent("phoenixPT25FeedThrough",1),peers=[createElectricalComponent("terminal",1,360,120),createElectricalComponent("terminal",2,360,260)],diagram={components:[terminal,...peers],wires:[]};
  assert.equal(terminal.manufacturer,"Phoenix Contact");assert.equal(terminal.partNumber,"3209510");assert.equal(terminal.ratedVoltageV,800);assert.equal(terminal.ratedCurrentA,24);assert.deepEqual(terminal.terminals,["1","2"]);
  for(let index=0;index<terminal.terminals.length;index++){const pin=terminal.terminals[index],result=connectElectricalTerminals(diagram,{componentId:terminal.id,terminal:pin},{componentId:peers[index].id,terminal:"1"});assert.equal(result.ok,true,`feed-through connection ${pin} is wireable`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:terminal.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of terminal.terminals)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`));assert.ok(root.innerHTML.includes("Phoenix Contact PT 2,5 product data"));assert.match(electricalSymbolSvg(terminal),/PT 2,5/);
}
{
  const motor=createElectricalComponent("wegW22XBCMotor",1),expected=["U1","V1","W1","U2","V2","W2"],peers=expected.map((_,index)=>createElectricalComponent("terminal",index+1,400,120+index*90)),diagram={components:[motor,...peers],wires:[]};
  assert.equal(motor.manufacturer,"WEG");assert.equal(motor.partNumber,"W22XB-C · frame 315–500 family reference");assert.deepEqual(motor.terminals,expected);
  for(let index=0;index<expected.length;index++){const result=connectElectricalTerminals(diagram,{componentId:motor.id,terminal:expected[index]},{componentId:peers[index].id,terminal:"1"});assert.equal(result.ok,true,`${expected[index]} is an individually wireable winding terminal`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:motor.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of expected)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`));assert.ok(root.innerHTML.includes("WEG W22XB-C motor instruction manual · connection diagrams"));assert.match(electricalSymbolSvg(motor),/WEG W22XB-C · 6 LEAD/);
}
{
  const motor=createElectricalComponent("wegW22IE2Motor",1),expected=["U1","V1","W1","U2","V2","W2","PE"],peers=expected.map((_,index)=>createElectricalComponent("terminal",index+1,400,120+index*90)),diagram={components:[motor,...peers],wires:[]};
  assert.equal(motor.manufacturer,"WEG");assert.equal(motor.partNumber,"11673230");assert.equal(electricalComponentCatalog[motor.type].kind,"device-reference");assert.deepEqual(motor.terminals,expected);
  for(let index=0;index<expected.length;index++){const result=connectElectricalTerminals(diagram,{componentId:motor.id,terminal:expected[index]},{componentId:peers[index].id,terminal:"1"});assert.equal(result.ok,true,`${expected[index]} is an individually wireable motor terminal`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:motor.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of expected)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`${pin} is rendered as a connectable motor terminal`);
  assert.ok(root.innerHTML.includes("WEG W22 IE2 1.5 kW 4P 90L product 11673230"));assert.ok(root.innerHTML.includes("WEG safe-area motor installation manual · connections and grounding"));assert.match(electricalSymbolSvg(motor),/WEG W22 IE2 · 1.5 kW/);
}
{
  const cpu=createElectricalComponent("siemensS71212CG2",1),generic=createElectricalComponent("genericPlc24v4di4do",1);
  assert.equal(cpu.manufacturer,"Siemens");assert.equal(cpu.partNumber,"6ES7212-1AG50-0XB0");assert.equal(electricalComponentCatalog[cpu.type].kind,"plc");assert.equal(electricalComponentCatalog[generic.type].kind,"plc","the functional generic PLC remains unchanged");assert.deepEqual(electricalComponentCatalog[cpu.type].channels.inputPins,{I1:"X10-1",I2:"X10-3",I3:"X10-5",I4:"X10-7",I5:"X10-9",I6:"X10-2",I7:"X10-4",I8:"X10-6"});assert.deepEqual(electricalComponentCatalog[cpu.type].channels.outputPins,{Q1:"X11-3",Q2:"X11-5",Q3:"X11-7",Q4:"X11-4",Q5:"X11-6",Q6:"X11-8"});
  assert.equal(cpu.terminals.length,23,"CPU has 5 assigned X80 terminals, 10 X10 terminals, and 8 X11 terminals");assert.equal(electricalComponentCatalog[cpu.type].terminalLayout.length,24,"physical layout still shows all X80(6), X10(10), and X11(8) positions");assert.equal(cpu.terminals.includes("X80-3"),false,"unassigned X80 pin 3 is not connectable");
  assert.equal(electricalComponentCatalog[cpu.type].terminalNotes["X10-1"],"X10 physical pin 1 · digital input DI a.0");assert.equal(electricalComponentCatalog[cpu.type].terminalNotes["X10-2"],"X10 physical pin 2 · digital input DI a.5");assert.equal(electricalComponentCatalog[cpu.type].terminalNotes["X11-8"],"X11 physical pin 8 · digital output DQ a.5");
  const peers=cpu.terminals.map((_,index)=>createElectricalComponent("supply24vdc",index+1,0,index*100)),diagram={components:[cpu,...peers],wires:[]};
  for(const [index,pin]of cpu.terminals.entries()){const result=connectElectricalTerminals(diagram,{componentId:cpu.id,terminal:pin},{componentId:peers[index].id,terminal:"+"});assert.equal(result.ok,true,`${pin} is an independently connectable terminal`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:cpu.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of cpu.terminals)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`${pin} is rendered individually`);
  assert.ok(root.innerHTML.includes("X10 physical pin 1 · digital input DI a.0"),"pin tooltip exposes manufacturer connector and signal mapping");assert.match(electricalSymbolSvg(cpu),/CPU 1212C/u);assert.match(electricalSymbolSvg(cpu),/X80/u);assert.ok(root.innerHTML.includes("Siemens S7-1200 G2 System Manual · CPU 1212C terminal assignments"));
  assert.ok(validateElectricalDiagram(diagram).every((issue)=>issue.level!=="error"),"the source-backed terminals connect without invalid endpoint errors");
}
{
  const cpu=createElectricalComponent("siemensS71212CG2",1),supply=createElectricalComponent("supply24vdc",2),positive=createElectricalComponent("junction",3),negative=createElectricalComponent("junction",4);
  cpu.ioMap.I1={tag:"Start",address:"I0.0"};
  const diagram={components:[cpu,supply,positive,negative],wires:[]};
  const wire=(a,at,b,bt)=>{const result=connectElectricalTerminals(diagram,{componentId:a.id,terminal:at},{componentId:b.id,terminal:bt});assert.equal(result.ok,true,`${a.reference}.${at} connects to ${b.reference}.${bt}`);diagram.wires.push(result.wire);};
  wire(supply,"+",positive,"1");wire(positive,"2",cpu,"X80-1");wire(positive,"3",cpu,"X10-1");wire(supply,"−",negative,"1");wire(negative,"2",cpu,"X80-5");wire(negative,"3",cpu,"X10-8");
  assert.equal(simulateElectricalDiagram(diagram).inputs.Start,true,"Siemens DI a.0 reads on only from its documented powered input terminal and common");
  const unpowered=structuredClone(diagram);unpowered.wires=unpowered.wires.filter((item)=>!(item.from.componentId===positive.id&&item.from.terminal==="2")&&!(item.to.componentId===positive.id&&item.to.terminal==="2"));
  assert.equal(simulateElectricalDiagram(unpowered).inputs.Start,false,"the Siemens inputs remain off when the CPU's documented DC supply is disconnected");
}
{
  const cpu=createElectricalComponent("siemensS71212CG2",1),supply=createElectricalComponent("supply24vdc",2),positive=createElectricalComponent("junction",3),negative=createElectricalComponent("junction",4),lamp={...createElectricalComponent("pilotLamp",5),tag:"Lamp"};
  cpu.ioMap.Q1={tag:"Lamp",address:"Q0.0"};
  const diagram={components:[cpu,supply,positive,negative,lamp],wires:[]};
  const wire=(a,at,b,bt)=>{const result=connectElectricalTerminals(diagram,{componentId:a.id,terminal:at},{componentId:b.id,terminal:bt});assert.equal(result.ok,true,`${a.reference}.${at} connects to ${b.reference}.${bt}`);diagram.wires.push(result.wire);};
  wire(supply,"+",positive,"1");wire(positive,"2",cpu,"X80-1");wire(positive,"3",cpu,"X11-2");wire(supply,"−",negative,"1");wire(negative,"2",cpu,"X80-5");wire(negative,"3",cpu,"X11-1");wire(cpu,"X11-3",lamp,"X1");wire(lamp,"X2",negative,"4");
  assert.equal(simulateElectricalDiagram(diagram,{}, {Lamp:true}).energized[lamp.id],true,"Siemens DQ a.0 drives a load with documented CPU power and output common wiring");
  const missingCommon=structuredClone(diagram);missingCommon.wires=missingCommon.wires.filter((item)=>!(item.from.componentId===negative.id&&item.from.terminal==="3")&&!(item.to.componentId===negative.id&&item.to.terminal==="3"));
  assert.equal(simulateElectricalDiagram(missingCommon,{}, {Lamp:true}).energized[lamp.id],false,"a Siemens output is off when its documented 2M return is disconnected");
}
{
  const source=createElectricalComponent("supply24vdc",1),lamp=createElectricalComponent("pilotLamp",1,360,240),diagram={components:[source,lamp],wires:[]};
  const wire=connectElectricalTerminals(diagram,{componentId:source.id,terminal:"+"},{componentId:lamp.id,terminal:"X1"},[{x:240,y:180}]);assert.equal(wire.ok,true);diagram.wires.push(wire.wire);
  const result=replaceElectricalComponent(diagram,lamp.id,"siemens3SU1152AmberIndicator");assert.equal(result.ok,true,"a part with the same named terminal connections can replace the selected part");assert.equal(result.component.id,lamp.id);assert.equal(result.component.type,"siemens3SU1152AmberIndicator");assert.equal(result.component.x,lamp.x);assert.equal(result.component.y,lamp.y);assert.equal(result.component.reference,"H1");
  assert.deepEqual(diagram.wires[0].from,{componentId:source.id,terminal:"+"});assert.deepEqual(diagram.wires[0].to,{componentId:lamp.id,terminal:"X1"});assert.deepEqual(diagram.wires[0].waypoints,[{x:240,y:180}],"compatible endpoint IDs and the hand-routed cable remain intact");
  const unsupported=replaceElectricalComponent(diagram,lamp.id,"siemensS71212CG2");assert.equal(unsupported.ok,false,"replacement refuses to orphan an unsupported pin");assert.match(unsupported.error,/X1/u);assert.equal(diagram.components[1].type,"pilotLamp","a rejected replacement leaves the component and wire untouched");
  const coil=createElectricalComponent("relayCoil",1),contact=createElectricalComponent("auxiliaryNO",1,360,120);contact.coilRef=coil.reference;const linked={components:[coil,contact],wires:[]},coilReplacement=replaceElectricalComponent(linked,coil.id,"contactor3P");assert.equal(coilReplacement.ok,true);assert.deepEqual(coilReplacement.referenceUpdates,[contact.id],"linked auxiliary contacts can follow the replacement coil reference");
  assert.match(electricalUiSource,/replaceButton\.dataset\.electricalAction="replace"/u,"the component inspector exposes an explicit replace action");assert.match(electricalUiSource,/replaceElectricalComponent\(diagram,selected\.id,type\)/u,"the replacement button uses the selected toolbox model");
}
{
  const source=createElectricalComponent("supply24vdc",1),lamp=createElectricalComponent("pilotLamp",1,360,240),diagram={components:[source,lamp],wires:[]};
  const wire=connectElectricalTerminals(diagram,{componentId:source.id,terminal:"+"},{componentId:lamp.id,terminal:"X1"},[{x:240,y:180}]);assert.equal(wire.ok,true);diagram.wires.push(wire.wire);
  const result=replaceElectricalComponent(diagram,lamp.id,"siemens3SU1152AmberIndicator");assert.equal(result.ok,true,"a part with the same named terminal connections can replace the selected part");assert.equal(result.component.id,lamp.id);assert.equal(result.component.type,"siemens3SU1152AmberIndicator");assert.equal(result.component.x,lamp.x);assert.equal(result.component.y,lamp.y);assert.equal(result.component.reference,"H1");
  assert.deepEqual(diagram.wires[0].from,{componentId:source.id,terminal:"+"});assert.deepEqual(diagram.wires[0].to,{componentId:lamp.id,terminal:"X1"});assert.deepEqual(diagram.wires[0].waypoints,[{x:240,y:180}],"compatible endpoint IDs and the hand-routed cable remain intact");
  const unsupported=replaceElectricalComponent(diagram,lamp.id,"siemensS71212CG2");assert.equal(unsupported.ok,false,"replacement refuses to orphan an unsupported pin");assert.match(unsupported.error,/X1/u);assert.equal(diagram.components[1].type,"pilotLamp","a rejected replacement leaves the component and wire untouched");
  const coil=createElectricalComponent("relayCoil",1),contact=createElectricalComponent("auxiliaryNO",1,360,120);contact.coilRef=coil.reference;const linked={components:[coil,contact],wires:[]},coilReplacement=replaceElectricalComponent(linked,coil.id,"contactor3P");assert.equal(coilReplacement.ok,true);assert.deepEqual(coilReplacement.referenceUpdates,[contact.id],"linked auxiliary contacts can follow the replacement coil reference");
  assert.match(electricalUiSource,/replaceButton\.dataset\.electricalAction="replace"/u,"the component inspector exposes an explicit replace action");assert.match(electricalUiSource,/replaceElectricalComponent\(diagram,selected\.id,type\)/u,"the replacement button uses the selected toolbox model");
}
{
  const compact=createElectricalComponent("pilotLamp",1,360,120),neighbor=createElectricalComponent("pilotLamp",2,360,220),diagram={components:[compact,neighbor],wires:[]};
  const blocked=replaceElectricalComponent(diagram,compact.id,"siemensS71212CG2");
  assert.equal(blocked.ok,false,"a taller replacement cannot overlap a nearby component");assert.match(blocked.error,/Move nearby components/u);assert.equal(diagram.components[0].type,"pilotLamp","rejected replacement leaves the existing device unchanged");
  const clearNeighbor=createElectricalComponent("pilotLamp",3,700,220),clearDiagram={components:[compact,clearNeighbor],wires:[]},allowed=replaceElectricalComponent(clearDiagram,compact.id,"siemensS71212CG2");
  assert.equal(allowed.ok,true,"a larger multi-pin replacement remains available when it fits");assert.equal(allowed.component.id,compact.id);
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
  const lamp=createElectricalComponent("siemens3SU1152AmberIndicator",1,360,120),supply=createElectricalComponent("supply24vdc",1),diagram={components:[lamp,supply],wires:[]};
  assert.equal(lamp.manufacturer,"Siemens");assert.equal(lamp.partNumber,"3SU1152-6AA00-1AA0");assert.equal(lamp.ratedVoltageV,24);assert.deepEqual(lamp.terminals,["X1","X2"]);
  for(const [from,to]of [[{componentId:supply.id,terminal:"+"},{componentId:lamp.id,terminal:"X1"}],[{componentId:lamp.id,terminal:"X2"},{componentId:supply.id,terminal:"−"}]]){const result=connectElectricalTerminals(diagram,from,to);assert.equal(result.ok,true);diagram.wires.push(result.wire);}
  assert.equal(simulateElectricalDiagram(diagram).energized[lamp.id],true,"the sourced indicator displays the existing ideal on/off DC load state");
  const root={dataset:{selectedComponent:lamp.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of lamp.terminals)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`${pin} is individually connectable`);
  assert.ok(root.innerHTML.includes("Siemens SIRIUS ACT 3SU1152-6AA00-1AA0 data sheet"));assert.match(electricalSymbolSvg(lamp),/24 V AC\/DC/);
  assert.ok(root.innerHTML.includes("does not model AC operation, LED polarity, current, brightness, photometry or protection"));
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
for(const [type,spec]of Object.entries(electricalComponentCatalog).filter(([,item])=>Boolean(item.source?.url))){
  const component=createElectricalComponent(type,1),warnings=validateElectricalDiagram({components:[component],wires:[]}).filter(issue=>issue.code==="electrical-unverified-device");
  assert.equal(warnings.length,0,`${type} manufacturer identity is trusted when its catalog source and identifiers match`);
  const edited={...component,manufacturer:"Unverified manufacturer"};
  assert.ok(validateElectricalDiagram({components:[edited],wires:[]}).some(issue=>issue.code==="electrical-unverified-device"),`${type} warns after its sourced manufacturer identity is changed`);
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
  for(const [kind,channels] of Object.entries(spec.channels||{}))if(Array.isArray(channels))for(const channel of channels){const physicalPin=spec.channels.inputPins?.[channel]||spec.channels.outputPins?.[channel]||channel;assert.ok(spec.terminals.some((pin)=>pin===physicalPin||pin.startsWith(`${channel}+`)||pin.startsWith(`${channel}−`)),`${type} channel ${channel} maps to a declared terminal`);}
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
{
  const tags=["Start","Stop"].map((name,index)=>({name,type:"BOOL",role:"input",address:`I0.${index}`}));tags.push({name:"Lamp",type:"BOOL",role:"output",address:"Q0.0"});
  const example=createExampleElectricalDiagram(tags,{inputs:["Start","Stop"],outputs:["Lamp"]});
  const boxes=example.components.map(component=>({id:component.id,left:component.x,right:component.x+120,top:component.y,bottom:component.y+Math.max(80,32+Math.ceil(component.terminals.length/2)*22)}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok(boxes[i].right+12<=boxes[j].left||boxes[j].right+12<=boxes[i].left||boxes[i].bottom+12<=boxes[j].top||boxes[j].bottom+12<=boxes[i].top,"generated example cards leave clear space for pins and selection");
}
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
{
  const breaker=createElectricalComponent("siemensSirius3RV20111JA10",1),expected=["1/L1","3/L2","5/L3","2/T1","4/T2","6/T3"];
  assert.equal(breaker.manufacturer,"Siemens");assert.equal(breaker.partNumber,"3RV2011-1JA10");assert.deepEqual(breaker.terminals,expected);
  const peers=expected.map((_,index)=>createElectricalComponent("terminal",index+1,360,120+index*100)),diagram={components:[breaker,...peers],wires:[]};
  for(let index=0;index<expected.length;index++){const result=connectElectricalTerminals(diagram,{componentId:breaker.id,terminal:expected[index]},{componentId:peers[index].id,terminal:"1"});assert.equal(result.ok,true,`${expected[index]} is a connectable breaker terminal`);diagram.wires.push(result.wire);}
  const root={dataset:{selectedComponent:breaker.id},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  for(const pin of expected)assert.ok(root.innerHTML.includes(`data-terminal="${pin}"`),`${pin} is rendered as its own connectable pin`);
  assert.ok(root.innerHTML.includes("Siemens SIRIUS 3RV2011-1JA10 data sheet"));assert.match(electricalSymbolSvg(breaker),/3RV2 · 3 POLE/);assert.match(electricalSymbolSvg(breaker),/I&gt;/);
}

{
  const first=createElectricalComponent("pilotLamp",1,120,120),overlapping=createElectricalComponent("pilotLamp",2,180,120),touching=createElectricalComponent("pilotLamp",3,240,120);
  const diagram={components:[first,overlapping],wires:[]};
  const issue=validateElectricalDiagram(diagram).find((item)=>item.code==="electrical-component-overlap");
  assert.equal(issue?.level,"warning","saved component overlaps are surfaced as non-destructive diagnostics");
  assert.match(issue.message,/H1 and H2/u,"the warning identifies the overlapping references");
  const touchingOnly=validateElectricalDiagram({components:[first,touching],wires:[]});
  assert.equal(touchingOnly.some((item)=>item.code==="electrical-component-overlap"),false,"cards that only touch are not reported as overlapping");
  const root={dataset:{},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};
  renderElectricalWorkspace(root,{tags:[],electrical:diagram});
  assert.ok(root.innerHTML.includes("Overlapping component cards: H1 and H2"),"the existing schematic diagnostics list displays overlap references");
}
console.log("PASS: generic industrial categories, digital and scalar analog I/O paths, grid placement, wiring, coil-driven contactor poles, motor state, PLC mapping validation, and JSON persistence");


