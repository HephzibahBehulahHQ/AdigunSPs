import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type:"json" };

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const engineeringReport = JSON.parse(readFileSync(new URL("../docs/engineering-validation-report.json", import.meta.url), "utf8"));
const browserSmoke = readFileSync(new URL("../docs/browser-smoke-check.md", import.meta.url), "utf8");
assert.ok(readme.startsWith('<p align="center">'), "README begins with the approved corporate logo presentation");
assert.ok(readme.includes('src="assets/brand/company-official.jpg" alt="Official HEPHZIBAH BEHULAH corporate logo"'), "README logo path and alternative text are explicit");
assert.ok(existsSync(new URL("../assets/brand/company-official.jpg", import.meta.url)), "README logo asset exists");
assert.ok(readme.includes("<h1 align=\"center\">AdigunSPs</h1>") && readme.includes("By HB Elektroniker | A division of HEPHZIBAH BEHULAH"), "product hierarchy is presented clearly");
assert.ok(readme.includes("https://github.com/HephzibahBehulahHQ/AdigunSPs") && !readme.includes("HephzibahBehulah/VoltPro-AdigunSPs"), "clone instructions use only the official organization repository");
assert.ok(!/img\.shields\.io/.test(readme), "README does not invent repository badges");

const headingAnchor = (heading) => heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
const headings = new Set([...readme.matchAll(/^## (.+)$/gm)].map((match) => headingAnchor(match[1])));
for (const [, anchor] of readme.matchAll(/^-[^\n]*\]\(#([^)]*)\)/gm)) assert.ok(headings.has(anchor), `table-of-contents anchor #${anchor} exists`);
for (const [, path] of readme.matchAll(/\]\((docs\/[^)#]+\.md)\)/g)) assert.ok(existsSync(resolve(fileURLToPath(new URL("..", import.meta.url)), path)), `relative documentation link ${path} exists`);

for (const url of [
  "https://hephzibahbehulah.com/",
  "https://github.com/HephzibahBehulahHQ",
  "https://github.com/HephzibahBehulahHQ/hb-elektroniker",
  "https://github.com/HephzibahBehulahHQ/hb-design-system",
  "https://www.facebook.com/Hephzibahbehulah/",
  "https://x.com/HephzibaBehulah",
  "https://www.instagram.com/hephzibahbehulah/",
  "https://www.tiktok.com/@hephzibahbhehulah",
  "https://www.linkedin.com/in/isaacoluwoleadigun/",
]) assert.ok(readme.includes(`(${url})`), `README includes supplied corporate link ${url}`);
assert.ok(readme.includes("LinkedIn personal profile") && readme.includes("No software license or redistribution terms have been provided"), "personal LinkedIn and pending license are accurately described");
assert.ok(!existsSync(new URL("../LICENSE", import.meta.url)), "no license is invented");
for (const script of ["dev", "build", "test", "validate:examples", "test:electrical", "test:industrial-catalog", "test:brand", "test:hardware", "test:ai", "test:resources", "test:protocol"]) assert.ok(pkg.scripts[script], `documented npm command ${script} exists`);
assert.ok(readme.includes("Screenshot files are not included in this repository yet"), "missing application screenshot assets are disclosed instead of fabricated");
assert.ok(readme.includes("docs/browser-smoke-check.md") && browserSmoke.includes("not full end-to-end coverage") && browserSmoke.includes("adigunsps-shell-v78") && browserSmoke.includes("visually rechecked"), "manual browser smoke evidence and its limits are disclosed");
assert.equal(engineeringReport.exampleCount, 200, "engineering report covers 200 distinct example projects");
assert.equal(engineeringReport.projectsSaveReopenPassed, 200, "all 200 project models pass JSON save/reopen round-trips");
assert.ok(engineeringReport.examples.every((example) => example.passed && example.saveReopenPass && example.integrationPassBits.length > 0), "every listed example has passing save/reopen, structural, and integration evidence");
console.log("PASS: README, corporate links, 200 individually reported examples, model round-trips, and license statement");
