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

## Database RLS verification — 2026-11-02

- Executed `tests/sql/cloud-rls-rollback.sql` on the AdigunSPs project. The authenticated owner read QA cloud metadata and snapshots; an unrelated synthetic identity saw no cloud projects, snapshots, or profiles. Anonymous claims were denied a cloud-project insert. Assertions completed without errors and the transaction rolled back. This tests database role/claim enforcement, not two real browser accounts or token validation.
- Confirmed permanent-user INSERT and snapshot-parent ownership policies are RESTRICTIVE. The guest-session definer function checks anonymous identity, fixes its search path, and keeps the first server-issued expiry. Advisor warnings remain for intentional guest access and leaked-password protection being disabled. Other products share this database; their policies were not changed.

## Live project-switch verification — 2026-11-02

- On release `77c9cf4`, started Run, opened the QA cloud copy, and observed STOPPED with Cycle 0 and its saved PS1 component. Browser error capture was empty. A stale RUNNING label remained in the HUD/status area; the follow-up reset path now refreshes HUD and status immediately. The follow-up needs deployment and a repeated live check.

- Follow-up `69bcffe` passed CI and Pages. Repeated the live Run-to-cloud-open flow after refreshing application files: QA project loaded, STOPPED and Ready were visible, Cycle was 0, and no RUNNING text remained in the accessibility tree. Captured browser errors were empty. Physical hardware and other project-loading paths were not exercised by this browser check.

## Live numeric-alarm verification — 2026-11-02

- Release `930f7ba`: created a REAL input and a high alarm at 75 through the UI. Input 80 raised the alarm; 70 cleared it. Alarm history showed Configured, Raised, and Cleared; project validation stayed Ready. Numeric-tag setup initially offered BOOL, so the follow-up defaults numeric tags to high comparison and rejects blank thresholds.

- Release `c2d94ed`: live numeric alarm setup defaulted to high comparison, disabled BOOL for a REAL tag, and kept the form open with a visible finite-threshold message when the threshold was blank. No captured browser errors.

## Live typed-recipe verification — 2026-11-02

- Release `f0a7074`: set a REAL input to 42.5 and saved QA decimal 42.5 v1 using the inline name field. Changed the input to 5, selected Apply, accepted its confirmation, and observed 42.5 restored with validation Ready and no captured browser errors.
- Reloaded the application, reopened the local QA project, and confirmed the same recipe version remained. Changing the input to 5 and applying the persisted recipe restored 42.5 again. This covers one REAL recipe and local persistence; approval workflows, role enforcement, and full multilingual recipe UI remain incomplete.

## Live recipe-review verification — 2026-11-02

- Release `866449b`: review displayed Current 6.000000 and Recipe 42.500000. Back to recipes and closing the panel preserved input 6. Reopening review and selecting Apply inputs restored 42.5. Captured browser errors were empty.
- A fill-only browser edit previously changed the displayed field without committing its change event; the before/after review supplied stronger evidence of the actual runtime value. The explicit 6-to-42.5 check above is the authoritative live application check. Formal independent approvals and signed audit records are not implemented.

## Server recipe-approval foundation — 2026-11-02

- Applied remote migration adigunsps_recipe_approval_snapshots: immutable submissions, owner/admin visibility, separate append-only decisions, server-issued owner/reviewer/time, one decision per submission, and independent permanent-admin review. No UPDATE or DELETE grants are provided to browser users.
- Rollback-only SQL tests passed before and after applying the schema: guest submission, outsider access, non-admin decisions, self-approval, snapshot modification, and duplicate decisions were denied; independent admin decision succeeded. Claims were transaction-local test fixtures, not live JWT/browser identities.
- Security advisor reports an anonymous-access heuristic for decision reads, whose access depends on the permanent-user-filtered parent policy. Existing unrelated advisories remain. Client integration is tested; Recipes UI integration and real independent reviewer accounts are pending. This is optional recipe review, not a safety or legal signature service.

