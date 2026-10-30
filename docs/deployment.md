# Deployment

## Local development

No dependency install is required. Run `npm run dev` from this folder and visit `http://127.0.0.1:8080`. The development server serves the app and reloads the page after source changes. PWA installation and service-worker caching require localhost or HTTPS; opening `index.html` directly supports browser storage but does not install the service worker.

## Static hosting

Run `npm run build` to syntax-check the JavaScript modules, regenerate localized manifests, and create a deployable static bundle in `dist/`. Publish the contents of `dist/` to any HTTPS host. Keep `service-worker.js` at the same origin and path as `index.html`, and configure the host to serve the manifest and JavaScript modules with their normal MIME types. Releasing a service-worker update should increment its cache name in `service-worker.js`.

## On-premises

The current build has no server or account backend. An organization can host the static bundle on its internal HTTPS web server; project data remains in each browser's IndexedDB. Shared projects, identity, encryption at rest, centralized backup, and recovery need a selected backend and a separate security review before use.

## Backups and recovery

Export each project as JSON to keep a portable copy. The app stores a latest recovery snapshot in IndexedDB, but browser clearing, device loss, or profile deletion can remove local projects. There is no cloud backup or one-click restore service in this milestone.
