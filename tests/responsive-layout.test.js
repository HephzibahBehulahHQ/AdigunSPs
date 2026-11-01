import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("styles.css", "utf8");
const app = readFileSync("src/app.js", "utf8");

assert.match(app, /matchMedia\("\(max-width: 760px\)"\)\.matches/, "panel controls must switch to drawer behavior at the tablet breakpoint");
assert.match(styles, /@media\(max-width:760px\)\{body\{height:100dvh\}/, "compact toolbar and mobile workspace layout must include 710px viewports");
assert.match(styles, /@media\(max-width:760px\)\{\.workspace \.left-sidebar,\.workspace \.right-sidebar\{display:none\}\}/, "tablet workspace sidebars must close behind drawer controls");
assert.match(styles, /@media\(max-width:760px\)\{\.workspace\{position:relative\}\.workspace\.mobile-left-open/, "tablet side drawers must have a positioned workspace container");
assert.match(styles, /@media\s*\(\s*min-width:\s*761px\s*\)/, "desktop workspace layout must begin immediately above the compact breakpoint");

console.log("Responsive layout breakpoint checks passed.");
