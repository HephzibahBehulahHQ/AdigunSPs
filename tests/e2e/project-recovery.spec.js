import { expect, test } from "@playwright/test";

async function useOfflineMember(page, context) {
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
}

test("a cached member can reopen and restore a local project while offline", async ({ page, context }) => {
  await useOfflineMember(page, context);
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
    const originalId = await reopened.evaluate(async (projectName) => {
      const { store } = await import("/src/store.js");
      return (await store.all()).find((item) => item.name === projectName).id;
    }, name);
    await reopened.locator("#projectMenu").click();
    await reopened.locator(`[data-recover="${originalId}"]`).click();
    const compare = reopened.getByRole("button", { name:"Compare logic" }).first();
    await compare.click();
    await expect(reopened.getByRole("dialog", { name:"Compare saved logic" })).toBeVisible();
    await expect(reopened.locator("pre").filter({ hasText:"Original network" })).toBeVisible();
    await expect(reopened.locator("pre").filter({ hasText:"Edited offline" })).toBeVisible();
    await expect(reopenedComment).toHaveValue("Edited offline");
    await reopened.getByRole("button", { name:"Back to snapshots" }).click();
    await expect(compare).toBeFocused();
    await reopened.getByRole("button", { name:"Restore as copy" }).first().click();
    await expect(reopened.locator("#projectTitle")).toHaveText(`${name} (recovered copy)`);
    await expect(reopenedComment).toHaveValue("Original network");
    const savedOriginal = await reopened.evaluate(async (id) => {
      const { store } = await import("/src/store.js");
      const saved = await store.get(id);
      return { comment:saved.rungs[0].comment, revisions:(await store.history(id)).length };
    }, originalId);
    expect(savedOriginal).toEqual({ comment:"Edited offline", revisions:2 });
    await reopened.locator("#projectMenu").click();
    await reopened.locator(`[data-open="${originalId}"]`).click();
    await expect(reopenedComment).toHaveValue("Edited offline");
    await reopened.locator("#projectMenu").click();
    await reopened.locator(`[data-recover="${originalId}"]`).click();
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

    await reopened.locator("#projectMenu").click();
    await reopened.locator(`[data-recover="${originalId}"]`).click();
    await expect(reopened.locator("[data-restore]").first()).toBeVisible();
    await page.evaluate(async (id) => {
      const { store } = await import("/src/store.js");
      await store.remove(id);
    }, originalId);
    await reopened.locator("[data-restore]").first().click();
    await expect(reopened.locator("#toast")).toContainText("That snapshot is no longer available");
    const removed = await reopened.evaluate(async (id) => {
      const { store } = await import("/src/store.js");
      return { project:await store.get(id), revisions:(await store.history(id)).length };
    }, originalId);
    expect(removed).toEqual({ project:undefined, revisions:0 });
  } finally {
    await context.setOffline(false);
  }
});

