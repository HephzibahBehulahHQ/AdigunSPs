# Automation component bank inventory

The [JSON](inventory.json) and [CSV](inventory.csv) exports capture the starting inventory from the reference catalog and the editable schematic library. Run `node scripts/export-component-bank.js` after changing either library. CI checks that the exports match the definitions.

Production smoke compares both deployed files with the release checkout on GitHub Pages and the public AdigunSPs domain.

| Inventory | Starting count |
| --- | ---: |
| Manufacturer references | 519 |
| Hardware references in the manufacturer catalog | 518 |
| Vendor software references | 1 |
| Distinct hardware order codes across both libraries | 532 |
| Placeable schematic models and educational simulation profiles | 61 |
| Placeable models with a linked manufacturer source | 16 |
| Explicit mounting accessory entries | 3 |
| Independently verified terminal maps across all entries | Pending audit |

The distinct hardware total excludes the software listing and two model designations that need order-code verification. Generic schematic models also stay outside this total. `source-linked-model` means that the definition includes a manufacturer source. A terminal map marked `not-captured` has no connector schedule in the reference catalog. Blank CSV cells and JSON `null` values indicate missing or inapplicable data.

The JSON export lists ladder contact, coil, timer, counter, and MCR options alongside the 25 validated FBD block types and six process model types under `softwareAndProcess`. It also contains Structured Text examples for assignment, conditional branches, arithmetic, and boolean expressions. The exporter compiles and runs those examples, then runs a four-scan SFC example covering initial-step selection, normally open and normally closed transitions, and step actions. A three-scan ladder example verifies CTU accumulation, RES reset, and SCALE conversion, clamping, and disable behavior. The exporter uses the same ladder option lists as project validation. The hardware CSV contains manufacturer references and schematic models. A three-scan Structured Text example verifies a PROGRAM, a scalar FUNCTION, and two independent instances of a stateful FUNCTION_BLOCK.

Use the 10,000 distinct hardware target as an acquisition plan. Before counting a new part, record its exact order code and official evidence. Add a native schematic model only once the terminal topology is documented. Verify wiring, supported behavior, and project recovery before marking a simulation profile usable.

The JSON field `hardwareByCatalogCategory` counts hardware references, references linked to an editable model for the exact manufacturer and order code, and those links with a verified terminal map. These are the catalog's categories. They include combined categories such as analog I/O, with acquisition targets for inputs and outputs tracked individually.

## First verified addition

The Phoenix Contact PT 2,5-TWIN (`3209549`) adds one hardware order code and one editable schematic model. Search for the order code in the component picker. Its three conductor connections share a single ideal node. The three stable editor port IDs identify positions in the model. The manufacturer's diagram shows the topology without numbered terminals. [Manufacturer data sheet, pages 2 and 7](https://www.phoenixcontact.com/en-us/products/multi-conductor-terminal-block-pt-25-twin-3209549?type=pdf)

Current totals are 11391 distinct hardware order codes, 11381 manufacturer catalog records, and 88 placeable schematic models. The export identifies twenty-two verified terminal maps. They cover the X80 power connection across all four Siemens Unified Basic panel models, the PLC-RSC-24DC/21 changeover relay, the PT 2,5-TWIN, PT 2,5-QUATTRO and PT 4-HESI, the SM 1221 DI 16, both SM 1222 output variants, both SM 1223 8 DI / 8 DQ output variants, the SM 1231 analog input and SM 1232 analog output modules, the SM 1233 mixed analog module, all three modeled 1212C CPU variants, and all three modeled 1214C CPU variants. The relay CPU exports its external 1L common pins. The transistor CPU exports separate 2L+ and 2M terminals for its output supply.

The industrial component test saves and reopens a simulated Siemens expansion circuit, then traces a pushbutton through SM 1221 pin X11-3 and address I1.0, a two-scan TON, SM 1222 address Q1.0 and pin X11-5, and the lamp. It verifies that opening the external load feed drops the lamp while the PLC command and its HMI alarm remain active.

The 1214C transistor circuit test reopens the project, then checks the path from a pushbutton at I1.5 through ladder logic and Q1.1 to the PLC-RSC relay coil and lamp. It verifies that opening the coil return drops the load while the PLC command stays active.

The browser acceptance test imports a wired SM 1231 current loop, steps the PLC, and exports the trace. The transmitter enters 12 mA, the module supplies 13824 raw counts, and the LD SCALE instruction converts the input to 50 bar.
