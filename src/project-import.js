const MAX_PROJECT_BYTES = 5 * 1024 * 1024;
const MAX_PROJECT_NODES = 100_000;
const MAX_PROJECT_DEPTH = 48;
const MAX_RUNGS = 2_000;
const MAX_TAGS = 1_000;
const MAX_BRANCHES = 4_096;
const MAX_CONTACTS = 10_000;
const SUPPORTED_TAG_TYPES = new Set(["BOOL", "INT", "REAL", "TIME"]);
const SUPPORTED_CONTACT_MODES = new Set(["NO", "NC", "R_TRIG", "F_TRIG"]);
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function fail(reason) {
  throw new Error(`Invalid project file: ${reason}`);
}

function inspectJsonValue(value, state, depth = 0) {
  if (++state.nodes > MAX_PROJECT_NODES) fail("too much data.");
  if (depth > MAX_PROJECT_DEPTH) fail("nested data is too deep.");
  if (value === null || typeof value === "boolean") return;
  if (typeof value === "string") {
    if (value.length > 1_000_000) fail("a text field is too large.");
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("a number is not finite.");
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) inspectJsonValue(item, state, depth + 1);
    return;
  }
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) fail("contains an unsupported data value.");
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) fail("contains an unsafe property name.");
    inspectJsonValue(item, state, depth + 1);
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype);
}

export function normalizeImportedProject(value) {
  if (!isRecord(value)) fail("the root must be an object.");
  inspectJsonValue(value, { nodes: 0 });
  if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 120) fail("the project name must contain 1–120 characters.");
  if (!Array.isArray(value.rungs) || value.rungs.length > MAX_RUNGS) fail(`the project must contain no more than ${MAX_RUNGS} ladder networks.`);
  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.length > MAX_TAGS)) fail(`the tag list must contain at most ${MAX_TAGS} entries.`);
  if (value.io !== undefined && !isRecord(value.io)) fail("I/O configuration must be an object.");
  if (value.initialState !== undefined && !isRecord(value.initialState)) fail("initial values must be an object.");

  const project = structuredClone(value);
  project.tags ||= [];
  project.io ||= { inputs: [], outputs: [] };
  for (const key of ["inputs", "outputs"]) {
    if (project.io[key] === undefined) project.io[key] = [];
    if (!Array.isArray(project.io[key]) || project.io[key].length > MAX_TAGS || project.io[key].some((name) => typeof name !== "string" || name.length > 128)) fail(`I/O ${key} must be a list of tag names.`);
  }
  project.initialState ||= {};

  for (const [index, tag] of project.tags.entries()) {
    if (!isRecord(tag) || typeof tag.name !== "string" || !tag.name.trim() || tag.name.length > 128) fail(`tag ${index + 1} has an invalid name.`);
    if (tag.type === undefined) tag.type = "BOOL";
    if (!SUPPORTED_TAG_TYPES.has(tag.type)) fail(`tag ${tag.name} has unsupported type ${String(tag.type)}.`);
  }

  let branchCount = 0, contactCount = 0;
  for (const [index, rung] of project.rungs.entries()) {
    if (!isRecord(rung)) fail(`network ${index + 1} must be an object.`);
    if (rung.branches !== undefined && !Array.isArray(rung.branches)) fail(`network ${index + 1} has an invalid branch list.`);
    if (rung.contacts !== undefined && !Array.isArray(rung.contacts)) fail(`network ${index + 1} has an invalid contact list.`);
    const branches = rung.branches?.length ? rung.branches : [rung.contacts || []];
    branchCount += branches.length;
    if (branchCount > MAX_BRANCHES) fail(`the project exceeds ${MAX_BRANCHES} branches.`);
    for (const branch of branches) {
      if (!Array.isArray(branch)) fail(`network ${index + 1} contains a malformed branch.`);
      contactCount += branch.length;
      if (contactCount > MAX_CONTACTS) fail(`the project exceeds ${MAX_CONTACTS} contacts.`);
      for (const contact of branch) {
        if (!isRecord(contact) || typeof contact.tag !== "string" || !contact.tag.trim() || contact.tag.length > 128) fail(`network ${index + 1} contains a contact with an invalid tag.`);
        if (contact.mode !== undefined && !SUPPORTED_CONTACT_MODES.has(contact.mode)) fail(`network ${index + 1} contains an unsupported contact mode.`);
        contact.mode ||= "NO";
      }
    }
    if (rung.coil !== undefined && (typeof rung.coil !== "string" || rung.coil.length > 128)) fail(`network ${index + 1} has an invalid output tag.`);
    rung.branches = branches;
  }
  return project;
}

export function assertProjectFileSize(size) {
  if (!Number.isFinite(size) || size < 0 || size > MAX_PROJECT_BYTES) fail("the file must be no larger than 5 MiB.");
}

