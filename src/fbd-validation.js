import { orderFbdBlocks } from "./engine.js";

const types = new Set(["AND", "OR", "NOT", "TON", "TOF", "TP", "CTU", "R_TRIG", "F_TRIG", "ADD", "SUB", "MUL", "DIV", "GT", "LT", "EQ", "SCALE", "TRUE", "FALSE"]);
const numericInputs = new Set(["ADD", "SUB", "MUL", "DIV", "GT", "LT", "EQ", "SCALE"]);
const numericOutputs = new Set(["ADD", "SUB", "MUL", "DIV", "SCALE"]);
const binaryInputs = new Set(["AND", "OR", "ADD", "SUB", "MUL", "DIV", "GT", "LT", "EQ"]);
const unaryInputs = new Set(["NOT", "TON", "TOF", "TP", "R_TRIG", "F_TRIG", "CTU", "SCALE"]);
export const requiredFbdInputs = (type) => binaryInputs.has(type) ? 2 : unaryInputs.has(type) ? 1 : 0;

const add = (issues, blockIndex, code, message, data = {}) => issues.push({ level:"error", code, message, blockIndex, ...data });

export function validateFbdBlocks(project) {
  const blocks = project.fbdBlocks || [], tags = new Map((project.tags || []).map((tag) => [tag.name, tag])), producers = new Map(), issues = [];
  blocks.forEach((block, index) => {
    if (!block.outputTag) return;
    if (producers.has(block.outputTag)) {
      add(issues, index, "fbd-dependency", `FBD output ${block.outputTag} is produced by more than one block.`, { tag:block.outputTag });
      add(issues, producers.get(block.outputTag), "fbd-dependency", `FBD output ${block.outputTag} is produced by more than one block.`, { tag:block.outputTag });
    } else producers.set(block.outputTag, index);
  });
  blocks.forEach((block, index) => {
    const inputs = block.inputs || [], isNumericInput = numericInputs.has(block.type), isNumericOutput = numericOutputs.has(block.type);
    if (!types.has(block.type)) add(issues, index, "fbd-type", `FBD block ${index + 1} has an unsupported function ${block.type}.`);
    if (!block.outputTag) add(issues, index, "fbd-output", `FBD block ${index + 1} needs an output tag.`);
    else if (!tags.has(block.outputTag) && !(project.io?.outputs || []).includes(block.outputTag)) add(issues, index, "fbd-output-tag", `FBD block ${index + 1} uses undeclared output ${block.outputTag}.`, { tag:block.outputTag });
    const requiredInputs = requiredFbdInputs(block.type);
    if (inputs.length < requiredInputs || (binaryInputs.has(block.type) && inputs.length !== 2)) add(issues, index, "fbd-input-count", `FBD block ${index + 1} requires ${binaryInputs.has(block.type) ? "exactly two" : `at least ${requiredInputs}`} input tag${requiredInputs === 1 ? "" : "s"}.`, { required:requiredInputs });
    if (block.type === "CTU" && inputs.length > 2) add(issues, index, "fbd-input-count", `FBD CTU block ${index + 1} accepts a count input and an optional reset input.`, { required:2 });
    if (block.countTag && !tags.has(block.countTag)) add(issues, index, "fbd-count-tag", `FBD CTU block ${index + 1} count value tag ${block.countTag} is undeclared.`, { tag:block.countTag });
    else if (block.countTag && tags.get(block.countTag).type === "BOOL") add(issues, index, "fbd-count-type", `FBD CTU count value ${block.countTag} must use a numeric type.`, { tag:block.countTag, expected:"numeric" });
    for (const name of inputs) {
      const sourceIndex = producers.get(name), source = sourceIndex === undefined ? null : blocks[sourceIndex], sourceType = source ? (numericOutputs.has(source.type) ? "REAL" : "BOOL") : tags.get(name)?.type || ((project.io?.inputs || []).includes(name) ? "BOOL" : null);
      if (!sourceType) add(issues, index, "fbd-input-tag", `FBD block ${index + 1} uses undeclared input ${name}.`, { tag:name });
      else if (isNumericInput ? sourceType === "BOOL" : sourceType !== "BOOL") add(issues, index, isNumericInput ? "fbd-numeric-type" : "fbd-input-type", `FBD ${block.type} input ${name} must be ${isNumericInput ? "numeric" : "BOOL"}.`, { tag:name, expected:isNumericInput ? "numeric" : "BOOL" });
    }
    if (block.outputTag) {
      const outputType = tags.get(block.outputTag)?.type || ((project.io?.outputs || []).includes(block.outputTag) ? "BOOL" : null);
      if (outputType && (isNumericOutput ? outputType === "BOOL" : outputType !== "BOOL")) add(issues, index, "fbd-output-type", `FBD ${block.type} output ${block.outputTag} must be ${isNumericOutput ? "numeric" : "BOOL"}.`, { tag:block.outputTag, expected:isNumericOutput ? "numeric" : "BOOL" });
    }
    if (["TON", "TOF", "TP", "CTU"].includes(block.type) && (!Number.isFinite(Number(block.preset)) || Number(block.preset) <= 0)) add(issues, index, "fbd-preset", `FBD ${block.type} preset must be greater than zero.`);
    if (block.type === "SCALE") { const params = [block.rawMin, block.rawMax, block.scaledMin, block.scaledMax].map(Number); if (!params.every(Number.isFinite) || params[0] === params[1]) add(issues, index, "fbd-scale-range", `FBD SCALE block ${index + 1} needs finite ranges and different raw minimum/maximum values.`); }
  });
  const graphErrors = orderFbdBlocks(blocks).errors;
  if (graphErrors.some((message) => message.includes("cycle"))) blocks.forEach((_, index) => add(issues, index, "fbd-cycle", "FBD block dependencies contain a cycle."));
  return issues;
}

export function connectFbdPorts(blocks, sourceIndex, targetIndex, inputIndex) {
  const source = blocks[sourceIndex], target = blocks[targetIndex];
  const inputLimit = target?.type === "CTU" ? 2 : requiredFbdInputs(target?.type);
  if (!source?.outputTag || !target || !Number.isInteger(inputIndex) || inputIndex < 0 || inputIndex >= inputLimit) return { ok:false, code:"port" };
  const sourceNumeric = numericOutputs.has(source.type), targetNumeric = numericInputs.has(target.type);
  if (!types.has(source.type) || (sourceNumeric !== targetNumeric)) return { ok:false, code:"type", expected:targetNumeric ? "numeric" : "BOOL" };
  const candidate = blocks.map((block, index) => {
    if (index !== targetIndex) return block;
    const inputs = [...(block.inputs || [])]; while (inputs.length <= inputIndex) inputs.push(""); inputs[inputIndex] = source.outputTag;
    return { ...block, inputs };
  });
  if (orderFbdBlocks(candidate).errors.some((message) => message.includes("cycle"))) return { ok:false, code:"cycle" };
  return { ok:true, blocks:candidate };
}
