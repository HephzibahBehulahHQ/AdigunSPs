import assert from "node:assert/strict";
import { connectElectricalTerminals, createElectricalComponent, electricalComponentCatalog, simulateElectricalDiagram } from "../src/electrical.js";
import { electricalSymbolSvg, renderElectricalWorkspace } from "../src/electrical-ui.js";
import { scan } from "../src/engine.js";
import { normalizeImportedProject } from "../src/project-import.js";

function circuit(switchType, loadType, options = {}) {
  const { signal, ...overrides } = options;
  const source = createElectricalComponent("singlePhaseSupply", 1);
  const input = { ...createElectricalComponent(switchType, 1), tag:"Input", ...Object.fromEntries(Object.entries(overrides).filter(([,value]) => value !== undefined)) };
  const load = createElectricalComponent(loadType, 1);
  const neutral = createElectricalComponent("neutralRail", 1);
  const diagram = { components:[source,input,load,neutral], wires:[] };
  const pairs = [[source,"L",input,electricalComponentCatalog[switchType].terminals[0]],[input,electricalComponentCatalog[switchType].terminals[1],load,electricalComponentCatalog[loadType].terminals[0]],[load,electricalComponentCatalog[loadType].terminals[1],neutral,"N1"],[source,"N",neutral,"N2"]];
  for (const [a,at,b,bt] of pairs) { const result=connectElectricalTerminals(diagram,{componentId:a.id,terminal:at},{componentId:b.id,terminal:bt}); assert.equal(result.ok,true); diagram.wires.push(result.wire); }
  return simulateElectricalDiagram(diagram,{Input:Boolean(signal)});
}

const types = ["singlePhaseSupply","toggleSwitchNO","toggleSwitchNC","pressureSwitchNO","temperatureSwitchNO","temperatureSwitchNC","floatSwitchNO","buzzer","heaterElement","neutralRail","groundCommon"];
for (const type of types) {
  const component = createElectricalComponent(type, 1);
  assert.ok(component.id && component.reference && component.terminals.length, `${type} has an id, reference, and terminals`);
  assert.equal(component.simulationOnly,true,`${type} clearly declares the educational simulation boundary`);
  assert.match(electricalSymbolSvg(component),/^<svg class="electrical-standard-symbol"[\s\S]*<\/svg>$/u,`${type} has a schematic symbol`);
}

{
  const terminal = createElectricalComponent("phoenixPT25Twin", 1);
  const supply = createElectricalComponent("supply24vdc", 1);
  const returnRail = createElectricalComponent("neutralRail", 1);
  const lampA = createElectricalComponent("pilotLamp", 1);
  const lampB = createElectricalComponent("pilotLamp", 2);
  const diagram = { components: [terminal, supply, returnRail, lampA, lampB], wires: [] };
  const wire = (from, fromPin, to, toPin) => {
    const result = connectElectricalTerminals(diagram, { componentId: from.id, terminal: fromPin }, { componentId: to.id, terminal: toPin });
    assert.equal(result.ok, true, result.error);
    diagram.wires.push(result.wire);
  };
  assert.deepEqual(terminal.terminals, ["1", "2", "3"]);
  assert.match(electricalSymbolSvg(terminal), /PT 2,5-TWIN/);
  wire(supply, "+", terminal, "1");
  wire(terminal, "2", lampA, "X1");
  wire(terminal, "3", lampB, "X1");
  wire(lampA, "X2", returnRail, "N1");
  wire(lampB, "X2", returnRail, "N2");
  assert.equal(simulateElectricalDiagram(diagram).energized[lampA.id], false);
  wire(supply, "−", returnRail, "N3");
  const restored = JSON.parse(JSON.stringify(diagram));
  const { energized } = simulateElectricalDiagram(restored);
  assert.equal(energized[lampA.id], true);
  assert.equal(energized[lampB.id], true);
  assert.deepEqual(restored.wires, diagram.wires);
}

