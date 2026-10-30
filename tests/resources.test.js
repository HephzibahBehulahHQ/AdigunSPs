import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appendResourceAudit, checkResourceLink, isApprovedExternalUrl, readResourceAudit, readResourceRegistry, removeResource, resources, saveResource, validateResource } from "../src/resources.js";
import { createApplicationMenuEntries } from "../src/app-menus.js";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}
const storage = new MemoryStorage(), descriptions = { en:"PLC guide", de:"SPS-Handbuch", yo:"Ìtọ́sọ́nà PLC", pcm:"PLC guide" };
assert.equal(readResourceRegistry(storage)[0].url, "https://github.com/HephzibahBehulahHQ/AdigunSPs", "official organization repository is preapproved by exact URL");
assert.equal(validateResource({ url:"http://unsafe.example", description:descriptions }).valid, false, "rejects non-HTTPS URL");
assert.equal(validateResource({ url:"https://user:pass@example.org/", description:descriptions }).valid, false, "rejects URL credentials");
assert.equal(validateResource({ url:"https://127.0.0.1/", description:descriptions }).valid, false, "rejects private-address URL hosts");
assert.equal(validateResource({ url:"https://printer.local/", description:descriptions }).valid, false, "rejects local-only domain names");
assert.equal(validateResource({ url:"https://example.org/", description:{ en:"missing locales" } }).valid, false, "requires localized descriptions");
const added = saveResource({ url:"https://docs.example.org/plc", description:descriptions }, storage);
assert.equal(added.approved, false, "new URL requires explicit approval");
assert.throws(() => saveResource({ url:added.url, description:descriptions }, storage), /already registered/, "rejects duplicate URLs");
assert.equal(isApprovedExternalUrl(added.url, readResourceRegistry(storage)), false, "unapproved resource cannot open");
const approved = saveResource({ ...added, approved:true }, storage);
assert.equal(isApprovedExternalUrl(approved.url, readResourceRegistry(storage)), true, "approved exact URL can open");
assert.equal(isApprovedExternalUrl("https://docs.example.org/other", readResourceRegistry(storage)), false, "same host cannot broaden approval to other paths");
appendResourceAudit({ resourceId:added.id, host:added.host, action:"open" }, storage);
assert.equal(readResourceAudit(storage).length, 1, "access audit is persisted locally");
assert.equal(await checkResourceLink(approved, async () => ({ type:"basic", status:200, ok:true } )).then((item) => item.status), "available", "successful HEAD is available");
assert.equal((await checkResourceLink(approved, async () => ({ type:"basic", status:404, ok:false }))).status, "broken", "HTTP error is reported as broken");
assert.equal((await checkResourceLink(approved, async () => { throw new TypeError("CORS"); })).status, "unverified", "network/CORS failure is not misreported as broken");
assert.equal(removeResource(added.id, storage), true, "local custom entry can be removed");
assert.equal(removeResource(resources[0].id, storage), false, "built-in resource cannot be removed");
for (const locale of ["en", "de", "yo", "pcm"]) assert.ok(createApplicationMenuEntries(locale).help.some((item) => item.action === "resources" && item.label.length > 5), `${locale} Help menu exposes the registry`);
const app = readFileSync("src/app.js", "utf8"), worker = readFileSync("service-worker.js", "utf8");
assert.ok(app.includes('name === "resources"') && app.includes("function showResources()") && app.includes("appendResourceAudit"), "registry UI, menu action, and access logging are wired");
assert.ok(worker.includes("./src/resources.js"), "offline shell includes the resource registry");
console.log("PASS: local resource registry, HTTPS/exact-URL approval, localized descriptions, link status, access audit, and four-locale Help entry");
