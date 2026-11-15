import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const viewportCases = [
  { width: 1894, height: 704, minBoardHeight: 300 },
  { width: 1920, height: 1080, minBoardHeight: 400 },
  { width: 1366, height: 768, minBoardHeight: 300 },
  { width: 1024, height: 768, minBoardHeight: 280 },
  { width: 760, height: 900, minBoardHeight: 240 },
  { width: 390, height: 844, minBoardHeight: 200 }
];

async function openSettings(page) {
  await page.locator('[data-app-menu="settings"]').click();
  await page.locator('#contextMenu [role="menuitem"]').first().click();
}

async function cycleLanguage(page) {
  await page.locator('[data-app-menu="settings"]').click();
  await page.locator('#contextMenu [role="menuitem"]').last().click();
}

test.beforeEach(async ({ page }) => {
  const user = {
    id: randomUUID(),
    aud: "authenticated",
    role: "authenticated",
    email: "",
    is_anonymous: true,
    app_metadata: { provider: "anonymous", providers: ["anonymous"] },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const session = {
    access_token: "adigunsps-e2e-access-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(now / 1000) + 3600,
    refresh_token: "adigunsps-e2e-refresh-token",
    user,
  };
  await page.route(/https:\/\/[^/]+\.supabase\.co\//, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/v1/signup") return route.fulfill({ json: session });
    if (path === "/auth/v1/user") return route.fulfill({ json: user });
    if (path === "/rest/v1/rpc/adigun_ensure_guest_session") {
      return route.fulfill({
        json: [
          {
            started_at: nowIso,
            expires_at: new Date(now + 4 * 60_000).toISOString(),
            server_now: nowIso,
          },
        ],
      });
    }
    return route.fulfill({
      status: 501,
      json: {
        error: "Unexpected Supabase request in browser acceptance test",
        path,
      },
    });
  });
  await page.goto("/");
  const welcomeContinue = page.locator("#welcomeContinue");
  await expect(welcomeContinue).toBeVisible();
  await welcomeContinue.click();
  await expect(page.locator("#modal")).toBeHidden();
});

test("status strip shows editor and PLC state, local autosave setting, and electrical grid context", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await expect(page.locator("#editorReadyStatus")).toHaveText("EDITOR READY");
  await expect(page.locator("#plcPrefix")).toHaveText("PLC:");
  await expect(page.locator("#scanTimeLabel")).toHaveText("Scan:");
  await expect(page.locator("#autosaveStatus")).toHaveText("Local autosave active");
  await expect(page.locator("#gridSizeStatus")).toBeHidden();
  await page.locator('[data-project-view="electrical"]').click();
  await expect(page.locator("#gridSizeStatus")).toHaveText("Grid: 20 px");
  await expect(page.locator("#gridSizeStatus")).toBeVisible();
  await openSettings(page);
  await expect(page.locator("#prefAutosave")).toBeChecked();
  await page.locator("#prefAutosave").uncheck();
  await page.locator("#settingsDone").click();
  await expect(page.locator("#autosaveStatus")).toHaveText("Autosave off");
});

test("global header places offline readiness before Undo, Redo, Save, and Run", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await expect(page.locator("#offlineLabel")).toHaveText("Offline ready");
  const state=await page.evaluate(()=>({inHeader:document.querySelector("#offlineLabel").closest("#globalQuickCommands")!==null,commandOrder:[...document.querySelectorAll("#globalQuickCommands button")].map(button=>button.dataset.action)}));
  expect(state.inHeader).toBe(true);
  expect(state.commandOrder).toEqual(["undo","redo","save","run"]);
});

test("wide workspace header matches the reference proportions and keeps secondary actions in menus", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  await expect(page.locator(".electrical-empty")).toHaveCount(0);
  const layout = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { x: Math.round(rect.x), width: Math.round(rect.width), height: Math.round(rect.height), right: Math.round(rect.right) };
    };
    return {
      project: box(".project-name"),
      commands: box("#globalQuickCommands"),
      offline: box("#offlineLabel"),
      menus: box(".app-menus"),
      tabs: box(".editor-tabs"),
      left: box(".left-sidebar"),
      right: box(".right-sidebar"),
      topActions: getComputedStyle(document.querySelector(".top-actions")).display,
      commandLabels: [...document.querySelectorAll("#globalQuickCommands button")].map((button) => button.innerText.trim()),
    };
  });
  expect(layout.project.x).toBeGreaterThanOrEqual(430);
  expect(layout.project.x).toBeLessThanOrEqual(450);
  expect(layout.offline.x).toBeGreaterThan(1200);
  expect(layout.commands.right).toBeLessThanOrEqual(1876);
  expect(layout.menus.height).toBe(39);
  expect(layout.tabs.height).toBe(52);
  expect(layout.left.width).toBe(270);
  expect(layout.right.width).toBe(339);
  expect(layout.topActions).toBe("none");
  expect(layout.commandLabels).toEqual(["↶ Undo", "↷ Redo", "▣ Save", "▶ RUN SIMULATION"]);

  await page.locator('[data-app-menu="project"]').click();
  await page.getByRole("menuitem", { name: "Account", exact: true }).click();
  await expect(page.locator("#modal")).toBeVisible();
});

test("global Run action matches the reference simulation label without losing its command", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  const run=page.locator("#globalQuickCommands [data-action=\"run\"]");
  await expect(run).toBeVisible();
  await expect(run).toHaveAttribute("aria-label","Run simulation");
  await expect(run.locator("span")).toHaveText("Run simulation");
  await expect(run).toHaveCSS("text-transform","uppercase");
  expect((await run.boundingBox()).width).toBe(210);
});

test("fresh AdigunSPs workspaces use the approved dark interface by default", async ({ page }) => {
  await expect(page.locator("body")).toHaveAttribute("data-theme", "dark");
});

test("project explorer switches between the existing logic, electrical, and HMI workspaces", async ({ page }) => {
  await page.locator('[data-project-view="electrical"]').click();
  await expect(page.locator("#electricalPane")).toBeVisible();
  await expect(page.locator('[data-project-view="electrical"]')).toHaveAttribute("aria-current", "page");
  await page.locator('[data-project-view="hmi"]').click();
  await expect(page.locator("#hmiPane")).toBeVisible();
  await expect(page.locator('[data-project-view="hmi"]')).toHaveAttribute("aria-current", "page");
  await page.locator('[data-project-view="logic"]').click();
  await expect(page.locator("#logicTab")).toHaveClass(/active/);
  await expect(page.locator('[data-project-view="logic"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('.toolbar [data-action="examples"]')).toHaveCount(1);
});

test("project header shows the reference breadcrumb at desktop widths and localizes it", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await expect(page.locator("#projectTitle")).toBeVisible();
  await expect(page.locator("#workspaceBreadcrumb")).toHaveText("Main program");
  await cycleLanguage(page);
  await expect(page.locator("#workspaceBreadcrumb")).toHaveText("Hauptprogramm");
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(page.locator("#workspaceBreadcrumb")).toBeHidden();
});

test("command search matches the labeled reference field and opens the existing searchable palette", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  const search = page.getByRole("button", { name: "Search all commands" });
  await expect(search).toBeVisible();
  expect((await search.boundingBox()).width).toBeGreaterThanOrEqual(180);
  await search.click();
  await expect(page.locator("#paletteSearch")).toBeVisible();
  await page.locator("#paletteSearch").fill("New project");
  await expect(page.locator("#paletteResults")).toContainText("New project");
  await page.keyboard.press("Escape");
  await cycleLanguage(page);
  await expect(page.getByRole("button", { name: "Befehle suchen" })).toBeVisible();
});

test("electrical workspace uses one compact status row and docks the bot without hiding editor status elsewhere", async ({ page }) => {
  await page.setViewportSize({ width:1894, height:850 });
  await page.locator("#electricalTab").click();
  await expect(page.locator("#offlineLabel")).toBeVisible();
  await expect(page.locator(".editor-footer")).toBeHidden();
  await expect(page.locator(".corporate-footer")).toBeHidden();
  const electricalLayout=await page.evaluate(()=>{
    const box=(selector)=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
    return {status:box(".statusbar"),bot:box(".floating-bot"),board:box(".electrical-board-wrap"),offlineInHeader:document.querySelector("#offlineLabel").closest("#globalQuickCommands")!==null};
  });
  expect(electricalLayout.status.height).toBe(35);
  expect(electricalLayout.bot.top).toBeGreaterThanOrEqual(electricalLayout.status.top);
  expect(electricalLayout.bot.bottom).toBeLessThanOrEqual(electricalLayout.status.bottom+1);
  expect(electricalLayout.board.bottom).toBeLessThanOrEqual(electricalLayout.status.top);
  expect(electricalLayout.offlineInHeader).toBe(true);

  await page.locator("#logicTab").click();
  await expect(page.locator(".editor-footer")).toBeVisible();
  await expect(page.locator(".corporate-footer")).toBeVisible();
  expect(await page.locator("#offlineLabel").evaluate((node)=>node.closest("#globalQuickCommands")!==null)).toBe(true);
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
    const overflowNodes = await page.evaluate(() => { const board = document.querySelector(".electrical-board-wrap"); return [...document.body.querySelectorAll("*")].map((element) => {
      const box = element.getBoundingClientRect();
      const parent = element.parentElement;
      const style = getComputedStyle(parent || element);
      return { tag:element.tagName, id:element.id, className:typeof element.className === "string" ? element.className.slice(0,80) : "", right:Math.round(box.right), parent:`${parent?.tagName || ""}#${parent?.id || ""}.${String(parent?.className || "").slice(0,60)}`, parentOverflowX:style.overflowX, insideBoard:Boolean(board?.contains(element)) };
    }).filter((element) => element.right > innerWidth + 1 && element.right <= innerWidth + 40 && !element.insideBoard).sort((a,b) => b.right - a.right).slice(0,12); });
    const overlap = boardBox && toolbarBox && toolbarBox.x < boardBox.x + boardBox.width && toolbarBox.x + toolbarBox.width > boardBox.x && toolbarBox.y < boardBox.y + boardBox.height && toolbarBox.y + toolbarBox.height > boardBox.y;

    expect(boardBox, `${viewport.width}x${viewport.height}: board is rendered`).not.toBeNull();
    expect(boardBox.height, `${viewport.width}x${viewport.height}: useful board height`).toBeGreaterThanOrEqual(viewport.minBoardHeight);
    expect(documentWidth, `${viewport.width}x${viewport.height}: no page horizontal overflow; nearby elements: ${JSON.stringify(overflowNodes)}`).toBeLessThanOrEqual(viewport.width);
    expect(toolbarBox, `${viewport.width}x${viewport.height}: electrical tools remain docked`).not.toBeNull();
    if (viewport.width > 760) expect(overlap, `${viewport.width}x${viewport.height}: toolbox does not overlap board`).toBe(false);
    await expect(page.locator("#inspectorContent .electrical-inspector")).toHaveCount(1);
    await expect(page.locator("#electricalPane .electrical-inspector")).toHaveCount(0);
    if (viewport.width <= 760) await page.locator('[data-mobile-drawer-close="left"]').click();
  }
});

