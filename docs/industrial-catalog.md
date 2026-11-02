# Industrial product catalog

## Verified coverage

The reference catalog contains **295 unique manufacturer product variants**: 261 Siemens, 28 OMRON E3Z photoelectric sensor variants, three Schneider Electric products, and three Phoenix Contact products. Siemens references include 163 rows from the official [SIMATIC S7-1200 product overview](https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1200&lang=en), exported 2025-10-02, and 75 rows from Siemens' [SIMATIC S7-1500 product overview](https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1500&lang=en), exported 2024-09-29. Those overview-only rows carry the manufacturer-listed name and exact order code; they do not infer ratings or pin layouts and do not establish that a product is currently orderable. Every entry has a manufacturer identifier, product family, attributes, an HTTPS source, retrieval date, and explicit simulation status and limitations. The in-app catalog supports text search and shows source links. Product references remain read-only and cannot be placed as supported simulated devices.

The S7-1500 references cover CPU, digital I/O, analog I/O, communications, technology modules, and power supplies using the official 2024 export. Existing S7-1200 module, sensor, Schneider, and Phoenix product citations remain listed below. Sensor model, distance, connection, pinout, supply, and output-current data come from the [OMRON E3Z datasheet](https://assets.omron.eu/downloads/latest/datasheet/en/e3z_compact_photoelectric_sensor_with_built-in-amplifier_datasheet_en.pdf?v=7). Other sources are the [Schneider TM221CE24R page](https://www.se.com/us/en/product/TM221CE24R/logic-controller-modicon-m221-24-io-relay-ethernet/), [LC1D09B7 product page](https://www.se.com/us/en/product/LC1D09B7/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vac-50-60hz-coil-open-style/), [LRD12 datasheet](https://iportal.se.com/Contents/docs/SQD-LRD12_DATA%20SHEET.PDF), [Phoenix Contact QUINT4-PS product data](https://www.phoenixcontact.com/en-us/products/power-supply-quint4-ps1ac24dc5-2904600?type=pdf), [PLC-RSC-24DC/21](https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf), and [PLC-RSC-24DC/21-21/AEX](https://www.phoenixcontact.com/en-us/products/relay-module-plc-rsc-24dc-21-21-aex-5603678).

## Simulation boundary

The catalog is separate from the 45 generic educational electrical simulation definitions. Catalog rows marked `reference-only` do not claim terminal-level compatibility or runtime behavior. `LRD12` is `contact-only`: its normally closed contact can be represented with the generic overload symbol, but thermal memory, motor-current measurement, and trip curves are not simulated. The electrical component tests cover supported generic models and PLC-to-load integration.

## Requirement gap

The 500-entry target is **not met**: 295 source-backed references are recorded (205 short). The S7-1500 rows are grounded in Siemens' 2024 export; the export does not confirm current availability. We did not pad the catalog with inferred suffixes, family names presented as distinct orderable products, or copied third-party lists. Further expansion needs manufacturer-maintained SKU exports or product pages with exact identifiers. Rows remain `reference-only` until an electrical model is separately implemented and tested.

## Focused checks

Run `npm run test:industrial-catalog` for uniqueness, minimum provenance, search/filter/paging, sourced product distinctions, and explicit simulation-boundary checks. `npm test` also runs this focused suite and retains all generic component and example-project integration tests.
