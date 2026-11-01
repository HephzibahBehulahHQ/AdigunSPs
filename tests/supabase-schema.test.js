import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/migrations/20261101075618_adigunsps_schema_and_guest_upgrade.sql", import.meta.url), "utf8");
const guestExpiry = await readFile(new URL("../supabase/migrations/20261101085102_enforce_guest_session_expiry.sql", import.meta.url), "utf8");
const guestExpiryFourMinutes = await readFile(new URL("../supabase/migrations/20261101151429_adigunsps_four_minute_guest_access.sql", import.meta.url), "utf8");
const policyPerformance = await readFile(new URL("../supabase/migrations/20261101114255_adigunsps_rls_query_performance.sql", import.meta.url), "utf8");
const hardwareDelivery = await readFile(new URL("../supabase/migrations/20261101161849_adigunsps_hardware_command_delivery.sql", import.meta.url), "utf8");
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
assert.match(guestExpiryFourMinutes, /current_server_time \+ interval '4 minutes'/i);
assert.match(guestExpiryFourMinutes, /least\(expires_at, started_at \+ interval '4 minutes'\)/i, "shortening guest duration never extends an existing session");

assert.match(policyPerformance, /create index if not exists adigunsps_my_data_user_id_idx\s+on adigunsps\.my_data\s*\(user_id\)/i);
assert.match(policyPerformance, /Users read own profile or admins[\s\S]*?for select[\s\S]*?auth\.uid\(\)[\s\S]*?auth\.jwt\(\)/i);
assert.match(policyPerformance, /Users create their own profile[\s\S]*?for insert[\s\S]*?auth\.uid\(\)/i);
assert.match(policyPerformance, /Users update their own profile[\s\S]*?for update[\s\S]*?using[\s\S]*?with check/i);
assert.match(policyPerformance, /Users delete their own profile[\s\S]*?for delete/i);
assert.equal((policyPerformance.match(/create policy "Only permanent users can insert"/gi) || []).length, 5);
assert.equal((policyPerformance.match(/create policy "Only permanent users can insert"\s+on adigunsps\.[a-z_]+ as restrictive for insert to authenticated/gi) || []).length, 5, "permanent-only insertion must be restrictive so owner-wide policies cannot OR around the guest check");
assert.match(sql, /create policy "Project version insert requires owned project"\s+on adigunsps\.adigun_cloud_project_versions as restrictive for insert to authenticated/i, "project version inserts must be restricted to rows linked to an owned project");
assert.match(guestExpiry, /security definer[\s\S]*?set search_path\s*(?:to|=)\s*''[\s\S]*?request_user uuid := auth\.uid\(\)[\s\S]*?request_is_anonymous boolean := coalesce\(\(auth\.jwt\(\) ->> 'is_anonymous'\)::boolean, false\)/i, "guest RPC must pin its search path and require a verified anonymous identity");
assert.equal((policyPerformance.match(/\(select auth\.jwt\(\)\)/gi) || []).length, 6);
assert.doesNotMatch(policyPerformance, /adigunsimulator|adigunelectrocad|\bdrop\s+table\b/i);

const hardwareTables = ["hardware_devices", "hardware_client_heartbeats", "hardware_device_state", "hardware_commands", "hardware_device_events"];
for (const table of hardwareTables) {
  assert.match(hardwareDelivery, new RegExp(`create table if not exists adigunsps\\.${table}\\b`, "i"), `${table} is created idempotently`);
  assert.match(hardwareDelivery, new RegExp(`alter table adigunsps\\.${table} enable row level security`, "i"), `${table} has RLS enabled`);
}
assert.match(hardwareDelivery, /command_type text not null check \(command_type in \('SYNC', 'SET_OUTPUTS'\)\)/i);
assert.match(hardwareDelivery, /expires_at <= created_at \+ interval '3 seconds'/i);
assert.match(hardwareDelivery, /THEN NOT \(\s*\(payload->>'forward'\)::boolean\s*AND \(payload->>'reverse'\)::boolean/is, "command constraint rejects simultaneous forward and reverse outputs");
assert.match(hardwareDelivery, /hardware_commands_insert_owner[\s\S]*?status = 'queued'[\s\S]*?is_anonymous/i);
assert.match(hardwareDelivery, /hardware_commands_update_device[\s\S]*?device_auth_user_id = \(select auth\.uid\(\)\)/i);
assert.match(hardwareDelivery, /create index if not exists hardware_commands_device_queue_idx/i);
assert.match(hardwareDelivery, /create index if not exists hardware_events_device_created_idx/i);
for (const table of ["hardware_client_heartbeats", "hardware_device_state", "hardware_commands", "hardware_device_events"]) {
  assert.match(hardwareDelivery, new RegExp(`tablename = '${table}'[\\s\\S]*?alter publication supabase_realtime\\s+add table adigunsps\\.${table}`, "i"), `${table} is included in Realtime`);
}

console.log("AdigunSPs schema, owner/admin RLS semantics, guest expiry, JWT policy caching, and index checks passed.");