## Live recipe-submission verification — 2026-11-02

- Release `798e99f`: the existing signed-in user submitted the synthetic QA decimal 42.5 recipe through Recipes. Cloud recipe reviews displayed Pending and the stored QA_Temperature value 42.5. No self-review decision controls were displayed and captured browser errors were empty. The QA submission was retained for independent reviewer testing.
- This verifies one authenticated submission/list/snapshot path. Independent live approval, rejection, and approved-copy retrieval still require a separately authorized permanent admin reviewer session; rollback SQL role tests do not replace that browser check.

## Shared company admin integration — 2026-11-02

- Company PR #147 merged as `37eea23`: adds an isolated AdigunSPs panel to the existing Cloudflare-hosted admin portal. Local validation passed all 171 company-platform tests and the full prescribed release build. Product requests use only fqcbfnktdvqojyezxeis; no VoltPro gateway, account configuration, or credential was changed.
- The explicitly designated, existing verified AdigunSPs account received the admin role. The update preserved its other app metadata and was limited to this project. Production rollout and a fresh product-admin sign-in remain to be verified.

- Production company workflow `41521981868` attempt 2 passed after the first attempt hit a transient public-route fetch failure. Deployment reported Sandbox ready, Worker version `a71fb1a5-30ac-4dc6-b90f-a09abe3a4336`, deployed commit `37eea23`, and all 18 production security checks passed.
- Live shared-portal test: the designated admin signed into the isolated AdigunSPs panel and approved the synthetic QA snapshot. Database verification confirmed reviewer and submitter IDs differ and the fixed value remains 42.5. The original owner session stayed signed in separately, fetched the approval, and imported a local copy. A native input change plus review confirmed runtime Current 7.000000 remained unchanged after importing recipe value 42.500000. No physical outputs or real machinery were involved.

## Live alarm-history retention verification - 2026-11-02

- On deployed release `8c70248`, the existing QA project opened with a 500-event limit. Selecting 100 changed the control; closing the dialog and pressing Undo restored 500 with its three existing events intact.
- Selecting 2000 persisted across browser reload and reopening the saved local project. The existing configured/raised/cleared events remained visible. This browser check does not exercise count-pressure trimming: automated tests cover 2,500-event fixtures, all three limits, and undo snapshots before truncation.

## Numeric alarm hysteresis - 2026-11-02

- Added a four-language Hysteresis field to numeric alarm creation. The finite non-negative margin affects clearing only; omitted/zero retains the previous inclusive comparison. High thresholds clear at threshold minus margin; low thresholds clear at threshold plus margin. Configuration persists in project JSON and invalid imported margins are rejected.
- Automated scan sequences cover both operators, exact raise/clear boundaries, repeated readings inside the band, negative thresholds, zero-margin compatibility, JSON reload, and invalid margins. Live release `4ecf052` passed CI and Pages. In the existing QA project, a negative margin kept the creation dialog open; a valid threshold 75 / hysteresis 5 created the alarm. Native input changes to 75 raised it, 74 retained it while the existing zero-margin alarm cleared, and 70 cleared it. History recorded the transitions. This is alarm event stabilization in the educational model, not sensor validation or a safety function.

## Hosted Bot repair - 2026-11-02

- Reproduced the unavailable-answer failure with the existing permanent-user session. Production custom-domain OPTIONS returned 403 because the deployed origin list contained only Pages and local preview origins. Updated the live variable and Wrangler source; preflight now returns 204 with the exact custom origin.
- Subsequent request reached the next failure path. The selected model documents a chat-completion `choices` response, while the Worker only read legacy `response`. Added both response shapes and regression tests for malformed/missing content, production preflight/POST, disallowed origins, and missing-token rejection. Authenticated successful inference remains pending the parser deployment.

