export function sortProjectsByRecent(projects) {
  return [...(projects || [])].sort((a, b) => Number(b.lastOpenedAt ?? b.updatedAt ?? 0) - Number(a.lastOpenedAt ?? a.updatedAt ?? 0));
}
