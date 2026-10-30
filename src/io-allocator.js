export const ioHardwareProfiles = Object.freeze({
  generic: {
    id:"generic", label:"Generic logical I/O", analog:true,
    address(direction, channel) { return ({ input:`I:0/${channel}`, output:`O:0/${channel}`, analogInput:`AI:${channel}`, analogOutput:`AO:${channel}` })[direction]; },
  },
  siemensS7: {
    id:"siemensS7", label:"Siemens S7 · I/Q bit addressing", analog:true,
    address(direction, channel) {
      if (direction === "input") return `I${Math.floor(channel / 8)}.${channel % 8}`;
      if (direction === "output") return `Q${Math.floor(channel / 8)}.${channel % 8}`;
      return `${direction === "analogInput" ? "IW" : "QW"}${64 + channel * 2}`;
    },
  },
  allenBradleySlc: {
    id:"allenBradleySlc", label:"Allen-Bradley · SLC/PLC-5 style", analog:false,
    address(direction, channel) { return direction === "input" ? `I:0/${channel}` : direction === "output" ? `O:0/${channel}` : null; },
  },
});

const directions = Object.freeze({ input:"input", output:"output", analogInput:"input", analogOutput:"output" });
const numericTypes = new Set(["INT", "REAL"]);
const defaultCapacities = Object.freeze({ input:16, output:16, analogInput:4, analogOutput:4 });

function inferredRole(tag, inputs, outputs) {
  const listedInput = inputs.has(tag.name), listedOutput = outputs.has(tag.name);
  const explicit = ["input", "output", "internal"].includes(tag.role) ? tag.role : null;
  const role = explicit || (listedInput !== listedOutput ? (listedInput ? "input" : "output") : "internal");
  const issues = [];
  if (tag.role && !["input", "output", "internal"].includes(tag.role)) issues.push({ severity:"error", code:"invalid-role", tag:tag.name, message:`${tag.name} has an unsupported I/O role (${tag.role}). Set it to input, output, or internal.` });
  if (listedInput && listedOutput) issues.push({ severity:"error", code:"conflicting-role", tag:tag.name, message:`${tag.name} is listed as both an input and an output.` });
  if (explicit && ((explicit === "input" && listedOutput) || (explicit === "output" && listedInput) || (explicit === "internal" && (listedInput || listedOutput)))) {
    issues.push({ severity:"error", code:"role-mismatch", tag:tag.name, message:`${tag.name} role conflicts with the project's I/O list.` });
  }
  return { role, issues };
}

function directionFor(tag, role) {
  const type = String(tag.type || "BOOL").toUpperCase();
  if (role === "internal") return { direction:null, issue:null };
  if (type === "BOOL") return { direction:role, issue:null };
  if (numericTypes.has(type)) return { direction:role === "input" ? "analogInput" : "analogOutput", issue:null };
  return { direction:null, issue:{ severity:"error", code:"unsupported-type", tag:tag.name, message:`${tag.name} has type ${type}, which this allocator cannot map to a physical I/O channel.` } };
}

export function allocateIoAddresses(project, profileId = "generic", capacities = {}) {
  const profile = ioHardwareProfiles[profileId] || ioHardwareProfiles.generic;
  const limits = Object.fromEntries(Object.entries(defaultCapacities).map(([key, fallback]) => {
    const value = Number(capacities[key] ?? fallback);
    return [key, Number.isInteger(value) && value >= 0 && value <= 4096 ? value : fallback];
  }));
  const inputs = new Set(project.io?.inputs || []), outputs = new Set(project.io?.outputs || []);
  const tagNames = new Set((project.tags || []).map((tag) => tag.name));
  const counters = { input:0, output:0, analogInput:0, analogOutput:0 };
  const issues = [];
  for (const name of new Set([...inputs, ...outputs])) if (!tagNames.has(name)) issues.push({ severity:"error", code:"missing-tag", tag:name, message:`I/O point ${name} is listed in the project but has no tag definition.` });
  const rows = (project.tags || []).map((tag, tagIndex) => {
    const { role, issues:roleIssues } = inferredRole(tag, inputs, outputs);
    issues.push(...roleIssues);
    const { direction, issue:typeIssue } = directionFor(tag, role);
    if (typeIssue) issues.push(typeIssue);
    if (!direction) return { tag:tag.name, type:String(tag.type || "BOOL").toUpperCase(), role, existingAddress:tag.address || "", address:"", direction:"internal", terminal:"", wire:"", status:role === "internal" && !roleIssues.length ? "internal" : "unassigned" };
    const channel = counters[direction]++;
    const available = channel < limits[direction];
    const address = available ? profile.address(direction, channel) : null;
    const terminal = available ? `${direction === "input" ? "DI" : direction === "output" ? "DO" : direction === "analogInput" ? "AI" : "AO"}-${channel}` : "";
    const wire = available ? `W-${String(tagIndex + 1).padStart(4, "0")}` : "";
    if (!available) issues.push({ severity:"warning", code:"capacity-exceeded", tag:tag.name, message:`${tag.name} has no ${direction} channel available in this draft capacity. Increase capacity or enter a verified address manually.` });
    else if (!address) issues.push({ severity:"warning", code:"unsupported-profile-type", tag:tag.name, message:`${profile.label} has no automatic address format for ${direction}; enter a verified address manually.` });
    return { tag:tag.name, type:String(tag.type || "BOOL").toUpperCase(), role, direction, channel, existingAddress:tag.address || "", address:address || "", terminal, wire, status:address ? "proposed" : "unassigned" };
  });
  issues.push(...validateIoAllocation(rows));
  if (profileId === "generic") issues.push({ severity:"warning", code:"generic-profile", message:"Generic logical addresses are placeholders, not addresses for a specific PLC." });
  issues.push({ severity:"warning", code:"terminal-assumptions", message:"DI/DO/AI/AO terminal labels are logical channel references. Verify physical terminals, module slots, address offsets, and wiring against the exact hardware manuals." });
  return { profileId:profile.id, profileLabel:profile.label, capacities:limits, rows, issues };
}

export function validateIoAllocation(rows = []) {
  const issues = [];
  const byAddress = new Map();
  for (const row of rows) {
    if (!row.address) {
      if (row.status !== "internal") issues.push({ severity:"error", code:"missing-address", tag:row.tag, message:`${row.tag} has no proposed address.` });
      continue;
    }
    const key = row.address.trim().toLocaleUpperCase();
    if (byAddress.has(key)) issues.push({ severity:"error", code:"duplicate-address", tag:row.tag, message:`${row.tag} shares address ${row.address} with ${byAddress.get(key)}.` });
    else byAddress.set(key, row.tag);
    const expectedRole = row.direction === "input" || row.direction === "analogInput" ? "input" : row.direction === "output" || row.direction === "analogOutput" ? "output" : "internal";
    if (row.role !== expectedRole) issues.push({ severity:"error", code:"direction-mismatch", tag:row.tag, message:`${row.tag} role does not match its allocated channel direction.` });
    if ((row.type === "BOOL" && (row.direction === "analogInput" || row.direction === "analogOutput")) || (numericTypes.has(row.type) && (row.direction === "input" || row.direction === "output"))) {
      issues.push({ severity:"error", code:"type-mismatch", tag:row.tag, message:`${row.tag} type ${row.type} does not match its allocated channel direction.` });
    }
  }
  return issues;
}