test("contextual toolboxes keep the existing editor actions reachable", async ({ page }) => {
  await expect(page.locator("#electricalTab")).toHaveAttribute("aria-label", "Components / Schematic");
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
  await expect(page.locator("#electricalToolboxDock .electrical-toolbox-heading h2")).toHaveText("COMPONENT TOOLS");
  await expect(page.locator("#electricalToolboxDock .electrical-toolbox-heading span")).toHaveText("ACTIVE");
  await expect(page.locator("#electricalToolboxDock .electrical-toolbar [data-electrical-action]")).toHaveCount(8);
  await expect(page.locator('#electricalToolboxDock [data-electrical-action="select"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#electricalLibraryWorkflows > h2")).toHaveText("LIBRARY & WORKFLOWS");
  await page.locator("#electricalLibraryWorkflows > .electrical-library-link").click();
  await expect(page.locator("#electricalPalette")).toBeFocused();
  const simulatedWorkflow = page.locator("#electricalSimulationWorkflow");
  await expect(simulatedWorkflow.locator("summary")).toHaveText("Simulated I/O / faults");
  await simulatedWorkflow.locator("summary").click();
  await expect(page.locator('#electricalLibraryWorkflows [data-action="faults"]')).toBeVisible();
  await expect(page.locator("#electricalLibraryWorkflows .industrial-catalog > summary")).toContainText("Manufacturer references");
  await page.locator("#electricalLibraryWorkflows .industrial-catalog > summary").click();
  await expect(page.locator("#electricalToolboxDock .industrial-catalog li").first()).toBeVisible();
  await page.locator('#electricalLibraryWorkflows [data-action="faults"]').click();
  await expect(page.locator("#modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator("#logicTab").click();
  await expect(page.locator('.toolbar .sim-tools [data-action="faults"]')).toHaveCount(1);
  await expect(page.locator('#electricalLibraryWorkflows [data-action="faults"]')).toHaveCount(0);
});

test("approved wide Electrical layout keeps the compact toolbox and project workflows in view", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  await expect(page.locator('.project-tree [data-action="examples"]')).toBeHidden();
  await expect(page.locator("#electricalModelSearch")).toHaveAttribute("placeholder", "Find component or instruction");
  await expect(page.locator("#electricalPalette")).toBeVisible();
  await expect(page.locator('#electricalToolboxDock [data-electrical-action="delete"]')).toBeHidden();
  await expect(page.locator("#electricalLibraryWorkflows > .electrical-library-link")).toBeVisible();
  await expect(page.locator("#electricalLibraryWorkflows .industrial-catalog > summary")).toBeInViewport();
  await expect(page.locator("#electricalSimulationWorkflow > summary")).toBeInViewport();

  const positions = await page.evaluate(() => {
    const y = (selector) => document.querySelector(selector).getBoundingClientRect().y;
    return {
      search: y("#electricalModelSearch"), palette: y("#electricalPalette"),
      place: y('#electricalToolboxDock [data-electrical-action="add"]'),
      select: y('#electricalToolboxDock [data-electrical-action="select"]'),
      rotate: y('#electricalToolboxDock [data-electrical-action="rotate"]'),
      library: y("#electricalLibraryWorkflows > h2"),
      generic: y("#electricalLibraryWorkflows > .electrical-library-link"),
      manufacturer: y("#electricalLibraryWorkflows .industrial-catalog > summary"),
      faults: y("#electricalSimulationWorkflow > summary")
    };
  });
  expect(positions.search).toBeGreaterThanOrEqual(371);
  expect(positions.search).toBeLessThanOrEqual(383);
  expect(positions.palette).toBeGreaterThanOrEqual(420);
  expect(positions.palette).toBeLessThanOrEqual(437);
  expect(positions.place).toBeGreaterThanOrEqual(473);
  expect(positions.place).toBeLessThanOrEqual(490);
  expect(positions.select).toBeGreaterThanOrEqual(528);
  expect(positions.select).toBeLessThanOrEqual(545);
  expect(positions.rotate).toBeGreaterThanOrEqual(578);
  expect(positions.rotate).toBeLessThanOrEqual(595);
  expect(positions.library).toBeGreaterThanOrEqual(651);
  expect(positions.library).toBeLessThanOrEqual(663);
  expect(positions.generic).toBeGreaterThanOrEqual(674);
  expect(positions.generic).toBeLessThanOrEqual(686);
  expect(positions.manufacturer).toBeGreaterThanOrEqual(714);
  expect(positions.manufacturer).toBeLessThanOrEqual(726);
  expect(positions.faults).toBeGreaterThanOrEqual(752);
  expect(positions.faults).toBeLessThanOrEqual(764);

  await page.locator('#electricalToolboxDock [data-electrical-action="add"]').click();
  const inspectorDelete = page.locator('#inspectorContent [data-electrical-action="delete"]');
  await expect(inspectorDelete).toBeVisible();
  await inspectorDelete.click();
  await expect(page.locator("#electricalBoard [data-component-id]")).toHaveCount(0);

  await page.locator('[data-app-menu="file"]').click();
  const exampleMenuItem = page.getByRole("menuitem", { name: "Example browser", exact: true });
  await expect(exampleMenuItem).toBeVisible();
  await exampleMenuItem.click();
  await expect(page.locator("#exampleSearch")).toBeVisible();
});

test("opening an example keeps schematic component cards from overlapping", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator('[data-app-menu="file"]').click();
  await page.getByRole("menuitem", { name: "Example browser", exact: true }).click();
  const examples = page.locator("#exampleList [data-example]");
  await expect(examples.first()).toBeVisible();
  await examples.first().click();
  await page.locator("#electricalTab").click();

  const components = page.locator("#electricalBoard .electrical-component");
  await expect(components.first()).toBeVisible();
  const overlaps = await components.evaluateAll((cards) => {
    const boxes = cards.map((card) => {
      const { left, top, right, bottom } = card.getBoundingClientRect();
      return { left, top, right, bottom };
    });
    const collisions = [];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
          collisions.push([i, j]);
        }
      }
    }
    return collisions;
  });
  expect(overlaps).toEqual([]);
});

test("wide Electrical canvas actions align in the compact toolbar", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  const toolbar = page.locator("#electricalCanvasContext");
  const actions = toolbar.locator("button");
  await expect(actions).toHaveCount(10);
  const labels = await actions.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
  expect(labels).toEqual(["Select", "Connect terminals", "Validate diagram", "Simulate circuit", "Grid 20", "Fit view", "Snap on", "Zoom out", "Zoom in", "Expand"]);
  const yPositions = await actions.evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().y));
  expect(Math.max(...yPositions) - Math.min(...yPositions)).toBeLessThanOrEqual(2);
  await expect(toolbar).toHaveCSS("overflow-y", "hidden");
});

