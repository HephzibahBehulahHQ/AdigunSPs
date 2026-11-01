import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sql = await readFile(new URL("../supabase/migrations/20261101075618_adigunsps_schema_and_guest_upgrade.sql", import.meta.url), "utf8");
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

console.log("AdigunSPs schema migration isolation and RLS policy checks passed.");
