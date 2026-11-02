# Verification record

## Live cache-recovery verification — 2026-11-02

- A fresh browser tab at the production custom-domain root rendered 519 manufacturer references after recovery installation; the earlier stale count was 391.
- The workspace displayed Untitled project, Saved locally, and Account. Captured browser error logs were empty. This does not establish new sign-in, session validity, cloud save/reload, or preservation of nonempty projects.
- The focused service-worker test passed again. The earlier recovery tab was unavailable; a fresh production tab supplied the rendered-release evidence.

## Latest release verification — 2026-11-01 (password recovery)

- Application commit `269260c8b41effed7333f34681c22980d9ccbcd0` and documentation follow-up `3a9733c909244178a7fee61774d3efd129c627c2` were published to `main`; CI runs `41475890441` and `41476735002`, and Pages runs `41475890592` and `41476734389` all succeeded.
- Live HTTP probes returned 200 for the custom-domain root and `/reset-password/`. This verifies published route availability, not actual email delivery or password recovery redemption.
- `npm test` and `npm run build` passed on the tested source before publication; account and Help guide focused tests passed after merge. The available example-validation report records 1,000 projects, 4,717 PLC logic cases, 8,913 schematic checks, 4,517 integrated cases, and 1,000 project-model JSON round-trips. It also records 1,104 floating-terminal warnings and 15 duplicate-address warnings; passing checks do not certify layout, electrical design, physical wiring, or safety.
- The browser app can search and offer to load matching examples through Adigun BOT; automated tests cover this path. HUD voltage, current, and RPM are explicitly unmodeled. Physical-device control is not available.
- Supabase Auth Site URL and redirect allowlist were already correct on read-only dashboard inspection. The main sign-in flow uses email/password, and the reset route is published; signup confirmation, password-recovery email redemption, guest upgrade, cloud save/reload, avatar upload and multi-user RLS behavior still need approved live test accounts.

- Production Account panel identified the existing signed-in session and Refresh cloud projects returned two existing project rows with Open controls. No credentials or profile data were changed. New login, cloud writes, and cloud content round-trip remain unverified.
- New project created a separate empty local record. Rename used a native browser prompt that was not exposed by the current browser automation; no name was changed. This limits that browser test and does not by itself prove a general browser defect.

## Documentation maintenance

When user-facing labels, options, or workflows change, update both `docs/HELP.md` (the in-app guide) and `docs/user-guide.md` in the same change. Confirm instructions against the current interface and describe backend-only changes only when they affect a user action; never present unavailable or unverified hardware controls as supported.

## Previous release verification — 2026-11-01 (historical OTP release; superseded)

