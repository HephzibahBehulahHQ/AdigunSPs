import assert from "node:assert/strict";
import { connectElectricalTerminals, createElectricalComponent, electricalComponentCatalog, simulateElectricalDiagram } from "../src/electrical.js";
import { electricalSymbolSvg, renderElectricalWorkspace } from "../src/electrical-ui.js";

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

const toggleOff = circuit("toggleSwitchNO","buzzer",{closed:false});
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
