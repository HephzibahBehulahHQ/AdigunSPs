Warning: truncated output (original token count: 9566)
Total output lines: 279

# User guide

## Refresh an older application version

Open `update/` under the application URL, select **Update application**, and wait for **Update ready**. Select **Return to AdigunSPs**. This reinstalls application files without clearing saved projects or your account session; a failed download can be retried.

## Electrical components

Focus a component header and use the arrow keys to move it one grid step. Hold Shift for five steps. Connected wires follow its terminals.

Open the **Components** tab to add generic educational electrical symbols. Choose a component category and symbol, add it to the grid, select it to edit its reference, label, contact state, ratings, and supported PLC channel mappings, then use **Connect terminals** and click two terminal markers to save a wire. Use an explicit junction or 24 V DC rail for branches; geometric wire crossings do not create electrical connections. Move components by dragging their header. Project save, export, and import preserve the electrical diagram.

The built-in generic PLC provides four digital inputs and outputs. Its input contacts and output lamps can be simulated; an auxiliary NO/NC contact can be linked to a contactor or relay in **Associated coil**, so it follows that coil’s A1/A2 state. Leave it unlinked to control it with the manual contact input. The two-position selector is an SPDT model: **Position I** connects common terminal 11 to 12, and **Position II** connects 11 to 14; choose the position in the selected component’s properties. During circuit simulation, coil status, selector position, and computed contact open/closed positions appear in the schematic and accessible component labels. The three-phase motor only reports a Boolean on/off educational state. Analog signal physics, manufacturer data, motor torque/speed, protection calculations, wire sizing, code compliance, and safety function validation are outside the model. No listed generic component represents or claims compatibility with a commercial part number.

A circuit breaker can be opened and manually reset in its properties. To test a fuse opening, select **Blow fuse (manual test)**; a blown fuse stays open. Delete it and add a replacement to restore the path. The fuse model does not calculate current or automatically detect overcurrent.

## Open a project

Open the project selector beside the project name. Create a blank starter project, open a saved project, duplicate it, rename it, or delete it. Changes save to IndexedDB on this device. Use the restore button beside a project to select one of its latest 25 saved snapshots. Use **Save as** to make a named copy; use **Export** to keep a portable JSON file, or **File → Export PLCopen XML** for the supported TC6 2.01 LD subset. **Import** opens JSON projects or supported PLCopen TC6 2.00 and 2.01 XML as a new local project. XML import accepts a single ladder program POU and rejects files with additional POUs. XML interchange handles series NO/NC and rising/falling edge contacts, parallel OR paths, normal/set/reset coils, and export of TON on-delay timers with integer-millisecond presets. Timer XML import, other timer types, counters, and other editor languages are rejected.

On first use, the welcome popup explains the workspace and offers **Start quick tour** or **Continue**. The six-step tour covers the ladder canvas, Components and Examples, schematic terminal wiring, Adigun BOT, Run/Step and the simulation HUD, and the hardware-model boundary. Reopen it later via **? → Safety and help → Start quick tour**; use **Back** and **Next** to navigate and **Finish** to close it. Physical-device control is not available in this build; electrical components are software models.

## Account access and guest work

Select the profile icon in the top bar to open the account panel. Enter your email and password, then choose **Sign in**. To register, enter your details and choose **Create account**; confirm your address using the email before signing in. Select **Forgot password?** below the password field to request a recovery email; open it, set and confirm your new password on the **Reset password** page at `/reset-password`, and return to sign in. Expired recovery links can be replaced by requesting another email.

Guest access lasts four minutes. After it expires, editing pauses; temporary work remains in the current browser tab. Signed-in users can save a cloud copy from the account panel; guest work is temporary and is not uploaded.

Your saved profile picture replaces the top-bar person icon after loading; a missing or failed image uses the person icon. The status dot remains visible. Select a JPG, PNG, or WebP under 3 MB in Account and choose **Save profile** to upload a replacement.

## PLC/device profile

