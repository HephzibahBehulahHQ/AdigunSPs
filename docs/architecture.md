# Architecture, assumptions, and delivery phases

## Architecture

AdigunSPs is a browser-first progressive web application built with native HTML, CSS, and JavaScript ES modules. Node.js supplies the local development server, static build, example validator, and automated test suite. The build has no TypeScript compiler or UI framework. `src/app.js` coordinates the interface and focused modules implement LD/FBD/ST/SFC editing and execution, electrical diagrams, validation, projects, localization, HMI/process models, reports, accounts, and offline behavior.

The PLC scan engine is deterministic and UI-independent: it reads inputs, evaluates supported program logic, and updates outputs. ST compilation uses a module worker when available with a synchronous fallback. Browser IndexedDB stores local projects and recovery snapshots; guest drafts are temporary. Application-level encryption and cryptographic project signatures are not implemented. A service worker caches the static shell for offline loading.

Supabase provides email/password accounts, profiles, guest expiry, and owner-scoped cloud copies. The Pages app uses a public publishable key; no service-role credential belongs in the browser. Optional hosted Adigun BOT answers go through a Cloudflare Worker that verifies a Supabase user token before calling its pinned Workers AI model. The local BOT remains available without hosted inference. Live authenticated inference and real email redemption are still unverified; see [`supabase-integration.md`](supabase-integration.md) and [`ADIGUN-AI-SETUP.md`](ADIGUN-AI-SETUP.md).

## Implemented vertical slice

- Local project creation, open, rename, duplicate, save/autosave, import/export, snapshots, and recovery.
- Educational subsets of LD, FBD, ST, and SFC, typed tags and I/O, deterministic simulation, scenarios, watch/fault tools, breakpoints, replay, and bounded scan history.
- HMI screens, alarms, recipes, trends, six educational process models, branded reports, and an offline PWA shell.
- Exactly 1,000 generated learning examples across six categories. The latest local validator reports 1,000/1,000 project model round-trips, 4,717 logic cases, 8,913 schematic checks, and 4,517 PLC-to-component integration cases passing. These verify the app's own supported model, not vendor behavior or engineering correctness.
- Forty-five generic electrical simulation models with editable symbols, component properties, terminal wiring, I/O mapping, validation, and electrical path behavior. Auxiliary contacts can be associated with relay/contactor coils; this is a Boolean/scalar teaching model, not physical electrical simulation.
- A separate 519-entry source-linked manufacturer reference catalog. Catalog entries are informational only and do not claim simulator support or hardware compatibility.
- English, German, Yoruba, and Nigerian Pidgin interface and example content; technical review of Yoruba/Pidgin remains pending.

See [`COMPONENTS.md`](COMPONENTS.md), [`requirements-status.md`](requirements-status.md), and [`verification.md`](verification.md) for current component limits, requirement coverage, and test evidence.

## Assumptions and boundaries

- The supplied mobile screenshots guide a touch-friendly ladder workspace and timer/rung layout.
- GitHub Pages serves the static app; Supabase and the consent-gated Cloudflare Worker are separate services. Local `.env` values do not become available in a Pages deployment unless the workflow explicitly injects the documented public runtime settings.
- The electrical and process models are educational. They do not model voltage/current dynamics, motor torque, verified device ratings, safety circuits, or machine stopping performance. No physical PLC connection, program download, or hardware-in-the-loop transport is implemented in this release.
- The supported LD/FBD/ST/SFC and PLCopen XML features are subsets, not full IEC 61131-3 or vendor compatibility implementations. Unsupported constructs are rejected or flagged.
- User-entered manufacturer data and hardware inventory are not verified by the application. The product is not a safety PLC, certified engineering system, or substitute for vendor and functional-safety validation.

## Risks and stakeholder dependencies

The current source and test suite can progress without inventing production requirements, but the following require stakeholder or specialist input before they can be claimed complete:

- Target PLC vendors/models, supported IEC dialects, authoritative product data, and vendor compatibility test systems.
- Physical commissioning design and qualified review for any future hardware control: relay-board schematic/electrical compatibility, motor nameplate and starting current, properly rated contactors/protection, feedback, hardwired energy isolation, and safety-rated E-stop/manual-reset design. A software watchdog and GPIO readback cannot prove that a relay contact opened or make an E-stop safety-rated.
- Data residency, offline/cloud synchronization, encryption and key recovery, backup retention, project-signature meaning and key custody, and account abuse controls.
- Hosted AI privacy/retention limits, request quotas, evaluation criteria, and live authenticated inference tests.
- Technical-speaker review for German, Yoruba, and Nigerian Pidgin PLC terminology and learning content.
- Accessibility, browser/device support, performance limits, educational grading, collaboration, licensing, and community policies.

Details and owner inputs are tracked in [`stakeholder-inputs.md`](stakeholder-inputs.md). No compatibility, credential, standard interpretation, or safety limit is assumed to be verified without evidence.

## Delivery phases

1. **Local educational workspace — implemented:** project lifecycle, LD/FBD/ST/SFC subsets, deterministic scans, HMI/process models, PWA shell, localized interface, and 1,000 tested example models.
2. **Electrical reference and educational circuit model — implemented with limits:** 45 generic components, terminal wiring, editable properties, coil-linked auxiliary contacts, electrical validation, and 519 sourced catalog references. Physical behavior and manufacturer-compatible simulation are not implemented.
3. **Accounts, cloud projects, and hosted BOT — partial:** Supabase authentication, four-minute guest expiry, owner-scoped project copies, consent-gated Worker, and local BOT are present. Live inbox, guest-upgrade, cloud save/reload, multi-user RLS, and authenticated hosted-inference workflows still need acceptance testing.
4. **IEC/device, collaboration, and operations expansion — open:** full IEC language/POU/task support, PLC downloads, hardware-in-the-loop, additional network protocols, collaboration, signatures, durable historian, licensing, backups, and disaster recovery require technical and policy decisions.
5. **Release assurance — partial:** automated tests and static build pass locally; full browser E2E, cross-browser/PWA installation, accessibility, security, performance, human translation review, and physical validation are outstanding. Consult [`verification.md`](verification.md) before describing the product as release-qualified.
