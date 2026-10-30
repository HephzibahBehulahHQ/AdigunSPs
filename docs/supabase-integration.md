# AdigunSPs Supabase Integration

The app uses the dedicated `HephzibahBehulahHQ` project `fqcbfnktdvqojyezxeis` at `https://fqcbfnktdvqojyezxeis.supabase.co`. VoltPro is a separate project (`vnckoocsookbaqalybje`) and must not receive AdigunSPs migrations or runtime requests.

## Implemented

- Pinned `@supabase/supabase-js` and a runtime guard that accepts only the AdigunSPs project URL and rejects recognizable secret/service-role keys.
- Email/password sign-up, sign-in, password-reset, profile editing and avatar upload UI. Email confirmation is enabled in the Supabase Auth project settings.
- Owner-scoped cloud project records with append-only JSON project versions. Each Save to Cloud creates a new cloud copy; it does not overwrite another version.
- Server-issued 10-minute anonymous guest expiry records. Guest records cannot read or write cloud projects; the client blocks editing at expiry and retains temporary local work for account recovery.
- Private avatar bucket limited to 3 MiB JPG, PNG or WebP objects. Storage object policies restrict paths to the signed-in user's UUID folder.
- Local browser storage remains available to signed-in users; the existing import/export flow can move project files to and from the device.
- Migration SQL is kept in `supabase/migrations/` and applied to the dedicated HQ project. Public user tables have RLS enabled. Administrator profile visibility uses trusted `app_metadata.role`; user-editable metadata cannot grant administrator access.

## Supabase project state and setup

The project was active in `eu-west-1`. The applied migrations are `20261030131133_adigunsps_auth_cloud` and `20261030131611_index_cloud_version_owner`; their versions and names match this repository. All four AdigunSPs public tables have RLS enabled, and the private `adigun-avatars` bucket and owner-folder policies exist. The security advisor returned no findings. The performance advisor reports 11 `auth_rls_initplan` notices even though a read-only query of `pg_policies` confirms `auth.uid()` and `auth.jwt()` are wrapped in scalar `SELECT`s as recommended; it also reports three unused indexes while the new tables contain no user records. These are recorded as remaining advisor noise to recheck after live use, not as proof that the policies are missing.

Copy `.env.example` to `.env` for local development and set the AdigunSPs publishable key. The URL is fixed to the project above. Never include a Supabase secret key, `service_role` key or database password in a browser build. `.env` is ignored by Git; the project's publishable key is intended for browser use and relies on RLS for data protection.

## Remaining external setup and verification

- Supabase anonymous sign-ins are currently disabled. Guest mode requests a Supabase anonymous user and server-issued expiry; it remains unavailable until anonymous sign-ins are enabled in Auth settings. Changing this Auth security setting needs owner confirmation at action time. Supabase applies its documented IP rate limits; this app does not claim to prevent repeated guest access.
- Auth Site URL is still `http://localhost:3000`; the user's earlier preview origin was `http://127.0.0.1:8081/`, and the current source server was started on `http://127.0.0.1:8083/` but the in-app browser timed out connecting to it. Add only the verified local and production callback URLs after the production origin is known; callback allowlist changes also need action-time confirmation. Password-reset and email-confirmation redirects have not been end-to-end verified.
- Turnstile/CAPTCHA is not configured because no production hostname/site key was supplied.
- No administrator has been provisioned. Assign `app_metadata.role=admin` through a trusted server-side Supabase admin process; never set it from this browser UI or user-editable metadata.
- Cloudflare account/deployment access is not connected in this workspace. GitHub Pages/Cloudflare production deployment and its final origin remain unverified.
- Focused local tests cover account auth delegation, guest expiry handling, cloud authorization boundaries and client project/key pinning; the full project suite passed on 2026-10-30, including 200 example projects, 1,317 logic cases, 903 schematic checks, and 1,317 integrated PLC-to-component cases. These tests do not replace live multi-user RLS tests. Real signup/confirmation/reset, cloud save/reload, avatar upload, expired guest transition and admin denial require Auth settings, callback configuration, test accounts and an enabled preview connection.