const toggleOff = circuit("toggleSwitchNO","buzzer",{closed:false});
{
  const module = createElectricalComponent("siemensSM1221G2DI16", 1);
  const spec = electricalComponentCatalog[module.type];
  assert.equal(module.terminals.length, 20);
  assert.equal(spec.channels.inputs.length, 16);
  const cpu = createElectricalComponent("siemensS71212CG2Relay", 1);
  const cpuSupply = createElectricalComponent("supply24vdc", 5);
  const diagram = { components:[module,cpu,cpuSupply], wires:[] };
  for (const [pole, pin] of [["+", "X80-1"], ["−", "X80-5"]]) {
    const result = connectElectricalTerminals(diagram, { componentId:cpuSupply.id, terminal:pole }, { componentId:cpu.id, terminal:pin });
    assert.equal(result.ok, true, result.error);
    diagram.wires.push(result.wire);
  }
  for (const [index, { common, inputs }] of spec.inputGroups.entries()) {
    const supply = createElectricalComponent("supply24vdc", index + 1);
    diagram.components.push(supply);
    const tag = `Group${index + 1}`;
    const channel = spec.channels.inputs[index * 4];
    assert.equal(spec.channels.inputPins[channel], inputs[0]);
    module.ioMap[channel] = { tag, address:`I${index}.0` };
    const poles = index % 2 ? ["−", "+"] : ["+", "−"];
    const connect = (pole, pin) => {
      const result = connectElectricalTerminals(diagram, { componentId:supply.id, terminal:pole }, { componentId:module.id, terminal:pin });
      assert.equal(result.ok, true, result.error);
      diagram.wires.push(result.wire);
    };
    connect(poles[0], inputs[0]);
    assert.equal(simulateElectricalDiagram(diagram).inputs[tag], false, "other groups cannot supply this input's common");
    connect(poles[1], common);
    if (index === 0) {
      assert.equal(simulateElectricalDiagram(diagram).inputs[tag], false, "field voltage cannot substitute for the backplane");
      module.backplaneCpuId = cpu.id;
    }
    assert.equal(simulateElectricalDiagram(diagram).inputs[tag], true);
  }
  const restored = normalizeImportedProject(JSON.parse(JSON.stringify({
    name:"SM 1221 field groups", rungs:[], tags:spec.inputGroups.map((_, index) => ({ name:`Group${index + 1}`, type:"BOOL", role:"input" })), electrical:diagram
  })));
  assert.deepEqual(simulateElectricalDiagram(restored.electrical).inputs, { Group1:true, Group2:true, Group3:true, Group4:true });
  restored.electrical.wires = restored.electrical.wires.filter(({ from }) => from.componentId !== cpuSupply.id);
  assert.deepEqual(simulateElectricalDiagram(restored.electrical).inputs, { Group1:false, Group2:false, Group3:false, Group4:false });
}
for (const inputCommonPolarity of ["negative", "positive"]) {
  const cpu = createElectricalComponent("siemensS71212CG2Relay", 1);
  const cpuSupply = createElectricalComponent("supply24vdc", 1);
  const loadSupply = createElectricalComponent("supply24vdc", 2);
  const positive = createElectricalComponent("junction", 1);
  const negative = createElectricalComponent("junction", 2);
  const field = { ...createElectricalComponent("pushbuttonNO", 1), tag:"FieldSwitch" };
  const lamp = createElectricalComponent("pilotLamp", 1);
  const common = inputCommonPolarity === "negative" ? negative : positive;
  const signal = common === negative ? positive : negative;
  cpu.ioMap.I1 = { tag:"Start", address:"I0.0" };
  cpu.ioMap.Q1 = { tag:"Lamp", address:"Q0.0" };
  const diagram = { components:[cpu,cpuSupply,loadSupply,positive,negative,field,lamp], wires:[] };
  const wire = (from, fromPin, to, toPin) => {
    const result = connectElectricalTerminals(diagram, { componentId:from.id, terminal:fromPin }, { componentId:to.id, terminal:toPin });
    assert.equal(result.ok, true, result.error);
    diagram.wires.push(result.wire);
    return result.wire.id;
  };
  wire(cpuSupply, "+", positive, "1");
  wire(cpuSupply, "−", negative, "1");
  wire(positive, "2", cpu, "X80-1");
  wire(negative, "2", cpu, "X80-5");
  const commonWire = wire(common, "3", cpu, "X10-8");
  wire(signal, "3", field, "13");
  wire(field, "14", cpu, "X10-1");
  wire(loadSupply, "+", cpu, "X11-2");
  wire(cpu, "X11-3", lamp, "X1");
  wire(lamp, "X2", loadSupply, "−");
  const project = normalizeImportedProject(JSON.parse(JSON.stringify({
    name:`Relay CPU with ${inputCommonPolarity} common`,
    tags:[{ name:"Start", type:"BOOL", role:"input" }, { name:"Lamp", type:"BOOL", role:"output" }],
    io:{ inputs:["Start"], outputs:["Lamp"] },
    rungs:[{ id:"lamp", branches:[[{ tag:"Start", mode:"NO" }]], coil:"Lamp" }], electrical:diagram
  })));
  const run = (pressed) => {
    const inputs = simulateElectricalDiagram(project.electrical, { FieldSwitch:pressed }).inputs;
    const { outputs } = scan(project, inputs);
    return [inputs.Start, outputs.Lamp, simulateElectricalDiagram(project.electrical, { FieldSwitch:pressed }, outputs).energized[lamp.id]];
  };
  assert.deepEqual(run(false), [false,false,false]);
  assert.deepEqual(run(true), [true,true,true]);
  project.electrical.wires = project.electrical.wires.filter(({ id }) => id !== commonWire);
  assert.deepEqual(run(true), [false,false,false], "a disconnected common cannot produce a true logic input");
}
{
  const cpu = createElectricalComponent("siemensS71212CG2Relay", 1);
  const cpuSupply = createElectricalComponent("supply24vdc", 1);
  const loadSupply = createElectricalComponent("supply24vdc", 2);
  const lamp = createElectricalComponent("pilotLamp", 1);
  cpu.ioMap.Q1 = { tag:"Lamp", address:"Q0.0" };
  const diagram = { components:[cpu, cpuSupply, loadSupply, lamp], wires:[] };
  const wire = (from, fromPin, to, toPin) => {
    const result = connectElectricalTerminals(diagram, { componentId:from.id, terminal:fromPin }, { componentId:to.id, terminal:toPin });
    assert.equal(result.ok, true, result.error);
    diagram.wires.push(result.wire);
  };
  assert.equal(cpu.terminals.length, 23);
  assert.ok(!cpu.terminals.includes("X80-3"));
  wire(loadSupply, "+", cpu, "X11-2");
  wire(cpu, "X11-3", lamp, "X1");
  wire(lamp, "X2", loadSupply, "−");
  const energized = (on) => simulateElectricalDiagram(diagram, {}, { Lamp:on }).energized[lamp.id];
  assert.equal(energized(true), false, "a true tag cannot actuate an unpowered CPU relay");
  wire(cpuSupply, "+", cpu, "X80-1");
  wire(cpuSupply, "−", cpu, "X80-5");
  assert.equal(energized(false), false, "an idle output keeps the relay contact open");
  assert.equal(energized(true), true, "a powered PLC switches the independent wired load supply");
  diagram.wires.shift();
  assert.equal(energized(true), false, "the CPU power supply does not feed an unwired relay common");
}
const toggleOn = circuit("toggleSwitchNO","buzzer",{closed:true});
assert.equal(Object.values(toggleOff.energized)[0],false,"maintained NO toggle starts open");
assert.equal(Object.values(toggleOn.energized)[0],true,"maintained NO toggle closes the buzzer circuit");
assert.equal(Object.values(circuit("toggleSwitchNC","heaterElement",{closed:true}).energized)[0],true,"maintained NC toggle starts closed");
for (const type of ["pressureSwitchNO","temperatureSwitchNO","floatSwitchNO"]) {
  assert.equal(Object.values(circuit(type,"buzzer",{signal:false}).energized)[0],false,`${type} is open without its signal`);
  assert.equal(Object.values(circuit(type,"buzzer",{signal:true}).energized)[0],true,`${type} closes on its simulated signal`);
}
assert.equal(Object.values(circuit("temperatureSwitchNC","heaterElement",{signal:false}).energized)[0],true,"NC temperature switch conducts in its normal state");
assert.equal(Object.values(circuit("temperatureSwitchNC","heaterElement",{signal:true}).energized)[0],false,"NC temperature switch opens on its simulated signal");
assert.equal(Object.values(circuit("emergencyStopNC","buzzer",{closed:true,tripped:false}).energized)[0],true,"latched E-stop conducts before actuation");
assert.equal(Object.values(circuit("emergencyStopNC","buzzer",{closed:true,tripped:true}).energized)[0],false,"latched E-stop remains open after trip");
assert.equal(Object.values(circuit("pushbuttonNO","heaterElement",{signal:true}).energized)[0],true,"pushbutton input controls a connected heater model");
{
  const cpu=createElectricalComponent("siemensS71212CG2",1);
  const source=createElectricalComponent("supply24vdc",1);
  const spec=electricalComponentCatalog[cpu.type];
  assert.deepEqual(spec.terminalLayout.slice(0,6),["X80-1","X80-2","X80-3","X80-4","X80-5","X80-6"],"all six physical X80 positions remain visible in manufacturer order");
  assert.equal(cpu.terminals.includes("X80-3"),false,"unassigned physical position is not a wireable component terminal");
  assert.equal(connectElectricalTerminals({components:[cpu,source],wires:[]},{componentId:cpu.id,terminal:"X80-3"},{componentId:source.id,terminal:"+"}).ok,false,"an unassigned X80 position cannot start a wire");
  const root={dataset:{},innerHTML:"",querySelector:()=>null,querySelectorAll:()=>[]};
  renderElectricalWorkspace(root,{tags:[],electrical:{components:[cpu,source],wires:[]}});
  assert.match(root.innerHTML,/physical position X80-3 is unassigned and cannot be wired/u,"unassigned position is visibly explained");
  assert.doesNotMatch(root.innerHTML,/data-terminal="X80-3"/u,"unassigned position has no wire interaction");
  assert.match(root.innerHTML,/data-terminal="X80-4"/u,"assigned X80 positions remain connectable");
}
console.log("PASS: added supply, maintained switches, sensor contacts, latched E-stop, neutral/common rails, buzzer, heater, symbols, terminals, and circuit behavior");
