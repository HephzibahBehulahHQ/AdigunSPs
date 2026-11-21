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

export function compareSnapshotLogic(earlier, latest) {
  return sections.flatMap(([key, select]) => {
    const before = lines(select(earlier)), after = lines(select(latest));
    let start = 0;
    while (start < before.length && start < after.length && before[start] === after[start]) start++;
    if (start === before.length && start === after.length) return [];
    let beforeEnd = before.length, afterEnd = after.length;
    while (beforeEnd > start && afterEnd > start && before[beforeEnd - 1] === after[afterEnd - 1]) {
      beforeEnd--;
      afterEnd--;
    }
    return [{ key, firstLine:start + 1, before:before.slice(start, beforeEnd), after:after.slice(start, afterEnd) }];
  });
}