- Merged PR [#33](https://github.com/HephzibahBehulahHQ/AdigunSPs/pull/33) as `8299ff9567b0bdfecdc9eee1958b06db21b87a9a`. GitHub Actions CI run `41320789744` and Pages deploy `41320789756` both completed successfully.
- Live HTTPS requests to `https://adigunsps.hephzibahbehulah.com/`, `/src/app.js`, `/src/account.js`, and `/service-worker.js` returned 200. The served app contains the OTP form and `email_change` guest-upgrade flow, and the worker reports cache v113.
- The local checkout now tracks `origin/main` at the same commit. Local `npm test` and `npm run build` passed before merge; the merged commit also passed GitHub CI.
- Supabase guest-expiry migration `20261101151429_adigunsps_four_minute_guest_access` is applied. A live query found 15 total guest rows, 0 active, 15 expired, and 0 expiring later than four minutes after their start.
- No live email OTP was requested or received during verification. Confirm both the Magic Link and Change Email Address templates contain `{{ .Token }}` and test signup, sign-in, and guest upgrade with a real inbox.

## Authentication implementation notes — 2026-11-01

- Local app source now uses email OTP for sign-in and registration, verifies six-digit codes, removes password and duplicate guest-upgrade email fields, and displays a four-minute guest timer. `npm test` passed, including account, UI, guest-expiry, and schema checks; `npm run build` passed.
- Applied Supabase migration `20261101151429_adigunsps_four_minute_guest_access` to project `fqcbfnktdvqojyezxeis`. A read-only query verified 15 total guest rows, 0 active, 15 expired, and 0 rows with expiry beyond four minutes after the migration.
- At the time this implementation note was written, the frontend had not yet been deployed. The release and current delivery status are recorded above. Live email OTP delivery remains unverified; confirm the Supabase Magic Link and Change Email Address templates include `{{ .Token }}`.

## Baseline verification — commit 24625e1, before the OTP release

- On 2026-11-01, the current source audit used organization `main` commit `24625e1cbf61cd4deb862f42a9b96478b2ab8bf3`. GitHub Actions CI run #104 and Pages deploy #61 completed successfully. In a fresh worktree, `npm ci`, `npm test`, and `npm run build` passed locally; the suite covers all 200 examples, 1,317 logic cases, 903 schematic checks, and 1,317 integrated PLC-to-component cases. The source service-worker shell cache is v112.
- A manual browser inspection of `https://adigunsps.hephzibahbehulah.com/` loaded the editor but showed “Account required” and the expired 10-minute guest-session notice. This does not verify a signed-in AdigunSPs app session, account flows, or cloud operations.
- HTTPS `HEAD` requests returned `200` with `text/html` for the three product domains: `https://adigunsps.hephzibahbehulah.com/`, `https://adigunsimulator.hephzibahbehulah.com/`, and `https://adigunelectrocad.hephzibahbehulah.com/`. This confirms those endpoints serve HTML over HTTPS; it does not verify full feature behavior on the other two apps.
- The deployed Pages release includes the consent-gated hosted-AI client and defaults to `https://adigunsps-ai.hephzibah-behulah.workers.dev`. Earlier Worker probes returned 405 for GET, 401 `authentication-required` without a bearer token, and 401 `invalid-session` for an invalid token. These verify reachability and authentication guards, not successful inference; no account writes were performed during this verification.
- The example report covers 200/200 projects, 1,317 logic cases, 903 schematic checks, and 1,317 PLC-to-component integration cases. Required-terminal warnings are zero after spare unmapped I/O channels and unused junction/rail taps were excluded; explicitly mapped channels and protective earth still warn if unwired. This is structural validation, not electrical/safety certification.
- Supabase project `fqcbfnktdvqojyezxeis` is `ACTIVE_HEALTHY`; the five application tables have RLS. Live policy inspection confirmed owner checks and restrictive permanent-user insert checks, including project ownership for versions. The guest RPC pins an empty search path, checks `auth.uid()` and the anonymous claim, and creates a fixed ten-minute session. Inventory: 8 expired guest rows, all exactly ten minutes, and 0 cloud projects/versions. This does not prove two-user isolation or real client cloud-write behavior.
- New signup, confirmation/reset, guest-upgrade, cloud save/reload, avatar upload, admin denial, and multi-user isolation remain unverified. Supabase advisories still include the intentional guest-session `SECURITY DEFINER` RPC, anonymous-session policy notices, and Free-plan leaked-password protection unavailable.
- The deployed Worker’s GET probe returns 405; a configured-origin POST without a bearer token returns 401 `authentication-required`. The live client surfaces sign-in/guest and service errors separately. Signed-in inference and live Neuron usage remain unverified. The selected Gemma model remains pinned in the Worker.
- Remaining scope is listed in `requirements-status.md` and `stakeholder-inputs.md`. The deployed educational simulator is not a certified safety PLC and does not validate physical hardware.

## Historical checks — 2026-10-30

- `npm run build` passed: syntax checks passed across 40 source modules, localized manifests were generated from the central brand configuration, and a self-contained static bundle was written to ignored `dist/`.
- `npm test` passed: 200 examples and 1,317 deterministic cases, plus branding, hardware/report, Adigun BOT, resource, and Modbus TCP checks.
- Branding checks verify the exact supplied corporate/social destinations, localized Help/docs and LinkedIn personal-profile labels, a current-year footer, safe external-link attributes, and cache-version refresh. The search result associated the official website with the stakeholder's personal LinkedIn profile; direct social-platform pages were not fetchable by the research service, so independent live availability of those profiles remains unverified.
- Live preview interaction verified the first-run screen, editor, Components catalog, symbol placement/deletion, terminal connection, four locales, and light/dark branding. Full user workflow, responsive layout, PWA install, and browser accessibility remain unverified; the preview address is `http://127.0.0.1:8080/` when the local development server is running.
- The organization repository is accessible. `main` was updated through the connected GitHub integration after local Git credential spawning failed; the published component-library milestone is commit `5fc6c4b6712de3bfaf6902b5857c3e664dde3545`. The local branch was synchronized to that remote commit.

## Automated checks from the 200-project baseline

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
- Static regression checks confirm every localized top-menu action and static toolbar/project-tree `data-action` has a dispatch route. They do not execute every menu flow; branch editing interaction, settings persistence, watch/force interaction, alarm/recipe UI, event-log UI, trace export UI, and complete workflows remain without end-to-end coverage.
- No test here verifies a physical PLC or certifies any safety behavior.

The AI design and stakeholder-dependent decisions are documented in `adigun-ai-design.md` and `stakeholder-inputs.md`. The consent-gated Cloudflare Worker is deployed with a Supabase publishable-key secret and `env.AI` binding. GET returned 405; a POST without a bearer token from the configured Pages origin returned 401 `authentication-required`. An earlier consented invalid-token POST returned 401 `invalid-session`. These responses verify reachability and auth-gate behavior, not authenticated inference. The published Pages build includes the hosted-AI client and defaults to the Worker URL, with optional repository overrides. No successful live inference, Neuron usage, or model quality was verified. Earlier local preview observations on ports 8086 and 8088 are historical and do not establish the current server state. The broader platform requirements remain incomplete.

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


## Live cloud-save verification — 2026-11-02

- Release `3569d1d` deployed with successful CI and Pages workflows. After using the update recovery page, Account displayed the inline Cloud project name field.
- The existing authenticated session saved a clearly named QA project and loaded its title from the cloud list. A second save containing a PS1 supply produced a separate cloud copy, matching the implemented insert-only behavior. The user guide now states that saves create separate copies.
- After deleting PS1 only from the local QA copy, opening the newest cloud copy and choosing Switch without an extra save restored PS1 and both terminal controls. Captured browser error logs were empty. This proves one component payload round-trip in the existing session, not full project-format coverage or new-user authentication. Two clearly named QA cloud copies were retained; existing user projects were untouched.
