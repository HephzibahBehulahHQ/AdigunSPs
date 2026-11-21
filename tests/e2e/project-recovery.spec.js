import { expect, test } from "@playwright/test";

test("local project writes and recovery snapshots commit together", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/store.js");
    const id = "project-recovery-check";
    await store.save({ id, name:"First save" });

    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "snapshots") throw new Error("Injected snapshot failure");
      return originalPut.apply(this, args);
    };
    let rejected = false;
    try {
      await store.save({ id, name:"Failed save" });
    } catch (error) {
      if (error.message !== "Injected snapshot failure") throw error;
      rejected = true;
    } finally {
      IDBObjectStore.prototype.put = originalPut;
    }
    const afterFailure = await store.get(id);
    const historyAfterFailure = await store.history(id);

    const now = Date.now;
    const timestamp = now();
    Date.now = () => timestamp;
    try {
      await Promise.all(Array.from({ length:30 }, (_, index) => store.save({ id, name:`Version ${index}` })));
    } finally {
      Date.now = now;
    }
    const saved = await store.get(id);
    const snapshots = await store.history(id);
    await store.remove(id);
    return {
      rejected,
      savedAfterFailure:afterFailure.name,
      snapshotsAfterFailure:historyAfterFailure.map(({ project }) => project.name),
      snapshotCount:snapshots.length,
      newestSnapshotMatchesSavedVersion:snapshots[0]?.project.name === saved.name,
      deleted:(await store.get(id)) === undefined && (await store.history(id)).length === 0
    };
  });
  expect(result).toEqual({
    rejected:true,
    savedAfterFailure:"First save",
    snapshotsAfterFailure:["First save"],
    snapshotCount:25,
    newestSnapshotMatchesSavedVersion:true,
    deleted:true
  });
});
