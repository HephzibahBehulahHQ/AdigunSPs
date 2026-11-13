# User guide

## Refresh an older application version

Open `update/` under the application URL, select **Update application**, and wait for **Update ready**. Select **Return to AdigunSPs**. This reinstalls application files without clearing saved projects or your account session; a failed download can be retried.

## Electrical components

Focus a component header and use the arrow keys to move it one grid step. Hold Shift for five steps. Connected wires follow its terminals.

Open the **Components / Schematic** tab to add generic educational electrical symbols. Choose a component category and symbol, add it to the grid, select it to edit its reference, label, contact state, ratings, and supported PLC channel mappings, then use **Connect terminals** and click two terminal markers to save a wire. **Select / Move** cancels a pending wire and returns to normal selection. Use an explicit junction or 24 V DC rail for branches; geometric wire crossings do not create electrical connections. Move components by dragging their header. Project save, export, and import preserve the electrical diagram.

Use **Find component or instruction** above the model picker to filter generic models by category, name, or model identifier. Clear the search to restore the complete picker. Manufacturer references remain informational and are not placeable device models.

The built-in generic PLC provides four digital inputs and outputs. Its input contacts and output lamps can be simulated; an auxiliary NO/NC contact can be linked to a contactor or relay in **Associated coil**, so it follows that coil’s A1/A2 state. Leave it unlinked to control it with the manual contact input. The two-position selector is an SPDT model: **Position I** connects common terminal 11 to 12, and **Position II** connects 11 to 14; choose the position in the selected component’s properties. During circuit simulation, coil status, selector position, and computed contact open/closed positions appear in the schematic and accessible component labels. The three-phase motor only reports a Boolean on/off educational state. Analog signal physics, manufacturer data, motor torque/speed, protection calculations, wire sizing, code compliance, and safety function validation are outside the model. No listed generic component represents or claims compatibility with a commercial part number.

A circuit breaker can be opened and manually reset in its properties. To test a fuse opening, select **Blow fuse (manual test)**; a blown fuse stays open. Delete it and add a replacement to restore the path. The fuse model does not calculate current or automatically detect overcurrent.

## Open a project

The header breadcrumb shows the current project and **Main program**. Open the project selector beside the project name. Create a blank starter project, open a saved project, duplicate it, rename it, or delete it. Changes save to IndexedDB on this device. Use the restore button beside a project to select one of its latest 25 saved snapshots. Use **Save as** to make a named copy; use **Export** to keep a portable JSON file, or **File → Export PLCopen XML** for the supported TC6 2.01 LD subset. **Import** opens JSON projects or supported PLCopen TC6 2.00 and 2.01 XML as a new local project. XML import accepts a single ladder program POU and rejects files with additional POUs. XML interchange handles series NO/NC and rising/falling edge contacts, parallel OR paths, normal/set/reset coils, and export of TON on-delay timers with integer-millisecond presets. Timer XML import, other timer types, counters, and other editor languages are rejected.

On first use, the welcome popup explains the workspace and offers **Start quick tour** or **Continue**. The six-step tour covers the ladder canvas, Components and Examples, schematic terminal wiring, Adigun BOT, Run/Step and the simulation HUD, and the hardware-model boundary. Reopen it later via **? → Safety and help → Start quick tour**; use **Back** and **Next** to navigate and **Finish** to close it. Physical-device control is not available in this build; electrical components are software models. Physical control unavailable.

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

Without custom task assignments, statements outside declarations execute first; named programs then execute once in source order on every scan. Later assignments to the same global output determine its final value for that scan. Programs may call declared scalar functions; they are not themselves callable as functions.

Declare BOOL, INT, REAL or TIME locals inside `VAR ... END_VAR`, using `Name : Type;`. Locals persist across scans, are separate between programs and shadow equally named global tags within their program. Changing a program's local declarations reinitializes that program's locals; renaming or removing a program drops its old state after the next scan.

**Reset**, opening another project, and browser reload start execution state again; normal project saving stores source, not live local values. Trace snapshots preserve local state for replay and restoration. Keep global tag names distinct from program/function names and from qualified private names such as `CounterStage.Cycles`.

This subset supports at most 32 named ST programs with 128 local declarations each, including function-block instances. Program headers must be on their own line and end with `END_PROGRAM`; initializers, program input/output parameter blocks, event/interrupt tasks and LD/FBD/SFC program POUs are not implemented. It is not complete IEC configuration or vendor interchange support.

### Scheduling named ST programs

**What you'll see:** **Project → Cyclic ST tasks** edits periods, priorities, enabled state and program execution order. The settings apply while the ST editor is selected; other editor modes keep their existing scan behavior.

