import { cyclicTaskSchedule } from "./cyclic-tasks.js";
import { scan, scanFBD, scanSFC } from "./engine.js";
import { executeStructuredText } from "./structured-text.js";

// The caller owns the shared image and supplies retained state for this unit only.
export function executeProgramUnit(unit, image, state = {}, dt = 100) {
  const outputs = Object.fromEntries(unit.outputs.map(name => [name, image[name] ?? false]));
  const initial = { ...state, outputs };
  let result;
  switch (unit.language) {
    case "LD":
      result = scan({ rungs: unit.rungs, io: { outputs: unit.outputs } }, image, initial, dt);
      break;
    case "FBD":
      result = scanFBD(unit.blocks, image, initial, unit.outputs, dt);
      break;
    case "SFC":
      result = scanSFC({ ...unit.chart, outputs: unit.outputs }, image, initial);
      break;
    case "ST":
      result = executeStructuredText(unit.compiled, { ...state.values, ...image }, outputs, unit.outputs, unit.types, state.programState);
      break;
    default:
      throw new Error("Unsupported program language: " + unit.language);
  }
  if (result.errors?.length) return { state, writes: {}, errors: result.errors };
  const writes = Object.fromEntries(unit.outputs.filter(name => Object.hasOwn(result.outputs, name)).map(name => [name, result.outputs[name]]));
  const retained = {};
  for (const key of ["timers", "counters", "edges", "activeStep", "programState"]) {
    if (Object.hasOwn(result, key)) retained[key] = result[key];
  }
  if (unit.language === "ST") retained.values = Object.fromEntries(Object.entries(result.values).filter(([name]) => !Object.hasOwn(image, name) && !unit.outputs.includes(name)));
  return { state: retained, writes, errors: [] };
}

export function executeProgramTasks(units, tasks, image, state = {}, dt = 100) {
  const byName = new Map(units.map(unit => [unit.name, unit]));
  if (new Set(units.map(unit => unit.name.toLowerCase())).size !== units.length) {
    return { image, state, errors: ["Program names must be unique (ignoring case)."] };
  }
  const schedule = cyclicTaskSchedule(tasks, [...byName.keys()], dt, state.clock);
  if (schedule.errors.length) return { image, state, errors: schedule.errors };
  const nextImage = { ...image };
  const nextUnits = new Map();
  for (const release of schedule.releases) {
    for (const name of release.programs) {
      const key = name.toLowerCase();
      const prior = nextUnits.get(key) ?? (Object.hasOwn(state.units || {}, key) ? state.units[key] : undefined);
      const result = executeProgramUnit(byName.get(name), nextImage, prior, release.periodMs ?? dt);
      if (result.errors.length) return { image, state, errors: result.errors.map(error => name + " | " + error) };
      for (const [name, value] of Object.entries(result.writes)) Object.defineProperty(nextImage, name, { value, enumerable: true, writable: true, configurable: true });
      nextUnits.set(key, result.state);
    }
  }
  return { image: nextImage, state: { clock: schedule.state, units: { ...state.units, ...Object.fromEntries(nextUnits) } }, errors: [] };
}

