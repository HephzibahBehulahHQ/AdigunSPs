# Master Build Prompt: AdigunSPs

## Role and Mission

Act as a senior electrical engineer, PLC/SPS architect, full-stack AI engineer, and web and app designer with 45 years of industry experience. Lead the engineering team responsible for designing, building, documenting, and delivering **AdigunSPs**.

AdigunSPs is a professional, educational programming and simulation platform for **SPS** (*Speicherprogrammierbare Steuerung*, the German term for PLC). Build it as a complete web and app-based product for learning, creating, testing, and reviewing PLC control programs.

Deliver a working product, not just a concept, mock-up, or technical plan. Every menu, button, editor interaction, simulation control, and example must perform its stated function. Do not leave dead links, placeholder screens, or unfinished controls. If the full product requires multiple releases, deliver it in clearly defined phases without silently dropping requirements.

## Product Requirements

Build AdigunSPs as a responsive, installable platform for desktop, tablet, and mobile. Support offline project work and a configurable cloud or on-premises backend. Make the interface suitable for both beginners and experienced engineers, with an industrial, professional visual design and a dark theme available by default.

Use a modular, strongly typed architecture. A recommended foundation is TypeScript, a modern web framework, an HTML5 Canvas editor, Web Workers for simulation and compilation, and SQLite or IndexedDB for local storage. Select the final stack based on the product’s cross-platform needs, document the decision, and keep the simulation engine independent of the UI framework.

## Programming and Project Workspace

Provide project creation and management, including create, open, rename, duplicate, save, autosave, delete, import, export, snapshots, and recovery. Organize programs using IEC 61131-3 concepts such as programs, functions, function blocks, and tasks.

Provide editors for:

- Ladder Diagram (LD)
- Function Block Diagram (FBD)
- Structured Text (ST)
- Sequential Function Chart (SFC) and state-machine logic

Include hardware and device configuration, I/O mapping, tag and variable management, data types, aliases, task and scan-cycle settings, and project properties. Support IEC 61131-3 XML import/export where practical. Any assisted conversion between ST, ladder, FBD, or SFC must validate the result and show the user what changed.

## Menus and Commands

Implement every menu item and connect it to a working function:

- **File:** New, Open, Save, Save As, Import, Export, Print, Recent Projects
- **Edit:** Undo, Redo, Cut, Copy, Paste, Delete, Find, Replace
- **View:** Zoom, Grid, Snap, Minimap, Panel Layout, Full Screen
- **Project:** Properties, Hardware Configuration, Device Tree, Tasks, Scan Cycle
- **PLC/SPS:** Connect or Simulate, Download, Run, Stop, Pause, Reset, Compile, Validate
- **I/O and Tags:** Digital and Analog I/O, Tag Tables, Aliases, Data Types, Force Values
- **Programs/POUs:** LD, FBD, ST, SFC, Programs, Functions, Function Blocks
- **Online/Simulation:** Start, Stop, Step, Breakpoints, Watch Tables, Trace, Force I/O, Fault Injection, Record and Replay
- **Debug/Diagnostics:** Compile Errors, Runtime Faults, Scan-Time Monitor, Event Log, Standards Checker
- **Tools:** Libraries, Example Browser, Plugin Manager, Adigun AI, Options, Keyboard Shortcuts
- **Window:** Tile, Cascade, Open and Close Panels
- **Help:** User Guide, Tutorials, Example Explanations, Resources, About
- **Settings:** Theme, Units, Language, Autosave, Simulation Speed, AI Policy, Accessibility

Add a global command palette with fuzzy search across menus, projects, tags, examples, and Adigun AI commands.

## Canvas Editors

Render the logic editors on an interactive canvas. Include panning, zooming, a grid, snap-to-grid, component placement, drag-and-drop, wiring, branches, selection and multi-selection, copy and paste, undo and redo, context menus, keyboard shortcuts, minimap, zoom-to-fit, and saved view state.

Validate connections and logic, and provide clear inline feedback for errors such as invalid connections, incompatible types, or unconnected logic. Support keyboard-only editing and wiring, touch gestures on mobile, and a screen-reader-accessible alternative tree for navigating the logic. Keep large projects responsive through canvas virtualization, lazy loading, and worker-based compilation or simulation.