test("electrical canvas exposes the reference-aligned contextual title and actions", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const context = page.locator("#electricalCanvasContext");
  await expect(context).toBeVisible();
  const boardLabel = page.locator(".electrical-board-label");
  await expect(boardLabel).toContainText("MAIN CIRCUIT");
  await expect(boardLabel.locator(".electrical-safety-badge")).toHaveAttribute("aria-label", /Verify all device ratings/);
  const select = context.locator('[data-electrical-action="select"]');
  const wire = context.locator('[data-electrical-action="wire"]');
  await select.click();
  await expect(select).toHaveAttribute("aria-pressed", "true");
  await wire.click();
  await expect(wire).toHaveAttribute("aria-pressed", "true");
  await wire.click();
  await expect(wire).toHaveAttribute("aria-pressed", "false");
  await context.locator('[data-electrical-action="validate"]').click();
  await expect(page.locator("#inspectorContent .electrical-status")).not.toBeEmpty();
});
test("wide board Snap and Expand controls operate on persisted movement and full-screen views", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  const snap = page.locator("#electricalCanvasContext [data-electrical-action=\"snap\"]");
  await expect(snap).toHaveAttribute("title", "Snap on");
  await expect(snap).toHaveAttribute("aria-pressed", "true");
  await snap.click();
  await expect(snap).toHaveAttribute("title", "Snap off");
  await expect(snap).toHaveAttribute("aria-pressed", "false");

  await page.locator('#electricalToolboxDock [data-electrical-action="add"]').click();
  const component = page.locator("#electricalBoard [data-component-id]").first();
  const head = component.locator("[data-drag-component]");
  const start = await head.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + 12);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 13, start.y + 25);
  await page.mouse.up();
  await expect(component).toHaveCSS("left", "133px");
  await expect(component).toHaveCSS("top", "133px");

  await snap.click();
  await expect(snap).toHaveAttribute("title", "Snap on");
  const snappedHead = component.locator("[data-drag-component]");
  const snappedStart = await snappedHead.boundingBox();
  await page.mouse.move(snappedStart.x + snappedStart.width / 2, snappedStart.y + 12);
  await page.mouse.down();
  await page.mouse.move(snappedStart.x + snappedStart.width / 2 + 7, snappedStart.y + 19);
  await page.mouse.up();
  await expect(component).toHaveCSS("left", "140px");
  await expect(component).toHaveCSS("top", "140px");

  const expand = page.locator("#electricalCanvasContext [data-electrical-action=\"expand\"]");
  await expand.click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.classList.contains("editor-area") || false)).toBe(true);
  await expand.click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
});

test("wide Electrical board frame and labels align with the approved reference", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  const boxes = await page.evaluate(() => {
    const box = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { x:r.x, y:r.y, width:r.width, height:r.height, bottom:r.bottom }; };
    return {
      board:box(".electrical-board-wrap"), drawing:box(".electrical-board-scroll"),
      legend:box(".electrical-canvas-legend"), title:box(".electrical-board-label > strong"),
      caption:box(".electrical-board-label > span"), safety:box(".electrical-safety-badge")
    };
  });
  expect(boxes.drawing.x).toBeGreaterThanOrEqual(305);
  expect(boxes.drawing.x).toBeLessThanOrEqual(310);
  expect(boxes.drawing.y).toBeGreaterThanOrEqual(246);
  expect(boxes.drawing.y).toBeLessThanOrEqual(250);
  expect(boxes.caption.x).toBeGreaterThanOrEqual(330);
  expect(boxes.caption.x).toBeLessThanOrEqual(335);
  expect(boxes.caption.y).toBeGreaterThanOrEqual(268);
  expect(boxes.caption.y).toBeLessThanOrEqual(274);
  expect(boxes.safety.x).toBeGreaterThanOrEqual(480);
  expect(boxes.safety.x).toBeLessThanOrEqual(487);
  expect(boxes.legend.x).toBe(boxes.drawing.x);
  expect(boxes.legend.bottom).toBeGreaterThanOrEqual(780);
  expect(boxes.legend.bottom).toBeLessThanOrEqual(786);
});

test("electrical canvas keeps the connection legend visible beside its scrollable drawing", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const legend = page.locator(".electrical-canvas-legend");
  await expect(legend).toBeVisible();
  await expect(legend).toContainText("Terminal connection");
  await expect(legend).toContainText("Connected signal");
  await expect(page.locator(".electrical-board-scroll #electricalBoard")).toBeVisible();
  const box = await legend.boundingBox();
  const viewport = await page.locator(".electrical-board-wrap").boundingBox();
  expect(box && viewport && Math.abs(box.y + box.height - (viewport.y + viewport.height)) < 2).toBe(true);
});
test("electrical canvas view controls zoom and grid without changing component geometry", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const board = page.locator("#electricalBoard");
  await page.locator("#electricalToolboxDock [data-electrical-action=\"add\"]").click();
  const component = page.locator("#electricalBoard [data-component-id]").first();
  await expect(component).toBeVisible();
  const initialLeft = await component.getAttribute("style");
  await expect(page.locator("[data-electrical-action=\"grid\"]")).toBeVisible();
  await expect(page.locator("[data-electrical-action=\"fit-view\"]")).toBeVisible();
  await expect(page.locator("[data-electrical-zoom]")).toHaveText("100%");
  await page.locator("[data-electrical-action=\"grid\"]").click();
  await expect(board).toHaveClass(/no-grid/);
  await page.locator("[data-electrical-action=\"zoom-in\"]").click();
  await expect(page.locator("[data-electrical-zoom]")).toHaveText("110%");
  expect(await component.getAttribute("style")).toBe(initialLeft);
  await page.locator("[data-electrical-action=\"fit-view\"]").click();
  await expect(page.locator("[data-electrical-zoom]")).not.toHaveText("110%");
});

test("electrical inspector exposes live rotate, duplicate, and delete actions", async ({ page }) => {
  await page.locator("#electricalTab").click();
  await page.locator("#electricalToolboxDock [data-electrical-action=\"add\"]").click();
  const actions = page.locator("#inspectorContent .electrical-selected-actions");
  const component = page.locator("#electricalBoard [data-component-id]").first();
  await expect(actions.locator('[data-electrical-action="rotate"]')).toBeVisible();
  await expect(actions.locator('[data-electrical-action="duplicate"]')).toBeVisible();
  await expect(actions.locator('[data-electrical-action="delete"]')).toBeVisible();
  await actions.locator('[data-electrical-action="rotate"]').click();
  await expect(component).toHaveAttribute("style", /rotate\(90deg\)/);
  await actions.locator('[data-electrical-action="duplicate"]').click();
  await expect(page.locator("#electricalBoard [data-component-id]")).toHaveCount(2);
  await page.locator("#inspectorContent .electrical-selected-actions [data-electrical-action=\"delete\"]").click();
  await expect(page.locator("#electricalBoard [data-component-id]")).toHaveCount(1);
});

test("electrical duplicate placement avoids rotated component collisions", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const add=page.locator('#electricalToolboxDock [data-electrical-action="add"]');
  const rotate=page.locator('#electricalToolboxDock [data-electrical-action="rotate"]');
  const duplicate=page.locator('#electricalToolboxDock [data-electrical-action="duplicate"]');
  await add.click();
  await rotate.click();
  await duplicate.click();
  await duplicate.click();

  const boxes=await page.locator("#electricalBoard [data-component-id]").evaluateAll(nodes=>nodes.map(node=>{
    const {left,top,right,bottom}=node.getBoundingClientRect();
    return {left,top,right,bottom};
  }));
  const collisions=[];
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
    const a=boxes[i],b=boxes[j];
    if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)collisions.push([i,j]);
  }
  expect(boxes.length).toBeGreaterThanOrEqual(3);
  expect(collisions).toEqual([]);
});
test("component toolbox uses the approved placement and wire labels without losing actions", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  const toolbox = page.locator("#electricalToolboxDock");
  const place = toolbox.locator('[data-electrical-action="add"]');
  const wire = toolbox.locator('[data-electrical-action="wire"]');
  await expect(place).toContainText("Place component");
  await expect(wire).toContainText("Connect wire");
  await place.click();
  await expect(page.locator("#electricalBoard [data-component-id]")).toHaveCount(1);
  await cycleLanguage(page);
  await expect(place).toContainText("Komponente platzieren");
  await expect(wire).toContainText("Draht verbinden");
});

test("electrical validation and simulation stay in the canvas action row", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const toolbox = page.locator("#electricalToolboxDock");
  const canvasActions = page.locator("#electricalCanvasContext");
  await expect(toolbox.locator('[data-electrical-action="validate"]')).toBeHidden();
  await expect(toolbox.locator('[data-electrical-action="simulate"]')).toBeHidden();
  await expect(canvasActions.locator('[data-electrical-action="validate"]')).toBeVisible();
  await expect(canvasActions.locator('[data-electrical-action="simulate"]')).toBeVisible();
});

test("electrical inspector disclosures retain terminal details when validation rerenders", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const add = page.locator('#electricalToolboxDock [data-electrical-action="add"]');
  await add.click();
  await add.click();
  const components = page.locator("#electricalBoard [data-component-id]");
  const ids = [await components.nth(0).getAttribute("data-component-id"),await components.nth(1).getAttribute("data-component-id")];
  const terminals = await page.locator(`[data-terminal-component="${ids[0]}"]`).evaluateAll(nodes=>nodes.map(node=>node.dataset.terminal));
  await page.locator('#electricalCanvasContext [data-electrical-action="wire"]').click();
  await page.locator(`[data-terminal-component="${ids[0]}"][data-terminal="${terminals[0]}"]`).click();
  const secondTerminal = await page.locator(`[data-terminal-component="${ids[1]}"]`).first().getAttribute("data-terminal");
  await page.locator(`[data-terminal-component="${ids[1]}"][data-terminal="${secondTerminal}"]`).click();

  const connections = page.locator('#inspectorContent details[data-inspector-section="connections"]');
  const diagnostics = page.locator('#inspectorContent details[data-inspector-section="diagnostics"]');
  await expect(connections.locator("summary")).toContainText("Terminal connections");
  await expect(connections.locator("summary")).toContainText("1");
  await expect(connections).not.toHaveAttribute("open", "");
  await expect(diagnostics.locator("summary")).toContainText("Validation & diagnostics");
  await connections.locator("summary").click();
  await expect(connections.locator(".electrical-wire-row")).toHaveCount(1);
  await page.locator('#electricalCanvasContext [data-electrical-action="validate"]').click();
  await expect(connections).toHaveAttribute("open", "");
  await expect(connections.locator(".electrical-wire-row")).toHaveCount(1);
  await expect(page.locator("#inspectorContent .electrical-status")).toBeVisible();
});
test("electrical inspector identifies the selected component above its editable fields", async ({ page }) => {
  await page.locator("#electricalTab").click();
  await page.locator("#electricalToolboxDock [data-electrical-action=\"add\"]").click();
  const component = page.locator("#electricalBoard [data-component-id]").first();
  const reference = (await component.locator("[data-drag-component]").innerText()).split(" · ")[0];
  const summary = page.locator("#inspectorContent .electrical-selected-component");
  await expect(page.locator("#propertiesTab")).toHaveText("PROPERTIES");
  await expect(page.locator("#inspectorContent .electrical-inspector > h3").filter({hasText:"Properties"})).toHaveCount(0);
  await expect(summary.locator("small")).toContainText("SELECTED COMPONENT");
  await expect(summary.locator("h2")).toContainText(reference);
  await expect(summary.locator("p")).toContainText("simulation model");
  await expect(page.locator("#electricalProperties input[name=\"reference\"]")).toHaveValue(reference);
  await expect(page.locator("#electricalProperties input[name=\"label\"]")).toBeVisible();
});

