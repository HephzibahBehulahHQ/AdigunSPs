export class AccountError extends Error {
  constructor(code, message) { super(message); this.name = "AccountError"; this.code = code; }
}

export function accountAccessTitle(state, labels) {
  if (state === "member") return labels.member;
  if (state === "guest") return labels.guest;
  if (state === "guest-expired") return labels.expired;
  return labels.unavailable;
}

function requireResult(result) {
  if (result?.error) throw result.error;
  return result?.data;
}

async function signedAvatarUrl(client, userId, path) {
  if (!path || !path.startsWith(`${userId}/`) || !client.storage?.from) return null;
  try {
    const result = await client.storage.from("adigun-avatars").createSignedUrl(path, 3600);
    return result?.error ? null : result?.data?.signedUrl || null;
  } catch { return null; }
}

function requirePermanentUser(user) {
  if (!user?.id || user.is_anonymous) throw new AccountError("authentication-required", "Sign in with a verified account to use this feature.");
  return user;
}

export function createAccountService(client) {
  if (!client?.auth || typeof client.from !== "function") return null;

  return {
    signInWithPassword(email, password) {
      return client.auth.signInWithPassword({ email:email.trim(), password });
    },
    signUpWithPassword(email, password, displayName = "", emailRedirectTo) {
      return client.auth.signUp({ email:email.trim(), password, options:{ ...(displayName.trim() ? { data:{ display_name:displayName.trim().slice(0, 120) } } : {}), ...(emailRedirectTo ? { emailRedirectTo } : {}) } });
    },
    resendSignupConfirmation(email, emailRedirectTo) {
      return client.auth.resend({ type:"signup", email:email.trim(), ...(emailRedirectTo ? { options:{ emailRedirectTo } } : {}) });
    },
    sendPasswordReset(email, redirectTo) {
      return client.auth.resetPasswordForEmail(email.trim(), redirectTo ? { redirectTo } : undefined);
    },
    async setPassword(user, password) {
      requirePermanentUser(user);
      return client.auth.updateUser({ password });
    },
    signOut() { return client.auth.signOut(); },
    async beginGuestUpgradeEmail(user, email, emailRedirectTo) {
      if (!user?.id || !user.is_anonymous) throw new AccountError("guest-upgrade-not-guest", "Only a guest session can be upgraded.");
      const result = await client.auth.updateUser({ email:email.trim(), ...(emailRedirectTo ? { options:{ emailRedirectTo } } : {}) });
      if (result.error) {
        if (["email_exists", "user_already_exists", "identity_already_exists"].includes(result.error.code) || /already (?:registered|in use)|email.*already/i.test(result.error.message || "")) {
          throw new AccountError("guest-upgrade-email-exists", "That email already has an account. Sign in to that account instead.");
        }
        throw result.error;
      }
      return result.data;
    },
    resendGuestUpgradeEmail(email, emailRedirectTo) {
      return client.auth.resend({ type:"email_change", email:email.trim(), ...(emailRedirectTo ? { options:{ emailRedirectTo } } : {}) });
    },
    async finishGuestUpgrade(user, password) {
      if (!user?.id || !user.is_anonymous || !user.email || !(user.email_confirmed_at || user.confirmed_at)) {
        throw new AccountError("guest-upgrade-email-unverified", "Confirm the email address before setting a password.");
      }
      const updated = requireResult(await client.auth.updateUser({ password }));
      const signedIn = await client.auth.signInWithPassword({ email:user.email, password });
      if (signedIn?.error) throw signedIn.error;
      return signedIn?.data || updated;
    },
    async ensureGuestSession(user) {
      if (!user?.id || !user.is_anonymous) throw new AccountError("guest-session-not-anonymous", "Guest access requires a valid temporary guest account.");
      if (typeof client.rpc !== "function") throw new AccountError("guest-session-unavailable", "Guest access could not be verified by the account service.");
      const result = requireResult(await client.rpc("adigun_ensure_guest_session"));
      const row = Array.isArray(result) ? result[0] : result;
      const startedAt = Date.parse(row?.started_at), expiresAt = Date.parse(row?.expires_at), serverNow = Date.parse(row?.server_now);
      if (![startedAt, expiresAt, serverNow].every(Number.isFinite) || expiresAt <= startedAt || expiresAt - startedAt > 4 * 60_000 + 5_000) throw new AccountError("guest-session-invalid", "The account service returned an invalid guest session.");
      return { startedAt, expiresAt, serverNow, remainingMs:Math.max(0, expiresAt - serverNow), serverIssued:true };
    },
    async startGuestSession() {
      const current = requireResult(await client.auth.getSession());
      if (current?.session?.user?.is_anonymous) return this.ensureGuestSession(current.session.user);
      if (current?.session?.user) throw new AccountError("account-already-signed-in", "A permanent account is already signed in.");
      const result = requireResult(await client.auth.signInAnonymously());
      return this.ensureGuestSession(result?.user || result?.session?.user);
    },
    async getProfile(user) {
      const member = requirePermanentUser(user);
      let profile = requireResult(await client.from("adigun_profiles").select("user_id,display_name,avatar_path,created_at,updated_at").eq("user_id", member.id).maybeSingle());
      if (!profile) profile = requireResult(await client.from("adigun_profiles").insert({ user_id:member.id, display_name:member.user_metadata?.display_name || "" }).select("user_id,display_name,avatar_path,created_at,updated_at").single());
      return { ...profile, avatar_url:await signedAvatarUrl(client, member.id, profile.avatar_path) };
    },
    async updateProfile(user, displayName) {
      const member = requirePermanentUser(user);
      await this.getProfile(member);
      const name = String(displayName || "").trim().slice(0, 120);
      const profile = requireResult(await client.from("adigun_profiles").update({ display_name:name, updated_at:new Date().toISOString() }).eq("user_id", member.id).select("user_id,display_name,avatar_path,updated_at").single());
      const authUpdate = await client.auth.updateUser({ data:{ display_name:name } });
      if (authUpdate.error) throw authUpdate.error;
      return profile;
    },
    async uploadAvatar(user, file) {
      const member = requirePermanentUser(user);
      const previous = await this.getProfile(member);
      if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
        throw new AccountError("invalid-avatar", "Choose a JPG, PNG or WebP image smaller than 3 MB.");
      }
      const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const path = `${member.id}/avatar-${fileId}.${ext}`;
      requireResult(await client.storage.from("adigun-avatars").upload(path, file, { upsert:true, contentType:file.type }));
      const profile = requireResult(await client.from("adigun_profiles").update({ avatar_path:path, updated_at:new Date().toISOString() }).eq("user_id", member.id).select("user_id,avatar_path,updated_at").single());
      if (previous.avatar_path?.startsWith(`${member.id}/`)) {
        try { await client.storage.from("adigun-avatars").remove([previous.avatar_path]); } catch {}
      }
      return { ...profile, avatar_url:await signedAvatarUrl(client, member.id, path) };
    },
    async listCloudProjects(user) {
      const member = requirePermanentUser(user);
      return requireResult(await client.from("adigun_cloud_projects").select("id,title,created_at,updated_at").eq("user_id", member.id).order("updated_at", { ascending:false }));
    },
    async saveCloudProject(user, project) {
      const member = requirePermanentUser(user);
      if (!project || typeof project !== "object" || Array.isArray(project)) throw new AccountError("invalid-project", "A valid AdigunSPs project is required.");
      const title = String(project.name || project.title || "Untitled project").trim().slice(0, 160) || "Untitled project";
      const row = requireResult(await client.from("adigun_cloud_projects").insert({ user_id:member.id, title }).select("id,title,created_at,updated_at").single());
      const saved = await client.from("adigun_cloud_project_versions").insert({ project_id:row.id, user_id:member.id, version:1, payload:project });
      if (saved.error) {
        await client.from("adigun_cloud_projects").delete().eq("id", row.id).eq("user_id", member.id);
        throw saved.error;
      }
      return { ...row, version:1, payload:project };
    },
    async openCloudProject(user, projectId) {
      const member = requirePermanentUser(user);
      const row = requireResult(await client.from("adigun_cloud_projects").select("id,title,updated_at").eq("user_id", member.id).eq("id", projectId).single());
      const version = requireResult(await client.from("adigun_cloud_project_versions").select("version,payload,created_at").eq("user_id", member.id).eq("project_id", projectId).order("version", { ascending:false }).limit(1).single());
      return { ...row, ...version };
    },
    async submitRecipeApproval(user, projectName, recipe) {
      requirePermanentUser(user);
      if (!recipe?.name?.trim() || !Number.isInteger(recipe.version) || recipe.version < 1 || !recipe.values || typeof recipe.values !== "object" || Array.isArray(recipe.values) || !Object.keys(recipe.values).length || Object.values(recipe.values).some(value => typeof value !== "boolean" && (typeof value !== "number" || !Number.isFinite(value)))) throw new AccountError("invalid-recipe", "A named, versioned recipe with typed input values is required.");
      return requireResult(await client.from("adigun_recipe_submissions").insert({ project_name:String(projectName || "").trim().slice(0,160), recipe_name:recipe.name.trim().slice(0,120), recipe_version:recipe.version, recipe_values:structuredClone(recipe.values) }).select("id,recipe_name,recipe_version,submitted_at").single());
    },
    async listRecipeApprovals(user) {
      requirePermanentUser(user);
      return requireResult(await client.from("adigun_recipe_submissions").select("id,user_id,project_name,recipe_name,recipe_version,recipe_values,submitted_at,adigun_recipe_decisions(reviewer_id,decision,comment,decided_at)").order("submitted_at", { ascending:false }).limit(100));
    },
    async decideRecipeApproval(user, submissionId, decision, comment = "") {
      requirePermanentUser(user);
      if (!this.isAdministrator(user)) throw new AccountError("administrator-required", "Administrator review is required.");
      if (!["approved","rejected"].includes(decision)) throw new AccountError("invalid-decision", "Choose approved or rejected.");
      return requireResult(await client.from("adigun_recipe_decisions").insert({ submission_id:submissionId,decision,comment:String(comment).trim().slice(0,1000) }).select("submission_id,reviewer_id,decision,decided_at").single());
    },
    async getApprovedRecipe(user, submissionId) {
      requirePermanentUser(user);
      const row = requireResult(await client.from("adigun_recipe_submissions").select("id,recipe_name,recipe_version,recipe_values,adigun_recipe_decisions(decision,reviewer_id,decided_at)").eq("id",submissionId).single());
      const decision = Array.isArray(row.adigun_recipe_decisions) ? row.adigun_recipe_decisions[0] : row.adigun_recipe_decisions;
      if (decision?.decision !== "approved") throw new AccountError("approval-required", "This recipe has not been approved.");
      return { id:row.id,name:row.recipe_name,version:row.recipe_version,values:structuredClone(row.recipe_values),approval:{reviewerId:decision.reviewer_id,decidedAt:decision.decided_at} };
    },
    isAdministrator(user) { return !!user && !user.is_anonymous && user.app_metadata?.role === "admin"; },
    async listProfilesForAdministrator(user) {
      if (!this.isAdministrator(user)) throw new AccountError("administrator-required", "Administrator access is not available for this account.");
      return requireResult(await client.from("adigun_profiles").select("user_id,display_name,created_at,updated_at").order("created_at", { ascending:false }));
    },
  };
}


