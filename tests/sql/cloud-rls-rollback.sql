-- Run in the AdigunSPs database after creating the named QA cloud fixture.
-- Uses transaction-local claims and authenticated role; always rolls back.
-- Checks database RLS only, not JWT signing or browser/API authentication.
BEGIN;
SELECT set_config('adigunsps_test.owner', (SELECT user_id::text FROM adigunsps.adigun_cloud_projects WHERE title='QA cloud round-trip 2026-11-02' ORDER BY created_at DESC LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE owner_id uuid := current_setting('adigunsps_test.owner')::uuid; blocked boolean := false;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'QA owner missing'; END IF;
 PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated','is_anonymous',false)::text,true);
 IF NOT EXISTS (SELECT 1 FROM adigunsps.adigun_cloud_projects WHERE title='QA cloud round-trip 2026-11-02') THEN RAISE EXCEPTION 'Owner cannot read QA project'; END IF;
 IF NOT EXISTS (SELECT 1 FROM adigunsps.adigun_cloud_project_versions WHERE user_id=owner_id) THEN RAISE EXCEPTION 'Owner cannot read snapshot'; END IF;
 IF EXISTS (SELECT 1 FROM adigunsps.adigun_cloud_projects WHERE user_id<>owner_id) THEN RAISE EXCEPTION 'Owner sees another user project'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub','00000000-0000-4000-8000-000000000042','role','authenticated','is_anonymous',false)::text,true);
 IF EXISTS (SELECT 1 FROM adigunsps.adigun_cloud_projects) OR EXISTS (SELECT 1 FROM adigunsps.adigun_cloud_project_versions) OR EXISTS (SELECT 1 FROM adigunsps.adigun_profiles) THEN RAISE EXCEPTION 'Unrelated identity sees protected data'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','is_anonymous',true)::text,true);
 BEGIN
  INSERT INTO adigunsps.adigun_cloud_projects(user_id,title) VALUES(owner_id,'rollback-only guest denial probe');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Guest cloud insert unexpectedly allowed'; END IF;
END $test$;
ROLLBACK;

