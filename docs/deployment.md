# Deployment

## Local development

Install the pinned dependencies with `npm ci`, copy `.env.example` to `.env`, and configure the AdigunSPs publishable Supabase key. Run `npm run dev` from this folder and visit `http://127.0.0.1:8080`. The development server serves the app and reloads the page after source changes. PWA installation and service-worker caching require localhost or HTTPS; opening `index.html` directly supports browser storage but does not install the service worker.

## Static hosting

Run `npm ci` and `npm run build` to syntax-check the JavaScript modules, regenerate localized manifests, and create a deployable static bundle in `dist/`. Publish the contents of `dist/` to an HTTPS host. Configure that exact origin and the preview origins in the AdigunSPs Supabase Auth URL allowlist before enabling account workflows there; never add an unverified production URL. Keep `service-worker.js` at the same origin and path as `index.html`, and configure the host to serve the manifest and JavaScript modules with their normal MIME types. Releasing a service-worker update should increment its cache name in `service-worker.js`.

## On-premises

The application is a static client with Supabase-hosted identity, profiles, private avatars, and owner-scoped cloud project copies. An organization can host the static bundle on an internal HTTPS web server while keeping the separate AdigunSPs Supabase project as its account backend. Local project data remains in each browser's IndexedDB; cloud copies are user-controlled project saves, not a managed backup or disaster-recovery service. Team sharing, encryption/key-management design, centralized backup, and recovery require further security review.

## Backups and recovery

Export each project as JSON to keep a portable copy. The app stores a latest recovery snapshot in IndexedDB, but browser clearing, device loss, or profile deletion can remove local projects. Signed-in users can create and reopen owner-scoped cloud project copies; this does not provide automatic backup schedules, retention guarantees, or disaster recovery.
