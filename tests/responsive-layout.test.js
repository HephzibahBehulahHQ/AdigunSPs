import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("styles.css", "utf8");
const app = readFileSync("src/app.js", "utf8");
const html = readFileSync("index.html", "utf8");

assert.match(app, /matchMedia\("\(max-width: 760px\)"\)\.matches/, "panel controls must switch to drawer behavior at the tablet breakpoint");
assert.match(styles, /@media\(max-width:760px\)\{body\{height:100dvh\}/, "compact toolbar and mobile workspace layout must include 710px viewports");
assert.match(styles, /@media\(max-width:760px\)\{\.workspace \.left-sidebar,\.workspace \.right-sidebar\{display:none\}\}/, "tablet workspace sidebars must close behind drawer controls");
assert.match(styles, /@media\(max-width:760px\)\{\.workspace\{position:relative\}\.workspace\.mobile-left-open/, "tablet side drawers must have a positioned workspace container");
assert.match(styles, /@media\s*\(\s*min-width:\s*761px\s*\)/, "desktop workspace layout must begin immediately above the compact breakpoint");
assert.match(html, /id="accountButton"[^>]*class="icon-button account-button[\s\S]*?<svg[\s\S]*?account-status-dot/, "top-bar account control uses a profile icon and status dot");
assert.doesNotMatch(html, /id="accountButton"[^>]*>Account</, "top-bar account control does not render the Account word");
assert.match(html, /id="languageButton"[^>]*>EN<\/button>/, "compact language toggle remains visible beside the profile icon");
assert.match(app, /button\.dataset\.accountState = state;[\s\S]*?classList\.toggle\("is-signed-in", state === "member"\)/, "signed-in state is reflected on the profile control");
assert.match(app, /button\.setAttribute\("aria-label", label\);[\s\S]*?button\.title = label;/, "profile icon tooltip and accessible name track account state");
assert.match(styles, /\.top-actions\{gap:12px;flex:0 0 auto;min-width:max-content\}/, "desktop top-bar controls have a consistent gap and cannot collapse into overlap");
assert.match(styles, /@media\(max-width:760px\)\{[\s\S]*?\.top-actions\{margin-left:2px;gap:6px\}/, "mobile controls keep a visible gap and compact layout");
assert.match(styles, /@media\(max-width:360px\)\{[\s\S]*?\.top-actions\{gap:6px\}/, "small phones retain a consistent control gap");
assert.match(styles, /\.account-button\.is-signed-in \.account-status-dot\{background:#46c37b\}/, "signed-in account has a green status dot");
assert.match(styles, /\.account-button\.is-guest \.account-status-dot\{background:#879198\}/, "guest account has a gray status dot");

console.log("Responsive layout breakpoint checks passed.");
