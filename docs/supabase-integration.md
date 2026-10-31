# AdigunSPs Supabase Integration

The app uses the dedicated `HephzibahBehulahHQ` project `fqcbfnktdvqojyezxeis` at `https://fqcbfnktdvqojyezxeis.supabase.co`. VoltPro is a separate project (`vnckoocsookbaqalybje`) and must not receive AdigunSPs migrations or runtime requests.

## Implemented

- Pinned `@supabase/supabase-js` and a runtime guard that accepts only the AdigunSPs project URL and rejects recognizable secret/service-role keys.
- Email/password sign-up, sign-in, password-reset, profile editing and avatar upload UI. The current email-confirmation toggle was not independently checked.
- Owner-scoped cloud project records with append-only JSON project versions. Each Save to Cloud creates a new cloud copy; it does not overwrite another version.
- Server-issued 10-minute anonymous guest expiry records. Guest records cannot read or write cloud projects; the client blocks editing at expiry and retains temporary local work for account recovery.
- Private avatar bucket limited to 3 MiB JPG, PNG or WebP objects. Storage object policies restrict paths to the signed-in user's UUID folder.
- Local browser storage remains available to signed-in users; the existing import/export flow can move project files to and from the device.
- Migration SQL is kept in `supabase/migrations/` and applied to the dedicated HQ project. Public user tables have RLS enabled. Administrator profile visibility uses trusted `app_metadata.role`; user-editable metadata cannot grant administrator access.

## Supabase project state and setup

The project is `ACTIVE_HEALTHY` in `eu-west-1`. Applied migrations are `20261030131133_adigunsps_auth_cloud` and `20261030131611_index_cloud_version_owner`. All four AdigunSPs public tables have RLS enabled, and the private `adigun-avatars` bucket and owner-folder policies exist. On 2026-10-31, security advisors reported two Anonymous Access Policies warnings (profile and storage-object policies) and one Leaked Password Protection Disabled warning. The affected profile and storage policies remain UID/path-scoped; avatar writes also reject anonymous JWTs. Leaked-password checking is available only on Supabase Pro, while the organization is on Free. Performance advisors reported 11 Auth RLS initialization notices and two unused indexes. These require review after live multi-user use; they are not evidence that RLS is disabled.

Copy `.env.example` to `.env` for local development and set the AdigunSPs publishable key. The URL is fixed to the project above. Never include a Supabase secret key, `service_role` key or database password in a browser build. `.env` is ignored by Git; the project's publishable key is intended for browser use and relies on RLS for data protection.

## Remaining external setup and verification

- Guest mode requests a Supabase anonymous user and server-issued expiry. The current anonymous-sign-in Auth toggle was not independently inspected in this audit, and guest creation/expiry were not live-tested. Supabase applies its documented IP rate limits; this app does not claim to prevent repeated guest access.
- The production origin is `https://hephzibahbehulahhq.github.io/AdigunSPs/`, and the live app recognized an existing authenticated session on 2026-10-31. The Auth Site URL is `https://hephzibahbehulahhq.github.io/AdigunSPs/`, and the allowlist contains that exact URL as its only entry (dashboard checked 2026-10-31). Password-reset and email-confirmation redirects have not been end-to-end verified.
- Turnstile/CAPTCHA is not configured because no production hostname/site key was supplied.
- Administrator-role provisioning was not independently verified. Assign `app_metadata.role=admin` only through a trusted server-side Supabase admin process; never set it from this browser UI or user-editable metadata.
- Cloudflare account/deployment access is not connected in this workspace. GitHub Actions confirmed the GitHub Pages deployment for `e29a5c7` completed successfully at `https://hephzibahbehulahhq.github.io/AdigunSPs/`.
- Focused local tests cover account auth delegation, guest expiry handling, cloud authorization boundaries and client project/key pinning; the full project suite passed again on 2026-10-31, including 200 example projects, 1,317 logic cases, 903 schematic checks, and 1,317 integrated PLC-to-component cases. These tests do not replace live multi-user RLS tests. Real signup/confirmation/reset, cloud save/reload, avatar upload, expired guest transition and admin denial require Auth settings, callback configuration, test accounts and an enabled preview connection.
