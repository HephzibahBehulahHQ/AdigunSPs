import { compileStructuredText } from "./structured-text.js";

export function compileWorkerRequest({ id, source, tags }) {
  return { id, result:compileStructuredText(source, tags) };
}

if (typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope) {
  self.addEventListener("message", (event) => self.postMessage(compileWorkerRequest(event.data)));
}
