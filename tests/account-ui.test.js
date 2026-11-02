import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/app.js", "utf8");
const service = readFileSync("src/account.js", "utf8");
const resetPage = readFileSync("reset-password/index.html", "utf8");
const resetScript = readFileSync("reset-password/reset-password.js", "utf8");
const accountCopy = app.slice(app.indexOf("const accountCopy ="), app.indexOf("function accountText"));
const formStart = app.indexOf('const authForm = ');
const formEnd = app.indexOf(";", formStart);
assert.ok(formStart >= 0 && formEnd > formStart, "account form template exists");
const form = app.slice(formStart, formEnd);
assert.match(form, /id="accountEmail"/);
assert.match(form, /id="accountPassword"[\s\S]*?id="accountSendReset"[\s\S]*?accountAuthText\("forgotPassword"\)/);
assert.doesNotMatch(form, /accountOtp|one-time-code|sign-in link|Magic Link/i, "main login has no OTP or magic-link flow");
assert.match(service, /client\.auth\.signInWithPassword\(\{ email:email\.trim\(\), password \}\)/, "sign-in uses email and password");
assert.match(service, /client\.auth\.signUp\(\{ email:email\.trim\(\), password,/s, "registration uses email and password");
assert.match(service, /client\.auth\.resetPasswordForEmail\(email\.trim\(\), redirectTo \? \{ redirectTo \} : undefined\)/, "recovery uses Supabase password reset email");
assert.match(app, /https:\/\/adigunsps\.hephzibahbehulah\.com\/reset-password/, "recovery callback targets the custom domain route");
assert.match(app, /const emailRedirectTo = "https:\/\/adigunsps\.hephzibahbehulah\.com\/"/, "signup confirmations use the custom domain");
assert.doesNotMatch(`${app}\n${service}`, /hephzibahbehulahhq\.github\.io/i, "authentication callbacks contain no GitHub Pages URLs");
assert.match(resetScript, /event === "PASSWORD_RECOVERY"/);
assert.match(resetScript, /auth\.updateUser\(\{ password \}\)/, "recovery page changes the password through the authenticated recovery session");
assert.match(resetPage, /id="new-password"[\s\S]*id="confirm-password"/);
assert.match(app, /get\("account"\) === "sign-in"[\s\S]*setAccountAccess\("account-required"\)/, "post-reset return opens the sign-in flow without creating a guest session");
assert.match(app, /accountService\.beginGuestUpgradeEmail\(accountUser, email, emailRedirectTo\)/, "guest conversion keeps the existing anonymous identity");
for (const locale of ["en", "de", "yo", "pcm"]) {
  const entry = accountCopy.match(new RegExp(`${locale}:\\{[^\\n]+`))?.[0] || "";
  assert.match(entry, /4 minutes|4 Minuten|ìṣẹ́jú mẹ́rin/, `${locale} account copy describes the four-minute guest session`);
}
assert.doesNotMatch(app, /accountUpgradeEmail|accountPasswordVisibility|accountSaveNewPassword|passwordRecoveryStorageKey|clearPasswordRecoveryPending/, "obsolete OTP and inline recovery controls are absent from the interface code");
console.log("Password account UI, custom-domain callbacks, recovery route, guest-preservation, and locale checks passed.");


assert.match(app, /id="accountCloudProjectName"[^>]*maxlength="120"[^>]*required/);
const cloudSaveHandler = app.slice(app.indexOf('$("#accountCloudSave")?.addEventListener'), app.indexOf('$("#accountCloudRefresh")?.addEventListener'));
assert.doesNotMatch(cloudSaveHandler, /prompt\(/, "cloud naming works without native browser prompts");
assert.match(cloudSaveHandler, /reportValidity\(\)/, "blank cloud names are rejected before saving");
assert.match(cloudSaveHandler, /saveCloudProject[\s\S]*loadCloudProjectList/, "successful writes refresh the cloud listing");

assert.doesNotMatch(app, /latest\?\.version \|\| 0/, "cloud list does not fabricate version zero when version metadata is absent");
