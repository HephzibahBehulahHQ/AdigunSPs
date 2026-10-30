# Architecture and assumptions

## Architecture

AdigunSPs is a browser-first Progressive Web App. The first release uses native HTML, CSS, and JavaScript modules to keep it installable, small, and dependency-free. The empty repository had no build system or package dependencies, so this milestone uses JavaScript; a typed TypeScript build remains a planned migration when the project model grows. The simulator is an independent module (`src/engine.js`) with a deterministic input → logic → output scan. UI rendering lives in `src/app.js`; the editor model and project storage are separate modules. IndexedDB stores projects and recovery snapshots. The service worker caches the application shell for offline use.

The ladder model supports series contacts, editable parallel branches, output coils, NO/NC contacts, digital tags, TON timer instructions, and rung breakpoints. The first-pass FBD engine adds CTU counting, rising/falling edge blocks, numeric arithmetic, and comparisons. A project validator checks block input counts and numeric types alongside contact types, timer presets, duplicate names and addresses, incomplete rungs, HMI bindings, and process model bindings. Structured Text and SFC remain Boolean subsets. The HMI editor stores simulated controls, alarms/history, recipes, deterministic process models, and a tag-bound schematic SVG mimic. The mimic is a live educational view, not an engineering twin with validated geometry or physical behavior. Full IEC conformance, standards-based interchange, analog alarms, historian, richer editors, and worker-based compilation remain planned work.

## Assumptions

- The supplied phone screenshots define a compact, touch-friendly ladder editing workflow and rung/timer visual language.
- The public GitHub repository was empty when checked. Source files are delivered in this workspace's `outputs/AdigunSPs` folder; they have not been pushed to GitHub.
- The first milestone is an educational local simulator. The stakeholder repository is the only approved external link; no PLC hardware, backend, AI provider, or learning-resource URLs were provided.
- Local project data is stored in the browser on the device. Cloud sync, encryption, and multi-user access require a separately selected backend and security design.
- Yoruba and Nigerian Pidgin strings in this release are starter translations and need review by technical-language reviewers before production use.

## Risks and limits

- The editors support small educational subsets; they are not full IEC 61131-3 implementations. Tasks, hardware configuration, richer language constructs, and standardized PLCopen XML remain future work.
- Browser-local storage can be cleared by the user or browser. Export projects regularly.
- Example checks exercise the app's own boolean/timer model and do not certify behavior on a physical PLC.
- Safety guidance is educational only. The app does not implement safety PLC functions or hardware-in-the-loop.

## Phases

1. **Working vertical slice (this release):** responsive LD/FBD/ST/SFC editors, deterministic simulation and debug trace, local project management, basic simulated HMI screen, offline shell, four interface locales, 200 executable learning examples, and a generic terminal-wired educational electrical workspace.
2. **IEC project model:** tasks and device trees, typed project-wide data, richer FBD/ST/SFC constructs, standardized import/export, and worker-based compilation.
3. **Learning and HMI:** process simulators, HMI designer, trends/alarms/recipes, tutorials, accessibility review, and four-language content review.
4. **Team and operations:** backend selection, authentication and roles, collaboration, audit/history, deployment, backups, protocol simulators, and admin tools.
5. **AI and release assurance:** consent-based assistant integration, evaluation and privacy controls, security/performance audits, cross-browser testing, and production deployment.

Each later phase depends on stakeholder decisions about target PLC vendors, backend/data residency, AI model and privacy policy, Yoruba/Pidgin glossary review, and intended deployment environment.
