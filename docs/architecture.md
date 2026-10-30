# Architecture and assumptions

## Architecture

AdigunSPs is a browser-first Progressive Web App implemented with native HTML, CSS, and JavaScript ES modules. The runtime has no third-party package dependencies; Node.js provides the development server, static build, and test scripts. A typed TypeScript build is not present. `src/app.js` coordinates the interface and application state; focused modules implement LD/FBD/ST/SFC execution, electrical diagrams, validation, project storage, localization, HMI/process models, reporting, and PWA behavior. IndexedDB stores projects and recovery snapshots. The service worker caches the application shell for offline use.

The application includes a deterministic scan engine, editable LD, FBD, ST, and SFC subsets, local project lifecycle, typed tags, simulation/debug tools, HMI screens, six educational process models, a curated offline Adigun BOT helper, and 200 localized learning examples. The electrical workspace provides generic terminal-defined components, digital paths, contactor/overload behavior, motor on/off behavior, and scalar analog I/O source/module/indicator paths. Its scalar analog values do not model voltage/current physics. ST compilation uses a worker when available with a synchronous fallback. The 2D process mimic is an educational schematic, not an engineering twin. Full IEC conformance, physical PLC connectivity, manufacturer catalogs, cloud/team services, a model-backed AI service, and production assurance are not implemented.

## Assumptions

- The supplied phone screenshots define a compact, touch-friendly ladder editing workflow and rung/timer visual language.
- The official source repository is `HephzibahBehulahHQ/AdigunSPs`; local `main` is synchronized with its published commit. GitHub is source hosting, not production application hosting.
- The first milestone is an educational local simulator. The stakeholder repository is the only approved external link; no PLC hardware, backend, AI provider, or learning-resource URLs were provided.
- Local project data is stored in the browser on the device. Cloud sync, encryption, and multi-user access require a separately selected backend and security design.
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
4. **Team and operations (not implemented):** identity/backend decisions, roles, collaboration, audit/signatures, cloud backups, administration, and production hosting need approved stakeholder inputs.
5. **AI and release assurance (partial):** offline read-only Adigun BOT exists; model-backed services, policy/retention controls, evaluation gates, security/performance audits, cross-browser testing, and production deployment remain open.

Each later phase depends on stakeholder decisions about target PLC vendors, backend/data residency, AI model and privacy policy, Yoruba/Pidgin glossary review, and intended deployment environment.
