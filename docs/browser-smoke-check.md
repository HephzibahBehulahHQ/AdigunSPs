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

Visual inspection found that electrical selectors retained a dark surface with dark-theme text in light mode. The theme tokens and electrical component, terminal, status, and validation colors were corrected in `assets/brand/brand-overrides.css`; focused branding tests and the production build pass. A post-fix visual browser confirmation was not completed because the Windows Computer Use helper stopped with a browser-URL confidence error.

This is a focused manual smoke check, not full end-to-end coverage. It does not prove every menu command, toolbar button, dialog, canvas gesture, property, or example through browser storage. Narrow viewport and zoom sweeps, all 200 browser open/save/reopen workflows, screen-reader checks, cross-browser/PWA installation, and security/performance audits remain outstanding. Automated example results are model-level JSON round-trips as detailed in `engineering-validation-report.json`.