- Follow-up: fixed the coverage-document wording that CI rejected; runs `41530862052`/`41530862159` and `41531029510`/`41531029755` passed CI/Pages. Release `455db2b` logged only `502 empty-model-response` for a consented synthetic one-word request from the existing member session. A Llama trial returned `503 model-unavailable`; the original model pin is restored while fixed-enum response diagnostics distinguish output limits, empty content, and unsupported wrappers without logging private data. Successful inference remains unverified.

## Successful hosted Bot recovery - 2026-11-02

- Client release `b283220` passed CI `41532307992` and Pages `41532307987`. Its safe diagnostic identified `502 empty-model-response output-limit` with the existing member session.
- Worker version `661bc66c` uses non-streaming, optional thinking disabled, and max_completion_tokens 1024. It returned READY for a one-word probe and explained that a PLC copies inputs into a consistent memory snapshot before evaluating logic. Provider identity was absent from the displayed answer.
- Consent reset after each hosted answer. With consent off, Explain scan cycle returned the existing local scan explanation. A direct POST from the production custom origin without a bearer token returned 401 authentication-required. No project was edited by these questions, and no private prompt, token, answer, or project content is included in diagnostics.
- AI guard/format/budget tests, Help checks, and production build passed locally. Broad answer quality, daily Neuron accounting, request quotas, and new-user authentication remain unverified.

## Existing-avatar verification and SVG visibility fix - 2026-11-02

- The existing signed-in profile image loaded with natural dimensions 1408 by 1408. Before the fix, both the image and fallback SVG had computed display block: assigning SVG.hidden did not create the HTML hidden attribute. No profile, image, credential, or session was changed during this inspection.
- The renderer now toggles the SVG hidden attribute and CSS explicitly hides hidden children of the account button. Executed function tests cover fresh/cached image display, failed/missing image fallback, and stale profile resolution after sign-out. Existing-avatar post-deployment visibility passed as recorded below. Upload/re-sign-in remains unverified.

- Post-deployment avatar check passed: photo loaded, fallback hidden attribute present with computed display none, and signed-in dot rgb(70,195,123). A 360px check revealed the later brand-overrides.css forced a one-row identity layout and pushed Help to x357..384 outside the viewport. Added a two-row mobile header in that owning stylesheet; live verification of the layout correction is pending.

## GitHub visibility review - 2026-11-02

- Inspected the AdigunSPs repository, local branch, origin, clean tracked status, staged/unstaged diff, and latest committed mobile-layout diff. Origin is HephzibahBehulahHQ/AdigunSPs. Local bbb635a and published main 90d28e2 have the same tracked tree, 2cbda40e21f9a7d92d935ce300b0578a2e386f32; application changes were already published before this review.
- Preserved the original local hardening branch and created codex/visibility-review-2026-11-02 for the review record. No history rewrite, force push, credential/cache publication, or additional deployment action is part of this review. Pages is configured for main pushes only; this branch and its draft PR are for validation/review. The previous main push was already in flight when the no-deployment instruction arrived.
- Excluded and preserved untracked .supabase-cli/ and supabase/.temp/. No unrelated project was accessed for this review. Existing automated/avatar verification is documented above; mobile layout browser verification and upload/re-sign-in remain pending.

## Local responsive follow-up - 2026-11-02

- The task-owned preview on 127.0.0.1:8139 returned HTTP 200 after restarting it under granted network access. No deployment was performed for this verification.
- Header checks passed all 16 combinations of English/German/Yoruba/Pidgin and 320/360/700/1280 CSS-pixel widths: all five account/language/settings/search/help buttons stayed within the viewport with at least a 3px gap.
- Browser layout inspection found remaining page overflow in editor-tabs and editor-subbar. Those rows now scroll internally on narrow screens instead of widening the document. All 48 combinations of the same languages/widths and LD/Components/HMI modes passed the document-width check after the fix. The viewport override was reset afterward.
- These were empty-project layout checks with the local fallback account icon. They do not prove populated-project behavior, touch gestures, zoom accessibility, avatar upload, or new-user email flows. Production verification of this new scroll containment is intentionally deferred under the no-deployment instruction.

