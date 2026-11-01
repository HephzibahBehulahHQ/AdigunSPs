import assert from "node:assert/strict";
import { connectElectricalTerminals, createElectricalComponent, electricalComponentCatalog, simulateElectricalDiagram } from "../src/electrical.js";
import { electricalSymbolSvg } from "../src/electrical-ui.js";

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
console.log("PASS: added supply, maintained switches, sensor contacts, latched E-stop, neutral/common rails, buzzer, heater, symbols, terminals, and circuit behavior");
