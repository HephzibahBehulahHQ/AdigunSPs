import assert from "node:assert/strict";
import { validateHardwareItem } from "../src/hardware.js";
import { createHardwareBomCsv, createHardwareBomPrintHtml, createPanelLayoutReferenceHtml } from "../src/reports.js";
import { brandPresentation } from "../src/brand.js";
import { ui } from "../src/locale-ui.js";

assert.equal(validateHardwareItem({ description:" ", quantity:1 }).valid, false, "description is required");
assert.equal(validateHardwareItem({ description:"Sensor", quantity:0 }).valid, false, "quantity must be positive");
assert.equal(validateHardwareItem({ description:"Sensor", quantity:1.5 }).valid, false, "quantity must be a whole number");
const item = validateHardwareItem({ category:"User supplied", manufacturer:'ACME "A"', partNumber:"P-1", description:"<Sensor>", quantity:"2", notes:"Check & verify", tag:"Level", panelPosition:"Slot <user>" });
assert.equal(item.valid, true);
assert.equal(item.item.quantity, 2);
const project = { name:"Study", tags:[{ name:"Level", address:"AI-2" }], hardwareItems:[item.item] };
const identity = brandPresentation("en", "light");
const csv = createHardwareBomCsv(project, identity, "en");
assert.ok(csv.startsWith("\uFEFF\"Product\",\"Company\",\"Attribution\""), "BOM CSV has branded metadata and UTF-8 BOM");
assert.ok(csv.includes('"HEPHZIBAH BEHULAH"') && csv.includes('"ACME ""A"""') && csv.includes('"<Sensor>"'), "BOM CSV preserves user values and escapes quotes");
for (const locale of ["en", "de", "yo", "pcm"]) {
  assert.ok(createHardwareBomCsv(project, brandPresentation(locale, "light"), locale).includes(`"${ui[locale].safety}"`), `${locale} BOM CSV includes the localized educational safety notice`);
  const html = createHardwareBomPrintHtml(project, brandPresentation(locale, "light"), locale, "Safety");
  assert.ok(html.includes(identity.productName) && html.includes(identity.companyName), `${locale} BOM is branded`);
  assert.ok(html.includes("&lt;Sensor&gt;") && !html.includes("<td><Sensor></td>"), `${locale} BOM escapes user HTML`);
}
const labels = ["Hardware inventory / BOM", "Hardware-Inventar / Stückliste", "Àkọsílẹ̀ hardware / BOM"];
const app = await (await import("node:fs/promises")).readFile(new URL("../src/app.js", import.meta.url), "utf8");
for (const label of labels) assert.ok(app.includes(label), `hardware inventory label localized: ${label}`);
assert.ok(app.includes('onclick = exportHardwareBom') && app.includes('onclick = printHardwareBom'), "inventory exposes CSV and print exports");
const panel = createPanelLayoutReferenceHtml(project, { ...brandPresentation("en", "light"), productLogo:"product-light.svg", companyWordmark:"company-light.svg" }, "en", "Reference only");
assert.ok(panel.includes("Level") && panel.includes("AI-2") && panel.includes("Slot &lt;user&gt;") && panel.includes("not a panel design"), "panel reference links only user-entered tag and position and discloses its scope");
for (const [locale, title] of [["en", "Panel layout reference"], ["de", "Schaltschrank-Layoutreferenz"], ["yo", "Ìtọ́kasí ìṣètò paneli"], ["pcm", "Panel layout reference"]]) {
  const localizedPanel = createPanelLayoutReferenceHtml(project, brandPresentation(locale, "light"), locale);
  assert.ok(localizedPanel.includes(title) && localizedPanel.includes("HEPHZIBAH BEHULAH") && localizedPanel.includes("AdigunSPs"), `${locale} panel layout reference is localized and branded`);
}
assert.ok(app.includes('data-hardware-edit="tag"') && app.includes('id="printPanelLayout"'), "inventory lets users link an I/O tag and print the panel reference");
console.log("PASS: hardware item validation, four-locale branded BOM exports, escaping, and UI bindings");
