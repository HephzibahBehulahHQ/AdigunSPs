# AdigunSPs Help and User Guide

AdigunSPs is an educational PLC programming and simulation workspace. You can edit ladder logic, function blocks, Structured Text, and sequence charts; test simulated I/O; design HMI screens; and explore guided examples. It does not connect to a physical PLC.

## Table of contents

- [Getting started](#getting-started)
- [Navigating the interface](#navigating-the-interface)
- [Creating a project](#creating-a-project)
- [Saving your work](#saving-your-work)
- [Using commands](#using-commands)
- [Building a project](#building-a-project)
- [Using ready-made example projects](#using-ready-made-example-projects)
- [Troubleshooting](#troubleshooting)
- [Glossary](#glossary)

## Getting started

**What you'll see:** The editor opens with an untitled project, menus and toolbar above it, side panels, and status information along the bottom.

1. Open the AdigunSPs website in your browser.
2. Select **Continue as guest** if the account screen appears. The top bar shows your ten-minute guest-access countdown. When it expires, editing pauses until you sign in or create an account; your temporary work remains in the current tab.
3. To register or sign in, select **Account** in the top bar and choose **Create account** or **Sign in**. Guest drafts are temporary; after authentication, use **Save** or **Save to Cloud** for permanent storage.

The first screen is the editor: the top contains the product bar, application menus, and action toolbar; the left sidebar contains the project tree and simulated inputs; the center is the editor; the right side contains Properties, Watch, and Diagnostics; and the footer shows run, storage, language, and help status.

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
| Account, EN, ⚙, ⌕, ? | Account, language, settings, command search, safety/help | Top-right product bar |
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
3. Project creation has no name or description fields and no **Create** button. To name the project later, open **Project manager** from **File** or **Project**, choose the rename pencil beside it, and enter a name. To add a description, author, version, or project language, choose the gear and save **Project properties**.
4. **Settings** (⚙) contains the Main task name and scan cycle, autosave, simulation speed, theme, trend history, contrast, and readable-font preferences.
5. To remove a project, use the × button beside it in **Project manager** and confirm. To make a separate copy, choose the duplicate icon.

## Saving your work

**What you'll see:** The top bar shows **Saving…**, **Saved locally**, or **Unsaved changes**; the footer says **Project saved on this device** when local storage is available.

1. For signed-in users, autosave is enabled by default and stores changes in this browser. Guest autosave keeps only a temporary draft in the current tab. To change autosave, open **Settings** (⚙), adjust the preference, and select **Done**.
2. After signing in, choose **Save** or **File → Save locally (JSON)** and save the downloaded project file. **Save as** creates a named copy; signed-in users can also use **Save to Cloud** in **Account**. Guests must authenticate before permanently saving or exporting a project file.
3. If autosave is off, select **Save** before closing. With unsaved edits, the browser asks before leaving; if storage is unavailable, export a JSON copy.
4. To recover an earlier local version, open **Project manager** and select the curved-arrow recovery control beside the project. Choose a snapshot to restore it.

## Using commands

A command is an app action such as adding a rung, opening a project, or running a simulation—not text sent to a PLC or shell.

Useful commands include **New project** (start empty), **Project manager** (open saved work), **Example browser** (load a learning project), **Add rung**, **Add contact**, **Run**, **Step**, **Reset**, **Tags and I/O**, and **Safety and help**.

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
