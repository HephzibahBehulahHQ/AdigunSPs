begin;

create schema if not exists adigunsps_private;
revoke all on schema adigunsps_private from public, anon;
grant usage on schema adigunsps_private to authenticated;

create table adigunsps.adigun_cloud_project_members (
  project_id uuid not null references adigunsps.adigun_cloud_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('engineer', 'technician', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index adigun_cloud_project_members_user_idx
  on adigunsps.adigun_cloud_project_members (user_id, project_id);

alter table adigunsps.adigun_cloud_project_members enable row level security;
revoke all on adigunsps.adigun_cloud_project_members from public, anon, authenticated;
grant select, delete on adigunsps.adigun_cloud_project_members to authenticated;
grant insert (project_id, user_id, role), update (role)
  on adigunsps.adigun_cloud_project_members to authenticated;

-- Check ownership without re-entering the project read policy, which reads membership.
create function adigunsps_private.is_cloud_project_owner(target_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from adigunsps.adigun_cloud_projects project
    where project.id = target_project and project.user_id = (select auth.uid())
  );
$$;

revoke all on function adigunsps_private.is_cloud_project_owner(uuid) from public, anon;
grant execute on function adigunsps_private.is_cloud_project_owner(uuid) to authenticated;

create policy "Permanent cloud users read their project membership"
  on adigunsps.adigun_cloud_project_members for select to authenticated
  using (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and (user_id = (select auth.uid()) or adigunsps_private.is_cloud_project_owner(project_id))
  );

create policy "Cloud owners grant project membership"
  on adigunsps.adigun_cloud_project_members for insert to authenticated
  with check (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and user_id <> (select auth.uid())
    and adigunsps_private.is_cloud_project_owner(project_id)
  );

create policy "Cloud owners change project member roles"
  on adigunsps.adigun_cloud_project_members for update to authenticated
  using (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and adigunsps_private.is_cloud_project_owner(project_id)
  )
  with check (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and adigunsps_private.is_cloud_project_owner(project_id)
  );

create policy "Cloud owners revoke project membership"
  on adigunsps.adigun_cloud_project_members for delete to authenticated
  using (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and adigunsps_private.is_cloud_project_owner(project_id)
  );

create policy "Permanent members read shared projects"
  on adigunsps.adigun_cloud_projects for select to authenticated
  using (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and exists (
      select 1 from adigunsps.adigun_cloud_project_members member
      where member.project_id = adigun_cloud_projects.id and member.user_id = (select auth.uid())
    )
  );

create policy "Permanent members read shared project versions"
  on adigunsps.adigun_cloud_project_versions for select to authenticated
  using (
    (select auth.jwt() ->> 'is_anonymous') = 'false'
    and exists (
      select 1 from adigunsps.adigun_cloud_project_members member
      join adigunsps.adigun_cloud_projects project on project.id = member.project_id
      where member.project_id = adigun_cloud_project_versions.project_id
        and member.user_id = (select auth.uid())
        and project.user_id = adigun_cloud_project_versions.user_id
    )
  );

create policy "Project version updates require an owned project"
  on adigunsps.adigun_cloud_project_versions as restrictive for update to authenticated
  using (adigunsps_private.is_cloud_project_owner(project_id))
  with check (adigunsps_private.is_cloud_project_owner(project_id));

commit;
