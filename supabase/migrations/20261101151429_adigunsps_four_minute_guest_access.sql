-- Set the immutable guest trial to four minutes without extending existing sessions.
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
  values (request_user, current_server_time, current_server_time + interval '4 minutes')
  on conflict (user_id) do nothing;

  return query
  select session.started_at, session.expires_at, statement_timestamp()
  from adigunsps.adigun_guest_sessions as session
  where session.user_id = request_user;
end;
$$;

update adigunsps.adigun_guest_sessions
set expires_at = least(expires_at, started_at + interval '4 minutes')
where expires_at > started_at + interval '4 minutes';

