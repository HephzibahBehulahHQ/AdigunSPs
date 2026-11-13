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
  await page.locator('#electricalToolboxDock [data-electrical-action="simulate"]').click();
  await expect(page.locator("#inspectorContent .electrical-status")).not.toBeEmpty();
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

  await page.locator('#electricalToolboxDock [data-electrical-action="wire"]').click();
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
      await page.locator("#languageButton").click();
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
          return { scrollWidth:document.documentElement.scrollWidth, boardHeight:board?.getBoundingClientRect().height ?? 0, buttons, overlaps };
        });

        expect(metrics.scrollWidth, `${locale}/${theme} at ${viewport.width}px has no horizontal page overflow`).toBeLessThanOrEqual(viewport.width);
        expect(metrics.boardHeight, `${locale}/${theme} at ${viewport.width}px retains useful canvas height`).toBeGreaterThanOrEqual(viewport.minBoardHeight);
        expect(metrics.buttons.every((button) => button.left >= 0 && button.right <= viewport.width), `${locale}/${theme} header controls stay within viewport`).toBe(true);
        expect(metrics.overlaps, `${locale}/${theme} header controls do not overlap`).toEqual([]);
        if (viewport.width <= 760) await page.locator('[data-mobile-drawer-close="left"]').click();
      }
    }
  }
});

