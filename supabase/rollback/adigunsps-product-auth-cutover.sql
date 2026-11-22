-- Emergency rollback of only the new cutover policies.
-- Revert the corresponding application switches before restoring legacy sign-in.
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
    if to_regclass(format('adigunsps.%I', relation_name)) is not null then
      execute format('drop policy if exists verified_product_session on adigunsps.%I', relation_name);
    end if;
  end loop;
end;
$$;

drop policy if exists adigunsps_verified_avatar_session on storage.objects;

