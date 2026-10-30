export function validateScenario(scenario, project) {
  if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) return ["Scenario must be a JSON object."];
  if (!Array.isArray(scenario.frames) || scenario.frames.length < 1 || scenario.frames.length > 1000) return ["Provide 1–1000 scan frames."];
  const tags = new Map((project.tags || []).map((tag) => [tag.name, tag.type || "BOOL"]));
  const inputs = new Set(project.io?.inputs || []), outputs = new Set(project.io?.outputs || []), errors = [];
  scenario.frames.forEach((frame, index) => {
    const label = `Frame ${index + 1}`;
    if (!frame || typeof frame !== "object" || Array.isArray(frame)) { errors.push(`${label} must be an object.`); return; }
    for (const [name, values, predicate, kind] of [
      ["inputs", frame.inputs, (tag, value) => inputs.has(tag) && tags.get(tag) === "BOOL" && typeof value === "boolean", "digital input"],
      ["numericInputs", frame.numericInputs, (tag, value) => inputs.has(tag) && tags.has(tag) && tags.get(tag) !== "BOOL" && typeof value === "number" && Number.isFinite(value), "numeric input"],
      ["expectedOutputs", frame.expectedOutputs, (tag, value) => outputs.has(tag) && (tags.get(tag) === "BOOL" ? typeof value === "boolean" : typeof value === "number" && Number.isFinite(value)), "expected output"],
    ]) {
      if (values == null) continue;
      if (typeof values !== "object" || Array.isArray(values)) { errors.push(`${label}: ${name} must be an object.`); continue; }
      for (const [tag, value] of Object.entries(values)) if (!predicate(tag, value)) errors.push(`${label}: invalid ${kind} ${tag}.`);
    }
    if (frame.dt != null && (!Number.isInteger(frame.dt) || frame.dt < 1 || frame.dt > 60000)) errors.push(`${label}: dt must be from 1 to 60000 ms.`);
  });
  return errors;
}

export function runScenario(scenario, project, scanFrame) {
  const errors = validateScenario(scenario, project);
  if (errors.length) return { errors, results:[] };
  const results = scenario.frames.map((frame, index) => {
    const actual = scanFrame(frame, index) || {}, expected = frame.expectedOutputs || null;
    const pass = expected ? Object.entries(expected).every(([tag, value]) => typeof value === "number" ? Math.abs(Number(actual[tag]) - value) < 1e-6 : actual[tag] === value) : null;
    return { index:index + 1, inputs:frame.inputs || {}, numericInputs:frame.numericInputs || {}, actual, expected, pass };
  });
  return { errors:[], results };
}
