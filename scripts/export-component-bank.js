import { mkdir, readFile, writeFile } from "node:fs/promises";
import { electricalComponentCatalog } from "../src/electrical.js";
import { industrialProductCatalog, validateIndustrialCatalog } from "../src/industrial-catalog.js";

const output = new URL("../docs/component-bank/", import.meta.url);
const validation = validateIndustrialCatalog();
if (!validation.ok) throw new Error(validation.errors.join("\n"));

const referenceRecords = industrialProductCatalog.map(({ manufacturer, identifier, family, category, attributes, source, simulation }) => ({
  id: `reference:${manufacturer}:${identifier}`,
  manufacturer, orderCode: identifier, family, function: category,
  layer: category === "Programming software" ? "vendor-software" : "hardware-reference",
  terminalSchedule: null, channelMapping: null, commonGroups: null, isolationGroups: null,
  properties: attributes, sourceEvidence: source,
  readiness: { placeable: false, terminalMap: "not-captured", simulation }
}));

const modelRecords = Object.entries(electricalComponentCatalog).map(([type, model]) => {
  const { terminals, terminalLayout, terminalLabels, terminalNotes, channels, commonGroups, inputGroups, relayOutputGroups, manufacturer, partNumber,
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
    commonGroups: commonGroups ?? inputGroups ?? relayOutputGroups ?? (channels?.inputCommonPins ? { inputCommonPins: channels.inputCommonPins,
      ...(channels.relayCommonPins && { relayCommonPins: channels.relayCommonPins }) } : null),
    isolationGroups: inputGroups ?? relayOutputGroups ?? null, properties, sourceEvidence: source ?? null,
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
  mountingAccessoryReferences: referenceRecords.filter(({ function: category }) => category === "Mounting accessories").length
};
const json = `{\n  "schema": "adigunsps-component-bank-v1",\n  "totals": ${JSON.stringify(totals)},\n  "records": [\n${records.map((record) => `    ${JSON.stringify(record)}`).join(",\n")}\n  ]\n}\n`;
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
