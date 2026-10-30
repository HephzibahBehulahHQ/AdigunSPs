const csvCopy = {
  en:{ company:"Company",product:"Product",attribution:"Attribution",project:"Project",elapsed:"Simulated time (hours)",output:"Output",runtime:"Session runtime (hours)",duty:"Duty cycle (%)",load:"Entered load (kW)",average:"Estimated average power (kW)",energy:"Estimated energy (kWh)",tariff:"Entered tariff per kWh",cost:"Estimated cost",advisory:"Advisory" },
  de:{ company:"Unternehmen",product:"Produkt",attribution:"Zuordnung",project:"Projekt",elapsed:"Simulierte Zeit (Stunden)",output:"Ausgang",runtime:"Laufzeit in dieser Sitzung (Stunden)",duty:"Tastgrad (%)",load:"Eingegebene Last (kW)",average:"Geschätzte mittlere Leistung (kW)",energy:"Geschätzte Energie (kWh)",tariff:"Eingegebener Tarif je kWh",cost:"Geschätzte Kosten",advisory:"Hinweis" },
  yo:{ company:"Ilé-iṣẹ́",product:"Ọjà",attribution:"Ìdásílẹ̀",project:"Iṣẹ́",elapsed:"Àkókò ìṣàfarawé (wákàtí)",output:"Àbájáde",runtime:"Àkókò iṣẹ́ ìgbà yìí (wákàtí)",duty:"Ìpín àkókò iṣẹ́ (%)",load:"Agbára tí a tẹ̀ sí i (kW)",average:"Agbára àárín tí a fojú díwọ̀n (kW)",energy:"Agbára tí a fojú díwọ̀n (kWh)",tariff:"Owó tí a tẹ̀ sí i fún kWh",cost:"Ìye owó tí a fojú díwọ̀n",advisory:"Ìmọ̀ràn" },
  pcm:{ company:"Company",product:"Product",attribution:"Attribution",project:"Project",elapsed:"Simulated time (hours)",output:"Output",runtime:"Session runtime (hours)",duty:"Duty cycle (%)",load:"Load wey user enter (kW)",average:"Estimated average power (kW)",energy:"Estimated energy (kWh)",tariff:"Tariff wey user enter per kWh",cost:"Estimated cost",advisory:"Advice" },
};
const nonnegative = (value) => { if (value == null || value === "") return null; const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : null; };

export function recordOperationsScan(session = {}, outputs = {}, dt = 0, outputNames = Object.keys(outputs)) {
  const elapsed = Number.isFinite(Number(dt)) && Number(dt) > 0 ? Number(dt) : 0;
  const outputRuntimeMs = { ...(session.outputRuntimeMs || {}) };
  for (const name of outputNames) if (outputs[name] === true) outputRuntimeMs[name] = (Number(outputRuntimeMs[name]) || 0) + elapsed;
  return { elapsedMs:(Number(session.elapsedMs) || 0) + elapsed, outputRuntimeMs };
}

export function calculateOperations(session = {}, config = {}, outputNames = []) {
  const elapsedMs = Number(session.elapsedMs) || 0, tariff = nonnegative(config.tariffPerKwh), threshold = nonnegative(config.maxDutyPct);
  const rows = [...new Set(outputNames)].map((name) => {
    const runtimeMs = Math.max(0, Number(session.outputRuntimeMs?.[name]) || 0), runtimeHours = runtimeMs / 3600000;
    const dutyPct = elapsedMs ? Math.min(100, runtimeMs / elapsedMs * 100) : 0, loadKw = nonnegative(config.loadKw?.[name]);
    const energyKwh = loadKw === null ? null : runtimeHours * loadKw, cost = energyKwh === null || tariff === null ? null : energyKwh * tariff;
    return { name, runtimeMs, runtimeHours, dutyPct, loadKw, averageKw:loadKw === null ? null : loadKw * dutyPct / 100, energyKwh, cost, advisory:Boolean(threshold !== null && dutyPct > threshold) };
  });
  return { elapsedMs, elapsedHours:elapsedMs / 3600000, tariff, maxDutyPct:threshold, rows,
    averagePowerKw:rows.length && rows.every((row) => row.averageKw !== null) ? rows.reduce((sum,row) => sum + row.averageKw,0) : null,
    energyKwh:rows.length && rows.every((row) => row.energyKwh !== null) ? rows.reduce((sum,row) => sum + row.energyKwh,0) : null,
    cost:rows.length && rows.every((row) => row.cost !== null) ? rows.reduce((sum,row) => sum + row.cost,0) : null };
}

export function createOperationsReportCsv(project, session, identity, language = "en") {
  const copy = csvCopy[language] || csvCopy.en, names = (project.io?.outputs || []).filter((name) => session.outputRuntimeMs?.[name] !== undefined || Object.hasOwn(project.operations?.loadKw || {}, name));
  const report = calculateOperations(session, project.operations || {}, names), cell = (value) => `"${String(value ?? "").replaceAll('"','""')}"`, rows = [
    [copy.company,identity.companyName], [copy.product,identity.productName], [copy.attribution,identity.attribution], [copy.project,project.name], [copy.elapsed,report.elapsedHours], [copy.tariff,report.tariff ?? ""], [],
    [copy.output,copy.runtime,copy.duty,copy.load,copy.average,copy.energy,copy.cost,copy.advisory],
    ...report.rows.map((row) => [row.name,row.runtimeHours.toFixed(4),row.dutyPct.toFixed(2),row.loadKw ?? "",row.averageKw?.toFixed(5) ?? "",row.energyKwh?.toFixed(5) ?? "",row.cost?.toFixed(5) ?? "",row.advisory ? copy.advisory : ""]),
  ];
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}`;
}
