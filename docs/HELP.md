# AdigunSPs Help and User Guide

AdigunSPs simulates PLC programs, I/O, HMIs, and examples; it does not connect to a physical PLC.

## Table of contents

- [Getting started](#getting-started)
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
- [Glossary](#glossary)

## Getting started

**What you'll see:** The editor opens with an untitled project, menus and toolbar above it, side panels, and status information along the bottom.

1. Open the AdigunSPs website in your browser.
2. Select **Continue as guest** if the account screen appears. The top bar shows your four-minute guest-access countdown. When it expires, editing pauses until you sign in or create an account; your temporary work remains in the current tab.
3. To register or sign in, select the profile icon. It is labelled **Sign in** when signed out and **Account** after sign-in. Enter your email, choose **Create account** or **Sign in**, then enter the email code or open the sign-in link.

The first screen has the product bar, menus, and toolbar above the editor. The project tree and simulated inputs are on the left; the canvas is centered; Properties, Watch, and Diagnostics sit on the right. Run, storage, language, and help status appear in the footer.

## Navigating the interface

**What you'll see:** The top menu bar shows File through Help; the toolbar directly below contains common project and simulation actions.

1. Click a top menu or toolbar control to open its menu or panel.
2. Move the pointer outside an open menu, click outside, or press Escape to close it. On touch screens, tap outside.
3. Select **Help** to read this guide. Use the **Safety and help** icon (?) for safety notes and the guided tour; **External resources** remains available below this guide.

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
| Window / Settings | Panel layout, preferences, language | Top menu bar |
| Help | Safety/help and external resources | Top menu bar |
| Profile, EN, ⚙, ⌕, ? icons | Account access, language, settings, command search, safety/help | Top-right product bar |
| New, Examples, Save, Run, Step, Reset | Common project and simulation actions | Toolbar below menus |
| Program / Main, Components, HMI | Switch editor workspace | Tabs above the editor |
| Properties, Watch, Diagnostics | Edit the selected instruction, monitor values, and review checks | Right sidebar |
| Simulated inputs, Outputs, Project tree | Set test inputs and navigate the open project | Left sidebar |
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
2. After signing in, choose **Save** or **File → Save locally (JSON)** and save the downloaded project file. **Save as** creates a named copy; signed-in users can also use **Save to Cloud** in **Account**. Guests must authenticate before permanently saving or exporting a project file.
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

**What you'll see:** Simulation status appears in the footer and Diagnostics; Structured Text shows a compile status beside **Compile**.

1. Add logic in **Program / Main** or choose **Programs** to open FBD, ST, or SFC.
2. For ladder logic, set simulated inputs in the **Simulated inputs** panel and select **Run** to scan continuously, or **Step** for one scan. Select **Pause** to pause; **Reset** stops and clears simulation state.
3. For Structured Text, open the ST editor and select **Compile**. The editor shows the compile result; inspect errors there and in **Diagnostics** before running.
4. A successful simulation shows changing outputs, scan count, and run status. A failed compile reports an error; fix the indicated source and compile again.

Simulation is educational and does not certify a design or operate physical hardware.

**How to build a first ladder:**

1. Open **Tags and I/O** and create BOOL inputs `Start` and `Stop`, plus a BOOL output `Motor`.
2. In **Program / Main**, add a rung with Start NO and Stop NC contacts in series. Add a parallel branch with Motor NO and Stop NC, then use Motor as the output coil.
3. Open **Components** and place a PLC, contactor, and motor schematic model. Wire the educational power path and assign the Motor output tag to the simulated load in its properties.
4. Set Start true and Stop false in **Simulated inputs**, then select **Run**. Set Stop true to stop the simulated Boolean output; this does not verify real motor or safety wiring. See [COMPONENTS.md](COMPONENTS.md) for the model boundaries.

## Using Adigun BOT

Adigun BOT answers curated PLC learning questions and can draft a limited set of Boolean gate, timer-lamp, and start/stop ladder projects locally. It can also prepare reviewed tag-rename and ladder-rung deletion plans for the open project; deleting a rung only affects the canvas after you import the plan. It is a deterministic offline helper, not a general AI model; unsupported project edits are declined.

**What you'll see:** Adigun BOT opens in a movable panel above the workspace. Its chat has a text prompt, optional 🎙 **Voice input**, question shortcuts, and a transcript; build requests still open a separate review dialog.

1. Open **Adigun BOT** from the floating assistant button or **Tools**. Type a supported request or select **Voice input** and speak when your browser supports microphone recognition.
2. Submit the prompt. Review the plan, sketch, and expected-versus-simulated outputs; nothing changes in the active project at this stage. Import and save are disabled if the supported draft fails verification.
3. Choose **Preview on canvas** to inspect the draft without saving. Select **Commit project** to import it, or **Discard preview** (or press Escape) to restore your prior project. You can also choose **Import to canvas** to commit directly; confirm replacing unsaved work if asked.
4. Signed-in users can choose **Save locally** or **Save to cloud**. Guests may import drafts, but both save actions are disabled until they sign in; a draft remains available in the current tab while they open the account dialog.
5. Choose **Edit request** to return to the prompt with the request restored, or **Discard** to close the draft. For exact supported requests and limits, read [BOT.md](BOT.md).

## Using the Bot window

**What you'll see:** Title bar controls, chat, and a lower-right resize handle; the canvas remains clickable.

1. Drag the title bar to move the panel; it stays reachable.
2. Drag the bottom-right handle to resize; layout saves per account or guest.
3. Select **Minimize** to collapse it; the Adigun BOT button restores it.
4. Select **Maximize**, then **Restore**, to expand and return to the previous size and position.
5. Select **Close** to hide it; the Bot button reopens it. Window state persists after reload.
6. On phones it fills the screen; **Close** or **Escape** returns focus to the Bot button.

New co-pilot suggestions set an unread dot and notification; the window stays closed.

The builder creates FBD gates, a TON delayed lamp, or an LD start/stop circuit with generic PLC I/O and simulated devices. It can rename a declared tag or remove a selected rung. Motor outputs use simulated contactor and motor models. It cannot plan other edits, build traffic-light sequences, or debug arbitrary FBD paths; all behavior is simulated.

### Hosted AI privacy

Hosted AI is optional. When you check consent and select **Ask**, your question and a brief project summary (editor type, I/O and logic counts, and up to eight project-check codes) go to Cloudflare Workers AI to generate an educational reply. A sign-in token goes to HEPHZIBAH BEHULAH for account verification. Replies are not engineering or safety approval.

## The live co-pilot

The co-pilot flags project-check errors, missing inputs on supported FBD gates, and unwired terminals. It may ask your project goal; suggestions need your approval to change anything.

**What you'll see:** A small suggestion card beside the Adigun BOT button. It does not block the canvas or save work.

1. Open **Adigun BOT** and select **Live co-pilot** to turn suggestions on or off. The choice stays on this browser.
2. Select **Tell me more** to see the finding details, or **Dismiss** to hide that same finding for the current project session. Suggestions wait while you drag or type and are rate-limited.
3. Select **Accept** on a missing AND/OR input suggestion to review a draft plan. Use **Preview on canvas** to inspect it, then **Commit project** to apply it or **Discard preview** to roll it back. Other suggestions open the relevant workspace or Bot prompt for inspection.
4. When the co-pilot asks what you are building, enter the goal in Adigun BOT. The answer guides suggestions until you switch projects.

The co-pilot never auto-saves. Saving a Bot draft still requires sign-in, and the supported checks do not certify physical wiring or safety.

## Using ready-made example projects

**What you'll see:** **Example browser** opens a searchable list of 200 learning examples with category and difficulty filters.

1. Select **Examples** on the toolbar, **File → Example browser**, or **Example library** in the project tree.
2. Search or choose a category, then select an example row. Confirm if prompted; the selected example becomes the current project.
3. To keep the example unchanged, load it first, then open **Project manager**, choose the duplicate icon beside it, and open the copy before editing. You can also use **Save as** to export a named project file.
4. Run the example's simulated inputs and use **Step**, **Run**, or the example test report to explore its behavior.

## Troubleshooting

**What you'll see:** The **Account** dialog shows sign-in status; compile and logic problems appear beside **Compile** or in **Diagnostics**.

1. **I can't sign in:** Open **Account**, check the email and password, and complete any email confirmation link. If the message says the account service is not configured, contact the site administrator to check its Supabase settings.
2. **My project disappeared:** Check **Project manager** and the browser/device where you created it. Local projects stay in that browser; check **Account → Your cloud projects** for cloud copies or import your JSON backup.
3. **The build failed:** If compiling ST, read the error beside **Compile** and in **Diagnostics**. For simulation issues, check input values, tags, and logic validation.
4. **I got logged out:** Open **Account** and sign in again. Local projects remain in that browser; cloud projects require an account session.

## Glossary

| Term | Meaning |
| --- | --- |
| LD | Ladder Diagram, a relay-style PLC logic editor. |
| FBD | Function Block Diagram, logic built from connected blocks. |
| ST | Structured Text, a text-based PLC language subset. |
| SFC | Sequential Function Chart, a step-and-transition program. |
| Rung | One horizontal logic network in a ladder program. |
| Tag | A named value used by logic or simulated I/O. |
| Scan | One cycle in which the simulator reads inputs and evaluates logic. |
| Snapshot | A previously saved local project version available for recovery. |
| HMI | Human-machine interface screen designed in the app. |


