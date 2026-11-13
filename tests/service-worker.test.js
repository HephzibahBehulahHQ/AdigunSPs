import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

for(const language of ["en","de","yo","pcm"])for(const fail of [false,true]){
  const elements=Object.fromEntries(["#update","#status","#return","#description"].map(id=>[id,{hidden:true,addEventListener(type,handler){this.handler=handler;}}]));
  let registrationRequest;
  const page={documentElement:{},querySelector:id=>elements[id]};
  const recovery={document:page,navigator:{language,serviceWorker:{register:async(url,options)=>{registrationRequest={url,options};if(fail)throw Error("offline");return {installing:{state:"installing",addEventListener(type,handler){queueMicrotask(()=>{this.state="activated";handler();});},removeEventListener(){}}};}}},location:{href:"https://adigun.test/AdigunSPs/update/",search:"?lang="+language},URL,URLSearchParams,Date,setTimeout,clearTimeout};
  vm.runInNewContext(readFileSync("update/update.js","utf8"),recovery);
  await elements["#update"].handler();
  assert.equal(registrationRequest.options.scope,"/AdigunSPs/","recovery preserves a repository deployment base path");
  assert.equal(registrationRequest.options.updateViaCache,"none","recovery bypasses cached worker scripts");
  assert.equal(elements["#return"].hidden,fail,`${language} only offers return after successful activation`);
  if(fail)assert.equal(elements["#update"].disabled,false,"network failures permit retry");
  else assert.equal(elements["#return"].href,"https://adigun.test/AdigunSPs/");
}

const handlers = new Map();
const writes = [];
let networkCalls = 0;
let installedRequests=[];
const cache = {
  addAll: async (requests) => {installedRequests=requests;},
  put: async (request, response) => writes.push({ url: request.url, body: await response.text() }),
};
const context = {
  URL, Request, Response, Promise,
  self: { location: { origin: "https://adigun.test", href:"https://adigun.test/service-worker.js" }, clients: { claim: async () => {} }, addEventListener: (type, handler) => handlers.set(type, handler), skipWaiting: async () => {} },
  caches: { open: async () => cache, match: async () => null, keys: async () => [], delete: async () => true },
  fetch: async (request) => { networkCalls += 1; return new Response("payload", { headers: { "content-type": request.url.endsWith(".js") ? "text/javascript" : "text/event-stream" } }); },
};
vm.runInNewContext(readFileSync("service-worker.js", "utf8"), context);
let installation;
handlers.get("install")({waitUntil:promise=>{installation=promise;}});
await installation;
const removedCaches = [];
context.caches.keys = async () => ["adigunsps-shell-v141", "adigunsps-shell-v143", "unrelated-app"];
context.caches.delete = async key => { removedCaches.push(key); return true; };
let activation;
handlers.get("activate")({ waitUntil: promise => { activation = promise; } });
await activation;
assert.deepEqual(removedCaches, ["adigunsps-shell-v141", "adigunsps-shell-v144"]);
assert.ok(installedRequests.length>0&&installedRequests.every(request=>request.cache==="reload"),"new releases bypass stale HTTP assets during precaching");
assert.match(readFileSync("service-worker.js", "utf8"), /const CACHE = "adigunsps-shell-v144";/, "development cache version advances for this runtime release");
assert.match(readFileSync("service-worker.js", "utf8"), /\.\/reset-password\/reset-password\.js/, "password recovery route is available offline after install");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/example-search\.js"/, "Bot example search module must be included in the offline app shell");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/menu-dismissal\.js"/, "menu dismissal module must be included in the offline app shell");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/adigun-bot-verifier\.js"/, "Bot verification module must be included in the offline app shell");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/adigun-bot-preview\.js"/, "Bot preview module must be included in the offline app shell");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/adigun-bot-tools\.js"/, "Bot project tool module must be included in the offline app shell");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/adigun-bot-copilot\.js"/, "live co-pilot module must be included in the offline app shell");
assert.match(readFileSync("service-worker.js", "utf8"), /"\.\/src\/adigun-ai-remote\.js"/, "AI consent module must be included in the offline app shell");
const fetchHandler = handlers.get("fetch");

async function dispatch(path, mode = "cors") {
  const waits = [];
  let responsePromise;
  fetchHandler({
    request: { url: `https://adigun.test${path}`, method: "GET", mode },
    respondWith: (response) => { responsePromise = Promise.resolve(response); },
    waitUntil: (promise) => waits.push(promise),
  });
  const response = responsePromise ? await responsePromise : null;
  await Promise.all(waits);
  return response;
}

assert.equal(await dispatch("/__live"), null, "live reload event stream bypasses service-worker caching");
assert.equal(networkCalls, 0, "service worker leaves live reload event stream to the browser");
assert.equal(await (await dispatch("/src/app.js")).text(), "payload", "app module response remains readable");
assert.equal(writes.length, 1, "cacheable response is cloned once for storage");
assert.equal(writes[0].body, "payload", "cached clone preserves the response body");
assert.equal(await (await dispatch("/events")).headers.get("content-type"), "text/event-stream", "event stream is returned to its consumer");
assert.equal(writes.length, 1, "event streams are never cached");
console.log("PASS: live reload bypass, response cloning, and event-stream cache exclusion");




context.fetch = async () => { throw new Error("offline"); };
context.caches.match = async (request) => request === new URL("./index.html", context.self.location.href).href ? new Response("editor shell") : null;
assert.equal(await (await dispatch("/?offline", "navigate")).text(), "editor shell");
context.self.location.href = "https://adigun.test/AdigunSPs/service-worker.js";
const scopedLookups = [];
context.caches.match = async (request, options) => {
  scopedLookups.push(options?.cacheName);
  return request === "https://adigun.test/AdigunSPs/index.html" ? new Response("editor shell") : null;
};
assert.equal(await (await dispatch("/AdigunSPs/?offline", "navigate")).text(), "editor shell");
assert.equal((await dispatch("/AdigunSPs/src/missing.js")).type, "error");
assert.deepEqual(scopedLookups, Array(3).fill("adigunsps-shell-v144"));
assert.equal((await dispatch("/missing.js")).type, "error");
context.caches.match = async () => null;
assert.equal((await dispatch("/?offline", "navigate")).type, "error");

// Every local module reachable from the application must be available on first offline use.
const {existsSync}=await import("node:fs"),{posix}=await import("node:path");
const shellPaths=new Set(JSON.parse(readFileSync("service-worker.js","utf8").match(/const SHELL = (\[[^\n]+\]);/)[1])),visitedModules=new Set();
function checkCachedImports(file){
 if(visitedModules.has(file))return;visitedModules.add(file);
 for(const match of readFileSync(file,"utf8").matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g)){
  if(!match[1].startsWith("."))continue;
  const dependency=posix.normalize(posix.join(posix.dirname(file),match[1]));if(!dependency.endsWith(".js"))continue;
  assert.ok(existsSync(dependency),`module ${dependency} exists`);assert.ok(shellPaths.has("./"+dependency),`offline shell caches ${dependency}`);checkCachedImports(dependency);
 }
}
checkCachedImports("src/app.js");
