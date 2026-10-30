export class AccountError extends Error {
  constructor(code, message) { super(message); this.name = "AccountError"; this.code = code; }
}

function requireResult(result) {
  if (result?.error) throw result.error;
  return result?.data;
}

function requirePermanentUser(user) {
  if (!user?.id || user.is_anonymous) throw new AccountError("authentication-required", "Sign in with a verified account to use this feature.");
  return user;
}

export function createAccountService(client) {
  if (!client?.auth || typeof client.from !== "function") return null;

  return {
    signUp(email, password, displayName = "", emailRedirectTo) {
      return client.auth.signUp({ email:email.trim(), password, options:{ data:{ display_name:displayName.trim().slice(0, 120) }, ...(emailRedirectTo ? { emailRedirectTo } : {}) } });
    },
    signIn(email, password) { return client.auth.signInWithPassword({ email:email.trim(), password }); },
    signOut() { return client.auth.signOut(); },
    requestPasswordReset(email, redirectTo) {
      return client.auth.resetPasswordForEmail(email.trim(), redirectTo ? { redirectTo } : undefined);
    },
    async ensureGuestSession(user) {
      if (!user?.id || !user.is_anonymous) throw new AccountError("guest-session-not-anonymous", "A guest session requires a Supabase anonymous user.");
      const existing = requireResult(await client.from("adigun_guest_sessions").select("expires_at").eq("user_id", user.id).maybeSingle());
      if (existing) {
        if (Date.parse(existing.expires_at) <= Date.now()) throw new AccountError("guest-session-expired", "The 10-minute guest session has expired.");
        return { expiresAt:existing.expires_at, serverIssued:true };
      }
      const created = requireResult(await client.from("adigun_guest_sessions").insert({ user_id:user.id }).select("expires_at").single());
      if (!created?.expires_at) throw new AccountError("guest-session-unavailable", "The server did not issue a guest-session expiry.");
      return { expiresAt:created.expires_at, serverIssued:true };
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
      return profile;
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
      await this.getProfile(member);
      if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
        throw new AccountError("invalid-avatar", "Choose a JPG, PNG or WebP image smaller than 3 MB.");
      }
      const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = `${member.id}/avatar.${ext}`;
      requireResult(await client.storage.from("adigun-avatars").upload(path, file, { upsert:true, contentType:file.type }));
      const profile = requireResult(await client.from("adigun_profiles").update({ avatar_path:path, updated_at:new Date().toISOString() }).eq("user_id", member.id).select("user_id,avatar_path,updated_at").single());
      return profile;
    },
    async listCloudProjects(user) {
      const member = requirePermanentUser(user);
      return requireResult(await client.from("adigun_cloud_projects").select("id,title,created_at,updated_at").eq("owner_id", member.id).order("updated_at", { ascending:false }));
    },
    async saveCloudProject(user, project) {
      const member = requirePermanentUser(user);
      if (!project || typeof project !== "object" || Array.isArray(project)) throw new AccountError("invalid-project", "A valid AdigunSPs project is required.");
      const title = String(project.name || project.title || "Untitled project").trim().slice(0, 160) || "Untitled project";
      const row = requireResult(await client.from("adigun_cloud_projects").insert({ owner_id:member.id, title }).select("id,title,created_at,updated_at").single());
      const saved = await client.from("adigun_cloud_project_versions").insert({ project_id:row.id, owner_id:member.id, version:1, payload:project });
      if (saved.error) {
        await client.from("adigun_cloud_projects").delete().eq("id", row.id);
        throw saved.error;
      }
      return { ...row, version:1, payload:project };
    },
    async openCloudProject(user, projectId) {
      const member = requirePermanentUser(user);
      const row = requireResult(await client.from("adigun_cloud_projects").select("id,title,updated_at").eq("owner_id", member.id).eq("id", projectId).single());
      const version = requireResult(await client.from("adigun_cloud_project_versions").select("version,payload,created_at").eq("owner_id", member.id).eq("project_id", projectId).order("version", { ascending:false }).limit(1).single());
      return { ...row, ...version };
    },
    isAdministrator(user) { return !!user && !user.is_anonymous && user.app_metadata?.role === "admin"; },
    async listProfilesForAdministrator(user) {
      if (!this.isAdministrator(user)) throw new AccountError("administrator-required", "Administrator access is not available for this account.");
      return requireResult(await client.from("adigun_profiles").select("user_id,display_name,created_at,updated_at").order("created_at", { ascending:false }));
    },
  };
}
