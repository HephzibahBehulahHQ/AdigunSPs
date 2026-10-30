import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { brand, brandPresentation } from "../src/brand.js";
import { ui } from "../src/locale-ui.js";

const read = (path) => readFileSync(path, "utf8");
assert.equal(brand.company.name, "HEPHZIBAH BEHULAH");
assert.equal(brand.division.name, "HB Elektroniker");
assert.equal(brand.division.accent, "#22D3EE");
assert.equal(brand.products.adigunsps.name, "AdigunSPs");
assert.deepEqual(brand.company.links.map(({ url }) => url), [
  "https://hephzibahbehulah.com/",
  "https://www.facebook.com/Hephzibahbehulah/",
  "https://x.com/HephzibaBehulah",
  "https://www.instagram.com/hephzibahbehulah/",
  "https://www.tiktok.com/@hephzibahbhehulah",
  "https://www.linkedin.com/in/isaacoluwoleadigun/",
]);
assert.equal(brand.activeProductId, "adigunsps");
assert.equal(brand.tagline, null);
assert.equal(brand.contact, null);
const corporateLogo = brand.company.logo.light;
assert.equal(corporateLogo, brand.company.logo.dark, "approved corporate raster remains identical in both themes");
assert.deepEqual([...readFileSync(corporateLogo).subarray(0, 2)], [0xff, 0xd8], "official corporate asset is a JPEG");

for (const language of ["en", "de", "yo", "pcm"]) for (const theme of ["light", "dark"]) {
  const view = brandPresentation(language, theme), icon = read(view.productIcon);
  assert.equal(view.companyLogo, corporateLogo, `${language}/${theme} uses the approved company logo`);
  assert.ok(view.attribution.includes(view.productName) && view.attribution.includes(view.divisionName) && view.attribution.includes(view.companyName), `${language}/${theme} localized hierarchy`);
  assert.ok(view.divisionLabel.includes(view.divisionName.toUpperCase()), `${language}/${theme} division label`);
  assert.ok(icon.includes(view.productName) && !icon.includes(view.companyName), `${language}/${theme} launcher icon identifies product only`);
  assert.ok(existsSync(view.companyLogo) && existsSync(view.productIcon), `${language}/${theme} identity assets exist`);
}

const html = read("index.html"), app = read("src/app.js"), sw = read("service-worker.js");
for (const id of ["headerCorporateLogo", "headerProductName", "headerDivisionLabel", "footerCorporateLogo", "footerBrandAttribution", "corporateFooterLinks", "footerHelpLink", "footerYear", "printCorporateLogo", "printProductName", "printDivisionLabel", "printBrandAttributionText", "adigunAiButton"]) assert.ok(html.includes(`id="${id}"`), `${id} identity surface`);
assert.ok(html.includes('class="floating-bot"') && html.includes("Adigun BOT"), "floating assistant launcher is present");
assert.ok(app.includes("image.src = presentation.companyLogo") && app.includes("presentation.divisionLabel"), "runtime consumes central corporate and division identity");
assert.ok(app.includes("for (const item of brand.company.links)") && app.includes("link.rel = \"noopener noreferrer\"") && app.includes("new Date().getFullYear()"), "footer renders approved links safely and the current year");
assert.ok(app.includes('$("#footerHelpLink").addEventListener("click", showHelp)'), "footer Help/docs control opens the existing Help/About flow");
const personalProfileLabels = { en:"personal", de:"persönlich", yo:"ti ẹni kọọkan", pcm:"personal" };
for (const locale of ["en", "de", "yo", "pcm"]) assert.ok(ui[locale].footerHelp && ui[locale].footerLinks && ui[locale].linkedinPersonal.includes(personalProfileLabels[locale]), `${locale} company/support and personal-profile labels are localized`);
assert.ok(app.includes('document.documentElement.lang = { en:"en", de:"de", yo:"yo", pcm:"pcm" }[language]'), "the document language identifies Nigerian Pidgin as pcm");
assert.ok(app.includes('src="${presentation.companyLogo}"') && app.includes("${presentation.productName}"), "onboarding and About use separate company mark and product text");
assert.ok(!html.includes('id="productLogo"') && !html.includes("company-wordmark-dark.svg"), "header uses one corporate logo and a text product wordmark");

const localizedManifestNames = new Set();
for (const language of ["en", "de", "yo", "pcm"]) {
  const view = brandPresentation(language), manifest = JSON.parse(read(view.manifest));
  assert.equal(manifest.name, view.manifestName, `${language} PWA name from central config`);
  assert.ok(manifest.name.includes(brand.company.name) && manifest.name.includes(view.productName) && manifest.name.includes(view.divisionName), `${language} PWA name retains the company/product/division hierarchy`);
  localizedManifestNames.add(manifest.name);
  assert.equal(manifest.short_name, view.productName, `${language} install icon uses product name`);
  assert.equal(manifest.description, view.description, `${language} PWA description from central config`);
  assert.equal(manifest.theme_color, brand.colors.navy, `${language} PWA follows the corporate theme`);
  assert.equal(manifest.icons.length, 4, `${language} PWA has product icons for both themes and sizes`);
  for (const asset of [...manifest.icons, ...manifest.screenshots]) assert.ok(existsSync(asset.src), `${language} PWA asset ${asset.src}`);
  for (const screen of manifest.screenshots) {
    const splash = read(screen.src);
    assert.ok(splash.includes(brand.company.name) && splash.includes(brand.division.name) && splash.includes(brand.products.adigunsps.name), `${language} splash includes the hierarchy`);
    assert.ok(splash.includes("company-official.jpg"), `${language} splash uses the official corporate artwork`);
  }
}
assert.equal(localizedManifestNames.size, 4, "PWA display names localize the relationship text in all four languages");
for (const path of [...Object.values(brand.manifest), ...Object.values(brand.products.adigunsps.icons), ...Object.values(brand.products.adigunsps.splash), "assets/brand/company-official.jpg", "assets/brand/brand-overrides.css"]) assert.ok(sw.includes(path), `offline shell caches ${path}`);
assert.ok(sw.includes("adigunsps-shell-v74"), "electrical simulation update refreshes offline shell cache");
assert.ok(!existsSync("BRAND-ASSETS-TODO.md"), "official supplied logo is implemented; no placeholder TODO remains");
console.log("PASS: official corporate logo, distinct product wordmark/icons, hierarchy on app/PWA/splash, four locales, and both themes");

