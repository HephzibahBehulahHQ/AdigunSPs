import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { industrialProductCatalog, searchIndustrialCatalog, validateIndustrialCatalog } from "../src/industrial-catalog.js";

const validation = validateIndustrialCatalog();
assert.equal(validation.ok, true, validation.errors.join(", "));
assert.equal(validation.count, 10204, "catalog has 10204 distinct provenance-backed product references");
assert.equal(validation.unique, validation.count);
assert.equal(new Set(industrialProductCatalog.map(({ manufacturer, identifier }) => `${manufacturer}|${identifier}`)).size, 10204);
assert.equal(searchIndustrialCatalog({ query: "E3Z-T61" }).items[0].identifier, "E3Z-T61");
assert.equal(searchIndustrialCatalog({ manufacturer: "OMRON" }).total, 28);
assert.equal(searchIndustrialCatalog({ category: "PLC controllers" }).total, 96);
const g2Ordering = industrialProductCatalog.filter(({ source }) =>
  source.url === "https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/ordering-information/cpus");
assert.equal(g2Ordering.length, 9);
assert.equal(g2Ordering.filter(({ attributes }) => attributes.failsafe).length, 4);
assert.equal(g2Ordering.filter(({ simulation }) => simulation.status === "reference-only").length, 7);
assert.equal(g2Ordering.find(({ identifier }) => identifier === "6ES7212-1BG50-0XB0").simulation.model, "siemensS71212CG2AcRelay");
assert.equal(g2Ordering.find(({ identifier }) => identifier === "6ES7212-1AG50-0XB0").simulation.model, "siemensS71212CG2");
assert.equal(searchIndustrialCatalog({ category: "Digital I/O modules" }).total, 140);
assert.equal(searchIndustrialCatalog({ category: "Analog I/O modules" }).total, 88);
const expansion = industrialProductCatalog.filter(({ source }) => /ordering-information\/signal-(boards-sbs|modules-sms)$/.test(source.url));
assert.equal(expansion.length, 10);
assert.equal(expansion.find(({ identifier }) => identifier === "6ES7233-4HF50-0XB0").simulation.model, "siemensSM1233G2AI4AQ4");
assert.equal(expansion.filter(({ simulation }) => simulation.status === "reference-only" && simulation.model === null).length, 9);
assert.equal(searchIndustrialCatalog({ category: "Communications modules" }).total, 84);
assert.equal(searchIndustrialCatalog({ category: "Base units" }).total, 49);
assert.equal(searchIndustrialCatalog({ category: "HMI devices" }).total, 25);
const panel = searchIndustrialCatalog({ query: "6AV2128-3XB70-0AX0" }).items[0];
assert.equal(panel.attributes.variant, "Hygienic Neutral");
assert.equal(panel.simulation.status, "reference-only");
assert.equal(searchIndustrialCatalog({ category: "Power supplies", manufacturer: "Siemens" }).items[0].identifier, "6EP1332-1SH71");
assert.equal(searchIndustrialCatalog({ query: "24 V AC", limit: 1 }).items[0].identifier, "LC1D09B7");
assert.equal(searchIndustrialCatalog({ query: "CPU", limit: 5, offset: 3 }).items.length, 5);
assert.equal(searchIndustrialCatalog({ query: "not-a-real-model" }).total, 0);
const inventory = JSON.parse(readFileSync("docs/component-bank/inventory.json", "utf8"));
const categoryCoverage = inventory.hardwareByCatalogCategory;
assert.equal(Object.values(categoryCoverage).reduce((total, category) => total + category.references, 0), inventory.totals.vendorHardwareReferences);
assert.deepEqual(categoryCoverage["Analog I/O modules"], { references: 88, exactEditableModels: 3, verifiedTerminalMaps: 3 });
assert.deepEqual(categoryCoverage["PLC controllers"], { references: 96, exactEditableModels: 3, verifiedTerminalMaps: 3 });
assert.deepEqual(categoryCoverage["HMI devices"], { references: 25, exactEditableModels: 0, verifiedTerminalMaps: 0 });
assert.equal(categoryCoverage["Programming software"], undefined);
assert.equal(inventory.totals.fbdBlockTypes, 25);
assert.deepEqual(inventory.softwareAndProcess.ladderInstructions, {
  contactModes: ["NO", "NC", "R_TRIG", "F_TRIG"],
  coilModes: ["normal", "set", "reset"],
  timerTypes: ["TON", "TOF", "TP", "RTO"],
  counterTypes: ["CTU", "CTD"],
  mcrModes: ["start", "end"],
});
assert.ok(inventory.softwareAndProcess.fbdBlockTypes.includes("TON"));
assert.deepEqual(inventory.softwareAndProcess.processModelTypes, ["tank", "conveyor", "motor", "thermal", "pump", "pid"]);
assert.equal(inventory.totals.processModelTypes, 6);
assert.ok(inventory.records.every(({ layer }) => ["hardware-reference", "vendor-software", "schematic-model"].includes(layer)));
const cpuTerminalIds = [6, 10, 8].flatMap((count, index) =>
  Array.from({ length:count }, (_, pin) => `X${[80, 10, 11][index]}-${pin + 1}`));
