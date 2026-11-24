import { mkdir, readFile, writeFile } from "node:fs/promises";
import { electricalComponentCatalog } from "../src/electrical.js";
import { industrialProductCatalog, validateIndustrialCatalog } from "../src/industrial-catalog.js";
import { supportedFbdTypes } from "../src/fbd-validation.js";
import { supportedProcessTypes } from "../src/process.js";
import { supportedLadderInstructions } from "../src/validation.js";
import { compileStructuredText, executeStructuredText } from "../src/structured-text.js";
import { scanSFC } from "../src/engine.js";

const output = new URL("../docs/component-bank/", import.meta.url);
const validation = validateIndustrialCatalog();
if (!validation.ok) throw new Error(validation.errors.join("\n"));

const structuredTextExamples = {
  assignment: { source: "Result := Input;", cases: [[3, 3]] },
  conditional: {
    source: "IF Input > 0 THEN Result := 1; ELSIF Input = 0 THEN Result := 0; ELSE Result := -1; END_IF;",
    cases: [[7, 1], [0, 0], [-5, -1]],
  },
  arithmetic: { source: "Result := (Input + 2 - 1) * 3 / 2 MOD 4;", cases: [[3, 2]] },
  boolean: { source: "Result := NOT (Input >= 0 AND Input <= 10) OR (Input <> 8 XOR Input < 2);", cases: [[-1, true], [1, false]] },
};
for (const [name, { source, cases }] of Object.entries(structuredTextExamples)) {
  const compiled = compileStructuredText(source, ["Input", "Result"]);
  if (!compiled.ok) throw new Error(`Structured Text inventory example ${name}: ${compiled.errors.join("\n")}`);
  for (const [input, expected] of cases) {
    const types = { Input: "REAL", Result: typeof expected === "boolean" ? "BOOL" : "REAL" };
    const { outputs } = executeStructuredText(compiled, { Input: input }, {}, ["Result"], types);
    if (outputs.Result !== expected) throw new Error(`Structured Text inventory example ${name}: Input ${input} expected Result ${expected}, got ${outputs.Result}`);
  }
}

const sfcExample = {
  model: {
    initialStep: "idle",
    outputs: ["Motor"],
    steps: [{ id: "run", actions: ["Motor"] }, { id: "idle", actions: [] }],
    transitions: [
      { from: "idle", to: "run", condition: "Start", mode: "NO" },
      { from: "run", to: "idle", condition: "Permit", mode: "NC" },
    ],
  },
  scans: [
    { inputs: { Start: false, Permit: true }, activeStep: "idle", outputs: { Motor: false } },
    { inputs: { Start: true, Permit: true }, activeStep: "run", outputs: { Motor: true } },
    { inputs: { Start: false, Permit: true }, activeStep: "run", outputs: { Motor: true } },
    { inputs: { Start: false, Permit: false }, activeStep: "idle", outputs: { Motor: false } },
  ],
};
let sfcState = {};
for (const [index, { inputs, activeStep, outputs }] of sfcExample.scans.entries()) {
  sfcState = scanSFC(sfcExample.model, inputs, sfcState);
  if (sfcState.activeStep !== activeStep || sfcState.outputs.Motor !== outputs.Motor) {
    throw new Error(`SFC inventory example scan ${index + 1}: expected ${activeStep}, Motor=${outputs.Motor}; got ${sfcState.activeStep}, Motor=${sfcState.outputs.Motor}`);
  }
}

const referenceRecords = industrialProductCatalog.map(({ manufacturer, identifier, family, category, attributes, source, simulation }) => ({
  id: `reference:${manufacturer}:${identifier}`,
  manufacturer, orderCode: identifier, family, function: category,
  layer: category === "Programming software" ? "vendor-software" : "hardware-reference",
  terminalSchedule: null, channelMapping: null, commonGroups: null, isolationGroups: null,
  properties: attributes, sourceEvidence: source,
  readiness: { placeable: false, terminalMap: "not-captured", simulation }
}));

