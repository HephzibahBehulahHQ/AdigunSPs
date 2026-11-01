import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/migrations/20261101075618_adigunsps_schema_and_guest_upgrade.sql", import.meta.url), "utf8");
const guestExpiry = await readFile(new URL("../supabase/migrations/20261101085102_enforce_guest_session_expiry.sql", import.meta.url), "utf8");
const policyPerformance = await readFile(new URL("../supabase/migrations/20261101114255_adigunsps_rls_query_performance.sql", import.meta.url), "utf8");
const tables = ["adigun_profiles", "adigun_guest_sessions", "adigun_cloud_projects", "adigun_cloud_project_versions"];
for (const table of tables) assert.match(sql, new RegExp(`alter table public\\.${table} set schema adigunsps`, "i"));
assert.match(sql, /alter table adigunsps\.adigun_cloud_projects rename column owner_id to user_id/i);
assert.match(sql, /alter table adigunsps\.adigun_cloud_project_versions rename column owner_id to user_id/i);
assert.doesNotMatch(sql, /\bdrop\s+table\b/i, "migration must preserve project data");
assert.doesNotMatch(sql, /adigunsimulator|adigunelectrocad/i, "migration must not touch other products");
assert.equal((sql.match(/create policy "Only permanent users can insert"/gi) || []).length, 5);
for (const table of [...tables, "my_data"]) {
  const policy = new RegExp(`create policy "Users can only access their own data"[\\s\\S]*?on adigunsps\\.${table} for all to authenticated[\\s\\S]*?using \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)[\\s\\S]*?with check \\(\\(select auth\\.uid\\(\\)\\) = user_id\\)`, "i");
  assert.match(sql, policy, `${table} must enforce both owner USING and WITH CHECK`);
}
assert.match(guestExpiry, /on conflict \(user_id\) do nothing/i, "guest expiry cannot be renewed by refreshing the same anonymous identity");
assert.match(guestExpiry, /current_server_time \+ interval '10 minutes'/i);
assert.match(guestExpiry, /auth\.uid\(\)[\s\S]*auth\.jwt\(\).*is_anonymous/i);
assert.match(guestExpiry, /revoke insert, update, delete[\s\S]*adigun_guest_sessions/i, "clients cannot reset or remove the server expiry record");
assert.match(guestExpiry, /grant execute on function adigunsps\.adigun_ensure_guest_session\(\) to authenticated/i);
assert.doesNotMatch(guestExpiry, /drop\s+table/i);

assert.match(policyPerformance, /create index if not exists adigunsps_my_data_user_id_idx\s+on adigunsps\.my_data\s*\(user_id\)/i);
assert.match(policyPerformance, /Users read own profile or admins[\s\S]*?for select[\s\S]*?auth\.uid\(\)[\s\S]*?auth\.jwt\(\)/i);
assert.match(policyPerformance, /Users create their own profile[\s\S]*?for insert[\s\S]*?auth\.uid\(\)/i);
assert.match(policyPerformance, /Users update their own profile[\s\S]*?for update[\s\S]*?using[\s\S]*?with check/i);
assert.match(policyPerformance, /Users delete their own profile[\s\S]*?for delete/i);
assert.equal((policyPerformance.match(/create policy "Only permanent users can insert"/gi) || []).length, 5);
assert.equal((policyPerformance.match(/create policy "Only permanent users can insert"\s+on adigunsps\.[a-z_]+ as restrictive for insert to authenticated/gi) || []).length, 5, "permanent-only insertion must be restrictive so owner-wide policies cannot OR around the guest check");
assert.match(sql, /create policy "Project version insert requires owned project"\s+on adigunsps\.adigun_cloud_project_versions as restrictive for insert to authenticated/i, "project version inserts must be restricted to rows linked to an owned project");
assert.match(guestExpiry, /security definer[\s\S]*?set search_path\\s*(?:to|=)\\s*''[\s\S]*?request_user uuid := auth\.uid\(\)[\s\S]*?request_is_anonymous boolean := coalesce\(\(auth\.jwt\(\) ->> 'is_anonymous'\)::boolean, false\)/i, "guest RPC must pin its search path and require a verified anonymous identity");
assert.equal((policyPerformance.match(/\(select auth\.jwt\(\)\)/gi) || []).length, 6);
assert.doesNotMatch(policyPerformance, /adigunsimulator|adigunelectrocad|\bdrop\s+table\b/i);

console.log("AdigunSPs schema, owner/admin RLS semantics, JWT policy caching, and index checks passed.");
