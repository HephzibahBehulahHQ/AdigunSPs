const DB_NAME = "adigunsps-local";
const DB_VERSION = 1;
const GUEST_RECOVERY_GRACE_MS = 24 * 60 * 60 * 1000;

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

async function runTransaction(names, mode, action) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(names, mode);
    let result, failure;
    transaction.oncomplete = () => { database.close(); resolve(result); };
    transaction.onabort = () => {
      database.close();
      reject(failure || transaction.error || new Error("Project storage transaction aborted."));
    };
    const abort = (error) => { failure = error; transaction.abort(); };
    try {
      action(transaction, (value) => { result = value; }, abort);
    } catch (error) {
      abort(error);
    }
  });
}

function requestStore(name, mode, action) {
  return runTransaction(name, mode, (transaction, setResult) => {
    const request = action(transaction.objectStore(name));
    request.onsuccess = () => setResult(request.result);
  });
}

function projectVersions(snapshots, id) {
  return snapshots.filter((item) => item.projectId === id || item.id === id)
    .sort((a, b) => (b.revision ?? 0) - (a.revision ?? 0) || b.savedAt - a.savedAt);
}

function putProjectRevision(transaction, project, abort) {
  const { id, updatedAt } = project;
  const snapshot = { id:`${id}:${updatedAt}:${crypto.randomUUID()}`, projectId:id, savedAt:updatedAt, project };
  transaction.objectStore("projects").put(project);
  const snapshots = transaction.objectStore("snapshots");
  const previous = snapshots.getAll();
  previous.onsuccess = () => {
    try {
      const versions = projectVersions(previous.result, id);
      snapshots.put({ ...snapshot, revision:(versions[0]?.revision ?? 0) + 1 });
      for (const item of versions.slice(24)) snapshots.delete(item.id);
    } catch (error) {
      abort(error);
    }
  };
}

export const store = {
  all: async () => {
    const projects = await requestStore("projects", "readonly", (s) => s.getAll());
    const expired = projects.filter((project) => Number.isFinite(project.__adigunGuestExpiresAt) && Date.now() > project.__adigunGuestExpiresAt + GUEST_RECOVERY_GRACE_MS);
    await Promise.all(expired.map((project) => store.remove(project.id)));
    const expiredIds = new Set(expired.map((project) => project.id));
    return projects.filter((project) => !expiredIds.has(project.id));
  },
  get: (id) => requestStore("projects", "readonly", (s) => s.get(id)),
  open: (id, prepareProject) => runTransaction(["projects"], "readwrite", (transaction, setResult, abort) => {
    const projects = transaction.objectStore("projects"), request = projects.get(id);
    request.onsuccess = () => {
      if (!request.result) return;
      try {
        const opened = { ...request.result, lastOpenedAt:Date.now() };
        prepareProject?.(opened);
        projects.put(opened);
        setResult(opened);
      } catch (error) {
        abort(error);
      }
    };
  }),
  save: async (project) => {
    const updatedAt = Date.now();
    const savedProject = structuredClone({ ...project, updatedAt });
    await runTransaction(["projects", "snapshots"], "readwrite", (transaction, _, abort) => {
      putProjectRevision(transaction, savedProject, abort);
    });
    project.updatedAt = updatedAt;
    return project;
  },
  update: (id, apply) => runTransaction(["projects", "snapshots"], "readwrite", (transaction, setResult, abort) => {
    const request = transaction.objectStore("projects").get(id);
    request.onsuccess = () => {
      const project = request.result;
      if (!project) return;
      try {
        apply(project);
        project.updatedAt = Date.now();
        putProjectRevision(transaction, project, abort);
        setResult(project);
      } catch (error) {
        abort(error);
      }
    };
  }),
  remove: (id) => runTransaction(["projects", "snapshots"], "readwrite", (transaction) => {
    transaction.objectStore("projects").delete(id);
    const snapshots = transaction.objectStore("snapshots");
    const previous = snapshots.getAll();
    previous.onsuccess = () => {
      for (const item of projectVersions(previous.result, id)) snapshots.delete(item.id);
    };
  }),
  history: async (id) => projectVersions(await requestStore("snapshots", "readonly", (s) => s.getAll()), id),
  recover: async (id) => (await store.history(id))[0] || null,
};