test("Issues tab shows active-workspace validation and returns to properties", async ({ page }) => {
  const issuesTab = page.locator("#issuesTab");
  await issuesTab.click();
  await expect(page.locator("#issuesContent")).toBeVisible();
  await expect(page.locator("#issuesContent")).toContainText("Active workspace issues");
  await expect(page.locator(".issues-count")).toHaveText(/\d+/);
  await page.locator("#electricalTab").click();
  await issuesTab.click();
  await expect(page.locator("#issuesContent")).toContainText("Active workspace issues");
  await expect(page.locator(".issues-count")).toHaveText(/\d+/);
  await page.locator("#propertiesTab").click();
  await expect(page.locator("#issuesContent")).toBeHidden();
  await expect(page.locator("#inspectorContent")).toBeVisible();
});
test("electrical component search filters models and restores the full picker", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const search = page.locator("#electricalToolboxDock #electricalModelSearch");
  const palette = page.locator("#electricalToolboxDock #electricalPalette");
  const add = page.locator('#electricalToolboxDock [data-electrical-action="add"]');
  await expect(search).toBeVisible();
  const allModels = await palette.locator("option").count();
  await search.fill("motor");
  await expect(palette.locator("option")).toHaveCount(5);
  await expect(palette.locator("option").filter({ hasText: "WEG W22 IE2 motor" })).toHaveCount(1);
  await expect(add).toBeEnabled();
  await search.fill("no-model-can-match-this");
  await expect(palette.locator("option")).toHaveCount(1);
  await expect(palette.locator("option")).toHaveText("No matching model.");
  await expect(palette).toBeDisabled();
  await expect(add).toBeDisabled();
  await search.fill("");
  await expect(palette.locator("option")).toHaveCount(allModels);
  await expect(add).toBeEnabled();
});


test("redesigned toolboxes still execute core LD, FBD, ST, SFC, HMI, and electrical actions", async ({ page }) => {
  const ladderRungs = page.locator("#ladderCanvas .rung");
  const initialRungs = await ladderRungs.count();
  await page.locator('[data-action="add-rung"]').first().click();
  await expect(ladderRungs).toHaveCount(initialRungs + 1);

  await page.locator("#editorMode").selectOption("FBD");
  const blocks = page.locator("#fbdBlocks .fbd-block");
  const initialBlocks = await blocks.count();
  await page.locator('#editorToolboxDock [data-editor-toolbox-mode="FBD"] [data-action="add-fbd-block"]').click();
  await expect(blocks).toHaveCount(initialBlocks + 1);

  await page.locator("#editorMode").selectOption("ST");
  await page.locator('#editorToolboxDock [data-editor-toolbox-mode="ST"] [data-action="compile-st"]').click();
  await expect(page.locator("#compileState")).toHaveText("Compiled");

  await page.locator("#editorMode").selectOption("SFC");
  const steps = page.locator("#sfcChart .sfc-step");
  const initialSteps = await steps.count();
  await page.locator('#editorToolboxDock [data-editor-toolbox-mode="SFC"] [data-action="add-sfc-step"]').click();
  await expect(steps).toHaveCount(initialSteps + 1);

  await page.locator('[data-action="tags"]').click();
  await page.locator("#addTag").click();
  await page.locator('[data-tag-index="0"][data-field="role"]').selectOption("input");
  await page.locator("#modal .modal-close").click();
  await page.locator("#hmiTab").click();
  const widgets = page.locator("#hmiBoard [data-hmi-widget]");
  const initialWidgets = await widgets.count();
  await page.locator('#editorToolboxDock [data-editor-toolbox-mode="HMI"] [data-hmi-add="switch"]').click();
  await expect(widgets).toHaveCount(initialWidgets + 1);

  await page.locator("#electricalTab").click();
  const components = page.locator("#electricalBoard [data-component-id]");
  await page.locator('#electricalToolboxDock [data-electrical-action="add"]').click();
  await expect(components).toHaveCount(1);
  await page.locator('#electricalToolboxDock [data-electrical-action="rotate"]').click();
  await page.locator('#electricalToolboxDock [data-electrical-action="duplicate"]').click();
  await expect(components).toHaveCount(2);
  const firstPair = await components.evaluateAll(nodes => nodes.map(node => { const {left,top,right,bottom}=node.getBoundingClientRect();return {left,top,right,bottom}; }));
  expect(firstPair[0].right + 8 <= firstPair[1].left || firstPair[1].right + 8 <= firstPair[0].left || firstPair[0].bottom + 8 <= firstPair[1].top || firstPair[1].bottom + 8 <= firstPair[0].top).toBe(true);
  await page.locator('#electricalToolboxDock [data-electrical-action="delete"]').click();
  await expect(components).toHaveCount(1);
  await page.locator('#electricalCanvasContext [data-electrical-action="simulate"]').click();
  await expect(page.locator("#inspectorContent .electrical-status")).not.toBeEmpty();
});


test("selected schematic components can be replaced while compatible routed wires stay connected", async ({ page }) => {
  await page.setViewportSize({width:1900,height:1100});
  await page.locator("#electricalTab").click();
  const palette=page.locator("#electricalToolboxDock #electricalPalette"),add=page.locator('#electricalToolboxDock [data-electrical-action="add"]'),components=page.locator("#electricalBoard [data-component-id]");
  await add.click();await palette.selectOption("pilotLamp");await add.click();await expect(components).toHaveCount(2);
  const ids=await components.evaluateAll(nodes=>nodes.map(node=>node.dataset.componentId)),wireTool=page.locator('#electricalToolboxDock [data-electrical-action="wire"]');
  await wireTool.click();await page.locator(`[data-terminal-component="${ids[0]}"][data-terminal="+"]`).click();await page.locator("#electricalBoard").click({position:{x:500,y:300}});await page.locator(`[data-terminal-component="${ids[1]}"][data-terminal="X1"]`).click();
  const wire=page.locator("#electricalBoard .electrical-wire");await expect(wire).toHaveCount(1);const wireId=await wire.getAttribute("data-wire-id");await expect(wire).toHaveAttribute("d",/L500 300/u);
  await palette.selectOption("siemens3SU1152AmberIndicator");await page.locator('#inspectorContent [data-electrical-action="replace"]').click();
  await expect(page.locator(`[data-component-id="${ids[1]}"]`)).toHaveAttribute("data-component-type","siemens3SU1152AmberIndicator");await expect(page.locator("#electricalBoard .electrical-component")).toHaveCount(2);await expect(wire).toHaveAttribute("data-wire-id",wireId);await expect(wire).toHaveAttribute("d",/L500 300/u);
});
test("electrical wire endpoints track rotation and keyboard movement while selection and focus persist", async ({ page }) => {
  await page.locator("#electricalTab").click();
  const add = page.locator('#electricalToolboxDock [data-electrical-action="add"]');
  await add.click();
  await add.click();
  const components = page.locator("#electricalBoard [data-component-id]");
  await expect(components).toHaveCount(2);
  const componentIds = await components.evaluateAll(nodes => nodes.map(node => node.dataset.componentId));
  const terminals = await Promise.all(componentIds.map(id => page.locator('[data-terminal-component="' + id + '"]').first().getAttribute("data-terminal")));

  const wireTool = page.locator('#electricalToolboxDock [data-electrical-action="wire"]');
  const selectTool = page.locator('#electricalToolboxDock [data-electrical-action="select"]');
  await expect(selectTool).toHaveAttribute("aria-pressed", "true");
  await wireTool.click();
  await expect(wireTool).toHaveAttribute("aria-pressed", "true");
  await selectTool.click();
  await expect(wireTool).toHaveAttribute("aria-pressed", "false");
  await wireTool.click();
  await page.locator('[data-terminal-component="' + componentIds[0] + '"][data-terminal="' + terminals[0] + '"]').click();
  await selectTool.click();
  await page.locator('[data-terminal-component="' + componentIds[1] + '"][data-terminal="' + terminals[1] + '"]').click();
  await expect(page.locator("#electricalBoard .electrical-wire")).toHaveCount(0);
  await wireTool.click();
  await page.locator('[data-terminal-component="' + componentIds[0] + '"][data-terminal="' + terminals[0] + '"]').click();
  await page.locator('[data-terminal-component="' + componentIds[1] + '"][data-terminal="' + terminals[1] + '"]').click();
  const wire = page.locator("#electricalBoard .electrical-wire");
  await expect(wire).toHaveCount(1);
  const wireId = await wire.getAttribute("data-wire-id");

  const assertWireMatchesPorts = async () => {
    const result = await page.evaluate(({ componentIds, terminals }) => {
      const board=document.querySelector("#electricalBoard"), boardRect=board.getBoundingClientRect(), path=board.querySelector(".electrical-wire"), match=path?.getAttribute("d")?.match(/^M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)V(-?[\d.]+)H(-?[\d.]+)$/);
      const ports=componentIds.map((id,index)=>{const button=[...board.querySelectorAll("[data-terminal-component]")].find(item=>item.dataset.terminalComponent===id&&item.dataset.terminal===terminals[index]),rect=button.getBoundingClientRect();return [rect.left+rect.width/2-boardRect.left,rect.top+rect.height/2-boardRect.top];});
      return { match:Boolean(match), pathEnds:match?[[Number(match[1]),Number(match[2])],[Number(match[5]),Number(match[4])]]:[], ports };
    }, { componentIds, terminals });
    expect(result.match).toBe(true);
    for (let index=0;index<2;index++) {
      expect(Math.abs(result.pathEnds[index][0]-result.ports[index][0])).toBeLessThan(1.5);
      expect(Math.abs(result.pathEnds[index][1]-result.ports[index][1])).toBeLessThan(1.5);
    }
  };
  await assertWireMatchesPorts();

  const originalPath = await wire.getAttribute("d");
  await components.nth(1).click();
  await page.locator('#electricalToolboxDock [data-electrical-action="rotate"]').click();
  await expect(wire).not.toHaveAttribute("d", originalPath);
  await assertWireMatchesPorts();

  const movedPath = await wire.getAttribute("d");
  const head = page.locator('[data-drag-component="' + componentIds[1] + '"]');
  await head.focus();
  await head.press("ArrowRight");
  await expect(wire).not.toHaveAttribute("d", movedPath);
  await expect(page.locator('[data-drag-component="' + componentIds[1] + '"]')).toBeFocused();
  await expect(wire).toHaveAttribute("data-wire-id", wireId);
  await assertWireMatchesPorts();
});

