BEGIN;

DO $fixture$ BEGIN
 perform set_config('adigunsps_test.owner',(select user_id::text from adigunsps.adigun_cloud_projects where title='QA cloud round-trip 2026-11-02' limit 1),true);
 perform set_config('adigunsps_test.reviewer',(select id::text from auth.users where id<>current_setting('adigunsps_test.owner')::uuid limit 1),true);
END $fixture$;
SET LOCAL ROLE authenticated;
DO $test$
declare owner_id uuid:=current_setting('adigunsps_test.owner')::uuid;
 reviewer uuid:=current_setting('adigunsps_test.reviewer')::uuid; submission uuid; denied boolean;
begin
 if owner_id is null or reviewer is null then raise exception 'Two fixture identities required'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'is_anonymous',false,'app_metadata',jsonb_build_object('role','admin'))::text,true);
 insert into adigunsps.adigun_recipe_submissions(project_name,recipe_name,recipe_version,recipe_values)
 values('Rollback QA','Numeric',1,'{"Speed":42.5,"Start":false}') returning id into submission;
 denied:=false;
 begin insert into adigunsps.adigun_recipe_decisions(submission_id,decision) values(submission,'approved');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Self-approval allowed'; end if;
 denied:=false;
 begin update adigunsps.adigun_recipe_submissions set recipe_values='{"Speed":1}' where id=submission;
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Snapshot mutation allowed'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',reviewer,'is_anonymous',false)::text,true);
 if exists(select 1 from adigunsps.adigun_recipe_submissions where id=submission) then raise exception 'Unrelated user sees submission'; end if;
 denied:=false;
 begin insert into adigunsps.adigun_recipe_decisions(submission_id,decision) values(submission,'approved');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Non-admin decision allowed'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',reviewer,'is_anonymous',false,'app_metadata',jsonb_build_object('role','admin'))::text,true);
 insert into adigunsps.adigun_recipe_decisions(submission_id,decision,comment) values(submission,'approved','Rollback-only review');
 if not exists(select 1 from adigunsps.adigun_recipe_decisions where submission_id=submission and reviewer_id=reviewer) then raise exception 'Independent admin review failed'; end if;
 denied:=false;
 begin insert into adigunsps.adigun_recipe_decisions(submission_id,decision) values(submission,'rejected');
 exception when unique_violation then denied:=true; end;
 if not denied then raise exception 'Duplicate decision allowed'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'is_anonymous',true)::text,true);
 denied:=false;
 begin insert into adigunsps.adigun_recipe_submissions(project_name,recipe_name,recipe_version,recipe_values) values('QA','Guest',1,'{"Start":true}');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Guest submission allowed'; end if;
end $test$;
ROLLBACK;
