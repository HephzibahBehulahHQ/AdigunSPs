-- Keep profile access equivalent while combining the own-profile and admin-read rules.
drop policy if exists "Users can only access their own data" on adigunsps.adigun_profiles;
drop policy if exists "Admins can read profiles" on adigunsps.adigun_profiles;

create policy "Users read own profile or admins"
  on adigunsps.adigun_profiles for select to authenticated
  using (
    (select auth.uid()) = user_id
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
create policy "Users create their own profile"
  on adigunsps.adigun_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update their own profile"
  on adigunsps.adigun_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their own profile"
  on adigunsps.adigun_profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Cache the JWT once per statement rather than once per affected row.
drop policy if exists "Only permanent users can insert" on adigunsps.adigun_profiles;
create policy "Only permanent users can insert"
  on adigunsps.adigun_profiles as restrictive for insert to authenticated
  with check (coalesce((((select auth.jwt()) ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Only permanent users can insert" on adigunsps.adigun_guest_sessions;
create policy "Only permanent users can insert"
  on adigunsps.adigun_guest_sessions as restrictive for insert to authenticated
  with check (coalesce((((select auth.jwt()) ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Only permanent users can insert" on adigunsps.adigun_cloud_projects;
create policy "Only permanent users can insert"
  on adigunsps.adigun_cloud_projects as restrictive for insert to authenticated
  with check (coalesce((((select auth.jwt()) ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Only permanent users can insert" on adigunsps.adigun_cloud_project_versions;
create policy "Only permanent users can insert"
  on adigunsps.adigun_cloud_project_versions as restrictive for insert to authenticated
  with check (coalesce((((select auth.jwt()) ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Only permanent users can insert" on adigunsps.my_data;
create policy "Only permanent users can insert"
  on adigunsps.my_data as restrictive for insert to authenticated
  with check (coalesce((((select auth.jwt()) ->> 'is_anonymous')::boolean), false) is false);

create index if not exists adigunsps_my_data_user_id_idx
  on adigunsps.my_data (user_id);
