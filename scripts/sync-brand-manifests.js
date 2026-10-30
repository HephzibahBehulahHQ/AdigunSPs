import { readFileSync, writeFileSync } from "node:fs";
import { brand, brandPresentation } from "../src/brand.js";

for (const language of Object.keys(brand.manifest)) {
  const path = brand.manifest[language];
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const presentation = brandPresentation(language, "dark");
  manifest.name = presentation.manifestName;
  manifest.short_name = presentation.productName;
  manifest.description = presentation.description;
  manifest.background_color = brand.colors.navy;
  manifest.theme_color = brand.colors.navy;
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
