const cookieName = "__Host-adigunsps-account";
const challengeTime = 10 * 60_000;
const textEncoder = new TextEncoder();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/account") return reply(404, { error:"not-found" });
    const origin = request.headers.get("Origin");
    const adminOrigin = origin && origin === env.ACCOUNT_ADMIN_ORIGIN && origin !== url.origin;
    if (!adminOrigin && origin !== url.origin) return reply(403, { error:"origin-required" });
    if (request.method === "OPTIONS" && adminOrigin) {
      return forAdmin(new Response(null, { status:204, headers:{
        "Access-Control-Allow-Methods":"POST", "Access-Control-Allow-Headers":"Content-Type", "Cache-Control":"no-store"
      } }), origin);
    }
    if (request.method !== "POST") return reply(405, { error:"method-not-allowed" });
    const result = await handleRequest(request, env, origin, adminOrigin);
    return adminOrigin ? forAdmin(result, origin) : result;
  }
};

function forAdmin(response, origin) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status:response.status, headers });
}

async function handleRequest(request, env, origin, adminOrigin) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.ACCOUNT_SECRET ||
      !env.ACCOUNT_RPC_PROOF || !env.ACCOUNT_LIMITER) {
    return reply(503, { error:"account-unavailable" });
  }
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!(await env.ACCOUNT_LIMITER.limit({ key:"ip:" + ip })).success) return reply(429, { error:"wait-and-retry" });
    if (!request.headers.get("Content-Type")?.startsWith("application/json")) return reply(415, { error:"json-required" });
    const body = await request.json().catch(() => null);
    if (body?.step === "begin") {
      if (adminOrigin && body.mode !== "sign-in") return reply(403, { error:"admin-sign-in-only" });
      return await begin(body, env, origin);
    }
    if (body?.step === "verify") return await verify(body, request, env, origin, adminOrigin);
    return reply(400, { error:"invalid-request" });
  } catch {
    return reply(503, { error:"account-unavailable" });
  }
}

async function begin(body, env, origin) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const { mode, password } = body;
  if (!["register", "sign-in", "reset-password"].includes(mode) || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== "string" ||
      password.length < 12 || password.length > 256) {
    return reply(400, { error:"invalid-email-or-password" });
  }

  if (!(await env.ACCOUNT_LIMITER.limit({ key:"email:" + await mac(env, "limit", email) })).success) {
    return reply(429, { error:"wait-and-retry" });
  }

  const passwordProof = await mac(env, "product-password", JSON.stringify([email, password]));
  if (mode === "sign-in") {
    const accepted = await rpc(env, "adigun_check_product_password", { email_address:email, password_proof:passwordProof });
    if (!accepted) return reply(401, { error:"invalid-product-credentials" });
  }
  const sent = await provider(env, "/auth/v1/otp", { email, create_user:mode === "register" });
  if (sent.status === 429) return reply(429, { error:"wait-and-retry" });
  if (!sent.ok) {
    const detail = await sent.json().catch(() => null);
    const code = detail?.error_code ?? detail?.code;
    if (mode !== "reset-password" || !["otp_disabled", "user_not_found"].includes(code)) {
      return reply(503, { error:"email-code-unavailable" });
    }
  }

  const challenge = await seal(env, { mode, email, passwordProof, origin, expiresAt:Date.now() + challengeTime });
  return reply(200, { step:"verify" }, cookie(challenge, challengeTime / 1000));
}

