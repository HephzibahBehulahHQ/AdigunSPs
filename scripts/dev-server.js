import { createServer } from "node:http";
import { readFile, watch } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.ADIGUN_DEV_PORT || 8080);
const clients = new Set();
const types = { ".css":"text/css; charset=utf-8", ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".jpg":"image/jpeg", ".png":"image/png", ".svg":"image/svg+xml", ".webmanifest":"application/manifest+json" };

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/__live") {
    response.writeHead(200, { "Content-Type":"text/event-stream", "Cache-Control":"no-cache", Connection:"keep-alive" });
    response.write("retry: 1000\n\n"); clients.add(response); request.on("close", () => clients.delete(response)); return;
  }
  const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const path = resolve(root, `.${relative}`);
  if (path !== root && !path.startsWith(`${root}${sep}`)) { response.writeHead(403).end("Forbidden"); return; }
  readFile(path, (error, content) => {
    if (error) { response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found"); return; }
    response.writeHead(200, { "Content-Type":types[extname(path)] || "application/octet-stream", "Cache-Control":"no-store" });
    if (path.endsWith("index.html")) content = Buffer.from(content.toString("utf8").replace("</body>", '<script>const live=new EventSource("/__live");live.onmessage=()=>location.reload()</script></body>'));
    response.end(content);
  });
}).listen(port, "127.0.0.1", () => console.log(`AdigunSPs live preview: http://127.0.0.1:${port}/`));

watch(root, { recursive:true }, (event, filename) => {
  if (!filename || filename.includes("node_modules") || filename.includes(".git")) return;
  for (const client of clients) client.write(`data: ${Date.now()}\n\n`);
});