test("local project metadata edits preserve saves from another tab", async ({ page, context }) => {
  await page.addInitScript(() => {
    localStorage.setItem("adigun-preferences", JSON.stringify({ autosave:false }));
  });
  await useOfflineMember(page, context);
  const writer = await context.newPage();
  try {
    await page.goto("/?offline-project=metadata", { waitUntil:"domcontentloaded" });
    await writer.goto("/?offline-project=metadata-writer", { waitUntil:"domcontentloaded" });
    await expect(page.locator("#accountButton")).toHaveAttribute("data-account-state", "member");
    const id = "local-metadata-fixture", name = "Shared local metadata fixture";
    await writer.evaluate(async ({ id, name }) => {
      const { store } = await import("/src/store.js");
      await store.save({ id, name, editorType:"LD",
        tags:[{ name:"Start", type:"BOOL", role:"input" }, { name:"Lamp", type:"BOOL", role:"output" }],
        io:{ inputs:["Start"], outputs:["Lamp"] }, initialState:{},
        properties:{ author:"First author", version:"1" },
        rungs:[{ id:"network", branches:[[{ tag:"Start", mode:"NO" }]], coil:"Lamp", comment:"First network" }] });
    }, { id, name });
    await page.locator("#projectMenu").click();
    await page.locator(`[data-open="${id}"]`).click();
    await expect(page.locator("#projectTitle")).toHaveText(name);
    const workingComment = page.getByRole("textbox", { name:"Rung comment" });
    await workingComment.fill("Unsaved first-tab draft");
    await workingComment.press("Tab");
    await expect(page.locator("#saveState")).toHaveText("Unsaved changes");
    await page.locator("#projectMenu").click();
    await page.locator(`[data-properties="${id}"]`).click();
    await page.locator("#projectDescription").fill("Description from the first tab");
    await writer.evaluate(async (id) => {
      const { store } = await import("/src/store.js");
      const project = await store.get(id);
      project.properties.author = "Author from the second tab";
      project.rungs[0].comment = "Network saved in the second tab";
      await store.save(project);
    }, id);
    await page.locator("#saveProjectProperties").click();
    await expect(page.locator(`[data-open="${id}"]`)).toBeVisible();
    const read = () => writer.evaluate(async (id) => {
      const { store } = await import("/src/store.js");
      return { project:await store.get(id), count:(await store.history(id)).length };
    }, id);
    const afterProperties = await read();
    expect(afterProperties.project.rungs[0].comment).toBe("Network saved in the second tab");
    expect(afterProperties.project.properties).toMatchObject({
      author:"Author from the second tab", description:"Description from the first tab"
    });
    expect(afterProperties.count).toBe(3);
    await expect(workingComment).toHaveValue("Unsaved first-tab draft");

    const renamed = "Renamed shared fixture";
    const prompt = page.waitForEvent("dialog");
    const click = page.locator(`[data-rename="${id}"]`).click();
    const dialog = await prompt;
    await writer.evaluate(async (id) => {
      const { store } = await import("/src/store.js");
      const project = await store.get(id);
      project.properties.version = "2";
      await store.save(project);
    }, id);
    await dialog.accept(renamed);
    await click;
    await expect(page.locator("#projectTitle")).toHaveText(renamed);
    const afterRename = await read();
    expect(afterRename.project.name).toBe(renamed);
    expect(afterRename.project.properties.version).toBe("2");
    expect(afterRename.count).toBe(5);

    await page.locator(`[data-properties="${id}"]`).click();
    await page.locator("#projectDescription").fill("Edited after deletion");
    await writer.evaluate(async (projectId) => {
      const { store } = await import("/src/store.js");
      await store.remove(projectId);
    }, id);
    await page.locator("#saveProjectProperties").click();
    await expect(page.locator("#toast")).toContainText("Saved project is no longer available");
    expect(await read()).toEqual({ project:undefined, count:0 });
    await expect(workingComment).toHaveValue("Unsaved first-tab draft");
  } finally {
    await context.setOffline(false);
    await writer.close();
  }
});

test("local project writes and recovery snapshots commit together", async ({ page }) => {
  await page.goto("/?account=sign-in");
  const result = await page.evaluate(async () => {
    const { store } = await import("/src/store.js");
    const id = "project-recovery-check";
    await store.save({ id, name:"First save" });
    const initialSnapshot = await store.recover(id);

    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "snapshots") throw new Error("Injected snapshot failure");
      return originalPut.apply(this, args);
    };
    let rejectedWrites = 0;
    try {
      for (const write of [
        () => store.save({ id, name:"Failed save" }),
        () => store.update(id, (project) => { project.name = "Failed metadata update"; }),
        () => store.restore(id, initialSnapshot.id, { copySuffix:"failed copy" }),
      ]) {
        try {
          await write();
        } catch (error) {
          if (error.message !== "Injected snapshot failure") throw error;
          rejectedWrites++;
        }
      }
    } finally {
      IDBObjectStore.prototype.put = originalPut;
    }
    const afterFailure = await store.get(id);
    const historyAfterFailure = await store.history(id);
    const orphanedCopy = (await store.all()).some((project) => project.name.endsWith("(failed copy)"));

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
      rejectedWrites,
      savedAfterFailure:afterFailure.name,
      snapshotsAfterFailure:historyAfterFailure.map(({ project }) => project.name),
      orphanedCopy,
      snapshotCount:snapshots.length,
      newestSnapshotMatchesSavedVersion:snapshots[0]?.project.name === saved.name,
      deleted:(await store.get(id)) === undefined && (await store.history(id)).length === 0
    };
  });
  expect(result).toEqual({
    rejectedWrites:3,
    savedAfterFailure:"First save",
    snapshotsAfterFailure:["First save"],
    orphanedCopy:false,
    snapshotCount:25,
    newestSnapshotMatchesSavedVersion:true,
    deleted:true
  });
});
