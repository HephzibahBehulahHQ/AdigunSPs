import { ui } from "./locale-ui.js";

const headings = {
  en:["Project", "Product", "Company", "Attribution", "Tag", "Type", "Role", "Address", "Alias", "Initial value"],
  de:["Projekt", "Produkt", "Unternehmen", "Zuordnung", "Variable", "Typ", "Rolle", "Adresse", "Alias", "Anfangswert"],
  yo:["Iṣẹ́ akanṣe", "Ọjà", "Ilé-iṣẹ́", "Ìdámọ̀", "Àmì", "Irú", "Ipa", "Àdírẹ́sì", "Alias", "Iye ìbẹ̀rẹ̀"],
  pcm:["Project", "Product", "Company", "Attribution", "Tag", "Type", "Role", "Address", "Alias", "Initial value"],
};

function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function html(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[char]); }
function reportBrand(presentation) { return `<div class="io-report-logos"><img src="${html(presentation.companyLogo)}" alt="${html(presentation.companyName)} official corporate logo"><span class="report-product-wordmark"><strong>${html(presentation.productName)}</strong><small>${html(presentation.divisionLabel)}</small></span></div>`; }
function csvDocument(rows, locale) {
  const labels = { en:"Safety notice", de:"Sicherheitshinweis", yo:"Ìkìlọ̀ ààbò", pcm:"Safety notice" };
  const footer = [labels[locale] || labels.en, ui[locale]?.safety || ui.en.safety];
  return `\uFEFF${[...rows, footer].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
function scheduleRows(project, presentation) {
  const io = project.io || {}, inputs = new Set(io.inputs || []), outputs = new Set(io.outputs || []);
  const tags = [...(project.tags || [])].sort((a, b) => String(a.address || a.name).localeCompare(String(b.address || b.name), undefined, { numeric:true }) || String(a.name).localeCompare(String(b.name)));
  return tags.map((tag) => [project.name, presentation.productName, presentation.companyName, presentation.attribution, tag.name, tag.type || "BOOL", tag.role || (outputs.has(tag.name) ? "output" : inputs.has(tag.name) ? "input" : "internal"), tag.address || tag.name, tag.alias || "", project.initialState?.[tag.name] ?? ""]);
}

export function createIoScheduleCsv(project, presentation, locale = "en") {
  const rows = [headings[locale] || headings.en, ...scheduleRows(project, presentation)];
  return csvDocument(rows, locale);
}

export function createIoSchedulePrintHtml(project, presentation, locale = "en", safety = "") {
  const titles = { en:"I/O Schedule", de:"E/A-Liste", yo:"Àtòjọ I/O", pcm:"I/O Schedule" }, title = titles[locale] || titles.en, rows = scheduleRows(project, presentation);
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${html(cell)}</td>`).join("")}</tr>`).join("");
  return `<header class="io-report-header">${reportBrand(presentation)}<h1>${html(title)}</h1><p>${html(presentation.attribution)}</p><p><strong>${html(headings[locale]?.[0] || headings.en[0])}:</strong> ${html(project.name)}</p></header><table class="io-report-table"><thead><tr>${(headings[locale] || headings.en).map((cell) => `<th>${html(cell)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table><footer class="io-report-safety">${html(safety)}</footer>`;
}

export function createWiringReferenceHtml(project, presentation, locale = "en", safety = "") {
  const copy = {
    en:{ title:"I/O Wiring Reference Worksheet", channel:"Direction", input:"Input", output:"Output", tag:"PLC tag", type:"Type", address:"Configured I/O address", signal:"Signal / alias", field:"Field device / terminal", wire:"Wire number", notes:"Wiring notes", scope:"Reference worksheet only. Complete field terminals, conductor details, protection, and ratings from the verified hardware design." },
    de:{ title:"Arbeitsblatt I/O-Verdrahtungsreferenz", channel:"Richtung", input:"Eingang", output:"Ausgang", tag:"SPS-Variable", type:"Typ", address:"Konfigurierte E/A-Adresse", signal:"Signal / Alias", field:"Feldgerät / Klemme", wire:"Drahtnummer", notes:"Verdrahtungshinweise", scope:"Nur ein Referenzblatt. Feldklemmen, Leiterdaten, Schutz und Bemessungswerte anhand des geprüften Hardwareplans ergänzen." },
    yo:{ title:"Ìwé ìtọ́kasí wiring I/O", channel:"Ìtọ́sọ́nà", input:"Ìwọlé", output:"Ìjáde", tag:"Àmì PLC", type:"Irú", address:"Àdírẹ́sì I/O tí a ṣètò", signal:"Signal / alias", field:"Ẹ̀rọ pápá / terminal", wire:"Nọ́ńbà wire", notes:"Àkíyèsí wiring", scope:"Ìwé ìtọ́kasí nìkan ni. Fi terminal, conductor, ààbò àti rating kún un láti inú àwòrán hardware tí a fọwọ́sí." },
    pcm:{ title:"I/O Wiring Reference Worksheet", channel:"Direction", input:"Input", output:"Output", tag:"PLC tag", type:"Type", address:"Configured I/O address", signal:"Signal / alias", field:"Field device / terminal", wire:"Wire number", notes:"Wiring notes", scope:"Na reference sheet only. Fill field terminals, conductor details, protection, and ratings from verified hardware design." },
  }[locale] || { title:"I/O Wiring Reference Worksheet", channel:"Direction", input:"Input", output:"Output", tag:"PLC tag", type:"Type", address:"Configured I/O address", signal:"Signal / alias", field:"Field device / terminal", wire:"Wire number", notes:"Wiring notes", scope:"Reference worksheet only. Complete field terminals, conductor details, protection, and ratings from the verified hardware design." };
  const inputs = new Set(project.io?.inputs || []), outputs = new Set(project.io?.outputs || []);
  const mapped = (project.tags || []).filter((tag) => inputs.has(tag.name) || outputs.has(tag.name)).sort((a, b) => String(a.address || a.name).localeCompare(String(b.address || b.name), undefined, { numeric:true }));
  const rows = mapped.map((tag) => [inputs.has(tag.name) ? copy.input : copy.output, tag.name, tag.type || "BOOL", tag.address || tag.name, tag.alias || tag.label?.[locale] || "", "", "", ""]).map((cells) => `<tr>${cells.map((cell) => `<td>${html(cell)}</td>`).join("")}</tr>`).join("");
  const headers = [copy.channel, copy.tag, copy.type, copy.address, copy.signal, copy.field, copy.wire, copy.notes];
  return `<header class="io-report-header">${reportBrand(presentation)}<h1>${html(copy.title)}</h1><p>${html(presentation.attribution)}</p><p><strong>${html(project.name)}</strong></p></header><p>${html(copy.scope)}</p><table class="io-report-table"><thead><tr>${headers.map((cell) => `<th>${html(cell)}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="8">—</td></tr>`}</tbody></table><footer class="io-report-safety">${html(safety)}</footer>`;
}

const bomCopy = {
  en:{ title:"Hardware bill of materials", category:"Category", manufacturer:"Manufacturer", part:"Part number", description:"Description", quantity:"Quantity", notes:"Notes", tag:"PLC tag", position:"Panel position", empty:"No hardware items entered. Add only verified project equipment.", scope:"User-entered inventory only. No device, manufacturer, part number, rating, or suitability has been inferred." },
  de:{ title:"Hardware-Stückliste", category:"Kategorie", manufacturer:"Hersteller", part:"Artikelnummer", description:"Beschreibung", quantity:"Menge", notes:"Notizen", tag:"SPS-Variable", position:"Schaltschrankposition", empty:"Keine Hardware eingetragen. Nur geprüfte Projektausrüstung hinzufügen.", scope:"Nur manuell eingetragene Inventardaten. Gerät, Hersteller, Artikelnummer, Bemessungswert oder Eignung wurden nicht abgeleitet." },
  yo:{ title:"Àtòjọ ohun èlò hardware", category:"Ẹ̀ka", manufacturer:"Olùṣe", part:"Nọ́ńbà apá", description:"Àpèjúwe", quantity:"Iye", notes:"Àkọsílẹ̀", tag:"Àmì PLC", position:"Ipo paneli", empty:"Kò sí hardware tí a tẹ̀ sí i. Fi ohun èlò iṣẹ́ akanṣe tí a ti fìdí rẹ̀ múlẹ̀ nìkan kún un.", scope:"Àkọsílẹ̀ ohun èlò tí olùlò tẹ̀ sí i nìkan. A kò dá ẹrọ, olùṣe, nọ́ńbà apá, rating tàbí ìbámu sílẹ̀." },
  pcm:{ title:"Hardware bill of materials", category:"Category", manufacturer:"Manufacturer", part:"Part number", description:"Description", quantity:"Quantity", notes:"Notes", tag:"PLC tag", position:"Panel position", empty:"No hardware item dey here. Add only equipment wey person don verify for this project.", scope:"Na user-entered inventory only. We no guess device, manufacturer, part number, rating, or suitability." },
};

export function createHardwareBomCsv(project, presentation, locale = "en") {
  const copy = bomCopy[locale] || bomCopy.en;
  const rows = [["Product", "Company", "Attribution", "Project", copy.category, copy.manufacturer, copy.part, copy.description, copy.quantity, copy.notes, copy.tag, copy.position], ...(project.hardwareItems || []).map((item) => [presentation.productName, presentation.companyName, presentation.attribution, project.name, item.category, item.manufacturer, item.partNumber, item.description, item.quantity, item.notes, item.tag, item.panelPosition])];
  return csvDocument(rows, locale);
}

export function createHardwareBomPrintHtml(project, presentation, locale = "en", safety = "") {
  const copy = bomCopy[locale] || bomCopy.en, headers = [copy.category, copy.manufacturer, copy.part, copy.description, copy.quantity, copy.notes, copy.tag, copy.position];
  const items = project.hardwareItems || [];
  const rows = items.map((item) => [item.category, item.manufacturer, item.partNumber, item.description, item.quantity, item.notes, item.tag, item.panelPosition].map((cell) => `<td>${html(cell)}</td>`).join(""));
  return `<header class="io-report-header">${reportBrand(presentation)}<h1>${html(copy.title)}</h1><p>${html(presentation.attribution)}</p><p><strong>${html(project.name)}</strong></p></header><p>${html(copy.scope)}</p><table class="io-report-table"><thead><tr>${headers.map((cell) => `<th>${html(cell)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${row}</tr>`).join("") : `<tr><td colspan="8">${html(copy.empty)}</td></tr>`}</tbody></table><footer class="io-report-safety">${html(safety)}</footer>`;
}

export function createPanelLayoutReferenceHtml(project, presentation, locale = "en", safety = "") {
  const copy = {
    en:{ title:"Panel layout reference", item:"Hardware item", tag:"Linked PLC tag", address:"I/O address", position:"User-entered panel position", scope:"Reference only. Positions and tag links are user supplied; this report is not a panel design, electrical schematic, or installation instruction." },
    de:{ title:"Schaltschrank-Layoutreferenz", item:"Hardwareeintrag", tag:"Verknüpfte SPS-Variable", address:"E/A-Adresse", position:"Manuell eingetragene Position", scope:"Nur eine Referenz. Positionen und Variablenverknüpfungen stammen vom Benutzer; dies ist kein Schaltschrankentwurf, Stromlaufplan oder Installationshinweis." },
    yo:{ title:"Ìtọ́kasí ìṣètò paneli", item:"Ohun èlò hardware", tag:"Àmì PLC tí a so mọ́ ọn", address:"Àdírẹ́sì I/O", position:"Ipo paneli tí olùlò tẹ̀ sí i", scope:"Ìtọ́kasí nìkan. Olùlò ló tẹ ipo àti ìsopọ̀ àmì sí i; ìròyìn yìí kì í ṣe àwòrán paneli, schematic iná tàbí ìtọ́sọ́nà fifi sori ẹrọ." },
    pcm:{ title:"Panel layout reference", item:"Hardware item", tag:"PLC tag wey link", address:"I/O address", position:"Panel position wey user enter", scope:"Reference only. User supply the positions and tag links; this report no be panel design, electrical schematic, or installation instruction." },
  }[locale] || { title:"Panel layout reference", item:"Hardware item", tag:"Linked PLC tag", address:"I/O address", position:"User-entered panel position", scope:"Reference only. Positions and tag links are user supplied; this report is not a panel design, electrical schematic, or installation instruction." };
  const tags = new Map((project.tags || []).map((tag) => [tag.name, tag]));
  const rows = (project.hardwareItems || []).map((item) => { const linked = tags.get(item.tag); return [item.description, item.tag || "", linked?.address || "", item.panelPosition || ""].map((cell) => `<td>${html(cell)}</td>`).join(""); }).join("");
  const headers = [copy.item, copy.tag, copy.address, copy.position];
  return `<header class="io-report-header">${reportBrand(presentation)}<h1>${html(copy.title)}</h1><p>${html(presentation.attribution)}</p><p><strong>${html(project.name)}</strong></p></header><p>${html(copy.scope)}</p><table class="io-report-table"><thead><tr>${headers.map((cell) => `<th>${html(cell)}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="4">—</td></tr>`}</tbody></table><footer class="io-report-safety">${html(safety)}</footer>`;
}

const testReportHeadings = {
  en:["Product", "Company", "Attribution", "Example ID", "Example", "Difficulty", "Scenario", "Inputs", "Result", "Expected", "Actual", "Fault explanation"],
  de:["Produkt", "Unternehmen", "Zuordnung", "Beispiel-ID", "Beispiel", "Schwierigkeit", "Szenario", "Eingänge", "Ergebnis", "Erwartet", "Tatsächlich", "Fehlerhinweis"],
  yo:["Ọjà", "Ilé-iṣẹ́", "Ìdámọ̀", "ID àpẹẹrẹ", "Àpẹẹrẹ", "Ìpele ìṣòro", "Ìdánwò", "Àwọn ìwọlé", "Àbájáde", "Ohun tí a retí", "Ohun tó ṣẹlẹ̀", "Àlàyé àṣìṣe"],
  pcm:["Product", "Company", "Attribution", "Example ID", "Example", "Level", "Scenario", "Inputs", "Result", "Expected", "Actual", "Fault explanation"],
};
const localized = (value, locale) => value && typeof value === "object" ? value[locale] ?? value.en ?? "" : value ?? "";

const scenarioReportCopy = {
  en:{ title:"Simulation scenario test report", scan:"Scan", inputs:"Inputs", expected:"Expected outputs", actual:"Actual outputs", result:"Result", pass:"PASS", fail:"FAIL", na:"NOT CHECKED" },
  de:{ title:"Testbericht des Simulationsszenarios", scan:"Scan", inputs:"Eingänge", expected:"Erwartete Ausgänge", actual:"Tatsächliche Ausgänge", result:"Ergebnis", pass:"BESTANDEN", fail:"FEHLER", na:"NICHT GEPRÜFT" },
  yo:{ title:"Ìròyìn ìdánwò ìtẹ̀lé àfarawé", scan:"Scan", inputs:"Àwọn ìwọlé", expected:"Àwọn ìjáde tí a retí", actual:"Àwọn ìjáde gidi", result:"Àbájáde", pass:"KỌJÁ", fail:"KÒ KỌJÁ", na:"A KÒ ṢE ÀYẸ̀WÒ" },
  pcm:{ title:"Simulation scenario test report", scan:"Scan", inputs:"Inputs", expected:"Expected outputs", actual:"Actual outputs", result:"Result", pass:"PASS", fail:"FAIL", na:"NO CHECK" },
};
const scenarioValue = (value) => JSON.stringify(value ?? {});
const scenarioResult = (pass, copy) => pass === null ? copy.na : pass ? copy.pass : copy.fail;

export function createScenarioTestReportCsv(project, scenario, results, presentation, locale = "en") {
  const copy = scenarioReportCopy[locale] || scenarioReportCopy.en;
  const rows = [["Product", "Company", "Attribution", "Project", "Scenario", copy.scan, copy.inputs, copy.expected, copy.actual, copy.result], ...(results || []).map((row) => [presentation.productName, presentation.companyName, presentation.attribution, project.name, scenario?.name || "Scenario", row.index, scenarioValue({ ...(row.inputs || {}), ...(row.numericInputs || {}) }), scenarioValue(row.expected), scenarioValue(row.actual), scenarioResult(row.pass, copy)])];
  return csvDocument(rows, locale);
}

export function createScenarioTestReportHtml(project, scenario, results, presentation, locale = "en", safety = "") {
  const copy = scenarioReportCopy[locale] || scenarioReportCopy.en, headers = [copy.scan, copy.inputs, copy.expected, copy.actual, copy.result];
  const rows = (results || []).map((row) => `<tr><td>${html(row.index)}</td><td>${html(scenarioValue({ ...(row.inputs || {}), ...(row.numericInputs || {}) }))}</td><td>${html(scenarioValue(row.expected))}</td><td>${html(scenarioValue(row.actual))}</td><td>${html(scenarioResult(row.pass, copy))}</td></tr>`).join("");
  return `<header class="io-report-header">${reportBrand(presentation)}<h1>${html(copy.title)}</h1><p>${html(presentation.attribution)}</p><p><strong>${html(project.name)}</strong> · ${html(scenario?.name || "Scenario")}</p></header><table class="io-report-table"><thead><tr>${headers.map((cell) => `<th>${html(cell)}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="5">—</td></tr>`}</tbody></table><footer class="io-report-safety">${html(safety)}</footer>`;
}

export function createExampleTestReportCsv(example, checks, presentation, locale = "en") {
  const rows = [testReportHeadings[locale] || testReportHeadings.en];
  for (const check of checks) {
    const testCase = example.testCases.find((item) => localized(item.name, locale) === localized(check.name, locale)) || {};
    rows.push([
      presentation.productName, presentation.companyName, presentation.attribution, example.id, localized(example.title, locale),
      localized(example.difficulty, locale), localized(check.name, locale), JSON.stringify(testCase.sequence || { ...(testCase.inputs || {}), ...(testCase.numericInputs || {}) }),
      check.pass ? ({ en:"PASS", de:"BESTANDEN", yo:"KỌJÁ", pcm:"PASS" })[locale] || "PASS" : ({ en:"FAIL", de:"FEHLER", yo:"KÒ KỌJÁ", pcm:"FAIL" })[locale] || "FAIL",
      check.expected, check.actual, localized(example.faultExplanations, locale),
    ]);
  }
  return csvDocument(rows, locale);
}

export function createTrendHistoryCsv(project, history, presentation, locale = "en") {
  const headers = {
    en:["Product", "Company", "Attribution", "Project", "Tag", "Sample", "Timestamp (UTC)", "Value"],
    de:["Produkt", "Unternehmen", "Zuordnung", "Projekt", "Variable", "Messpunkt", "Zeitstempel (UTC)", "Wert"],
    yo:["Ọjà", "Ilé-iṣẹ́", "Ìdámọ̀", "Iṣẹ́ akanṣe", "Àmì", "Àpẹẹrẹ iye", "Àkókò (UTC)", "Iye"],
    pcm:["Product", "Company", "Attribution", "Project", "Tag", "Sample", "Time (UTC)", "Value"],
  }[locale] || ["Product", "Company", "Attribution", "Project", "Tag", "Sample", "Timestamp (UTC)", "Value"];
  const rows = [headers];
  for (const [tag, samples] of Object.entries(history || {})) for (const [index, sample] of samples.entries()) {
    rows.push([presentation.productName, presentation.companyName, presentation.attribution, project.name, tag, index + 1, new Date(sample.time).toISOString(), sample.value]);
  }
  return csvDocument(rows, locale);
}
