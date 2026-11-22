-- Restrictive policies preserve existing ownership, reviewer and device rules.
-- The guest table and its four-minute access function retain their existing policies.
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'adigun_profiles',
    'adigun_cloud_projects',
    'adigun_cloud_project_versions',
    'adigun_recipe_submissions',
    'adigun_recipe_decisions',
    'hardware_devices',
    'hardware_client_heartbeats',
    'hardware_device_state',
    'hardware_commands',
    'hardware_device_events'
  ] loop
    if to_regclass(format('adigunsps.%I', relation_name)) is null then
      if relation_name in ('adigun_recipe_submissions', 'adigun_recipe_decisions') then
        continue;
      end if;
      raise exception 'Required AdigunSPs table is missing: %', relation_name;
    end if;

    execute format(
      'create policy verified_product_session on adigunsps.%I
       as restrictive for all to authenticated
       using ((select adigunsps_private.has_verified_session()))
       with check ((select adigunsps_private.has_verified_session()))',
      relation_name
    );
  end loop;
end;
$$;

create policy adigunsps_verified_avatar_session on storage.objects
  as restrictive for all to authenticated
  using (bucket_id <> 'adigun-avatars' or (select adigunsps_private.has_verified_session()))
  with check (bucket_id <> 'adigun-avatars' or (select adigunsps_private.has_verified_session()));

