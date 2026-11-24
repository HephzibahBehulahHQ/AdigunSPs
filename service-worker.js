const CACHE = "adigunsps-shell-v209";
const SHELL = ["./","./index.html","./runtime-config.js","./vendor/supabase.js","./styles.css","./assets/brand/brand-overrides.css","./manifest.webmanifest","./manifest.de.webmanifest","./manifest.yo.webmanifest","./manifest.pcm.webmanifest","./src/app.js","./src/help-markdown.js","./docs/HELP.md","./docs/QUICKSTART.md","./docs/user-guide.md","./docs/HELP-UI-LABELS.md","./src/account.js","./src/supabase-client.js","./src/formatting.js","./src/plcopen.js","./src/brand.js","./src/adigun-ai.js","./src/floating-window.js","./src/adigun-ai-remote.js","./src/adigun-bot-builder.js","./src/adigun-bot-tools.js","./src/adigun-bot-verifier.js","./src/adigun-bot-preview.js","./src/adigun-bot-copilot.js","./docs/COMPONENTS.md","./docs/BOT.md","./src/protocol-sim.js","./src/electrical.js","./src/electrical-ui.js","./src/industrial-catalog.js","./src/finder-catalog-data.js","./src/doepke-catalog-data.js","./src/engine.js","./src/hmi.js","./src/hmi-layout.js","./src/hmi-copy.js","./src/fbd-layout.js","./src/fbd-validation.js","./src/logic-conversion.js","./src/hmi-screens.js","./src/hmi-history.js","./src/faults.js","./src/scenarios.js","./src/trace-utils.js","./src/reports.js","./src/io-allocator.js","./src/hardware.js","./src/hardware-serial-protocol.js","./src/project-list.js","./src/project-import.js","./src/example-expansion.js","./src/process.js","./src/process-view.js","./src/operations.js","./src/localization.js","./src/locale-ui.js","./src/app-menus.js","./src/menu-dismissal.js","./src/theme.js","./src/store.js","./src/snapshot-comparison.js","./src/examples.js","./src/validation.js","./src/standards.js","./src/project-search.js","./src/example-search.js","./src/cyclic-tasks.js","./src/cyclic-task-ui.js","./src/st-blocks.js","./src/program-unit.js","./src/structured-text.js","./src/st-function-library.js","./src/st-compiler-worker.js","./src/ladder-virtualization.js","./src/ld-selection.js","./src/resources.js","./src/project-language.js","./reset-password/","./reset-password/index.html","./reset-password/reset-password.css","./reset-password/reset-password.js","./assets/brand/company-official.jpg","./assets/brand/adigunsps-icon-light-192.svg","./assets/brand/adigunsps-icon-dark-192.svg","./assets/brand/adigunsps-icon-light-512.svg","./assets/brand/adigunsps-icon-dark-512.svg","./assets/brand/splash-light.svg","./assets/brand/splash-dark.svg"];
self.addEventListener("install", (event) => event.waitUntil(
  caches.open(CACHE).then((cache) => cache.addAll(SHELL.map(path=>new Request(new URL(path,self.location.href),{cache:"reload"})))).then(() => self.skipWaiting()),
));

self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith("adigunsps-shell-") && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()),
));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === "/__live" || url.pathname.startsWith("/api/")) return;

  const appRoot = new URL("./", self.location.href);
  const releaseEntry = ["runtime-config.js", "src/app.js", "src/account.js", "src/supabase-client.js"]
    .some(path => new URL(path, appRoot).pathname === url.pathname);
  const navigate = request.mode === "navigate";
  const networkFirst = navigate || releaseEntry;

  async function fromNetwork() {
    const response = await fetch(request, networkFirst ? { cache:"no-cache" } : undefined);
    const contentType = response.headers.get("content-type") || "";
    if (response.ok && !contentType.includes("text/event-stream")) {
      const cacheCopy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, cacheCopy)).catch(() => {}));
    }
    return response;
  }

  async function fromCache() {
    const cached = await caches.match(request, { cacheName:CACHE });
    if (!navigate || (cached && !cached.redirected)) return cached;
    const recoveryRoot = new URL("reset-password/", appRoot);
    const recoveryIndex = new URL("index.html", recoveryRoot);
    const isRecovery = [recoveryRoot.pathname, recoveryIndex.pathname].includes(url.pathname);
    const shell = isRecovery ? recoveryRoot : appRoot;
    for (const entry of [shell.href, new URL("index.html", shell).href]) {
      const response = await caches.match(entry, { cacheName:CACHE });
      if (response && !response.redirected) return response;
    }
  }

  event.respondWith(networkFirst
    ? fromNetwork().catch(async () => await fromCache() || Response.error())
    : fromCache().then(cached => cached || fromNetwork()).catch(() => Response.error()));
});
