export function resolveTheme(preference = "system", systemPrefersLight = false) {
  if (preference === "light" || preference === "dark") return preference;
  return systemPrefersLight ? "light" : "dark";
}