test("electrical canvas draws, edits, pauses, and resumes routed wires", async ({ page }) => {
  await page.setViewportSize({width:1900,height:1100});
  await page.locator("#electricalTab").click();
  const add=page.locator('#electricalToolboxDock [data-electrical-action="add"]'),components=page.locator("#electricalBoard [data-component-id]");await add.click();await expect(components).toHaveCount(1);await add.click();await expect(components).toHaveCount(2);
  const ids=await components.evaluateAll(nodes=>nodes.map(node=>node.dataset.componentId));
  const pins=await Promise.all(ids.map(async id=>page.locator(`[data-terminal-component="${id}"]`).evaluateAll(nodes=>nodes.map(node=>node.dataset.terminal))));
  const wireTool=page.locator('#electricalToolboxDock [data-electrical-action="wire"]'),board=page.locator("#electricalBoard");
  await wireTool.click();await page.locator(`[data-terminal-component="${ids[0]}"][data-terminal="${pins[0][0]}"]`).click();
  await board.click({position:{x:500,y:300}});await expect(page.locator("#inspectorContent .electrical-status")).toContainText("Route point 1 added");await page.locator(`[data-terminal-component="${ids[1]}"][data-terminal="${pins[1][0]}"]`).click();console.log("rewire-stage: initial cable drawn");
  const wire=page.locator("#electricalBoard .electrical-wire").first();await expect(wire).toHaveAttribute("d",/L500 300/);console.log("rewire-stage: route exists");
  const wireId=await wire.getAttribute("data-wire-id"),boardBox=await board.boundingBox();await page.mouse.click(boardBox.x+400,boardBox.y+226);
  const bend=page.locator(`#electricalBoard [data-wire-waypoint="${wireId}"]`),box=await bend.boundingBox();expect(box).not.toBeNull();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+40,box.y+box.height/2+40);await page.mouse.up();await expect(wire).toHaveAttribute("d",/L540 340/);
  await bend.focus();await page.keyboard.press("Delete");await expect(wire).not.toHaveAttribute("d",/L540 340/);

  await wireTool.click();await page.locator(`[data-terminal-component="${ids[0]}"][data-terminal="${pins[0][1]}"]`).click();await board.click({position:{x:600,y:250}});await wireTool.click();
  const draft=page.locator("#electricalBoard .electrical-wire-draft-end");await expect(draft).toHaveCount(1);await expect(wireTool).toHaveText("Connect wire");
  await wireTool.click();await draft.click();await page.locator(`[data-terminal-component="${ids[1]}"][data-terminal="${pins[1][1]}"]`).click();
  await expect(page.locator("#electricalBoard .electrical-wire-draft-end")).toHaveCount(0);await expect(page.locator("#electricalBoard .electrical-wire")).toHaveCount(2);
  const firstBox=await components.nth(0).boundingBox(),secondHead=page.locator(`[data-drag-component="${ids[1]}"]`),secondHeadBox=await secondHead.boundingBox();
  await page.mouse.move(secondHeadBox.x+secondHeadBox.width/2,secondHeadBox.y+secondHeadBox.height/2);await page.mouse.down();await page.mouse.move(firstBox.x+60,firstBox.y+16);await page.mouse.up();
  const afterDrag=await components.evaluateAll(nodes=>nodes.map(node=>{const {left,top,right,bottom}=node.getBoundingClientRect();return {left,top,right,bottom};}));
  expect(afterDrag[1].right+8<=afterDrag[0].left||afterDrag[0].right+8<=afterDrag[1].left||afterDrag[1].bottom+8<=afterDrag[0].top||afterDrag[0].bottom+8<=afterDrag[1].top).toBe(true);
});


test("side-panel layout changes do not mutate saved PLC or electrical project data", async ({ page }) => {
  const readPersistedState = () => page.evaluate(() => new Promise((resolve, reject) => {
    const guestDrafts=Object.keys(sessionStorage).filter(key=>key.startsWith("adigunsps-guest-draft-")).map(key=>[key,sessionStorage.getItem(key)]);
    const request=indexedDB.open("adigunsps-local");
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const database=request.result;
      if(!database.objectStoreNames.contains("projects")){database.close();resolve({guestDrafts,projects:[]});return;}
      const transaction=database.transaction("projects","readonly"), query=transaction.objectStore("projects").getAll();
      query.onsuccess=()=>{database.close();resolve({guestDrafts,projects:query.result});};
      query.onerror=()=>{database.close();reject(query.error);};
    };
  }));
  const before = await readPersistedState();
  expect(before.guestDrafts.length + before.projects.length).toBeGreaterThan(0);

  await page.locator("#panelLayoutButton").click();
  await expect(page.locator("#panelLeftToggle")).toBeChecked();
  await expect(page.locator("#panelRightToggle")).toBeChecked();
  await page.locator("#panelLeftToggle").uncheck();
  await page.locator("#panelRightToggle").uncheck();
  await page.locator("#modal .modal-close").click();
  await expect(page.locator(".workspace")).toHaveClass(/panels-left-hidden/);
  await expect(page.locator(".workspace")).toHaveClass(/panels-right-hidden/);

  await expect(await readPersistedState()).toEqual(before);
});

