# Architecture and assumptions

## Architecture

AdigunSPs is a browser-first Progressive Web App implemented with native HTML, CSS, and JavaScript ES modules. It pins `@supabase/supabase-js` for account and cloud-project requests; Node.js provides the development server, static build, and test scripts. A typed TypeScript build is not present. `src/app.js` coordinates the interface and application state; focused modules implement LD/FBD/ST/SFC execution, electrical diagrams, validation, project storage, localization, HMI/process models, reporting, and PWA behavior. IndexedDB stores projects and recovery snapshots without application-layer encryption; JSON exports are unsigned. The service worker caches the application shell for offline use.

The application includes a deterministic scan engine, editable LD, FBD, ST, and SFC subsets, local project lifecycle, typed tags, simulation/debug tools, HMI screens, six educational process models, a curated offline Adigun BOT helper, and 200 localized learning examples. The electrical workspace provides generic terminal-defined components, digital paths, contactor/overload behavior, motor on/off behavior, and scalar analog I/O source/module/indicator paths. A separate searchable reference catalog lists 220 source-backed manufacturer product variants; they are not represented as supported vendor simulations. Scalar analog values do not model voltage/current physics. ST compilation uses a worker when available with a synchronous fallback. The 2D process mimic is an educational schematic, not an engineering twin. The app includes email/password account flows, profiles, server-issued guest expiry, owner-scoped cloud project copies, and a trusted-role admin overview in source. A 2026-11-01 hosted smoke at `https://adigunsps.hephzibahbehulah.com/` loaded the editor but showed an expired guest session and “Account required”; authenticated account behavior was not verified. Full IEC conformance, physical PLC connectivity, hardware compatibility validation, collaboration, and production assurance are not implemented; live authenticated hosted-AI use remains unverified.

## Assumptions

- The supplied phone screenshots define a compact, touch-friendly ladder editing workflow and rung/timer visual language.
- The official source repository is `HephzibahBehulahHQ/AdigunSPs`; the current source audit is based on `origin/main` commit `24625e1` (2026-11-01). GitHub Actions CI run #104 and Pages deploy #61 succeeded for this commit. Local `npm ci`, `npm test`, and `npm run build` also passed for that source.
- The dedicated AdigunSPs Supabase project is `fqcbfnktdvqojyezxeis`; VoltPro uses a separate Supabase project. The AdigunSPs project migrations and browser client configuration are documented in `supabase-integration.md`. GitHub Pages hosts the app; Cloudflare hosts the consent-gated AI Worker. The published Pages build includes the hosted-AI client and default Worker URL. Optional Actions variables can override or disable hosted AI.
- Local project data is stored in the browser. Cloud copies are owner-scoped and each save creates a new version; team collaboration, encrypted backup, disaster recovery, and live cross-user verification are not implemented.
- Yoruba and Nigerian Pidgin strings in this release are starter translations and need review by technical-language reviewers before production use.

## Risks and limits

- The editors support small educational subsets; they are not full IEC 61131-3 implementations. Tasks, hardware configuration, richer language constructs, and standardized PLCopen XML remain future work.
- Browser-local storage can be cleared by the user or browser. Export projects regularly.
- Example checks exercise the app's own boolean/timer model and do not certify behavior on a physical PLC.
- Safety guidance is educational only. The app does not implement safety PLC functions or hardware-in-the-loop.

## Phases

1. **Local educational vertical slice (implemented):** responsive LD/FBD/ST/SFC subsets, deterministic simulation/debug, local project lifecycle, HMI/process models, offline shell, four interface locales, 200 executable examples, and generic terminal-wired educational electrical components.
2. **IEC and device expansion (partial):** typed tags, configurable cyclic task, selected PLCopen XML support, conversion and validation exist; full IEC language/schema support, task/device trees, vendor compatibility, and physical downloads remain open.
3. **Learning and HMI (partial):** process simulators, tag-bound HMI screens, alarms, recipes, trends, and tutorials exist; reviewer-approved translations, durable historian, complete accessibility review, and richer HMI authoring remain open.
4. **Accounts and operations (partial):** Supabase auth/profile, time-limited guest flow, owner-scoped cloud copies, and a trusted-role admin overview exist in source; only an existing authenticated session was smoke-tested live. New-user and multi-user workflows remain unverified. Collaboration, audit/signatures, backup/disaster recovery, and licensing remain open.
5. **AI and release assurance (partial):** offline read-only Adigun BOT and a consent-gated Cloudflare Worker are published; the Worker verifies Supabase user tokens and pins its model. Live authenticated inference, privacy/retention review, evaluation gates, security/performance audits, and full cross-browser testing remain open.

Each later phase depends on stakeholder decisions about target PLC vendors, backend/data residency, AI model and privacy policy, Yoruba/Pidgin glossary review, and intended deployment environment.



