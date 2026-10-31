# Verification record

## Current verification — 2026-10-31

- `npm test` passed: all 200 example projects, 1,317 logic cases, 903 schematic checks, and 1,317 integrated PLC-to-component cases, plus the focused branding, accessibility, Supabase, account, hardware, AI, resource, protocol, and allocator checks.
- `npm run build` passed and syntax-checked 45 source modules; `git -c core.whitespace=cr-at-eol diff --check` reported no whitespace errors.
- GitHub CI run 41241827147 and GitHub Pages deployment run 41241827187 both completed successfully for documentation commit `669b063` on 2026-10-31; the application implementation remains the previously verified `e29a5c7` build.
- A live browser smoke on 2026-10-31 opened the deployed PLC editor, showed `ALL GOOD` diagnostics, recognized an existing authenticated session, and successfully refreshed the cloud-project list (empty account). This does not verify new account registration, email confirmation/reset, guest access, cloud project writes, or multi-user isolation.
- Supabase project `fqcbfnktdvqojyezxeis` reported `ACTIVE_HEALTHY`; both repository migrations are present and all four public application tables report RLS enabled. The production Site URL and exact Pages redirect allowlist were inspected; Auth toggles and real user data isolation were not inspected. Current security advisors report two policy warnings and leaked-password protection disabled; Pro is required for the latter.
- Remaining limits are listed in `requirements-status.md` and `stakeholder-inputs.md`; deployment does not make this educational simulator a certified safety PLC or validate physical hardware.
## Historical checks — 2026-10-30

- `npm run build` passed: syntax checks passed across 40 source modules, localized manifests were generated from the central brand configuration, and a self-contained static bundle was written to ignored `dist/`.
- `npm test` passed: 200 examples and 1,317 deterministic cases, plus branding, hardware/report, Adigun BOT, resource, and Modbus TCP checks.
- Branding checks verify the exact supplied corporate/social destinations, localized Help/docs and LinkedIn personal-profile labels, a current-year footer, safe external-link attributes, and cache-version refresh. The search result associated the official website with the stakeholder's personal LinkedIn profile; direct social-platform pages were not fetchable by the research service, so independent live availability of those profiles remains unverified.
- Live preview interaction verified the first-run screen, editor, Components catalog, symbol placement/deletion, terminal connection, four locales, and light/dark branding. Full user workflow, responsive layout, PWA install, and browser accessibility remain unverified; the preview address is `http://127.0.0.1:8080/` when the local development server is running.
- The organization repository is accessible. `main` was updated through the connected GitHub integration after local Git credential spawning failed; the published component-library milestone is commit `5fc6c4b6712de3bfaf6902b5857c3e664dde3545`. The local branch was synchronized to that remote commit.

## Automated checks run

