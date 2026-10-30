# Localization kit and QA status

## Locales

The interface and example library expose English (`en`), German (`de`), Yoruba (`yo`), and Nigerian Pidgin (`pcm`). Technical identifiers and IEC mnemonics such as BOOL, TON, NO, and NC stay stable across locales.

## Review status

- English: starter wording, not a formal engineering editorial review.
- German: starter translation, not reviewed against a technical glossary.
- Yoruba: first-pass learning text; technical wording needs review by PLC users who speak Yoruba.
- Nigerian Pidgin: first-pass learning text; technical wording needs review by Nigerian PLC users.

The current examples contain locale-specific titles, categories, difficulty, descriptions, objectives, tag labels, expected behavior, test names, and fault notes. Automated checks confirm these fields exist in all four locales. This does not check translation quality, truncation, or visual layout.

## Release work

The Settings localization audit now checks missing strings in the extracted core interface dictionary and all learning-example fields for English, German, Yoruba, and Nigerian Pidgin. It can export a JSON report. The audit does not establish translation quality or reviewer approval; all four locales remain pending editorial or technical review. Other inline UI copy and layout/truncation checks still need a full review. Keep the interface locale separate from the project language.
