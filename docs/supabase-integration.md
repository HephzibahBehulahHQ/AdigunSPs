# AdigunSPs Supabase Integration

The app uses the dedicated `HephzibahBehulahHQ` project `fqcbfnktdvqojyezxeis` at `https://fqcbfnktdvqojyezxeis.supabase.co`. VoltPro is a separate project (`vnckoocsookbaqalybje`) and must not receive AdigunSPs migrations or runtime requests.

## Implemented

- Pinned `@supabase/supabase-js` and a runtime guard that accepts only the AdigunSPs project URL and rejects recognizable secret/service-role keys.
- Email/password sign-up, sign-in, password-reset, profile editing and avatar upload UI. The AdigunSPs dashboard shows email confirmation, anonymous sign-ins, and manual linking enabled (manual linking enabled 2026-11-01).
- Owner-scoped cloud project records with append-only JSON project versions. Each Save to Cloud creates a new cloud copy; it does not overwrite another version.
- Anonymous access now uses one immutable ten-minute expiry per Supabase anonymous user. The app branch requests it through `adigun_ensure_guest_session`, shows a countdown, blocks editing after expiry, and keeps autosaved guest work only in tab-scoped `sessionStorage` until authentication. The guest upgrade still uses separate email-confirmation and password-update steps. Cloud INSERT remains permanent-account-only.
- Private avatar bucket limited to 3 MiB JPG, PNG or WebP objects. Storage object policies restrict paths to the signed-in user's UUID folder.
- Local browser storage remains available to signed-in users; the existing import/export flow can move project files to and from the device.
- The app client targets only the `adigunsps` schema. Migration `20261101075618_adigunsps_schema_and_guest_upgrade` moved this product's existing tables without dropping rows, renamed cloud ownership fields to `user_id`, and repaired owner policies. Administrator profile visibility uses trusted `app_metadata.role`; user-editable metadata cannot grant administrator access.

## Supabase project state and setup

The project is `ACTIVE_HEALTHY` in `eu-west-1`. Applied migrations are `20261030131133_adigunsps_auth_cloud`, `20261030131611_index_cloud_version_owner`, and `20261101075618_adigunsps_schema_and_guest_upgrade`, and `20261101085102_enforce_guest_session_expiry`. The four app tables now live in `adigunsps`; migration verification confirmed the 7 guest-session rows remain, while cloud projects and versions remain empty. All five application tables have RLS and owner policies with both `USING` and `WITH CHECK`; anonymous inserts are blocked by restrictive policies. The private `adigun-avatars` bucket and owner-folder policies exist. Earlier security advisors reported policy warnings and leaked-password protection disabled; the plan is Free.

Copy `.env.example` to `.env` for local development and set the AdigunSPs publishable key. The URL is fixed to the project above. Never include a Supabase secret key, `service_role` key or database password in a browser build. `.env` is ignored by Git; the project's publishable key is intended for browser use and relies on RLS for data protection.

## Remaining external setup and verification

- Anonymous sign-in and email confirmation are enabled. Manual linking is enabled in the HQ dashboard. The server-side expiry RPC and client permissions were verified after the new migration; the updated client branch is not yet published, and live expiry, email-confirmed upgrade and two-user isolation still require end-to-end test accounts.
- The production origin is `https://hephzibahbehulahhq.github.io/AdigunSPs/`; on 2026-10-31 the live app recognized an existing authenticated session and successfully refreshed that account's cloud-project list (empty). The Auth Site URL is `https://hephzibahbehulahhq.github.io/AdigunSPs/`, and the allowlist contains that exact URL as its only entry (dashboard checked 2026-10-31). New registration, password-reset and email-confirmation redirects have not been end-to-end verified.
- Turnstile/CAPTCHA is not configured because no production hostname/site key was supplied.
- Administrator-role provisioning was not independently verified. Assign `app_metadata.role=admin` only through a trusted server-side Supabase admin process; never set it from this browser UI or user-editable metadata.
- Cloudflare account/deployment access is not connected in this workspace. GitHub Actions confirmed the GitHub Pages deployment for `e29a5c7` completed successfully at `https://hephzibahbehulahhq.github.io/AdigunSPs/`.
- Focused tests cover two-step guest upgrade, client schema/key pinning, and migration isolation/RLS policies; `npm test` passed including 200 examples, 1,317 logic cases, 903 schematic checks, and 1,317 integrated PLC-to-component cases. These checks do not replace live multi-user RLS tests. Real signup/confirmation/reset, cloud save/reload, avatar upload, and admin denial remain live-test items.