const modelRecords = Object.entries(electricalComponentCatalog).map(([type, model]) => {
  const { terminals, terminalLayout, terminalLabels, terminalNotes, channels, commonGroups, inputGroups, relayOutputGroups, sourcingOutputGroups, manufacturer, partNumber,
    source, simulationLimitations, ...properties } = model;
  const modelDesignation = partNumber ?? null;
  // Legacy designations can be model names or family references. Keep them as reported.
  return {
    id: `model:${type}`, manufacturer: manufacturer ?? null,
    orderCode: source && !["ifmPN2070", "wegW22XBCMotor"].includes(type) ? modelDesignation : null,
    modelDesignation, family: model.name, function: model.kind, layer: "schematic-model",
    terminalSchedule: (terminalLayout ?? terminals).map((terminal) => ({
      id: terminal, connectable: terminals.includes(terminal),
      label: terminalLabels?.[terminal] ?? terminal, note: terminalNotes?.[terminal] ?? null
    })),
    channelMapping: channels ?? null,
    commonGroups: commonGroups ?? inputGroups ?? relayOutputGroups ?? sourcingOutputGroups ?? (channels?.inputCommonPins ? { inputCommonPins: channels.inputCommonPins,
      ...(channels.relayCommonPins && { relayCommonPins: channels.relayCommonPins }),
      ...(channels.outputReturnPin && { outputSupply: { positive: channels.outputSupplyPin, return: channels.outputReturnPin } }),
    } : null),
    isolationGroups: inputGroups ?? relayOutputGroups ?? sourcingOutputGroups ?? null, properties, sourceEvidence: source ?? null,
    readiness: { placeable: true, terminalMap: source?.terminalMapPages || source?.terminalMapSection ? "verified-topology" : source ? "source-linked-model" : "educational-model",
      simulation: { status: "educational", model: type, limitations: simulationLimitations ?? null } }
  };
});

const records = [...referenceRecords, ...modelRecords];
const fields = ["id", "layer", "manufacturer", "orderCode", "modelDesignation", "family", "function", "terminalSchedule",
  "channelMapping", "commonGroups", "isolationGroups", "properties", "sourceEvidence", "readiness"];
const cell = (value) => {
  if (value == null) return "";
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  const text = /^[=+@\-\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replaceAll('"', '""')}"`;
};
const totals = {
  vendorReferences: referenceRecords.length,
  vendorHardwareReferences: referenceRecords.filter(({ layer }) => layer === "hardware-reference").length,
  vendorSoftwareReferences: referenceRecords.filter(({ layer }) => layer === "vendor-software").length,
  placeableSchematicModels: modelRecords.length,
  educationalSimulationProfiles: modelRecords.length,
  sourceLinkedSchematicModels: modelRecords.filter(({ sourceEvidence }) => sourceEvidence).length,
  distinctHardwareOrderCodes: new Set(records.filter(({ layer, orderCode }) => layer !== "vendor-software" && orderCode)
    .map(({ manufacturer, orderCode }) => `${manufacturer.trim().toLowerCase()}|${orderCode.trim().toUpperCase()}`)).size,
  verifiedTerminalTopologies: modelRecords.filter(({ readiness }) => readiness.terminalMap === "verified-topology").length,
  mountingAccessoryReferences: referenceRecords.filter(({ function: category }) => category === "Mounting accessories").length,
  fbdBlockTypes: supportedFbdTypes.length,
  processModelTypes: supportedProcessTypes.length,
};
const softwareAndProcess = {
  ladderInstructions: supportedLadderInstructions,
  fbdBlockTypes: supportedFbdTypes,
  structuredTextExamples,
  sfcExample,
  processModelTypes: supportedProcessTypes,
};
const json = `{\n  "schema": "adigunsps-component-bank-v1",\n  "totals": ${JSON.stringify(totals)},\n  "softwareAndProcess": ${JSON.stringify(softwareAndProcess)},\n  "records": [\n${records.map((record) => `    ${JSON.stringify(record)}`).join(",\n")}\n  ]\n}\n`;
const csv = `${fields.join(",")}\n${records.map((record) => fields.map((field) => cell(record[field])).join(",")).join("\n")}\n`;
const check = process.argv.includes("--check");
if (!check) await mkdir(output, { recursive: true });
for (const [name, data] of [["inventory.json", json], ["inventory.csv", csv]]) {
  const file = new URL(name, output);
  if (check) {
    if ((await readFile(file, "utf8")).replaceAll("\r\n", "\n") !== data) throw new Error(`${name} is stale. Run node scripts/export-component-bank.js.`);
  } else await writeFile(file, data);
}
console.log(JSON.stringify(totals));