Open **Project → PLC/device profile** to record a vendor, CPU/device model, platform, firmware version, module counts, and notes. This optional profile is user-entered and saves with the project. It does not select from a supported-device catalog, check compatibility or ratings, or connect hardware. Use **Tags & I/O** to manage logical tag roles and addresses; the generic hardware inventory remains a user-entered bill of materials.

## Edit logic

Select an output coil to choose **Normal**, **Set and retain**, or **Reset and retain** behavior. SET and RESET coils retain their BOOL state across scans and can be combined into multi-step ladder sequences; Reset coils clear only when their rung is energized. The coil properties also select an MCR section **Start** or **End**; the Start rung condition enables following rungs until End. One non-nested section is supported per project. Add a timer with **T** and select TON, TOF, TP, or retentive RTO; RTO keeps elapsed time while disabled and accepts an optional BOOL reset tag. Add **C** for a CTU/CTD counter, set its preset/reset input, or use **R** to add a rung-level RES instruction and select the counter it resets.

In FBD, use **SCALE** to linearly convert an analog input from raw minimum/maximum values to engineering minimum/maximum values. The output is clamped to the engineering range; a zero-width raw range is a validation error. The configured ranges are simulation parameters and are not hardware calibration data.

Choose LD, FBD, ST, or SFC in the editor selector. LD uses NO and NC contacts, one-scan rising/falling-edge contacts (R_TRIG/F_TRIG), parallel paths, output coils, TON/TOF/TP/RTO timers, CTU/CTD counters, and RES reset instructions. Select a contact to change its type. With a mouse or touch, drag a contact onto another contact to insert it before that position, or onto a path to append it; contacts can move between branches and rungs. Shift+Arrow keys move the focused contact left/right in a series or up/down across branches and rungs. Use **＋** to add a series contact, **Y** to add an OR branch, **−Y** to remove the selected branch, **T** to add a timer, **C** to add a counter, and **R** to add RES. Select a counter chip to set its type, preset, optional reset input, and optional numeric count tag; its input counts once per rising edge. The tag panel supports BOOL, INT, REAL, and TIME variables, roles, addresses, and aliases. Numeric simulated inputs and outputs are supported in FBD and ST. Non-BOOL LD contacts are flagged because LD evaluates Boolean logic only. Export I/O schedule CSV from the tag panel; it includes project metadata, company/product attribution, tag types, roles, addresses, aliases, and initial values. Choose Print I/O schedule to open a branded print sheet; use the browser print dialog to save it as PDF. **Hardware inventory / BOM** stores equipment details you enter with the project and exports a branded CSV or print sheet; descriptions are required, while category, manufacturer, part number, and notes are optional. Enter only verified details; the app does not select or validate equipment or ratings.

Structured Text identifiers ignore letter case: `motor` and `Motor` refer to the same declared tag. Tag names must be unique ignoring case; renaming updates complete ST identifiers while preserving comments and quoted text, and tags referenced in ST cannot be deleted until those references are removed. Other editors retain their existing reference rules.

IF/ELSIF/ELSE blocks may also share lines; nested block comments and line comments preserve diagnostic line numbers. A missing semicolon, unfinished comment, or incomplete IF block prevents compilation.

### Named ST programs and cyclic execution

**What you'll see:** **Programs → ST programs** lists named PROGRAM declarations and their source lines. **Project → Project task and preferences** sets simulated time per base scan; optional **Cyclic ST tasks** configure program periods and priorities.

1. In a project copy, choose **Project → Cyclic ST tasks → Use default task**. In **Project → Tags and I/O**, add `CountView` as an INT output and `Complete` as a BOOL output.
2. Choose **Programs → ST programs**, then **Open ST editor**, and enter:

```iecst
PROGRAM CounterStage
VAR
 Cycles : INT;
END_VAR
Cycles := Cycles + 1;
CountView := Cycles;
END_PROGRAM
PROGRAM Indicate
Complete := CountView >= 3;
END_PROGRAM
```

3. Select **Compile**, then **Reset**, then **Step** three times. CountView becomes 1, 2, then 3; Complete becomes true on the third scan.
4. Open **Programs → ST programs** and select **Edit source** beside a definition to focus it. Move whole PROGRAM blocks in ST to change execution order, then compile again.
5. Use **Record**, advance with **Step**, and open **Trace** to inspect **Program locals** in historical state changes. **Restore selected scan** restores those locals along with the rest of the recorded simulation state.

