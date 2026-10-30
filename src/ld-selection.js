export function contactSelectionKey({ rung, branch, contact }) {
  return JSON.stringify([Number(rung), Number(branch), Number(contact)]);
}

export function updateContactSelection(current, location, additive = false) {
  const key = contactSelectionKey(location), next = additive ? new Set(current) : new Set();
  if (additive && next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function removeSelectedContacts(rungs, selectedKeys) {
  const next = structuredClone(rungs), grouped = new Map();
  for (const key of selectedKeys) {
    let location;
    try { location = JSON.parse(key); } catch { continue; }
    if (!Array.isArray(location) || location.length !== 3 || !location.every(Number.isInteger)) continue;
    const [rung, branch, contact] = location;
    if (!next[rung]) continue;
    const paths = next[rung].branches?.length ? next[rung].branches : [next[rung].contacts || []];
    if (!paths[branch]?.[contact]) continue;
    const groupKey = `${rung}:${branch}`, group = grouped.get(groupKey) || { rung, branch, contacts:[] };
    group.contacts.push(contact); grouped.set(groupKey, group);
  }
  let removed = 0;
  for (const { rung, branch, contacts } of grouped.values()) {
    const paths = next[rung].branches?.length ? next[rung].branches : (next[rung].branches = [next[rung].contacts || []]);
    for (const contact of [...new Set(contacts)].sort((a, b) => b - a)) { paths[branch].splice(contact, 1); removed += 1; }
  }
  return { rungs:next, removed };
}

export function moveContact(rungs, from, to) {
  const next = structuredClone(rungs), validLocation = (point) => point && [point.rung, point.branch].every(Number.isInteger) && (point.contact == null || Number.isInteger(point.contact));
  if (!validLocation(from) || !Number.isInteger(from.contact) || !validLocation(to) || !next[from.rung] || !next[to.rung]) return { rungs:next, moved:false };
  const pathsFor = (rung) => { if (!Array.isArray(rung.branches) || !rung.branches.length) rung.branches = [rung.contacts || []]; delete rung.contacts; return rung.branches; };
  const sourcePaths = pathsFor(next[from.rung]), targetPaths = from.rung === to.rung ? sourcePaths : pathsFor(next[to.rung]);
  if (!sourcePaths[from.branch] || !targetPaths[to.branch] || !sourcePaths[from.branch][from.contact]) return { rungs:next, moved:false };
  if (from.rung === to.rung && from.branch === to.branch && (from.contact === to.contact || from.contact + 1 === to.contact || (to.contact == null && from.contact === sourcePaths[from.branch].length - 1))) return { rungs:next, moved:false };
  if (sourcePaths[from.branch].length === 1 && sourcePaths.length === 1) return { rungs:next, moved:false };
  const contact = sourcePaths[from.branch][from.contact], sourcePath = sourcePaths[from.branch];
  let insertAt = to.contact == null ? targetPaths[to.branch].length : to.contact;
  if (from.rung === to.rung && from.branch === to.branch && from.contact < insertAt) insertAt -= 1;
  sourcePath.splice(from.contact, 1);
  let targetBranch = to.branch;
  if (!sourcePath.length && sourcePaths.length > 1) { sourcePaths.splice(from.branch, 1); if (from.rung === to.rung && from.branch < targetBranch) targetBranch -= 1; }
  const targetPath = targetPaths[targetBranch];
  if (!targetPath) return { rungs:next, moved:false };
  insertAt = Math.max(0, Math.min(insertAt, targetPath.length));
  targetPath.splice(insertAt, 0, contact);
  return { rungs:next, moved:true, destination:{ rung:to.rung, branch:targetBranch, contact:insertAt } };
}
