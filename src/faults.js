export function applyInputFaults(inputs, faults = []) {
  const result = { ...inputs };
  for (const fault of faults) {
    if (fault.target === "output") continue;
    if (!Object.hasOwn(result, fault.tag)) continue;
    if (fault.kind === "stuck-high") result[fault.tag] = true;
    if (fault.kind === "stuck-low") result[fault.tag] = false;
  }
  return result;
}

export function applyOutputFaults(outputs, faults = []) {
  const result = { ...outputs }, offsets = new Map();
  for (const fault of faults) {
    if (fault.target !== "output" || !Object.hasOwn(result, fault.tag)) continue;
    if (fault.kind === "stuck-high") result[fault.tag] = true;
    else if (fault.kind === "stuck-low") result[fault.tag] = false;
    else if (fault.kind === "offset" && Number.isFinite(Number(fault.offset))) offsets.set(fault.tag, (offsets.get(fault.tag) || 0) + Number(fault.offset));
  }
  for (const [tag, offset] of offsets) {
    const base = Number(result[tag] ?? 0);
    if (Number.isFinite(base)) result[tag] = base + offset;
  }
  return result;
}

export function applyAnalogFaults(values, faults = [], analogInputs = []) {
  const result = { ...values }, allowed = new Set(analogInputs), offsets = new Map();
  for (const fault of faults) {
    if (fault.kind !== "offset" || !allowed.has(fault.tag) || !Number.isFinite(Number(fault.offset))) continue;
    offsets.set(fault.tag, (offsets.get(fault.tag) || 0) + Number(fault.offset));
  }
  for (const [tag, offset] of offsets) {
    const base = Number(result[tag] ?? 0);
    if (Number.isFinite(base)) result[tag] = base + offset;
  }
  return result;
}
