-- Product membership and completed sign-ins are written by the account service.
create schema adigunsps_private;
revoke all on schema adigunsps_private from public, anon, authenticated;

create table adigunsps_private.product_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  login_email text not null unique check (login_email = lower(login_email)),
  password_hash text not null,
  email_verified_at timestamptz not null default now()
);

create table adigunsps_private.verified_sessions (
  session_id uuid primary key references auth.sessions (id) on delete cascade,
  user_id uuid not null references adigunsps_private.product_accounts (user_id) on delete cascade,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (expires_at > verified_at)
);
create index adigunsps_verified_sessions_user_id on adigunsps_private.verified_sessions (user_id);

alter table adigunsps_private.product_accounts enable row level security;
alter table adigunsps_private.verified_sessions enable row level security;
revoke all on adigunsps_private.product_accounts, adigunsps_private.verified_sessions from public, anon, authenticated;

create function adigunsps_private.has_verified_session()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (select auth.jwt()->>'is_anonymous') is distinct from 'true'
    and exists (
      select 1
      from adigunsps_private.verified_sessions as verified
      where verified.user_id = (select auth.uid())
        and verified.session_id::text = (select auth.jwt()->>'session_id')
        and verified.expires_at > statement_timestamp()
    );
$$;

create function adigunsps.adigun_has_verified_product_session()
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select adigunsps_private.has_verified_session();
$$;

revoke execute on function adigunsps_private.has_verified_session() from public, anon, authenticated;
revoke execute on function adigunsps.adigun_has_verified_product_session() from public, anon, authenticated;
grant usage on schema adigunsps_private to authenticated;
grant execute on function adigunsps_private.has_verified_session() to authenticated;
grant execute on function adigunsps.adigun_has_verified_product_session() to authenticated;

