# AdigunSPs Help and User Guide

AdigunSPs simulates PLC logic and HMIs. Physical control unavailable.

## Table of contents

- [Getting started](#getting-started)
- [Taking the onboarding tour](#taking-the-onboarding-tour)
- [Navigating the interface](#navigating-the-interface)
- [Program Main](#program-main)
- [Components / Schematic](#components-schematic)
- [HMI](#hmi)
- [First project: use all three workspaces](#first-project-use-all-three-workspaces)
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

On wide screens, use **Window → Panel layout** to hide or resize the side panels. Clear a width to use automatic sizing again.

1. Open the AdigunSPs website in your browser.
2. Continue as guest. Guest access ends after four minutes; editing pauses, work remains in this tab.
3. In **Project → Account**, enter email and password to sign in, or choose **Create account** and confirm by email. Use **Forgot password?** for recovery.


Header: RUN SIMULATION.

## Taking the onboarding tour

**What you'll see:** Welcome offers **Start quick tour** or **Continue**.

1. Start the tour; reopen via **? → Safety and help → Start quick tour**.
2. Use **Back/Next**; **Finish** exits.

## Navigating the interface

Switch guides with **Help topics**, **2-minute start**, and **Full manual** in the Help menu.

| Workspace | Use it for | First move |
| --- | --- | --- |
| Program Main | PLC logic and scan-by-scan simulation | Open a network and inspect its tags |
| Components / Schematic | Named electrical parts, terminals, and routed wires | Select a component to inspect its pins |
| HMI | Operator screens connected to project tags | Add a widget and bind its tag |

Escape closes menus. Use arrow keys and Enter in logic outlines. Open phone drawers with **Panel layout**. Close using **×**, **Escape**, or Tab past either end.

## Program Main

In **Program Main**, choose LD, FBD, ST, or SFC. For a first ladder, add BOOL `Start` and `Stop` inputs and a BOOL `Motor` output under **Tags and I/O**. Add a rung with Start NO and Stop NC before the Motor coil; add a Motor NO holding branch if needed. Set inputs in **Simulated inputs**, then use **Run** or **Step** and check diagnostics. Set the chart start in **Initial step**. PLCopen XML supports sequential charts with BOOL conditions and actions. Logic simulation does not imply motor physics. PLCopen ladder interchange preserves TON on-delay, TOF off-delay, and TP pulse timers with whole-millisecond presets, including compound TIME literals.

## Components / Schematic

Open **Components / Schematic**, search for a named model, and choose **Place component**. Select it to inspect manufacturer, part number, pins, and model limits. Drag its header to move it. The schematic keeps its scroll position. Choose **Connect wire**, select a terminal, click to add bends, and select the destination terminal. Use **Select / Move** to leave wire mode and **Validate** to check the drawing. Electrical simulation is a teaching model, not a hardware or safety test.

## HMI

In **HMI**, add **Switch**, **Lamp**, **Value**, or **Trend** widgets. Bind tags in **Properties**. Activation keeps keyboard focus. Use BOOL for switches and lamps, numeric tags for values and trends. **Processes** sets PID limits. **Issues** announces changed validation counts. **Watch** opens fault-adjusted values.

## First project: use all three workspaces

1. Open **File → Example browser** and choose an example with **How to test** instructions.
2. In **Program Main**, inspect its tags and logic, toggle the named inputs, then run or step and check outputs and diagnostics.
3. In **Components / Schematic**, inspect pins, move a part or cable, then validate.
4. In **HMI**, bind a Switch to a BOOL input and a Lamp to a BOOL output. Run again and check both.
5. Save signed-in work to the cloud or choose **Save locally (JSON)**. Guest changes are temporary.

If a step does not match the example, follow that project's **How to test** and inspect **Issues/Diagnostics** before changing the model.

## Creating a project

The editor opens an empty project. **Project manager** lists saved projects. Wide screens place **Undo**, **Redo**, **Save**, and **Run** in the header. Otherwise, use the toolbar.

1. Select **New** on the toolbar or **File → New project**. Confirm replacing the current project if prompted.
2. The new project opens as **Untitled project** with an empty ladder and default Main task. Project creation does not ask for a name or description.
3. Project creation has no name or description fields and no **Create** button. To name the project later, open **Project manager** from **File** or **Project**, choose the rename pencil beside it, and enter a name. The manager lists recent projects in last-opened order. To add a description, author, version, or project language, choose the gear and save **Project properties**.
4. **Settings** (⚙) contains the Main task name and scan cycle, autosave, simulation speed, theme, trend history, accessibility preferences, and the localization audit.
5. To remove a project, use the × button beside it in **Project manager** and confirm. To make a separate copy, choose the duplicate icon.

## Saving your work

**What you'll see:** The top bar shows **Saving…**, **Saved locally**, or **Unsaved changes**; the footer says **Project saved on this device** when local storage is available.

1. For signed-in users, autosave is enabled by default and stores changes in this browser. Guest autosave keeps only a temporary draft in the current tab. To change autosave, open **Settings** (⚙), adjust the preference, and select **Done**.
2. After signing in, choose **Save** or **File → Save locally (JSON)** and save the downloaded project file. **Save as** creates a named copy; in **Account**, enter **Cloud project name** and select **Save to Cloud** (new copy). Guests must authenticate before permanently saving or exporting a project file.
3. If autosave is off, select **Save** before closing. With unsaved edits, the browser asks before leaving; if storage is unavailable, export a JSON copy.
4. In **Project manager**, review snapshot history, compare changed lines, or restore a snapshot. PLCopen XML preserves one cyclic task assigned to the imported program. **File → Import** accepts supported PLCopen LD, ST, and FBD. Wire a counter’s CV port to a numeric FBD input. Imported wires retain their tag types. Invalid typed initializers are rejected.

## Using commands

Commands control the workspace and simulator without reaching a PLC or shell. Tab and Shift+Tab close command menus.

Commands include **New project**, **Project manager**, **Example browser**, **Add rung**, **Add contact**, **Run**, **Step**, **Reset**, **Tags and I/O**, and **Safety and help**.

Open **Search all commands** with Ctrl+K (⌘+K on Mac). Search commands, saved projects, tags, and examples. Opening loads the latest save. Renaming or changing properties preserves saved logic.

**Worked example:** Search “Run.” Select **Run** to start scans, **Pause** to halt, or **Reset** to clear outputs and timers.

## Building a project

There is no general-purpose Build button. **Run** starts PLC simulation; **Compile** runs supported Structured Text.

**What you'll see:** Starting **Run** opens the simulation HUD with scan, active rung, active timer, and status readouts; it also adds a live System log. Voltage, current, and motor RPM are shown as **Not modeled**.

1. Add logic in **Program / Main** or choose **Programs** to open FBD, ST, or SFC.
2. Set **Simulated inputs**. **Run** scans continuously, **Step** scans once, **Pause** stops scanning, and **Reset** clears state. **Operations estimates** tracks runtime and starts with optional review thresholds. CSV includes idle outputs.
3. For ST, select **Compile** and check **Diagnostics**. Statements can share or span lines; names ignore case (`motor` = `Motor`). Case-only duplicate tags are rejected.
ST POUs: **Programs → ST programs / Functions / Function blocks**. Scheduling: **Project → Cyclic ST tasks**. See User Guide.

Siemens 3RU2126-4BC0: three phase pairs and 95/96 NC + 97/98 NO; **Overload tripped** switches both auxiliary contacts. Schneider XB5AA31 is green spring-return NO (13–14); XB5AA42 is red spring-return NC (21–22).

4. Toggle tones via **Online → Toggle simulation sound**. TP ignores new input edges during an active pulse.

USB controls are under Hardware inventory / BOM.

**How to build a first ladder:**

1. Open **Tags and I/O** and create BOOL inputs `Start` and `Stop`, plus a BOOL output `Motor`.
2. In **Program / Main**, add a rung with Start NO and Stop NC contacts in series. Add a parallel branch with Motor NO and Stop NC, then use Motor as the output coil.
3. In **Components**, select a model, then **Place component**. Add PLC, contactor and motor. **Connect wire** joins terminal pairs. Apply edits in **Properties**. **Select / Move** ends wiring. Open **Simulated I/O / faults** for input/fault controls. Link an NO/NC auxiliary contact to its relay under **Associated coil**. A selector’s Position I joins 11–12; Position II joins 11–14. **Blow fuse (manual test)** trips a fuse; delete and replace it afterward. Breakers reset manually. Overcurrent is not modeled. Arrow keys move components; Shift moves five grid steps.
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

Recipes: **Submit for review** sends snapshots. **Cloud recipe reviews** and [company admin](https://admin.hephzibahbehulah.com/) support independent decisions. **Import approved copy** never applies inputs.

**Alarm history:** 100/500/2000 events; export first. AI errors: unchanged work.

Bends: click to add; drag, delete, pause, resume.
Device sources and simulation limits appear in Properties.