## Hosted request lifecycle review - 2026-11-02

- Added localized pending/cancel controls and aria-busy state; one hosted request can be active at a time. Closing aborts client waiting, replies after project reload/account changes are discarded, and completion updates content without reopening a closed or minimized window.
- A single 45-second deadline covers account-session lookup, fetch, and response-body reading. Cancellation/timeout does not claim to undo provider processing and never changes the project. Controlled tests cover all three stall stages, pre-cancellation, pending cancellation, deadline/listener cleanup, rapid duplicate sends, stale contexts, close wiring, and hidden/disabled UI states in all four locales.
- Local browser idle check passed: aria-busy false, status/cancel hidden, and send enabled. Full npm test passed including 1,000 project round-trips, 4,717 logic cases, 8,913 schematic checks, and 4,517 integrated cases; production build passed. The generated report had only a blank-line change, so its unchanged JSON content was confirmed before restoring that formatting artifact.
- Authenticated slow-request/cancel browser integration and production verification of this review-branch change remain pending. No new deployment was performed.

## Structured Text binding and mobile inspector follow-up - 2026-11-03

- Reproduced mixed-case ST names failing compilation or writing a shadow variable instead of the declared output. Compiler and runtime now bind identifiers to canonical declarations, reject ambiguous case-only names, and retain numeric typing and scan state. Tag editing prevents case-only duplicates; rename and deletion guards include ST references.
- Focused regression coverage includes worker parity, serialized ASTs, typed outputs, scan continuity, ambiguity rejection, identifier-safe rename, and actual tag-editor handlers.
- Browser inspection at 455 CSS pixels found the desktop inspector display selector overriding mobile hiding and collapsing the editor to zero height. The mobile selector now has sufficient specificity; its static regression passes. Browser verification of the fix remains pending because the local service worker serves stale CSS and updater navigation aborts.
- Correction to earlier responsive evidence: the 48 document-width checks did not assert that intended mode switches succeeded; the inspector could intercept clicks. They establish width containment only, not verified LD/Components/HMI interaction. Repeat with active-mode and positive editor-height assertions after refreshing assets.
- No deployment performed. Physical hardware, full IEC language support, and new-user authentication remain outside this verification.

- Follow-up: advanced the application shell cache to v118. A separate local preview preserved the existing tab and authenticated session; at 455 CSS pixels the inspector was hidden and editor height was 559px. The Logic tab received clicks and ST was visibly selected. Loading an example prompted for unsaved changes, so that switch was cancelled; mixed-case runtime behavior is covered by automated tests, not claimed as browser-verified.
- Full npm test and production build passed: 1,000/1,000 examples and JSON round-trips, 4,717 logic cases, 8,913 schematic checks, and 4,517 integrated cases. Service-worker checks also passed after the v118 increment.

- CI run 41544385940 exposed a stale duplicate v117 assertion in the Help test after the v118 cache change. The Help test now checks for a versioned shell; the dedicated service-worker test retains the exact current-version assertion.

## Structured Text statement parsing - 2026-11-03

- Reproduced multiline block comments shifting diagnostic lines and valid compact/multiline assignments being rejected. The shared source lexer now preserves source spans, handles nested block comments, and splits semicolon-terminated statements and IF branches independently of line layout. Rename/reference checks use the same comment/string boundaries.
- Regression tests exercise 24 input combinations across formatted, compact and CRLF source, module-worker parity, JSON AST round-trips, original error lines, missing terminators, unterminated comments, incomplete IF blocks and nested-comment rename protection. Full POU/function/function-block support remains incomplete; this change does not claim full IEC conformance.
- Validation: full npm test and production build passed, including 1,000 example/model round-trips, 4,717 logic cases, 8,913 schematic checks and 4,517 integrated cases. Browser execution of this parser change is not yet verified. Cache v119 refreshes compiler and guide assets; no merge or deployment performed.

## Reusable Structured Text scalar functions - 2026-11-03

