# AdigunSPs Supabase Integration

The app uses the dedicated `HephzibahBehulahHQ` project `fqcbfnktdvqojyezxeis` at `https://fqcbfnktdvqojyezxeis.supabase.co`. VoltPro is a separate project (`vnckoocsookbaqalybje`) and must not receive AdigunSPs migrations or runtime requests.

## Implemented

- Pinned `@supabase/supabase-js` and a runtime guard that accepts only the AdigunSPs project URL and rejects recognizable secret/service-role keys.
- Standard email-and-password sign-in/registration, email confirmation, password recovery, profile editing and avatar upload UI. The AdigunSPs dashboard has email confirmation, anonymous sign-ins, and manual linking enabled (manual linking enabled 2026-11-01). Main sign-in does not use OTP or magic links.
- Password recovery sends a Supabase recovery email to `https://adigunsps.hephzibahbehulah.com/reset-password`. The protected route accepts a valid `PASSWORD_RECOVERY` session and updates the password; invalid or expired links show a request-another-email path. Auth Site URL and the custom-domain redirect allowlist were read-verified in Supabase on 2026-11-01.
- Owner-scoped cloud project records with append-only JSON project versions. Each Save to Cloud creates a new cloud copy; it does not overwrite another version.
- Anonymous access uses one immutable four-minute expiry per Supabase anonymous user. The app requests it through `adigun_ensure_guest_session`, shows a countdown, blocks editing after expiry, and keeps autosaved guest work only in tab-scoped `sessionStorage` until authentication. Guest upgrade links a confirmed email/password identity to the existing anonymous identity so its local project ownership is retained. Cloud INSERT remains permanent-account-only.
- Private avatar bucket limited to 3 MiB JPG, PNG or WebP objects. Storage object policies restrict paths to the signed-in user's UUID folder; `adigunsps.adigun_profiles.avatar_path` stores the selected object path. The app creates a one-hour signed URL when it loads the profile, refreshes the top-bar image immediately after upload, and falls back to the default icon if URL creation or image loading fails. Replacement uploads use a new object path to avoid cached old images, then remove the prior avatar after the profile row points to the new path.
- Local browser storage remains available to signed-in users; the existing import/export flow can move project files to and from the device. IndexedDB project records and JSON exports are not application-layer encrypted or cryptographically signed.
- The app client targets only the `adigunsps` schema. Migration `20261101075618_adigunsps_schema_and_guest_upgrade` moved this product's existing tables without dropping rows, renamed cloud ownership fields to `user_id`, and repaired owner policies. Administrator profile visibility uses trusted `app_metadata.role`; user-editable metadata cannot grant administrator access.

## Supabase project state and setup

Live read-only audit on 2026-11-01 confirmed the cloud project and project-version owner policies, plus restrictive INSERT rules that reject anonymous identities; project-version inserts also require an owned project. Before the four-minute migration, the guest-session RPC used an empty search path, required `auth.uid()` and the anonymous JWT claim, created a fixed ten-minute record once, and could not renew it on conflict. After migration, a live query found 15 total guest-session records, 0 active, 15 expired, and 0 with expiry beyond four minutes after start. These checks confirm configured policy predicates but do not replace a two-user client-level isolation test.

### Hardware command schema (database only)

Migration `20261101161849_adigunsps_hardware_command_delivery` is applied to the AdigunSPs project and is versioned in `supabase/migrations/`. It creates `hardware_devices`, `hardware_client_heartbeats`, `hardware_device_state`, `hardware_commands`, and `hardware_device_events`, enables RLS, adds indexes, and publishes heartbeat, state, command, and event tables to Realtime. Live inspection confirmed all five tables, their policies and indexes, and four Realtime memberships; the tables currently contain no provisioned hardware devices or commands.

This schema does not implement device transport or firmware. Web Serial, command polling, device heartbeats/watchdog, ACK/NACK display, and physical output verification remain unimplemented. Do not energize hardware using the supplied circuit: the specified relay has 5V coils while the proposed wiring places 24V on the relay board's VCC. A qualified controls engineer must validate the exact board schematic, motor load and protection, isolated feedback, and safety-rated E-stop circuit before physical operation.

The project is `ACTIVE_HEALTHY` in `eu-west-1`. Applied migrations include `20261101114255_adigunsps_rls_query_performance` and `20261101161849_adigunsps_hardware_command_delivery`. At the 2026-11-01 audit, inventory showed 16 guest-session rows, 1 profile, 2 cloud projects, and 2 project versions. All five core application tables have RLS and owner policies with both `USING` and `WITH CHECK`; anonymous inserts are blocked by restrictive policies. The private `adigun-avatars` bucket and owner-folder policies exist. The RLS performance migration removes the app-specific multiple-permissive-profile-policy and auth-initplan findings and adds the missing `my_data.user_id` index. Security advisors still report the authenticated SECURITY DEFINER guest-session RPC and anonymous sign-in feature by design; leaked-password protection is reported unavailable on this Free plan. Both listed migrations are recorded in project history.

Copy `.env.example` to `.env` for local development and set the AdigunSPs publishable key. The URL is fixed to the project above. Never include a Supabase secret key, `service_role` key or database password in a browser build. `.env` is ignored by Git; the project's publishable key is intended for browser use and relies on RLS for data protection.

## Remaining external setup and verification

- Anonymous sign-in and email confirmation are enabled. Manual linking is enabled in the HQ dashboard. The server-side expiry RPC and client permissions are present in production; live expiry, email-confirmed upgrade and two-user isolation still require end-to-end test accounts.
- The live app's custom origin is `https://adigunsps.hephzibahbehulah.com/`. A read-only dashboard check on 2026-11-01 confirmed the Site URL and seven redirect patterns covering the app's GitHub Pages URL plus the AdigunSPs, AdigunSimulator, and AdigunElectroCAD custom domains. Email auth is enabled. The deployed reset route and root return HTTP 200; registration confirmation, password recovery with a real inbox, guest email upgrade, cloud save/reload, avatar upload and admin denial still need client-level end-to-end verification.
- Turnstile/CAPTCHA is not configured because no production hostname/site key was supplied.
- Administrator-role provisioning was not independently verified. Assign `app_metadata.role=admin` only through a trusted server-side Supabase admin process; never set it from this browser UI or user-editable metadata.
- The `adigunsps-ai` Cloudflare Worker is deployed at `https://adigunsps-ai.hephzibah-behulah.workers.dev` with its `AI` binding and Supabase publishable-key secret. The hosted-AI client is now published on Pages. Reachability and auth rejection were verified; authenticated inference or Neuron usage were not.
- Focused tests cover password sign-in, signup, recovery callback, protected reset route, guest upgrade, client schema/key pinning, and migration isolation/RLS policies. The current test suite also validates 1,000 example projects; these checks do not replace live multi-user RLS tests. Real inbox confirmation/recovery, cloud save/reload, avatar upload, and admin denial remain live-test items.





