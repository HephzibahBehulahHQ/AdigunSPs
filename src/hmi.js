export function evaluateAlarms(model, values, timestamp = Date.now()) {
  const alarms = structuredClone(model.alarms || []), events = [];
  for (const alarm of alarms) {
    const value = values[alarm.tag];
    let active;
    if (alarm.condition?.kind === "threshold") {
      const numeric = value, threshold = alarm.condition.threshold;
      const hysteresis = alarm.condition.hysteresis === undefined ? 0 : alarm.condition.hysteresis;
      const valid = typeof numeric === "number" && typeof threshold === "number" && Number.isFinite(numeric) && Number.isFinite(threshold) && typeof hysteresis === "number" && Number.isFinite(hysteresis) && hysteresis >= 0 && ["gte", "lte"].includes(alarm.condition.operator);
      // Hysteresis affects only clearing; zero preserves the original inclusive comparison.
      active = valid && (alarm.condition.operator === "lte"
        ? alarm.active && hysteresis > 0 ? numeric < threshold + hysteresis : numeric <= threshold
        : alarm.active && hysteresis > 0 ? numeric > threshold - hysteresis : numeric >= threshold);
    } else active = (!alarm.condition || alarm.condition.kind === "bool") && Boolean(value);
    if (active !== Boolean(alarm.active)) {
      alarm.active = active;
      if (active) alarm.acknowledged = false;
      events.push({ alarmId:alarm.id, type:active ? "raised" : "cleared", time:timestamp, tag:alarm.tag, priority:alarm.priority, value:value ?? null, condition:alarm.condition || { kind:"bool" } });
    }
  }
  return { alarms, events };
}

export function createAlarm(model, { tag, message = "", priority = "medium", condition = { kind:"bool" } }, timestamp = Date.now()) {
  const alarm = { id:`alarm-${timestamp}-${(model.alarms || []).length + 1}`, tag, message:message.trim() || tag, priority, condition:structuredClone(condition), active:false, acknowledged:false, suppressed:false, shelvedUntil:0 };
  return { ...model, alarms:[...(model.alarms || []), alarm] };
}

export function setAlarmState(model, alarmId, action, timestamp = Date.now()) {
  const alarms = (model.alarms || []).map((alarm) => {
    if (alarm.id !== alarmId) return alarm;
    if (action === "acknowledge") return { ...alarm, acknowledged:true };
    if (action === "suppress") return { ...alarm, suppressed:!alarm.suppressed };
    if (action === "shelve") return { ...alarm, shelvedUntil:alarm.shelvedUntil > timestamp ? 0 : timestamp + 300_000 };
    return alarm;
  });
  return { ...model, alarms };
}

export function saveRecipe(model, name, values, timestamp = Date.now()) {
  const recipes = [...(model.recipes || [])], normalized = name.trim();
  if (!normalized) throw new Error("Recipe name is required");
  const version = recipes.filter((recipe) => recipe.name.toLowerCase() === normalized.toLowerCase()).reduce((max, recipe) => Math.max(max, recipe.version), 0) + 1;
  const recipe = { id:`recipe-${timestamp}-${version}`, name:normalized, version, values:structuredClone(values), createdAt:timestamp };
  return { ...model, recipes:[...recipes, recipe] };
}

export function applyRecipe(model, recipeId) {
  const recipe = (model.recipes || []).find((item) => item.id === recipeId);
  if (!recipe) throw new Error("Recipe not found");
  return structuredClone(recipe.values);
}

export function captureRecipeInputs(inputNames, tags, values) {
  const types = new Map((tags || []).map(tag => [tag.name, tag.type || "BOOL"]));
  return Object.fromEntries(inputNames.map(name => {
    const type = types.get(name) || "BOOL", value = values[name] ?? (type === "BOOL" ? false : 0);
    const valid = type === "BOOL" ? typeof value === "boolean" : typeof value === "number" && Number.isFinite(value) && (type !== "INT" || Number.isInteger(value)) && (type !== "TIME" || value >= 0);
    if (!valid) throw new Error(`Invalid recipe input: ${name} (${type})`);
    return [name, value];
  }));
}

export function recipeInputChanges(model, recipeId, currentValues = {}) {
  return Object.entries(applyRecipe(model, recipeId)).map(([tag, after]) => ({ tag, before:currentValues[tag], after, changed:!Object.is(currentValues[tag], after) }));
}

export function normalizeAlarmHistoryLimit(value) { return [100,500,2000].includes(Number(value)) ? Number(value) : 500; }
export function retainAlarmEvents(history = [], additions = [], limit = 500) {
  return [...(Array.isArray(additions) ? additions : []), ...(Array.isArray(history) ? history : [])].slice(0, normalizeAlarmHistoryLimit(limit));
}
