# AdigunSPs Help and User Guide

AdigunSPs simulates PLC logic and HMIs; physical control is unavailable.

## Table of contents

- [Getting started](#getting-started)
- [Taking the onboarding tour](#taking-the-onboarding-tour)
- [Navigating the interface](#navigating-the-interface)
- [Creating a project](#creating-a-project)
- [Saving your work](#saving-your-work)
- [Using commands](#using-commands)
- [Building a project](#building-a-project)
- [Using Adigun BOT](#using-adigun-bot)
- [Using the Bot window](#using-the-bot-window)
- [Hosted AI privacy](#hosted-ai-privacy)
- [The live co-pilot](#the-live-co-pilot)
- [Using ready-made example projects](#using-ready-made-example-projects)
- [Troubleshooting](#troubleshooting)

## Getting started

**What you'll see:** An untitled project, menus, canvas, side panels, and status.

1. Open the AdigunSPs website in your browser.
2. Select **Continue as guest** if the account screen appears. The top bar shows your four-minute guest-access countdown. When it expires, editing pauses until you sign in or create an account; your temporary work remains in the current tab.
3. Select the profile icon labelled **Sign in** or **Account**, enter email and password, then **Create account** or **Sign in**. Confirm registration by email. Use **Forgot password?** for recovery.

Project and tools: left; canvas: center; Properties/Watch/Diagnostics: right; run/status: footer.

## Taking the onboarding tour

**What you'll see:** Welcome offers **Start quick tour** or **Continue**.

1. Start the tour; reopen via **? → Safety and help → Start quick tour**.
2. Use **Back/Next**; **Finish** exits.

## Navigating the interface

The left toolbox follows LD/FBD/ST/SFC/HMI; at 1200 px, Save, Undo, Redo, and Run move to the header. Components filters generic models by category, name, or ID; clear its search to restore all. Manufacturer references are informational. Physical control unavailable.

1. Click a top menu or toolbar control to open its menu or panel.
2. Click outside or press Escape to close a menu; tap outside on touch.
3. Select **Help** to read this guide. Use **Safety and help** (?) for safety notes and the tour; **External resources** remains below.

| Menu / icon | What it does | Where it is |
| --- | --- | --- |
| File | New, examples, save/import/export, print, project manager | Top menu bar |
| Edit | Undo/redo, copy/cut/paste rung, find and replace | Top menu bar |
| View | Zoom, grid, panel layout, full screen | Top menu bar |
| Project | Project manager, tags and I/O, hardware/device settings | Top menu bar |
| PLC/SPS | I/O and simulation controls | Top menu bar |
| I/O & Tags | Open I/O and tag tools | Top menu bar |
| Programs | Choose LD, FBD, ST, or SFC | Top menu bar |
| Online / Debug | Simulation tools, watch, trace, events, checks | Top menu bar |
| Tools | Examples, ST compile, scenarios, estimates, Modbus simulator, Adigun BOT | Top menu bar |
| Window / Settings | Panel layout; open phone drawers here, close with **×** | Top menu bar or drawer |
| Help | Safety/help and external resources | Top menu bar |
| Profile, EN, ⚙, ⌕, ? icons | Account access, language, settings, command search, safety/help | Top-right product bar |
| Save, Undo, Redo, Run | Project/simulation | Header ≥1200 px; else toolbar |
| Program / Main, Components, HMI | Switch editor workspace | Tabs or project tree |
| LD/FBD/ST/SFC/HMI tools | Actions for the active editor | Left toolbox |
| HMI widgets | Add; edit, move, delete | Left toolbox; right inspector |
| Properties, Watch, Diagnostics | Edit the selected instruction, monitor values, and review checks | Right sidebar |
| Simulated inputs, Outputs, Project Explorer | Set test inputs and navigate the open project | Left sidebar |
| Help & docs | Open help and documentation | Footer |

**What you'll see:** A dialog has a **Close** or × control; the editor tabs include **Program / Main**.

1. Close an open dialog with its **Close** or × control, or press Escape to close an open menu.
2. Select **Program / Main** to return to the ladder workspace from another editor tab.

## Creating a project

**What you'll see:** The editor opens with an untitled, empty project. The **File** menu and **New** toolbar button start a fresh project; **Project manager** lists saved projects.

1. Select **New** on the toolbar or **File → New project**. Confirm replacing the current project if prompted.
2. The new project opens as **Untitled project** with an empty ladder and default Main task. Project creation does not ask for a name or description.
3. Project creation has no name or description fields and no **Create** button. To name the project later, open **Project manager** from **File** or **Project**, choose the rename pencil beside it, and enter a name. The manager lists recent projects in last-opened order. To add a description, author, version, or project language, choose the gear and save **Project properties**.
4. **Settings** (⚙) contains the Main task name and scan cycle, autosave, simulation speed, theme, trend history, contrast, and readable-font preferences.
5. To remove a project, use the × button beside it in **Project manager** and confirm. To make a separate copy, choose the duplicate icon.

## Saving your work

**What you'll see:** The top bar shows **Saving…**, **Saved locally**, or **Unsaved changes**; the footer says **Project saved on this device** when local storage is available.

1. For signed-in users, autosave is enabled by default and stores changes in this browser. Guest autosave keeps only a temporary draft in the current tab. To change autosave, open **Settings** (⚙), adjust the preference, and select **Done**.
2. After signing in, choose **Save** or **File → Save locally (JSON)** and save the downloaded project file. **Save as** creates a named copy; in **Account**, enter **Cloud project name** and select **Save to Cloud** (new copy). Guests must authenticate before permanently saving or exporting a project file.
3. If autosave is off, select **Save** before closing. With unsaved edits, the browser asks before leaving; if storage is unavailable, export a JSON copy.
4. To recover an earlier local version, open **Project manager** and select the curved-arrow recovery control beside the project. Choose a snapshot to restore it.

## Using commands

A command is an app action like adding a rung, opening a project, or running a simulation—not text sent to a PLC or shell.

Commands include **New project** (start empty), **Project manager** (open saved work), **Example browser** (load a learning project), **Add rung**, **Add contact**, **Run**, **Step**, **Reset**, **Tags and I/O**, and **Safety and help**.

**What you'll see:** Press **Ctrl+K** (or **⌘+K** on Mac), or click ⌕ **Command search**, to open the searchable command list.

1. Type a few letters in the search field.
2. Select a result to run it. Search can also find projects, tags, and examples when you enter a search term.
3. **Worked example:** Press Ctrl+K, type “Run,” then select **Run**. The simulator begins repeated PLC scans; use **Pause** to pause or **Reset** to clear simulated outputs and timers.

## Building a project

AdigunSPs does not have a general-purpose “Build” button. In this app, **Run** starts the PLC simulation; **Compile** checks and runs the supported Structured Text workflow.

**What you'll see:** Starting **Run** opens the simulation HUD with scan, active rung, active timer, and status readouts; it also adds a live System log. Voltage, current, and motor RPM are shown as **Not modeled**.

1. Add logic in **Program / Main** or choose **Programs** to open FBD, ST, or SFC.
2. For ladder logic, set simulated inputs in the **Simulated inputs** panel and select **Run** to scan continuously, or **Step** for one scan. Select **Pause** to pause; **Reset** stops and clears simulation state.
3. For ST, select **Compile** and check **Diagnostics**. Statements can share or span lines; names ignore case (`motor` = `Motor`). Case-only duplicate tags are rejected.
ST POUs: **Programs → ST programs / Functions / Function blocks**. Scheduling: **Project → Cyclic ST tasks**. See User Guide.

4. Successful runs show outputs and HUD values. Toggle tones via **Online → Toggle simulation sound** or command search. On wide screens, ribbon actions remain in menus and search. Fix reported compile errors.

The HUD is educational: voltage, current, and motor RPM are not calculated. USB controls are under Hardware inventory / BOM.

**How to build a first ladder:**

1. Open **Tags and I/O** and create BOOL inputs `Start` and `Stop`, plus a BOOL output `Motor`.
2. In **Program / Main**, add a rung with Start NO and Stop NC contacts in series. Add a parallel branch with Motor NO and Stop NC, then use Motor as the output coil.
3. In **Components**, add PLC, contactor and motor from the **left toolbox**, wire the path, and edit selections in **right Properties**. **Select / Move** ends wiring. Manufacturer references remain informational. Link an NO/NC auxiliary contact to its relay under **Associated coil**. A selector’s Position I joins 11–12; Position II joins 11–14. **Blow fuse (manual test)** trips a fuse; delete and replace it afterward. Breakers reset manually. Overcurrent is not modeled. Arrow keys move a focused component header; Shift moves five grid steps.
4. Set Start true and Stop false in **Simulated inputs**, then select **Run**. Relay/contactor coils glow when energized, and linked auxiliary symbols show their computed open/closed positions. Set Stop true to stop the simulated Boolean output; this does not verify real motor or safety wiring. See [COMPONENTS.md](COMPONENTS.md) for the model boundaries.

## Using Adigun BOT

Adigun BOT answers PLC questions, drafts supported gate/timer/start-stop logic, prepares reviewed tag/rung edits, and searches the example library. It is an offline helper; unsupported edits are declined.

**What you'll see:** Adigun BOT opens in a movable panel with a prompt, optional 🎙 **Voice input**, shortcuts, and transcript.

1. Open **Adigun BOT** from its floating button or **Tools**. Type a request or choose **Voice input** if supported.
2. Submit and review the plan, sketch, and expected outputs. Import is disabled if checks fail.
3. Use **Preview on canvas** to inspect, **Commit project** or **Import to canvas** to apply, or **Discard preview** / Escape to roll back.
4. Signed-in users can choose **Save locally** or **Save to cloud**. Guests may import drafts, but both save actions are disabled until they sign in; a draft remains available in the current tab while they open the account dialog.
5. Choose **Edit request** to return to the prompt with the request restored, or **Discard** to close the draft. For exact supported requests and limits, read [BOT.md](BOT.md).

## Using the Bot window

**What you'll see:** Title bar controls, chat, and a lower-right resize handle; the canvas remains clickable.

1. Drag the title bar to move the panel below the menus.
2. Drag the bottom-right handle to resize; layout saves per account or guest.
3. Select **Minimize** to collapse it; the Adigun BOT button restores it.
4. Select **Maximize**, then **Restore**, to expand and return to the previous size and position.
5. Select **Close** to hide it; the Bot button reopens it. Window state persists after reload.
6. On phones it fills the screen; **Close** or **Escape** returns focus to the Bot button.

New co-pilot suggestions set an unread dot and notification; the window stays closed.

The builder supports FBD gates, a TON lamp, LD start/stop, tag rename, and selected-rung deletion. Other project edits are not available; electrical models are educational.

### Hosted AI privacy

With consent, **Ask** sends your question and a short project summary (editor, I/O/logic counts, up to eight check codes) to Cloudflare Workers AI for an educational reply. HEPHZIBAH BEHULAH receives a sign-in token for account verification. Replies are not engineering or safety approval.

**Waiting for a reply…** blocks duplicate sends. **Cancel request** or closing the Bot stops waiting. Timeout: 45 seconds; processing may already have occurred.

## The live co-pilot

The co-pilot flags project-check errors, missing inputs on supported FBD gates, and unwired terminals. It may ask your project goal; suggestions need your approval to change anything.

**What you'll see:** A small suggestion card beside the Adigun BOT button. It does not block the canvas or save work.

1. Open **Adigun BOT** and select **Live co-pilot** to turn suggestions on or off. The choice stays on this browser.
2. Select **Tell me more** to see the finding details, or **Dismiss** to hide that same finding for the current project session. Suggestions wait while you drag or type and are rate-limited.
3. Select **Accept** on a missing AND/OR input suggestion to review a draft plan. Use **Preview on canvas** to inspect it, then **Commit project** to apply it or **Discard preview** to roll it back. Other suggestions open the relevant workspace or Bot prompt for inspection.
4. When the co-pilot asks what you are building, enter the goal in Adigun BOT. The answer guides suggestions until you switch projects.

Co-pilot never auto-saves. Draft saves require sign-in; checks do not certify wiring or safety.

## Using ready-made example projects

**What you'll see:** **Example browser** opens a searchable list of 1,000 examples across Core / Beginner, Motor Control, Process Control, Safety & Interlocks, Traffic & Lighting, and Building Automation, with category and difficulty filters.

1. Select **Examples** on the toolbar, **File → Example browser**, or **Example library** in the project tree.
2. Search by scenario or choose a category, then select an example row. Each row shows a description and **How to test**. Confirm if prompted; the selected example becomes the current project. Use **Show 50 more** to browse additional results.
3. To preserve the original, open **Project manager** and choose its duplicate icon before editing; **Save as** exports a separate file.
4. Follow the example's **How to test** steps, then use **Step** or **Run** to explore the expected behavior. Voltage, current, and RPM readouts are marked **Not modeled** because the app does not calculate those physical quantities.

## Troubleshooting

**What you'll see:** The profile icon shows your photo/status; errors appear in **Diagnostics**.

1. **I can't sign in:** Enter your email/password via the profile icon. New accounts need email confirmation. Check spam or ask the administrator about missing emails.
2. **I forgot my password:** Select **Forgot password?**, enter your email, then open the recovery email. Set and confirm your password at `/reset-password`, then sign in. Request another email if the link expired.
3. **My project disappeared:** Check **Project manager** on the browser/device used. Local projects stay there; check **Account → Your cloud projects** or import your JSON backup.
4. **The build failed:** For ST, read errors beside **Compile** and in **Diagnostics**. For simulation, check input values, tags, and logic validation.
5. **I got logged out:** Select the profile icon and sign in again. Local projects stay in that browser; cloud projects need an account session.
6. **Old interface:** Open [Update application](https://adigunsps.hephzibahbehulah.com/update/), select **Update application**, then return to AdigunSPs. Saved projects and sign-in remain.

Recipes: name and save; **Review inputs** then **Apply inputs**. Numeric alarms: threshold/hysteresis. Opening projects clears simulation/forces/replay.

Recipes: **Submit for review** sends snapshots. **Cloud recipe reviews** and [company admin](https://admin.hephzibahbehulah.com/) support independent decisions. **Import approved copy** never applies inputs. No safety certification.

**Alarm history:** 100/500/2000 events; export first. AI errors: unchanged work. Tabs scroll.

Canvas/inspector actions include component editing; grid and zoom stay contextual.