Without custom task assignments, statements outside declarations execute first; named programs then execute once in source order on every scan. Later assignmen…4566 tokens truncated…t** exports the local open history.

## Modbus TCP simulator

Choose **Tools → Modbus TCP simulator** to try Modbus TCP frames against a local simulated memory map. The simulator supports reading coils/discrete inputs/holding/input registers (functions 1–4), writing one coil or register (5–6), and writing multiple coils or registers (15–16). It validates MBAP framing, address ranges, quantities, and values, returns protocol exceptions, and records up to 50 request/response pairs in the session traffic monitor. **Reset memory** restores the sample values. It creates no network connection and cannot control a physical device.

## Safety

AdigunSPs — a product of HEPHZIBAH BEHULAH — is an educational simulator. It is not a certified safety system and does not connect to a physical PLC. Do not use it instead of a certified safety PLC, hardwired safety circuit, or formal functional-safety validation.

In the **Scenario** runner, run your scan sequence, then export the result as a branded CSV or print it to PDF. The report records inputs, expected and actual outputs, and pass/fail status. In the HMI designer, **Snap** aligns dragged widgets to grid cells; turn it off to preserve their within-cell position.

In **Hardware inventory / BOM**, link each user-entered item to a project PLC tag and enter its panel position as verified by your own design. **Print panel layout reference** includes the mapped tag address and position. It is a reference report only, not a panel design or electrical schematic.

Open the project menu to see local projects sorted by most recently opened. The last-opened time is stored with each project and opening one does not add a recovery snapshot.

The HMI toolbar's **SCREEN** selector switches among project-saved screens. Use **＋ Screen** to add a screen, edit **NAME** to rename it, or **Delete screen** to remove it. A project always keeps at least one screen, and each screen retains its own widgets

Cloud saving: open **Account**, enter **Cloud project name**, then click **Save to Cloud**. The name is entered in the Account panel; no browser popup is required. Each save creates a separate cloud copy; earlier copies remain available.

Cloud project rows show the saved copy name and update time. A version is shown only when version metadata is available.

Opening a different project, importing a project, or reopening a cloud copy stops the prior simulation and clears its forced inputs, timer/output state, recording/replay, trace breakpoints, and undo history. The loaded project starts from its own initial inputs. **Reset** within the same project keeps recorded trace frames available for inspection.

In **Add simulated alarm**, numeric tags default to the high-threshold trigger. Select the low-threshold trigger if needed and enter a numeric threshold; empty thresholds are rejected. BOOL tags use the true/false trigger.

Recipe application: select **Review inputs** to compare current and saved values, then **Apply inputs** to commit or **Back to recipes** to cancel. The project retains the latest 200 application records with time, signed-in user ID when available, and before/after values. This browser-local history is editable project data, not a trusted approval/signature service; independent reviewer approval remains unimplemented. Removed or mistyped input tags are rejected before application.

### Independent cloud recipe review

1. Sign in, open **Recipes**, and select **Submit for review** beside a saved recipe. This sends its name, version, input values, and project name to account storage as a fixed snapshot.
2. Open **Cloud recipe reviews** to see the latest 100 visible submissions. Owners see their own submissions; administrators can review all.
3. An administrator other than the submitter chooses **Approve** or **Reject**, reviews the submitted inputs, optionally enters a comment, and selects **Confirm decision**. One final decision is allowed; resubmit a changed recipe as a new snapshot.
4. For an approved snapshot, select **Import approved copy**. Matching input tags and types are required. The imported copy does not change running inputs; use **Review inputs** and **Apply inputs** separately.

Server rules prevent self-approval, anonymous submissions, changes to submitted values, and edits to decisions by application users. Reviewer roles must be provisioned by a trusted administrator through server-controlled account metadata. A local imported copy remains editable and is not an approval of later changes. This workflow is optional and does not certify machinery, engineering suitability, legal signatures, or local recipes. Account deletion by a trusted administrator can remove associated records. Real independent-reviewer browser testing remains pending.

