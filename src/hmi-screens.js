function activeScreen(model) { return model.screens.find((screen) => screen.id === model.activeScreenId) || model.screens[0]; }

export function ensureHmiScreens(model) {
  if (!Array.isArray(model.screens) || !model.screens.length) {
    model.screens = [{ id:"main", title:model.title || "Main HMI", widgets:Array.isArray(model.widgets) ? model.widgets : [] }];
  }
  model.screens = model.screens.filter((screen) => screen && typeof screen.id === "string" && screen.id);
  if (!model.screens.length) model.screens = [{ id:"main", title:"Main HMI", widgets:[] }];
  for (const screen of model.screens) { screen.title = String(screen.title || "Main HMI"); if (!Array.isArray(screen.widgets)) screen.widgets = []; }
  model.activeScreenId = model.screens.some((screen) => screen.id === model.activeScreenId) ? model.activeScreenId : model.screens[0].id;
  syncActiveScreen(model);
  return model;
}

export function syncActiveScreen(model) {
  const screen = activeScreen(model);
  if (!screen) return null;
  model.activeScreenId = screen.id;
  model.title = screen.title;
  model.widgets = screen.widgets;
  return screen;
}

export function addHmiScreen(model, title, id = crypto.randomUUID()) {
  ensureHmiScreens(model);
  const normalized = String(title || "").trim();
  if (!normalized) return { ok:false, error:"A screen title is required." };
  if (model.screens.length >= 50) return { ok:false, error:"A project can have at most 50 HMI screens." };
  if (model.screens.some((screen) => screen.title.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return { ok:false, error:"Screen titles must be unique." };
  const screen = { id, title:normalized, widgets:[] };
  model.screens.push(screen);
  model.activeScreenId = screen.id;
  syncActiveScreen(model);
  return { ok:true, screen };
}

export function selectHmiScreen(model, id) {
  ensureHmiScreens(model);
  if (!model.screens.some((screen) => screen.id === id)) return false;
  model.activeScreenId = id;
  syncActiveScreen(model);
  return true;
}

export function renameHmiScreen(model, title) {
  ensureHmiScreens(model);
  const normalized = String(title || "").trim();
  if (!normalized) return { ok:false, error:"A screen title is required." };
  const screen = activeScreen(model);
  if (model.screens.some((item) => item.id !== screen.id && item.title.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return { ok:false, error:"Screen titles must be unique." };
  screen.title = normalized;
  syncActiveScreen(model);
  return { ok:true, screen };
}

export function deleteActiveHmiScreen(model) {
  ensureHmiScreens(model);
  if (model.screens.length <= 1) return false;
  model.screens = model.screens.filter((screen) => screen.id !== model.activeScreenId);
  model.activeScreenId = model.screens[0].id;
  syncActiveScreen(model);
  return true;
}
