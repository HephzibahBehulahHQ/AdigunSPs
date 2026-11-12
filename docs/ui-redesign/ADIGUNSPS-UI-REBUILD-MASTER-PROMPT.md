# ADIGUNSPS — P0 ENGINEERING WORKSPACE & CANVAS REBUILD
**Status:** ACTIVE — implement immediately.
**Trigger:** `ADIGUNSPS_UI_REBUILD_NOW`
**Repository:** https://github.com/HephzibahBehulahHQ/AdigunSPs
**Production:** https://adigunsps.hephzibahbehulah.com/
**Visual contract:** [ADIGUNSPS-ENGINEERING-WORKSPACE-CONCEPT.svg](./ADIGUNSPS-ENGINEERING-WORKSPACE-CONCEPT.svg)
**Priority:** Suspend unrelated work at a safe boundary; protect partial progress. Execute this interface-only redesign now.

> **USER'S ABSOLUTE REQUIREMENT:** THIS IS ONLY A REARRANGEMENT AND REBUILD OF THE INTERFACE. **ALL OTHER FUNCTIONS REMAIN** and work exactly as before. No dummy controls, no placeholders, no damaged logic. The proposed image is a UI composition reference, NOT an electrically validated wiring circuit or permission to change engineering semantics.

## 1. Verified source-level causes to correct
- `index.html` puts a full-height app menu, a horizontally scrolling command ribbon, editor tabs and a subbar before the drawing. The user's 1894×704 screenshot shows almost no electrical board height.
- `src/electrical-ui.js` renders an expandable **519-entry manufacturer reference catalogue above** `.electrical-pane`; `.electrical-pane` uses `height:100%` while `.electrical-editor-pane` uses `overflow:hidden`. Their combination pushes/clips the actual board. Correct the layout constraint instead of hiding more content.
- The application has a right inspector (`#inspectorContent`) **and** the electrical editor creates a second 300px `.electrical-inspector` inside the center. Unify them.
- The electrical toolbar has many permanent buttons and wraps over multiple rows; move component/search/placement/rotation/duplication to the left contextual toolbox; selected component properties belong on right.
- `src/electrical.js` uses fixed 2200×1400 board and 20px grid; `createElectricalComponent` places with modular offsets and `duplicateElectricalComponent` can overlap its 120px-wide source. Add collision-aware placement (undoable) while keeping IDs, terminals and simulation unchanged.
- `src/electrical-ui.js` currently rebuilds all electrical DOM via `root.innerHTML` on many actions. Preserve input/focus/selection/scroll and avoid duplicated handler bindings when reorganizing.
- `src/app.js` coordinates views, inspectors and render calls. Do not break them. Current `src/ladder-virtualization.js`, `src/fbd-layout.js` and responsive tests must remain functional.

## 2. Required final layout (follow the visual specification)
### Global header / top empty area
Use the previously empty header zone for *truly global* actions: project identification, Save, Undo, Redo, Run/Pause/Stop status and command search. Keep the existing File/Edit/View/Project/PLC/SPS/I/O & Tags/Programs/Online/Debug/Tools/Window/Settings/Help menus reachable. Remove redundant permanently displayed toolbar duplicates, **not their functions**. Display advanced actions through the menus/command palette.
### Left contextual toolbox / previously unused side area
Keep project explorer; add an editor-aware toolbox and appropriate library drawer. In electrical mode show: search, generic model picker, Place Component, Select/Move, Connect Terminals, Rotate, Duplicate, delete where appropriate, and expandable manufacturer references (519, information-only). In LD show contacts/coils/branches/timers/counters; in FBD show applicable blocks/wiring; HMI widgets/screen actions; ST/SFC appropriate tools. Avoid showing all functions at once.
### Large central editor
Only editor tabs, **one compact contextual action row**, and a maximized useful canvas. Preserve keyboard controls, viewport state, selection, pan/zoom, grid and rendering. No catalogue above the board, no secondary properties inside the center, no scrolling the whole page to reach the board.
### Right contextual inspector
Use the existing right panel for all electrical component fields, selected ladder instructions, HMI widget information, terminal/wire details, Watch and diagnostics. Show properties relevant to the active editor and selected object. Hide incompatible fields rather than duplicating inspectors. Keep all existing save, validation and edit actions operational.
### Bottom status + Adigun BOT
Retain simulation/PLC, scan, I/O and safety boundaries in a slim bar. Dock or collapse the BOT so it never covers critical UI. On narrow screens prefer drawers, accessible collapsible panes and an unconstrained central editor.

## 3. Engineering fidelity — strict constraints
Keep all existing LD (contacts/coils, edge, TON/TOF/TP/RTO, CTU/CTD/RES/MCR supported subset), FBD, ST, SFC, HMI, PLCopen subset, electrical diagrams, generic simulation, tag/I/O mapping, faults, scenarios, scan engine, process models, reports, projects, local IndexedDB and recovery, cloud/Supabase, PWA offline, localization, BOT and existing hardware communication boundaries. No implementation should change simulation results, IEC behavior, project serialization, electrical topology, component IDs/references/terminal names/coil relationships or safety semantics merely for aesthetics. Never turn the manufacturer reference catalogue into hardware-certified models. Preserve current educational-only disclaimers.