1. Use the CounterStage/Indicate example above. In **Project → Project task and preferences**, set **Task cycle (ms)** to 100 and select **Done**.
2. Open **Project → Cyclic ST tasks**. Change the default row to name `Counter`, period 100, priority 0, and programs `CounterStage`.
3. Select **Add task**. Enter name `Indicator`, period 200, priority 1, and programs `Indicate`; leave both tasks **Enabled**.
4. Select **Save tasks**, then **Reset**, then **Step** four times. CountView reaches 4; Complete stays false at step 3 and becomes true at step 4 because Indicate runs every 200 simulated milliseconds.
5. Use **Record** and **Trace** to inspect **Task timing** and restore a recorded scan. Select **Use default task** in the task editor to return all named programs to once-per-base-scan execution; locals remain until Reset.

Tasks release at their period boundaries after time zero; the base scan holds one sampled input image for releases within that interval. Releases run in chronological order; simultaneous releases use lower priority numbers first, then task-row order. Each task runs its comma-separated program list in that order; statements outside PROGRAM blocks still run once per base scan.

Every declared program must belong to exactly one task, including programs assigned to disabled tasks. Disabling stops that task's updates and holds its outputs; other running code may still write those outputs. A configuration change restarts task timing while preserving program locals; Reset clears the clock, outputs and locals.

Limits are 16 tasks, periods of 1–60000 whole milliseconds, priorities 0–31 and 1024 releases/program activations per base scan. Invalid assignments or an excessive release count produce a diagnostic and preserve previous outputs, local state and task clock; reduce the base cycle or increase periods before retrying. This is deterministic, non-preemptive simulation scheduling, not real-time hardware or interrupt execution.

Changes stay in the editor draft until **Save tasks**; closing the window discards that draft. Saved assignments travel with project JSON; malformed task data are rejected on import, while unresolved program names remain editable and appear in Diagnostics. Changing task configuration or the base cycle invalidates an older trace.

### Reusable ST scalar functions

**What you'll see:** The existing ST editor accepts function declarations and calls in the same source. Functions have positional inputs passed by value, private local variables initialized on every call, and a BOOL, INT, REAL, or TIME result.

1. In a project copy, choose **Project → Cyclic ST tasks → Use default task**. In **Project → Tags and I/O**, add `Raw` as a REAL input and `Result` as a REAL output.
2. Choose **Programs → Functions**, then **Open ST editor**, and enter this source:

```iecst
FUNCTION Clamp01 : REAL
VAR_INPUT
 X : REAL;
END_VAR
IF X < 0 THEN Clamp01 := 0;
ELSIF X > 1 THEN Clamp01 := 1;
ELSE Clamp01 := X;
END_IF;
END_FUNCTION
Result := Clamp01(Raw);
```

3. Select **Compile**, then **Reset**. In I/O, set Raw to -2, 0.4, then 3 and select **Step** after each change; Result becomes 0, 0.4, then 1.
4. Save normally; declarations remain part of the project's ST source and JSON export.

**Programs → Functions** lists declared signatures, local-variable counts and source lines, with compile errors in an expandable section. Select **Edit source** beside a function to focus its declaration in ST; declarations remain editable in the existing editor. The panel lists source definitions even when another part of the program has errors. Command search includes Functions and all other registered menu actions.

Put each `FUNCTION Name : Type` header on its own line and close it with `END_FUNCTION`. Declare inputs in `VAR_INPUT ... END_VAR` and locals in `VAR ... END_VAR`, using `Name : Type;`; assign the result to the function's own name. Calls and declarations ignore letter case; function names must differ from global tag names.

Functions can call other declared functions, including ones below them, but cannot access global tags directly. Inputs are read-only copies and locals/results start at false or zero on each call; there is no retained instance state. Global tag renaming skips function definitions, so equally named private variables remain unchanged.

Limits are 32 functions, 16 inputs and 128 locals per function, a call depth of 32 and 10,000 calls per scan. Recursive calls, unknown functions, wrong argument counts and duplicate names are rejected; runtime faults preserve the affected output and appear in Diagnostics. Named arguments to scalar functions, initializers, arrays, VAR_IN_OUT and complete POU/task organization remain unsupported. Stateful blocks use separate instance calls described below.

### Stateful ST function blocks

**What you'll see:** **Programs → Function blocks** lists block types, their inputs and outputs, and source lines. **ST programs** lists the instances declared in each program. Unlike scalar functions, each instance keeps its own input, output and local values between calls.