- Added FUNCTION/END_FUNCTION declarations, BOOL/INT/REAL/TIME return/input/local types, positional calls, private storage reset per invocation, forward/nested calls and case-insensitive bindings. Return values are assigned to the function name. Global-tag rename/reference checks skip private function definitions.
- Compiler rejects unknown calls, wrong arity, duplicate names, global/function name collisions, missing result assignments, malformed declarations and direct/indirect recursion. Runtime bounds depth/call count and reports function/source context while retaining the affected output on errors. Functions and their ASTs survive worker messages and JSON serialization; source persists through the existing project save workflow.
- Tests cover typed inputs/results, no local leakage or retention, nested calls, private-name rename protection, invalid programs, divide-by-zero propagation and exponential call-budget exhaustion. Multi-program task assignment, stateful function-block instances, named/reference parameters, arrays and full IEC conformance are not implemented by this change.
- Syntax reference: https://docs.tia.siemens.cloud/r/en-us/v21/using-s7-1500-motion-control-s7-1500-s7-1500t/using-s7-1500t-interpreter-functions-s7-1500t/creating-mcl-programs-s7-1500t/structuring-the-mcl-program-s7-1500t/functions-s7-1500t ; pass-by-value reference: https://content.helpme-codesys.com/en/CODESYS%20Development%20System/_cds_vartypes_var_input.html . These references inform syntax only; no vendor compatibility is claimed.
- Validation: full npm test and production build passed (1,000 examples/round-trips, 4,717 logic cases, 8,913 schematic checks, 4,517 integrated cases); additional focused checks exercise TIME coercion and the exact documented Clamp01 example after project JSON serialization. Browser function execution is unverified. Cache advances to v120; no merge or deployment performed.

## Function source navigation - 2026-11-03

- Existing Programs menu now exposes Functions in all four locales. Its panel compiles the current source to list real scalar-function signatures, private-local counts, declaration lines and escaped diagnostics; Edit source focuses that declaration in the existing ST editor and returns from HMI/components to Logic. No new top-level menu or separate source store was added.
- Focused tests cover four locales, empty and malformed source, HTML escaping, CRLF/out-of-range line offsets and actual application navigation handlers, including an expired-access guard. Function creation/removal remains editing of ST declarations; stateful blocks and multi-program task assignment remain incomplete.
- Command search now adds every registered localized menu action while deduplicating existing actions. Four-locale tests verify full menu coverage, preserved labels and Functions discovery. Long signatures wrap within the scrollable panel, and edit buttons include the function name in their accessible label.
- Validation: full npm test and production build passed (1,000 examples and round-trips, 4,717 logic cases, 8,913 schematic checks and 4,517 integrated cases); focused compiler/navigation/palette and Help checks passed after the command-search addition. Browser interaction remains unverified. Cache v121 includes the new module; no merge or deployment performed.

## Named Structured Text programs - 2026-11-03

- Added PROGRAM/END_PROGRAM declarations with BOOL/INT/REAL/TIME VAR locals. Main statements execute first, then named programs execute once in source order under the existing single cyclic task. Private local state is stored separately from global values, survives scans and trace snapshots, and resets with simulation reset or local-schema changes. Removed programs do not retain orphan state.
- Programs source index is available in all four locales through Programs / ST programs. Trace history displays Program locals and replay reports private-state mismatches even when outputs match. Global rename/delete-reference checks respect shadowing locals. Source persists through existing project JSON saves; runtime locals are not project initial values.
- Tests cover ordering, equal local names across two programs and a global tag, typed/isolated state, cold/schema/removal recovery, function calls, malformed and nested POUs, qualified-name collisions, worker/AST parity, actual application ST scan hand-off, restored scan continuation, private-state replay mismatches and source navigation. Independent tasks, stateful function blocks and other-language program units remain unfinished.
- Syntax and state-retention reference: https://www.ironplc.com/reference/language/pous/program.html ; this does not establish vendor compatibility or full IEC conformance.
- Validation: full npm test and production build passed, including all 1,000 example/model round-trips, 4,717 logic cases, 8,913 schematic checks and 4,517 integrated cases. Focused tests additionally verify BOOL/INT/REAL/TIME local state and case-only declaration changes. The exact User Guide program example passes; Help contents anchors are now checked after removing a stale optional Glossary link. Cache v122 includes the update. Browser program execution remains unverified; no merge or deployment performed.

