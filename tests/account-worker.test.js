import assert from "node:assert/strict";
import { test, mock } from "node:test";
import worker from "../cloudflare/adigun-account-worker.js";

const origin = "https://preview.example.com";
const email = "reader@example.com";
const password = "A separate SPS password";
const env = {
  SUPABASE_URL:"https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY:"test-key",
  ACCOUNT_SECRET:"test-encryption-key",
  ACCOUNT_RPC_PROOF:"test-rpc-proof",
  ACCOUNT_LIMITER:{ limit:async () => ({ success:true }) }
};

function post(data, cookie = "", from = origin) {
  return worker.fetch(new Request(origin + "/api/account", {
    method:"POST", headers:{ Origin:from, Cookie:cookie, "Content-Type":"application/json" },
    body:JSON.stringify(data)
  }), env);
}
const begin = (mode, value = password) => post({ step:"begin", mode, email, password:value });
const verify = (cookie, code = "123456") => post({ step:"verify", code }, cookie);
const cookieFrom = response => response.headers.get("Set-Cookie").split(";")[0];

test("product registration and every sign-in require email OTP before releasing a session", async () => {
  let account;
  let sent = 0;
  const mocked = mock.method(globalThis, "fetch", async (url, init) => {
    const payload = JSON.parse(init.body);
    if (url.pathname === "/auth/v1/otp") {
      assert.equal(payload.email, email);
      assert.equal(payload.create_user, !account);
      sent++;
      return Response.json({});
    }
    if (url.pathname === "/auth/v1/verify") {
      assert.equal(payload.email, email);
      if (payload.token !== "123456") return Response.json({}, { status:403 });
      return Response.json({ access_token:"auth-access", refresh_token:"auth-refresh",
        user:{ id:"test", email, email_confirmed_at:"2026-11-22" } });
    }
    assert.equal(init.headers["Content-Profile"], "adigunsps");
    assert.equal(payload.worker_proof, env.ACCOUNT_RPC_PROOF);
    assert.match(payload.password_proof, /^[a-f0-9]{64}$/);
    if (url.pathname.endsWith("/adigun_check_product_password")) {
      assert.equal(init.headers.Authorization, undefined);
      return Response.json(account === payload.password_proof);
    }
    assert.equal(init.headers.Authorization, "Bearer auth-access");
    if (url.pathname.endsWith("/adigun_activate_product_account")) {
      account = payload.password_proof;
      return Response.json(true);
    }
    if (url.pathname.endsWith("/adigun_reset_product_password")) {
      account = payload.password_proof;
      return Response.json(true);
    }
    assert.ok(url.pathname.endsWith("/adigun_verify_product_session"));
    return Response.json(account === payload.password_proof);
  });
  try {
    assert.equal((await post({step:"begin"}, "", "https://another-product.example.com")).status, 403);
    assert.equal((await begin("sign-in")).status, 401);
    assert.equal(sent, 0);
    assert.equal((await verify("")).status, 400);

    const registration = await begin("register");
    assert.deepEqual(await registration.json(), {step:"verify"});
    assert.match(registration.headers.get("Set-Cookie"), /Secure; HttpOnly; SameSite=Lax/);
    assert.equal(account, undefined);
    const challenge = cookieFrom(registration);
    const tampered = challenge.slice(0, -1) + (challenge.endsWith("0") ? "1" : "0");
    assert.equal((await verify(tampered)).status, 400);
    assert.equal((await verify(challenge, "000000")).status, 401);
    const activated = await verify(challenge);
    assert.deepEqual(await activated.json(), {step:"registered"});
    assert.ok(account);

    assert.equal((await begin("sign-in", "An unrelated password")).status, 401);
    assert.equal(sent, 1);
    const login = await begin("sign-in");
    assert.deepEqual(await login.json(), {step:"verify"});
    assert.equal(sent, 2);
    const signedIn = await verify(cookieFrom(login));
    assert.equal(signedIn.headers.get("Cache-Control"), "no-store");
    assert.match(signedIn.headers.get("Set-Cookie"), /Max-Age=0/);
    assert.deepEqual(await signedIn.json(), {step:"signed-in", session:{access_token:"auth-access", refresh_token:"auth-refresh"}});
    const replacement = "New product password 222";
    const recovery = await begin("reset-password", replacement);
    assert.deepEqual(await recovery.json(), {step:"verify"});
    assert.equal((await verify(cookieFrom(recovery), "000000")).status, 401);
    assert.deepEqual(await (await verify(cookieFrom(recovery))).json(), {step:"password-reset"});
    assert.equal((await begin("sign-in")).status, 401);
    assert.equal((await begin("sign-in", replacement)).status, 200);
  } finally {
    mocked.mock.restore();
  }
});


test("only the configured Admin origin can request an admin-only session", async () => {
  const adminOrigin = "https://admin.example.com";
  const bindings = { ...env, ACCOUNT_ADMIN_ORIGIN:adminOrigin };
  let adminRole = false;
  let verified = 0;
  const provider = mock.method(globalThis, "fetch", async url => {
    if (url.pathname === "/auth/v1/otp") return Response.json({});
    if (url.pathname === "/auth/v1/verify") return Response.json({
      access_token:"admin-test-access", refresh_token:"admin-test-refresh", expires_in:3600,
      user:{ id:"admin-fixture", email, email_confirmed_at:"2026-11-22", app_metadata:{ role:adminRole ? "admin" : "member" } }
    });
    if (url.pathname.endsWith("/adigun_verify_product_session")) verified++;
    return Response.json(true);
  });
  const send = (from, body, cookie = "") => worker.fetch(new Request(origin + "/api/account", {
    method:body ? "POST" : "OPTIONS",
    headers:{ Origin:from, Cookie:cookie, "Content-Type":"application/json" },
    body:body ? JSON.stringify(body) : undefined
  }), bindings);
  try {
    assert.equal((await send("https://other.example.com")).status, 403);
    const allowed = await send(adminOrigin);
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), adminOrigin);
    assert.equal(allowed.headers.get("Access-Control-Allow-Credentials"), "true");
    assert.equal((await send(adminOrigin, {step:"begin",mode:"register",email,password})).status, 403);
    const start = {step:"begin",mode:"sign-in",email,password};
    const complete = {step:"verify",code:"123456"};
    const challenge = cookieFrom(await send(adminOrigin, start));
    assert.equal((await send(origin, complete, challenge)).status, 400);
    assert.equal((await send(adminOrigin, complete, challenge)).status, 403);
    assert.equal(verified, 0);
    adminRole = true;
    const admin = await send(adminOrigin, complete, cookieFrom(await send(adminOrigin, start)));
    const result = await admin.json();
    assert.equal(result.step, "signed-in");
    assert.equal(result.session.user.role, "admin");
    assert.equal(result.session.expires_in, 3600);
    assert.equal(result.session.refresh_token, undefined);
    assert.equal(verified, 1);
  } finally {
    provider.mock.restore();
  }
});