- `npm test` — passed: exactly 200 examples and 1,317 cases, including LD pointer/touch and Shift+Arrow contact move, reorder/move safeguards; FBD SCALE range/clamp scenarios and PID disabled/setpoint/limit cases; five LD counter exercises; five LD sequencers with repeatable multi-scan scenarios; SET/RESET coil retention; LD rising/falling one-scan contacts and CTU rising-edge/count/reset; LD TON delay/reset; LD-to-FBD edge-preserving conversion bindings; deterministic input replay; digital and analog fault injection; pause-before-rung breakpoints and resume; ST Boolean/numeric execution including division-by-zero diagnostics; FBD logic; SFC transitions; validation negatives; four-locale alarm labels; and static UI selector bindings.
- `npm run validate:examples` — passed 200/200 examples, 1,317 PLC logic cases, 903 schematic I/O checks, and 1,317 integrated PLC-to-component cases. Each documented scenario is replayed through wired Boolean/scalar analog input paths, the example scan and process model, and a connected digital load or analog indicator where applicable. The machine-readable per-example results are in `engineering-validation-report.json`. Scalar analog paths do not simulate voltage/current physics; physical wiring, manufacturer devices, standards, layout quality, and safety are not certified.
- `npm run test:electrical` — passed focused generic catalog, digital and scalar analog terminal wiring, coil-powered contactor pole/auxiliary switching, three-phase motor state, I/O role mapping, project validation, and JSON persistence checks.
- Components workspace build and live preview interaction passed for opening the catalog, placing/deleting symbols, selecting two terminals, and observing a saved wire. Full property editing, touch movement, save/reload recovery, mobile layout, and browser E2E coverage remain unverified.
- PLCopen TC6 XML checks — verify generated namespace, escaped project name, tag declarations, I/O addresses, NO/NC contacts, and rejection of timer networks; the generated fixture parses as well-formed XML. Browser import/export interaction and vendor compatibility remain unverified.
- PLC/device profile checks — verify a localized Project menu entry in all four locales and that optional controller fields save into the project model; browser editing and data recovery are not separately exercised.
- FBD instruction tests — CTU counts rising pulses to preset, R_TRIG emits a one-scan pulse, ADD reads REAL values, and GT compares numeric inputs.
- LD/FBD timer checks — TON, TOF, and TP timing, hold, reset/expiry, preset validation, and timer selector bindings run in the simulator suite.
- Structured Text checks — nested IF/ELSIF/ELSE branch execution and missing-END_IF diagnostics, XOR truth cases, MOD precedence and integer assignment, and modulo-by-zero diagnostics run in the interpreter suite.
- Structured Text worker checks — verify worker message IDs, successful compilation results, cache inclusion, compile-result reuse during scans, and synchronous fallback wiring. Browser worker execution remains unverified on a served origin.
- Large-ladder virtualization checks — verify viewport range calculation, bounded rendered rung count, Enter/Space activation of focused outline networks, full-list printing, and offline caching of the virtual-window module. Browser interaction with a large imported project remains to be checked.
- Large-FBD spatial-window checks — verify viewport intersection, bounded block selection, selected offscreen block retention, and outline navigation. Browser interaction with a large FBD project remains to be checked.
- Example-library loading check — verify `src/app.js` has no eager examples import and loads examples through a dynamic import when example browsing, palette search, or learning-content reports need them.
- FBD dependency checks — verify reverse-listed consumers execute after their producers, cycle graphs stop execution with diagnostics, and validation rejects duplicate output producers.
- FBD wiring check — static binding check verifies output/input ports, drag-to-connect persistence, and connection rendering; valid keyboard wiring was also exercised in the live browser, while pointer wiring remains unverified.
- FBD canvas layout checks — pure layout checks verify default placement, snapped group movement, free movement bounds, and preservation of unselected blocks; UI bindings provide pointer dragging and arrow-key placement. Live pointer interaction remains unverified in a browser.
- FBD viewport checks — verify zoom-to-fit bounds and that app bindings save FBD pan/zoom state; pointer-based panning and zoom rendering still need browser interaction QA.
- FBD clipboard checks — verify multi-block copies, fresh IDs and offset placement on paste, and selected-only deletion; keyboard/context-menu dispatch is statically bound and still needs live browser interaction QA.
- FBD connection diagnostics — verify missing inputs, numeric/bool type mismatches, duplicate/cyclic producers, and valid GT BOOL outputs; each FBD card exposes localized accessible status feedback. Valid FBD rendering and diagnostics were verified live; invalid-wire rejection still needs browser verification.
- LD selection checks — additive/toggle selection, grouped deletion across branches, stable index removal, and preservation of the prior project model are covered by the focused selection tests.
- Context menu check — static bindings confirm translated LD contact, coil, and rung actions plus keyboard escape/outside-click closing; live pointer interaction remains unverified.
- FBD SCALE checks — validate finite nonzero raw ranges, convert raw values to engineering units, and clamp to the scaled output range.
- HMI domain tests — passed for BOOL and numeric high/low threshold alarm raise/clear behavior, acknowledgement/shelving/suppression, recipe versioning/application, and invalid HMI role, priority, version, and value-type diagnostics.
- HMI layout tests — verify grid snapping, free within-cell offsets, and board bounds; live pointer interaction remains unverified in a browser.
- Trend history tests — verify configurable ring-buffer trimming, numeric chart normalization, branded CSV metadata, UTC sample timestamps, and export wiring; retention is session-only and resets on reload.
- Process model tests — tank fill/drain state, conveyor position, motor inertia, separate heater/cooler response and passive ambient loss, pump curve, and bounded PID output are covered by `npm test`.
- Operations tests — simulated elapsed time, per-output runtime, user-entered load/tariff calculations, duty-threshold advisories, and four-locale branded CSV escaping are covered by `npm test`; they do not verify physical energy or equipment health.
- Output fault tests — verify simulated digital output forcing and analog output offsets, and confirm output faults do not change input values.
- Scripted scenario tests — accept typed scan frames, execute consecutive LD scans, compare expected outputs, and reject unknown or wrong-type tags, nonfinite values, and invalid scan times.
- Historical breakpoint tests — verify replay pause conditions, marker export bindings, and marker shifting when the 5,000-scan history window advances; live trace interaction remains unverified in a browser.
- Process view test — confirms the 2D SVG mimic includes live tag binding, current tank level, and hides when no process model is configured.
- Branding checks — confirm the approved single corporate logo, separate AdigunSPs text identity and product launcher icons, HB Elektroniker division label, official palette, four localized hierarchies, light/dark application themes, PWA manifests, splash assets, and offline-cache references.
- Adigun BOT checks — `npm run test:ai` covers offline scan/timer teaching, project and selected-network grounding, local diagnostics, safety disclosure, four locales, header/menu entry points, and service-worker caching. It does not evaluate model-backed answers or human-reviewed translation quality.
- External-resource checks — `npm run test:resources` verifies exact HTTPS URL approval, rejection of credentials/non-HTTPS URLs, four-language descriptions, available/broken/unverified link outcomes, local access logging, and four-locale Help menu bindings. Live remote link checks, organization-level roles, and browser UI behavior remain unverified.
- Modbus TCP simulator checks — `npm run test:protocol` covers read/write functions 1–6, 15, and 16, MBAP validation, address overflow exceptions, unsupported functions, four-locale Tools entries, and offline cache bindings. Live browser interaction and vendor interoperability remain unverified.
- Live preview browser check — opened the app over localhost, verified the branded first-run screen and editor, applied the light theme, and switched through German, Yoruba, Nigerian Pidgin, and English while checking the logo, localized division label, attribution, and theme. Floating Adigun BOT dialog interaction and larger engineering workflows still need browser exercise.
- Localized PWA brand checks — verify four install manifests keep the company and product names unchanged, localize surrounding text, retain product icons, and are available offline.
- Event log localization checks — verify title, summary, empty state, export action, timestamps, and 16 event categories are localized for EN/DE/YO/PCM.
- Project-language checks — verify the document language remains separate from interface language and generated reports use a supported project language with a safe fallback.
- Standards-checker checks — verify Debug exposes the checker in all locales, the starter project passes, active ST compiler errors surface, and its limits exclude IEC, electrical-code, safety, device, and vendor certification.
- I/O schedule checks — confirm localized CSV headings, branded metadata, initial values, UTF-8 BOM, escaped quotes, stable address ordering, and print-sheet logo/data escaping.
- Wiring reference report checks — confirm the printable worksheet contains mapped I/O tags/addresses, branded marks, localized headings, escaped content, and explicitly blank terminal/wire details; it does not generate vendor-specific electrical connections.
- Hardware BOM focused checks — `npm run test:hardware` validates required descriptions, positive whole-number quantities, four-locale branded CSV/print output, escaping, and UI export bindings. The inventory is user-entered and does not validate real equipment selection or ratings.
- Example test-report checks — confirm localized CSV headings, product/company metadata, scenario names, pass/fail results, expected/actual values, and fault explanations.
- Localization audit checks — verify all four core-interface and learning-content locales are complete, missing strings are reported, and review status remains pending.
- Theme checks — focused tests cover system/light/dark resolution and palette wiring; manual preference saving and rendered asset switching were not included in the live browser walkthrough.
- Panel layout checks — static UI bindings cover persisted desktop/tablet panel toggles and the phone side-drawer actions; live viewport interaction still needs browser verification.
- `node --check` — passed for the application, engine, storage, example library, Structured Text interpreter, fault module, and service worker modules.
- PWA manifest JSON parse — passed.
- Settings UI selector bindings — included in the static page-binding check; settings behavior has not been exercised in the live browser.
- Event log and trace export controls — included in the static selector check; file-download and live modal behavior have not been exercised in a browser.
- HMI renderer, trend widgets, and pointer/touch reposition handler — checked statically; tag binding, drag placement, and live refresh still need browser interaction testing.
- Tag and project validation — passed for the starter project; detected non-BOOL contacts and invalid timer presets in negative cases.

