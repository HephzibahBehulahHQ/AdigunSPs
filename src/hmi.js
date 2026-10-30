export function evaluateAlarms(model, values, timestamp = Date.now()) {
  const alarms = structuredClone(model.alarms || []), events = [];
  for (const alarm of alarms) {
    const value = values[alarm.tag];
    let active;
    if (alarm.condition?.kind === "threshold") {
      const numeric = Number(value), threshold = Number(alarm.condition.threshold);
      active = Number.isFinite(numeric) && Number.isFinite(threshold) && (alarm.condition.operator === "lte" ? numeric <= threshold : numeric >= threshold);
    } else active = Boolean(value);
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
