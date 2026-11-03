import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAdigunRuntimeConfig, serializeAdigunRuntimeConfig } from "./runtime-config.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");
if (output !== join(root, "dist")) throw new Error("Refusing to write outside the project dist directory.");

async function collectJavaScript(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes:true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectJavaScript(path));
    else if (entry.isFile() && path.endsWith(".js")) files.push(path);
  }
  return files;
}

for (const file of [...await collectJavaScript(join(root, "src")), ...await collectJavaScript(join(root, "scripts")), ...await collectJavaScript(join(root, "reset-password")), ...await collectJavaScript(join(root, "update"))]) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding:"utf8" });
  if (result.status !== 0) throw new Error(`JavaScript syntax check failed for ${file}:\n${result.stderr || result.stdout}`);
}

const manifestSync = spawnSync(process.execPath, [join(root, "scripts", "sync-brand-manifests.js")], { cwd:root, encoding:"utf8" });
if (manifestSync.status !== 0) throw new Error(manifestSync.stderr || "Manifest generation failed.");
await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive:true });
for (const file of ["index.html", "styles.css", "service-worker.js", "manifest.webmanifest", "manifest.de.webmanifest", "manifest.yo.webmanifest", "manifest.pcm.webmanifest"]) {
  await cp(join(root, file), join(output, file));
}
for (const directory of ["src", "assets", "docs", "reset-password", "update"]) await cp(join(root, directory), join(output, directory), { recursive:true });
await mkdir(join(output, "vendor"), { recursive:true });
await cp(join(root, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"), join(output, "vendor", "supabase.js"));
await writeFile(join(output, "runtime-config.js"), serializeAdigunRuntimeConfig(await loadAdigunRuntimeConfig(root)), "utf8");

const releaseHash=createHash("sha256");
async function hashAssets(directory, prefix="") {
  const entries=(await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
  for(const entry of entries){
    const relative=prefix+entry.name,path=join(directory,entry.name);
    if(entry.isDirectory())await hashAssets(path,relative+"/");
    else if(relative!=="service-worker.js")releaseHash.update(relative+"\0").update(await readFile(path)).update("\0");
  }
}
await hashAssets(output);
const cacheName=`adigunsps-shell-${releaseHash.digest("hex").slice(0,20)}`;
const workerPath=join(output,"service-worker.js"),workerSource=await readFile(workerPath,"utf8");
if(!/^const CACHE = "[^"]+";/m.test(workerSource))throw new Error("Service worker cache declaration is missing.");
await writeFile(workerPath,workerSource.replace(/^const CACHE = "[^"]+";/m,`const CACHE = "${cacheName}";`),"utf8");

const shellDeclaration = workerSource.match(/^const SHELL = (\[.*\]);$/m);
if (!shellDeclaration) throw new Error("Service worker precache declaration is missing.");
for (const asset of JSON.parse(shellDeclaration[1])) {
  const file = asset.endsWith("/") ? asset + "index.html" : asset;
  const entry = await stat(join(output, file), { throwIfNoEntry: false }).catch(error => {
    if (error.code !== "ENOENT") throw error;
  });
  if (!entry?.isFile()) throw new Error(`Built app is missing precache asset ${asset}`);
}

const required = ["update/index.html", "update/update.js","index.html", "styles.css", "service-worker.js", "runtime-config.js", "vendor/supabase.js", "src/app.js", "src/engine.js", "docs/HELP.md", "docs/QUICKSTART.md", "reset-password/index.html", "reset-password/reset-password.css", "reset-password/reset-password.js", "assets/brand/company-official.jpg", "assets/brand/adigunsps-icon-light-192.svg", "assets/brand/adigunsps-icon-dark-512.svg"];
for (const file of required) if (!(await stat(join(output, file))).isFile()) throw new Error(`Built app is missing ${file}`);
const html = await (await import("node:fs/promises")).readFile(join(output, "index.html"), "utf8");
if (!html.includes('src="src/app.js"') || !html.includes('href="styles.css"')) throw new Error("Built entry point is missing its application script or stylesheet.");
console.log(`Built static AdigunSPs app to ${output}${sep} (syntax checked ${await collectJavaScript(join(root, "src")).then((files) => files.length)} source modules and the password recovery route).`);
