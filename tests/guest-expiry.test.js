import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/app.js", "utf8");
const account = readFileSync("src/account.js", "utf8");
const migration = readFileSync("supabase/migrations/20261101151429_adigunsps_four_minute_guest_access.sql", "utf8");
const enforcement = readFileSync("supabase/migrations/20261101085102_enforce_guest_session_expiry.sql", "utf8");
const guide = readFileSync("docs/HELP.md", "utf8");
const quickstart = readFileSync("docs/QUICKSTART.md", "utf8");

assert.match(account, /client\.rpc\("adigun_ensure_guest_session"\)/, "guest expiry comes from Supabase");
assert.match(account, /remainingMs:Math\.max\(0, expiresAt - serverNow\)/, "client countdown uses server timestamps");
assert.match(migration, /interval '4 minutes'/i);
assert.match(migration, /on conflict \(user_id\) do nothing/i, "refresh cannot restart an existing guest window");
assert.match(enforcement, /revoke insert, update, delete[\s\S]*adigun_guest_sessions/i, "the expiry row is immutable to clients");
assert.match(app, /sessionStorage\.setItem\(guestDraftStorageKey/);
assert.match(app, /accountAccess !== "member"\) \{ showAccount\(\); return false; \}/, "permanent project export requires authentication");
assert.match(app, /accountAccess === "guest-expired"/);
assert.match(app, /guestExpiryNotice/);
assert.match(guide, /four-minute guest-access countdown/i);
assert.match(quickstart, /four minutes/i);
assert.doesNotMatch(app, /5\s*\*\s*60_000/);
console.log("PASS: server-issued four-minute guest expiry, immutable session records, temporary drafts, edit gate, and guide wording");

