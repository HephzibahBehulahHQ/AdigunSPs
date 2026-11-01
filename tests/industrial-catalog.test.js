import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { industrialProductCatalog, searchIndustrialCatalog, validateIndustrialCatalog } from "../src/industrial-catalog.js";

const validation = validateIndustrialCatalog();
assert.equal(validation.ok, true, validation.errors.join(", "));
assert.equal(validation.count, 220, "catalog has 220 distinct provenance-backed product references");
assert.equal(validation.unique, validation.count);
assert.equal(new Set(industrialProductCatalog.map(({ manufacturer, identifier }) => `${manufacturer}|${identifier}`)).size, 220);
assert.equal(searchIndustrialCatalog({ query: "E3Z-T61" }).items[0].identifier, "E3Z-T61");
assert.equal(searchIndustrialCatalog({ manufacturer: "OMRON" }).total, 28);
assert.equal(searchIndustrialCatalog({ category: "PLC controllers" }).total, 50);
assert.equal(searchIndustrialCatalog({ category: "Digital I/O modules" }).total, 50);
assert.equal(searchIndustrialCatalog({ category: "Analog I/O modules" }).total, 35);
assert.equal(searchIndustrialCatalog({ category: "Communications modules" }).total, 34);
assert.equal(searchIndustrialCatalog({ category: "Power supplies", manufacturer: "Siemens" }).items[0].identifier, "6EP1332-1SH71");
assert.equal(searchIndustrialCatalog({ query: "24 V AC", limit: 1 }).items[0].identifier, "LC1D09B7");
assert.equal(searchIndustrialCatalog({ query: "CPU", limit: 5, offset: 3 }).items.length, 5);
assert.equal(searchIndustrialCatalog({ query: "not-a-real-model" }).total, 0);
for (const item of industrialProductCatalog) {
  assert.match(item.source.url, /^https:\/\//);
  assert.equal(item.simulation.status === "supported", false, `${item.identifier} must not imply unsupported vendor simulation`);
  assert.ok(item.simulation.limitations.length > 20);
}
const siemensOverview = industrialProductCatalog.filter((item) => item.manufacturer === "Siemens" && item.source.title.includes("export 2025-10-02"));
assert.equal(siemensOverview.length, 163, "Siemens additions are distinct entries in its official S7-1200 export");
assert.ok(siemensOverview.every((item) => item.attributes.officialDescription && item.simulation.status === "reference-only"), "Siemens overview entries carry sourced descriptions and remain reference-only");
const ui = readFileSync(new URL("../src/electrical-ui.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
assert.ok(ui.includes("searchIndustrialCatalog") && ui.includes('id="industrialCatalogSearch"'), "Components workspace exposes a searchable catalog");
assert.ok(ui.includes("item.source.url") && ui.includes("item.simulation.limitations"), "catalog rows expose manufacturer provenance and simulation limits");
assert.ok(!ui.includes('data-electrical-action="add-catalog"'), "reference-only catalog products cannot be placed as simulated devices");
assert.ok(worker.includes('"./src/industrial-catalog.js"'), "offline shell caches the catalog module");
const unsupported = industrialProductCatalog.find((item) => item.identifier === "LC1D09B7");
assert.equal(unsupported.simulation.status, "reference-only");
assert.match(unsupported.simulation.limitations, /24 V DC/);
assert.match(searchIndustrialCatalog({ query: "6ES7223-1BH32-0XB0" }).items[0].attributes.output, /0.5 A/);
console.log(`PASS: ${validation.count} unique sourced products, search, provenance, and simulation-boundary checks`);