1. In a project copy, choose **Project → Cyclic ST tasks → Use default task**. In **Project → Tags and I/O**, add BOOL inputs `Start` and `Stop` and a BOOL output `Motor`.
2. Choose **Programs → Function blocks**, then **Open ST editor**, and enter:

```iecst
FUNCTION_BLOCK MemoryLatch
VAR_INPUT
 Set : BOOL;
 Clear : BOOL;
END_VAR
VAR_OUTPUT
 Q : BOOL;
END_VAR
IF Clear THEN Q := FALSE;
ELSIF Set THEN Q := TRUE;
END_IF;
END_FUNCTION_BLOCK
PROGRAM Control
VAR
 Memory : MemoryLatch;
END_VAR
Memory(Set := Start, Clear := Stop);
Motor := Memory.Q;
END_PROGRAM
```

3. Select **Compile**, then **Reset**. In I/O, turn Start on and select **Step**; Motor turns on.
4. Turn Start off and step; Motor stays on. Turn Stop on and step; Motor turns off even if Start is on.
5. Select **Record**, run a few steps, and open **Trace**. Inspect the instance under **Program locals**, or choose **Restore selected scan** to resume from recorded instance state.

Define each block with `FUNCTION_BLOCK Name` on its own line and close it with `END_FUNCTION_BLOCK`. Declare BOOL, INT, REAL or TIME fields in `VAR_INPUT`, `VAR_OUTPUT` and private `VAR` sections. Inside a PROGRAM's `VAR` section, declare an instance with `Instance : BlockType;` and call it as a statement with named inputs.

Use `Instance.Input := value;` to set an input before a call, or supply it as `Instance(Input := value);`. Omitted inputs retain their previous values; `Instance();` uses those values. Inputs are read-only inside the block, outputs are read-only outside, and private locals cannot be accessed by the caller.

Each successful call commits the instance's state and publishes its outputs for later statements. A failed call preserves its previous state and reports the source error; exceeding the shared 10,000-call or 32-depth limit preserves the entire scan's previous outputs and state. Skipping a call holds its state, and a block on a cyclic task runs only when its program runs.

The subset allows 32 block types and 64 instances, with up to 16 inputs, 16 outputs and 128 total scalar fields per type. Reset or a declaration-layout change reinitializes the affected program state; project files store source, while trace snapshots store runtime state. Nested instances, `VAR_IN_OUT`, output arrows, initializers, arrays, built-in ST timer blocks and cross-language instances are not implemented.

FBD blocks execute in dependency order. Add Boolean blocks (AND/OR accept up to eight inputs; NAND/NOR/XOR/XNOR have two), TON/TOF/TP/RTO, CTU/CTD, R_TRIG/F_TRIG, arithmetic (ADD, SUB, MUL, DIV), or comparisons (GT, LT, EQ); enter comma-separated tag names for inputs and an output tag. Arithmetic and comparison inputs must use numeric tags. Counter and RTO blocks accept a second reset input. ST supports semicolon-terminated assignments across lines or on the same line, BOOL logic, numeric literals, `+`, `-`, `*`, `/`, comparisons, and parentheses; numeric assignments use the declared INT, REAL, or TIME tag type. Division by zero appears as a runtime diagnostic. The supported local subset does not implement multiple LD/FBD/SFC programs, nested block instances, arrays, or the full IEC language. SFC steps list active output tags; transitions use an input tag with NO or NC behavior.

## Simulate

Open the **I/O** panel to change simulated digital switches and numeric analog inputs, then view digital lamps and numeric outputs. Numeric inputs are available to FBD arithmetic and comparison blocks. Open **Watch** to monitor live digital values or force a simulated input on/off for this session. **Faults** inject session-only stuck-high/stuck-low faults on digital inputs and outputs, or numeric offsets on analog inputs and outputs. **Scenario** runs up to 1,000 validated JSON scan frames with optional expected-output checks in the local simulator. Trace recording stores active faults and replays them with the scan history. Tap the ○ control on an LD rung to set a breakpoint; Run pauses before that rung, then the next Run or Step passes it once. **Run** scans repeatedly, **Pause** holds the current state, **Step** performs one scan, and **Reset** clears timers, output state, and forced inputs. **Events** shows recent session scans, scan duration, breakpoints, forced values, and ST compile errors. **Record** captures scan inputs and full runtime snapshots in memory; **Replay** resets the simulator and repeats the input sequence against the same program; **Trace** compares adjacent historical states, restores a selected scan for inspection or continuation, and exports JSON. Mark historical scans as breakpoints to pause replay at those positions; markers shift with the bounded history window. History is limited to the latest 5,000 scans and remains in memory for this session. Editing the program invalidates replay for that trace. On the Ladder canvas, hold Space and drag (or use the middle mouse button) to pan; on touch, drag a blank canvas area. Each project saves its pan and zoom position. Use the clickable minimap to jump to a network; open Logic outline for keyboard/screen-reader network, contact, and output navigation. Arrow keys move through outline items. Green contacts and outputs indicate energized logic. Timer presets and task cycle settings are measured in simulated milliseconds.

