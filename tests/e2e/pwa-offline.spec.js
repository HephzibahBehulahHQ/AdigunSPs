import { expect, test } from "@playwright/test";

test("offline PWA navigation serves the workspace and Help documents from its cache", async ({ page, context }) => {
  await page.goto("/?account=sign-in");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  try {
    await page.goto("/?account=sign-in&offline-verification=1", { waitUntil:"domcontentloaded" });
    await expect(page.locator(".workspace")).toBeVisible();
    await expect.poll(() => page.evaluate(async () => {
      const assets = ["./src/app.js", "./src/studio-routing.js", "./overview.css", "./docs/HELP.md", "./docs/QUICKSTART.md", "./docs/user-guide.md"];
      return Promise.all(assets.map(async (path) => (await fetch(path)).status));
    })).toEqual([200, 200, 200, 200, 200, 200]);
    await page.goto("/", { waitUntil:"domcontentloaded" });
    await expect(page.locator("#overviewHeading")).toBeVisible();
    await page.getByRole("link", { name:"Launch Studio" }).first().click();
    await expect(page).toHaveURL(/#studio$/);
    await expect(page.locator("#studioView")).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
