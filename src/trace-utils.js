export function shiftHistoricalBreakpoints(breakpoints) {
  return new Set([...breakpoints].filter((scan) => scan > 1).map((scan) => scan - 1));
}

export function isHistoricalBreakpoint(breakpoints, cursor, frameCount) {
  return cursor > 0 && cursor < frameCount && breakpoints.has(cursor);
}

export function traceSectionValues(snapshot, section) {
  if (section === "mixedState") {
    const mixed = snapshot?.mixedState;
    return mixed ? { clockMs: mixed.clock?.timeMs, ...Object.fromEntries(Object.entries(mixed.units || {}).map(([name,state]) => ["Unit " + name,state])) } : {};
  }
  if (section === "programState") return Object.fromEntries(Object.entries(snapshot?.programState || {}).map(([name,state])=>[name,{...(state.values || {}),...(Object.keys(state.instances || {}).length ? {"[instances]":Object.fromEntries(Object.entries(state.instances).map(([key,instance])=>[key,instance.values || {}]))} : {})}]));
  if (section === "taskState") return snapshot?.taskState ? {timeMs:snapshot.taskState.timeMs} : {};
  return snapshot?.[section] || {};
}
