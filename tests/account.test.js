Warning: fs was declared with const; use let for reassignable variables.
Warning: s was declared with const; use let for reassignable variables.
import assert from "node:assert/strict";
import { AccountError, createAccountService } from "../src/account.js";

const authCalls = [];
const auth = {
  signUp: async (args) => { authCalls.push(["signUp", args]); return { data:{ user:{ id:"u1" } }, error:null }; },
  signInWithPassword: async (args) => { authCalls.push(["signIn", args]); return { data:{ user:{ id:"u1", is_anonymous:false } }, error:null }; },
  resetPasswordForEmail: async (email, options) => { authCalls.push(["reset", email, options]); return { data:{}, error:null }; },
  signOut: async () => ({ data:{}, error:null }),
  getSession: async () => ({ data:{ session:{ user:{ id:"g1", is_anonymous:true } } }, error:null }),
  signInAnonymously: async () => { throw new Error("An existing guest session must be reused."); },
  updateUser: async (args) => { authCalls.push(["updateUser", args]); return { data:{ user:{ id:"u1", is_anonymous:false, email:"person@example.test", email_confirmed_at:"2030-01-01T00:00:00.000Z", user_metadata:args.data } }, error:null }; },
};
const client = { auth, from:() => { throw new Error("unexpected table query"); } };
const service = createAccountService(client);
assert.ok(service);
assert.equal(createAccountService(null), null);

await service.signUp(" user@example.test ", "not-recorded", "Tester", "https://app.example.test/");
assert.deepEqual(authCalls[0], ["signUp", { email:"user@example.test", password:"not-recorded", options:{ data:{ display_name:"Tester" }, emailRedirectTo:"https://app.example.test/" } }]);
await service.signIn(" user@example.test ", "not-recorded");
assert.deepEqual(authCalls[1], ["signIn", { email:"user@example.test", password:"not-recorded" }]);
await service.requestPasswordReset(" user@example.test ", "https://app.example.test/reset");
assert.deepEqual(authCalls[2], ["reset", "user@example.test", { redirectTo:"https://app.example.test/reset" }]);

const guest = await service.ensureGuestSession({ id:"g1", is_anonymous:true });
const reusedGuest = await service.startGuestSession();
assert.equal(guest.serverIssued, false);
assert.equal(reusedGuest.serverIssued, false, "guest access is not enforced by server expiry");
await assert.rejects(() => service.ensureGuestSession({ id:"u1", is_anonymous:false }), (error) => error.code === "guest-session-not-anonymous");
await assert.rejects(() => service.saveCloudProject({ id:"g1", is_anonymous:true }, { name:"Guest" }), (error) => error.code === "authentication-required");
await service.beginGuestUpgradeEmail({ id:"g1", is_anonymous:true }, " person@example.test ");
assert.deepEqual(authCalls.find((call) => call[0] === "updateUser")[1], { email:"person@example.test" }, "guest upgrade sends only the email in the confirmation step");
const upgradedUser = await service.setGuestUpgradePassword({ id:"u1", is_anonymous:false, email:"person@example.test", email_confirmed_at:"2030-01-01" }, "not-recorded");
assert.equal(upgradedUser.id, "u1", "password step returns the upgraded Supabase user");
assert.deepEqual(authCalls.filter((call) => call[0] === "updateUser")[1][1], { password:"not-recorded" }, "password is set in a separate post-confirmation step");
await assert.rejects(() => service.setGuestUpgradePassword({ id:"u1", is_anonymous:false, email:"person@example.test" }, "not-recorded"), (error) => error.code === "guest-upgrade-email-unverified");
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

console.log("Account auth, two-step guest upgrade and authorization boundary checks passed.");
