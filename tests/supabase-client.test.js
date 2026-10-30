import assert from "node:assert/strict";
import { createAdigunSupabaseClient, ADIGUN_SUPABASE_URL, ADIGUN_SUPABASE_PROJECT_REF } from "../src/supabase-client.js";

let createCalls = 0;
let received;
const sdk = { createClient: (...args) => { createCalls += 1; received = args; return { marker:"client" }; } };
const config = (url = ADIGUN_SUPABASE_URL, publishableKey = "sb_publishable_test") => ({ supabase:{ url, publishableKey } });

const missing = createAdigunSupabaseClient(config(ADIGUN_SUPABASE_URL, ""), sdk);
assert.equal(missing.client, null);
assert.equal(missing.status.reason, "missing-publishable-key");

const wrongProject = createAdigunSupabaseClient(config("https://vnckoocsookbaqalybje.supabase.co", "sb_publishable_test"), sdk);
assert.equal(wrongProject.client, null);
assert.equal(wrongProject.status.reason, "unexpected-project-url");

const secret = createAdigunSupabaseClient(config(ADIGUN_SUPABASE_URL, "sb_secret_do_not_use"), sdk);
assert.equal(secret.client, null);
assert.equal(secret.status.reason, "server-secret-rejected");

const serviceRolePayload = Buffer.from(JSON.stringify({ role:"service_role" })).toString("base64url");
const legacyServiceRole = createAdigunSupabaseClient(config(ADIGUN_SUPABASE_URL, `eyJhbGciOiJIUzI1NiJ9.${serviceRolePayload}.signature`), sdk);
assert.equal(legacyServiceRole.client, null);
assert.equal(legacyServiceRole.status.reason, "server-secret-rejected");

const ready = createAdigunSupabaseClient(config(), sdk);
assert.deepEqual(ready.status, { ready:true, projectRef:ADIGUN_SUPABASE_PROJECT_REF, reason:"ready" });
assert.equal(ready.client.marker, "client");
assert.equal(createCalls, 1);
assert.equal(received[0], ADIGUN_SUPABASE_URL);
assert.equal(received[1], "sb_publishable_test");
assert.deepEqual(received[2].auth, { autoRefreshToken:true, persistSession:true, detectSessionInUrl:true });

const noSdk = createAdigunSupabaseClient(config(), null);
assert.equal(noSdk.client, null);
assert.equal(noSdk.status.reason, "sdk-unavailable");

console.log("Supabase client configuration safety checks passed.");
