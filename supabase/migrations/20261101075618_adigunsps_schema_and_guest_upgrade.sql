-- Keep the existing AdigunSPs rows and move only this application's tables.
drop trigger if exists adigun_guest_session_expiry on public.adigun_guest_sessions;
drop function if exists public.adigun_set_guest_expiry();

alter table public.adigun_profiles set schema adigunsps;
alter table public.adigun_guest_sessions set schema adigunsps;
alter table public.adigun_cloud_projects set schema adigunsps;
alter table public.adigun_cloud_project_versions set schema adigunsps;

alter table adigunsps.adigun_cloud_projects rename column owner_id to user_id;
alter table adigunsps.adigun_cloud_project_versions rename column owner_id to user_id;

alter table adigunsps.adigun_profiles enable row level security;
alter table adigunsps.adigun_guest_sessions enable row level security;
alter table adigunsps.adigun_cloud_projects enable row level security;
alter table adigunsps.adigun_cloud_project_versions enable row level security;
alter table adigunsps.my_data enable row level security;

grant usage on schema adigunsps to anon, authenticated;
grant select, insert, update, delete on table
  adigunsps.adigun_profiles,
  adigunsps.adigun_guest_sessions,
  adigunsps.adigun_cloud_projects,
  adigunsps.adigun_cloud_project_versions,
  adigunsps.my_data
to authenticated;

drop policy if exists "Users read their profile" on adigunsps.adigun_profiles;
drop policy if exists "Users create their own profile" on adigunsps.adigun_profiles;
drop policy if exists "Users update their own profile" on adigunsps.adigun_profiles;
drop policy if exists "Users can only access their own data" on adigunsps.adigun_profiles;
drop policy if exists "Only permanent users can insert" on adigunsps.adigun_profiles;
create policy "Users can only access their own data"
  on adigunsps.adigun_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Admins can read profiles"
  on adigunsps.adigun_profiles for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Only permanent users can insert"
  on adigunsps.adigun_profiles as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Guests read only their server issued session" on adigunsps.adigun_guest_sessions;
drop policy if exists "Guests start one server timed session" on adigunsps.adigun_guest_sessions;
drop policy if exists "Users can only access their own data" on adigunsps.adigun_guest_sessions;
drop policy if exists "Only permanent users can insert" on adigunsps.adigun_guest_sessions;
create policy "Users can only access their own data"
  on adigunsps.adigun_guest_sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Only permanent users can insert"
  on adigunsps.adigun_guest_sessions as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Users read their cloud projects" on adigunsps.adigun_cloud_projects;
drop policy if exists "Users create their cloud projects" on adigunsps.adigun_cloud_projects;
drop policy if exists "Users update their cloud project metadata" on adigunsps.adigun_cloud_projects;
drop policy if exists "Users delete their cloud projects" on adigunsps.adigun_cloud_projects;
drop policy if exists "Users can only access their own data" on adigunsps.adigun_cloud_projects;
drop policy if exists "Only permanent users can insert" on adigunsps.adigun_cloud_projects;
create policy "Users can only access their own data"
  on adigunsps.adigun_cloud_projects for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Only permanent users can insert"
  on adigunsps.adigun_cloud_projects as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false);

drop policy if exists "Users read their project versions" on adigunsps.adigun_cloud_project_versions;
drop policy if exists "Users append their project versions" on adigunsps.adigun_cloud_project_versions;
drop policy if exists "Users can only access their own data" on adigunsps.adigun_cloud_project_versions;
drop policy if exists "Only permanent users can insert" on adigunsps.adigun_cloud_project_versions;
drop policy if exists "Project version insert requires owned project" on adigunsps.adigun_cloud_project_versions;
create policy "Users can only access their own data"
  on adigunsps.adigun_cloud_project_versions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Only permanent users can insert"
  on adigunsps.adigun_cloud_project_versions as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false);
create policy "Project version insert requires owned project"
  on adigunsps.adigun_cloud_project_versions as restrictive for insert to authenticated
  with check (exists (
    select 1 from adigunsps.adigun_cloud_projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  ));

drop policy if exists "Users can only access their own data" on adigunsps.my_data;
drop policy if exists "Only permanent users can insert" on adigunsps.my_data;
create policy "Users can only access their own data"
  on adigunsps.my_data for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Only permanent users can insert"
  on adigunsps.my_data as restrictive for insert to authenticated
  with check (coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) is false);
