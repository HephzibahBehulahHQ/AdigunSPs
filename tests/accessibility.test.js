import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi)];
const unnamed = buttons.flatMap(([, attributes, contents], index) => {
  const visibleText = contents.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/&(?:nbsp|#160);/gi, " ").trim();
  const hasAccessibleName = /\b(?:aria-label|aria-labelledby|title)\s*=\s*["'][^"']+/.test(attributes) || visibleText.length > 0;
  return hasAccessibleName ? [] : [`button ${index + 1}: ${attributes.trim() || "no attributes"}`];
});

assert.ok(buttons.length > 0, "static application controls were found");
assert.deepEqual(unnamed, [], `static buttons need discernible names: ${unnamed.join("; ")}`);
console.log(`PASS: ${buttons.length} static buttons have discernible names`);
