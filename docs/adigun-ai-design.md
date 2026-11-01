# Adigun BOT: design, privacy, and release gates

## Implementation status

Adigun BOT provides a bounded offline learning helper plus a deterministic builder for a small set of gate, delayed-lamp, and start/stop prompts. Supported requests produce an in-memory LD/FBD project with generic PLC I/O and connected schematic load models, plus a reviewable plan; the user explicitly imports or saves it. An optional consent-gated hosted path is deployed through Cloudflare Workers AI and authenticates against Supabase before inference. The local Pages workflow supplies the Worker URL by default, but this client/workflow change is not yet published; authenticated inference and engineering/language-quality evaluation remain unverified.

## Interaction and authority

- Longer-term assistant work may answer broader PLC, electrical, and app questions, then use explicitly selected project context for project questions.
- Project context is read-only by default. Context sent for an answer must be visible to the user and limited to the selected project, program, rung, tags, diagnostics, or simulation snapshot.
- The configured model is pinned in the Cloudflare Worker, not selected by the browser. The product discloses the service and allowed context before any external transfer. External transfer requires a separate, explicit per-request consent action.
- Proposed edits, simulation starts, and other state changes require a reviewable diff and explicit acceptance. Accepted actions record actor, time, project/version, and before/after values.
- The assistant must identify uncertainty, link its approved sources, and recommend simulator verification. It must not claim certification, safety approval, or physical PLC behavior.
- Safety-critical wiring, bypasses, and safety PLC logic require a clear safety notice and must not be represented as validated engineering advice.

## Current offline helper

The header and Tools menu open the same local assistant. It supports curated lessons, selected-rung explanation, project summary, local consistency findings, and the prompt patterns documented in [`BOT.md`](BOT.md). Conversation and pending draft exist only in the current tab and can be discarded. Unknown questions and unsupported build requests receive an explicit capability limit. It has no provider, screenshot, streaming, or administrative controls.

## Privacy and administration

Hosted answers use a Cloudflare Worker with the `AI` binding and a Supabase Auth token check. The worker secret contains only the Supabase publishable key, never the service-role key; prompts are not persisted by this code. Cloudflare account processing/retention terms and live quota controls still require owner review. The new Pages build enables the hosted option by default after the local branch is published; repository variables can override or disable it. Per-request consent remains required, and the offline helper remains available. Secrets stay server-side, never in the PWA bundle.

The current assistant identifies as Adigun BOT, a capability of AdigunSPs under HB Elektroniker, a division of HEPHZIBAH BEHULAH. Keep this disclosure alongside advice and clearly state that responses are educational and not certified engineering approval.

## Evaluation and release gates

Create a versioned evaluation set for English, German, Yoruba, and Nigerian Pidgin. For each locale, cover general PLC learning, project-context grounding, correct uncertainty, unsafe requests, privacy/consent, and suggested-change review. Have technical speakers review the Yoruba and Pidgin cases and terminology.

Before release, measure factual correctness, source support, unsafe-answer rate, language quality, privacy boundary compliance, and state-change confirmation. Require zero unconfirmed state changes and zero external project transfers without consent. Set numerical quality thresholds with the engineering and education owners before selecting a model; do not infer passing quality from a demo or a small hand-picked sample.

## Unimplemented scope

Live hosted inference deployment, streaming, stop/regenerate, question editing, robust four-language intent handling, screenshot review, quizzes, flashcards, Socratic tutoring, instructor review, administrator retention/quota controls, and automated answer evaluation remain unimplemented. Arbitrary project edits, generated schematic placement/wiring, and traffic-light generation are not supported by the deterministic builder.
