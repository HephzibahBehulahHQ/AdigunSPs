# Decisions needed to complete the platform

The current application is a local educational simulator. These inputs unlock the requirements that cannot be responsibly selected from the screenshots or empty source repository alone.

| Decision | Owner/input needed | Requirements affected |
|---|---|---|
| PLC vendors, CPU models, IEC dialects, and supported hardware | Engineering/product owner | Device catalog, hardware configuration, download, HIL, conformance checks |
| Backend and hosting model, data residency, identity provider, and retention | Product/security owner | Cloud/on-prem sync, SSO, roles, collaboration, encrypted backup, admin console |
| AI model/provider, routing, privacy notice, and data retention | Product/privacy owner | Adigun BOT, voice, screenshot review, assistant audit, evaluation |
| Approved process models and operating ranges | Controls engineering owner | Tank, conveyor, motor, heater, pump, PID and digital-twin simulations |
| Protocol hardware and test endpoints | Controls/network owner | OPC UA, Modbus, MQTT, REST, historian and traffic simulator |
| Technical reviewers for German, Yoruba, and Nigerian Pidgin | Localization owner | Approved glossary, complete translated UI and reviewed learning content |
| Classroom roles, grading rules, certificates, and sharing policy | Education owner | Assignments, reports, similarity checks, remote labs, community features |
| Resource administrators and approved domains | Security/content owner | Managed registry, link checker, approval, offline status, access audit |
| Retention, signature meaning, and approval policy | Legal/quality owner | E-signatures, audit records, alarms, event history, approved versions |
| Product license, source redistribution, and third-party asset terms | Company/legal owner | Repository `LICENSE`, product distribution terms, and confirmation of rights for bundled assets |

These dependencies do not block local editor work. No vendor, provider, standards interpretation, external resource, credential, or safety limit should be invented to make a feature appear complete.
