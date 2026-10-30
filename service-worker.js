const CACHE = "adigunsps-shell-v85";
const SHELL = ["./", "./index.html", "./runtime-config.js", "./vendor/supabase.js", "./styles.css", "./assets/brand/brand-overrides.css", "./manifest.webmanifest", "./manifest.de.webmanifest", "./manifest.yo.webmanifest", "./manifest.pcm.webmanifest", "./src/app.js", "./src/account.js", "./src/supabase-client.js", "./src/formatting.js", "./src/plcopen.js", "./src/brand.js", "./src/adigun-ai.js", "./src/protocol-sim.js", "./src/electrical.js", "./src/electrical-ui.js", "./src/industrial-catalog.js", "./src/engine.js", "./src/hmi.js", "./src/hmi-layout.js", "./src/fbd-layout.js", "./src/fbd-validation.js", "./src/logic-conversion.js", "./src/hmi-screens.js", "./src/hmi-history.js", "./src/faults.js", "./src/scenarios.js", "./src/trace-utils.js", "./src/reports.js", "./src/hardware.js", "./src/project-list.js", "./src/process.js", "./src/process-view.js", "./src/operations.js", "./src/localization.js", "./src/locale-ui.js", "./src/app-menus.js", "./src/theme.js", "./src/store.js", "./src/examples.js", "./src/validation.js", "./src/standards.js", "./src/project-search.js", "./src/structured-text.js", "./src/st-compiler-worker.js", "./src/ladder-virtualization.js", "./src/ld-selection.js", "./src/resources.js", "./src/project-language.js", "./assets/brand/company-official.jpg", "./assets/brand/adigunsps-icon-light-192.svg", "./assets/brand/adigunsps-icon-dark-192.svg", "./assets/brand/adigunsps-icon-light-512.svg", "./assets/brand/adigunsps-icon-dark-512.svg", "./assets/brand/splash-light.svg", "./assets/brand/splash-dark.svg"];

self.addEventListener("install", (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
));

self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()),
));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname === "/__live") return;

  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && !contentType.includes("text/event-stream")) {
        const cacheCopy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, cacheCopy)).catch(() => {}));
      }
      return response;
    }).catch(() => caches.match("./index.html"));
  }));
});