test("workspace layout remains bounded across all locales, themes, and scaled text", async ({ page }) => {
  await page.locator("#electricalTab").click();
  await page.evaluate(() => { document.documentElement.style.fontSize = "125%"; });

  for (const locale of ["en", "de", "yo", "pcm"]) {
    for (let attempt = 0; attempt < 4 && (await page.locator("#languageButton").textContent())?.toLowerCase() !== locale; attempt++) {
      await cycleLanguage(page);
    }
    await expect(page.locator("#languageButton")).toHaveText(locale.toUpperCase());

    for (const theme of ["dark", "light"]) {
      await page.locator("#settingsButton").click();
      await page.locator("#prefTheme").selectOption(theme);
      await page.locator("#settingsDone").click();
      await expect(page.locator("body")).toHaveAttribute("data-theme", theme);
      await page.locator("#projectTitle").evaluate((element) => { element.textContent = "Workspace acceptance project — ".padEnd(64, "W"); });

      for (const viewport of [{ width: 1894, height: 704, minBoardHeight: 300 }, { width: 390, height: 844, minBoardHeight: 200 }]) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        if (viewport.width <= 760) {
          await page.locator("#panelLayoutButton").click();
          await expect(page.locator("#mobileProjectPanel")).toBeVisible();
          await page.locator("#mobileProjectPanel").click();
          await expect(page.locator(".workspace")).toHaveClass(/mobile-left-open/);
        }

        const metrics = await page.evaluate(() => {
          const board = document.querySelector(".electrical-board-wrap");
          const emptyHint = document.querySelector(".electrical-empty");
          const boardRect = board?.getBoundingClientRect();
          const hintRect = emptyHint?.getBoundingClientRect();
          const emptyHintWithinViewport = !emptyHint || emptyHint.classList.contains("hidden") || Boolean(boardRect && hintRect && hintRect.left >= boardRect.left && hintRect.right <= boardRect.right && hintRect.top >= boardRect.top && hintRect.bottom <= boardRect.bottom);
          const buttons = ["#projectMenu", "#accountButton", "#languageButton", "#settingsButton", "#paletteButton", "#helpButton"]
            .map((selector) => document.querySelector(selector))
            .filter((element) => element && element.getClientRects().length)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { selector:element.id, left:rect.left, right:rect.right, top:rect.top, bottom:rect.bottom };
            });
          const overlaps = [];
          for (let i = 0; i < buttons.length; i++) for (let j = i + 1; j < buttons.length; j++) {
            const a = buttons[i], b = buttons[j];
            if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps.push([a.selector, b.selector]);
          }
          const emptyHintGeometry = { hint:hintRect && {left:hintRect.left,right:hintRect.right,top:hintRect.top,bottom:hintRect.bottom}, viewport:boardRect && {left:boardRect.left,right:boardRect.right,top:boardRect.top,bottom:boardRect.bottom}, className:emptyHint?.className };
          const overflowNodes = [...document.querySelectorAll("body *")].map((element) => { const rect = element.getBoundingClientRect(); return { tag:element.tagName, id:element.id, className:String(element.className || ""), right:Math.round(rect.right), width:Math.round(rect.width) }; }).filter((element) => element.width > 0 && element.right > innerWidth + 1).slice(0, 12);
          return { scrollWidth:document.documentElement.scrollWidth, boardHeight:boardRect?.height ?? 0, emptyHintWithinViewport, emptyHintGeometry, buttons, overlaps, overflowNodes };
        });

        expect(metrics.scrollWidth, `${locale}/${theme} at ${viewport.width}px has no horizontal page overflow; elements beyond edge: ${JSON.stringify(metrics.overflowNodes)}`).toBeLessThanOrEqual(viewport.width);
        expect(metrics.boardHeight, `${locale}/${theme} at ${viewport.width}px retains useful canvas height`).toBeGreaterThanOrEqual(viewport.minBoardHeight);
        expect(metrics.emptyHintWithinViewport, `${locale}/${theme} at ${viewport.width}px keeps empty-canvas guidance in view: ${JSON.stringify(metrics.emptyHintGeometry)}`).toBe(true);
        expect(metrics.buttons.every((button) => button.left >= 0 && button.right <= viewport.width), `${locale}/${theme} header controls stay within viewport`).toBe(true);
        expect(metrics.overlaps, `${locale}/${theme} header controls do not overlap`).toEqual([]);
        if (viewport.width <= 760) await page.locator('[data-mobile-drawer-close="left"]').click();
      }
    }
  }
});


test("all application menus stay reachable within desktop viewports", async ({ page }) => {
  const expectedKeys = ["file","edit","view","project","plc","ioTags","programs","online","debug","tools","window","settings","help"];
  for (const viewport of [{ width:1894, height:850 }, { width:1366, height:768 }]) {
    await page.setViewportSize(viewport);
    const actualKeys = await page.locator(".app-menus [data-app-menu]").evaluateAll((buttons) => buttons.map((button) => button.dataset.appMenu));
    expect(actualKeys).toEqual(expectedKeys);

    for (const key of expectedKeys) {
      await page.locator(`[data-app-menu="${key}"]`).click();
      const menu = page.locator("#contextMenu");
      await expect(menu, `${key} menu opens at ${viewport.width}px`).toBeVisible();
      if (key === "help") {
        await expect(menu.locator(".help-guide-content")).toBeVisible();
      } else {
        await expect(menu.getByRole("menuitem").first()).toBeVisible();
        expect(await menu.getByRole("menuitem").count(), `${key} menu has actions`).toBeGreaterThan(0);
      }
      const bounds = await menu.boundingBox();
      expect(bounds, `${key} menu has visible geometry`).not.toBeNull();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    }
  }
});

test("canvas toolbars stay compact, accessible, single-line, and operational", async ({ page }) => {
  await page.setViewportSize({ width:1894, height:850 });
  const menuBefore = await page.locator(".app-menus").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)};
  });
  await page.locator("#electricalTab").click();
  const electrical = page.locator("#electricalCanvasContext");
  await expect(electrical).toBeVisible();
  await expect(electrical.locator(".electrical-canvas-heading")).toHaveCount(0);
  const electricalMetrics = await electrical.evaluate((row) => {
    const buttons = [...row.querySelectorAll("button")];
    const boxes = buttons.map((button) => button.getBoundingClientRect());
    return {
      buttonCount:buttons.length,
      unnamed:buttons.filter((button) => !button.title || !button.getAttribute("aria-label")).length,
      ySpread:boxes.length ? Math.max(...boxes.map((box) => box.y)) - Math.min(...boxes.map((box) => box.y)) : Infinity,
      scrollWidth:row.scrollWidth,
      clientWidth:row.clientWidth,
      height:row.getBoundingClientRect().height
    };
  });
  expect(electricalMetrics.buttonCount).toBe(10);
  expect(electricalMetrics.unnamed).toBe(0);
  expect(electricalMetrics.ySpread).toBeLessThanOrEqual(2);
  expect(electricalMetrics.scrollWidth).toBeLessThanOrEqual(electricalMetrics.clientWidth + 1);
  expect(electricalMetrics.height).toBeLessThanOrEqual(40);
  const grid = page.locator('#electricalCanvasContext [data-electrical-action="grid"]');
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "false");
  await grid.click();
  await expect(grid).toHaveAttribute("aria-pressed", "true");

  await page.locator("#hmiTab").click();
  const hmi = page.locator("#hmiPane .hmi-canvas-toolbar");
  await expect(hmi).toBeVisible();
  const hmiMetrics = await hmi.evaluate((row) => {
    const buttons = [...row.querySelectorAll("button")];
    const boxes = buttons.map((button) => button.getBoundingClientRect());
    return {
      buttonCount:buttons.length,
      unnamed:buttons.filter((button) => !button.title || !button.getAttribute("aria-label")).length,
      ySpread:boxes.length ? Math.max(...boxes.map((box) => box.y)) - Math.min(...boxes.map((box) => box.y)) : Infinity,
      scrollWidth:row.scrollWidth,
      clientWidth:row.clientWidth,
      height:row.getBoundingClientRect().height
    };
  });
  expect(hmiMetrics.buttonCount).toBe(8);
  expect(hmiMetrics.unnamed).toBe(0);
  expect(hmiMetrics.ySpread).toBeLessThanOrEqual(2);
  expect(hmiMetrics.scrollWidth).toBeLessThanOrEqual(hmiMetrics.clientWidth + 1);
  expect(hmiMetrics.height).toBeLessThanOrEqual(40);
  expect(await page.locator(".app-menus").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {x:Math.round(rect.x),y:Math.round(rect.y),width:Math.round(rect.width),height:Math.round(rect.height)};
  })).toEqual(menuBefore);
  if (process.env.ADIGUNSP_HMI_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.ADIGUNSP_HMI_SCREENSHOT_PATH });
  }

  await page.once("dialog", (dialog) => dialog.accept("Secondary HMI"));
  await page.locator("#addHmiScreen").click();
  await expect(page.locator("#hmiScreenSelect option")).toHaveCount(2);
  await page.once("dialog", (dialog) => dialog.accept());
  await page.locator("#deleteHmiScreen").click();
  await expect(page.locator("#hmiScreenSelect option")).toHaveCount(1);
  const snap = page.locator("#snapToggle");
  await snap.uncheck();
  await expect(snap).not.toBeChecked();
  await snap.check();
  await expect(snap).toBeChecked();
  await page.locator('[data-action="tags"]').click();
  await page.locator("#addTag").click();
  await page.locator('[data-tag-index="0"][data-field="role"]').selectOption("input");
  await page.locator("#addTag").click();
  await page.locator('[data-tag-index="1"][data-field="role"]').selectOption("output");
  await page.locator("#modal .modal-close").click();
  await page.locator("#hmiTab").click();
  const widgets = page.locator("#hmiBoard [data-hmi-widget]");
  for (const type of ["switch", "lamp", "value", "trend"]) {
    const count = await widgets.count();
    await page.locator(`#editorToolboxDock [data-editor-toolbox-mode="HMI"] [data-hmi-add="${type}"]`).click();
    await expect(widgets).toHaveCount(count + 1);
  }
  await page.locator("#processesButton").click();
  await expect(page.locator("#modal")).toBeVisible();
});

test("1894px electrical workspace geometry matches the approved reference", async ({ page }) => {
  await page.setViewportSize({ width:1894, height:850 });
  await page.locator("#electricalTab").click();
  const layout = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { x:Math.round(rect.x), y:Math.round(rect.y), width:Math.round(rect.width), height:Math.round(rect.height) };
    };
    return {
      topbar:box(".topbar"),
      menu:box(".app-menus"),
      tabs:box(".editor-tabs"),
      left:box(".left-sidebar"),
      right:box(".right-sidebar"),
      board:box(".electrical-board-wrap"),
      status:box(".statusbar"),
    };
  });
  expect(layout).toEqual({
    topbar:{x:0,y:0,width:1894,height:50},
    menu:{x:0,y:50,width:1894,height:39},
    tabs:{x:270,y:89,width:1285,height:52},
    left:{x:0,y:89,width:270,height:726},
    right:{x:1555,y:89,width:339,height:726},
    board:{x:284,y:189,width:1260,height:617},
    status:{x:0,y:815,width:1894,height:35},
  });
  if (process.env.ADIGUNSP_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.ADIGUNSP_SCREENSHOT_PATH });
  }
});