## Not yet verified

- Live browser smoke check — on a clean localhost origin, confirmed first-run branding/safety notice, LD-to-FBD switching, valid generated blocks with declared intermediates, keyboard port connection feedback, and Motor = TRUE after Start plus Run. Find reports three matches for an internal FBD tag. Menu contents, settings/theme switching, install flow, responsive layouts, and pointer wiring remain unverified.
- Browser refresh check — refreshed the current workspace `index.html` in Chrome; the UI showed the official `AdigunSPs` product name without the former unsupplied tagline and retained company attribution. Project-language selection and document export were not manually exercised.
- Cross-browser behavior, mobile screen-reader behavior, full four-language layout and wording review, security assessment, and large-project performance.
- Automated checks do not cover every menu action, branch editing interaction, settings persistence, watch/force interaction, alarm/recipe UI, event-log UI, trace export UI, or complete UI workflow.
- No test here verifies a physical PLC or certifies any safety behavior.

The AI design and stakeholder-dependent decisions are documented in `adigun-ai-design.md` and `stakeholder-inputs.md`. The AI service itself and the broader platform requirements remain unimplemented.

## Release gate

Do not describe this milestone as production-ready. Complete the later phases in `architecture.md`, review Yoruba and Nigerian Pidgin terminology with technical speakers, and run the listed browser, accessibility, security, and performance checks before a production release.