## Configurable cyclic ST tasks - 2026-11-03

- Added 1-16 cyclic tasks with integer periods/priorities, enabled state and ordered program assignments. Events are chronological, then priority (0 first), then task-row order. All programs belong to exactly one task, including disabled assignments; default projects retain once-per-base-scan source ordering. Main statements still execute once per base scan.
- Task clock/schema travel with simulation snapshots, reset with simulation reset, and participate in replay divergence checks. Config changes restart timing while retaining program locals; config/base-cycle changes invalidate old traces. Invalid/budget-exceeding schedules hold outputs, program locals and clock rather than dropping releases.
- Project / Cyclic ST tasks provides four-locale draft editing, save/default actions, stale-source/access guards and assignment validation. JSON import checks bounded task structure; unresolved names remain editable and are diagnosed. Validation caches source-derived program names.
- Task timing and local values are shown in trace history without internal schema strings. Offline dependency checks found and repaired missing project-import and example-expansion modules; the test now walks the application import graph.
- Validation: full npm test and production build passed: 1,000 examples and model round-trips, 4,717 logic cases, 8,913 schematic checks, 4,517 integrated cases, plus scheduler/editor/import/replay tests. The exact documented 100/200 ms task example passes. Cache v123 includes task modules and the repaired import closure. Browser task-editor execution is unverified; no merge or deployment performed.

## Stateful Structured Text function blocks - 2026-11-03