test("Snap remains visible and operable in compact desktop view toolbars", async ({ page }) => {
  for (const viewport of [{ width:1366, height:768 }, { width:1280, height:800 }]) {
    await page.setViewportSize(viewport);
    await page.locator("#electricalTab").click();
    const snap = page.locator("#electricalCanvasContext [data-electrical-action=\"snap\"]");
    await expect(snap, `Snap control is visible at ${viewport.width}px`).toBeVisible();
    await expect(snap).toHaveAttribute("aria-pressed", "true");
    await snap.click();
    await expect(snap).toHaveAttribute("aria-pressed", "false");
    await expect(snap).toHaveAttribute("title", "Snap off");
    await snap.click();
    await expect(snap).toHaveAttribute("aria-pressed", "true");
    await expect(snap).toHaveAttribute("title", "Snap on");
  }
});


test("electrical wire endpoints can be reconnected without losing route bends", async ({ page }) => {
  await page.setViewportSize({width:1900,height:1100});
  await page.locator("#electricalTab").click();
  const palette=page.locator("#electricalToolboxDock #electricalPalette"),add=page.locator('#electricalToolboxDock [data-electrical-action="add"]'),components=page.locator("#electricalBoard [data-component-id]");
  await palette.selectOption("supply24vdc");await add.click();await add.click();await add.click();await expect(components).toHaveCount(3);
  const ids=await components.evaluateAll(nodes=>nodes.map(node=>node.dataset.componentId)),pins=await Promise.all(ids.map(async id=>page.locator(`[data-terminal-component="${id}"]`).evaluateAll(nodes=>nodes.map(node=>node.dataset.terminal))));
  const wireTool=page.locator('#electricalToolboxDock [data-electrical-action="wire"]'),board=page.locator("#electricalBoard");
  await wireTool.click();await page.locator(`[data-terminal-component="${ids[0]}"][data-terminal="${pins[0][0]}"]`).click();await board.click({position:{x:500,y:300}});await page.locator(`[data-terminal-component="${ids[1]}"][data-terminal="${pins[1][0]}"]`).click();
  const wire=page.locator("#electricalBoard .electrical-wire").first(),wireId=await wire.getAttribute("data-wire-id");await expect(wire).toHaveAttribute("d",/L500 300/);
  const connections=page.locator('#inspectorContent details[data-inspector-section="connections"]');
  await connections.locator("summary").click();
  await expect(connections.locator(".electrical-wire-row")).toHaveCount(1);
  await page.locator(`#inspectorContent [data-select-wire="${wireId}"]`).click();
  await page.locator('#inspectorContent [data-electrical-action="rewire-from"]').click();
  await page.locator(`[data-terminal-component="${ids[2]}"][data-terminal="${pins[2][0]}"]`).click();
  await expect(wire).toHaveAttribute("data-wire-id",wireId);await expect(wire).toHaveAttribute("d",/L500 300/);
  await expect(connections.locator(".electrical-wire-row").first()).toContainText("PS3");
});

test("electrical component replacement keeps compatible wires and rejects incompatible terminals", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  await page.locator("#electricalTab").click();
  const palette = page.locator("#electricalToolboxDock #electricalPalette");
  const add = page.locator('#electricalToolboxDock [data-electrical-action="add"]');
  await palette.selectOption("fuse");
  await add.click();
  const components = page.locator("#electricalBoard [data-component-id]");
  const fuseId = await components.nth(0).getAttribute("data-component-id");
  await palette.selectOption("terminal");
  await add.click();
  const terminalId = await components.nth(1).getAttribute("data-component-id");
  const wireTool = page.locator('#electricalToolboxDock [data-electrical-action="wire"]');
  await wireTool.click();
  await page.locator(`[data-terminal-component="${fuseId}"][data-terminal="2"]`).click();
  await page.locator(`[data-terminal-component="${terminalId}"][data-terminal="1"]`).click();
  const wire = page.locator("#electricalBoard .electrical-wire").first();
  const wireId = await wire.getAttribute("data-wire-id");
  const route = await wire.getAttribute("d");
  await page.locator("#electricalSelection").selectOption(fuseId);
  const replace = page.getByRole("button", { name: "Replace component", exact: true });
  await expect(replace).toBeVisible();
  await palette.selectOption("pilotLamp");
  await replace.click();
  await expect(page.locator("#electricalBoard [data-component-id=\"" + fuseId + "\"]")).toHaveAttribute("data-component-type", "fuse");
  await expect(page.locator("#inspectorContent .electrical-status")).toContainText("Disconnect or rewire 2");
  await palette.selectOption("terminal");
  await replace.click();
  await expect(page.locator("#electricalBoard [data-component-id=\"" + fuseId + "\"]")).toHaveAttribute("data-component-type", "terminal");
  await expect(page.locator("#electricalBoard .electrical-wire").first()).toHaveAttribute("data-wire-id", wireId);
  await expect(page.locator("#electricalBoard .electrical-wire").first()).toHaveAttribute("d", route);
  const replacementReference = (await page.locator("#inspectorContent .electrical-selected-component h2").innerText()).split(" · ")[0];
  await expect(page.locator("#inspectorContent .electrical-wire-row").first()).toContainText(`${replacementReference}.2`);
});

test("imported overlapping schematic components can be dragged clear without losing wires", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  const project = {
    name: "Legacy overlap recovery fixture",
    rungs: [],
    tags: [],
    io: { inputs: [], outputs: [] },
    initialState: {},
    electrical: {
      components: [
        { id: "moved", type: "pilotLamp", reference: "H1", label: "Moved lamp", x: 200, y: 200, rotation: 0, terminals: ["X1", "X2"] },
        { id: "ahead", type: "pilotLamp", reference: "H2", label: "Obstacle ahead", x: 280, y: 260, rotation: 0, terminals: ["X1", "X2"] },
        { id: "behind", type: "pilotLamp", reference: "H3", label: "Obstacle behind", x: 140, y: 200, rotation: 0, terminals: ["X1", "X2"] }
      ],
      wires: [{ id: "legacy-wire", from: { componentId: "moved", terminal: "X1" }, to: { componentId: "ahead", terminal: "X1" }, waypoints: [{ x: 240, y: 400 }] }],
      inputStates: {}
    }
  };
  await page.locator("#fileInput").setInputFiles({ name: "legacy-overlap.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(project)) });
  await page.locator("#electricalTab").click();
  const component = page.locator('#electricalBoard [data-component-id="moved"]');
  const wire = page.locator('#electricalBoard [data-wire-id="legacy-wire"]');
  await expect(component).toBeVisible();
  await expect(wire).toHaveAttribute("d", /L240 400/);
  const symbol = component.locator(".electrical-symbol");
  const start = await symbol.boundingBox();
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 420, start.y + start.height / 2);
  await page.mouse.up();
  const boxes = await page.locator("#electricalBoard [data-component-id]").evaluateAll(nodes => nodes.map(node => { const { left, top, right, bottom } = node.getBoundingClientRect(); return { left, top, right, bottom }; }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    expect(a.right + 8 <= b.left || b.right + 8 <= a.left || a.bottom + 8 <= b.top || b.bottom + 8 <= a.top).toBe(true);
  }
  await expect(component).toHaveAttribute("data-component-id", "moved");
  await expect(wire).toHaveAttribute("data-wire-id", "legacy-wire");
  await expect(wire).toHaveAttribute("d", /L240 400/);
});

test("saved projects repair overlapping schematic components when reopened", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  const name="Saved overlap recovery fixture", project={
    id:"saved-overlap-"+randomUUID(),name,language:"en",updatedAt:Date.now(),tags:[],io:{inputs:[],outputs:[]},initialState:{},rungs:[],
    electrical:{
      components:[
        {id:"saved-s1",type:"pushbuttonNO",reference:"S1",label:"Start",x:300,y:300,rotation:0,terminals:["13","14"]},
        {id:"saved-h1",type:"pilotLamp",reference:"H1",label:"Run lamp",x:320,y:320,rotation:0,terminals:["X1","X2"]}
      ],
      wires:[{id:"saved-wire",from:{componentId:"saved-s1",terminal:"14"},to:{componentId:"saved-h1",terminal:"X1"},waypoints:[{x:560,y:500}]}],
      inputStates:{}
    }
  };
  await page.evaluate((saved)=>new Promise((resolve,reject)=>{
    const request=indexedDB.open("adigunsps-local",1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const database=request.result,transaction=database.transaction("projects","readwrite");
      transaction.objectStore("projects").put(saved);
      transaction.oncomplete=()=>{database.close();resolve(true);};
      transaction.onerror=()=>{database.close();reject(transaction.error);};
    };
  }),project);
  await page.keyboard.press("Control+k");
  await page.locator("#paletteSearch").fill("Saved overlap recovery fixture");
  await page.locator("#paletteResults .palette-command").filter({hasText:name}).click();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator("#electricalTab").click();

  const first=page.locator('#electricalBoard [data-component-id="saved-s1"]');
  const second=page.locator('#electricalBoard [data-component-id="saved-h1"]');
  const wire=page.locator('#electricalBoard [data-wire-id="saved-wire"]');
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect(wire).toHaveAttribute("d",/L560 500/);
  const a=await first.boundingBox(),b=await second.boundingBox();
  expect(a.x+a.width+12<=b.x||b.x+b.width+12<=a.x||a.y+a.height+12<=b.y||b.y+b.height+12<=a.y,"saved project components open without overlapping").toBe(true);
  const persisted=await page.evaluate((id)=>new Promise((resolve,reject)=>{
    const request=indexedDB.open("adigunsps-local",1);
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const database=request.result,transaction=database.transaction("projects","readonly"),query=transaction.objectStore("projects").get(id);
      query.onsuccess=()=>{database.close();resolve(query.result);};
      query.onerror=()=>{database.close();reject(query.error);};
    };
  }),project.id);
  expect(persisted.electrical.components.find((item)=>item.id==="saved-h1").x).not.toBe(320);
  expect(persisted.electrical.wires[0]).toEqual(project.electrical.wires[0]);
});