- Scenario report checks — verify four-locale branded CSV/print output, result fields, and escaping for user-supplied names.

- Panel layout reference checks — verify localized labels, company/product marks, escaped item names/positions, and user-entered tag/address mappings; this report does not validate electrical design.

- Recent-project checks — verify last-opened sort order, updatedAt fallback, and non-mutating list sort; IndexedDB touch persistence is wired without adding a recovery snapshot.

- HMI screen checks — verify legacy single-screen migration, independent widget sets, screen selection/rename/delete constraints, inactive-screen widget validation, and offline-cache binding.


- FBD accessibility checks — verify localized function-block outlines, focus movement, keyboard port wiring, and rejection of incompatible or cyclic connections.
- Program find checks — verify case-insensitive ST search and tag-reference search across LD, FBD, and SFC data; project tag replacement updates linked references.
- LD-to-FBD conversion checks — verify generated intermediate BOOL tags are declared uniquely, converted timer/coil inputs pass FBD validation, and normally-closed interlocks produce the expected output.
- SFC accessibility checks — verify localized step and transition outline labels, keyboard tree navigation, and focus navigation to each corresponding editor control.
- Export safety checks — verify the localized educational safety notice appears in I/O schedule, BOM, scenario, example-test, and trend CSVs, while printable reports include the same app-level sa