## Simulation Engine

Build a deterministic, testable scan-cycle engine that follows the sequence **read inputs → execute logic → update outputs**. It must support run, pause, stop, step, and reset; live I/O changes; timers; counters; edge detection; arithmetic and comparison operations; interlocks; watch tables; breakpoints; event logs; and live value monitoring.

Add repeatable simulation recording and playback, scripted scenarios, fault injection, scan-cycle history, and time-travel debugging with historical breakpoints and state comparisons. Show energized logic and active outputs clearly in the editor and I/O panel.

Include process simulation modules for tank filling and draining, conveyors, motor inertia, heaters and coolers, pump curves, and PID tuning. Provide a 2D or 3D digital-twin view whose process elements can be bound to simulation tags.

## Interactive I/O and HMI

Provide an interactive HMI panel with simulated physical input switches and output indicators for digital and analog I/O, timers, and counters. Include tag-bound HMI widgets, trends, alarms, and recipes, plus a canvas-based HMI screen designer.

Provide alarm priorities, acknowledgement, suppression, shelving, event history, and audit records. Include recipe and parameter versioning, approval workflows, historian charts, data export, and configurable retention policies.

## Exactly 100 Tested Examples

Include **exactly 100 distinct, working, educational ladder-logic examples**, organized by difficulty and category. Cover basic logic, start/stop and latching circuits, interlocks, motor control, conveyors, traffic lights, tank-level control, alarms, timers, counters, sequencers, analog scaling, PID-style control, and diagnostic routines.

Every example must load into the editor and simulate immediately. Each must include its title, difficulty, description, learning objective, logic, tags, I/O map, initial state, expected behavior, test cases, expected outputs, and fault explanations. Verify each example against the simulation engine and report its test result. Provide localized learning content for all four required languages.

## Four-Language Support

Provide complete localization in:

1. English
2. German (Deutsch)
3. Yoruba (Yorùbá)
4. Nigerian Pidgin English

Localize menus, dialogs, tooltips, editor context menus, validation and compiler messages, runtime faults, alarms, help, tutorials, onboarding, settings, safety notices, accessibility labels, and the full example library.

Allow users to change the interface language without losing project state. Keep the interface language separate from the project language. Support locale-aware dates, times, numbers, decimals, and units. Maintain a reviewed technical glossary for PLC/SPS terms. Include translation key extraction, missing-key detection, review and approval status, fallback rules, and a localization dashboard. Treat Yoruba and Pidgin as first-class languages, with reviewed terminology rather than untranslated or machine-generated placeholder text. Check for untranslated strings, truncation, and layout issues in all four languages.

## Adigun AI

Include an always-available assistant called **Adigun AI**. It must answer general questions as well as questions about programming, electrical and PLC theory, and the current AdigunSPs project. Support concise answers, step-by-step explanations, tables, checklists, code or logic samples, diagram descriptions, and beginner explanations. Allow follow-up questions, streaming responses, stop and regenerate, question editing, and answers in any of the four languages.

When a project is open, Adigun AI may use its device tree, tags, I/O map, POUs, selected network, compile errors, simulation state, watch table, alarms, and current screen to answer project questions. Provide actions such as “Explain this network,” “Why won’t this compile?”, “Generate test cases,” “Suggest a fix,” “Convert this ladder to ST,” and “Review my program.”

Keep the assistant read-only by default. Require explicit user confirmation before it changes a project, inserts or wires logic, creates tags, starts a simulation, or performs another state-changing action. Record accepted changes with the user, time, and a diff. Never send project data to an external model or service without consent. Support local or offline operation where feasible, and provide administrator controls for model choice, data retention, privacy, routing, quotas, and allowed topics.

Ground engineering answers in AdigunSPs documentation, the example library, the technical glossary, and administrator-approved sources. Provide source links where available, disclose uncertainty, and suggest simulator verification. Include voice input and spoken answers in all four languages, accessible answer formatting, image or screenshot input for explanatory review, Socratic tutoring, quizzes, flashcards, and instructor review tools. Create a four-language evaluation set and release gates for answer quality, grounding, privacy, and safety.

