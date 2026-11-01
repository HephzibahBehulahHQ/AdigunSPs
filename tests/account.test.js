import assert from "node:assert/strict";
import { AccountError, accountAccessTitle, createAccountService } from "../src/account.js";

assert.equal(accountAccessTitle("member", { member:"Signed in" }), "Signed in");
assert.equal(accountAccessTitle("guest", { guest:"Guest trial" }), "Guest trial");
assert.equal(accountAccessTitle("guest-expired", { expired:"Trial ended" }), "Trial ended");
assert.equal(accountAccessTitle("account-required", { unavailable:"Sign in required" }), "Sign in required");

const authCalls = [];
const rpcCalls = [];
const auth = {
  signInWithPassword: async (args) => { authCalls.push(["signInWithPassword", args]); return { data:{ user:{ id:"u1", is_anonymous:false, email:args.email } }, error:null }; },
  signUp: async (args) => { authCalls.push(["signUp", args]); return { data:{ user:{ id:"u2", is_anonymous:false } }, error:null }; },
  resend: async (args) => { authCalls.push(["resend", args]); return { data:{}, error:null }; },
  resetPasswordForEmail: async (...args) => { authCalls.push(["resetPasswordForEmail", ...args]); return { data:{}, error:null }; },
  signOut: async () => ({ data:{}, error:null }),
  getSession: async () => ({ data:{ session:{ user:{ id:"g1", is_anonymous:true } } }, error:null }),
  signInAnonymously: async () => { throw new Error("An existing guest session must be reused."); },
  updateUser: async (args) => { authCalls.push(["updateUser", args]); return { data:{ user:{ id:"u1", is_anonymous:false, email:"person@example.test", email_confirmed_at:"2030-01-01T00:00:00.000Z", user_metadata:args.data } }, error:null }; },
};
const client = { auth, rpc:async (name) => { rpcCalls.push(name); return { data:[{ started_at:"2030-01-01T00:00:00.000Z", expires_at:"2030-01-01T00:04:00.000Z", server_now:"2030-01-01T00:00:00.000Z" }], error:null }; }, from:() => { throw new Error("unexpected table query"); } };
const service = createAccountService(client);
assert.ok(service);
assert.equal(createAccountService(null), null);

await service.signInWithPassword(" user@example.test ", "secret123");
assert.deepEqual(authCalls[0], ["signInWithPassword", { email:"user@example.test", password:"secret123" }]);
await service.signUpWithPassword(" person@example.test ", "secret123", "Tester", "https://app.example.test/");
assert.deepEqual(authCalls[1], ["signUp", { email:"person@example.test", password:"secret123", options:{ data:{ display_name:"Tester" }, emailRedirectTo:"https://app.example.test/" } }]);
await service.resendSignupConfirmation(" person@example.test ", "https://app.example.test/");
assert.deepEqual(authCalls[2], ["resend", { type:"signup", email:"person@example.test", options:{ emailRedirectTo:"https://app.example.test/" } }]);
await service.sendPasswordReset(" person@example.test ", "https://adigunsps.hephzibahbehulah.com/reset-password");
assert.deepEqual(authCalls[3], ["resetPasswordForEmail", "person@example.test", { redirectTo:"https://adigunsps.hephzibahbehulah.com/reset-password" }]);

const guest = await service.ensureGuestSession({ id:"g1", is_anonymous:true });
const reusedGuest = await service.startGuestSession();
assert.equal(guest.serverIssued, true);
assert.equal(guest.remainingMs, 4 * 60_000);
assert.equal(reusedGuest.serverIssued, true, "reused guest sessions get their original server expiry");
assert.deepEqual(rpcCalls, ["adigun_ensure_guest_session", "adigun_ensure_guest_session"]);
await assert.rejects(() => service.ensureGuestSession({ id:"u1", is_anonymous:false }), (error) => error.code === "guest-session-not-anonymous");
const expiredService = createAccountService({ ...client, rpc:async () => ({ data:[{ started_at:"2030-01-01T00:00:00.000Z", expires_at:"2030-01-01T00:04:00.000Z", server_now:"2030-01-01T00:04:00.000Z" }], error:null }) });
assert.equal((await expiredService.ensureGuestSession({ id:"g2", is_anonymous:true })).remainingMs, 0, "expired server sessions are not restarted");
await assert.rejects(() => service.saveCloudProject({ id:"g1", is_anonymous:true }, { name:"Guest" }), (error) => error.code === "authentication-required");
await service.beginGuestUpgradeEmail({ id:"g1", is_anonymous:true }, " person@example.test ", "https://app.example.test/");
assert.deepEqual(authCalls.find((call) => call[0] === "updateUser")[1], { email:"person@example.test", options:{ emailRedirectTo:"https://app.example.test/" } }, "guest upgrade sends an email-confirmation link to the app");
const duplicateAuth = { ...auth, updateUser:async () => ({ data:null, error:{ code:"email_exists", message:"Email already registered" } }) };
await assert.rejects(() => createAccountService({ auth:duplicateAuth, from:client.from }).beginGuestUpgradeEmail({ id:"g1", is_anonymous:true }, "person@example.test"), (error) => error.code === "guest-upgrade-email-exists");
assert.equal(service.isAdministrator({ is_anonymous:false, app_metadata:{ role:"admin" } }), true);
assert.equal(service.isAdministrator({ is_anonymous:false, user_metadata:{ role:"admin" } }), false);

