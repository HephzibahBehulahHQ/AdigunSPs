-- Issue one immutable ten-minute guest window per anonymous Supabase user.
create or replace function adigunsps.adigun_ensure_guest_session()
returns table (started_at timestamptz, expires_at timestamptz, server_now timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_user uuid := auth.uid();
  request_is_anonymous boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  current_server_time timestamptz := statement_timestamp();
begin
  if request_user is null or not request_is_anonymous then
    raise exception using errcode = '28000', message = 'An authenticated anonymous session is required.';
  end if;

  insert into adigunsps.adigun_guest_sessions (user_id, started_at, expires_at)
  values (request_user, current_server_time, current_server_time + interval '10 minutes')
  on conflict (user_id) do nothing;

  return query
  select session.started_at, session.expires_at, statement_timestamp()
  from adigunsps.adigun_guest_sessions as session
  where session.user_id = request_user;
end;
$$;

revoke all on function adigunsps.adigun_ensure_guest_session() from public, anon;
grant execute on function adigunsps.adigun_ensure_guest_session() to authenticated;

-- The expiry record can be read by its owner but cannot be reset or deleted by a client.
drop policy if exists "Users can only access their own data" on adigunsps.adigun_guest_sessions;
drop policy if exists "Guests read only their server issued session" on adigunsps.adigun_guest_sessions;
create policy "Guests read only their server issued session"
  on adigunsps.adigun_guest_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on table adigunsps.adigun_guest_sessions from anon, authenticated;
grant select on table adigunsps.adigun_guest_sessions to authenticated;
