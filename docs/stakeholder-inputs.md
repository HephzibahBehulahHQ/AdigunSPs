# Decisions needed to complete the platform

The current application is a local educational simulator. These inputs unlock the requirements that cannot be responsibly selected from the screenshots or empty source repository alone.

| Decision | Owner/input needed | Requirements affected |
|---|---|---|
| PLC vendors, CPU models, IEC dialects, and supported hardware | Engineering/product owner | Device catalog, hardware configuration, download, HIL, conformance checks |
| AdigunSPs account backend and production origin | Product/security owner | Confirmed via the connected HephzibahBehulahHQ account on 2026-10-30: AdigunSPs project fqcbfnktdvqojyezxeis (https://fqcbfnktdvqojyezxeis.supabase.co) is active in eu-west-1, separate from VoltPro vnckoocsookbaqalybje (https://vnckoocsookbaqalybje.supabase.co). Initial inspection found no public tables or migrations. Two account/cloud migrations are now applied with RLS and a private avatar bucket; security advisor currently reports no lints. Email confirmation is on; anonymous sign-in is off; Auth Site URL remains http://localhost:3000. The app has auth/profile/cloud UI, but live sign-up, reset, guest and multi-user access tests need anonymous sign-in enabled and correct local/production callback URLs. Production origin is not supplied. No administrator is provisioned; assign trusted app_metadata.role=admin only through an authorized server-side process. Cloudflare deployment access is not connected. See docs/supabase-integration.md.
| Data residency, offline sync, and encrypted backup strategy | Product/security owner | Cloud/on-prem project sync, residency requirements, collaboration, encryption, and recovery guarantees |
| AI model/provider, routing, privacy notice, and data retention | Product/privacy owner | Adigun BOT, voice, screenshot review, assistant audit, evaluation |
| Approved process models and operating ranges | Controls engineering owner | Tank, conveyor, motor, heater, pump, PID and digital-twin simulations |
| Protocol hardware and test endpoints | Controls/network owner | OPC UA, Modbus, MQTT, REST, historian and traffic simulator |
| Technical reviewers for German, Yoruba, and Nigerian Pidgin | Localization owner | Approved glossary, complete translated UI and reviewed learning content |
| Classroom roles, grading rules, certificates, and sharing policy | Education owner | Assignments, reports, similarity checks, remote labs, community features |
| Resource administrators and approved domains | Security/content owner | Managed registry, link checker, approval, offline status, access audit |
| Retention, signature meaning, and approval policy | Legal/quality owner | E-signatures, audit records, alarms, event history, approved versions |
| Product license, source redistribution, and third-party asset terms | Company/legal owner | Repository `LICENSE`, product distribution terms, and confirmation of rights for bundled assets |

These dependencies do not block local editor work. No vendor, provider, standards interpretation, external resource, credential, or safety limit should be invented to make a feature appear complete.