const transistorCpu = inventory.records.find(({ id }) => id === "model:siemensS71212CG2");
const relayCpu = inventory.records.find(({ id }) => id === "model:siemensS71212CG2Relay");
for (const cpu of [transistorCpu, relayCpu]) {
  assert.equal(cpu.readiness.terminalMap, "verified-topology");
  assert.deepEqual(cpu.terminalSchedule.map(({ id }) => id), cpuTerminalIds);
  assert.deepEqual(cpu.terminalSchedule.filter(({ connectable }) => !connectable).map(({ id }) => id), ["X80-3"]);
  assert.deepEqual(cpu.commonGroups.inputCommonPins, ["X10-8", "X10-10"]);
}
assert.equal(transistorCpu.orderCode, "6ES7212-1AG50-0XB0");
assert.equal(relayCpu.orderCode, "6ES7212-1HG50-0XB0");
assert.deepEqual(transistorCpu.commonGroups.outputSupply, { positive:"X11-2", return:"X11-1" });
assert.deepEqual(relayCpu.commonGroups.relayCommonPins, ["X11-1", "X11-2"]);
assert.equal(searchIndustrialCatalog({ manufacturer: "Finder" }).total, 4902);
const finderReference = searchIndustrialCatalog({ manufacturer: "Finder", query: "936100247" }).items[0];
assert.equal(finderReference.identifier, "936100247");
assert.equal(finderReference.simulation.status, "reference-only");
assert.equal(finderReference.source.exportDate, "2026-09-02");
assert.equal(searchIndustrialCatalog({ manufacturer: "Doepke" }).total, 4640);
const doepkeReference = searchIndustrialCatalog({ manufacturer: "Doepke", query: "09112601" }).items[0];
assert.equal(doepkeReference.identifier, "09112601", "the manufacturer's leading zero is preserved");
assert.equal(doepkeReference.attributes.etimClass, "EC000003");
assert.equal(doepkeReference.simulation.status, "reference-only");
const et200al = industrialProductCatalog.filter(({ family }) => family === "SIMATIC ET 200AL");
assert.equal(et200al.length, 23);
assert.ok(et200al.every(({ source, simulation }) => source.exportDate === "2025-10-10" && simulation.status === "reference-only"));
const et200alCables = industrialProductCatalog.filter(({ family }) => family === "SIMATIC ET 200AL interconnect");
assert.equal(et200alCables.length, 36);
assert.ok(et200alCables.every(({ attributes, simulation }) => attributes.lengthM > 0 && simulation.status === "reference-only"));
const et200alPowerCables = industrialProductCatalog.filter(({ family }) => family === "SIMATIC ET 200AL power cabling");
assert.equal(et200alPowerCables.length, 34);
assert.ok(et200alPowerCables.every(({ attributes, simulation }) => attributes.lengthM > 0 && simulation.status === "reference-only"));
for (const item of industrialProductCatalog) {
  assert.match(item.source.url, /^https:\/\//);
  assert.equal(item.simulation.status === "supported", false, `${item.identifier} must not imply unsupported vendor simulation`);
  assert.ok(item.simulation.limitations.length > 20);
}
const siemensOverview = industrialProductCatalog.filter((item) => item.manufacturer === "Siemens" && item.source.title.includes("export 2025-10-02"));
assert.equal(siemensOverview.length, 163, "Siemens additions are distinct entries in its official S7-1200 export");
assert.ok(siemensOverview.every((item) => item.attributes.officialDescription && item.simulation.status === "reference-only"), "Siemens overview entries carry sourced descriptions and remain reference-only");
const siemens1500 = industrialProductCatalog.filter((item) => item.manufacturer === "Siemens" && item.source.exportDate === "2024-09-29");
assert.equal(siemens1500.length, 75, "S7-1500 references match distinct rows in Siemens' official 2024 export");
assert.ok(siemens1500.every((item) => item.attributes.officialDescription && item.simulation.status === "reference-only" && item.source.url.includes("S7_1500")), "S7-1500 records retain source labels, export date, and reference-only status");
const et200sp = industrialProductCatalog.filter((item) => item.manufacturer === "Siemens" && item.source.title === "Siemens product overview for SIMATIC ET 200SP (export 2025-10-14)");
assert.equal(et200sp.length, 96, "ET 200SP additions are distinct entries from Siemens' official export");
assert.ok(et200sp.every((item) => item.attributes.officialDescription && item.simulation.status === "reference-only" && item.source.url.includes("ET200_SP")), "ET 200SP records retain official names, source and simulation boundary");
const et200spExpansion = industrialProductCatalog.filter((item) => item.manufacturer === "Siemens" && item.source.title.includes("ET 200SP expansion hardware"));
assert.equal(et200spExpansion.length, 70, "ET 200SP base units and bus adapters are sourced distinct entries");
assert.ok(et200spExpansion.every((item) => item.attributes.officialDescription && item.simulation.status === "reference-only" && item.source.exportDate === "2025-10-14"), "ET 200SP installation hardware retains source and simulation boundary");
const logo8 = industrialProductCatalog.filter((item) => item.manufacturer === "Siemens" && item.source.exportDate === "2025-10-08");
assert.equal(logo8.length, 58, "LOGO! 8 additions are distinct entries from Siemens' official export");
assert.ok(logo8.every((item) => item.attributes.officialDescription && item.simulation.status === "reference-only" && item.source.url.includes("LOGO8")), "LOGO! 8 records retain official names, source and simulation boundary");
assert.equal(searchIndustrialCatalog({ query:"6ES7522-5HF00-0AB0" }).items[0].attributes.officialDescription,"S7-1500, DQ 8x230VAC/5A ST (Relay)");
assert.equal(searchIndustrialCatalog({ query:"6ES7131-6BF01-0AA0" }).items[0].attributes.officialDescription,"ET 200SP DI 8x 24V DC Basic, PU 1");
assert.equal(searchIndustrialCatalog({ query:"6ES7136-6PA00-0BC0" }).items[0].category,"Power modules");
assert.equal(searchIndustrialCatalog({ query:"6ED1052-1MD08-0BA2" }).items[0].attributes.officialDescription,"LOGO! 12/24RCE, 8DI (4AI)/4DO, 400 Blocks");
assert.equal(searchIndustrialCatalog({ query:"6ES7193-6BP00-0BA0" }).items[0].category,"Base units");
const ui = readFileSync(new URL("../src/electrical-ui.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
assert.ok(ui.includes("searchIndustrialCatalog") && ui.includes('id="industrialCatalogSearch"'), "Components workspace exposes a searchable catalog");
assert.ok(ui.includes("item.source.url") && ui.includes("item.simulation.limitations"), "catalog rows expose manufacturer provenance and simulation limits");
assert.ok(!ui.includes('data-electrical-action="add-catalog"'), "reference-only catalog products cannot be placed as simulated devices");
assert.ok(worker.includes('"./src/industrial-catalog.js"'), "offline shell caches the catalog module");
assert.ok(worker.includes('"./src/finder-catalog-data.js"'), "offline shell caches Finder order data");
assert.ok(worker.includes('"./src/doepke-catalog-data.js"'), "offline shell caches Doepke order data");
const unsupported = industrialProductCatalog.find((item) => item.identifier === "LC1D09B7");
assert.equal(unsupported.simulation.status, "reference-only");
assert.match(unsupported.simulation.limitations, /24 V DC/);
assert.match(searchIndustrialCatalog({ query: "6ES7223-1BH32-0XB0" }).items[0].attributes.output, /0.5 A/);
console.log(`PASS: ${validation.count} unique sourced products, search, provenance, and simulation-boundary checks`);