async function verify(body, request, env, origin, adminOrigin) {
  const saved = request.headers.get("Cookie")?.split(";").map(value => value.trim())
    .find(value => value.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
  const challenge = await open(env, saved);
  if (!challenge || challenge.origin !== origin || challenge.expiresAt <= Date.now()) return reply(400, { error:"email-code-request-required" });
  if (typeof body.code !== "string" || !/^\d{6,10}$/.test(body.code)) return reply(400, { error:"invalid-email-code" });
  const checked = await provider(env, "/auth/v1/verify", { email:challenge.email, token:body.code, type:"email" });
  if (checked.status === 429) return reply(429, { error:"wait-and-retry" });
  if (checked.status >= 500) return reply(503, { error:"account-unavailable" });
  if (!checked.ok) return reply(401, { error:"invalid-or-expired-email-code" });
  const session = await checked.json();
  if (!session?.access_token || !session.refresh_token || !session.user?.email_confirmed_at ||
      session.user.is_anonymous || session.user.email?.toLowerCase() !== challenge.email) {
    return reply(503, { error:"account-unavailable" });
  }

  if (adminOrigin && session.user.app_metadata?.role !== "admin") {
    return reply(403, { error:"admin-account-required" }, cookie("", 0));
  }

  const registration = challenge.mode === "register";
  const recovery = challenge.mode === "reset-password";
  const operation = registration ? "adigun_activate_product_account"
    : recovery ? "adigun_reset_product_password" : "adigun_verify_product_session";
  const accepted = await rpc(env, operation, {
    email_address:challenge.email, password_proof:challenge.passwordProof
  }, session.access_token);
  const cleared = cookie("", 0);
  if (!accepted) return reply(registration ? 409 : 401, { error:"product-account-not-authorized" }, cleared);
  if (registration) return reply(200, { step:"registered" }, cleared);
  if (recovery) return reply(200, { step:"password-reset" }, cleared);
  if (adminOrigin) {
    if (!session.user.id || !Number.isFinite(session.expires_in) || session.expires_in <= 0) {
      return reply(503, { error:"account-unavailable" }, cleared);
    }
    return reply(200, { step:"signed-in", session:{
      access_token:session.access_token, expires_in:session.expires_in,
      user:{ id:session.user.id, email:session.user.email, role:session.user.app_metadata.role }
    } }, cleared);
  }
  return reply(200, { step:"signed-in", session:{ access_token:session.access_token, refresh_token:session.refresh_token } }, cleared);
}

function provider(env, path, data, token, schema) {
  const headers = { apikey:env.SUPABASE_PUBLISHABLE_KEY, "Content-Type":"application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  if (schema) headers["Content-Profile"] = schema;
  return fetch(new URL(path, env.SUPABASE_URL), {
    method:"POST", headers, body:JSON.stringify(data), signal:AbortSignal.timeout(10_000)
  });
}

async function rpc(env, name, data, token) {
  const response = await provider(env, "/rest/v1/rpc/" + name, { ...data, worker_proof:env.ACCOUNT_RPC_PROOF }, token, "adigunsps");
  if (!response.ok) throw new Error("Account authorization unavailable");
  const allowed = await response.json();
  if (typeof allowed !== "boolean") throw new Error("Invalid account authorization result");
  return allowed;
}

function reply(status, payload, setCookie) {
  const headers = { "Cache-Control":"no-store", "X-Content-Type-Options":"nosniff" };
  if (setCookie) headers["Set-Cookie"] = setCookie;
  return Response.json(payload, { status, headers });
}

function cookie(value, expires) {
  return `${cookieName}=${value}; Path=/; Max-Age=${expires}; Secure; HttpOnly; SameSite=Lax`;
}

function hex(bytes) {
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}

function unhex(string) {
  return Uint8Array.from(string.match(/../g), byte => parseInt(byte, 16));
}

async function mac(env, purpose, value) {
  const key = await crypto.subtle.importKey("raw", textEncoder.encode("adigunsps:" + purpose + ":" + env.ACCOUNT_SECRET),
    { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, textEncoder.encode(value)));
}

async function sealKey(env) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode("adigunsps:challenge:" + env.ACCOUNT_SECRET));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function seal(env, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, await sealKey(env), textEncoder.encode(JSON.stringify(data)));
  return hex(iv) + "." + hex(ciphertext);
}

async function open(env, value) {
  if (!value || !/^[0-9a-f]{24}\.(?:[0-9a-f]{2}){17,1024}$/.test(value)) return null;
  try {
    const [iv, ciphertext] = value.split(".");
    const plaintext = await crypto.subtle.decrypt({ name:"AES-GCM", iv:unhex(iv) }, await sealKey(env), unhex(ciphertext));
    return JSON.parse(new TextDecoder().decode(plaintext));
  } catch {
    return null;
  }
}

