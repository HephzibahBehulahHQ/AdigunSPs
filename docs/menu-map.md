# Functional menu map

| Area | Current control | Behavior |
|---|---|---|
| Project | Project name menu | Open projects ordered by last opened, create, duplicate, rename, delete, edit description/author/version and project-language properties, and recover snapshots |
| Application menus | File, Edit, View, Project, PLC/SPS, I/O & Tags, Programs, Online, Debug, Tools, Window, Settings, Help | Localized navigation groups expose implemented project, editor, simulation, diagnostics, panel, preferences, and help actions in English, German, Yoruba, and Nigerian Pidgin |
| File | New, Save, Save as, Import, Export, Print | Local project lifecycle, JSON transfer, browser print dialog |
| Edit | Undo, Redo, Cut, Copy, Paste, Find, Replace, Delete | Rung clipboard/history, tag or ST text replacement, selected contact removal |
| View | Zoom, Grid, Minimap, Panel layout, Full screen; HMI Snap | Canvas controls, persisted project/inspector panel visibility on desktop and tablet, temporary side drawers on phone, and snap or free HMI widget placement |
| Programs | LD, FBD, ST, SFC selector; HMI tab | Switch among implemented logic subsets; use normal/SET/RESET LD coils, CTU counters and TON timers, dependency-ordered FBD blocks with cycle diagnostics and linear analog scaling, or add and navigate project-persisted HMI screens with simulated switch, lamp, value, and trend widgets, BOOL alarms, and versioned input recipes |
| Components | Components tab | Browse generic PLC, I/O, controls, sensors, contactors, protection, motors, supplies, terminals, junctions, and PE; place/edit devices, configure generic I/O channel tags and addresses, connect terminal-to-terminal wires, validate, simulate, and persist the schematic with the project |
| Online / Simulation | Run, Pause, Step, Reset, I/O, Watch, Faults, Scenario, Breakpoints, Record, Replay, Trace, Events | Deterministic local simulation, typed scripted scan sequences with expected-output checks, digital input forcing, digital/numeric input and output faults, rung breakpoints, historical replay breakpoints, in-memory trace/replay, divergence report, scan-time/event history, JSON exports |
| Tags | Tags & I/O panel | Edit tag name, BOOL/INT/REAL/TIME type, role, address, alias; export I/O CSV, print schedule or generic wiring-reference worksheet, and enter project hardware inventory for BOM and tag-linked panel-layout reference exports; watch live values |
| Examples | Example browser | Search/filter and load one of 200 educational projects |
| Diagnostics | Debug → Standards check | Review supported project-model and active Structured Text consistency findings. This is not IEC, electrical-code, safety, device-rating, or vendor compliance certification. |
| Help | Help button | Safety notice, simulation guidance, and keyboard shortcuts |
| Settings | Settings gear and language button | Configure system/light/dark theme, autosave, simulation speed, high contrast, readable font, and interface locale on this device |

The remaining requested menus (PLC device tree and vendor configuration, multiple scheduled tasks, FBD/ST/SFC conformance tools, AI, protocol clients, administration, collaboration, and external-resource approval) need implementation in later phases. They are not represented as active controls yet. Hardware inventory is a user-entered BOM, not a device catalog or validated configuration.
