export function shiftHistoricalBreakpoints(breakpoints) {
  return new Set([...breakpoints].filter((scan) => scan > 1).map((scan) => scan - 1));
}

export function isHistoricalBreakpoint(breakpoints, cursor, frameCount) {
  return cursor > 0 && cursor < frameCount && breakpoints.has(cursor);
}
