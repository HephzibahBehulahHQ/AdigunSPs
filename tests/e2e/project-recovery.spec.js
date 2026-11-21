import { expect, test } from "@playwright/test";

test("a cached member can reopen and restore a local project while offline", async ({ page, context }) => {
  await page.goto("/?account=sign-in");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.evaluate(() => {
    const projectRef = new URL(globalThis.ADIGUN_RUNTIME_CONFIG.supabase.url).hostname.split(".")[0];
    const user = {
      id:"00000000-0000-4000-8000-000000000001", aud:"authenticated", role:"authenticated",
      is_anonymous:false, app_metadata:{}, user_metadata:{}, created_at:new Date().toISOString()
    };
    localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify({
      access_token:"local-offline-test-token", refresh_token:"local-offline-test-refresh",
      token_type:"bearer", expires_at:Math.floor(Date.now() / 1000) + 3600, user
    }));
    localStorage.setItem("adigun-safety-seen", "true");
  });
  await context.setOffline(true);
  try {
    await page.goto("/?offline-project=author", { waitUntil:"domcontentloaded" });
    await expect(page.locator("#accountButton")).toHaveAttribute("data-account-state", "member");
    const name = "Offline recovery exercise";
    const project = {
      name, editorType:"LD",
      tags:[{ name:"Start", type:"BOOL", role:"input" }, { name:"Lamp", type:"BOOL", role:"output" }],
      rungs:[{ id:"offline-rung", branches:[[{ tag:"Start", mode:"NO" }]], coil:"Lamp", comment:"Original network" }]
    };
    await page.locator("#fileInput").setInputFiles({
      name:"offline-project.json", mimeType:"application/json", buffer:Buffer.from(JSON.stringify(project))
    });
    await expect(page.locator("#projectTitle")).toHaveText(name);
    const comment = page.getByRole("textbox", { name:"Rung comment" });
    await comment.fill("Edited offline");
    await comment.press("Tab");
    await expect.poll(() => page.evaluate(async (projectName) => {
      const { store } = await import("/src/store.js");
      const saved = (await store.all()).find((item) => item.name === projectName);
      return saved?.rungs[0].comment;
    }, name)).toBe("Edited offline");

    const reopened = await context.newPage();
    await reopened.goto("/?offline-project=recovery", { waitUntil:"domcontentloaded" });
    await expect(reopened.locator("#accountButton")).toHaveAttribute("data-account-state", "member");
    await reopened.locator("#projectMenu").click();
    await reopened.locator("[data-open]").filter({ hasText:name }).click();
    const reopenedComment = reopened.getByRole("textbox", { name:"Rung comment" });
    await expect(reopenedComment).toHaveValue("Edited offline");
    await reopened.locator("#projectMenu").click();
    await reopened.locator(".project-row").filter({ hasText:name }).locator("[data-recover]").click();
    await reopened.locator("[data-restore]").first().click();
    await expect(reopenedComment).toHaveValue("Original network");
    await reopened.locator('[data-app-menu="file"]').click();
    const [download] = await Promise.all([
      reopened.waitForEvent("download"),
      reopened.getByRole("menuitem", { name:"Save locally (JSON)", exact:true }).click()
    ]);
    const contents = [];
    for await (const chunk of await download.createReadStream()) contents.push(chunk);
    const exported = JSON.parse(Buffer.concat(contents).toString("utf8"));
    expect(exported.name).toBe(name);
    expect(exported.rungs[0].comment).toBe("Original network");
    await reopened.locator("#fileInput").setInputFiles({
      name:download.suggestedFilename(), mimeType:"application/json", buffer:Buffer.concat(contents)
    });
    await expect.poll(() => reopened.evaluate(async (projectName) => {
      const { store } = await import("/src/store.js");
      return (await store.all()).filter((item) => item.name === projectName).length;
    }, name)).toBe(2);
  } finally {
    await context.setOffline(false);
  }
});

test("local project writes and recovery snapshots commit together", async ({ page }) => {
  await page.goto("/?account=sign-in");
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
