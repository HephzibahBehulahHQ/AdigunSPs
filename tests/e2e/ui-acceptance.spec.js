import { expect, test } from "@playwright/test";

const viewportCases = [
  { width: 1894, height: 704, minBoardHeight: 300 },
  { width: 1920, height: 1080, minBoardHeight: 400 },
  { width: 1366, height: 768, minBoardHeight: 300 },
  { width: 1024, height: 768, minBoardHeight: 280 },
  { width: 760, height: 900, minBoardHeight: 240 },
  { width: 390, height: 844, minBoardHeight: 200 }
];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  const welcomeContinue = page.locator("#welcomeContinue");
  await expect(welcomeContinue).toBeVisible();
  await welcomeContinue.click();
  await expect(page.locator("#modal")).toBeHidden();
});

test("electrical workspace stays usable without overlap at required viewports", async ({ page }) => {
  await page.locator("#electricalTab").click();
  await expect(page.locator("#electricalBoard")).toBeVisible();

  for (const viewport of viewportCases) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    if (viewport.width <= 760) {
      await page.locator("#panelLayoutButton").click();
      await expect(page.locator("#mobileProjectPanel")).toBeVisible();
      await page.locator("#mobileProjectPanel").click();
      await expect(page.locator(".workspace")).toHaveClass(/mobile-left-open/);
    }
    const board = page.locator(".electrical-board-wrap");
    const boardBox = await board.boundingBox();
    const toolbarBox = await page.locator("#electricalToolboxDock .electrical-toolbar").boundingBox();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const overlap = boardBox && toolbarBox && toolbarBox.x < boardBox.x + boardBox.width && toolbarBox.x + toolbarBox.width > boardBox.x && toolbarBox.y < boardBox.y + boardBox.height && toolbarBox.y + toolbarBox.height > boardBox.y;

    expect(boardBox, `${viewport.width}x${viewport.height}: board is rendered`).not.toBeNull();
    expect(boardBox.height, `${viewport.width}x${viewport.height}: useful board height`).toBeGreaterThanOrEqual(viewport.minBoardHeight);
    expect(documentWidth, `${viewport.width}x${viewport.height}: no page horizontal overflow`).toBeLessThanOrEqual(viewport.width);
    expect(toolbarBox, `${viewport.width}x${viewport.height}: electrical tools remain docked`).not.toBeNull();
    if (viewport.width > 760) expect(overlap, `${viewport.width}x${viewport.height}: toolbox does not overlap board`).toBe(false);
    await expect(page.locator("#inspectorContent .electrical-inspector")).toHaveCount(1);
    await expect(page.locator("#electricalPane .electrical-inspector")).toHaveCount(0);
    if (viewport.width <= 760) await page.locator('[data-mobile-drawer-close="left"]').click();
  }
});

test("contextual toolboxes keep the existing editor actions reachable", async ({ page }) => {
  const logicTab = page.locator("#logicTab");
  const mode = page.locator("#editorMode");
  for (const editor of ["LD", "FBD", "ST", "SFC"]) {
    await logicTab.click();
    await mode.selectOption(editor);
    const group = page.locator(`#editorToolboxDock [data-editor-toolbox-mode="${editor}"]`);
    await expect(group).toBeVisible();
    await expect(group.locator("button:visible").first()).toBeVisible();
  }

  await page.locator("#hmiTab").click();
  const hmiTools = page.locator('#editorToolboxDock [data-editor-toolbox-mode="HMI"]');
  await expect(hmiTools).toBeVisible();
  await expect(hmiTools.locator("[data-hmi-add]:visible")).toHaveCount(4);

  await page.locator("#electricalTab").click();
  await expect(page.locator("#electricalToolboxDock .electrical-toolbar [data-electrical-action]")).toHaveCount(7);
  await page.locator("#electricalToolboxDock > .industrial-catalog > summary").click();
  await expect(page.locator("#electricalToolboxDock .industrial-catalog li").first()).toBeVisible();
});
