export const supportedProjectLanguages = ["en", "de", "yo", "pcm"];

export function resolveProjectLanguage(project, fallback = "en") {
  return supportedProjectLanguages.includes(project?.language) ? project.language : supportedProjectLanguages.includes(fallback) ? fallback : "en";
}
