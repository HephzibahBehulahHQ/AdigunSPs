const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function countProjectMatches(project, editorType, query) {
  if (!query) return 0;
  const source = editorType === "ST"
    ? project.stSource || ""
    : JSON.stringify({ tags:project.tags, io:project.io, rungs:project.rungs, fbdBlocks:project.fbdBlocks, sfc:project.sfc });
  return (source.match(new RegExp(escapeRegex(query), "gi")) || []).length;
}
