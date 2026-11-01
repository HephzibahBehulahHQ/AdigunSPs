import { supabaseClient } from "../src/supabase-client.js";

const form = document.querySelector("#reset-form");
const status = document.querySelector("#reset-status");
const submit = form.querySelector("button[type=submit]");
let recoveryAuthorized = false;
let recoveryUser = null;

function setStatus(message, kind = "") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function revealRecoveryForm(user) {
  if (!user?.id || !recoveryAuthorized) return;
  recoveryUser = user;
  form.hidden = false;
  setStatus("Enter and confirm your new password.");
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

if (!supabaseClient) {
  setStatus("Password reset is unavailable right now. Return to sign in and try again later.", "error");
} else {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
      recoveryAuthorized = true;
      revealRecoveryForm(session.user);
    }
  });

  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  const callbackHasProof = hashParams.get("type") === "recovery" && !!hashParams.get("access_token");
  supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) throw error;
    if (callbackHasProof && data?.session?.user) recoveryAuthorized = true;
    if (recoveryAuthorized) revealRecoveryForm(data?.session?.user);
    else setStatus("This recovery link is invalid or expired. Return to sign in and request a new password reset email.", "error");
  }).catch(() => setStatus("This recovery link is invalid or expired. Return to sign in and request a new password reset email.", "error"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#new-password").value;
    const confirmation = document.querySelector("#confirm-password").value;
    if (!recoveryAuthorized || !recoveryUser) {
      setStatus("This recovery link is invalid or expired. Return to sign in and request a new one.", "error");
      return;
    }
    if (password !== confirmation) {
      setStatus("The passwords do not match. Check both fields and try again.", "error");
      return;
    }
    if (password.length < 8) {
      setStatus("Choose a password with at least 8 characters.", "error");
      return;
    }
    submit.disabled = true;
    setStatus("Updating your password…");
    let error;
    try { ({ error } = await supabaseClient.auth.updateUser({ password })); }
    catch (requestError) { error = requestError; }
    if (error) {
      submit.disabled = false;
      setStatus(error.message || "Your password could not be updated. Request a new reset email and try again.", "error");
      return;
    }
    const { error: signOutError } = await supabaseClient.auth.signOut();
    if (signOutError) {
      submit.disabled = false;
      setStatus("Your password changed, but sign-out failed. Close this page and sign in again with the new password.", "error");
      return;
    }
    setStatus("Password updated. Returning you to sign in…", "success");
    setTimeout(() => location.replace(new URL("../?account=sign-in", location.href).href), 900);
  });
}
