export const supportedLocales = ["en", "de", "yo", "pcm"];

function flattenStrings(value, prefix = "", result = new Map()) {
  if (typeof value === "string") result.set(prefix, value);
  else if (Array.isArray(value)) value.forEach((item, index) => flattenStrings(item, `${prefix}[${index}]`, result));
  else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) flattenStrings(item, prefix ? `${prefix}.${key}` : key, result);
  return result;
}

function localizedExampleFields(example) {
  const fields = ["title", "description", "category", "difficulty", "learningObjective", "expectedBehavior", "faultExplanations"].map((field) => [field, example[field]]);
  for (const [index, tag] of (example.tags || []).entries()) fields.push([`tags[${index}].label`, tag.label]);
  for (const [index, testCase] of (example.testCases || []).entries()) fields.push([`testCases[${index}].name`, testCase.name]);
  return fields;
}

export function buildLocalizationReport(bundles, examples = []) {
  const bundleEntries = Object.entries(bundles || {}), localizedFields = examples.flatMap((example) => localizedExampleFields(example).map(([path, values]) => [`examples.${example.id}.${path}`, values]));
  const rows = supportedLocales.map((locale) => {
    const uiMissing = [];
    for (const [bundleName, bundle] of bundleEntries) {
      const perLocale = Object.fromEntries(supportedLocales.map((key) => [key, flattenStrings(bundle?.[key])]));
      const keys = new Set(supportedLocales.flatMap((key) => [...perLocale[key].keys()]));
      for (const key of keys) if (!perLocale[locale].has(key) || !perLocale[locale].get(key).trim()) uiMissing.push(`${bundleName}.${key}`);
    }
    const exampleMissing = [];
    for (const [path, translations] of localizedFields) if (typeof translations?.[locale] !== "string" || !translations[locale].trim()) exampleMissing.push(path);
    const allUiKeys = bundleEntries.reduce((total, [, bundle]) => total + new Set(supportedLocales.flatMap((key) => [...flattenStrings(bundle?.[key]).keys()])).size, 0);
    return { locale, uiComplete:allUiKeys - uiMissing.length, uiTotal:allUiKeys, uiMissing, exampleComplete:localizedFields.length - exampleMissing.length, exampleTotal:localizedFields.length, exampleMissing,
      reviewStatus:locale === "en" ? "Source language; editorial review pending" : "Technical review pending", reviewer:null };
  });
  return { schema:"adigunsps-localization-audit-v1", generatedAt:new Date().toISOString(), rows };
}
