const sections = [
  ["editor", (project) => project.editorType ?? "LD"],
  ["ladder", (project) => project.rungs ?? []],
  ["blocks", (project) => project.fbdBlocks ?? []],
  ["text", (project) => project.stSource ?? ""],
  ["chart", (project) => project.sfc ?? {}],
  ["units", (project) => project.programUnits ?? []],
  ["tasks", (project) => [project.task ?? null, ...(project.tasks ?? [])]],
  ["tags", (project) => project.tags ?? []],
  ["io", (project) => project.io ?? {}],
  ["initial", (project) => project.initialState ?? {}],
  ["processes", (project) => project.processes ?? []]
];

function lines(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value, (_, item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]]));
  }, 2);
  return text ? text.replace(/\r\n/g, "\n").split("\n") : [];
}

function uniquePositions(input, start, end) {
  const positions = new Map();
  for (let index = start; index < end; index++) {
    const line = input[index];
    positions.set(line, positions.has(line) ? -1 : index);
  }
  return positions;
}

function matchingAnchors(before, after, start, beforeEnd, afterEnd) {
  const beforePositions = uniquePositions(before, start, beforeEnd);
  const afterPositions = uniquePositions(after, start, afterEnd);
  const candidates = [], tails = [];
  for (const [line, left] of beforePositions) {
    const right = afterPositions.get(line);
    if (left < 0 || right === undefined || right < 0 || !line.trim()) continue;
    // Find an ordered set of unchanged lines without allocating a quadratic comparison table.
    let low = 0, high = tails.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (candidates[tails[mid]].right < right) low = mid + 1;
      else high = mid;
    }
    candidates.push({ left, right, previous:tails[low - 1] });
    tails[low] = candidates.length - 1;
  }
  const anchors = [];
  for (let index = tails.at(-1); index !== undefined; index = candidates[index].previous) {
    anchors.push(candidates[index]);
  }
  return anchors.reverse();
}

function changedRange(before, after, left, right, beforeEnd, afterEnd) {
  while (left < beforeEnd && right < afterEnd && before[left] === after[right]) {
    left++;
    right++;
  }
  while (beforeEnd > left && afterEnd > right && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd--;
    afterEnd--;
  }
  return { left, right, beforeEnd, afterEnd };
}

function compareLines(before, after) {
  const range = changedRange(before, after, 0, 0, before.length, after.length);
  let { left, right } = range;
  const { beforeEnd, afterEnd } = range;
  if (left === beforeEnd && right === afterEnd) return [];
  const anchors = matchingAnchors(before, after, left, beforeEnd, afterEnd);
  anchors.push({ left:beforeEnd, right:afterEnd });
  const hunks = [];
  for (const anchor of anchors) {
    const gap = changedRange(before, after, left, right, anchor.left, anchor.right);
    if (gap.left < gap.beforeEnd || gap.right < gap.afterEnd) {
      hunks.push({
        beforeLine:gap.left + 1, afterLine:gap.right + 1,
        before:before.slice(gap.left, gap.beforeEnd), after:after.slice(gap.right, gap.afterEnd)
      });
    }
    left = anchor.left + 1;
    right = anchor.right + 1;
  }
  return hunks;
}

export function compareSnapshotLogic(earlier, latest) {
  return sections.flatMap(([key, select]) => {
    const hunks = compareLines(lines(select(earlier)), lines(select(latest)));
    return hunks.length ? [{ key, hunks }] : [];
  });
}
