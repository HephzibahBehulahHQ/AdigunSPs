-- Optional independent review of immutable recipe snapshots.
-- No approval is an electrical, engineering, or safety certification.
create function adigunsps.valid_recipe_snapshot(candidate jsonb)
returns boolean language sql immutable strict security invoker set search_path = ''
as $$
 select case when jsonb_typeof(candidate) = 'object' then
   pg_column_size(candidate) <= 65536
   and (select count(*) from jsonb_each(candidate)) between 1 and 1000
   and not exists (select 1 from jsonb_each(candidate) e
     where length(e.key) not between 1 and 120
        or jsonb_typeof(e.value) not in ('boolean','number'))
 else false end
$$;
revoke all on function adigunsps.valid_recipe_snapshot(jsonb) from public, anon;
grant execute on function adigunsps.valid_recipe_snapshot(jsonb) to authenticated;

create table adigunsps.adigun_recipe_submissions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 project_name text not null check (length(btrim(project_name)) between 1 and 160),
 recipe_name text not null check (length(btrim(recipe_name)) between 1 and 120),
 recipe_version integer not null check (recipe_version > 0),
 recipe_values jsonb not null check (adigunsps.valid_recipe_snapshot(recipe_values)),
 submitted_at timestamptz not null default now()
);
create table adigunsps.adigun_recipe_decisions (
 submission_id uuid primary key references adigunsps.adigun_recipe_submissions(id) on delete cascade,
 reviewer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 decision text not null check (decision in ('approved','rejected')),
 comment text not null default '' check (length(comment) <= 1000),
 decided_at timestamptz not null default now()
);
create index adigun_recipe_submissions_owner_time on adigunsps.adigun_recipe_submissions(user_id,submitted_at desc);
create index adigun_recipe_decisions_reviewer on adigunsps.adigun_recipe_decisions(reviewer_id);
alter table adigunsps.adigun_recipe_submissions enable row level security;
alter table adigunsps.adigun_recipe_decisions enable row level security;
revoke all on adigunsps.adigun_recipe_submissions, adigunsps.adigun_recipe_decisions from anon, authenticated;
grant select on adigunsps.adigun_recipe_submissions, adigunsps.adigun_recipe_decisions to authenticated;
grant insert(project_name,recipe_name,recipe_version,recipe_values) on adigunsps.adigun_recipe_submissions to authenticated;
grant insert(submission_id,decision,comment) on adigunsps.adigun_recipe_decisions to authenticated;

create policy recipe_submissions_read on adigunsps.adigun_recipe_submissions for select to authenticated
using (coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) is false
 and (user_id=(select auth.uid()) or ((select auth.jwt())->'app_metadata'->>'role')='admin'));
create policy recipe_submissions_insert on adigunsps.adigun_recipe_submissions for insert to authenticated
with check (user_id=(select auth.uid()) and coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) is false);
create policy recipe_decisions_read on adigunsps.adigun_recipe_decisions for select to authenticated
using (exists(select 1 from adigunsps.adigun_recipe_submissions s where s.id=submission_id));
create policy recipe_decisions_insert on adigunsps.adigun_recipe_decisions for insert to authenticated
with check (reviewer_id=(select auth.uid())
 and coalesce(((select auth.jwt())->>'is_anonymous')::boolean,false) is false
 and ((select auth.jwt())->'app_metadata'->>'role')='admin'
 and exists(select 1 from adigunsps.adigun_recipe_submissions s where s.id=submission_id and s.user_id<>(select auth.uid())));
