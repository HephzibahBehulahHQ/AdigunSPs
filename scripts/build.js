import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
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

for (const file of [...await collectJavaScript(join(root, "src")), ...await collectJavaScript(join(root, "scripts"))]) {
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
for (const directory of ["src", "assets"]) await cp(join(root, directory), join(output, directory), { recursive:true });
await mkdir(join(output, "vendor"), { recursive:true });
await cp(join(root, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"), join(output, "vendor", "supabase.js"));
await writeFile(join(output, "runtime-config.js"), serializeAdigunRuntimeConfig(await loadAdigunRuntimeConfig(root)), "utf8");

const required = ["index.html", "styles.css", "service-worker.js", "runtime-config.js", "vendor/supabase.js", "src/app.js", "src/engine.js", "assets/brand/company-official.jpg", "assets/brand/adigunsps-icon-light-192.svg", "assets/brand/adigunsps-icon-dark-512.svg"];
for (const file of required) if (!(await stat(join(output, file))).isFile()) throw new Error(`Built app is missing ${file}`);
const html = await (await import("node:fs/promises")).readFile(join(output, "index.html"), "utf8");
if (!html.includes('src="src/app.js"') || !html.includes('href="styles.css"')) throw new Error("Built entry point is missing its application script or stylesheet.");
console.log(`Built static AdigunSPs app to ${output}${sep} (syntax checked ${await collectJavaScript(join(root, "src")).then((files) => files.length)} source modules).`);