The shared company portal at https://admin.hephzibahbehulah.com/ hosts a separate **Admin account → AdigunSPs admin** panel. After the existing Cloudflare Access check, sign in using the designated AdigunSPs administrator account. This panel uses only the AdigunSPs backend and a memory-only product session. Closing it signs out only that product session. VoltPro account controls and its separate backend are unchanged.

In **Alarm history**, choose **Event history limit**: 100, 500 (default), or 2000 events. This setting saves with the project and applies to configured, raised, cleared, acknowledged, shelved, suppressed, and removed events. Reducing the limit keeps the newest events; export JSON first if you need older records. Close the dialog, then use **Undo** to restore a retention change and its prior local events. This is local event-count retention, not a tamper-proof historian or a server retention policy.

If hosted AI cannot return an answer, your project remains unchanged. A request may already have reached the service; an unavailable-answer message does not prove that nothing was sent. Keep consent off to use only the offline helper.

On narrow phones the header uses two rows: company/product identity above, project menu and account/language/settings/search/help controls below. All five controls remain available without horizontal scrolling.

On phones, scroll the editor tabs and its control row sideways to reach extra controls; the page itself stays within the screen.

Choose **Panel layout** to open the Project and I/O panel or the Inspector and diagnostics panel. Tap the **×** at the top of the open side panel to close it.

Hosted questions show **Waiting for a reply...** and temporarily disable other sends. Choose **Cancel request**, or close the Bot, to stop waiting; requests time out after 45 seconds, including session lookup and response reading. Cancellation or timeout does not undo a request already processed; the project remains unchanged, and a reply from a different project/account is discarded.

### Mixed-language project files

Project JSON can define a `programUnits` array with named LD, FBD, ST and SFC units. Each unit declares its project output tags and provides `rungs`, `blocks`, `source` or `chart` for its language. Optional `tasks` assign unit names in execution order. Without assignments, units run in file order.

The simulator runs these units when the project is opened. Units share the current tag image and retain their own execution state. Each saved unit can be copied into its language editor. Per-unit graphical monitoring remains pending.

Open **Programs > Mixed-language programs** to edit and apply the JSON configuration in the app. Applying resets simulation state. Use empty arrays to return to single-editor execution.

**Add current editor as a unit** copies the current logic into the draft. Review its name, output tags and task assignment before applying.

Select a saved unit and choose **Load unit into editor** to replace the working body for that language. Undo can restore the previous working body. After editing, reopen the dialog, select the same unit, choose **Copy editor changes to selected unit**, then **Apply configuration**. Running uses the saved units until you apply the draft.

**Latest scan snapshot** shows shared outputs and retained state by unit when the dialog opens. Reopen the dialog to refresh the snapshot.

Mixed ST units share project inputs and outputs. Other scalar tags use their project initial values on the first scan, then retain separate values in each ST unit until reset.

For mixed projects, **Project > Cyclic ST tasks** also accepts the saved LD, FBD, ST and SFC unit names. Task assignments apply to saved units rather than unsaved working bodies.

Mixed-project trace history includes retained unit state and the task clock. Replay divergence reports include expected and actual mixed state.

Tag renames update saved unit references. Remove references from saved units before deleting a tag.

Diagnostics identifies saved units with invalid logic by name. Applying a configuration or scanning a mixed project checks these errors before execution.

Use project JSON to export saved program units and task assignments. PLCopen XML export is available for the supported single ladder body and refuses projects with units or task assignments.

A scenario frame with a compiler or runtime error reports FAIL even if the previously held outputs match the expected values.

## USB connection

Open **I/O & Tags → Hardware inventory / BOM**, then select **Connect USB** in a browser with Web Serial support. Choose the port for a device running compatible firmware. **USB port open** confirms the browser opened the port.

Select **Sync device** to send SYNC. A device acknowledgement starts a one-second heartbeat. **Stop all outputs** sends a stop request and closes the connection after the reply or timeout. An acknowledgement confirms receipt of the stop command. Physical shutdown must be verified separately. Use the independent hardwired emergency stop when immediate shutdown is required.

