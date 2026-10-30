export function calculateRungWindow(heights, viewportTop, viewportHeight, scale = 1, gap = 16, overscanScreens = 2) {
  const count = heights.length;
  if (!count) return { start:0, end:0, top:0, bottom:0, total:0 };
  const starts = new Array(count), factor = Math.max(0.1, scale), overscan = Math.max(0, viewportHeight) * overscanScreens / factor;
  let total = 0;
  for (let index = 0; index < count; index++) { starts[index] = total; total += Math.max(1, heights[index]) + (index < count - 1 ? gap : 0); }
  const from = Math.max(0, viewportTop / factor - overscan), to = (viewportTop + viewportHeight) / factor + overscan;
  let start = 0;
  while (start < count - 1 && starts[start] + heights[start] < from) start++;
  let end = start + 1;
  while (end < count && starts[end] < to) end++;
  return { start, end, top:start ? Math.max(0, starts[start] - gap) : 0, bottom:end < count ? Math.max(0, total - starts[end]) : 0, total };
}
