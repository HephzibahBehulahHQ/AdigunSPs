export function createAdigunBotCanvasPreview(currentProject, proposedProject) {
  if (!currentProject || !proposedProject) throw new TypeError("A current and proposed project are required.");
  return {
    before:structuredClone(currentProject),
    candidate:structuredClone(proposedProject),
    state:"previewing",
  };
}

export function resolveAdigunBotCanvasPreview(preview, action) {
  if (preview?.state !== "previewing") throw new Error("This Bot preview is no longer active.");
  if (!["commit", "discard"].includes(action)) throw new TypeError("Choose commit or discard to resolve the Bot preview.");
  const result = {
    project:structuredClone(action === "commit" ? preview.candidate : preview.before),
    state:action === "commit" ? "committed" : "discarded",
  };
  preview.state = result.state;
  return result;
}

export function applyAdigunBotPlanAtomically(currentProject, steps) {
  const candidate = structuredClone(currentProject);
  try {
    for (const step of steps) step(candidate);
    return { ok:true, project:candidate };
  } catch (error) {
    return { ok:false, project:structuredClone(currentProject), error:error instanceof Error ? error.message : String(error) };
  }
}
