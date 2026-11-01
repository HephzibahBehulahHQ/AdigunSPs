import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync("src/app.js", "utf8");
const service = readFileSync("src/account.js", "utf8");
const accountCopy = app.slice(app.indexOf("const accountCopy ="), app.indexOf("function accountText"));
const formStart = app.indexOf('const authForm = `');
const formEnd = app.indexOf(";", formStart);
assert.ok(formStart >= 0 && formEnd > formStart, "account form template exists");
const form = app.slice(formStart, formEnd);
assert.equal((form.match(/id="accountEmail"/g) || []).length, 1, "account modal has one email field shared by guest and member flows");
assert.match(form, /id="accountOtp"[\s\S]*?autocomplete="one-time-code"/, "OTP input supports browser one-time-code autofill");
assert.doesNotMatch(form, /accountPassword|guestUpgradeEmail|Send confirmation email|Reset password/, "password and duplicate-email controls are removed");
assert.match(service, /client\.auth\.signInWithOtp\(/, "sign-in and registration use Supabase email OTP");
assert.match(service, /client\.auth\.verifyOtp\(\{ email:email\.trim\(\), token:String\(token\)\.trim\(\), type \}\)/, "email OTP is verified through Supabase");
assert.match(app, /accountService\.verifyEmailOtp\(pending\.email, token, pending\.type\)/, "verification preserves email versus guest email-change OTP types");
assert.match(app, /accountService\.beginGuestUpgradeEmail\(accountUser, email\)/, "guest conversion keeps the existing anonymous identity");
for (const locale of ["en", "de", "yo", "pcm"]) {
  const entry = accountCopy.match(new RegExp(`${locale}:\\{[^\\n]+`))?.[0] || "";
  assert.match(entry, /4 minutes|4 Minuten|ìṣẹ́jú mẹ́rin/, `${locale} account copy describes the four-minute guest session`);
  assert.match(entry, /6-digit|6-stelligen|nọ́ńbà mẹ́fà/, `${locale} account copy provides localized email-code guidance`);
}
assert.doesNotMatch(app, /accountUpgradeEmail|guestUpgradeEmail|accountPasswordVisibility|accountReset/, "obsolete password and duplicate-email controls are absent from the interface code");
console.log("Account UI email OTP, single-email-field, guest-preservation, and locale checks passed.");