The Example browser contains 1,000 examples across six categories. Each example provides a description, **How to test** steps, localized notes, tags, I/O mapping, expected behavior, fault notes, and executable test cases. The Bot can search for examples by scenario and offer a **Load** action. The Counters and sequencers category exercises CTU pulses, held inputs, preset/reset behavior, and a two-phase SET/RESET sequence with repeatable multi-scan scenarios. **Export test report CSV** saves the pass/fail results for all example scenarios with expected and actual values and fault explanations. Loading an example replaces the open project; export or duplicate first if you want to preserve it under a separate name.

## HMI screen

For the thermal process model, choose a heater input and an optional cooler input. Set heater and cooler rates; passive temperature loss moves the value toward ambient when both inputs are off. If both are on, the configured rates combine. These controls are educational model parameters, not validated operating ranges.

Choose **HMI** beside the logic tab. Click **Switch**, **Lamp**, **Value**, or **Trend** in the left contextual toolbox, or drag a button onto the canvas, to add a tag-bound widget to the active screen. Select a widget title to edit its label and tag in the right **Properties** inspector. Move or delete the selected widget there, or drag it by its title. HMI widget states and screen-reader labels follow the selected interface language. **Processes** adds tank, conveyor, motor inertia, thermal, pump-curve, and PID educational models; each model writes a numeric value to its output tag after each scan. The live 2D process mimic binds each drawn element to that tag and shows its current value. Select BOOL run inputs for enabled models and a numeric process-variable tag for PID. Tank supports an optional digital drain input. Numeric values work in basic FBD and ST arithmetic/comparison expressions and HMI displays; LD and SFC still evaluate Boolean logic only. ST supports semicolon-terminated assignments across lines or on the same line, BOOL operators, numeric literals, arithmetic, and numeric comparisons; it does not yet support multiple LD/FBD/SFC programs, nested block instances, arrays, or the full IEC language. Create or manage BOOL alarms or numeric high/low threshold alarms from the toolbar; alarm thresholds require numeric tags, finite numeric limits, and supported high/low comparisons; invalid readings do not trigger matches. For numeric alarms, Hysteresis is a non-negative clearing margin (default 0). A high alarm at 75 with hysteresis 5 raises at 75 and clears at 70; a low alarm at 10 with hysteresis 2 clears at 12. Values inside that band retain the active state, preventing repeated events near the threshold. This does not filter invalid sensor readings or provide a safety function. Active alarms support acknowledgement, shelving, suppression, event history, and JSON export. In **Recipes**, enter **Recipe name** and select **Save current inputs as recipe** to save BOOL and numeric inputs; saving the same name creates a new version. The screen, alarms, recipes, and process models save with the project. The Tags & I/O panel can print a generic wiring-reference worksheet from configured I/O addresses; it leaves field terminals and wire numbers for the verified hardware design. Trend values stay in session memory up to the selected limit and **Export trend CSV** downloads branded timestamps and values. The buffer resets on reload; it is not durable historian storage. The process view remains a schematic educational simulation with no validated engineering ranges, 3D geometry, or physical hardware.

Open **Operations** to see session-only simulated runtime for Boolean outputs. Enter a load in kW for each output and a tariff per kWh to estimate average power, energy, and cost; cost uses the same currency unit as the tariff, and these values are assumptions, not meter readings. An optional duty-cycle threshold flags outputs for review. Runtime resets when you switch projects or reload; export the branded CSV to keep the current estimate.

## Languages and offline use

The language button cycles English, German, Yoruba, and Nigerian Pidgin. Project names and tags remain project data when the interface language changes. In Project properties, set a separate project language; generated I/O, wiring, BOM, scenario, trend, and operations reports use that language while the controls remain in the selected interface language. Open **Settings** to enable or disable local autosave, set simulation speed and trend retention (60, 300, or 1,000 samples), increase contrast, or switch to a simple sans-serif font. With autosave disabled, use Save to write changes to local storage. Serve the app over localhost or HTTPS to install it and enable offline shell caching. Browser storage is local to that browser profile.

## Adigun BOT