## Engineering, Connectivity, and Collaboration

Provide role-based access for Owner, Project Engineer, Technician, Reviewer, and Viewer. Include project comments and annotations, mentions, change requests, approval workflows, version snapshots, visual logic diffs, rollback, audit trails, and electronic signatures for approved versions.

Support a plugin SDK and extension marketplace for custom blocks, themes, languages, and device adapters. Include a scripting API, POU unit testing, coverage reports, batch simulation, regression tests, and Git integration with CI-triggered simulation tests.

Provide educational connectivity options for OPC UA, Modbus TCP/RTU, MQTT, REST/WebSocket, CSV/JSON/SQL, and historian connections. Include a protocol simulator and traffic monitor. Hardware-in-the-loop connections must be restricted to supported hardware and supervised, sandboxed workflows with explicit safety controls.

Add code and documentation generation for PDFs, I/O schedules, bills of materials, wiring references, and test reports. Include an electrical schematic and panel-layout companion linked to I/O tags, with printable wiring sheets.

## Operations, Education, and Administration

Include energy and power dashboards, cost estimates, anomaly flags, runtime and duty-cycle tracking, advisory maintenance alerts, recipe and batch management, and production reports. Provide advisory IEC 61131-3 conformance hints, ISO 13849 awareness checks, and an IEC 62443 awareness dashboard. These are guidance features and must never be presented as certification.

Provide classroom assignments, grading, program similarity checks, learning reports, certificates, and certification-preparation exams. Support supervised remote educational labs with queueing and safety interlocks. Include a moderated community hub for sharing blocks, examples, and themes with ratings, version history, and license information.

Provide an admin console for user management, SSO, licensing and seat management, feature flags, AI policy, external resources, and localization review. Include optional, privacy-respecting telemetry, exportable analytics, automated local backups, encrypted cloud backups, disaster recovery, one-click restore, multi-monitor workspaces, and QR-code project handoff.

## External Resources

Create an administrator-managed external-resource registry with domain validation, approval, link checking, localized descriptions, broken-link reporting, and an access audit log. Show approved links only in designated areas such as Help, About, documentation, and example references. Open external links safely with a confirmation prompt; do not embed untrusted content. When offline, show the cached description and a clear availability status.

Integrate the stakeholder-provided external URL when it is available. Until then, provide a clearly identified configurable field rather than inventing a URL.

## Security, Accessibility, and Safety

Use secure authentication and session management, role-based access control, encrypted local storage, signed project files, and appropriate privacy safeguards. Test session timeouts, permissions, external-link handling, backups, and AI data-sharing controls.

AdigunSPs is an educational and simulation platform. It must not be described as a certified safety system or used as a substitute for certified safety PLCs, hardwired safety circuits, or formal functional-safety validation. Show this notice during onboarding, in About, in safety-related AI responses, in hardware-in-the-loop documentation, and in relevant exported reports. Require confirmation for destructive actions and actions that affect connected hardware.

Support keyboard and screen-reader use, high-contrast and dyslexia-friendly themes, localized accessibility labels, and accessible alternatives to canvas-only information.

## Verification and Deliverables

Test the application with unit, integration, and end-to-end checks. Verify every menu, canvas command, language switch, simulation control, AI quick action, external-resource flow, and example. Include localization, accessibility, security, cross-browser, and large-project performance checks. Report results accurately; do not claim a feature is verified unless the corresponding check has passed.

Deliver:

- Complete source repository and working application build
- Architecture and implementation documents
- Web, PWA, and on-premises deployment instructions
- User guide and interactive tutorials
- Functional menu map
- Exactly 100 examples with four-language content and test evidence
- Adigun AI design, privacy, guardrail, audit, and evaluation documents
- Localization kit and translation QA report
- External-resource configuration guide
- Test, accessibility, security, and performance reports
- Phased implementation plan with working milestone demonstrations

Begin by documenting the architecture, assumptions, risks, and implementation phases. Then build and verify a working vertical slice before completing the remaining modules. Keep the project aligned with the requirements above, and clearly identify any dependency that requires stakeholder input. The final release must be coherent, usable, documented, and demonstrably functional.
