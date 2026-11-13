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

test("electrical workspace uses one compact status row and docks the bot without hiding editor status elsewhere", async ({ page }) => {
  await page.setViewportSize({ width:1894, height:850 });
  await page.locator("#electricalTab").click();
  await expect(page.locator("#offlineLabel")).toBeVisible();
  await expect(page.locator(".editor-footer")).toBeHidden();
  await expect(page.locator(".corporate-footer")).toBeHidden();
  const electricalLayout=await page.evaluate(()=>{
    const box=(selector)=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height}};
    return {status:box(".statusbar"),bot:box(".floating-bot"),board:box(".electrical-board-wrap"),offlineInStatus:document.querySelector("#offlineLabel").closest(".statusbar")!==null};
  });
  expect(electricalLayout.status.height).toBe(35);
  expect(electricalLayout.bot.top).toBeGreaterThanOrEqual(electricalLayout.status.top);
  expect(electricalLayout.bot.bottom).toBeLessThanOrEqual(electricalLayout.status.bottom+1);
  expect(electricalLayout.board.bottom).toBeLessThanOrEqual(electricalLayout.status.top);
  expect(electricalLayout.offlineInStatus).toBe(true);

  await page.locator("#logicTab").click();
  await expect(page.locator(".editor-footer")).toBeVisible();
  await expect(page.locator(".corporate-footer")).toBeVisible();
  expect(await page.locator("#offlineLabel").evaluate((node)=>node.closest(".editor-footer")!==null)).toBe(true);
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
  await page.locator("#electricalLibraryWorkflows .electrical-library-link").click();
  await expect(page.locator("#electricalPalette")).toBeFocused();
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
  await expect(palette.locator("option")).toHaveCount(2);
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
          return { scrollWidth:document.documentElement.scrollWidth, boardHeight:boardRect?.height ?? 0, emptyHintWithinViewport, emptyHintGeometry, buttons, overlaps };
        });

        expect(metrics.scrollWidth, `${locale}/${theme} at ${viewport.width}px has no horizontal page overflow`).toBeLessThanOrEqual(viewport.width);
        expect(metrics.boardHeight, `${locale}/${theme} at ${viewport.width}px retains useful canvas height`).toBeGreaterThanOrEqual(viewport.minBoardHeight);
        expect(metrics.emptyHintWithinViewport, `${locale}/${theme} at ${viewport.width}px keeps empty-canvas guidance in view: ${JSON.stringify(metrics.emptyHintGeometry)}`).toBe(true);
        expect(metrics.buttons.every((button) => button.left >= 0 && button.right <= viewport.width), `${locale}/${theme} header controls stay within viewport`).toBe(true);
        expect(metrics.overlaps, `${locale}/${theme} header controls do not overlap`).toEqual([]);
        if (viewport.width <= 760) await page.locator('[data-mobile-drawer-close="left"]').click();
      }
    }
  }
});

