import { createFbdInternalBoolTag } from "./fbd-layout.js";

export function convertLadderToFbd(rungs, project) {
  const blocks = [];
  const pathsFor = (rung) => rung.branches?.length ? rung.branches : [rung.contacts || []];
  rungs.forEach((rung, rungIndex) => {
    const pathValues = pathsFor(rung).map((path, branchIndex) => {
      const inputs = path.map((contact, contactIndex) => {
        if (contact.mode === "R_TRIG" || contact.mode === "F_TRIG") { const outputTag = createFbdInternalBoolTag(project, `_${contact.mode}_${rungIndex}_${branchIndex}_${contactIndex}`); blocks.push({ id:`edge-${rungIndex}-${branchIndex}-${contactIndex}`, type:contact.mode, inputs:[contact.tag], outputTag }); return outputTag; }
        if (contact.mode !== "NC") return contact.tag;
        const outputTag = createFbdInternalBoolTag(project, `_NOT_${rungIndex}_${branchIndex}_${contactIndex}`); blocks.push({ id:`not-${rungIndex}-${branchIndex}-${contactIndex}`, type:"NOT", inputs:[contact.tag], outputTag }); return outputTag;
      });
      if (!inputs.length) { const tag = createFbdInternalBoolTag(project, `_TRUE_${rungIndex}_${branchIndex}`); blocks.push({ id:`true-${rungIndex}-${branchIndex}`, type:"TRUE", inputs:[], outputTag:tag }); return tag; }
      if (inputs.length === 1) return inputs[0];
      const outputTag = createFbdInternalBoolTag(project, `_AND_${rungIndex}_${branchIndex}`); blocks.push({ id:`and-${rungIndex}-${branchIndex}`, type:"AND", inputs, outputTag }); return outputTag;
    });
    let result = pathValues[0];
    if (pathValues.length > 1) { result = rung.coil; blocks.push({ id:`or-${rungIndex}`, type:"OR", inputs:pathValues, outputTag:result }); }
    if (rung.timer) blocks.push({ id:rung.timer.tag, type:rung.timer.type || "TON", inputs:[result], outputTag:rung.coil, preset:rung.timer.preset });
    else if (pathValues.length === 1) { const enabledTag = createFbdInternalBoolTag(project, `_TRUE_COIL_${rungIndex}`); blocks.push({ id:`true-coil-${rungIndex}`, type:"TRUE", inputs:[], outputTag:enabledTag }); blocks.push({ id:`coil-${rungIndex}`, type:"AND", inputs:[result,enabledTag], outputTag:rung.coil }); }
  });
  return blocks;
}
