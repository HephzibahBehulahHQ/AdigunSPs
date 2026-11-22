-- Stand-ins for the Supabase-managed objects referenced by the cloud migrations.
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.jwt() returns jsonb language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb;
$$;
create function auth.uid() returns uuid language sql stable as $$
  select (auth.jwt() ->> 'sub')::uuid;
$$;
grant usage on schema auth to anon, authenticated;

create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (bucket_id text, name text);
create function storage.foldername(text) returns text[] language sql immutable as $$
  select string_to_array($1, '/');
$$;

create schema adigunsps;
create table adigunsps.my_data (user_id uuid);
