export const RESOURCE_STORAGE_KEY = "adigunsps-resources-v1";
export const RESOURCE_AUDIT_KEY = "adigunsps-resource-access-v1";
export const resources = Object.freeze([
  Object.freeze({ id:"source-repository", url:"https://github.com/HephzibahBehulahHQ/AdigunSPs", host:"github.com", approved:true, builtIn:true, description:Object.freeze({ en:"AdigunSPs source repository", de:"AdigunSPs-Quellcode", yo:"Ibi ìpamọ́ kóòdù AdigunSPs", pcm:"AdigunSPs source repo" }) }),
]);

function getStorage(storage) { return storage ?? (typeof localStorage === "undefined" ? null : localStorage); }
export function readResourceRegistry(storage) {
  const target = getStorage(storage);
  if (!target) return resources.map((resource) => ({ ...resource, description:{ ...resource.description } }));
  try {
    const saved = JSON.parse(target.getItem(RESOURCE_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return resources.map((resource) => ({ ...resource, description:{ ...resource.description } }));
    const additions = saved.filter((item) => item && typeof item.id === "string" && !resources.some((base) => base.id === item.id));
    const overrides = new Map(saved.filter((item) => item?.id).map((item) => [item.id, item]));
    return [...resources.map((base) => ({ ...base, ...overrides.get(base.id), builtIn:true, description:{ ...base.description, ...overrides.get(base.id)?.description } })), ...additions];
  } catch { return resources.map((resource) => ({ ...resource, description:{ ...resource.description } })); }
}

export function saveResource(resource, storage) {
  const target = getStorage(storage);
  if (!target) throw new Error("Local storage is unavailable.");
  const parsed = validateResource(resource);
  if (!parsed.valid) throw new Error(parsed.error);
  const rows = readResourceRegistry(target), previous = rows.find((item) => item.id === parsed.resource.id), next = { ...previous, ...parsed.resource, approved:Boolean(resource.approved), builtIn:Boolean(previous?.builtIn), check:resource.check || previous?.check };
  if (rows.some((item) => item.id !== next.id && item.url === next.url)) throw new Error("This exact URL is already registered.");
  const updated = [...rows.filter((item) => item.id !== next.id), next];
  target.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(updated));
  return next;
}

export function removeResource(id, storage) {
  const target = getStorage(storage);
  const resource = readResourceRegistry(target).find((item) => item.id === id);
  if (!target || !resource || resource.builtIn) return false;
  target.setItem(RESOURCE_STORAGE_KEY, JSON.stringify(readResourceRegistry(target).filter((item) => item.id !== id)));
  return true;
}

export function validateResource(input) {
  let url;
  try { url = new URL(String(input.url || "").trim()); } catch { return { valid:false, error:"Enter a complete HTTPS URL." }; }
  const host = url.hostname.toLowerCase(), labels = host.replace(/^\[|\]$/g, "").split(".");
  const validHost = host.length <= 253 && host.includes(".") && !host.includes(":") && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host) && !labels.some((label) => !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
  if (url.protocol !== "https:" || url.username || url.password || !validHost || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return { valid:false, error:"Use a public-domain HTTPS URL without credentials." };
  const description = Object.fromEntries(["en", "de", "yo", "pcm"].map((locale) => [locale, String(input.description?.[locale] || "").trim()]));
  if (Object.values(description).some((value) => !value || value.length > 240)) return { valid:false, error:"Provide a description of 1–240 characters in all four supported languages." };
  return { valid:true, resource:{ id:String(input.id || `resource-${crypto.randomUUID()}`), url:url.href, host, approved:false, description } };
}

export function isApprovedExternalUrl(value, registry = readResourceRegistry()) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && registry.some((resource) => resource.approved && url.hostname.toLowerCase() === resource.host.toLowerCase() && url.href === resource.url); }
  catch { return false; }
}

export function appendResourceAudit(entry, storage) {
  const target = getStorage(storage);
  if (!target) return [];
  let events = [];
  try { const saved = JSON.parse(target.getItem(RESOURCE_AUDIT_KEY) || "[]"); if (Array.isArray(saved)) events = saved; } catch {}
  events.unshift({ time:new Date().toISOString(), ...entry });
  events = events.slice(0, 500);
  target.setItem(RESOURCE_AUDIT_KEY, JSON.stringify(events));
  return events;
}

export function readResourceAudit(storage) {
  const target = getStorage(storage);
  try { const events = JSON.parse(target?.getItem(RESOURCE_AUDIT_KEY) || "[]"); return Array.isArray(events) ? events : []; } catch { return []; }
}

export async function checkResourceLink(resource, fetcher = globalThis.fetch) {
  if (!isApprovedExternalUrl(resource.url, [resource])) return { status:"unapproved", checkedAt:new Date().toISOString() };
  try {
    const response = await fetcher(resource.url, { method:"HEAD", redirect:"manual", cache:"no-store" });
    if (response.type === "opaque" || response.status === 0 || response.status >= 300 && response.status < 400) return { status:"unverified", checkedAt:new Date().toISOString() };
    return { status:response.ok ? "available" : "broken", httpStatus:response.status, checkedAt:new Date().toISOString() };
  } catch { return { status:"unverified", checkedAt:new Date().toISOString() }; }
}
