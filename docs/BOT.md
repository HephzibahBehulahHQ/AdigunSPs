# Adigun BOT

Adigun BOT combines an offline PLC learning helper, a deterministic local build planner, and a live canvas co-pilot. An optional consent-gated Cloudflare Worker calls a pinned Workers AI model only after verifying a non-anonymous Supabase Auth session. The Worker is deployed; the local Pages workflow supplies its URL by default, but these client/workflow changes are not published yet. See [`ADIGUN-AI-SETUP.md`](ADIGUN-AI-SETUP.md) for deployment and usage checks. Spoken input uses the browser Web Speech API when available; recognition and build-command parsing currently work best with English prompts. Text remains available in every browser.

## Build flow

1. Open **Adigun BOT** from the floating assistant button or **Tools**.
2. Type or speak a supported build prompt and submit it.
3. Review the generated steps, ladder sketch, generic component references and terminal connections, assumptions, project warnings, and simulator test cases. The verifier runs before import; if any check fails, import and save are disabled.
4. Choose **Preview on canvas** to inspect the generated ladder without saving. The preview blocks editing; **Commit project** imports it after unsaved-change confirmation, while **Discard preview** restores the prior project and editor state. Escape also discards the preview.
5. Choose **Import to canvas** to commit directly after the app's unsaved-change confirmation. Or choose **Save locally**, **Save to cloud**, **Edit request**, or **Discard**.
6. Sign in before saving. Guest sessions can generate and import drafts, including canvas preview, but local export and cloud save remain disabled. A draft stays in the current browser tab while the user opens the account dialog to sign in; re-open Adigun BOT to return to it.
7. Run the imported program and verify its inputs, outputs, and diagnostics in the simulator.

The plan is the approval step: previewing, importing, or saving is an explicit user action. Generated candidates are built in memory first; preview cannot write to storage. **Edit request** returns to the prompt with the original request restored. The current supported prompt set is narrow and rule-based; unsupported or ambiguous requests receive a capability message instead of a guessed project.

## Live co-pilot

The co-pilot observes project changes through the app render/update path and checks the project periodically while enabled. It reports actual validation errors, missing inputs on supported AND/OR FBD gates, normal coils written by multiple rungs, unused FBD timer outputs, fully wired output loads that remain de-energized with the PLC output forced on, and electrical terminals that remain unwired for five seconds. It asks for the project goal when the project contains content but has no input-to-output path.

Suggestions use a nonmodal card beside the BOT button. They wait during pointer activity and text entry, appear no more than once every 25 seconds, and can be dismissed for the same project state. The only automatic co-pilot fix currently adds one simulated BOOL input to an incomplete AND/OR gate. Accepting it opens a verified draft plan; canvas preview is temporary, and import remains a separate user action. Other findings open for inspection or explanation. The co-pilot never auto-saves, and its electrical checks are limited to the app's educational simulation model.

## Project tool API

The provider-independent tool layer in `src/adigun-bot-tools.js` operates on a cloned project and returns the original snapshot if a planned operation fails. Its current contracts cover generic electrical component placement, terminal wiring, editable properties, rung comments/labels, project-wide tag renaming, confirmed component/wire/rung deletion, rung/branch creation, junction insertion, adding a simulated FBD input, simulation, snapshots, JSON import/export, and member-gated local/cloud save callbacks. The approved Bot canvas import and co-pilot suggestion fix use this transaction layer. A language model does not yet call arbitrary tool sequences from prompts; the deterministic planner still handles only the supported build types below.

## Copyable prompts

Prompts 1–7, 10, and 13 are supported by the deterministic offline helper. Prompts 8–9, 11–12, and 14–15 are not generated yet:

1. `Build a two-input AND gate with two switches and a motor output.`
2. `Create an AND and NAND network with two switches, a motor, and a lamp.`
3. `Make a three-input OR gate with three switches and a lamp.`
4. `Build an XOR gate with two switches and a buzzer.`
5. `Create a NOT gate with two switches and a lamp.` (Uses one input per NOT block; extra inputs are preserved as declared simulated inputs.)
6. `Make a timer that turns on a lamp after 5 seconds when the button is pressed.`
7. `Add a start/stop motor circuit.`
8. `Build a traffic light sequence with three timers.` — not supported; multi-step sequencing is not generated.
9. `Add an emergency stop that cuts power to everything.` — not supported; safety behavior cannot be inferred or validated.
10. `Rename tag M1 to PumpMotor everywhere.` — supported for an open project. The plan updates supported tag references and compares original and edited outputs in representative input scenarios before import.
11. `Build a three-phase star-delta starter with interlocked contactors and two timers.` — not supported; multi-contactor sequencing is outside the planner.
12. `Add an overload trip and lamp to the motor starter.` — not supported; the Bot does not plan protection circuits.
13. `Why is my motor not on? Trace the blocking contact.` — supported for LD outputs: the offline helper checks current input/output values, identifies false contacts in the driving rung, and reports TON completion state when available. It does not yet trace arbitrary FBD paths or prove physical causes.
14. `Add a lamp to the NAND output in the current project.` — not supported; prompts do not reference or modify current canvas state.
15. `Show three start/stop ladder variants and compare them.` — not supported; the Bot does not generate alternative plans.

The normal editor may support related individual instructions, but the Bot does not yet plan or modify those existing projects.

## Current capability limits

- Gate requests generate FBD logic plus a generic PLC, tagged input controls, and output schematic devices. A Motor output generates an educational contactor and three-phase motor path. Timer and start/stop requests generate LD programs and tagged schematic I/O. The Bot does not derive or validate real physical wiring or build arbitrary multi-sheet circuits.
- The schematic Components workspace and PLC program are separate editors. A shared tag connects simulated PLC logic to a generic connected electrical load; this does not establish real hardware compatibility or electrical safety.
- There is no configured language-model provider, general-purpose prompt planner, editable plan diff, persistent conversational memory, traffic-light sequencer, or arbitrary example generator. The prompt-grounded LD debugger covers simple rung contacts and TON status; it does not trace arbitrary FBD paths or prove physical causes. Natural-language edits currently support tag rename and requested LD rung deletion; the co-pilot can add a simulated input for one incomplete FBD gate pattern. Other tool operations are not yet planned from prompts. Unsupported tasks are rejected before import.
- Hosted-AI requests require a signed Supabase Auth session, a per-request consent checkbox, a project summary limited to editor/I/O/program counts and diagnostic codes, server-side provider secrets, and an HTTPS OpenAI-compatible endpoint. The Edge Function never accepts a provider URL or key from the browser and does not persist prompts. Runtime capability is off unless an operator explicitly supplies a public provider label and enables it; provider privacy/retention terms, rate limits, and an end-to-end deployment test remain pending.
- Voice recognition depends on browser support, microphone permission, network/browser speech services, and locale availability. If unavailable, type the prompt.
- Import/save and simulation results are local app operations. The Bot does not certify wiring, hardware compatibility, or safety logic.

## Verification

`npm run test:adigun-bot-builder` checks gate, timer, and motor plans against project validation and simulation. `npm run test:adigun-bot-tools` checks placement, wiring, edits, rename, simulation, snapshots, rollback, confirmation, and member-only saves. Browser microphone behavior and the live Supabase save path require separate browser/account verification.
