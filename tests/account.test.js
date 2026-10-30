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
  updateUser: async (args) => ({ data:{ user:{ id:"u1", user_metadata:args.data } }, error:null }),
};
let sessionInsert = null;
let existingGuest = null;
const guestQuery = {
  select: () => guestQuery,
  eq: () => guestQuery,
  maybeSingle: async () => ({ data:existingGuest, error:null }),
  insert: (row) => { sessionInsert = row; return guestQuery; },
  single: async () => ({ data:{ expires_at:"2030-01-01T00:10:00.000Z" }, error:null }),
};
const client = { auth, from:(name) => { assert.equal(name, "adigun_guest_sessions"); return guestQuery; } };
const service = createAccountService(client);
assert.ok(service);
assert.equal(createAccountService(null), null);

await service.signUp(" user@example.test ", "not-recorded", "Tester", "https://app.example.test/");
assert.deepEqual(authCalls[0], ["signUp", { email:"user@example.test", password:"not-recorded", options:{ data:{ display_name:"Tester" }, emailRedirectTo:"https://app.example.test/" } }]);
await service.signIn(" user@example.test ", "not-recorded");
assert.deepEqual(authCalls[1], ["signIn", { email:"user@example.test", password:"not-recorded" }]);
await service.requestPasswordReset(" user@example.test ", "https://app.example.test/reset");
assert.deepEqual(authCalls[2], ["reset", "user@example.test", { redirectTo:"https://app.example.test/reset" }]);

existingGuest = null;
const guest = await service.ensureGuestSession({ id:"g1", is_anonymous:true });
assert.equal(guest.serverIssued, true);
assert.equal(guest.expiresAt, "2030-01-01T00:10:00.000Z");
assert.deepEqual(sessionInsert, { user_id:"g1" });
existingGuest = { expires_at:"2000-01-01T00:00:00.000Z" };
await assert.rejects(() => service.ensureGuestSession({ id:"g1", is_anonymous:true }), (error) => error instanceof AccountError && error.code === "guest-session-expired");
existingGuest = { expires_at:"2030-01-01T00:10:00.000Z" };
const reusedGuest = await service.startGuestSession();
assert.equal(reusedGuest.expiresAt, existingGuest.expires_at, "starting guest access reuses the original server expiry");
existingGuest = { expires_at:"2000-01-01T00:00:00.000Z" };
await assert.rejects(() => service.startGuestSession(), (error) => error instanceof AccountError && error.code === "guest-session-expired", "expired guest access cannot silently restart its ten-minute window");
await assert.rejects(() => service.ensureGuestSession({ id:"u1", is_anonymous:false }), (error) => error.code === "guest-session-not-anonymous");
await assert.rejects(() => service.saveCloudProject({ id:"g1", is_anonymous:true }, { name:"Guest" }), (error) => error.code === "authentication-required");
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
assert.equal(cloud.projects[0].owner_id, cloudUser.id, "cloud project records bind to the authenticated owner");
assert.deepEqual(cloud.versions[0].payload, { name:"Pump station", version:1 });
assert.equal(cloud.versions[0].owner_id, cloudUser.id, "cloud project snapshots bind to the authenticated owner");
assert.deepEqual((await cloudService.listCloudProjects(cloudUser)).map(({ title }) => title), ["Pump station"]);
const opened = await cloudService.openCloudProject(cloudUser, saved.id);
assert.deepEqual(opened.payload, { name:"Pump station", version:1 }, "cloud open retrieves the newest owned project snapshot");

console.log("Account auth, server-issued guest expiry and authorization boundary checks passed.");
