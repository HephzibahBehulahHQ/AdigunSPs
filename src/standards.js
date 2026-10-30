import { validateProject } from "./validation.js";
import { compileStructuredText } from "./structured-text.js";

export const STANDARDS_CHECK_SCOPE = "adigunsps-project-consistency";

export function runStandardsChecks(project) {
  const issues = [...validateProject(project)];
  let structuredText = null;
  if (project.editorType === "ST") {
    const tags = [...new Set([...(project.tags || []).map((tag) => tag.name), ...(project.io?.inputs || []), ...(project.io?.outputs || [])])];
    structuredText = compileStructuredText(project.stSource || "", tags);
    for (const message of structuredText.errors) issues.push({ level:"error", code:"st-compile", message });
  }
  const errors = issues.filter((issue) => issue.level === "error").length;
  return { scope:STANDARDS_CHECK_SCOPE, issues, errors, warnings:issues.length - errors, structuredText };
}