- Added scalar FUNCTION_BLOCK definitions, named input calls and program-local instances. Every instance retains independent inputs, outputs and locals across calls and scans; public input setters and output reads are typed. Compiler rejects private-field access, outside output writes, inside input writes, unknown/repeated arguments, type/name collisions, nested declarations and excessive definitions/instances. Global tag rename/reference checks preserve private names and named input labels.
- Successful calls commit the instance; body faults preserve its previous state. Shared function/block invocation limits roll back the affected scan, including the task clock. Local-schema changes and Reset reinitialize instance memory. Large-source tests exposed repeated trimming of masked whitespace; the parser now skips leading whitespace and reuses lexical spans.
- Existing Programs menu exposes Function blocks in four locales; program summaries list declared instances and source navigation remains in ST. Trace history shows instance values without schema strings. Tests cover independent instances/programs, all four scalar types, named/omitted inputs, repeated/skipped calls, read-only access, fault/limit rollback, worker and JSON parity, application/task/replay hand-off and the documented latch.
- Syntax references: [ABB function-block calls](https://en.help.plc.abb.com/calling_a_function_block.html), [ABB instance scope](https://en.help.plc.abb.com/cds_v2_function_block_instances.html), and [IronPLC call syntax](https://www.ironplc.com/reference/language/structured-text/function-call.html). Nested instances, reference/output-arrow parameters, built-in ST timer blocks, mixed-language POUs and full IEC/vendor interoperability remain incomplete.
- Validation: full npm test and production build passed, including 1,000 examples/round-trips, 4,717 logic cases, 8,913 schematic checks and 4,517 integrated cases. The additional scalar-type-name guard and commented named-argument rename passed focused tests and syntax checking. Cache v124 includes the parser dependency. Browser block execution remains unverified; no merge or deployment performed.

## Mixed-language browser smoke

Local preview at port 8139 accepted a disposable project with a BOOL output and a 100 ms task running an LD unit followed by an ST unit. The LD coil set the shared output and the ST unit inverted it. The scan snapshot showed the final false output and retained state for both units. One recorded scan replayed with zero divergences. This smoke covers the LD-to-ST hand-off and trace replay. A second disposable project verified FBD-to-SFC execution. Apply rejected a transition without an ID, then accepted the corrected chart. The FBD TRUE block set Tag1, the SFC advanced from idle to run, and its action set Tag2. One recorded scan replayed with zero divergences.

### Saved Structured Text unit edit

In a disposable local browser project, the saved ST unit `Check` assigned `TRUE` to BOOL output `Tag1`. A single Step showed `Tag1: true` in Latest scan snapshot. Loading the unit into the ST editor, changing the assignment to `FALSE`, copying the editor changes back, and applying the configuration produced `Tag1: false` on the next Step. This verifies the local browser workflow for a saved ST unit. The corresponding scan-adapter regression is included in PR #45.


### Production update preserves a saved project

On release `67cef4f`, a disposable project retained the task name `QAReleasePersistence` after an ordinary reload. The production update page then reported Update ready. After returning to the editor and reloading, the task name was still present. This verifies preservation of the saved local project setting across an online update. Offline reload remains unverified.

### Production Help keyboard navigation

On release 45ae8e0, Enter on Help focused Getting started in a fresh tab. Separate checks confirmed Tab moved within the guide and Escape restored focus to Help. Earlier tabs did not consistently show the initial focus change.

### Browser JSON interchange

A disposable local project exported through the browser and re-imported from the downloaded JSON retained its saved ST unit Check. A Step after import drove BOOL output Tag1 true, as shown in Latest scan snapshot. Vendor PLCopen compatibility remains a separate check.

### PLCopen TC6 schema verification

Series NO/NC and parallel ladder fixtures exported by AdigunSPs passed the official [PLCopen TC6 2.01 XSD](https://www.plcopen.org/downloads/) using the .NET XML schema validator. The import guard rejects files containing multiple POUs. Live browser XML round-trip and vendor-tool compatibility remain unverified.

### Production PLCopen export with rung comments

After refreshing application files, a commented ladder downloaded from release ea2a6ce passed the official TC6 2.01 XSD. An earlier cached export omitted the required comment dimensions and failed validation. Browser re-import and vendor-tool compatibility remain unverified.

### Production PLCopen re-import

File → Import accepted the schema-validated production XML download and restored the Tag1 input and Tag2 output. The imported rung was not stepped in this browser check. Vendor-tool compatibility remains unverified.


## Production HMI palette drag verification — 2026-11-12

On production release `8dd563d`, I created a temporary BOOL `Tag1` input in the local Untitled project, dragged **＋ Switch** from the HMI toolbar onto the active screen with Snap enabled, and observed a second **Push button** bound to `Tag1`. Mouse-pointer placement passed. Touch dragging and broader browser QA remain unverified. The temporary test tag and two widgets remained in browser-local project data at verification time; no cloud project was saved.

## HMI QA project cleanup check — 2026-11-12

In a new Chrome tab on the production origin, the local Untitled project reported 0 simulated inputs and outputs and the active HMI screen had no widgets. The temporary `Tag1` and two QA widgets from the earlier drag check were already absent, so no project data was deleted. The earlier pointer-drag verification remains recorded above.

## Production narrow-viewport layout check — 2026-11-12

At a 390 CSS-pixel responsive viewport in a fresh production browser tab, the document stayed 390 pixels wide while the 375-pixel toolbar viewport exposed 1,176 pixels of horizontally scrollable controls. The Untitled HMI remained empty. This responsive viewport override confirms layout containment and a scrollable toolbar, not native-device touch gestures, drawer operation, install behavior, or cross-browser compatibility.


## Phone drawer close controls — 2026-11-12

The 390-pixel production layout opened each side drawer, but each drawer covered the Panel layout launcher and had no visible close action. The app now places an accessible, localized close button inside each drawer and advances the offline shell cache to v140. Responsive selector, Help-guide, service-worker, and build checks pass. After deployment, a cache-busted production tab at 390 CSS pixels opened and closed both drawers; native-device touch behavior still needs verification.
