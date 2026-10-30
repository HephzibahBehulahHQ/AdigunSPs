export const electricalComponentCatalog = Object.freeze({
  supply24vdc: { name:"Generic 24 V DC supply", category:"Power supplies", prefix:"PS", terminals:["+","−"], kind:"source", nominalVoltageV:24 },
  supply3phase: { name:"Generic three-phase supply (educational)", category:"Power supplies", prefix:"G", terminals:["L1","L2","L3","PE"], kind:"three-phase-source", nominalVoltageV:400 },
  genericPlc24v4di4do: { name:"Generic 24 V DC PLC · 4 DI / 4 DO", category:"PLC controllers", prefix:"PLC", terminals:["L+","M","PE","I1","I2","I3","I4","Q1","Q2","Q3","Q4"], kind:"plc", channels:{inputs:["I1","I2","I3","I4"],outputs:["Q1","Q2","Q3","Q4"]} },
  digitalInputModule4: { name:"Generic digital input module · 4 channels", category:"PLC I/O modules", prefix:"DI", terminals:["M","I1","I2","I3","I4"], kind:"digital-input-module", channels:{inputs:["I1","I2","I3","I4"]} },
  digitalOutputModule4: { name:"Generic digital output module · 4 channels", category:"PLC I/O modules", prefix:"DO", terminals:["L+","M","Q1","Q2","Q3","Q4"], kind:"digital-output-module", channels:{outputs:["Q1","Q2","Q3","Q4"]} },
  analogInputModule2: { name:"Generic analog input module · 2 channels", category:"PLC I/O modules", prefix:"AI", terminals:["MANA","AI1+","AI1−","AI2+","AI2−"], kind:"analog-input-module", channels:{analogInputs:["AI1","AI2"]} },
  analogOutputModule2: { name:"Generic analog output module · 2 channels", category:"PLC I/O modules", prefix:"AO", terminals:["MANA","AQ1+","AQ1−","AQ2+","AQ2−"], kind:"analog-output-module", channels:{analogOutputs:["AQ1","AQ2"]} },
  pushbuttonNO: { name:"Generic normally-open start push button", category:"Control devices", prefix:"S", terminals:["13","14"], kind:"contact", normallyClosed:false },
  pushbuttonNC: { name:"Generic normally-closed stop push button", category:"Control devices", prefix:"S", terminals:["21","22"], kind:"contact", normallyClosed:true },
  emergencyStopNC: { name:"Generic emergency-stop device · NC simulation", category:"Control devices", prefix:"ES", terminals:["11","12"], kind:"contact", normallyClosed:true },
  selectorSwitch: { name:"Generic two-position selector switch", category:"Control devices", prefix:"SA", terminals:["13","14"], kind:"contact", normallyClosed:false },
  limitSwitchNO: { name:"Generic normally-open limit switch", category:"Sensors", prefix:"B", terminals:["13","14"], kind:"contact", normallyClosed:false },
  limitSwitchNC: { name:"Generic normally-closed limit switch", category:"Sensors", prefix:"B", terminals:["21","22"], kind:"contact", normallyClosed:true },
  proximityNO: { name:"Generic proximity sensor · NO simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:false },
  proximityNC: { name:"Generic proximity sensor · NC simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:true },
  photoelectricNO: { name:"Generic photoelectric sensor · NO simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:false },
  photoelectricNC: { name:"Generic photoelectric sensor · NC simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:true },
  contactor3P: { name:"Generic three-pole contactor · 24 V DC coil", category:"Contactors and relays", prefix:"K", terminals:["1L1","2T1","3L2","4T2","5L3","6T3","A1","A2","13","14","21","22"], kind:"contactor", mainPairs:[["1L1","2T1"],["3L2","4T2"],["5L3","6T3"]], coil:["A1","A2"], auxNOPair:["13","14"], auxNCPair:["21","22"] },
  relayCoil: { name:"Generic control relay coil · 24 V DC simulation", category:"Contactors and relays", prefix:"K", terminals:["A1","A2"], kind:"load" },
  auxiliaryNO: { name:"Generic normally-open auxiliary contact", category:"Contactors and relays", prefix:"K", terminals:["13","14"], kind:"contact", normallyClosed:false },
  auxiliaryNC: { name:"Generic normally-closed auxiliary contact", category:"Contactors and relays", prefix:"K", terminals:["21","22"], kind:"contact", normallyClosed:true },
  overloadNC: { name:"Generic overload relay · NC trip contact simulation", category:"Protection", prefix:"F", terminals:["95","96"], kind:"overload-contact", normallyClosed:true },
  circuitBreaker: { name:"Generic manually-reset circuit breaker", category:"Protection", prefix:"QF", terminals:["1","2"], kind:"manual-switch", normallyClosed:false },
  fuse: { name:"Generic fuse · replace-after-open simulation", category:"Protection", prefix:"FU", terminals:["1","2"], kind:"manual-switch", normallyClosed:false },
  pilotLamp: { name:"Generic pilot lamp", category:"Actuators and indicators", prefix:"H", terminals:["X1","X2"], kind:"load" },
  solenoidValve: { name:"Generic solenoid valve coil · 24 V DC simulation", category:"Actuators and indicators", prefix:"Y", terminals:["A1","A2"], kind:"load" },
  singlePhaseMotor: { name:"Generic single-phase motor · on/off model", category:"Motors", prefix:"M", terminals:["U1","U2","PE"], kind:"motor", phasePairs:[["U1","U2"]] },
  threePhaseMotor: { name:"Generic three-phase motor · on/off model", category:"Motors", prefix:"M", terminals:["U1","V1","W1","PE"], kind:"motor", phasePairs:[["U1","V1"],["V1","W1"],["W1","U1"]] },
  terminal: { name:"Generic terminal block", category:"Terminals and wiring", prefix:"X", terminals:["1"], kind:"terminal" },
  dcPowerRail: { name:"Generic 24 V DC distribution rail", category:"Terminals and wiring", prefix:"XR", terminals:["1","2","3","4","5","6","7","8"], kind:"junction" },
  junction: { name:"Generic electrical junction", category:"Terminals and wiring", prefix:"J", terminals:["1","2","3","4"], kind:"junction" },
  protectiveEarth: { name:"Protective-earth terminal", category:"Terminals and wiring", prefix:"PE", terminals:["PE"], kind:"earth" },
});

const safeNumber = (value) => value === null || value === "" || value === undefined ? null : Number(value);
export const emptyElectricalDiagram = () => ({ components:[], wires:[] });

export function createElectricalComponent(type, sequence, x = 120, y = 120) {
  const spec = electricalComponentCatalog[type];
  if (!spec) throw new Error(`Unsupported generic electrical component: ${type}`);
  const ioMap = Object.fromEntries([...(spec.channels?.inputs || []),...(spec.channels?.outputs || []),...(spec.channels?.analogInputs || []),...(spec.channels?.analogOutputs || [])].map((channel) => {const number=Number(channel.match(/\d+$/)?.[0]||1)-1,address=channel.startsWith("AI")?`IW${number*2}`:channel.startsWith("AQ")?`QW${number*2}`:channel.startsWith("I")?`I0.${number}`:`Q0.${number}`;return [channel,{tag:"",address}];}));
  return {
    id:crypto.randomUUID(), type, reference:`${spec.prefix}${sequence}`, label:spec.name,
    x:Math.round(x / 20) * 20, y:Math.round(y / 20) * 20, rotation:0,
    terminals:[...spec.terminals], tag:"", normallyClosed:Boolean(spec.normallyClosed),
    nominalVoltageV:spec.nominalVoltageV ?? null, ratedVoltageV:null, ratedCurrentA:null,
    manufacturer:"", partNumber:"", simulationOnly:true, ioMap,
    coilTag:"", closed:spec.kind === "manual-switch" || spec.kind === "junction", tripped:false,
  };
}

export function connectElectricalTerminals(diagram, from, to) {
  const components = new Map((diagram.components || []).map((component) => [component.id, component]));
  const valid = (endpoint) => {
    const component = components.get(endpoint?.componentId);
    return component && (component.terminals || []).includes(endpoint.terminal);
  };
  if (!valid(from) || !valid(to)) return { ok:false, error:"A wire endpoint must reference an existing component terminal." };
  if (from.componentId === to.componentId && from.terminal === to.terminal) return { ok:false, error:"A terminal cannot be connected to itself." };
  const key = (endpoint) => `${endpoint.componentId}:${endpoint.terminal}`;
  if ((diagram.wires || []).some((wire) => key(wire.from) === key(from) || key(wire.to) === key(from) || key(wire.from) === key(to) || key(wire.to) === key(to))) return { ok:false, error:"A terminal already has a wire. Add an explicit junction or distribution rail for branches." };
  if ((diagram.wires || []).some((wire) => (key(wire.from) === key(from) && key(wire.to) === key(to)) || (key(wire.from) === key(to) && key(wire.to) === key(from)))) return { ok:false, error:"These terminals are already connected." };
  return { ok:true, wire:{ id:crypto.randomUUID(), from:{...from}, to:{...to} } };
}

export function moveElectricalComponent(component, x, y) {
  return { ...component, x:Math.round(Number(x) / 20) * 20, y:Math.round(Number(y) / 20) * 20 };
}
export function rotateElectricalComponent(component, degrees = 90) {
  const rotation = ((Number(component.rotation || 0) + degrees) % 360 + 360) % 360;
  if (![0,90,180,270].includes(rotation)) throw new Error("Electrical components rotate in 90-degree steps.");
  return { ...component, rotation };
}
export function duplicateElectricalComponent(component, reference, offset = 40) {
  return { ...structuredClone(component), id:crypto.randomUUID(), reference, x:component.x + offset, y:component.y + offset };
}

export function createExampleElectricalDiagram(tags, io, initialState = {}) {
  const components = [], wires = [];
  const add = (type, x, y, tag = "") => {
    const sequence = components.filter((item) => item.type === type).length + 1;
    const component = createElectricalComponent(type, sequence, x, y); component.tag = tag; components.push(component); return component;
  };
  const wire = (a, at, b, bt) => { const result = connectElectricalTerminals({ components, wires }, { componentId: a.id, terminal: at }, { componentId: b.id, terminal: bt }); if (!result.ok) throw new Error(result.error); wires.push(result.wire); };
  const supply = add("supply24vdc", 80, 80), plc = add("genericPlc24v4di4do", 300, 80), positiveRail=add("dcPowerRail",180,80),returnRail=add("dcPowerRail",440,80);
  wire(supply, "+", positiveRail, "1"); wire(supply, "−", returnRail, "1"); wire(positiveRail,"2",plc,"L+"); wire(returnRail,"2",plc,"M");
  const boolInputs = (tags || []).filter((tag) => tag.role === "input" && tag.type === "BOOL");
  boolInputs.slice(0, 4).forEach((tag, index) => {
    const button = add("pushbuttonNO", 80, 240 + index * 120, tag.name); plc.ioMap[`I${index + 1}`] = { tag: tag.name, address: /^I\d+\.\d+$/.test(tag.address||"")?tag.address:`I0.${index}` };
    wire(positiveRail, String(index+3), button, "13"); wire(button, "14", plc, `I${index + 1}`);
    if (initialState[tag.name]) button.closed = true;
  });
  const boolOutputs = (tags || []).filter((tag) => tag.role === "output" && tag.type === "BOOL");
  boolOutputs.slice(0, 4).forEach((tag, index) => {
    const lamp = add("pilotLamp", 560, 240 + index * 120, tag.name); plc.ioMap[`Q${index + 1}`] = { tag: tag.name, address: /^Q\d+\.\d+$/.test(tag.address||"")?tag.address:`Q0.${index}` };
    wire(plc, `Q${index + 1}`, lamp, "X1"); wire(lamp, "X2", returnRail, String(index+3));
  });
  const analogInputs = (tags || []).filter((tag) => tag.role === "input" && ["INT", "REAL"].includes(tag.type));
  if (analogInputs.length) {
    const module = add("analogInputModule2", 300, 640);
    analogInputs.slice(0, 2).forEach((tag, index) => { module.ioMap[`AI${index + 1}`] = { tag: tag.name, address: /^IW\d+$/.test(tag.address||"")?tag.address:`IW${index * 2}` }; });
  }
  const analogOutputs = (tags || []).filter((tag) => tag.role === "output" && ["INT", "REAL"].includes(tag.type));
  if (analogOutputs.length) {
    const module = add("analogOutputModule2", 560, 640);
    analogOutputs.slice(0, 2).forEach((tag, index) => { module.ioMap[`AQ${index + 1}`] = { tag: tag.name, address: /^QW\d+$/.test(tag.address||"")?tag.address:`QW${index * 2}` }; });
  }
  return { components, wires, inputStates: { ...initialState } };
}

export function validateElectricalDiagram(diagram, projectTags = []) {
  const issues = [], components = Array.isArray(diagram?.components) ? diagram.components : [], wires = Array.isArray(diagram?.wires) ? diagram.wires : [];
  const ids = new Set(), references = new Set(), endpoints = new Set(), mappedAddresses = new Set();
  for (const component of components) {
    const spec = electricalComponentCatalog[component.type];
    if (!component.id || ids.has(component.id)) issues.push({level:"error",code:"electrical-component-id",message:"Electrical component IDs must be unique."}); else ids.add(component.id);
    if (!spec) { issues.push({level:"error",code:"electrical-component-type",message:`Unsupported component type ${component.type || "(missing)"}.`}); continue; }
    const reference = String(component.reference || "").trim().toUpperCase();
    if (!reference || references.has(reference)) issues.push({level:"error",code:"electrical-reference",message:`Component reference ${reference || "(missing)"} must be present and unique.`}); else references.add(reference);
    if (!Number.isFinite(Number(component.x)) || !Number.isFinite(Number(component.y)) || ![0,90,180,270].includes(Number(component.rotation || 0))) issues.push({level:"error",code:"electrical-layout",message:`${reference} needs finite grid coordinates and a right-angle rotation.`});
    for (const field of ["ratedVoltageV","ratedCurrentA"]) { const value = safeNumber(component[field]); if (value !== null && (!Number.isFinite(value) || value <= 0)) issues.push({level:"error",code:"electrical-rating",message:`${reference} ${field} must be blank or a positive number.`}); }
    if (component.manufacturer || component.partNumber) issues.push({level:"warning",code:"electrical-unverified-device",message:`${reference} contains user-entered manufacturer data; AdigunSPs does not verify it.`});
    const tagMap = new Map(projectTags.map((tag) => [tag.name,tag]));
    for (const [channel,mapping] of Object.entries(component.ioMap || {})) {
      if (!mapping.address?.trim()) issues.push({level:"error",code:"electrical-io-address",message:`${reference} channel ${channel} needs an address.`});
      else if (mappedAddresses.has(mapping.address.trim().toUpperCase())) issues.push({level:"error",code:"electrical-io-address-duplicate",message:`${reference} assigns address ${mapping.address} to more than one channel.`});
      else mappedAddresses.add(mapping.address.trim().toUpperCase());
      const isAnalogInput=spec.channels?.analogInputs?.includes(channel),isAnalogOutput=spec.channels?.analogOutputs?.includes(channel),isDigitalInput=spec.channels?.inputs?.includes(channel),isDigitalOutput=spec.channels?.outputs?.includes(channel),formatValid=isAnalogInput?/^IW\d+$/.test(mapping.address||""):isAnalogOutput?/^QW\d+$/.test(mapping.address||""):isDigitalInput?/^I\d+\.\d+$/.test(mapping.address||""):isDigitalOutput?/^Q\d+\.\d+$/.test(mapping.address||""):false;
      if (!formatValid) issues.push({level:"error",code:"electrical-io-address-format",message:`${reference} channel ${channel} needs a matching generic I/Q or IW/QW address.`});
      if (mapping.tag && projectTags.length) {
        const tag = tagMap.get(mapping.tag), isInput = spec.channels?.inputs?.includes(channel) || spec.channels?.analogInputs?.includes(channel), isOutput = spec.channels?.outputs?.includes(channel) || spec.channels?.analogOutputs?.includes(channel);
        if (!tag) issues.push({level:"error",code:"electrical-io-tag",message:`${reference} channel ${channel} references missing PLC tag ${mapping.tag}.`});
        else if (isInput && tag.role !== "input") issues.push({level:"error",code:"electrical-io-role",message:`${reference} input ${channel} must map to an input tag.`});
        else if (isOutput && tag.role !== "output") issues.push({level:"error",code:"electrical-io-role",message:`${reference} output ${channel} must map to an output tag.`});
        else if ((isInput || isOutput) && tag.type !== "BOOL" && !channel.startsWith("AI") && !channel.startsWith("AQ")) issues.push({level:"error",code:"electrical-io-type",message:`${reference} digital channel ${channel} must map to a BOOL tag.`});
        else if ((channel.startsWith("AI") || channel.startsWith("AQ")) && !["INT","REAL"].includes(tag.type)) issues.push({level:"error",code:"electrical-io-type",message:`${reference} analog channel ${channel} must map to an INT or REAL tag.`});
      }
    }
    for (const terminal of spec.terminals) endpoints.add(`${component.id}:${terminal}`);
  }
  const seenWires = new Set();
  for (const wire of wires) {
    const from = `${wire.from?.componentId}:${wire.from?.terminal}`, to = `${wire.to?.componentId}:${wire.to?.terminal}`;
    if (!endpoints.has(from) || !endpoints.has(to)) issues.push({level:"error",code:"electrical-wire-endpoint",message:`Wire ${wire.id || "(missing)"} references a missing terminal.`});
    if (from === to) issues.push({level:"error",code:"electrical-wire-self",message:"A wire cannot connect a terminal to itself."});
    const normalized = [from,to].sort().join("|");
    if (seenWires.has(normalized)) issues.push({level:"error",code:"electrical-wire-duplicate",message:"Duplicate terminal connection."}); else seenWires.add(normalized);
    for (const endpoint of [from,to]) { const count=wires.filter((item)=>`${item.from?.componentId}:${item.from?.terminal}`===endpoint||`${item.to?.componentId}:${item.to?.terminal}`===endpoint).length;if(count>1)issues.push({level:"error",code:"electrical-terminal-branch",message:`${endpoint} has multiple wires; branch through an explicit junction.`}); }
  }
  for (const component of components) {
    const spec = electricalComponentCatalog[component.type]; if (!spec) continue;
    for (const terminal of spec.terminals) if (!wires.some((wire) => (wire.from?.componentId === component.id && wire.from?.terminal === terminal) || (wire.to?.componentId === component.id && wire.to?.terminal === terminal))) issues.push({level:"warning",code:"electrical-floating-terminal",message:`${component.reference || component.id} terminal ${terminal} is not wired.`});
  }
  return issues;
}

export function simulateElectricalDiagram(diagram, inputStates = {}, outputStates = {}) {
  const all = diagram.components || [], byId = new Map(all.map((component) => [component.id, component]));
  const key = (id, pin) => `${id}:${pin}`;
  const supplies = all.filter((component) => ["source", "three-phase-source", "single-phase-source"].includes(electricalComponentCatalog[component.type]?.kind));
  let contactorEnergized = new Set();
  const makeGraph = () => {
    const nodes = new Map();
    const addEdge = (a, b) => { if (!nodes.has(a)) nodes.set(a, new Set()); if (!nodes.has(b)) nodes.set(b, new Set()); nodes.get(a).add(b); nodes.get(b).add(a); };
    for (const wire of diagram.wires || []) {
      const from = byId.get(wire.from?.componentId), to = byId.get(wire.to?.componentId);
      if (from?.terminals?.includes(wire.from?.terminal) && to?.terminals?.includes(wire.to?.terminal)) addEdge(key(from.id, wire.from.terminal), key(to.id, wire.to.terminal));
    }
    for (const component of all) {
      const spec = electricalComponentCatalog[component.type]; if (!spec) continue;
      const signal = Boolean(inputStates[component.tag || component.reference]);
      if (spec.kind === "junction") for (let i = 0; i < spec.terminals.length; i++) for (let j = i + 1; j < spec.terminals.length; j++) addEdge(key(component.id, spec.terminals[i]), key(component.id, spec.terminals[j]));
      else if (spec.kind === "contact" || spec.kind === "overload-contact") {
        const closed = spec.kind === "overload-contact" ? !(component.tripped || signal) : component.normallyClosed ? !signal : signal;
        if (closed) addEdge(key(component.id, spec.terminals[0]), key(component.id, spec.terminals[1]));
      } else if (spec.kind === "manual-switch" && component.closed && !component.tripped && !signal) addEdge(key(component.id, spec.terminals[0]), key(component.id, spec.terminals[1]));
      else if (spec.kind === "contactor") {
        const on = contactorEnergized.has(component.id);
        if (on) { for (const pair of spec.mainPairs || []) addEdge(key(component.id, pair[0]), key(component.id, pair[1])); if (spec.auxNOPair) addEdge(key(component.id, spec.auxNOPair[0]), key(component.id, spec.auxNOPair[1])); }
        else if (spec.auxNCPair) addEdge(key(component.id, spec.auxNCPair[0]), key(component.id, spec.auxNCPair[1]));
      }
    }
    for (const component of all) for (const channel of electricalComponentCatalog[component.type]?.channels?.outputs || []) {
      const tag = component.ioMap?.[channel]?.tag;
      if (tag && Boolean(outputStates[tag])) addEdge(key(component.id, "L+"), key(component.id, channel));
    }
    return nodes;
  };
  const reachable = (nodes, start) => { const found = new Set([start]), queue = [start]; while (queue.length) for (const next of nodes.get(queue.shift()) || []) if (!found.has(next)) { found.add(next); queue.push(next); } return found; };
  const sourceNets = (nodes) => supplies.map((component) => {
    const kind = electricalComponentCatalog[component.type].kind;
    if (kind === "three-phase-source") return { component, nets: Object.fromEntries(["L1", "L2", "L3", "PE"].map((pin) => [pin, reachable(nodes, key(component.id, pin))])) };
    if (kind === "single-phase-source") return { component, nets: Object.fromEntries(["L", "N", "PE"].map((pin) => [pin, reachable(nodes, key(component.id, pin))])) };
    return { component, nets: { positive: reachable(nodes, key(component.id, "+")), negative: reachable(nodes, key(component.id, "−")) } };
  });
  const poweredPair = (nets, component, a, b) => nets.some(({ nets: poles }) => poles.positive?.has(key(component.id, a)) && poles.negative?.has(key(component.id, b)) || poles.L?.has(key(component.id, a)) && poles.N?.has(key(component.id, b)));
  // Coil power is derived from terminal voltage paths, never from the output tag alone.
  for (let pass = 0; pass < 2; pass++) {
    const nodes = makeGraph(), nets = sourceNets(nodes);
    for (const component of all) if (electricalComponentCatalog[component.type]?.kind === "contactor") {
      const [[a, b]] = [electricalComponentCatalog[component.type].coil || ["A1", "A2"]];
      if (poweredPair(nets, component, a, b)) contactorEnergized.add(component.id); else contactorEnergized.delete(component.id);
    }
  }
  const nodes = makeGraph(), nets = sourceNets(nodes), plcInputs = {};
  for (const controller of all) {
    const spec = electricalComponentCatalog[controller.type]; if (!spec?.channels?.inputs) continue;
    const hasReturn = nets.some(({ nets: poles }) => poles.negative?.has(key(controller.id, "M")) || poles.N?.has(key(controller.id, "M")));
    for (const channel of spec.channels.inputs) { const tag = controller.ioMap?.[channel]?.tag; if (tag) plcInputs[tag] = Boolean(hasReturn && nets.some(({ nets: poles }) => (poles.positive || poles.L)?.has(key(controller.id, channel)))); }
  }
  const loads = all.filter((component) => ["load", "motor"].includes(electricalComponentCatalog[component.type]?.kind));
  const energized = Object.fromEntries(loads.map((load) => {
    const spec = electricalComponentCatalog[load.type];
    const powered = spec.kind === "motor" && spec.phasePairs?.length > 1
      ? nets.some(({ nets: poles }) => [["L1", "U1"], ["L2", "V1"], ["L3", "W1"]].every(([phase, pin]) => poles[phase]?.has(key(load.id, pin))))
      : spec.kind === "motor"
        ? nets.some(({ nets: poles }) => poles.L?.has(key(load.id, "U1")) && poles.N?.has(key(load.id, "U2")))
        : poweredPair(nets, load, spec.terminals[0], spec.terminals[1]);
    return [load.id, Boolean(powered)];
  }));
  const componentStates = Object.fromEntries([...loads.map((item) => [item.id, { energized: energized[item.id], ...(electricalComponentCatalog[item.type].kind === "motor" ? { running: energized[item.id], speedModel: "on/off educational state; no validated torque or speed model" } : {}) }]), ...[...contactorEnergized].map((id) => [id, { coilEnergized: true, mainContactsClosed: true }])]);
  return { energized, componentStates, inputs: { ...inputStates, ...plcInputs }, sourceCount: supplies.length, simulationOnly: true, warnings: validateElectricalDiagram(diagram).filter((issue) => issue.level === "warning") };
}
