create table if not exists public.adigun_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adigun_guest_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create or replace function public.adigun_set_guest_expiry()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.started_at := statement_timestamp();
  new.expires_at := new.started_at + interval '10 minutes';
  return new;
end;
$$;

create trigger adigun_guest_session_expiry
before insert on public.adigun_guest_sessions
for each row execute function public.adigun_set_guest_expiry();

create table if not exists public.adigun_cloud_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id)
);

create table if not exists public.adigun_cloud_project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.adigun_cloud_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version integer not null check (version > 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2000000),
  created_at timestamptz not null default now(),
  unique (project_id, version)
);

create index if not exists adigun_cloud_projects_owner_updated_idx
  on public.adigun_cloud_projects (owner_id, updated_at desc);
create index if not exists adigun_cloud_project_versions_project_version_idx
  on public.adigun_cloud_project_versions (project_id, version desc);

alter table public.adigun_profiles enable row level security;
alter table public.adigun_guest_sessions enable row level security;
alter table public.adigun_cloud_projects enable row level security;
alter table public.adigun_cloud_project_versions enable row level security;

grant select, insert, update on public.adigun_profiles to authenticated;
grant select on public.adigun_guest_sessions to authenticated;
grant insert (user_id) on public.adigun_guest_sessions to authenticated;
grant select, insert, update, delete on public.adigun_cloud_projects to authenticated;
grant select, insert on public.adigun_cloud_project_versions to authenticated;

create policy "Users read their profile"
  on public.adigun_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Users create their own profile"
  on public.adigun_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "Users update their own profile"
  on public.adigun_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create policy "Guests read only their server issued session"
  on public.adigun_guest_sessions for select to authenticated
  using (user_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false));
create policy "Guests start one server timed session"
  on public.adigun_guest_sessions for insert to authenticated
  with check (user_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false));

create policy "Users read their cloud projects"
  on public.adigun_cloud_projects for select to authenticated
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "Users create their cloud projects"
  on public.adigun_cloud_projects for insert to authenticated
  with check (owner_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "Users update their cloud project metadata"
  on public.adigun_cloud_projects for update to authenticated
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (owner_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "Users delete their cloud projects"
  on public.adigun_cloud_projects for delete to authenticated
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

create policy "Users read their project versions"
  on public.adigun_cloud_project_versions for select to authenticated
  using (owner_id = (select auth.uid()) and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "Users append their project versions"
  on public.adigun_cloud_project_versions for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and exists (select 1 from public.adigun_cloud_projects p where p.id = project_id and p.owner_id = (select auth.uid()))
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adigun-avatars', 'adigun-avatars', false, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users read their own avatar files"
  on storage.objects for select to authenticated
  using (bucket_id = 'adigun-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload their own avatar files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'adigun-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
create policy "Users update their own avatar files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'adigun-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  )
  with check (
    bucket_id = 'adigun-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce((select auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
create policy "Users delete their own avatar files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'adigun-avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
