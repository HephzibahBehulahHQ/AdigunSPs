export function shiftHistoricalBreakpoints(breakpoints) {
  return new Set([...breakpoints].filter((scan) => scan > 1).map((scan) => scan - 1));
}

export function isHistoricalBreakpoint(breakpoints, cursor, frameCount) {
  return cursor > 0 && cursor < frameCount && breakpoints.has(cursor);
}

export function traceSectionValues(snapshot, section) {
  if (section === "programState") return Object.fromEntries(Object.entries(snapshot?.programState || {}).map(([name,state])=>[name,state.values || {}]));
  if (section === "taskState") return snapshot?.taskState ? {timeMs:snapshot.taskState.timeMs} : {};
  return snapshot?.[section] || {};
}
