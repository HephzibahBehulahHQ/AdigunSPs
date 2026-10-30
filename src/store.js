const DB_NAME = "adigunsps-local";
const DB_VERSION = 1;

function db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("projects")) database.createObjectStore("projects", { keyPath: "id" });
      if (!database.objectStoreNames.contains("snapshots")) database.createObjectStore("snapshots", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function requestStore(name, mode, action) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(name, mode);
    const request = action(transaction.objectStore(name));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const store = {
  all: () => requestStore("projects", "readonly", (s) => s.getAll()),
  get: (id) => requestStore("projects", "readonly", (s) => s.get(id)),
  touch: (project) => requestStore("projects", "readwrite", (s) => s.put(project)),
  save: async (project) => {
    project.updatedAt = Date.now();
    await requestStore("projects", "readwrite", (s) => s.put(project));
    const snapshot = { id: `${project.id}:${Date.now()}:${crypto.randomUUID()}`, projectId: project.id, savedAt: Date.now(), project: structuredClone(project) };
    await requestStore("snapshots", "readwrite", (s) => s.put(snapshot));
    const versions = (await requestStore("snapshots", "readonly", (s) => s.getAll())).filter((item) => item.projectId === project.id || item.id === project.id).sort((a, b) => b.savedAt - a.savedAt);
    await Promise.all(versions.slice(25).map((item) => requestStore("snapshots", "readwrite", (s) => s.delete(item.id))));
    return project;
  },
  remove: async (id) => { await requestStore("projects", "readwrite", (s) => s.delete(id)); const versions = (await requestStore("snapshots", "readonly", (s) => s.getAll())).filter((item) => item.projectId === id || item.id === id); await Promise.all(versions.map((item) => requestStore("snapshots", "readwrite", (s) => s.delete(item.id)))); },
  history: async (id) => (await requestStore("snapshots", "readonly", (s) => s.getAll())).filter((item) => item.projectId === id || item.id === id).sort((a, b) => b.savedAt - a.savedAt),
  recover: async (id) => (await store.history(id))[0] || null,
};
