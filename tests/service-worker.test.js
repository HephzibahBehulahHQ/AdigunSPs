import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const handlers = new Map();
const writes = [];
let networkCalls = 0;
const cache = {
  addAll: async () => {},
  put: async (request, response) => writes.push({ url: request.url, body: await response.text() }),
};
const context = {
  URL, Request, Response, Promise,
  self: { location: { origin: "https://adigun.test" }, clients: { claim: async () => {} }, addEventListener: (type, handler) => handlers.set(type, handler), skipWaiting: async () => {} },
  caches: { open: async () => cache, match: async () => null, keys: async () => [], delete: async () => true },
  fetch: async (request) => { networkCalls += 1; return new Response("payload", { headers: { "content-type": request.url.endsWith(".js") ? "text/javascript" : "text/event-stream" } }); },
};
vm.runInNewContext(readFileSync("service-worker.js", "utf8"), context);
const fetchHandler = handlers.get("fetch");

async function dispatch(path) {
  const waits = [];
  let responsePromise;
  fetchHandler({
    request: new Request(`https://adigun.test${path}`),
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