test("real multi-pin schematic models recover from example-style overlap without changing wires", async ({ page }) => {
  await page.setViewportSize({ width: 1894, height: 850 });
  const cpuTerminals=["X80-1","X80-2","X80-4","X80-5","X80-6",...Array.from({length:10},(_,i)=>`X10-${i+1}`),...Array.from({length:8},(_,i)=>`X11-${i+1}`)];
  const project = {
    name: "Imported pump schematic overlap fixture",
    rungs: [], tags: [], io: { inputs: [], outputs: [] }, initialState: {},
    electrical: {
      components: [
        { id:"ps1", type:"sitopPSU100C", reference:"PS1", label:"SITOP PSU100C", x:120, y:80, rotation:0, terminals:["L","N","PE","+","−A","−B"] },
        { id:"xr1", type:"phoenixPT25FeedThrough", reference:"XR1", label:"PT 2,5 feed-through", x:300, y:80, rotation:0, terminals:["1","2"] },
        { id:"plc1", type:"siemensS71212CG2", reference:"PLC1", label:"CPU 1212C G2", x:460, y:80, rotation:0, terminals:cpuTerminals },
        { id:"xr2", type:"phoenixPT25FeedThrough", reference:"XR2", label:"PT 2,5 feed-through", x:800, y:80, rotation:0, terminals:["1","2"] },
        { id:"pe1", type:"phoenixPT25PE", reference:"PE1", label:"PT 2,5-PE", x:480, y:210, rotation:0, terminals:["1","2"] },
        { id:"s1", type:"siemens3SU1400NOContact", reference:"S1", label:"3SU1 NO contact", x:120, y:360, rotation:0, terminals:["3","4"] },
        { id:"s2", type:"siemens3SU1400NOContact", reference:"S2", label:"3SU1 NO contact", x:120, y:520, rotation:0, terminals:["3","4"] },
        { id:"h1", type:"siemens3SU1152AmberIndicator", reference:"H1", label:"3SU1152 indicator", x:1000, y:360, rotation:0, terminals:["X1","X2"] }
      ],
      wires: [
        { id:"earth-lead", from:{componentId:"ps1",terminal:"PE"}, to:{componentId:"pe1",terminal:"1"}, waypoints:[{x:700,y:460}] },
        { id:"run-signal", from:{componentId:"plc1",terminal:"X11-3"}, to:{componentId:"h1",terminal:"X1"}, waypoints:[{x:700,y:340}] }
      ],
      inputStates: {}
    }
  };
  await page.locator("#fileInput").setInputFiles({ name:"pump-overlap.json", mimeType:"application/json", buffer:Buffer.from(JSON.stringify(project)) });
  await page.locator("#electricalTab").click();
  const plc=page.locator('#electricalBoard [data-component-id="plc1"]');
  const pe=page.locator('#electricalBoard [data-component-id="pe1"]');
  const wire=page.locator('#electricalBoard [data-wire-id="earth-lead"]');
  await expect(plc).toBeVisible();
  await expect(pe).toBeVisible();
  await expect(wire).toHaveAttribute("d", /L700 460/);
  const diagnostics=page.locator(".electrical-inspector details[data-inspector-section=\"diagnostics\"]");
  await expect(diagnostics.locator("summary")).toContainText(/warning/i);
  await diagnostics.locator("summary").click();
  await expect(diagnostics).not.toContainText("Overlapping component cards: PLC1 and PE1");
  const plcBox=await plc.boundingBox(),peBox=await pe.boundingBox();
  expect(plcBox.x+plcBox.width+12<=peBox.x||peBox.x+peBox.width+12<=plcBox.x||plcBox.y+plcBox.height+12<=peBox.y||peBox.y+peBox.height+12<=plcBox.y, "legacy imported PLC and PE cards are automatically separated on open").toBe(true);
  const symbol=pe.locator(".electrical-symbol"),start=await symbol.boundingBox();
  await page.mouse.move(start.x+start.width/2,start.y+start.height/2);
  await page.mouse.down();
  await page.mouse.move(start.x+start.width/2+220,start.y+start.height/2+330,{steps:12});
  await page.mouse.up();
  const boxes=await page.locator("#electricalBoard [data-component-id]").evaluateAll(nodes=>nodes.map(node=>{const {left,top,right,bottom}=node.getBoundingClientRect();return {left,top,right,bottom};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(a.right+12<=b.left||b.right+12<=a.left||a.bottom+12<=b.top||b.bottom+12<=a.top).toBe(true);}
  await expect(pe).toHaveAttribute("data-component-id","pe1");
  await expect(wire).toHaveAttribute("data-wire-id","earth-lead");
  await expect(wire).toHaveAttribute("d",/L700 460/);
});


test("source-backed Siemens NO contact manually switches its wired simulation load", async ({ page }) => {
  const project = {
    name:"Siemens contact simulation fixture", rungs:[], tags:[], io:{inputs:[],outputs:[]}, initialState:{},
    electrical:{
      components:[
        {id:"ps1",type:"supply24vdc",reference:"PS1",label:"24 V DC supply",x:80,y:80,rotation:0,terminals:["+","−"]},
        {id:"s1",type:"siemens3SU1400NOContact",reference:"S1",label:"Siemens 3SU1400 NO contact",x:320,y:80,rotation:0,terminals:["3","4"]},
        {id:"h1",type:"pilotLamp",reference:"H1",label:"Pilot lamp",x:560,y:80,rotation:0,terminals:["X1","X2"]}
      ],
      wires:[
        {id:"feed",from:{componentId:"ps1",terminal:"+"},to:{componentId:"s1",terminal:"3"}},
        {id:"switched",from:{componentId:"s1",terminal:"4"},to:{componentId:"h1",terminal:"X1"}},
        {id:"return",from:{componentId:"h1",terminal:"X2"},to:{componentId:"ps1",terminal:"−"}}
      ],
      inputStates:{}
    }
  };
  await page.locator("#fileInput").setInputFiles({name:"siemens-contact.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(project))});
  await page.locator("#electricalTab").click();
  await page.locator('#electricalCanvasContext [data-electrical-action="simulate"]').click();
  const contactInput=page.locator('[data-electrical-input="S1"]'),contact=page.locator('#electricalBoard [data-component-id="s1"]'),lamp=page.locator('#electricalBoard [data-component-id="h1"]');
  await expect(contactInput).toBeVisible();
  await expect(contact).toHaveAttribute("data-contact-state","open");
  await expect(lamp).not.toHaveClass(/energized/);
  await contactInput.check();
  await expect(contact).toHaveAttribute("data-contact-state","closed");
  await expect(lamp).toHaveClass(/energized/);
});
test("Siemens 3RV2 breaker inspector opens all three schematic poles", async ({ page }) => {
  await page.setViewportSize({width:1894,height:850});
  await page.locator("#electricalTab").click();
  await page.locator("#electricalToolboxDock #electricalPalette").selectOption("siemensSirius3RV20111JA10");
  await page.locator('#electricalToolboxDock [data-electrical-action="add"]').click();
  const breaker=page.locator('#electricalBoard [data-component-type="siemensSirius3RV20111JA10"]').last();
  await expect(breaker.locator('.electrical-port')).toHaveCount(6);
  const control=page.locator('#electricalProperties input[name="breakerOpen"]');
  await expect(control).toBeVisible();await control.check();
  await page.locator('#electricalProperties button[type="submit"]').click();
  await expect(breaker).toHaveAttribute("data-contact-state","open");
  await expect(breaker).toHaveAttribute("aria-label",/Open/);
});

test("component bodies remain draggable while wire mode is armed", async ({ page }) => {
  await page.setViewportSize({width:1894,height:850});
  await page.locator("#electricalTab").click();
  const palette=page.locator("#electricalToolboxDock #electricalPalette"),add=page.locator('#electricalToolboxDock [data-electrical-action="add"]'),components=page.locator("#electricalBoard [data-component-id]");
  await palette.selectOption("supply24vdc");
  const countBefore=await components.count();
  await add.click();await add.click();await expect(components).toHaveCount(countBefore+2);
  const ids=await components.evaluateAll(nodes=>nodes.slice(-2).map(node=>node.dataset.componentId)),source=page.locator(`#electricalBoard [data-component-id="${ids[0]}"]`),moved=page.locator(`#electricalBoard [data-component-id="${ids[1]}"]`),before=await moved.boundingBox(),symbol=await moved.locator(".electrical-symbol").boundingBox();
  const wireTool=page.locator('#electricalCanvasContext [data-electrical-action="wire"]');
  await wireTool.click();
  await page.mouse.move(symbol.x+symbol.width/2,symbol.y+symbol.height/2);await page.mouse.down();await page.mouse.move(symbol.x+symbol.width/2+160,symbol.y+symbol.height/2+160,{steps:8});await page.mouse.up();
  const after=await moved.boundingBox();expect(after.x).toBeGreaterThan(before.x+80);expect(after.y).toBeGreaterThan(before.y+80);
  await page.locator(`[data-terminal-component="${ids[0]}"][data-terminal="+"]`).click();
  await page.locator(`[data-terminal-component="${ids[1]}"][data-terminal="−"]`).click();
  await expect(page.locator("#electricalBoard .electrical-wire")).toHaveCount(1);
});