## 4. Canvas architecture and non-overlap rules
Use layout containers with correct `min-width:0`, `min-height:0`, `flex:1` and `overflow:auto` only on intended scroll hosts. Give sidebars an appropriate max size and collapse/resize controls; center receives remaining width. Ensure responsive 1920×1080, **1894×704 (user screenshot)**, 1366×768, 1024×768, 760px and 390×844. No toolbar/label clipping, no hidden unreachable controls, no accidental window-level horizontal scroll. Use actual DOM bounding rectangle overlap tests. Test dark/light and all four localizations, long names and text scaling. Ensure selected controls remain accessible by keyboard, touch and screen readers.

## 5. Electrical geometry and wiring
Fix fixed-step auto-placement and overlap. Support grid snapping and collision-aware insert, duplicate and optional auto-arrange using *rendered rotated bounds*, respecting 20px model coordinates and existing board boundaries. Retain existing stable IDs, wire endpoint object pairs, terminal geometry and coil associations. One geometric transform for symbols, terminals, wires and zoom. Drag/keyboard moves must not detach wires. Auto-arrange is optional, explicit and undoable; never silently reroute topology or "fix" electrical logic.

## 6. Maintainable code and state
Audit command ownership and classify Global / Editor / Selection / Simulation / Advanced. Separate state, command dispatch, canvas view, panel controls and contextual inspector rendering where practical without replacing the framework (this repo is native ES modules + HTML/CSS). Preserve active selection, focus, in-progress fields, opened sections, scroll and zoom across renders and mode switches. Prefer low-risk incremental refactoring over a whole-app rewrite. UI state belongs in a separate view-state domain; do not create engineering-model modifications from a panel resize. Avoid duplicate event listeners.

## 7. Start immediately — execution plan
1. **P0 baseline:** checkpoint current `main`, create a feature branch and regression fixtures, capture rendering of all editors and store representative exported projects before changing layouts.
2. **P0 structural correction:** solve electrical viewport height/clipping, move catalogue/toolbox left, move electrical inspector right, keep working commands, maximize canvas; commit and test.
3. **P1 command reorganization:** simplify header/ribbon, move correct commands into marked free spaces, context-sensitive left toolboxes for LD/FBD/HMI/ST/SFC; keep menus/command palette complete and functional.
4. **P1 robust editing:** undoable collision avoidance, dependable wire geometry, zoom/pan, focus/selection persistence; avoid rewriting simulation logic.
5. **P1 responsive/a11y:** collapse/resizable panels, small-screen behavior, accessible keyboard/labels, themes and localization.
6. **P0 release gates:** targeted tests + `npm test` + `npm run build`, Playwright browser E2E and screenshot/bounding-box tests for all viewports, sample program execution parity, project save/import/export/reopen, service-worker/cache checks, CI green. Fix failures before proceeding.
7. **Preview and approval:** publish tested preview and actual post-implementation screenshots. Obtain visual user approval before production merge unless user explicitly overrides that gate. Keep rollback; merge verified code only and verify production app + homepage + actual schematic viewport.

## 8. Concrete repository test contracts
Keep the current test suite `tests/run-tests.js`, `tests/electrical.test.js`, `tests/fbd-gates.test.js`, `tests/responsive-layout.test.js`, `tests/service-worker.test.js`, `tests/help-guide.test.js` and others passing. Add **real browser** (not solely regex) checks that: board has useful minimum viewport height at 1894×704; no collision between toolbar and board; inspector is unique; all buttons execute; wire endpoints follow 90° rotation and move; duplicate avoids collisions; project/engine data snapshot unchanged after layout-only operations; selection focus retains; mobile drawer works; all editor tabs load; accessible labels remain. Update `docs/HELP.md` and `docs/user-guide.md` whenever UI controls change, as `AGENTS.md` requires.

## 9. Acceptance and reporting
Nothing is acceptable until there is **no clumsiness/overlap**, the canvas occupies the primary workspace, 519 catalogue entries remain searchable but do not consume canvas, a single contextual properties inspector replaces duplicate panels, all commands remain reachable and functional, visual design matches the concept, existing program and electrical models are unchanged, tests/build pass and actual browsers show the result. Report only changed files, tests, blockers, commit, PR and deployed URL. Do not claim a preview image is an implemented UI. No destructive changes, hidden failures, blanket forced patches, fake control or feature regression.

**START COMMAND:** `ADIGUNSPS_UI_REBUILD_NOW`

**Instruction to Codex:** Stop unrelated work safely at your next instruction boundary, read this master prompt and the SVG immediately, then IMPLEMENT this interface-only redesign. Every other existing function must remain. The user's implementation authorization is already given; do not solicit a redundant permission. Do not promise an unattended background completion.
