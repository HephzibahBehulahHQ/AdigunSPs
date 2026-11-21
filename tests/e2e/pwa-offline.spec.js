import { expect, test } from "@playwright/test";

test("offline PWA navigation serves the workspace and Help documents from its cache", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  try {
    await page.goto("/?offline-verification=1", { waitUntil:"domcontentloaded" });
    await expect(page.locator(".workspace")).toBeAttached();
    await expect.poll(() => page.evaluate(async () => {
      const assets = ["./src/app.js", "./docs/HELP.md", "./docs/QUICKSTART.md", "./docs/user-guide.md"];
      return Promise.all(assets.map(async (path) => (await fetch(path)).status));
    })).toEqual([200, 200, 200, 200]);
  } finally {
    await context.setOffline(false);
  }
});
