# Browser smoke check

Date: 2026-10-30
Environment: Chrome, local development preview at `http://127.0.0.1:8081/`, 1280×821 browser window.

## Observed working

- First-run onboarding rendered the HEPHZIBAH BEHULAH corporate mark, separate AdigunSPs identity, attribution, and educational safety notice. Continue opened the application workspace.
- The Tools menu opened. Its Adigun BOT action opened the disclosed offline helper; **Explain scan cycle** produced the documented scan-order explanation.
- Live language switching rendered German, Yoruba, and Nigerian Pidgin labels while retaining the exact `AdigunSPs` and `HEPHZIBAH BEHULAH` names. The interface was returned to English.
- The Components workspace accepted generic 24 V supply placements, assigned references PS1 and PS2, displayed editable properties and terminal markers, and reported four unwired terminals when the diagram was validated. Both test components were deleted; the schematic returned to its initial empty state.
- The Settings dialog exposed a Light theme option. Selecting it and choosing Done switched the live application to the light palette.

## Follow-up and limits

Visual inspection found light-theme contrast problems in electrical controls, application menus and chrome, and shared form labels. The theme tokens and affected component, terminal, status, validation, application-chrome, and dialog-label colors were corrected in `assets/brand/brand-overrides.css`. After bumping the service-worker cache to `adigunsps-shell-v78`, Chrome visually rechecked the component selector and properties, component card and terminals, main menus, toolbar, sidebar labels, File dropdown, and Settings dialog. At 711×693, dialog labels and helper text were legible on the light surface and the dialog content retained its own scroll area. File → Project manager opened its dialog, and Escape closed it. The temporary components were removed afterward. Focused branding tests and the production build pass.

This is a focused manual smoke check, not full end-to-end coverage. It does not prove every menu command, toolbar button, dialog, canvas gesture, property, or example through browser storage. Narrow viewport and zoom sweeps, all 1,000 browser open/save/reopen workflows, screen-reader checks, cross-browser/PWA installation, and security/performance audits remain outstanding. Automated example results are model-level JSON round-trips as detailed in `engineering-validation-report.json`.
## Production avatar follow-up

Date: 2026-11-01
Environment: Chrome, deployed GitHub Pages release `ed092a3` at `https://hephzibahbehulahhq.github.io/AdigunSPs/`.

- Reloaded the deployed app with an existing member session. The uploaded profile photo appeared in the top bar, the signed-in status dot was green, and the default profile icon was not visible over it.
- The main workspace showed `ALL GOOD`. No profile, project, or account data was changed during this visual check.

This confirms the existing stored avatar renders in the deployed header. It does not test a fresh avatar upload, sign-out/sign-in persistence, or other users' profiles; those still need dedicated test accounts.

