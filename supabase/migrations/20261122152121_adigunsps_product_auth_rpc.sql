create table adigunsps_private.account_worker_key (
  singleton boolean primary key default true check (singleton),
  proof_hash bytea not null
);
alter table adigunsps_private.account_worker_key enable row level security;
revoke all on adigunsps_private.account_worker_key from public, anon, authenticated;

create function adigunsps_private.worker_is_authorized(worker_proof text)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select length(worker_proof) = 72 and exists (
    select 1 from adigunsps_private.account_worker_key
    where proof_hash = pg_catalog.sha256(pg_catalog.convert_to(worker_proof, 'UTF8'))
  );
$$;

create function adigunsps_private.is_recent_email_otp(email_address text)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select auth.uid() is not null
    and auth.jwt()->>'is_anonymous' is distinct from 'true'
    and email_address = pg_catalog.lower(auth.jwt()->>'email')
    and exists (
      select 1 from pg_catalog.jsonb_array_elements(
        case when pg_catalog.jsonb_typeof(auth.jwt()->'amr') = 'array' then auth.jwt()->'amr' else '[]'::jsonb end
      ) as factor
      where factor->>'method' = 'otp'
        and case when pg_catalog.jsonb_typeof(factor->'timestamp') = 'number'
          then (factor->>'timestamp')::numeric between
            extract(epoch from statement_timestamp()) - 600 and extract(epoch from statement_timestamp()) + 30
          else false end
    );
$$;

create function adigunsps_private.check_product_password(worker_proof text, email_address text, password_proof text)
returns boolean language plpgsql stable security definer set search_path = ''
as $$
declare
  stored_hash text;
  candidate_hash text;
begin
  if adigunsps_private.worker_is_authorized(worker_proof) is not true
    or email_address is null or length(email_address) > 254
    or password_proof is null or password_proof !~ '^[0-9a-f]{64}$' then
    return false;
  end if;
  select password_hash into stored_hash
  from adigunsps_private.product_accounts where login_email = email_address;
  candidate_hash := extensions.crypt(password_proof, coalesce(stored_hash, extensions.gen_salt('bf', 12)));
  return stored_hash is not null and candidate_hash = stored_hash;
end;
$$;

create function adigunsps_private.activate_product_account(worker_proof text, email_address text, password_proof text)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
begin
  if adigunsps_private.worker_is_authorized(worker_proof) is not true
     or adigunsps_private.is_recent_email_otp(email_address) is not true
     or length(email_address) > 254
     or password_proof is null or password_proof !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  insert into adigunsps_private.product_accounts (user_id, login_email, password_hash)
  values (auth.uid(), email_address, extensions.crypt(password_proof, extensions.gen_salt('bf', 12)))
  on conflict do nothing;
  return found;
end;
$$;

create function adigunsps_private.verify_product_session(worker_proof text, email_address text, password_proof text)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
begin
  if adigunsps_private.is_recent_email_otp(email_address) is not true
     or adigunsps_private.check_product_password(worker_proof, email_address, password_proof) is not true
     or not exists (
       select 1 from adigunsps_private.product_accounts where user_id = auth.uid() and login_email = email_address
     ) then
    return false;
  end if;

  insert into adigunsps_private.verified_sessions (session_id, user_id, expires_at)
  select provider.id, provider.user_id, statement_timestamp() + interval '12 hours'
  from auth.sessions as provider
  where provider.id::text = auth.jwt()->>'session_id' and provider.user_id = auth.uid()
  on conflict (session_id) do nothing;
  return found;
end;
$$;

create function adigunsps.adigun_check_product_password(worker_proof text, email_address text, password_proof text)
returns boolean language sql stable security invoker set search_path = ''
as $$ select adigunsps_private.check_product_password(worker_proof, email_address, password_proof); $$;

create function adigunsps.adigun_activate_product_account(worker_proof text, email_address text, password_proof text)
returns boolean language sql volatile security invoker set search_path = ''
as $$ select adigunsps_private.activate_product_account(worker_proof, email_address, password_proof); $$;

create function adigunsps.adigun_verify_product_session(worker_proof text, email_address text, password_proof text)
returns boolean language sql volatile security invoker set search_path = ''
as $$ select adigunsps_private.verify_product_session(worker_proof, email_address, password_proof); $$;

revoke execute on function adigunsps_private.worker_is_authorized(text), adigunsps_private.is_recent_email_otp(text)
  from public, anon, authenticated;
revoke execute on function adigunsps_private.check_product_password(text,text,text),
  adigunsps_private.activate_product_account(text,text,text),
  adigunsps_private.verify_product_session(text,text,text),
  adigunsps.adigun_check_product_password(text,text,text),
  adigunsps.adigun_activate_product_account(text,text,text),
  adigunsps.adigun_verify_product_session(text,text,text)
  from public, anon, authenticated;

grant usage on schema adigunsps_private to anon;
grant execute on function adigunsps_private.check_product_password(text,text,text),
  adigunsps.adigun_check_product_password(text,text,text) to anon;
grant execute on function adigunsps_private.activate_product_account(text,text,text),
  adigunsps_private.verify_product_session(text,text,text),
  adigunsps.adigun_activate_product_account(text,text,text),
  adigunsps.adigun_verify_product_session(text,text,text) to authenticated;

