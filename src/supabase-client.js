export const ADIGUN_SUPABASE_PROJECT_REF = "fqcbfnktdvqojyezxeis";
export const ADIGUN_SUPABASE_URL = `https://${ADIGUN_SUPABASE_PROJECT_REF}.supabase.co`;

function isPrivilegedKey(key) {
  if (/^(sb_secret_|service_role)/i.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3 || typeof globalThis.atob !== "function") return false;
  try {
    const payload = JSON.parse(globalThis.atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

export function createAdigunSupabaseClient(runtimeConfig = globalThis.ADIGUN_RUNTIME_CONFIG, sdk = globalThis.supabase) {
  const configured = runtimeConfig?.supabase || {};
  const url = typeof configured.url === "string" ? configured.url.trim() : "";
  const publishableKey = typeof configured.publishableKey === "string" ? configured.publishableKey.trim() : "";
  let status = { ready:false, projectRef:ADIGUN_SUPABASE_PROJECT_REF, reason:"missing-publishable-key" };

  if (url !== ADIGUN_SUPABASE_URL) {
    status = { ...status, reason:"unexpected-project-url" };
    return { client:null, status };
  }
  if (!publishableKey) return { client:null, status };
  if (isPrivilegedKey(publishableKey)) {
    status = { ...status, reason:"server-secret-rejected" };
    return { client:null, status };
  }
  if (typeof sdk?.createClient !== "function") {
    status = { ...status, reason:"sdk-unavailable" };
    return { client:null, status };
  }

  const client = sdk.createClient(url, publishableKey, {
    auth: { autoRefreshToken:true, persistSession:true, detectSessionInUrl:true },
  });
  return { client, status:{ ready:true, projectRef:ADIGUN_SUPABASE_PROJECT_REF, reason:"ready" } };
}

const initialized = createAdigunSupabaseClient();
export const supabaseClient = initialized.client;
export const supabaseStatus = initialized.status;
