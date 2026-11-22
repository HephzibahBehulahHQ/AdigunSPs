insert into auth.users(id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000003');

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';

insert into adigunsps.adigun_cloud_projects(id,user_id,title) values
  ('10000000-0000-4000-8000-000000000001',auth.uid(),'Shared'),
  ('10000000-0000-4000-8000-000000000002',auth.uid(),'Private');
insert into adigunsps.adigun_cloud_project_versions(project_id,user_id,version,payload)
select id,auth.uid(),1,'{}'::jsonb from adigunsps.adigun_cloud_projects;
insert into adigunsps.adigun_cloud_project_members(project_id,user_id,role) values
  ('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','reviewer');

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
do $$
begin
  if (select array_agg(title) from adigunsps.adigun_cloud_projects) is distinct from array['Shared']
     or (select count(*) from adigunsps.adigun_cloud_project_versions) <> 1
     or (select role from adigunsps.adigun_cloud_project_members) is distinct from 'reviewer' then
    raise exception 'The reviewer must see only the shared project and its version';
  end if;
  update adigunsps.adigun_cloud_projects set title = 'Changed';
  if found then raise exception 'A reviewer edited the project'; end if;
  update adigunsps.adigun_cloud_project_members set role = 'engineer';
  if found then raise exception 'A reviewer changed their role'; end if;
  delete from adigunsps.adigun_cloud_project_members;
  if found then raise exception 'A reviewer removed membership'; end if;
  begin
    insert into adigunsps.adigun_cloud_project_versions(project_id,user_id,version,payload)
    values ('10000000-0000-4000-8000-000000000001',auth.uid(),2,'{}');
    raise exception 'A reviewer wrote a new version';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into adigunsps.adigun_cloud_project_members(project_id,user_id,role)
    values ('10000000-0000-4000-8000-000000000002',auth.uid(),'engineer');
    raise exception 'A reviewer joined a private project';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":true}';
do $$
begin
  if exists (select 1 from adigunsps.adigun_cloud_projects)
     or exists (select 1 from adigunsps.adigun_cloud_project_versions)
     or exists (select 1 from adigunsps.adigun_cloud_project_members) then
    raise exception 'An anonymous session could use a shared project';
  end if;
end;
$$;

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000003","is_anonymous":false}';
do $$
begin
  if exists (select 1 from adigunsps.adigun_cloud_projects) then
    raise exception 'A nonmember could read a shared project';
  end if;
  insert into adigunsps.adigun_cloud_projects(id,user_id,title)
  values ('10000000-0000-4000-8000-000000000003',auth.uid(),'Other owner');
  insert into adigunsps.adigun_cloud_project_versions(project_id,user_id,version,payload)
  values ('10000000-0000-4000-8000-000000000003',auth.uid(),2,'{}');
  begin
    update adigunsps.adigun_cloud_project_versions
    set project_id = '10000000-0000-4000-8000-000000000001';
    raise exception 'An owner moved a version into an unowned project';
  exception when insufficient_privilege then null;
  end;
end;
$$;

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000001","is_anonymous":false}';
do $$
begin
  update adigunsps.adigun_cloud_project_members set role = 'viewer';
  if not found then raise exception 'The owner could not update membership'; end if;
  begin
    update adigunsps.adigun_cloud_project_members set role = 'owner';
    raise exception 'The membership row granted ownership';
  exception when check_violation then null;
  end;
  delete from adigunsps.adigun_cloud_project_members;
  if not found then raise exception 'The owner could not revoke membership'; end if;
end;
$$;

set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000002","is_anonymous":false}';
do $$
begin
  if exists (select 1 from adigunsps.adigun_cloud_projects)
    or exists (select 1 from adigunsps.adigun_cloud_project_versions) then
    raise exception 'A revoked member still has access';
  end if;
end;
$$;
rollback;
