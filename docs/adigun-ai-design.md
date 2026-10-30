# Adigun BOT: design, privacy, and release gates

## Implementation status

Adigun BOT is available as a bounded offline learning helper. It explains PLC scan cycles, common timers, ladder contacts, digital and analog signals, CTU counters, linear scaling, PID concepts, editor modes, selected ladder networks, project counts, supported validation findings, and safety boundaries using on-device rules in English, German, Yoruba, and Nigerian Pidgin. It does not use a language model, connect to a provider, or transfer project data. This is a curated learning aid, not a general-purpose assistant, and has not passed engineering or language-quality evaluation.

## Interaction and authority

- Longer-term assistant work may answer broader PLC, electrical, and app questions, then use explicitly selected project context for project questions.
- Project context is read-only by default. Context sent for an answer must be visible to the user and limited to the selected project, program, rung, tags, diagnostics, or simulation snapshot.
- Model providers must be administrator-configured. The product must disclose destination, retention, and allowed context before any external transfer. External project transfer requires a separate, explicit user consent action.
- Proposed edits, simulation starts, and other state changes require a reviewable diff and explicit acceptance. Accepted actions record actor, time, project/version, and before/after values.
- The assistant must identify uncertainty, link its approved sources, and recommend simulator verification. It must not claim certification, safety approval, or physical PLC behavior.
- Safety-critical wiring, bypasses, and safety PLC logic require a clear safety notice and must not be represented as validated engineering advice.

## Current offline helper

The header and Tools menu open the same local assistant. It supports curated lessons, selected-rung explanation, project summary, and local consistency findings in English, German, Yoruba, and Nigerian Pidgin. Conversation history exists only in memory and can be cleared. Unknown questions receive an explicit capability limit. The helper is read-only and has no provider, voice, screenshot, streaming, or administrative controls.

## Privacy and administration

An implementation needs an approved model route, data residency, retention period, topic policy, quota policy, and administrator. Until those are selected, project data stays local and no external AI call is made. Secrets belong in a managed server-side secret store, never in the PWA bundle. Audit records should avoid retaining prompts or project source unless the administrator and user have explicitly enabled that retention.

The current assistant identifies as Adigun BOT, a capability of AdigunSPs under HB Elektroniker, a division of HEPHZIBAH BEHULAH. Keep this disclosure alongside advice and clearly state that responses are educational and not certified engineering approval.

## Evaluation and release gates

Create a versioned evaluation set for English, German, Yoruba, and Nigerian Pidgin. For each locale, cover general PLC learning, project-context grounding, correct uncertainty, unsafe requests, privacy/consent, and suggested-change review. Have technical speakers review the Yoruba and Pidgin cases and terminology.

Before release, measure factual correctness, source support, unsafe-answer rate, language quality, privacy boundary compliance, and state-change confirmation. Require zero unconfirmed state changes and zero external project transfers without consent. Set numerical quality thresholds with the engineering and education owners before selecting a model; do not infer passing quality from a demo or a small hand-picked sample.

## Unimplemented scope

General model-backed answers, streaming, stop/regenerate, question editing, four-language spoken answers, voice input, screenshot review, quizzes, flashcards, Socratic tutoring, instructor review, administrator routing/retention/quota controls, and automated evaluation remain unimplemented.