Open **Adigun BOT** from the floating button or **Tools**. The Bot window stays below the top menus. The offline helper can explain curated electrical and PLC lessons and create limited drafts for FBD gates, TON delayed lamps, or LD start/stop circuits. It shows a plan and assumptions before import or save; guests may import but cannot download or cloud-save. Optional speech input depends on browser support. Hosted answers are optional and require a signed-in account; read [Help → Hosted AI privacy](HELP.md#hosted-ai-privacy) before sending a request. The Bot does not build schematic wiring, edit arbitrary existing projects, or approve safety designs; see [BOT.md](BOT.md) for supported prompts and limits.

## External resources

Choose **Help → External resources** to review the supplied source repository or add a URL with English, German, Yoruba, and Nigerian Pidgin descriptions. New URLs start unapproved; approval applies to that exact HTTPS URL. The registry and its access log are stored in this browser only and do not create organization-wide admin controls. **Check link** uses an HTTPS HEAD request when the remote site allows it; network or CORS blocks are reported as unverified. Opening a resource requires confirmation, and **Download access audit** exports the local open history.

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

## Electrical engineering workspace — docked tools and properties

Select **Electrical schematic** in the **Project Explorer** or **Components / Schematic** above the editor to open the schematic workspace. Select **HMI screens** in the **Project Explorer** or **HMI** above the editor to open the HMI workspace; **Program Main** returns to the logic editor. The left **Component tools** panel becomes active and contains the **existing functional component picker, Place component, Connect wire, Rotate, Duplicate, Delete**. Select a model and use **Place component** to add it; select **Connect wire** and then two terminal markers to connect them. **Validate** and **Simulate** remain in the canvas action row. The **Simulated I/O / faults** disclosure links to the existing manual input-state section and contains the existing fault-injection command. Its **Library & workflows** section links back to the generic component picker, retains the **519-entry manufacturer references** (information only), and exposes the existing **Faults** command; the fault action returns to the simulation toolbar in other editors. The previously duplicate electrical properties panel is now docked inside the existing right **Properties** inspector; it still includes component fields, I/O mapping, manual simulated inputs, wire connections, validation and status. Use **Panel layout** to open or close side panels. On narrow screens the toolbox/inspector are available through the existing panel drawers. Menu-based I/O, simulation and other controls remain available. This is an interface rearrangement; it changes neither the PLC engine nor electrical simulation and is not a physical wiring design.

### Status strip

The bottom bar shows the editor-ready marker, simulated PLC state, scan time, cycle count and task cycle. **Local autosave active** reflects the autosave setting; when autosave is disabled, it reads **Autosave off**. In Electrical schematic, the status strip also shows **Grid: 20 px** and **Educational simulation · no hardware connected**. This is a simulation boundary, not a hardware connection.

### Wide-screen command relocation

On screens at least 1200 pixels wide, the **existing** Save, Undo, Redo and Run buttons move from the long command toolbar into unused header space, and the remaining ribbon is hidden to give the editor more vertical room. Its file, edit, view, simulation, trace, and other actions remain available from the application menus and Ctrl/⌘+K command search. Simulation sound is under **Online → Toggle simulation sound**. The existing command-search button moves to the application-menu row and appears as **Search all commands**; selecting it opens the existing searchable command palette. On narrower screens these same buttons return to their original locations; no duplicate controls are created, and original functions remain unchanged.

### Contextual editor tools

The left project panel now shows the existing actions for the active editor: Add contact/Rung for LD, Add block for FBD, Compile for ST, Add step/Transition for SFC, and Switch/Lamp/Value/Trend for HMI. The original button elements and actions are reused. HMI screen selection, naming, alarms, processes, and history tools remain in the HMI editor row.

The Components canvas places its circuit title and **Select**, **Connect terminals**, **Validate**, and **Simulate** actions immediately above the drawing. Use the left toolbox for model search, placement, move, rotation, duplication, deletion, and manufacturer references. Validation and simulation stay in the canvas action row; the left toolbox contains component-editing commands.

The schematic's visible legend identifies terminal markers, connected signals, and the left toolbox location for editing wires. It does not validate real-world wiring. The inspector identifies the selected reference and catalog category above the editable component fields.

The right inspector's **Issues** tab lists current validation findings for the active workspace. In Components it uses the electrical diagram validator; other editors use project validation. **Properties** returns to the selected component or instruction. **Watch** retains the existing simulated-value and force controls. Selected electrical components also expose their existing rotate, duplicate, and delete actions in the inspector. Terminal connections and validation diagnostics are grouped in expandable sections; opening a section is preserved while the inspector refreshes.
