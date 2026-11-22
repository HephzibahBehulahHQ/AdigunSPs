create function adigunsps_private.reset_product_password(worker_proof text, email_address text, password_proof text)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
declare
  subject_id uuid := auth.uid();
begin
  if adigunsps_private.worker_is_authorized(worker_proof) is not true
     or adigunsps_private.is_recent_email_otp(email_address) is not true
     or length(email_address) > 254
     or password_proof is null or password_proof !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  update adigunsps_private.product_accounts
  set password_hash = extensions.crypt(password_proof, extensions.gen_salt('bf', 12))
  where user_id = subject_id and login_email = email_address;
  if not found then return false; end if;

  delete from adigunsps_private.verified_sessions where user_id = subject_id;
  return true;
end;
$$;

create or replace function adigunsps_private.verify_product_session(worker_proof text, email_address text, password_proof text)
returns boolean language plpgsql volatile security definer set search_path = ''
as $$
begin
  if adigunsps_private.worker_is_authorized(worker_proof) is not true
     or adigunsps_private.is_recent_email_otp(email_address) is not true then
    return false;
  end if;

  -- Serialize new sign-ins with password recovery for this product account.
  perform 1 from adigunsps_private.product_accounts
  where user_id = auth.uid() and login_email = email_address for update;
  if not found or adigunsps_private.check_product_password(worker_proof, email_address, password_proof) is not true then
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

create function adigunsps.adigun_reset_product_password(worker_proof text, email_address text, password_proof text)
returns boolean language sql volatile security invoker set search_path = ''
as $$ select adigunsps_private.reset_product_password(worker_proof, email_address, password_proof); $$;

revoke execute on function adigunsps_private.reset_product_password(text,text,text),
  adigunsps.adigun_reset_product_password(text,text,text) from public, anon, authenticated;
grant execute on function adigunsps_private.reset_product_password(text,text,text),
  adigunsps.adigun_reset_product_password(text,text,text) to authenticated;

