# AdigunSPs component and instruction library

The **Components** tab is an editable schematic workspace with terminal-level wires and Boolean/scalar simulation. Its devices are generic educational simulation models. They are not vendor-certified models, do not calculate electrical power/current or motor dynamics, and must not be used as a wiring or safety design. Manufacturer references in the product catalog are research entries, not selectable runtime devices.

## Schematic components

| Component | Function in this simulator | Example |
| --- | --- | --- |
| 24 V DC supply | Simulated positive and negative rails | Power a pushbutton and lamp circuit |
| Single-phase supply | L, N, and PE terminals; connectivity only | Draw a single-phase load path |
| Three-phase supply | L1/L2/L3/PE connectivity | Draw a three-phase motor starter |
| Generic PLC, 4 DI / 4 DO | Simulated Boolean input/output tag mapping | Map Start to I0.0 and Motor to Q0.0 |
| 4-channel digital input module | Four configurable Boolean inputs | Connect four simulated sensors |
| 4-channel digital output module | Four configurable Boolean outputs | Map four output tags |
| 2-channel analog input module | Two scalar signal channels | Read a simulated level signal |
| 2-channel analog output module | Two scalar output channels | Send a simulated setpoint |
| NO / NC pushbutton | Momentary simulated Boolean contact | Start or stop a logic path |
| NO / NC maintained toggle | Editable held-open/held-closed contact | Select a simulated operating mode |
| NC emergency stop | Latching simulated contact that needs reset | Interrupt a simulated control path |
| Two-position selector | SPDT terminal model: position I joins 11–12; position II joins 11–14 | Route a control supply to Hand or Auto logic |
| NO / NC limit switch | Simulated end-position contact | Detect a travel endpoint |
| NO / NC proximity sensor | Simulated object-present contact | Detect a nearby target |
| NO / NC photoelectric sensor | Simulated beam/object contact | Count items on a conveyor |
| NO pressure switch | Simulated pressure threshold contact | Enable a pump sequence |
| NO / NC temperature switch | Simulated temperature threshold contact | Switch a cooling permissive |
| NO float switch | Simulated level contact | Detect a high tank level |
| Analog signal source / indicator | Adjustable scalar input / displayed scalar value | Simulate and observe a tank level |
| Three-pole contactor | A1/A2 coil state controls linked 3-pole main contacts | Energize a starter path through the coil |
| Relay coil | A1/A2 simulated coil associated by reference with auxiliary contacts | Drive an auxiliary control contact |
| NO / NC auxiliary contact | Follows its paired contactor/relay coil state | Seal in a starter command |
| NC overload relay | Simulated normally closed protection contact | Interrupt a command when tripped |
| Circuit breaker / fuse | Editable closed/open or tripped series element | Interrupt a simulated supply path |
| Pilot lamp / buzzer | Load energized by a complete simulated path | Indicate a run or alarm state |
| Solenoid valve | Simulated coil/load state | Operate a valve output |
| Heater element | Resistive load presence/state only | Show an energized heater circuit |
| Single-/three-phase motor | Simulated off/on state; no speed, torque, current, or thermal model | Show a motor starter output state |
| Terminal block | Feed-through terminal connection | Join a field wire to a control wire |
| DC power / neutral rail | Explicit branch point for compatible simulated nets | Distribute a supply or return |
| Junction | Explicit wire split point | Branch a control signal |
| Protective earth / ground common | Diagram connection node; no earth-fault analysis | Show the PE/common reference |

References and component labels are unique within a project. Ratings shown for generic models are editable teaching values, not verified hardware specifications. Use the separate manufacturer reference catalog to inspect source-backed products; those references do not run in the simulator.

## PLC instructions

LD supports NO/NC and rising/falling edge contacts, series and parallel branches, normal/set/reset output coils, TON, TOF, TP, retentive RTO with a reset tag, CTU, CTD, RES, one non-nested MCR start/end section, count values, and scaling. Choose the MCR instruction from a rung's output-coil properties; its Start rung condition enables the following section through End. FBD supports two- through eight-input AND/OR, two-input NAND/NOR/XOR/XNOR, NOT, TON/TOF/TP/RTO, CTU/CTD, edge triggers, arithmetic, comparisons, and SCALE. ST and SFC support only their implemented subsets; run validation before using conversions.

RTO retains elapsed milliseconds while disabled and clears from its configured reset input. CTU counts rising edges toward its preset; CTD starts at its preset and counts rising edges to zero. The independent counter reset input clears CTU to zero or restores CTD to its preset. RES clears CTU to zero or restores CTD to its preset when its rung is energized. Nested MCR zones, named electrical nets, wire NO/NC flags, linked latch/unlatch pairs, and arbitrary FBD-to-schematic device placement are not implemented.

## How to build a first start/stop motor example

**What you'll see:** A Boolean ladder program whose Motor output also energizes a connected simulated motor model.

1. Select **New** so the ladder starts empty.
2. In **Tags and I/O**, add BOOL inputs `Start` and `Stop`, and BOOL output `Motor`.
3. Add a rung. Set its first branch to `Start` NO followed by `Stop` NC. Add a parallel branch with `Motor` NO followed by `Stop` NC, then set the output coil to `Motor`.
4. Open **Components** and place the generic PLC, a contactor, and a three-phase motor. Add supply/rail components and draw the simulated power path; associate the motor load with the PLC output tag `Motor` using the component properties.
5. Select **Run**. Set Start true and Stop false in simulated inputs; the Motor output and associated simulated contactor/motor state should turn on. Set Stop true; the output should turn off.

This tests Boolean control and connectivity in the educational simulator only. It does not prove a real motor starter design or safety function.