const cloud = { projects:[], versions:[], nextId:0 };
function cloudClient() {
  return { auth, from(table) {
    const query = { table, action:null, values:null, filters:[], orderBy:null, limit:null };
    const execute = (one) => {
      let rows = cloud[table === "adigun_cloud_projects" ? "projects" : "versions"];
      if (query.action === "insert") {
        const values = Array.isArray(query.values) ? query.values : [query.values];
        rows = values.map((value) => ({ id:`cloud-${++cloud.nextId}`, created_at:"2030-01-01T00:00:00.000Z", updated_at:"2030-01-01T00:00:00.000Z", ...value }));
        cloud[table === "adigun_cloud_projects" ? "projects" : "versions"].push(...rows);
      }
      for (const [key, value] of query.filters) rows = rows.filter((row) => row[key] === value);
      if (query.orderBy) rows = [...rows].sort((a,b) => String(b[query.orderBy] || "").localeCompare(String(a[query.orderBy] || "")));
      if (query.limit != null) rows = rows.slice(0, query.limit);
      return { data:one ? (rows[0] || null) : rows, error:null };
    };
    const builder = {
      select() { query.action ||= "select"; return builder; },
      insert(values) { query.action = "insert"; query.values = values; return builder; },
      update(values) { query.action = "update"; query.values = values; return builder; },
      delete() { query.action = "delete"; return builder; },
      eq(key,value) { query.filters.push([key,value]); return builder; },
      order(key) { query.orderBy = key; return builder; },
      limit(value) { query.limit = value; return builder; },
      single() { return Promise.resolve(execute(true)); },
      maybeSingle() { return Promise.resolve(execute(true)); },
      then(resolve,reject) { return Promise.resolve(execute(false)).then(resolve,reject); },
    };
    return builder;
  } };
}
const cloudService = createAccountService(cloudClient());
const cloudUser = { id:"member-1", is_anonymous:false };
const saved = await cloudService.saveCloudProject(cloudUser, { name:"Pump station", version:1 });
assert.equal(saved.title, "Pump station");
assert.equal(cloud.projects[0].user_id, cloudUser.id, "cloud project records bind to the authenticated owner");
assert.deepEqual(cloud.versions[0].payload, { name:"Pump station", version:1 });
assert.equal(cloud.versions[0].user_id, cloudUser.id, "cloud project snapshots bind to the authenticated owner");
assert.deepEqual((await cloudService.listCloudProjects(cloudUser)).map(({ title }) => title), ["Pump station"]);
const opened = await cloudService.openCloudProject(cloudUser, saved.id);
assert.deepEqual(opened.payload, { name:"Pump station", version:1 }, "cloud open retrieves the newest owned project snapshot");

let avatarProfile = { user_id:cloudUser.id, display_name:"", avatar_path:null };
const avatarCalls = [];
const avatarClient = {
  auth,
  from(table) {
    assert.equal(table, "adigun_profiles");
    const query = { action:"select", values:null };
    const builder = {
      select() { return builder; },
      insert(values) { query.action = "insert"; query.values = values; return builder; },
      update(values) { query.action = "update"; query.values = values; return builder; },
      eq() { return builder; },
      maybeSingle() { return Promise.resolve({ data:avatarProfile, error:null }); },
      single() { avatarProfile = { ...avatarProfile, ...query.values }; return Promise.resolve({ data:avatarProfile, error:null }); },
    };
    return builder;
  },
  storage: { from(bucket) {
    assert.equal(bucket, "adigun-avatars");
    return {
      async createSignedUrl(path, expiresIn) { avatarCalls.push(["sign", path, expiresIn]); return { data:{ signedUrl:`https://storage.example.test/${path}?token=signed` }, error:null }; },
      async upload(path, file, options) { avatarCalls.push(["upload", path, file.type, options]); return { data:{ path }, error:null }; },
      async remove(paths) { avatarCalls.push(["remove", paths[0]]); return { data:[], error:null }; },
    };
  } },
};
const avatarService = createAccountService(avatarClient);
assert.equal((await avatarService.getProfile(cloudUser)).avatar_url, null, "profiles without a picture have no signed image URL");
const uploadedAvatar = await avatarService.uploadAvatar(cloudUser, { type:"image/png", size:16 });
assert.match(uploadedAvatar.avatar_path, new RegExp(`^${cloudUser.id}/avatar-[^/]+\\.png$`), "new uploads use a fresh per-user path to avoid stale image caches");
assert.equal(uploadedAvatar.avatar_url, `https://storage.example.test/${uploadedAvatar.avatar_path}?token=signed`, "saved private avatar paths resolve to short-lived signed URLs");
assert.deepEqual(avatarCalls.filter(([kind]) => kind === "sign").map(([, , expires]) => expires), [3600], "signed avatar URLs expire after one hour");
const replacedAvatar = await avatarService.uploadAvatar(cloudUser, { type:"image/png", size:16 });
assert.notEqual(replacedAvatar.avatar_path, uploadedAvatar.avatar_path, "replacing an avatar produces a cache-safe object path");
assert.ok(avatarCalls.some(([kind, path]) => kind === "remove" && path === uploadedAvatar.avatar_path), "the previous avatar object is removed after replacement");
assert.equal(avatarProfile.avatar_path, replacedAvatar.avatar_path, "the profile row stores the current avatar object path");
assert.equal((await avatarService.getProfile({ ...cloudUser, id:"other-user" })).avatar_url, null, "avatar paths outside the signed-in user's folder are never signed");
const failedAvatarLookup = createAccountService({ ...avatarClient, storage:{ from:() => ({ createSignedUrl:async () => { throw new Error("temporary storage error"); } }) } });
assert.equal((await failedAvatarLookup.getProfile(cloudUser)).avatar_url, null, "temporary signed-URL errors preserve the default avatar fallback");

console.log("Password auth, recovery email, guest identity upgrade and authorization boundary checks passed.");


