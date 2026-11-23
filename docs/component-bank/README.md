# Automation component bank inventory

The [JSON](inventory.json) and [CSV](inventory.csv) exports capture the starting inventory from the reference catalog and the editable schematic library. Run `node scripts/export-component-bank.js` after changing either library. CI checks that the exports match the definitions.

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

PLC instructions and process models remain separate from the hardware inventory. FBD currently validates 25 block types. The process simulator provides six model types. LD, ST, and SFC instruction coverage will be tracked by editor and execution support so equivalent instructions are distinguishable from physical hardware.

Use the 10,000 distinct hardware target as an acquisition plan. Before counting a new part, record its exact order code and official evidence. Add a native schematic model only once the terminal topology is documented. Verify wiring, supported behavior, and project recovery before marking a simulation profile usable.

## First verified addition

The Phoenix Contact PT 2,5-TWIN (`3209549`) adds one hardware order code and one editable schematic model. Search for the order code in the component picker. Its three conductor connections share a single ideal node. The three stable editor port IDs identify positions in the model. The manufacturer's diagram shows the topology without numbered terminals. [Manufacturer data sheet, pages 2 and 7](https://www.phoenixcontact.com/en-us/products/multi-conductor-terminal-block-pt-25-twin-3209549?type=pdf)

Current totals are 534 distinct hardware order codes, 521 manufacturer catalog records, and 63 placeable schematic models. The Siemens 1212C DC/DC/RLY model adds six ideal relay outputs on the external 1L common and eight mapped digital inputs. The terminal-topology audit currently covers the PT 2,5-TWIN. Ports from existing source-linked models remain in the export with their stated evidence and limitations.
