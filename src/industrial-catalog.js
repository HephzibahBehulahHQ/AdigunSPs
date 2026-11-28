import { finderCatalogGroups } from "./finder-catalog-data.js";
import { doepkeCatalogGroups } from "./doepke-catalog-data.js";

const capturedOn = "2026-10-30";
const siemensCatalog = "https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1200&lang=en";
const siemens1500Catalog = "https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1500&lang=en";
const omronDatasheet = "https://assets.omron.eu/downloads/latest/datasheet/en/e3z_compact_photoelectric_sensor_with_built-in_amplifier_datasheet_en.pdf?v=7";

const siemensCpus = [
  ["6ES7211-1AE40-0XB0","CPU 1211C","DC/DC/DC","6 DI, 4 DO, 2 AI","SIMATIC S7-1200 CPU 1211C DC/DC/DC"],
  ["6ES7212-1AE40-0XB0","CPU 1212C","DC/DC/DC","8 DI, 6 DO, 2 AI","SIMATIC S7-1200 CPU 1212C DC/DC/DC"],
  ["6ES7212-1BE40-0XB0","CPU 1212C","AC/DC/relay","8 DI, 6 DO, 2 AI","SIMATIC S7-1200 CPU 1212C AC/DC/Relay"],
  ["6ES7212-1HE40-0XB0","CPU 1212C","DC/DC/relay","8 DI, 6 DO, 2 AI","SIMATIC S7-1200 CPU 1212C DC/DC/Relay"],
  ["6ES7212-1AF40-0XB0","CPU 1212FC","DC/DC/DC","8 DI, 6 DO, 2 AI","SIMATIC S7-1200 CPU 1212FC DC/DC/DC"],
  ["6ES7212-1HF40-0XB0","CPU 1212FC","DC/DC/relay","8 DI, 6 DO, 2 AI","SIMATIC S7-1200 CPU 1212FC DC/DC/Relay"],
  ["6ES7214-1AG40-0XB0","CPU 1214C","DC/DC/DC","14 DI, 10 DO, 2 AI","SIMATIC S7-1200 CPU 1214C DC/DC/DC"],
  ["6ES7214-1BG40-0XB0","CPU 1214C","AC/DC/relay","14 DI, 10 DO, 2 AI","SIMATIC S7-1200 CPU 1214C AC/DC/Relay"],
  ["6ES7214-1HG40-0XB0","CPU 1214C","DC/DC/relay","14 DI, 10 DO, 2 AI","SIMATIC S7-1200 CPU 1214C DC/DC/Relay"],
  ["6ES7214-1AF40-0XB0","CPU 1214FC","DC/DC/DC","14 DI, 10 DO, 2 AI","SIMATIC S7-1200 CPU 1214FC DC/DC/DC"],
  ["6ES7214-1HF40-0XB0","CPU 1214FC","DC/DC/relay","14 DI, 10 DO, 2 AI","SIMATIC S7-1200 CPU 1214FC DC/DC/Relay"],
  ["6ES7215-1AG40-0XB0","CPU 1215C","DC/DC/DC","14 DI, 10 DO, 2 AI, 2 AO","SIMATIC S7-1200 CPU 1215C DC/DC/DC"],
  ["6ES7215-1HG40-0XB0","CPU 1215C","DC/DC/relay","14 DI, 10 DO, 2 AI, 2 AO","SIMATIC S7-1200 CPU 1215C DC/DC/Relay"],
  ["6ES7217-1AG40-0XB0","CPU 1217C","DC/DC/DC","14 DI, 10 DO, 2 AI, 2 AO","SIMATIC S7-1200 CPU 1217C DC/DC/DC"],
].map(([identifier,family,variant,io,description]) => ({
  manufacturer:"Siemens", identifier, family, category:"PLC controllers",
  attributes:{description,variant,onboardIo:io},
  source:{url:siemensCatalog,title:"SIMATIC S7-1200 product overview",retrievedOn:capturedOn},
  simulation:{status:"reference-only",model:null,limitations:"No Siemens CPU firmware, terminal-level wiring profile, electrical behavior, or device compatibility is implemented."},
}));

const siemensModules = [
  {identifier:"6ES7221-1BF32-0XB0",family:"SM 1221",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital input module",digitalInputs:8,inputVoltage:"24 V DC",inputType:"Sink/source"},url:"https://mall.industry.siemens.com/mall/en/gb/Catalog/Product/6ES72211BF320XB0",title:"SM 1221, 8 DI, 24 V DC"},
  {identifier:"6ES7221-1BH32-0XB0",family:"SM 1221",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital input module",digitalInputs:16,inputVoltage:"24 V DC",inputType:"Sink/source"},url:"https://mall.industry.siemens.com/mall/en/gb/Catalog/Product/6ES72211BH320XB0",title:"SM 1221, 16 DI, 24 V DC"},
  {identifier:"6ES7223-1BH32-0XB0",family:"SM 1223",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital input/output module",digitalInputs:8,digitalOutputs:8,inputVoltage:"24 V DC, sink/source",output:"24 V DC transistor, 0.5 A"},url:"https://mall.industry.siemens.com/mall/en/fr/Catalog/Product/6ES7223-1BH32-0XB0",title:"SM 1223, 8 DI / 8 DO"},
  {identifier:"6ES7223-1BL32-0XB0",family:"SM 1223",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital input/output module",digitalInputs:16,digitalOutputs:16,inputVoltage:"24 V DC, sink/source",output:"24 V DC transistor, 0.5 A"},url:"https://mall.industry.siemens.com/mall/en/de/Catalog/Product/6ES7223-1BL32-0XB0",title:"SM 1223, 16 DI / 16 DO"},
  {identifier:"6ES7222-1HF32-0XB0",family:"SM 1222",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital output module",digitalOutputs:8,outputType:"Relay"},url:"https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1200&lang=en",title:"SIMATIC S7-1200 product overview · SM 1222 8 DO relay"},
  {identifier:"6ES7222-1HH32-0XB0",family:"SM 1222",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital output module",digitalOutputs:16,outputType:"Relay"},url:"https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1200&lang=en",title:"SIMATIC S7-1200 product overview · SM 1222 16 DO relay"},
  {identifier:"6ES7222-1BF32-0XB0",family:"SM 1222",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital output module",digitalOutputs:8,output:"24 V DC transistor"},url:"https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1200&lang=en",title:"SIMATIC S7-1200 product overview · SM 1222 8 DO transistor"},
  {identifier:"6ES7222-1BH32-0XB0",family:"SM 1222",category:"Digital I/O modules",attributes:{description:"SIMATIC S7-1200 digital output module",digitalOutputs:16,output:"24 V DC transistor, 0.5 A"},url:"https://mall.industry.siemens.com/mall/en/riederpyown/Catalog/Product?SiepCountryCode=OE&mlfb=6ES7222-1BH32-0XB0",title:"SM 1222, 16 DO, 24 V DC transistor"},
].map(({url,title,...item})=>({
  manufacturer:"Siemens",...item,
  source:{url,title,retrievedOn:"2026-11-01"},
  simulation:{status:"reference-only",model:null,limitations:"No Siemens module terminal layout, configuration, compatibility, isolation, or electrical behavior is implemented; generic I/O simulation is separate."},
}));

const siemensPowerSupplies = [{
  manufacturer:"Siemens",identifier:"6EP1332-1SH71",family:"PM 1207",category:"Power supplies",
  attributes:{description:"SIMATIC S7-1200 PM 1207 stabilized power supply",input:"120/230 V AC",output:"24 V DC",ratedCurrent:"2.5 A"},
  source:{url:"https://mall.industry.siemens.com/mall/NO/NO/Catalog/Product/?mlfb=6EP1332-1SH71",title:"PM 1207 power supply product data",retrievedOn:"2026-11-01"},
  simulation:{status:"reference-only",model:null,limitations:"The educational 24 V source model does not represent this Siemens power supply, its input range, regulation, protection, or compatibility."},
}];

// Manufacturer overview rows below preserve only the official description and SKU.
// They are references, not claims of electrical characteristics or simulator support.
const siemensOverviewRows = [
  ["6ES7211-1BE40-0XB0","CPU 1211C","PLC controllers","CPU 1211C, AC/DC/Relay, 6DI/4DO/2AI"],
  ["6ES7211-1HE40-0XB0","CPU 1211C","PLC controllers","CPU 1211C, DC/DC/Relay, 6DI/4DO/2AI"],
  ["6AG1212-1AE40-4XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C DC/DC/DC"],
  ["6AG1212-1BE40-4XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C AC/DC/RLY"],
  ["6AG1212-1HE40-4XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C DC/DC/RLY"],
  ["6AG2212-1AE40-1XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C DC/DC/DC RAIL"],
  ["6AG1212-1AE40-2XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C DC/DC/DC"],
  ["6AG1212-1BE40-2XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C AC/DC/RLY"],
  ["6AG1212-1HE40-2XB0","CPU 1212C","PLC controllers","SIPLUS S7-1200 CPU 1212C DC/DC/RLY"],
  ["6AG1214-1AF40-5XB0","CPU 1214FC","PLC controllers","SIPLUS S7-1200 CPU 1214FC DC/DC/DC"],
  ["6AG1214-1HF40-5XB0","CPU 1214FC","PLC controllers","SIPLUS S7-1200 CPU 1214FC DC/DC/RLY"],
  ["6AG1214-1AG40-4XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/DC"],
  ["6AG1214-1AG40-5XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/DC"],
  ["6AG1214-1BG40-4XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C AC/DC/RLY"],
  ["6AG1214-1BG40-5XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C AC/DC/RLY"],
  ["6AG1214-1HG40-4XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/RLY"],
  ["6AG1214-1HG40-5XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/RLY"],
  ["6AG2214-1AG40-1XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/DC RAIL"],
  ["6AG1214-1AG40-2XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/DC"],
  ["6AG1214-1BG40-2XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C AC/DC/RLY"],
  ["6AG1214-1HG40-2XB0","CPU 1214C","PLC controllers","SIPLUS S7-1200 CPU 1214C DC/DC/RLY"],
  ["6ES7215-1BG40-0XB0","CPU 1215C","PLC controllers","CPU 1215C, AC/DC/RLY, 14DI/10DO/2AI/2AO"],
  ["6ES7215-1HF40-0XB0","CPU 1215FC","PLC controllers","CPU 1215 FC, DC/DC/RLY, 14DI/10DO/2AI/2AO"],
  ["6AG1215-1AF40-5XB0","CPU 1215FC","PLC controllers","SIPLUS S7-1200 CPU 1215FC DC/DC/DC"],
  ["6AG1215-1AG40-4XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C DC/DC/DC"],
  ["6AG1215-1AG40-5XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C DC/DC/DC"],
  ["6AG1215-1BG40-4XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C AC/DC/RLY"],
  ["6AG1215-1BG40-5XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C AC/DC/RLY"],
  ["6AG1215-1HG40-4XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C DC/DC/RLY"],
  ["6AG1215-1HG40-5XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C DC/DC/RLY"],
  ["6AG1215-1AG40-2XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C DC/DC/DC"],
  ["6AG1215-1BG40-2XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C AC/DC/RLY"],
  ["6AG1215-1HG40-2XB0","CPU 1215C","PLC controllers","SIPLUS S7-1200 CPU 1215C DC/DC/RLY"],
  ["6AG1217-1AG40-5XB0","CPU 1217C","PLC controllers","SIPLUS S7-1200 CPU 1217C DC/DC/DC"],
  ["6AG1217-1AG40-2XB0","CPU 1217C","PLC controllers","SIPLUS S7-1200 CPU 1217C DC/DC/DC"],
  ["6ES7221-3BD30-0XB0","SB 1221","Digital I/O modules","Signal Board SB 1221, 4 DI 24VDC 200KHz"],
  ["6ES7221-3AD30-0XB0","SB 1221","Digital I/O modules","Signal Board SB 1221, 4 DI 5VDC 200KHz"],
  ["6AG1221-3AD30-5XB0","SB 1221","Digital I/O modules","SIPLUS S7-1200 SB 1221 4DI 5VDC"],
  ["6AG1221-3BD30-5XB0","SB 1221","Digital I/O modules","SIPLUS S7-1200 SB 1221 4DI 24VDC"],
  ["6ES7222-1BD30-0XB0","SB 1222","Digital I/O modules","Signal Board SB1222, 4 DQ 24VDC 200KHz"],
  ["6ES7222-1AD30-0XB0","SB 1222","Digital I/O modules","Signal Board SB1222, 4 DQ 5VDC 200KHz"],
  ["6AG1222-1AD30-5XB0","SB 1222","Digital I/O modules","SIPLUS S7-1200 SB 1222 4DQ 5VDC"],
  ["6AG1222-1BD30-5XB0","SB 1222","Digital I/O modules","SIPLUS S7-1200 SB 1222 4DQ 24VDC"],
  ["6ES7223-0BD30-0XB0","SB 1223","Digital I/O modules","Signal Board SB 1223, 2 DI/2 DO"],
  ["6ES7223-3BD30-0XB0","SB 1223","Digital I/O modules","Signal Board SB 1223, 2DI/2DQ 24V 200KHz"],
  ["6ES7223-3AD30-0XB0","SB 1223","Digital I/O modules","Signal Board SB 1223, 2DI/2DQ 5V 200KHz"],
  ["6AG2223-0BD30-1XB0","SB 1223","Digital I/O modules","SIPLUS S7-1200 SB 1223 2DI/2DQ RAIL"],
  ["6AG1223-0BD30-4XB0","SB 1223","Digital I/O modules","SIPLUS S7-1200 SB 1223 2DI/2DQ 24VDC"],
  ["6AG1223-0BD30-5XB0","SB 1223","Digital I/O modules","SIPLUS S7-1200 SB 1223 2DI/2DQ 24VDC"],
  ["6AG1223-3AD30-5XB0","SB 1223","Digital I/O modules","SIPLUS S7-1200 SB 1223 2DI/2DQ 5VDC"],
  ["6AG1223-3BD30-5XB0","SB 1223","Digital I/O modules","SIPLUS S7-1200 SB 1223 2DI/2DQ, 24VDC"],
  ["6ES7231-4HA30-0XB0","SB 1231","Analog I/O modules","Signal Board SB 1231, 1 AI"],
  ["6ES7231-5PA30-0XB0","SB 1231","Analog I/O modules","Signal Board SB 1231 RTD"],
  ["6ES7231-5QA30-0XB0","SB 1231","Analog I/O modules","Signal Board SB 1231 TC, 1 AI"],
  ["6AG1231-5PA30-5XB0","SB 1231","Analog I/O modules","SIPLUS S7-1200 SB 1231 1AI RTD"],
  ["6ES7232-4HA30-0XB0","SB 1232","Analog I/O modules","Signal Board SB 1232, 1 AO"],
  ["6AG1232-4HA30-4XB0","SB 1232","Analog I/O modules","SIPLUS S7-1200 SB 1232 1AQ"],
  ["6AG1232-4HA30-5XB0","SB 1232","Analog I/O modules","SIPLUS S7-1200 SB 1232 1AQ"],
  ["6ES7241-1CH30-1XB0","CB 1241","Communications modules","Communication Board CB 1241, RS485"],
  ["6AG2241-1CH30-1XB0","CB 1241","Communications modules","SIPLUS S7-1200 CB 1241 RS485 T1 RAIL"],
  ["6AG1241-1CH30-5XB1","CB 1241","Communications modules","SIPLUS S7-1200 CB 1241 RS485"],
  ["6ES7297-0AX30-0XA0","BB 1297","Accessories","Battery Board BB 1297 for CPU 12xx"],
  ["6ES7222-1XF32-0XB0","SM 1222","Digital I/O modules","Digital Output SM 1222, 8 DO, Changeover"],
  ["6ES7222-1BH32-1XB0","SM 1222","Digital I/O modules","Digital Output SM 1222, 16 DO, 24V DC sink"],
  ["6AG1222-1BF32-4XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ"],
  ["6AG1222-1BH32-4XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 16DQ"],
  ["6AG1222-1HF32-4XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ RLY"],
  ["6AG1222-1HH32-4XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 16DQ RLY"],
  ["6AG1222-1XF32-4XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ RLY"],
  ["6AG2222-1HF32-1XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ RLY RAIL"],
  ["6AG1222-1BF32-2XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ"],
  ["6AG1222-1BH32-2XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 16DQ"],
  ["6AG1222-1HF32-2XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ RLY"],
  ["6AG1222-1HH32-2XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 16DQ RLY"],
  ["6AG1222-1XF32-2XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ RLY"],
  ["6AG2222-1BF32-1XB0","SM 1222","Digital I/O modules","SIPLUS S7-1200 SM 1222 8DQ RAIL"],
  ["6ES7223-1PH32-0XB0","SM 1223","Digital I/O modules","Digital I/O SM 1223, 8DI/8DO"],
  ["6ES7223-1PL32-0XB0","SM 1223","Digital I/O modules","Digital I/O SM 1223, 16DI/16DO"],
  ["6ES7223-1QH32-0XB0","SM 1223","Digital I/O modules","Digital I/O SM 1223, 8DI AC/8DO relay"],
  ["6ES7223-1BL32-1XB0","SM 1223","Digital I/O modules","Digital I/O SM 1223, 16DI/16DO sink"],
  ["6AG2223-1BH32-1XB0","SM 1223","Digital I/O modules","SIPLUS S7-1200 SM 1223 8DI/8DQ RAIL"],
  ["6AG1223-1BL32-4XB0","SM 1223","Digital I/O modules","SIPLUS S7-1200 SM 1223 16DI/16DQ"],
  ["6AG2223-1PL32-1XB0","SM 1223","Digital I/O modules","SIPLUS S7-1200 SM 1223 16DI/16DQ RAIL"],
  ["6ES7226-6BA32-0XB0","SM 1226","Digital I/O modules","Digital Input SM 1226, F-DI 16x 24VDC"],
  ["6ES7226-6DA32-0XB0","SM 1226","Digital I/O modules","Digital Output SM 1226, F-DQ 4x 24VDC"],
  ["6ES7226-6RA32-0XB0","SM 1226","Digital I/O modules","Digital Output SM 1226, F-DQ 2x Relay"],
  ["6AG1226-6DA32-5XB0","SM 1226","Digital I/O modules","SIPLUS S7-1200 SM 1226 F-DQ 4x24VDC"],
  ["6AG1226-6RA32-5XB0","SM 1226","Digital I/O modules","SIPLUS S7-1200 SM 1226 F-DQ 2xRelay"],
  ["6ES7231-4HD32-0XB0","SM 1231","Analog I/O modules","Analog Input SM 1231, 4AI"],
  ["6ES7231-4HF32-0XB0","SM 1231","Analog I/O modules","Analog Input SM 1231, 8AI"],
  ["6ES7231-5ND32-0XB0","SM 1231","Analog I/O modules","Analog Input SM 1231, 4AI 16bit"],
  ["6ES7231-5PD32-0XB0","SM 1231","Analog I/O modules","S7-1200 analog Input SM 1231 RTD, 4 AI"],
  ["6ES7231-5PF32-0XB0","SM 1231","Analog I/O modules","S7-1200 analog Input SM 1231 RTD, 8 AI"],
  ["6ES7231-5QD32-0XB0","SM 1231","Analog I/O modules","S7-1200 analog Input SM 1231 TC, 4 AI"],
  ["6ES7231-5QF32-0XB0","SM 1231","Analog I/O modules","S7-1200 analog Input SM 1231 TC, 8 AI"],
  ["6ES7238-5XA32-0XB0","SM 1238","Analog I/O modules","SM 1238 Energy Meter 480V AC"],
  ["6AG1231-4HD32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 4AI 13Bit"],
  ["6AG1231-4HF32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 8AI 13Bit"],
  ["6AG1231-5ND32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 4AI 16Bit"],
  ["6AG1231-5PD32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 4AI RTD 16Bit"],
  ["6AG1231-5PF32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 8AI RTD 16Bit"],
  ["6AG1231-5QD32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 4AI TC 16Bit"],
  ["6AG1231-5QF32-4XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 8AI TC 16Bit"],
  ["6AG2231-5PD32-1XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 RTD RAIL"],
  ["6AG1231-5PD32-2XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 4AI RTD 16Bit"],
  ["6AG1231-5PF32-2XB0","SM 1231","Analog I/O modules","SIPLUS S7-1200 SM 1231 8AI RTD 16Bit"],
  ["6ES7232-4HD32-0XB0","SM 1232","Analog I/O modules","Analog Output SM 1232, 4AO"],
  ["6ES7232-4HB32-0XB0","SM 1232","Analog I/O modules","Analog Output SM 1232, 2AO"],
  ["6AG1232-4HB32-4XB0","SM 1232","Analog I/O modules","SIPLUS S7-1200 SM 1232 2AQ 13Bit"],
  ["6AG1232-4HD32-4XB0","SM 1232","Analog I/O modules","SIPLUS S7-1200 SM 1232 4AQ 14Bit"],
  ["6AG2232-4HD32-1XB0","SM 1232","Analog I/O modules","SIPLUS S7-1200 SM 1232 4AQ RAIL"],
  ["6AG1232-4HD32-2XB0","SM 1232","Analog I/O modules","SIPLUS S7-1200 SM 1232 4AQ 14Bit"],
  ["6ES7234-4HE32-0XB0","SM 1234","Analog I/O modules","Analog I/O SM 1234, 4AI/2AO"],
  ["6AG1234-4HE32-4XB0","SM 1234","Analog I/O modules","SIPLUS S7-1200 SM 1234 4AI/2AQ 13Bit"],
  ["6AG2234-4HE32-1XB1","SM 1234","Analog I/O modules","SIPLUS S7-1200 SM 1234 4AI/2AQ RAIL"],
  ["6AG1234-4HE32-2XB0","SM 1234","Analog I/O modules","SIPLUS S7-1200 SM 1234 4AI/2AQ 13Bit"],
  ["6ES7274-1XF30-0XA0","SIM 1274","Accessories","S7-1200 Simulator Module SIM1274, 8 Inputs"],
  ["6ES7274-1XH30-0XA0","SIM 1274","Accessories","S7-1200 Simulator Module SIM1274, 14 Inputs"],
  ["6ES7274-1XK30-0XA0","SIM 1274","Accessories","S7-1200 Simulator S7-1217, 14 inputs"],
  ["6ES7274-1XA30-0XA0","Potentiometer module","Accessories","S7-1200 Potentiometer Module, 2 Pot Input"],
  ["6ES7278-4BD32-0XB0","SM 1278","Communications modules","S7-1200 SM1278, 4 X IO-Link Master"],
  ["6ES7241-1AH32-0XB0","CM 1241","Communications modules","Communication Module CM 1241, RS232"],
  ["6ES7241-1CH32-0XB0","CM 1241","Communications modules","Communication Module CM 1241, RS422/485"],
  ["6GK7242-5DX30-0XE0","CM 1242-5","Communications modules","Communication module CM 1242-5"],
  ["3RK7243-2AA30-0XB0","CM 1243-2","Communications modules","CM 1243-2 (AS-I V3.0)"],
  ["6GK7243-5DX30-0XE0","CM 1243-5","Communications modules","Communication module CM 1243-5"],
  ["6GT2002-0LA00","RF120C","Communications modules","Communication module RF120C"],
  ["6GK7242-7KX31-0XE0","CP 1242-7","Communications modules","Communication processor CP 1242-7"],
  ["6GK7243-1BX30-0XE0","CP 1243-1","Communications modules","Communication processor CP 1243-1"],
  ["6GK7243-7KX30-0XE0","CP 1243-7","Communications modules","Communication processor CP 1243-7 LTE EU"],
  ["6GK7243-7SX30-0XE0","CP 1243-7","Communications modules","Communication processor CP 1243-7 LTE US"],
  ["6GK7243-8RX30-0XE0","CP 1243-8","Communications modules","Communication processor CP 1243-8 IRC"],
  ["3RK7271-1AA30-0AA0","DCM 1271","Communications modules","DCM 1271 (AS-I data decoupler)"],
  ["6GK7277-1AA10-0AA0","CSM 1277","Communications modules","Compact Switch Module CSM 1277"],
  ["6AG1242-5DX30-2XE0","CM 1242-5","Communications modules","SIPLUS S7-1200 CM 1242-5"],
  ["6AG1243-5DX30-2XE0","CM 1243-5","Communications modules","SIPLUS S7-1200 CM 1243-5"],
  ["6AG2242-5DX30-1XE0","CM 1242-5","Communications modules","SIPLUS S7-1200 CM 1242-5 RAIL"],
  ["6AG2243-5DX30-1XE0","CM 1243-5","Communications modules","SIPLUS S7-1200 CM 1243-5 RAIL"],
  ["6AG1241-1AH32-4XB0","CM 1241","Communications modules","SIPLUS S7-1200 CM 1241 RS232"],
  ["6AG1241-1CH32-4XB0","CM 1241","Communications modules","SIPLUS S7-1200 CM 1241 RS422/485"],
  ["6AG1277-1AA10-4AA0","CSM 1277","Communications modules","SIPLUS NET CSM 1277"],
  ["6AG1278-4BD32-4XB0","SM 1278","Communications modules","SIPLUS S7-1200 SM 1278 IO-Link Master"],
  ["6AG2241-1AH32-1XB0","CM 1241","Communications modules","SIPLUS S7-1200 CM1241 RS232 RAIL"],
  ["6AG2241-1CH32-1XB0","CM 1241","Communications modules","SIPLUS S7-1200 CM1241 RS422/485 RAIL"],
  ["6AG1243-2AA30-7XB0","CM 1243-2","Communications modules","SIPLUS S7-1200 CM 1243-2"],
  ["6AG1241-1AH32-2XB0","CM 1241","Communications modules","SIPLUS S7-1200 CM1241 RS232"],
  ["6AG1241-1CH32-2XB0","CM 1241","Communications modules","SIPLUS S7-1200 CM 1241 RS422/485"],
  ["6AG1243-1BX30-2AX0","CP 1243-1","Communications modules","SIPLUS S7-1200 CP 1243-1"],
  ["6AG1277-1AA10-2AA0","CSM 1277","Communications modules","SIPLUS NET CSM 1277"],
  ["6AG1278-4BD32-2XB0","SM 1278","Communications modules","SIPLUS S7-1200 SM 1278 IO-Link Master"],
  ["6AG2243-1BX30-1XE0","CP 1243-1","Communications modules","SIPLUS S7-1200 CP 1243-1 T1 RAIL"],
  ["7MH4960-2AA01","SIWAREX WP231","Technology modules","SIWAREX WP231 Weighing module"],
  ["7MH4960-4AA01","SIWAREX WP241","Technology modules","SIWAREX WP241 Weighing module"],
  ["7MH4960-6AA01","SIWAREX WP251","Technology modules","SIWAREX WP251 Weighing module"],
  ["6AT8007-1AA10-0AA0","SM 1281","Technology modules","SM1281 Condition Monitoring"],
  ["6AG1332-1SH71-4AA0","PM 1207","Power supplies","SIPLUS POWER MODULE PM1207"],
  ["6AG1332-1SH71-7AA0","PM 1207","Power supplies","SIPLUS POWER MODULE PM1207"],
  ["6ES7954-8LC04-0AA0","SIMATIC S7 memory card","Accessories","SIMATIC S7 memory card, 4 MB"],
  ["6ES7954-8LE04-0AA0","SIMATIC S7 memory card","Accessories","SIMATIC S7 Memory Card, 12 MB"],
  ["6ES7954-8LF04-0AA0","SIMATIC S7 memory card","Accessories","SIMATIC S7 Memory Card, 24 MB"],
  ["6ES7954-8LL04-0AA0","SIMATIC S7 memory card","Accessories","SIMATIC S7 Memory Card, 256 MB"],
  ["6ES7954-8LP04-0AA0","SIMATIC S7 memory card","Accessories","SIMATIC S7 Memory Card, 2 GB"],
  ["6ES7954-8LT04-0AA0","SIMATIC S7 memory card","Accessories","SIMATIC S7 Memory Card, 32 GB"],
];
const siemensOverviewProducts = siemensOverviewRows.map(([identifier,family,category,officialDescription])=>({
  manufacturer:"Siemens",identifier,family,category,
  attributes:{officialDescription},
  source:{url:siemensCatalog,title:"Siemens product overview for SIMATIC S7-1200 (export 2025-10-02)",retrievedOn:"2026-11-01"},
  simulation:{status:"reference-only",model:null,limitations:"The Siemens export provides this product name and order code only; this application does not simulate or verify its terminal layout, electrical ratings, environmental grade, compatibility, or behavior."},
}));

const siemens1500Rows = [
  ["6ES7511-1AK02-0AB0","PLC controllers","CPU 1511-1PN, 150KB Program, 1MB Data"],
  ["6ES7511-1FK02-0AB0","PLC controllers","CPU 1511F-1PN, 225KB prog, 1MB data"],
  ["6ES7513-1AL02-0AB0","PLC controllers","CPU 1513-1 PN, 300KB Prog., 1,5MB Data"],
  ["6ES7513-1FL02-0AB0","PLC controllers","CPU 1513F-1 PN, 450KB Prog., 1,5MB data"],
  ["6ES7515-2AM02-0AB0","PLC controllers","CPU 1515-2 PN, 500KB Prog., 3MB Data"],
  ["6ES7515-2FM02-0AB0","PLC controllers","CPU 1515F-2 PN, 750KB Prog.,3MB Data"],
  ["6ES7516-3AN02-0AB0","PLC controllers","CPU 1516-3 PN/DP, 1MB Prog., 5MB Data"],
  ["6ES7516-3FN02-0AB0","PLC controllers","CPU 1516F-3 PN/DP, 1,5MB Prog, 5MB Data"],
  ["6ES7517-3AP00-0AB0","PLC controllers","CPU 1517-3 PN/DP, 2MB Prog./8MB Data"],
  ["6ES7517-3FP00-0AB0","PLC controllers","CPU 1517F-3 PN/DP, 3MB Prog., 8MB Data"],
  ["6ES7518-4AP00-0AB0","PLC controllers","CPU 1518-4 PN/DP, 6 MB Prog., 60MB Data"],
  ["6ES7518-4FP00-0AB0","PLC controllers","CPU 1518F-4 PN/DP, 9 MB Prog, 60MB Data"],
  ["6ES7521-1BH10-0AA0","Digital I/O modules","S7-1500, DI 16x24VDC BA"],
  ["6ES7521-1BH50-0AA0","Digital I/O modules","S7-1500, DI 16x24VDC SRC BA"],
  ["6ES7521-7BH00-0AB0","Digital I/O modules","S7-1500, DI 16X24VDC HS"],
  ["6ES7521-1BH00-0AB0","Digital I/O modules","S7-1500, DI 16x24VDC HF"],
  ["6ES7521-7TH00-0AB0","Digital I/O modules","S7-1500, DI 16XNAMUR HF"],
  ["6ES7521-1FH00-0AA0","Digital I/O modules","S7-1500, DI 16x230VAC BA"],
  ["6ES7521-7EH00-0AB0","Digital I/O modules","S7-1500, DI 16 x 24...125V UC HF"],
  ["6ES7521-1BL10-0AA0","Digital I/O modules","S7-1500, DI 32x24VDC BA"],
  ["6ES7521-1BL00-0AB0","Digital I/O modules","S7-1500, DI 32x24VDC HF"],
  ["6ES7521-1BP00-0AA0","Digital I/O modules","S7-1500, DI 64x24VDC SNK/SRC BA"],
  ["6ES7522-1BF00-0AB0","Digital I/O modules","S7-1500, DQ 8x24VDC/2A HF"],
  ["6ES7522-5FF00-0AB0","Digital I/O modules","S7-1500, DQ 8x230VAC/2A ST (Triac)"],
  ["6ES7522-5HF00-0AB0","Digital I/O modules","S7-1500, DQ 8x230VAC/5A ST (Relay)"],
  ["6ES7522-1BH10-0AA0","Digital I/O modules","S7-1500, DQ 16x24VDC/0.5A BA"],
  ["6ES7522-1BH01-0AB0","Digital I/O modules","S7-1500, DQ 16x24V DC/0.5A HF"],
  ["6ES7522-5FH00-0AB0","Digital I/O modules","S7-1500, DQ 16x230VAC/1A ST (Triac)"],
  ["6ES7522-5HH00-0AB0","Digital I/O modules","S7-1500, DQ 16x230VAC/2A ST (Relay)"],
  ["6ES7522-5EH00-0AB0","Digital I/O modules","S7-1500, DQ 16x24...48VUC/125VDC/0.5A ST"],
  ["6ES7522-1BL10-0AA0","Digital I/O modules","S7-1500, DQ 32x24VDC/0.5A BA"],
  ["6ES7522-1BL01-0AB0","Digital I/O modules","S7-1500, DQ 32x24VDC/0.5A HF"],
  ["6ES7523-1BL00-0AA0","Digital I/O modules","S7-1500, DI 16x24VDC/DQ 16x24VDC/0.5A BA"],
  ["6ES7523-1BP50-0AA0","Digital I/O modules","S7-1500, DI 32x24VDC/DQ 32x24VDC/0.3A BA"],
  ["6ES7526-1BH00-0AB0","Digital I/O modules","ET 200MP, F-DI 16X24VDC"],
  ["6ES7526-2BF00-0AB0","Digital I/O modules","ET 200MP, F-DQ 8x24VDC 2A PPM"],
  ["6AG1526-1BH00-2AB0","Digital I/O modules","SIPLUS S7-1500 F-DI 16x24VDC"],
  ["6AG1526-2BF00-2AB0","Digital I/O modules","SIPLUS S7-1500 F-DQ 8x24VDC/2A"],
  ["6ES7531-7QD00-0AB0","Analog I/O modules","S7-1500, AI 4xU/I/RTD/TC ST"],
  ["6ES7531-7QF00-0AB0","Analog I/O modules","S7-1500, AI 8xU/I/R/RTD BA"],
  ["6ES7531-7KF00-0AB0","Analog I/O modules","S7-1500, AI 8xU/I/RTD/TC ST"],
  ["6ES7531-7NF10-0AB0","Analog I/O modules","S7-1500, AI 8xU/I HS"],
  ["6ES7531-7PF00-0AB0","Analog I/O modules","S7-1500, AI 8 X U/R/RTD/TC HF"],
  ["6ES7531-7NF00-0AB0","Analog I/O modules","S7-1500, AI 8xU/I HF"],
  ["6ES7531-7TF00-0AB0","Analog I/O modules","S7-1500, AI 8xHART HF"],
  ["6ES7531-7LH00-0AB0","Analog I/O modules","S7-1500, AI 16xU BA"],
  ["6ES7532-5NB00-0AB0","Analog I/O modules","S7-1500, AQ 2xU/I ST"],
  ["6ES7532-5HD00-0AB0","Analog I/O modules","S7-1500, AQ 4xU/I ST"],
  ["6ES7532-5ND00-0AB0","Analog I/O modules","S7-1500, AQ 4xU/I HF"],
  ["6ES7532-5HF00-0AB0","Analog I/O modules","S7-1500, AQ 8xU/I HS"],
  ["6ES7532-8TF00-0AB0","Analog I/O modules","S7-1500, AQ 8xHART HF"],
  ["6ES7534-7QE00-0AB0","Analog I/O modules","S7-1500, AI 4x U/I/RTD/TC/AQ 2x U/I ST"],
  ["6ES7540-1AD00-0AA0","Communications modules","S7-1500, CM PTP RS232 BA"],
  ["6ES7540-1AB00-0AA0","Communications modules","S7-1500, CM PTP RS422/485 BA"],
  ["6ES7541-1AD00-0AB0","Communications modules","S7-1500, CM PTP RS232 HF"],
  ["6ES7541-1AB00-0AB0","Communications modules","S7-1500, CM PTP RS422/485 HF"],
  ["6GK7542-5DX10-0XE0","Communications modules","S7-1500, CM 1542-5"],
  ["6GK7542-1AX10-0XE0","Communications modules","Communication module CM 1542-1"],
  ["6ES7547-1JF00-0AB0","Communications modules","S7-1500, CM 8xIO-Link"],
  ["6GK7543-1AX00-0XE0","Communications modules","S7-1500, CP 1543-1"],
  ["6ES7550-1AA01-0AB0","Technology modules","S7-1500, TM Count 2x24V"],
  ["6ES7551-1AB01-0AB0","Technology modules","S7-1500, TM PosInput 2"],
  ["6ES7552-1AA00-0AB0","Technology modules","S7-1500, TM Timer DIDQ 16x24V"],
  ["6ES7553-1AA00-0AB0","Technology modules","S7-1500, TM PTO4"],
  ["6ES7554-1AA00-0AB0","Technology modules","S7-1500, TM FAST"],
  ["6ES7556-1AA00-0AB0","Technology modules","S7-1500, TM NPU"],
  ["6ES7558-1AA00-0AB0","Technology modules","S7-1500, TM MFP"],
  ["7MH4980-1AA01","Technology modules","Weighing module TM SIWAREX WP521 ST"],
  ["7MH4980-2AA01","Technology modules","Weighing module TM SIWAREX WP522 ST"],
  ["6ES7505-0KA00-0AB0","Power supplies","S7-1500, PS 25W 24V DC"],
  ["6ES7505-0RA00-0AB0","Power supplies","S7-1500, PS 60W 24/48/60V DC"],
  ["6ES7505-0RB00-0AB0","Power supplies","S7-1500, PS 60W 24/48/60V DC HF"],
  ["6ES7507-0RA00-0AB0","Power supplies","S7-1500, PS 60W 120/230V AC/DC"],
  ["6EP1332-4BA00","Power supplies","SIMATIC PM1507/1AC/24VDC/3A"],
  ["6EP1333-4BA00","Power supplies","SIMATIC PM1507/1AC/24VDC/8A"],
].map(([identifier,category,officialDescription])=>({
  manufacturer:"Siemens",identifier,family:"SIMATIC S7-1500",category,attributes:{officialDescription},
  source:{url:siemens1500Catalog,title:"Siemens product overview for SIMATIC S7-1500 (export 2024-09-29)",retrievedOn:"2026-11-02",exportDate:"2024-09-29"},
  simulation:{status:"reference-only",model:null,limitations:"The Siemens export provides this product name and order code only; this application does not simulate or verify its terminal layout, electrical ratings, environmental grade, compatibility, or behavior."},
}));

const siemensEt200spCatalog = "https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=ET200_SP&lang=en";
const siemensEt200spRows = [
  ["6ES7155-6AR01-0AN0","Interface modules","ET 200SP, IM 155-6 PN Basic"],
  ["6ES7155-6AU02-0BN0","Interface modules","ET 200SP, IM 155-6 PN ST"],
  ["6ES7155-6AU01-0BN0","Interface modules","ET 200SP, IM155-6PN ST"],
  ["6ES7155-6AA02-0BN0","Interface modules","ET 200SP, IM 155-6 PN ST incl. BA 2xRJ45"],
  ["6ES7155-6AA01-0BN0","Interface modules","ET 200SP, IM155-6PN ST incl. BA 2xRJ45"],
  ["6ES7155-6AU00-0DN0","Interface modules","ET 200SP, IM155-6PN HS"],
  ["6ES7155-6AU01-0CN0","Interface modules","ET 200SP, IM155-6PN/2 HF"],
  ["6ES7155-6AU30-0CN0","Interface modules","ET 200SP, IM155-6PN/3 HF"],
  ["6ES7155-6BA01-0CN0","Interface modules","ET 200SP, IM155-6DP HF incl. DP-Connector"],
  ["6ES7155-6MU01-0CN0","Interface modules","ET 200SP, IM 155-6 MF HF"],
  ["6ES7155-6AU00-0HM0","Interface modules","ET 200SP, IM 155-6 PN R1"],
  ["6ES7155-6AW02-0BN0","Interface modules","ET 200SP, IM 155-6 PN ST for BaseCarrier"],
  ["6AG1155-6AU01-2CN0","Interface modules","SIPLUS ET 200SP IM155-6PN HF"],
  ["6AG1155-6AU01-7BN0","Interface modules","SIPLUS ET 200SP IM155-6PN ST"],
  ["6AG1155-6AU00-7HM0","Interface modules","SIPLUS ET 200SP IM155-6PN R1"],
  ["6ES7510-1DK03-0AB0","PLC controllers","CPU 1510SP-1 PN, 200KB program, 1MB data"],
  ["6ES7510-1SK03-0AB0","PLC controllers","CPU 1510SP F-1 PN, 300KB program, 1MB data"],
  ["6ES7512-1DM03-0AB0","PLC controllers","CPU 1512SP-1 PN, 400KB program, 2MB data"],
  ["6ES7512-1SM03-0AB0","PLC controllers","CPU 1512SP F-1 PN, 600KB program, 2MB data"],
  ["6ES7514-2DN03-0AB0","PLC controllers","CPU 1514SP-2 PN, 600KB program, 3.5MB data"],
  ["6ES7514-2SN03-0AB0","PLC controllers","CPU 1514SP F-2 PN, 900KB program, 3.5MB data"],
  ["6ES7514-2VN03-0AB0","PLC controllers","CPU 1514SP T-2 PN, 900KB program, 3.5MB data"],
  ["6ES7514-2WN03-0AB0","PLC controllers","CPU 1514SP TF-2 PN, 900KB program, 3.5MB data"],
  ["6ES7131-6BF01-0AA0","Digital I/O modules","ET 200SP DI 8x 24V DC Basic, PU 1"],
  ["6ES7131-6BF01-0BA0","Digital I/O modules","ET 200SP DI 8x 24V DC ST, PU 1"],
  ["6ES7131-6BF00-0CA0","Digital I/O modules","ET 200SP DI 8x 24V DC HF, PU 1"],
  ["6ES7131-6BF00-0DA0","Digital I/O modules","ET 200SP DI 8x24VDC High Speed"],
  ["6ES7131-6BH01-0BA0","Digital I/O modules","ET 200SP DI 16x 24V DC ST, PU 1"],
  ["6ES7131-6BH60-0AA0","Digital I/O modules","ET 200SP DI 16x24VDC SRC BA"],
  ["6ES7131-6BF61-0AA0","Digital I/O modules","ET 200SP DI 8x 24V DC SRC BA"],
  ["6ES7131-6CF00-0AU0","Digital I/O modules","ET 200SP DI 8x 24VAC..48VUC BA, PU 1"],
  ["6ES7131-6FD01-0BB1","Digital I/O modules","ET 200SP DI 4x 120..230V AC ST"],
  ["6ES7131-6TF00-0CA0","Digital I/O modules","ET 200SP DI 8xNAMUR HF"],
  ["6ES7136-6BA00-0CA0","Digital I/O modules","ET 200SP electronic module F-DI 8x24VDC HF"],
  ["6ES7136-6BA01-0CA0","Digital I/O modules","ET 200SP F-DI 8x24V DC HF"],
  ["6ES7132-6BD21-0BA0","Digital I/O modules","ET 200SP DQ 4x24VDC/2A ST, PU 1"],
  ["6ES7132-6BD21-0CA0","Digital I/O modules","ET 200SP DQ 4x24VDC/2A HF, PU 1"],
  ["6ES7132-6BD20-0DA0","Digital I/O modules","ET 200SP DQ 4x24VDC/2A High Speed, PU 1"],
  ["6ES7132-6BF01-0BA0","Digital I/O modules","ET 200SP DQ 8x24VDC/0.5A ST"],
  ["6ES7132-6BF00-0CA0","Digital I/O modules","ET 200SP DQ 8x24VDC/0.5A HF"],
  ["6ES7132-6BH00-0CA0","Digital I/O modules","ET 200SP DQ 16x24VDC/0.5A HF, PU 1"],
  ["6ES7132-6BH60-0AA0","Digital I/O modules","ET 200SP DQ 16x24VDC/0.5A SINK BA, PU 1"],
  ["6ES7132-6FD00-0BB1","Digital I/O modules","ET 200SP DQ 4x24..230VAC/2A ST"],
  ["6ES7132-6FD00-0CU0","Digital I/O modules","ET 200SP DQ 4x24..230VAC/2A HF, PU 1"],
  ["6ES7132-6GD51-0BA0","Digital I/O modules","ET 200SP relay output RQ CO 4x24VDC/2A ST"],
  ["6ES7132-6HC50-0BU0","Digital I/O modules","ET 200SP relay output RQ CO 3x120VDC..230VAC/5A ST"],
  ["6ES7132-6HD01-0BB1","Digital I/O modules","ET 200SP relay output RQ NO 4x120VDC..230VAC/5A"],
  ["6ES7133-6BH00-0BA0","Digital I/O modules","ET 200SP DI8x + DQ8x 24V DC/0.5A ST"],
  ["6ES7134-6FB00-0BA1","Analog I/O modules","ET 200SP AI 2xU Standard, PU 1"],
  ["6ES7134-6FF00-0AA1","Analog I/O modules","ET 200SP AI 8xU Basic"],
  ["6ES7134-6GB00-0BA1","Analog I/O modules","ET 200SP AI 2xI 2-/4-Wire ST, PU 1"],
  ["6ES7134-6GD01-0BA1","Analog I/O modules","ET 200SP AI 4xI 2-/4-Wire ST, PU 1"],
  ["6ES7134-6GF00-0AA1","Analog I/O modules","ET 200SP AI 8xI 2-/4-Wire Basic"],
  ["6ES7134-6HB00-0CA1","Analog I/O modules","ET 200SP AI 2xU/I 2-, 4-Wire HF"],
  ["6ES7134-6HB00-0DA1","Analog I/O modules","ET 200SP AI 2xU/I 2-, 4-Wire HS"],
  ["6ES7134-6HD01-0BA1","Analog I/O modules","ET 200SP AI 4xU/I 2-Wire ST, PU 1"],
  ["6ES7134-6JD00-0DA1","Analog I/O modules","ET 200SP AI 4xTC HS"],
  ["6ES7134-6JD00-0CA1","Analog I/O modules","ET 200SP AI 4xRTD/TC 2-/3-/4-Wire HF"],
  ["6ES7134-6JF00-0CA1","Analog I/O modules","ET 200SP AI 8xRTD/TC 2-Wire HF"],
  ["6ES7134-6TD00-0CA1","Analog I/O modules","ET 200SP AI 4xI 2-Wire 4...20mA HART"],
  ["6ES7134-6PA01-0BU0","Analog I/O modules","ET 200SP AI Energy Meter CT ST"],
  ["6ES7134-6PA01-0CU0","Analog I/O modules","ET 200SP AI Energy Meter CT HF"],
  ["6ES7134-6PA21-0BU0","Analog I/O modules","ET 200SP AI Energy Meter RC ST"],
  ["6ES7134-6PA21-0CU0","Analog I/O modules","ET 200SP AI Energy Meter RC HF"],
  ["6ES7135-6FB00-0BA1","Analog I/O modules","ET 200SP AQ 2xU Standard, PU 1"],
  ["6ES7135-6GB00-0BA1","Analog I/O modules","ET 200SP AQ 2xI Standard, PU 1"],
  ["6ES7135-6HB00-0CA1","Analog I/O modules","ET 200SP AQ 2xU/I High Feature"],
  ["6ES7135-6HB00-0DA1","Analog I/O modules","ET 200SP AQ 2xU/I High Speed"],
  ["6ES7135-6HD00-0BA1","Analog I/O modules","ET 200SP AQ 4xU/I ST"],
  ["6ES7135-6TD00-0CA0","Analog I/O modules","ET 200SP AQ 4xI HART HF"],
  ["6ES7136-6AA00-0CA1","Analog I/O modules","ET 200SP F-AI 4xI 0(4)..20mA HF"],
  ["6ES7136-6AB00-0CA1","Analog I/O modules","ET 200SP F-AI 4xU 0..10V HF"],
  ["6ES7136-6PA00-0BC0","Power modules","ET 200SP F-PM-E PPM, 24V DC"],
  ["6ES7138-6BA01-0BA0","Technology modules","ET 200SP TM Posinput 1"],
  ["6ES7138-6CG00-0BA0","Technology modules","ET 200SP TM Timer DIDQ 10x24V"],
  ["6ES7138-6AA01-0BA0","Technology modules","ET 200SP TM Count 1x24V"],
  ["6ES7138-6DB00-0BB1","Technology modules","ET 200SP TM Pulse 2x24V"],
  ["6ES7138-6EB00-0BA0","Technology modules","ET 200SP TM PTO 2x24V"],
  ["6FE1242-6TM10-0BB1","Technology modules","SIMATIC ET 200SP TM ECC 2xPWM ST"],
  ["6FE1242-6TM20-0BB1","Technology modules","SIMATIC ET 200SP TM ECC PL ST"],
  ["6GK7542-6VX00-0XE0","Communications modules","Communication processor CP 1542SP-1 IRC"],
  ["6GK7542-6UX00-0XE0","Communications modules","Communication processor CP 1542SP-1"],
  ["6GK7543-6WX00-0XE0","Communications modules","Communication processor CP 1543SP-1"],
  ["6ES7545-5DA00-0AB0","Communications modules","ET 200SP CM DP for ET 200SP CPU"],
  ["3RK7137-6SA00-0BC1","Communications modules","CM AS-I MASTER ST ET 200SP (AS-I V3.0)"],
  ["3RK7136-6SC00-0BC1","Communications modules","F-CM AS-I SAFETY ST ET 200SP"],
  ["6ES7137-6CA00-0BU0","Communications modules","ET 200SP CM 1x DALI"],
  ["6ES7137-6AA01-0BA0","Communications modules","ET 200SP CM PTP, PU 1"],
  ["6ES7137-6EA00-0BA0","Communications modules","ET 200SP CM CAN"],
  ["6ES7137-6BD00-0BA0","Communications modules","ET 200SP CM 4x IO-Link ST"],
  ["6ES7193-6TP00-0TN0","Terminal and mounting accessories","ET 200SP PotDis-TB n.c. G, PU 1"],
  ["6ES7193-6TP00-0TP0","Terminal and mounting accessories","ET 200SP PotDis-TB BR W, PU 1"],
  ["6ES7193-6TP00-0TP1","Terminal and mounting accessories","ET 200SP PotDis-TB P1 R, PU 1"],
  ["6ES7193-6TP00-0TP2","Terminal and mounting accessories","ET 200SP PotDis-TB P2 B, PU 1"],
  ["6EP7133-6AB00-0BN0","Power supplies","SIMATIC ET 200SP PS 1AC/24VDC/5A"],
  ["6EP7133-6AE00-0BN0","Power supplies","SIMATIC ET 200SP PS 1AC/24VDC/10A"],
];
const siemensKnownIdentifiers = new Set([
  ...siemensCpus,...siemensModules,...siemensPowerSupplies,...siemensOverviewProducts,...siemens1500Rows,
].map((item)=>`${item.manufacturer}|${item.identifier}`));
const siemensEt200spProducts = siemensEt200spRows
  .map(([identifier,category,officialDescription])=>({
    manufacturer:"Siemens",identifier,family:"SIMATIC ET 200SP",category,attributes:{officialDescription},
    source:{url:siemensEt200spCatalog,title:"Siemens product overview for SIMATIC ET 200SP (export 2025-10-14)",retrievedOn:"2026-11-02",exportDate:"2025-10-14"},
    simulation:{status:"reference-only",model:null,limitations:"The Siemens export provides this product name and order code only; this application does not simulate or verify its terminal layout, electrical ratings, environmental grade, compatibility, or behavior."},
  }))
  .filter((item)=>{
    const key=`${item.manufacturer}|${item.identifier}`;
    if(siemensKnownIdentifiers.has(key))return false;
    siemensKnownIdentifiers.add(key);
    return true;
  });
const siemensLogo8Catalog = "https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=LOGO8&lang=en";
const siemensLogo8Rows = [
  ["6ED1052-1MD08-0BA2","PLC controllers","LOGO! 12/24RCE, 8DI (4AI)/4DO, 400 Blocks"],
  ["6ED1052-2MD08-0BA2","PLC controllers","LOGO! 12/24RCEO, 8DI (4AI)/4DO, 400 Blocks"],
  ["6ED1052-1FB08-0BA2","PLC controllers","LOGO! 230RCE, 8DI/4DO, 400 Blocks"],
  ["6ED1052-2FB08-0BA2","PLC controllers","LOGO! 230RCEO, 8DI/4DO, 400 Blocks"],
  ["6ED1052-1HB08-0BA2","PLC controllers","LOGO! 24RCE, 8DI/4DO, 400 Blocks"],
  ["6ED1052-2HB08-0BA2","PLC controllers","LOGO! 24RCEO, 8DI/4DO, 400 Blocks"],
  ["6ED1052-1CC08-0BA2","PLC controllers","LOGO! 24CE, 8DI (4AI)/4DO, 400 Blocks"],
  ["6ED1052-2CC08-0BA2","PLC controllers","LOGO! 24CEo, 8DI (4AI)/4DO, 400 Blocks"],
  ["6AG1052-1MD08-7BA1","PLC controllers","SIPLUS LOGO! 12/24RCE"],
  ["6AG1052-2MD08-7BA1","PLC controllers","SIPLUS LOGO! 12/24RCEO"],
  ["6AG1052-1FB08-7BA1","PLC controllers","SIPLUS LOGO! 230RCE"],
  ["6AG1052-2FB08-7BA1","PLC controllers","SIPLUS LOGO! 230RCEO"],
  ["6AG1052-1CC08-7BA1","PLC controllers","SIPLUS LOGO! 24CE"],
  ["6AG1052-2CC08-7BA1","PLC controllers","SIPLUS LOGO! 24CEO"],
  ["6AG1052-1HB08-7BA1","PLC controllers","SIPLUS LOGO! 24RCE"],
  ["6AG1052-2HB08-7BA1","PLC controllers","SIPLUS LOGO! 24RCEO (AC)"],
  ["6ED1055-1CB00-0BA2","Digital I/O modules","LOGO! DM8 24 expansion module, 4DI/4DO"],
  ["6ED1055-1CB10-0BA2","Digital I/O modules","LOGO! DM16 24 expansion module, 8DI/8DO"],
  ["6ED1055-1FB00-0BA2","Digital I/O modules","LOGO! DM8 230R expansion module, 4DI/4DO"],
  ["6ED1055-1FB10-0BA2","Digital I/O modules","LOGO! DM16 230R expansion module, 8DI/8DO"],
  ["6ED1055-1HB00-0BA2","Digital I/O modules","LOGO! DM8 24R expansion module, 4DI/4DO"],
  ["6ED1055-1MB00-0BA2","Digital I/O modules","LOGO! DM8 12/24R expansion module, 4DI/DO"],
  ["6ED1055-1NB10-0BA2","Digital I/O modules","LOGO! DM16 24R expansion module, 8DI/8DO"],
  ["6AG1055-1CB00-7BA2","Digital I/O modules","SIPLUS LOGO! DM8 24 V8"],
  ["6AG1055-1FB00-7BA2","Digital I/O modules","SIPLUS LOGO! DM8 230R V8"],
  ["6AG1055-1HB00-7BA2","Digital I/O modules","SIPLUS LOGO! DM8 24R V8"],
  ["6AG1055-1MB00-7BA2","Digital I/O modules","SIPLUS LOGO! DM8 12/24R V8"],
  ["6AG1055-1NB10-7BA2","Digital I/O modules","SIPLUS LOGO! DM16 24R V8"],
  ["6ED1055-1MA00-0BA2","Analog I/O modules","LOGO! AM2 expansion module, 12/24V, 2AI"],
  ["6ED1055-1MD00-0BA2","Analog I/O modules","LOGO! AM2 RTD, 2AI, -50..+200°C"],
  ["6ED1055-1MM00-0BA2","Analog I/O modules","LOGO! AM2 AQ, 2AQ, 0-10V, 0/4-20mA"],
  ["6AG1055-1MA00-7BA2","Analog I/O modules","SIPLUS LOGO! AM2 V8"],
  ["6AG1055-1MD00-7BA2","Analog I/O modules","SIPLUS LOGO! AM2 RTD"],
  ["6AG1055-1MM00-7BA2","Analog I/O modules","SIPLUS LOGO! AM2 AQ V8"],
  ["6GK7177-1MA20-0AA0","Communications modules","LOGO! CSM12/24"],
  ["6GK7142-7BX00-0AX0","Communications modules","Communication module LOGO! CMR2020"],
  ["6GK7142-7EX00-0AX0","Communications modules","Communication module LOGO! CMR2040"],
  ["6BK1700-0BA20-0AA0","Communications modules","LOGO! CMK2000"],
  ["6ED1055-5MC08-0BA2","Communications modules","LOGO! CIM"],
  ["6ED1055-4MH08-0BA1","HMI devices","LOGO! TD text display, 6 lines"],
  ["6EP3320-6SB00-0AY0","Power supplies","LOGO!Power 1AC/12VDC/0.9A"],
  ["6EP3321-6SB00-0AY0","Power supplies","LOGO!Power 1AC/12VDC/1.9A"],
  ["6EP3322-6SB00-0AY0","Power supplies","LOGO!Power 1AC/12VDC/4.5A"],
  ["6EP3330-6SB00-0AY0","Power supplies","LOGO!Power 1AC/24VDC/0.6A"],
  ["6EP3331-6SB00-0AY0","Power supplies","LOGO!Power 1AC/24VDC/1.3A"],
  ["6EP3332-6SB00-0AY0","Power supplies","LOGO!Power 1AC/24VDC/2.5A"],
  ["6EP3333-6SB00-0AY0","Power supplies","LOGO!Power 1AC/24VDC/4A"],
  ["6EP3333-6SC00-0AY0","Power supplies","LOGO!Power 1AC/24VDC/4A/EX"],
  ["6AG1331-6SB00-7AY0","Power supplies","SIPLUS LOGO!Power 24V 1.3A"],
  ["6AG1333-6SB00-7AY0","Power supplies","SIPLUS LOGO!Power 24V 4A"],
  ["6ED1058-0BA08-0YA1","Programming software","LOGO! Soft Comfort V8"],
  ["6AG1057-1AA00-0AA2","Mounting accessories","LOGO! 8 TE M button mounting kit"],
  ["6AG1057-1AA00-0AA3","Mounting accessories","LOGO! 4 TE button mounting kit"],
  ["6ED1057-1DA00-0BA0","Mounting accessories","LOGO! TD mounting accessories"],
  ["6EP4683-6LB00-0AY0","Power modules","LOGO! ICL230/1AC100-240V/5A"],
  ["6ED1057-3BA01-0AA8","Starter kits","LOGO! Starter Kit 12/24RCE V8.3"],
  ["6ED1057-3BA03-0AA8","Starter kits","LOGO! Starter Kit 230RCE V8.3"],
  ["6ED1057-3BA11-0AA8","Starter kits","LOGO! TD Starter Kit 12/24 V8.3"],
];
const siemensEt200spExpansionRows = [
  ["6ES7193-6BP00-0BA0","Base units","ET 200SP BaseUnit Type A0, BU15-P16+A0+2B"],
  ["6ES7193-6BP00-0DA0","Base units","ET 200SP BaseUnit Type A0, BU15-P16+A0+2D"],
  ["6ES7193-6BP20-0BA0","Base units","ET 200SP BaseUnit Type A0, BU15-P16+A10+2B"],
  ["6ES7193-6BP20-0DA0","Base units","ET 200SP BaseUnit Type A0, BU15-P16+A10+2D"],
  ["6ES7193-6BP00-0BA1","Base units","ET 200SP BaseUnit Type A1, BU15-P16+A0+2B/T"],
  ["6ES7193-6BP00-0DA1","Base units","ET 200SP BaseUnit Type A1, BU15-P16+A0+2D/T"],
  ["6ES7193-6BP40-0BA1","Base units","ET 200SP BaseUnit Type A1, BU15-P16+A0+12B/T"],
  ["6ES7193-6BP40-0DA1","Base units","ET 200SP BaseUnit Type A1, BU15-P16+A0+12D/T"],
  ["6ES7193-6BP20-0BB0","Base units","ET 200SP BaseUnit Type B0, BU20-P12+A4+0B"],
  ["6ES7193-6BP20-0BB1","Base units","ET 200SP BaseUnit Type B1, BU20-P12+A0+4B, PU 1"],
  ["6ES7193-6BP20-0DC0","Base units","ET 200SP BaseUnit Type C0, BU20-P6+A2+4D"],
  ["6ES7193-6BP20-0BC1","Base units","ET 200SP BaseUnit Type C1, BU20-P6+A2+4B"],
  ["6ES7193-6BP00-0BD0","Base units","ET 200SP BaseUnit Type D0, BU20-P12+A0+0B"],
  ["6ES7193-6BP20-0BF0","Base units","ET 200SP BaseUnit Type F0, BU20-P8+A4+0B"],
  ["6ES7193-6BN00-0NE0","Base units","ET 200SP BaseUnit BU-Send"],
  ["3RK1908-0AP00-0AP0","Base units","ET 200SP BU with infeed 24V and 500V"],
  ["3RK1908-0AP00-0BP0","Base units","ET 200SP BU with infeed 24V"],
  ["3RK1908-0AP00-0CP0","Base units","ET 200SP BU with infeed 500V"],
  ["3RK1908-0AP00-0DP0","Base units","ET 200SP BU without infeed"],
  ["3RK1908-0AP00-0GP0","Base units","ET 200SP BU F-DI-infeed and 500V"],
  ["3RK1908-0AP00-0HP0","Base units","ET 200SP BU F-DI-forwarding infeed 500V"],
  ["3RK1908-0AP00-0JP0","Base units","ET 200SP BU F-DI-forwarding"],
  ["3RK1908-0AP00-0KP0","Base units","ET 200SP BU F-DI-infeed"],
  ["6ES7193-6UP00-0BP1","Base units","ET 200SP PotDis-BU type P1, dark-colored, PU 1"],
  ["6ES7193-6UP00-0BP2","Base units","ET 200SP PotDis-BU type P2, dark-colored, PU 1"],
  ["6ES7193-6UP00-0DP1","Base units","ET 200SP PotDis-BU type P1, light-colored, PU 1"],
  ["6ES7193-6UP00-0DP2","Base units","ET 200SP PotDis-BU type P2, light-colored, PU 1"],
  ["6AG1193-6BP20-2BF0","Base units","SIPLUS ET 200SP BU20-P8+A4+0B"],
  ["6AG1193-6BP20-7DC0","Base units","SIPLUS ET 200SP BU20-P6+A2+4D"],
  ["6AG1193-6BP00-7BA0","Base units","SIPLUS ET 200SP BU15-P16+A0+2B"],
  ["6AG1193-6BP00-7BA1","Base units","SIPLUS ET 200SP BU15-P16+A0+2B/T"],
  ["6AG1193-6BP00-7BD0","Base units","SIPLUS ET 200SP BU20-P12+A0+0B"],
  ["6AG1193-6BP00-7DA0","Base units","SIPLUS ET 200SP BU15-P16+A0+2D"],
  ["6AG1193-6BP00-7DA1","Base units","SIPLUS ET 200SP BU15-P16+A0+2D/T"],
  ["6AG1193-6BP20-7BA0","Base units","SIPLUS ET 200SP BU15-P16+A10+2B"],
  ["6AG1193-6BP20-7BB0","Base units","SIPLUS ET 200SP BU20-P12+A4+0B"],
  ["6AG1193-6BP20-7BB1","Base units","SIPLUS ET 200SP BU20-P12+A0+4B Type B1"],
  ["6AG1193-6BP20-7DA0","Base units","SIPLUS ET 200SP BU15-P16+A10+2D"],
  ["6AG1193-6BP40-7BA1","Base units","SIPLUS ET 200SP BU15-P16+A0+12B/T"],
  ["6AG1193-6BP40-7DA1","Base units","SIPLUS ET 200SP BU15-P16+A0+12D/T"],
  ["6AG2193-6BP00-4BA0","Base units","SIPLUS ET 200SP BU15-P16+A0+2B TX RAIL"],
  ["6AG2193-6BP00-4BD0","Base units","SIPLUS ET 200SP BU20-P12+A0+0B TX RAIL"],
  ["6AG2193-6BP00-4DA0","Base units","SIPLUS ET 200SP BU15-P16+A0+2D TX RAIL"],
  ["6AG2193-6BP00-4DA1","Base units","SIPLUS ET 200SP BU15-P16+A0+2D/T TX RAIL"],
  ["6AG2193-6BP20-4BA0","Base units","SIPLUS ET 200SP BU15-P16+A10+2B TX RAIL"],
  ["6AG2193-6BP20-4BB1","Base units","SIPLUS ET 200SP BU20-P12+A0+4B TX RAIL"],
  ["6AG2193-6BP20-4BF0","Base units","SIPLUS ET 200SP BU20-P8+A4+0B TX RAIL"],
  ["6AG2193-6BP20-4DA0","Base units","SIPLUS ET 200SP BU15-P16+A10+2D TX RAIL"],
  ["6AG2193-6BP20-4DC0","Base units","SIPLUS ET 200SP BU20-P6+A2+4D TX RAIL"],
  ["6ES7193-6AR00-0AA0","Communications modules","ET 200SP Busadapter BA 2xRJ45"],
  ["6ES7193-6AF00-0AA0","Communications modules","ET 200SP Busadapter BA 2xFC"],
  ["6ES7193-6AP00-0AA0","Communications modules","ET 200SP Busadapter BA 2xSCRJ"],
  ["6ES7193-6AP20-0AA0","Communications modules","ET 200SP Busadapter BA SCRJ/RJ45"],
  ["6ES7193-6AP40-0AA0","Communications modules","ET 200SP Busadapter BA SCRJ/FC"],
  ["6ES7193-6AM00-0AA0","Communications modules","SIMATIC Busadapter BA 2xM12"],
  ["6ES7193-6AG00-0AA0","Communications modules","SIMATIC Busadapter BA 2xLC"],
  ["6ES7193-6AG20-0AA0","Communications modules","SIMATIC Busadapter BA LC/RJ45"],
  ["6ES7193-6AG40-0AA0","Communications modules","SIMATIC Busadapter BA LC/FC"],
  ["6ES7193-6AG50-0AA0","Communications modules","SIMATIC Busadapter BA 2xLC-LD"],
  ["6ES7193-6AG60-0AA0","Communications modules","SIMATIC Busadapter BA LC-LD/RJ45"],
  ["6ES7193-6AG70-0AA0","Communications modules","SIMATIC Busadapter BA LC-LD/M12"],
  ["6AG1193-6AG00-2AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xLC"],
  ["6AG1193-6AG20-2AA0","Communications modules","SIPLUS ET 200SP Busadapter BA LC/RJ45"],
  ["6AG1193-6AP00-2AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xSCRJ PN"],
  ["6AG1193-6AF00-7AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xFC PN"],
  ["6AG1193-6AM00-7AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xM12"],
  ["6AG1193-6AR00-7AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xRJ45"],
  ["6AG2193-6AF00-4AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xFC TX RAIL"],
  ["6AG2193-6AM00-4AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xM12 RAIL"],
  ["6AG2193-6AR00-4AA0","Communications modules","SIPLUS ET 200SP Busadapter BA 2xRJ45 TX RAIL"],
];
const siemensEt200spExpansionProducts = siemensEt200spExpansionRows
  .map(([identifier,category,officialDescription])=>({
    manufacturer:"Siemens",identifier,family:"SIMATIC ET 200SP",category,attributes:{officialDescription},
    source:{url:siemensEt200spCatalog,title:"Siemens product overview for SIMATIC ET 200SP expansion hardware (export 2025-10-14)",retrievedOn:"2026-11-02",exportDate:"2025-10-14"},
    simulation:{status:"reference-only",model:null,limitations:"The Siemens export provides this product name and order code only; this application does not simulate or verify its terminal layout, electrical ratings, environmental grade, compatibility, or behavior."},
  }))
  .filter((item)=>{
    const key=`${item.manufacturer}|${item.identifier}`;
    if(siemensKnownIdentifiers.has(key))return false;
    siemensKnownIdentifiers.add(key);
    return true;
  });
const siemensLogo8Known = new Set([...siemensKnownIdentifiers,...siemensEt200spProducts,...siemensEt200spExpansionProducts].map((item)=>`${item.manufacturer}|${item.identifier}`));
const siemensLogo8Products = siemensLogo8Rows
  .map(([identifier,category,officialDescription])=>({
    manufacturer:"Siemens",identifier,family:"LOGO! 8",category,attributes:{officialDescription},
    source:{url:siemensLogo8Catalog,title:"Siemens product overview for LOGO! 8 (export 2025-10-08)",retrievedOn:"2026-11-02",exportDate:"2025-10-08"},
    simulation:{status:"reference-only",model:null,limitations:"The Siemens export provides this product name and order code only; this application does not simulate or verify its terminal layout, electrical ratings, environmental grade, compatibility, or behavior."},
  }))
  .filter((item)=>{
    const key=`${item.manufacturer}|${item.identifier}`;
    if(siemensLogo8Known.has(key))return false;
    siemensLogo8Known.add(key);
    return true;
  });

const siemensEt200alSource = {
  url: "https://mall.industry.siemens.com/tst/Api/Catalog/ExportInformation?catalogItemId=ET200_AL&lang=en",
  title: "Siemens SIMATIC ET 200AL product overview", retrievedOn: "2026-11-24", exportDate: "2025-10-10",
};

const siemensEt200alProducts = [
  ["6ES7157-1AB00-0AB0", "Communications modules", "IM 157-1 interface for PROFINET"],
  ["6ES7157-1AA00-0AB0", "Communications modules", "IM 157-1 interface for PROFIBUS DP"],
  ["6ES7157-1MA00-0AB0", "Communications modules", "IM 157-1 MultiFieldbus interface"],
  ["6ES7141-5AF00-0BA0", "Digital I/O modules", "8 digital inputs across four M12 ports"],
  ["6ES7141-5AH00-0BA0", "Digital I/O modules", "16 digital inputs across eight M12 ports"],
  ["6ES7141-5BF00-0BA0", "Digital I/O modules", "8 digital inputs across eight M8 ports"],
  ["6ES7142-5AF00-0BA0", "Digital I/O modules", "8 digital outputs across eight M12 ports"],
  ["6ES7143-5AF00-0BA0", "Digital I/O modules", "4 configurable digital channels and 4 outputs across four M12 ports"],
  ["6ES7143-5BF00-0BA0", "Digital I/O modules", "4 configurable digital channels and 4 outputs across eight M8 ports"],
  ["6ES7143-5BF50-0BA0", "Digital I/O modules", "8 configurable digital channels across eight M8 ports"],
  ["6ES7143-5AH00-0BA0", "Digital I/O modules", "16 configurable digital channels across eight M12 ports"],
  ["6ES7146-5FF00-0BA0", "Digital I/O modules", "4 fail-safe digital inputs and 2 fail-safe digital outputs across four M12 ports"],
  ["6ES7144-5KD00-0BA0", "Analog I/O modules", "Four analog inputs for voltage, current or resistance temperature sensors"],
  ["6ES7144-5KD50-0BA0", "Analog I/O modules", "Four analog inputs for resistance temperature sensors or thermocouples"],
  ["6ES7145-5ND00-0BA0", "Analog I/O modules", "Four analog outputs for voltage or current"],
  ["6ES7147-5JD00-0BA0", "Communications modules", "IO-Link master with four M12 ports"],
  ["6ES7147-5JD01-0BA0", "Communications modules", "IO-Link master with four M12 ports"],
  ["6ES7147-5JJ00-0BA0", "Communications modules", "IO-Link master with eight M12 ports"],
  ["6ES7141-5BF00-0BL0", "Digital I/O modules", "IO-Link device with 8 digital inputs and M8 ports"],
  ["6ES7141-5AH00-0BL0", "Digital I/O modules", "IO-Link device with 16 digital inputs and M12 ports"],
  ["6ES7142-5AF00-0BL0", "Digital I/O modules", "IO-Link device with 8 digital outputs and M12 ports"],
  ["6ES7143-5BF00-0BL0", "Digital I/O modules", "IO-Link device with 4 configurable digital channels and 4 outputs"],
  ["6ES7143-5AH00-0BL0", "Digital I/O modules", "IO-Link device with 16 configurable digital channels"],
].map(([identifier, category, description]) => ({
  manufacturer: "Siemens", identifier, category, family: "SIMATIC ET 200AL", attributes: { description },
  source: siemensEt200alSource,
  simulation: { status: "reference-only", model: null, limitations: "Manufacturer order reference. Connector wiring, bus communication, device behavior and safety functions are outside the simulation." },
}));

const siemensEt200alCables = [
  ["6ES7194-2LH02-0AA0", 0.19, "Straight"],
  ["6ES7194-2LH03-0AA0", 0.3, "Straight"],
  ["6ES7194-2LH10-0AA0", 1, "Straight"],
  ["6ES7194-2LH20-0AA0", 2, "Straight"],
  ["6ES7194-2LH50-0AA0", 5, "Straight"],
  ["6ES7194-2LN10-0AA0", 10, "Straight"],
  ["6ES7194-2LN15-0AA0", 15, "Straight"],
  ["6ES7194-2MH02-0AA0", 0.19, "Straight"],
  ["6ES7194-2MH03-0AA0", 0.3, "Straight"],
  ["6ES7194-2MH10-0AA0", 1, "Straight"],
  ["6ES7194-2MH20-0AA0", 2, "Straight"],
  ["6ES7194-2MH50-0AA0", 5, "Straight"],
  ["6ES7194-2MN10-0AA0", 10, "Straight"],
  ["6ES7194-2MN15-0AA0", 15, "Straight"],
  ["6ES7194-2LH03-0AB0", 0.3, "Angled"],
  ["6ES7194-2LH10-0AB0", 1, "Angled"],
  ["6ES7194-2LH20-0AB0", 2, "Angled"],
  ["6ES7194-2LH50-0AB0", 5, "Angled"],
  ["6ES7194-2LN10-0AB0", 10, "Angled"],
  ["6ES7194-2LN15-0AB0", 15, "Angled"],
  ["6ES7194-2MH03-0AB0", 0.3, "Angled"],
  ["6ES7194-2MH10-0AB0", 1, "Angled"],
  ["6ES7194-2MH20-0AB0", 2, "Angled"],
  ["6ES7194-2MH50-0AB0", 5, "Angled"],
  ["6ES7194-2MN10-0AB0", 10, "Angled"],
  ["6ES7194-2MN15-0AB0", 15, "Angled"],
  ["6ES7194-2LH20-0AC0", 2, ""],
  ["6ES7194-2LH50-0AC0", 5, ""],
  ["6ES7194-2LN10-0AC0", 10, ""],
  ["6ES7194-2LN15-0AC0", 15, ""],
  ["6ES7194-2MH20-0AC0", 2, ""],
  ["6ES7194-2MH50-0AC0", 5, ""],
  ["6ES7194-2MN10-0AC0", 10, ""],
  ["6ES7194-2MN15-0AC0", 15, ""],
  ["6ES7194-2LH02-0AD0", 0.2, ""],
  ["6ES7194-2MH02-0AD0", 0.2, ""],
].map(([identifier, lengthM, termination]) => ({
  manufacturer: "Siemens", identifier, category: "Accessories", family: "SIMATIC ET 200AL interconnect",
  attributes: {
    description: "ET-Connection interconnect cable",
    lengthM,
    ...(termination && { termination }),
  },
  source: siemensEt200alSource,
  simulation: { status: "reference-only", model: null, limitations: "Manufacturer order reference. Connector pinout and bus transmission are outside the simulation." },
}));

const siemensEt200alPowerCables = [
  ["6ES7194-2LH02-1AA0", 0.19, "Straight"],
  ["6ES7194-2LH03-1AA0", 0.3, "Straight"],
  ["6ES7194-2LH10-1AA0", 1, "Straight"],
  ["6ES7194-2LH20-1AA0", 2, "Straight"],
  ["6ES7194-2LH50-1AA0", 5, "Straight"],
  ["6ES7194-2LN10-1AA0", 10, "Straight"],
  ["6ES7194-2LN15-1AA0", 15, "Straight"],
  ["6ES7194-2MH02-1AA0", 0.19, "Straight"],
  ["6ES7194-2MH03-1AA0", 0.3, "Straight"],
  ["6ES7194-2MH10-1AA0", 1, "Straight"],
  ["6ES7194-2MH20-1AA0", 2, "Straight"],
  ["6ES7194-2MH50-1AA0", 5, "Straight"],
  ["6ES7194-2MN10-1AA0", 10, "Straight"],
  ["6ES7194-2MN15-1AA0", 15, "Straight"],
  ["6ES7194-2LH03-1AB0", 0.3, "Angled"],
  ["6ES7194-2LH10-1AB0", 1, "Angled"],
  ["6ES7194-2LH20-1AB0", 2, "Angled"],
  ["6ES7194-2LH50-1AB0", 5, "Angled"],
  ["6ES7194-2LN10-1AB0", 10, "Angled"],
  ["6ES7194-2LN15-1AB0", 15, "Angled"],
  ["6ES7194-2MH03-1AB0", 0.3, "Angled"],
  ["6ES7194-2MH10-1AB0", 1, "Angled"],
  ["6ES7194-2MH20-1AB0", 2, "Angled"],
  ["6ES7194-2MH50-1AB0", 5, "Angled"],
  ["6ES7194-2MN10-1AB0", 10, "Angled"],
  ["6ES7194-2MN15-1AB0", 15, "Angled"],
  ["6ES7194-2LH20-1AC0", 2, ""],
  ["6ES7194-2LH50-1AC0", 5, ""],
  ["6ES7194-2LN10-1AC0", 10, ""],
  ["6ES7194-2LN15-1AC0", 15, ""],
  ["6ES7194-2MH20-1AC0", 2, ""],
  ["6ES7194-2MH50-1AC0", 5, ""],
  ["6ES7194-2MN10-1AC0", 10, ""],
  ["6ES7194-2MN15-1AC0", 15, ""],
].map(([identifier, lengthM, termination]) => ({
  manufacturer: "Siemens", identifier, category: "Accessories", family: "SIMATIC ET 200AL power cabling",
  attributes: { description: "M8 supply cable", lengthM, ...(termination && { termination }) },
  source: siemensEt200alSource,
  simulation: { status: "reference-only", model: null, limitations: "Manufacturer order reference. Pinout, cable impedance, and current ratings are outside the simulation." },
}));

const unifiedComfortSource = {
  url: "https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=UnifiedComfortPanel&lang=en",
  title: "Siemens SIMATIC HMI Unified Comfort Panels product overview",
  exportDate: "2025-10-01", retrievedOn: "2026-11-24",
};
const unifiedComfortPanels = [
  ["6AV2128-3GB06-0AX1", "MTP700", "Standard"],
  ["6AV2128-3GB36-0AX1", "MTP700", "Neutral"],
  ["6AV2128-3GB40-0AX0", "MTP700", "Hygienic"],
  ["6AV2128-3GB70-0AX0", "MTP700", "Hygienic Neutral"],
  ["6AV2128-3KB06-0AX1", "MTP1000", "Standard"],
  ["6AV2128-3KB36-0AX1", "MTP1000", "Neutral"],
  ["6AV2128-3KB40-0AX0", "MTP1000", "Hygienic"],
  ["6AV2128-3KB70-0AX0", "MTP1000", "Hygienic Neutral"],
  ["6AV2128-3MB06-0AX1", "MTP1200", "Standard"],
  ["6AV2128-3MB36-0AX1", "MTP1200", "Neutral"],
  ["6AV2128-3MB40-0AX0", "MTP1200", "Hygienic"],
  ["6AV2128-3MB70-0AX0", "MTP1200", "Hygienic Neutral"],
  ["6AV2128-3QB06-0AX1", "MTP1500", "Standard"],
  ["6AV2128-3QB36-0AX1", "MTP1500", "Neutral"],
  ["6AV2128-3QB40-0AX0", "MTP1500", "Hygienic"],
  ["6AV2128-3QB70-0AX0", "MTP1500", "Hygienic Neutral"],
  ["6AV2128-3UB06-0AX1", "MTP1900", "Standard"],
  ["6AV2128-3UB36-0AX1", "MTP1900", "Neutral"],
  ["6AV2128-3UB40-0AX0", "MTP1900", "Hygienic"],
  ["6AV2128-3UB70-0AX0", "MTP1900", "Hygienic Neutral"],
  ["6AV2128-3XB06-0AX1", "MTP2200", "Standard"],
  ["6AV2128-3XB36-0AX1", "MTP2200", "Neutral"],
  ["6AV2128-3XB40-0AX0", "MTP2200", "Hygienic"],
  ["6AV2128-3XB70-0AX0", "MTP2200", "Hygienic Neutral"],
].map(([identifier, panel, variant]) => ({
  manufacturer: "Siemens", identifier, category: "HMI devices", family: "SIMATIC Unified Comfort",
  attributes: { panel, variant }, source: unifiedComfortSource,
  simulation: { status: "reference-only", model: null, limitations: "Manufacturer order reference. Panel wiring, display hardware, and vendor HMI runtime are outside the simulation." },
}));

const mitsubishiControllerReferences = [
  {
    family:"MELSEC iQ-F", url:"https://dl.mitsubishielectric.com/dl/fa/document/manual/plcf/sh082452eng/sh082452engp.pdf",
    identifiers:[
      "FX5U-32MR/ES", "FX5S-30MR/ES", "FX5S-30MT/ES", "FX5S-30MT/ESS", "FX5S-40MR/ES",
      "FX5S-40MT/ES", "FX5S-40MT/ESS", "FX5S-60MR/ES", "FX5S-60MT/ES", "FX5S-60MT/ESS",
      "FX5S-80MR/ES", "FX5S-80MT/ES", "FX5S-80MT/ESS", "FX5S-30MR/DS", "FX5S-30MT/DSS",
      "FX5S-40MR/DS", "FX5S-40MT/DS", "FX5S-40MT/DSS", "FX5S-60MR/DS", "FX5S-60MT/DS",
      "FX5S-80MR/DS", "FX5S-80MT/DS", "FX5S-80MT/DSS", "FX5UJ-24MR/ES", "FX5UJ-24MT/ES",
      "FX5UJ-24MT/ESS", "FX5UJ-40MR/ES", "FX5UJ-40MT/ES", "FX5UJ-40MT/ESS", "FX5UJ-60MT/ES",
      "FX5UJ-60MT/ESS", "FX5UJ-24MR/DS", "FX5UJ-24MT/DS", "FX5UJ-24MT/DSS", "FX5UJ-40MR/DS",
      "FX5UJ-40MT/DS", "FX5UJ-40MT/DSS", "FX5UJ-60MR/DS", "FX5UJ-60MT/DS", "FX5UJ-60MT/DSS",
      "FX5U-32MT/ES", "FX5U-32MT/ESS", "FX5U-64MR/ES", "FX5U-64MT/ES", "FX5U-64MT/ESS",
      "FX5U-80MR/ES", "FX5U-80MT/ES", "FX5U-80MT/ESS", "FX5U-32MR/DS", "FX5U-32MT/DS",
      "FX5U-32MT/DSS", "FX5U-64MR/DS", "FX5U-64MT/DS", "FX5U-64MT/DSS", "FX5U-80MR/DS",
      "FX5U-80MT/DS", "FX5U-80MT/DSS", "FX5UC-32MT/D", "FX5UC-32MT/DSS", "FX5UC-32MT/DS-TS",
      "FX5UC-32MT/DSS-TS", "FX5UC-32MR/DS-TS", "FX5UC-64MT/D", "FX5UC-64MT/DSS", "FX5UC-96MT/D",
      "FX5UC-96MT/DSS",
    ],
  },
  {
    family:"MELSEC iQ-R", url:"https://www.mitsubishielectric.com/fa/products/cnt/plcr/pmerit/cpu/cpu.html",
    identifiers:[
      "R04CPU", "R08CPU", "R16CPU", "R32CPU", "R120CPU",
      "R00CPU", "R01CPU", "R02CPU", "R04ENCPU", "R08ENCPU",
      "R16ENCPU", "R32ENCPU", "R120ENCPU",
    ],
  },
  {
    family:"MELSEC Q", url:"https://fa-faq.mitsubishielectric.com/fa/products/cnt/plcq/pmerit/cpu/",
    identifiers:[
      "Q26UDVCPU", "Q13UDVCPU", "Q06UDVCPU", "Q04UDVCPU", "Q03UDVCPU",
      "Q100UDEHCPU", "Q50UDEHCPU", "Q02UCPU", "Q01UCPU", "Q00UCPU",
      "Q00UJCPU",
    ],
  },
  {
    family:"MELSEC L", url:"https://www.mitsubishielectric.com/fa/products/cnt/plcl/pmerit/cpu/index.html",
    identifiers:[
      "L02CPU", "L02CPU-P", "L06CPU", "L06CPU-P", "L26CPU",
      "L26CPU-P", "L26CPU-BT", "L26CPU-PBT",
    ],
  },
].flatMap(({ family, url, identifiers }) => identifiers.map((identifier) => ({
  manufacturer:"Mitsubishi Electric", identifier, family, category:"PLC controllers",
  attributes:{ description:`${family} programmable controller CPU` },
  source:{ url, title:`Mitsubishi Electric ${family} CPU specifications`, retrievedOn:"2026-11-28" },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Terminal wiring, physical I/O, and controller runtime are outside this catalog entry." },
})));

const omronControllerReferences = [
  {
    family:"CP2E", url:"https://www.ia.omron.com/products/family/3777/lineup.html",
    identifiers:[
      "CP2E-E14DR-A", "CP2E-E20DR-A", "CP2E-E30DR-A", "CP2E-E40DR-A", "CP2E-E60DR-A",
      "CP2E-N14DR-A", "CP2E-N14DR-D", "CP2E-N14DT-A", "CP2E-N14DT-D", "CP2E-N20DR-A",
      "CP2E-N20DR-D", "CP2E-N20DT-A", "CP2E-N20DT-D", "CP2E-N30DR-A", "CP2E-N30DR-D",
      "CP2E-N30DT-A", "CP2E-N30DT-D", "CP2E-N40DR-A", "CP2E-N40DR-D", "CP2E-N40DT-A",
      "CP2E-N40DT-D", "CP2E-N60DR-A", "CP2E-N60DR-D", "CP2E-N60DT-A", "CP2E-N60DT-D",
      "CP2E-S30DR-A", "CP2E-S30DT-D", "CP2E-S40DR-A", "CP2E-S40DT-D", "CP2E-S60DR-A",
      "CP2E-S60DT-D",
    ],
  },
  {
    family:"CP1L", url:"https://www.ia.omron.com/products/family/1916/lineup.html",
    identifiers:[
      "CP1L-EL20DR-D", "CP1L-EL20DT-D", "CP1L-EM30DR-D", "CP1L-EM30DT-D", "CP1L-EM40DR-D",
      "CP1L-EM40DT-D", "CP1L-L10DR-A", "CP1L-L10DR-D", "CP1L-L10DT-A", "CP1L-L10DT-D",
      "CP1L-L14DR-A", "CP1L-L14DR-D", "CP1L-L14DT-A", "CP1L-L14DT-D", "CP1L-L20DR-A",
      "CP1L-L20DR-D", "CP1L-L20DT-A", "CP1L-L20DT-D", "CP1L-M30DR-A", "CP1L-M30DR-D",
      "CP1L-M30DT-A", "CP1L-M30DT-D", "CP1L-M40DR-A", "CP1L-M40DR-D", "CP1L-M40DT-A",
      "CP1L-M40DT-D", "CP1L-M60DR-A", "CP1L-M60DR-D", "CP1L-M60DT-A", "CP1L-M60DT-D",
    ],
  },
  {
    family:"CP1H", url:"https://www.ia.omron.com/products/family/1778/lineup.html",
    identifiers:[
      "CP1H-X40DR-A", "CP1H-X40DT-D", "CP1H-XA40DR-A", "CP1H-XA40DT-D", "CP1H-Y20DT-D",
    ],
  },
  {
    family:"NX102", url:"https://www.ia.omron.com/products/family/3705/lineup.html",
    identifiers:[
      "NX102-1200", "NX102-1100", "NX102-1000", "NX102-9000", "NX102-1220",
      "NX102-1120", "NX102-1020", "NX102-9020",
    ],
  },
  {
    family:"NX701", url:"https://www.ia.omron.com/products/family/3436/lineup.html",
    identifiers:[
      "NX701-1700", "NX701-1600",
    ],
  },
  {
    family:"CJ2H", url:"https://www.ia.omron.com/products/family/1993/lineup.html",
    identifiers:[
      "CJ2H-CPU68-EIP", "CJ2H-CPU67-EIP", "CJ2H-CPU66-EIP", "CJ2H-CPU65-EIP", "CJ2H-CPU64-EIP",
    ],
  },
  {
    family:"CJ2M", url:"https://www.ia.omron.com/products/family/2712/lineup.html",
    identifiers:[
      "CJ2M-CPU35", "CJ2M-CPU34", "CJ2M-CPU33", "CJ2M-CPU32", "CJ2M-CPU31",
      "CJ2M-CPU15", "CJ2M-CPU14", "CJ2M-CPU13", "CJ2M-CPU12", "CJ2M-CPU11",
    ],
  },
  {
    family:"NX502", url:"https://www.ia.omron.com/products/family/3900/lineup.html",
    identifiers:[
      "NX502-1700", "NX502-1600", "NX502-1500", "NX502-1400", "NX502-1300",
    ],
  },
  {
    family:"NJ101", url:"https://www.ia.omron.com/products/family/3438/lineup.html",
    identifiers:[
      "NJ101-1000", "NJ101-9000",
    ],
  },
  {
    family:"NJ501 Robot", url:"https://www.ia.omron.com/products/family/3798/lineup.html",
    identifiers:[
      "NJ501-R500", "NJ501-R520", "NJ501-R400", "NJ501-R420", "NJ501-R300",
      "NJ501-R320",
    ],
  },
  {
    family:"NJ Database", url:"https://www.ia.omron.com/products/family/3196/lineup.html",
    identifiers:[
      "NJ501-1520", "NJ501-1420", "NJ501-1320", "NJ101-1020", "NJ101-9020",
    ],
  },
  {
    family:"NJ501 Robotics", url:"https://www.ia.omron.com/products/family/3387/lineup.html",
    identifiers:[
      "NJ501-4500", "NJ501-4400", "NJ501-4300", "NJ501-4310", "NJ501-4320",
    ],
  },
  {
    family:"NX1P2", url:"https://www.ia.omron.com/products/family/3650/lineup.html",
    identifiers:[
      "NX1P2-1140DT", "NX1P2-1140DT1", "NX1P2-1040DT", "NX1P2-1040DT1", "NX1P2-9024DT",
      "NX1P2-9024DT1",
    ],
  },
].flatMap(({ family, url, identifiers }) => identifiers.map((identifier) => ({
  manufacturer:"Omron", identifier, family, category:"PLC controllers",
  attributes:{ description:`Omron ${family} CPU unit` },
  source:{ url, title:`Omron ${family} CPU unit lineup`, retrievedOn:"2026-11-28" },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Terminal wiring, physical I/O, and controller runtime are outside this catalog entry." },
})));

const omronWeintekPanelReferences = [
  {
    manufacturer:"Omron", family:"NA Series (-V2)", url:"https://www.ia.omron.com/products/family/3960/lineup.html",
    identifiers:[
      "NA5-15W101B-V2", "NA5-15W101S-V2", "NA5-12W101B-V2", "NA5-12W101S-V2", "NA5-9W001B-V2",
      "NA5-9W001S-V2", "NA5-7W001B-V2", "NA5-7W001S-V2",
    ],
  },
  {
    manufacturer:"Omron", family:"NS-B Series", url:"https://www.ia.omron.com/products/family/3983/lineup.html",
    identifiers:[
      "NB15W-TW01B-V1-S", "NB10W-TW01B-V1-S", "NB7W-TW01B-V1-S",
    ],
  },
  {
    manufacturer:"Omron", family:"NB Series (-V1)", url:"https://www.ia.omron.com/products/family/3894/lineup.html",
    identifiers:[
      "NB7W-TW00B-V1", "NB7W-TW01B-V1", "NB10W-TW01B-V1",
    ],
  },
  {
    manufacturer:"Weintek", family:"cMT X", url:"https://www.weintek.com/Download/Specification",
    identifiers:[
      "cMT1106X", "cMT2058XH", "cMT2078X", "cMT2102X", "cMT2108X2",
      "cMT2128X", "cMT2158X", "cMT2166X", "cMT2168X", "cMT3072XH2",
      "cMT3072XH3", "cMT3072XHT", "cMT3072XP", "cMT3092X", "cMT3102X",
      "cMT3106XM", "cMT3108XH", "cMT3108XP", "cMT3152X", "cMT3162X",
      "cMT3218XP",
    ],
  },
  {
    manufacturer:"Weintek", family:"iP Series", url:"https://www.weintek.com/Download/Specification",
    identifiers:[
      "MT8052iP", "MT8072iP", "MT8106iP",
    ],
  },
].flatMap(({ manufacturer, family, url, identifiers }) => identifiers.map((identifier) => ({
  manufacturer, identifier, family, category:"HMI devices",
  attributes:{ description:`${manufacturer} ${family} operator panel` },
  source:{ url, title:`${manufacturer} ${family} panel ordering information`, retrievedOn:"2026-11-28" },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Panel wiring, physical interfaces, and operator-panel runtime are outside this catalog entry." },
})));

const proFacePanelReferences = [
  {
    family:"GP6000",
    url:"https://www.pro-face.com/otasuke/ql/GP6000_test/GP6000%20Series%20Standard%20Model%20User%20Guide/English/BM_GP6000%20Series%20Standard%20User%20Guide_DD00627115_files/ModelNumbersPartNumbers-97C29D1D.html",
    identifiers:[
      "PFXGP6300TAD", "PFXGP6400TAD", "PFXGP6500TAD", "PFXGP6500TADC",
      "PFXGP6500TAA", "PFXGP6500TMD", "PFXGP6500TMA", "PFXGP6600TAD",
      "PFXGP6600TADC", "PFXGP6600TADFZ26", "PFXGP6600TAA", "PFXGP6600TMD",
      "PFXGP6600TMA",
    ],
  },
  {
    family:"STM6000",
    url:"https://www.pro-face.com/otasuke/ql/STM6000/STM6000%20Series%20Hardware%20Manual/English/STM6000%20Series%20Hardware%20Manual_0000520148_files/ModelNumbersPartNumbersSTEP2_0000520157.html",
    identifiers:[
      "PFXSTM6200WAD", "PFXSTM6200WADE", "PFXSTM6400WAD", "PFXSTM6400WADE",
    ],
  },
  {
    family:"ET6000",
    url:"https://www.pro-face.com/otasuke/files/manual/ql/_ET6000/ET6000%20Series/English/ET6000%20Series%20Hardware%20Manual_0000486555_files/ModelNumbersPartNumbersREF_0000486420.html",
    identifiers:[
      "PFXET6400WAD", "PFXET6500WAD", "PFXET6600WAD", "PFXET6700WAD",
    ],
  },
  {
    family:"SP5000",
    url:"https://www.pro-face.com/otasuke/files/manual/gpproex/new/refer/mergedProjects/welcome/setup_mm_sp5000.htm",
    identifiers:[
      "PFXSP5500TPD", "PFXSP5600TPD", "PFXSP5660TPD", "PFXSP5700TPD",
      "PFXSP5700WCD", "PFXSP5800WCD", "PFXSP5400WAD", "PFXSP5500WAD",
      "PFXSP5600WAD", "PFXSP5600TAD", "PFXSP5490WAD", "PFXSP5690WAD",
      "PFXSP5790WAD",
    ],
  },
  {
    family:"ST6000",
    url:"https://www.pro-face.com/otasuke/files/manual/gpproex/test/WebhelpENG_build_20210118/mergedProjects/welcome/setup_mm_st6000.htm",
    identifiers:[
      "PFXST6200WADE", "PFXST6400WADE", "PFXST6500WADE", "PFXST6600WADE",
      "PFXST6700WADE",
    ],
  },
].flatMap(({ family, url, identifiers }) => identifiers.map((identifier) => ({
  manufacturer:"Pro-face", identifier, family, category:"HMI devices",
  attributes:{ description:family === "SP5000" ? "HMI display module" : "HMI operator panel" },
  source:{ url, title:`Pro-face ${family} model numbers`, retrievedOn:"2026-11-24" },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Panel wiring, physical interfaces, and operator-panel runtime are outside this catalog entry." },
})));

const beckhoffSignalTerminalReferences = [
  {
    category:"Digital I/O modules", signal:"digital input",
    url:"https://www.beckhoff.com/en-us/products/i-o/ethercat-terminals/el-ed1xxx-digital-input/tabular-product-overview/",
    identifiers:[
      "EL1252-0050", "EL1124", "EL1262-0010", "EL1262-0050", "EL1252-0060", "EL1144",
      "EL1002", "EL1004", "EL1008", "EL1809", "EL1004-0020", "EL1409",
      "EL1104", "EL1429", "EL1024", "EL1804", "EL1808", "EL1084",
      "EL1088", "EL1889", "EL1489", "EL1859", "EL1852", "EL1862",
      "EL1862-0010", "EL1417", "EL1012", "EL1014", "EL1018", "EL1899",
      "EL1252-0010", "EL1034", "EL1819", "EL1114", "EL1814", "EL1094",
      "EL1098", "EL1872", "EL1872-0010", "EL1202", "EL1252", "EL1254",
      "EL1258", "EL1259", "EL1262", "EL1264", "EL1258-0010", "EL1502",
      "EL1512", "EL1904", "EL1918", "EL1134", "EL1712", "EL1712-0020",
      "EL1702", "EL1722", "EL1702-0020", "EL1382", "EL1052", "EL1054",
      "ELX1052", "ELX1054", "ELX1058", "ED1008", "ED1809", "ED1829",
      "ED1889", "ED1859", "ED1839", "ED1837", "ED1897", "ED1819",
    ],
  },
  {
    category:"Digital I/O modules", signal:"digital output",
    url:"https://www.beckhoff.com/en-us/products/i-o/ethercat-terminals/el-ed2xxx-digital-output/tabular-product-overview/",
    identifiers:[
      "EL2124", "EL2024-0010", "EL2002", "EL2004", "EL2008", "EL2809",
      "EL2409", "EL2407", "EL2014", "EL2068", "EL2819", "EL2869",
      "EL2808", "EL2084", "EL2088", "EL2889", "EL2489", "EL2878-0005",
      "EL2872", "EL2872-0010", "EL2022", "EL2024", "EL2828", "EL2032",
      "EL2034", "EL2838", "EL2044", "EL2042", "EL2202", "EL2202-0100",
      "EL2212", "EL2252", "EL2258", "EL2262", "ELX2002", "ELX2008",
      "ELX2792", "EL2911", "EL2912", "EL2904", "EL2784", "EL2788",
      "EL2794", "EL2798", "EL2602", "EL2602-0010", "EL2612", "EL2622",
      "EL2624", "EL2622-0010", "EL2634", "EL2652", "EL2712", "EL2722",
      "EL2502", "EL2502-0010", "EL2535", "EL2535-0002", "EL2535-0005", "EL2535-0050",
      "EL2535-0100", "EL2535-0103", "EL2521", "EL2522", "EL2521-0024", "EL2521-0025",
      "EL2521-0124", "EL2564", "EL2564-0010", "EL2574", "EL2595", "EL2596",
      "EL2596-0010", "EL2642", "ELM2742-0000", "ELM2744-0000", "ELM2642-0000", "ELM2644-0000",
      "ED2008", "ED2809", "ED2807", "ED2889", "ED2887", "ED2032",
      "ED2034", "ED2828", "ED2838", "ED2504",
    ],
  },
  {
    category:"Analog I/O modules", signal:"analog output",
    url:"https://www.beckhoff.com/en-us/products/i-o/ethercat-terminals/el-ed4xxx-analog-output/tabular-product-overview/",
    identifiers:[
      "EL4001", "EL4002", "EL4004", "EL4008", "EL4102", "EL4104",
      "EL4031", "EL4032", "EL4034", "EL4038", "EL4132", "EL4134",
      "EL4732", "EL4011", "EL4012", "EL4014", "EL4018", "EL4112",
      "EL4114", "EL4712", "EL4021", "EL4022", "EL4024", "EL4028",
      "EL4122", "EL4124", "EL4072", "EL4074", "EL4078", "EL4172",
      "EL4374", "EL4112-0010", "ELX4181", "ELX4154", "ELX4184", "ED4072",
      "ED4074", "ED4078", "ED4172", "ED4174",
    ],
  },
].flatMap(({ category, signal, url, identifiers }) => identifiers.map((identifier) => ({
  manufacturer:"Beckhoff", identifier, family:identifier.replace(/(\d)\d{3}(?:-\d{4})?$/, "$1xxx"), category,
  attributes:{ description:`EtherCAT ${signal} terminal` },
  source:{ url, title:`Beckhoff EtherCAT ${signal} terminal product overview`, retrievedOn:"2026-11-24" },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Terminal wiring, signal behavior and EtherCAT operation are outside this catalog entry." },
})));

const beckhoffAnalogInputReferences = [
  ["EL3xxx", [
    "EL3061", "EL3062", "EL3064", "EL3068", "EL3161", "EL3162",
    "EL3164", "EL3001", "EL3002", "EL3004", "EL3008", "EL3101",
    "EL3102", "EL3104", "EL3602", "EL3702", "EL3602-0010", "EL3702-0015",
    "EL3602-0002", "EL3062-0030", "EL3041", "EL3042", "EL3044", "EL3048",
    "EL3141", "EL3142", "EL3144", "EL3142-0010", "EL3184", "EL3011",
    "EL3012", "EL3014", "EL3111", "EL3112", "EL3114", "EL3612",
    "EL3742", "EL3182", "EL3051", "EL3052", "EL3054", "EL3058",
    "EL3151", "EL3152", "EL3154", "EL3021", "EL3022", "EL3024",
    "EL3121", "EL3122", "EL3124", "EL3621-0020", "EL3124-0090", "EL3112-0011",
    "EL3072", "EL3074", "EL3078", "EL3172", "EL3174", "EL3172-0020",
    "EL3174-0002", "EL3174-0090", "EL3174-0032", "EL3008-0003", "EL3008-0005", "EL3174-0042",
    "EL3751", "EL3751-0004", "EL3751-0024", "EL3201", "EL3202", "EL3204",
    "EL3208", "EL3201-0010", "EL3202-0010", "EL3204-0162", "EL3208-0010", "EL3204-0200",
    "EL3214", "EL3218", "EL3214-0090", "EL3311", "EL3312", "EL3314",
    "EL3318", "EL3314-0002", "EL3314-0010", "EL3314-0090", "EL3314-0092", "EL3351",
    "EL3356", "EL3356-0010", "EL3356-0090", "EL3681", "EL3692", "EL3255",
    "EL3632", "EL3403", "EL3423", "EL3443", "EL3446", "EL3443-0010",
    "EL3446-0011", "EL3443-0011", "EL3443-0013", "EL3475", "EL3443-0020", "EL3444",
    "EL3475-0200", "EL3453", "EL3453-0020", "EL3453-0100", "EL3483", "EL3483-0060",
    "EL3773", "EL3783", "EL3783-0100",
  ]],
  ["ELM3xxx", [
    "ELM3002-0000", "ELM3004-0000", "ELM3002-0205", "ELM3002-0305", "ELM3002-0405", "ELM3102-0000",
    "ELM3104-0000", "ELM3104-0020", "ELM3146-0000", "ELM3142-0000", "ELM3144-0000", "ELM3148-0000",
    "ELM3102-0100", "ELM3702-0000", "ELM3704-0000", "ELM3702-0101", "ELM3704-0001", "ELM3704-0020",
    "ELM3244-0000", "ELM3246-0000", "ELM3344-0000", "ELM3348-0000", "ELM3344-0003", "ELM3348-0003",
    "ELM3704-1001", "ELM3502-0000", "ELM3504-0000", "ELM3542-0000", "ELM3544-0000", "ELM3602-0000",
    "ELM3604-0000", "ELM3602-0002", "ELM3604-0002",
  ]],
  ["ELX3xxx", [
    "ELX3181", "ELX3152", "ELX3184", "ELX3158", "ELX3152-0090", "ELX3202",
    "ELX3204", "ELX3202-0090", "ELX3204-0090", "ELX3312", "ELX3314", "ELX3312-0090",
    "ELX3314-0090", "ELX3351", "ELX3252", "ELX3351-0090", "ELX3632",
  ]],
  ["ED3xxx", [
    "ED3072", "ED3074", "ED3078", "ED3172", "ED3174", "ED3274",
    "ED3361", "ED3362", "ED3361-0100", "ED3362-0100",
  ]],
].flatMap(([family, identifiers]) => identifiers.map((identifier) => ({
  manufacturer:"Beckhoff", identifier, family, category:"Analog I/O modules",
  attributes:{ description:"EtherCAT analog input terminal", direction:"input" },
  source:{
    url:"https://www.beckhoff.com/en-us/products/i-o/ethercat-terminals/el-ed3xxx-analog-input/tabular-product-overview/",
    title:"Beckhoff EL/ED3xxx EtherCAT analog input terminal product overview",
    retrievedOn:"2026-11-24",
  },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Terminal wiring, signal scaling, measurements and EtherCAT operation are outside this catalog entry." },
})));

const phoenixTerminalBlockReferences = [
  ["3208100","PT 1,5/S"],
  ["3208139","PT 1,5/S PE"],
  ["3208155","PT 1,5/S-TWIN"],
  ["3208197","PT 1,5/S-QUATTRO"],
  ["3211757","PT 4"],
  ["3211766","PT 4-PE"],
  ["3211903","PT 4-HESILED 24"],
  ["3211771","PT 4-TWIN"],
  ["3211797","PT 4-QUATTRO"],
  ["1078960","PTV 2,5"],
  ["1078962","PTV 2,5 BU"],
  ["1078963","PTV 2,5-PE"],
  ["1078966","PTV 2,5-TWIN"],
  ["1078971","PTV 2,5-TWIN BU"],
  ["1078991","PTV 2,5-TWIN-PE"],
  ["1078999","PTV 2,5-QUATTRO"],
  ["1079006","PTV 2,5-QUATTRO BU"],
  ["1079012","PTV 2,5-QUATTRO-PE"],
  ["1079072","PTV 2,5-QUATTRO-TG"],
  ["1079070","PTV 2,5-QUATTRO-MT"],
  ["1088728","PTV 4"],
  ["1088729","PTV 4 BU"],
  ["1088730","PTV 4-PE"],
  ["1088739","PTV 4-MT"],
  ["1088741","PTV 4-TG"],
  ["1088742","PTV 4-HESI"],
  ["1088743","PTV 4-HESILED 24"],
  ["1088745","PTV 4-HESILA 250"],
  ["1088731","PTV 4-TWIN"],
  ["1088732","PTV 4-TWIN BU"],
  ["1088733","PTV 4-TWIN-PE"],
  ["1088734","PTV 4-QUATTRO"],
  ["1088735","PTV 4-QUATTRO BU"],
  ["1088736","PTV 4-QUATTRO-PE"],
  ["3044076","UT 2,5"],
  ["3044092","UT 2,5-PE"],
  ["3044513","UT 2,5-TWIN"],
  ["3044542","UT 2,5-QUATTRO"],
  ["3044665","UTTB 2,5-PE","https://www.phoenixcontact.com/en-us/products/ground-terminal-block-uttb-25-pe-3044665"],
  ["3214259","UT 2,5-3L"],
  ["3044102","UT 4"],
  ["3044128","UT 4-PE"],
  ["3046032","UT 4-HESI"],
  ["3046090","UT 4-HESILED 24"],
  ["3044364","UT 4-TWIN"],
  ["3044571","UT 4-QUATTRO"],
  ["3044131","UT 6"],
].map(([identifier, family, productUrl]) => ({
  manufacturer:"Phoenix Contact", identifier, family, category:"Terminal systems",
  attributes:{ description:`Phoenix Contact ${family} terminal block` },
  source:{
    url:productUrl ?? "https://assets.phoenixcontact.com/file/85eab754-99c0-4560-ba25-7907a3899b46/media/original?CCC_QuickReferenceGuide_A4_2020_LR.pdf=",
    title:productUrl ? "Phoenix Contact UTTB 2,5-PE product data" : "Phoenix Contact Quick Reference Guide · Modular Terminal Blocks",
    retrievedOn:"2026-11-24",
  },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Conductor paths, ratings, disconnection and fuse behavior are outside this catalog entry." },
}));

const rockwellControlLogixReferences = [
  ["ControlLogix 5590", [
    "1756-L902TS", "1756-L905TS", "1756-L908TS", "1756-L915TS", "1756-L925TS",
    "1756-L950TS", "1756-L980TS", "1756-L902TSXT", "1756-L905TSXT", "1756-L908TSXT",
    "1756-L915TSXT", "1756-L925TSXT", "1756-L950TSXT", "1756-L980TSXT", "1756-L905TPSXT",
    "1756-L915TPSXT", "1756-L950TPSXT", "1756-L980TPSXT",
  ]],
  ["ControlLogix 5580", [
    "1756-L81E", "1756-L82E", "1756-L83E", "1756-L84E", "1756-L85E",
    "1756-L81EK", "1756-L82EK", "1756-L83EK", "1756-L84EK", "1756-L85EK",
    "1756-L81EXT", "1756-L82EXT", "1756-L83EXT", "1756-L84EXT", "1756-L85EXT",
    "1756-L81E-NSE", "1756-L82E-NSE", "1756-L83E-NSE", "1756-L84E-NSE", "1756-L85E-NSE",
    "1756-L81E-NSEXT", "1756-L82E-NSEXT", "1756-L83E-NSEXT", "1756-L84E-NSEXT", "1756-L85E-NSEXT",
    "1756-L81EP", "1756-L83EP", "1756-L85EP", "1756-L81EPXT", "1756-L83EPXT",
    "1756-L85EPXT",
  ]],
  ["GuardLogix 5580", [
    "1756-L81ES", "1756-L82ES", "1756-L83ES", "1756-L84ES", "1756-L85ES",
    "1756-L81ESK", "1756-L82ESK", "1756-L83ESK", "1756-L84ESK", "1756-L81EXTS",
    "1756-L82EXTS", "1756-L83EXTS", "1756-L84EXTS", "1756-L81ESXT", "1756-L82ESXT",
    "1756-L83ESXT", "1756-L84ESXT",
  ]],
  ["ControlLogix 5570", [
    "1756-L71", "1756-L72", "1756-L73", "1756-L74", "1756-L75",
    "1756-L71K", "1756-L72K", "1756-L73K", "1756-L74K", "1756-L75K",
    "1756-L73XT", "1756-L72EROM", "1756-L73EROM",
  ]],
  ["GuardLogix 5570", [
    "1756-L71S", "1756-L72S", "1756-L73S", "1756-L71SK", "1756-L72SK",
    "1756-L73SK", "1756-L73SXT", "1756-L72EROMS", "1756-L73EROMS",
  ]],
].flatMap(([family, identifiers]) => identifiers.map((identifier) => ({
  manufacturer:"Rockwell Automation", identifier, family, category:"PLC controllers",
  attributes:{ description:`Allen-Bradley ${family} controller` },
  source:{
    url:"https://literature.rockwellautomation.com/idc/groups/literature/documents/td/1756-td001_-en-p.pdf",
    title:"Rockwell Automation publication 1756-TD001 · Controller catalog numbers",
    retrievedOn:"2026-11-28",
  },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Controller runtime, physical I/O, safety functions and safety validation are outside this catalog entry." },
})));

const rockwellCompactLogixReferences = [
  ["CompactLogix 5380", [
    "5069-L306ER", "5069-L306ERM", "5069-L310ER", "5069-L310ERM",
    "5069-L310ER-NSE", "5069-L320ER", "5069-L320ERM", "5069-L320ERP",
    "5069-L330ER", "5069-L330ERM", "5069-L340ER", "5069-L340ERM",
    "5069-L340ERP", "5069-L350ERM", "5069-L380ERM", "5069-L3100ERM",
    "5069-L310ERMK", "5069-L320ERMK", "5069-L330ERMK", "5069-L350ERMK",
  ]],
  ["Compact GuardLogix 5380 SIL 2", [
    "5069-L306ERS2", "5069-L306ERMS2", "5069-L310ERS2", "5069-L310ERMS2",
    "5069-L320ERS2", "5069-L320ERMS2", "5069-L330ERS2", "5069-L330ERMS2",
    "5069-L340ERS2", "5069-L340ERMS2", "5069-L350ERS2", "5069-L350ERMS2",
    "5069-L380ERS2", "5069-L380ERMS2", "5069-L3100ERS2", "5069-L3100ERMS2",
    "5069-L310ERS2K", "5069-L310ERMS2K", "5069-L320ERS2K", "5069-L320ERMS2K",
    "5069-L330ERS2K", "5069-L330ERMS2K", "5069-L350ERS2K", "5069-L350ERMS2K",
  ]],
  ["Compact GuardLogix 5380 SIL 3", [
    "5069-L306ERMS3", "5069-L310ERMS3", "5069-L320ERMS3", "5069-L330ERMS3",
    "5069-L340ERMS3", "5069-L350ERMS3", "5069-L380ERMS3", "5069-L3100ERMS3",
    "5069-L310ERMS3K", "5069-L320ERMS3K", "5069-L330ERMS3K", "5069-L350ERMS3K",
  ]],
  ["CompactLogix 5480", [
    "5069-L430ERMW", "5069-L450ERMW", "5069-4100ERMW", "5069-L4200ERMW",
  ]],
].flatMap(([family, identifiers]) => identifiers.map((identifier) => ({
  manufacturer:"Rockwell Automation", identifier, family, category:"PLC controllers",
  attributes:{ description:`Allen-Bradley ${family} controller` },
  source:{
    url:"https://literature.rockwellautomation.com/idc/groups/literature/documents/td/5069-td002_-en-p.pdf",
    title:"Rockwell Automation publication 5069-TD002 · Controller catalog numbers",
    retrievedOn:"2026-11-24",
  },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Controller runtime, physical I/O, safety functions and safety validation are outside this catalog entry." },
})));

const rockwellMicro800References = [
  ["Micro810", [
    "2080-LC10-12AWA",
    "2080-LC10-12DWD",
    "2080-LC10-12QBB",
    "2080-LC10-12QWB",
  ]],
  ["Micro820", [
    "2080-LC20-20AWB",
    "2080-LC20-20AWBR",
    "2080-LC20-20QBB",
    "2080-LC20-20QBBK",
    "2080-LC20-20QBBR",
    "2080-LC20-20QWB",
    "2080-LC20-20QWBR",
  ]],
  ["Micro820", [
    "2080-L20E-20AWB",
    "2080-L20E-20AWBR",
    "2080-L20E-20QBB",
    "2080-L20E-20QBBK",
    "2080-L20E-20QBBR",
    "2080-L20E-20QWB",
    "2080-L20E-20QWBR",
  ]],
  ["Micro850", [
    "2080-L50E-24AWB",
    "2080-L50E-24QBB",
    "2080-L50E-24QVB",
    "2080-L50E-24QWB",
    "2080-L50E-48AWB",
    "2080-L50E-48QBB",
    "2080-L50E-48QVB",
    "2080-L50E-48QWB",
    "2080-L50E-48QWBK",
  ]],
  ["Micro870", [
    "2080-L70E-24AWB",
    "2080-L70E-24QWB",
    "2080-L70E-24QWBK",
    "2080-L70E-24QWBN",
  ]],
].flatMap(([family, identifiers]) => identifiers.map((identifier) => ({
  manufacturer:"Rockwell Automation", identifier, family, category:"PLC controllers",
  attributes:{ description:`Allen-Bradley ${family} programmable controller` },
  source:{
    url:"https://literature.rockwellautomation.com/idc/groups/literature/documents/td/2080-td001_-en-p.pdf",
    title:"Rockwell Automation Micro800 Programmable Controllers technical data",
    retrievedOn:"2026-11-24",
  },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. Micro800 physical I/O, terminal wiring and controller runtime are outside this catalog entry." },
})));

const rockwellPanelViewReferences = [
  {
    family:"PanelView 800",
    url:"https://literature.rockwellautomation.com/idc/groups/literature/documents/ca/ec-ca100_-en-p.pdf",
    title:"Rockwell Automation Connected Components selection guide · PanelView 800",
    identifiers:[
    "2711R-T4T", "2711R-T7T", "2711R-T10T",
    ],
  },
  {
    family:"PanelView Plus 7 Standard",
    url:"https://literature.rockwellautomation.com/idc/groups/literature/documents/td/2711p-td008_-en-p.pdf",
    title:"Rockwell Automation PanelView Plus 7 Standard Terminals technical data",
    identifiers:[
    "2711P-T4W21D8S", "2711P-T4W22D8S", "2711P-T4W21D8S-B", "2711P-T4W22D8S-B",
    "2711P-T6C21D8S", "2711P-T6C22D8S", "2711P-T6C21D8S-B", "2711P-T6C22D8S-B",
    "2711P-T7C21D8S", "2711P-T7C22D8S", "2711P-T7C21D8S-B", "2711P-T7C22D8S-B",
    "2711P-T9W21D8S", "2711P-T9W22D8S", "2711P-T9W21D8S-B", "2711P-T9W22D8S-B",
    "2711P-T10C21D8S", "2711P-T10C22D8S", "2711P-T10C21D8S-B", "2711P-T10C22D8S-B",
    "2711P-T12W21D8S", "2711P-T12W22D8S", "2711P-T12W21D8S-B", "2711P-T12W22D8S-B",
    "2711P-T15C21D8S", "2711P-T15C22D8S", "2711P-T15C21D8S-B", "2711P-T15C22D8S-B",
    ],
  },
  {
    family:"PanelView Plus 7 Performance",
    url:"https://literature.rockwellautomation.com/idc/groups/literature/documents/td/2711p-td009_-en-p.pdf",
    title:"Rockwell Automation PanelView Plus 7 Performance Terminals technical data",
    identifiers:[
    "2711P-T12W22D9P", "2711P-T7C22D9P", "2711P-B7C22D9P", "2711P-T9W22D9P",
    "2711P-T10C22D9P", "2711P-B10C22D9P", "2711P-T15C22D9P", "2711P-B15C22D9P",
    "2711P-T19C22D9P", "2711P-T7C22D9PK", "2711P-T9W22D9PK", "2711P-T10C22D9PK",
    "2711P-T12W22D9PK", "2711P-T15C22D9PK", "2711P-T19C22D9PK", "2711P-B15C22D9PK",
    "2711P-T7C22D9P-B", "2711P-B7C22D9P-B", "2711P-T9W22D9P-B", "2711P-T10C22D9P-B",
    "2711P-B10C22D9P-B", "2711P-T12W22D9P-B", "2711P-T15C22D9P-B", "2711P-B15C22D9P-B",
    "2711P-T19C22D9P-B", "2711P-T7C22A9P", "2711P-B7C22A9P", "2711P-T9W22A9P",
    "2711P-T10C22A9P", "2711P-B10C22A9P", "2711P-T12W22A9P", "2711P-T15C22A9P",
    "2711P-B15C22A9P", "2711P-T19C22A9P", "2711P-T7C22A9P-B", "2711P-B7C22A9P-B",
    "2711P-T9W22A9P-B", "2711P-T10C22A9P-B", "2711P-B10C22A9P-B", "2711P-T12W22A9P-B",
    "2711P-T15C22A9P-B", "2711P-B15C22A9P-B", "2711P-T19C22A9P-B",
    ],
  },
].flatMap(({ family, url, title, identifiers }) => identifiers.map((identifier) => ({
  manufacturer:"Rockwell Automation", identifier, family, category:"HMI devices",
  attributes:{ description:`Allen-Bradley ${family} operator terminal` },
  source:{ url, title, retrievedOn:"2026-11-24" },
  simulation:{ status:"reference-only", model:null, limitations:"Reference for product lookup. PanelView terminal wiring, physical interfaces and runtime are outside this catalog entry." },
})));

const unifiedPanelOperatingReferences = [
  ["6AV2123-3DB32-0AW0", "MTP400", "Basic", "Standard", 4, "siemensMtp400UnifiedBasic"],
  ["6AV2123-3GB32-0AW0", "MTP700", "Basic", "Standard", 7, "siemensMtp700UnifiedBasic"],
  ["6AV2123-3KB32-0AW0", "MTP1000", "Basic", "Standard", 10, "siemensMtp1000UnifiedBasic"],
  ["6AV2123-3MB32-0AW0", "MTP1200", "Basic", "Standard", 12, "siemensMtp1200UnifiedBasic"],
  ["6AV2128-3GB06-0AX0", "MTP700", "Comfort", "Standard", 7],
  ["6AV2128-3GB36-0AX0", "MTP700", "Comfort", "Neutral", 7],
  ["6AV2128-3KB06-0AX0", "MTP1000", "Comfort", "Standard", 10],
  ["6AV2128-3KB36-0AX0", "MTP1000", "Comfort", "Neutral", 10],
  ["6AV2128-3MB06-0AX0", "MTP1200", "Comfort", "Standard", 12],
  ["6AV2128-3MB36-0AX0", "MTP1200", "Comfort", "Neutral", 12],
  ["6AV2128-3QB06-0AX0", "MTP1500", "Comfort", "Standard", 15],
  ["6AV2128-3QB36-0AX0", "MTP1500", "Comfort", "Neutral", 15],
  ["6AV2128-3UB06-0AX0", "MTP1900", "Comfort", "Standard", 19],
  ["6AV2128-3UB36-0AX0", "MTP1900", "Comfort", "Neutral", 19],
  ["6AV2128-3XB06-0AX0", "MTP2200", "Comfort", "Standard", 22],
  ["6AV2128-3XB36-0AX0", "MTP2200", "Comfort", "Neutral", 22],
].map(([identifier, panel, series, variant, displayInches, model]) => ({
  manufacturer: "Siemens", identifier, category: "HMI devices", family: `SIMATIC Unified ${series}`,
  attributes: { panel, variant, displayInches },
  source: {
    url: `https://docs.tia.siemens.cloud/r/unified_${series.toLowerCase()}_panels_enus_21/preface/scope`,
    title: `Siemens Unified ${series} panel operating instructions scope`, retrievedOn: "2026-11-24",
  },
  simulation: model
    ? { status:"educational-model", model, limitations:"Ideal power presence on X80. Display hardware, application runtime, and communication are outside the simulation." }
    : { status:"reference-only", model:null, limitations:"Panel wiring, display hardware, and vendor HMI runtime are outside the simulation." },
}));

const basicKeylessDocument = "https://support.industry.siemens.com/cs/attachments/109780221/hmi_tp400_tp700_tp900_basic_keyless_product_information_en-US.pdf";
const mobilePanelDocument = "https://support.industry.siemens.com/cs/attachments/109477873/hmi_mobile_panels_2nd_generation_product_information_de-DE.pdf";
const basicMobilePanelReferences = [
  ["Basic", basicKeylessDocument, "Siemens Basic Keyless OEM product information", [
    ["6AV2123-2DB03-0AX0", "KTP400 Basic"], ["6AV2123-2GB03-0AX0", "KTP700 Basic"], ["6AV2123-2JB03-0AX0", "KTP900 Basic"],
  ]],
  ["Basic", "https://cache.industry.siemens.com/dl/files/146/109744146/att_1029327/v1/KG_ST80-STPC_Deutsch-2020.pdf", "Siemens ST 80 HMI catalog", [
    ["6AV2123-2MB03-0AX0", "KTP1200 Basic"], ["6AV2123-2MA03-0AX0", "KTP1200 Basic DP"],
  ]],
  ["Basic Keyless OEM", basicKeylessDocument, "Siemens Basic Keyless OEM product information", [
    ["6AV2143-6DB00-0AA0", "TP400 Basic OEM"], ["6AV2143-6GB00-0AA0", "TP700 Basic Keyless"], ["6AV2143-6JB00-0AA0", "TP900 Basic Keyless"],
  ]],
  ["Mobile 2nd Generation", mobilePanelDocument, "Siemens Mobile Panels 2nd Generation product information", [
    ["6AV2125-2DB23-0AX0", "KTP400F Mobile"], ["6AV2125-2GB03-0AX0", "KTP700 Mobile"], ["6AV2125-2GB23-0AX0", "KTP700F Mobile"],
    ["6AV2125-2JB03-0AX0", "KTP900 Mobile"], ["6AV2125-2JB23-0AX0", "KTP900F Mobile"],
  ]],
].flatMap(([series, url, title, panels]) => panels.map(([identifier, panel]) => ({
  manufacturer:"Siemens", identifier, family:`SIMATIC ${panel}`, category:"HMI devices",
  attributes:{ panel, series }, source:{ url, title, retrievedOn:"2026-11-24" },
  simulation:{ status:"reference-only", model:null, limitations:"Panel wiring, display hardware, vendor HMI runtime, and safety interface behavior are outside the simulation." },
})));

const classicComfortPanelReferences = [
  ["KP400", "Keys", 4, ["6AV2124-1DC01-0AX0"]],
  ["KTP400", "Touch and keys", 4, ["6AV2124-2DC01-0AX0"]],
  ["KP700", "Keys", 7, ["6AV2124-1GC01-0AX0"]],
  ["TP700", "Touch", 7, ["6AV2124-0GC01-0AX0"]],
  ["KP900", "Keys", 9, ["6AV2124-1JC01-0AX0"]],
  ["TP900", "Touch", 9, ["6AV2124-0JC01-0AX0"]],
  ["KP1200", "Keys", 12, ["6AV2124-1MC01-0AX0"]],
  ["TP1200", "Touch", 12, ["6AV2124-0MC01-0AX0"]],
  ["KP1500", "Keys", 15, ["6AV2124-1QC02-0AX0", "6AV2124-1QC02-0AX1", "6AV2124-1QC02-0AX2"]],
  ["TP1500", "Touch", 15, ["6AV2124-0QC02-0AX0", "6AV2124-0QC02-0AX1", "6AV2124-0QC02-0AX2"]],
  ["TP1900", "Touch", 19, ["6AV2124-0UC02-0AX0", "6AV2124-0UC02-0AX1"]],
  ["TP2200", "Touch", 22, ["6AV2124-0XC02-0AX0", "6AV2124-0XC02-0AX1"]],
].flatMap(([panel, input, displayInches, identifiers]) => identifiers.map((identifier) => {
  const isV21 = identifier.endsWith("-0AX2");
  return {
    manufacturer:"Siemens", identifier, family:`SIMATIC ${panel} Comfort`, category:"HMI devices",
    attributes:{ panel, input, displayInches, ...(isV21 && { variant:"Comfort V2.1" }) },
    source:{
      url:isV21
        ? "https://support.industry.siemens.com/cs/attachments/download/109822224/hmi_comfort_panels_v2.1_product_information_en-US.pdf"
        : "https://support.industry.siemens.com/cs/attachments/download/49313233/HWComfortPanelsenUS_en-US.pdf",
      title:isV21 ? "Siemens Comfort Panels V2.1 product information" : "Siemens Comfort Panels operating instructions", retrievedOn:"2026-11-24",
    },
    simulation:{ status:"reference-only", model:null, limitations:"Panel wiring, display hardware, and vendor HMI runtime are outside the simulation." },
  };
}));

const legacySiemensCpuReferences = [
  ["S7-400 H", "CPU 412-3H", ["6ES7412-3HJ14-0AB0"]],
  ["S7-400 H", "CPU 414-4H", ["6ES7414-4HJ00-0AB0", "6ES7414-4HJ04-0AB0", "6ES7414-4HM14-0AB0"]],
  ["S7-400 H", "CPU 417-4H", ["6ES7417-4HL00-0AB0", "6ES7417-4HL01-0AB0", "6ES7417-4HL04-0AB0", "6ES7417-4HT14-0AB0"]],
  ["S7-400 H", "CPU 412-5H", ["6ES7412-5HK06-0AB0"]],
  ["S7-400 H", "CPU 414-5H", ["6ES7414-5HM06-0AB0"]],
  ["S7-400 H", "CPU 416-5H", ["6ES7416-5HS06-0AB0"]],
  ["S7-400 H", "CPU 417-5H", ["6ES7417-5HT06-0AB0"]],
  ["S7-400 H", "CPU 410-5H", ["6ES7410-5HX08-0AB0"]],
  ["M7", "CPU 388-4", ["6ES7388-4BN00-0AC0"]],
  ["M7", "CPU 486-3", ["6ES7486-3AA00-0AB0"]],
  ["M7", "CPU 488-3", ["6ES7488-3AA00-0AB0"]],
  ["C7", "C7-626 P/DP", ["6ES7626-DG03-0AE3", "6ES7626-DG04-0AE3"]],
  ["C7", "C7-633 DP", ["6ES7633-2BF01-0AE3", "6ES7633-2BF02-0AE3"]],
  ["C7", "C7-634 DP", ["6ES7634-2BF01-0AE3", "6ES7634-2BF02-0AE3"]],
  ["C7", "C7-635 OP", ["6ES7635-2EC00-0AE3", "6ES7635-2EC01-0AE3", "6ES7635-2EC02-0AE3"]],
  ["C7", "C7-635 TB", ["6ES7635-2EB00-0AE3", "6ES7635-2EB01-0AE3", "6ES7635-2EB02-0AE3"]],
  ["C7", "C7-636 Key", ["6ES7636-2EC00-0AE3"]],
  ["C7", "C7-636 Touch", ["6ES7636-2EB00-0AE3"]],
  ["Distributed Controller", "IM151-7 CPU", ["6ES7151-7AA10-0AB0", "6ES7151-7AA11-0AB0", "6ES7151-7AA13-0AB0", "6ES7151-7AA20-0AB0", "6ES7151-7AA21-0AB0"]],
  ["Distributed Controller", "IM151-7F CPU", ["6ES7151-7FA00-0AB0", "6ES7151-7FA01-0AB0", "6ES7151-7FA20-0AB0", "6ES7151-7FA21-0AB0"]],
  ["Distributed Controller", "IM151-8 PN/DP CPU", ["6ES7151-8AB00-0AB0", "6ES7151-8AB01-0AB0"]],
  ["Distributed Controller", "IM151-8F PN/DP CPU", ["6ES7151-8FB00-0AB0", "6ES7151-8FB01-0AB0"]],
  ["Distributed Controller", "IM154-8 PN/DP CPU", ["6ES7154-8AB01-0AB0"]],
  ["Distributed Controller", "IM154-8F PN/DP CPU", ["6ES7154-8FB01-0AB0"]],
  ["Distributed Controller", "IM154-8FX PN/DP CPU", ["6ES7154-8FX00-0AB0"]],
  ["Distributed Controller", "CPU 1510SP-1 PN", ["6ES7510-1DJ00-0AB0", "6ES7510-1DJ01-0AB0"]],
  ["Distributed Controller", "CPU 1510SP F-1 PN", ["6ES7510-1SJ00-0AB0", "6ES7510-1SJ01-0AB0"]],
  ["Distributed Controller", "CPU 1512SP-1 PN", ["6ES7512-1DK00-0AB0", "6ES7512-1DK01-0AB0"]],
  ["Distributed Controller", "CPU 1512SP F-1 PN", ["6ES7512-1SK00-0AB0", "6ES7512-1SK01-0AB0"]],
  ["Distributed Controller", "CPU 1516PRO-2 PN", ["6ES7516-2PN00-0AB0"]],
  ["Distributed Controller", "CPU 1516PRO F-2 PN", ["6ES7516-2GN00-0AB0"]],
  ["S7-300", "CPU 313C-2 DP", ["6ES7313-6CE00-0AB0", "6ES7313-6CE01-0AB0", "6ES7313-6CF03-0AB0", "6ES7313-6CG04-0AB0"]],
  ["S7-300", "CPU 314C-2 DP", ["6ES7314-6CF00-0AB0", "6ES7314-6CF01-0AB0", "6ES7314-6CF02-0AB0", "6ES7314-6CG03-0AB0", "6ES7314-6CH04-0AB0"]],
  ["S7-300", "CPU 314C-2 PN/DP", ["6ES7314-6EH04-0AB0"]],
  ["S7-300", "CPU 315-2 DP", ["6ES7315-2AF83-0AB0", "6ES7315-2AF03-0AB0", "6ES7315-2AG10-0AB0", "6ES7315-2AH14-0AB0"]],
  ["S7-300", "CPU 315-2 PN/DP", ["6ES7315-2EG10-0AB0", "6ES7315-2EH13-0AB0", "6ES7315-2EH14-0AB0"]],
  ["S7-300", "CPU 315F-2 DP", ["6ES7315-6FF00-0AB0", "6ES7315-6FF01-0AB0", "6ES7315-6FF04-0AB0"]],
  ["S7-300", "CPU 315F-2 PN/DP", ["6ES7315-2FH10-0AB0", "6ES7315-2FH13-0AB0", "6ES7315-2FJ14-0AB0"]],
  ["S7-300", "CPU 316-2 DP", ["6ES7316-2AG00-0AB0"]],
  ["S7-300", "CPU 317-2 DP", ["6ES7317-2AJ10-0AB0", "6ES7317-2AK14-0AB0"]],
  ["S7-300", "CPU 317-2 PN/DP", ["6ES7317-2EJ10-0AB0", "6ES7317-2EK13-0AB0", "6ES7317-2EK14-0AB0"]],
  ["S7-300", "CPU 317F-2 DP", ["6ES7317-6FF00-0AB0", "6ES7317-6FF03-0AB0", "6ES7317-6FF04-0AB0"]],
  ["S7-300", "CPU 317F-2 PN/DP", ["6ES7317-2FJ10-0AB0", "6ES7317-2FK13-0AB0", "6ES7317-2FK14-0AB0"]],
  ["S7-300", "CPU 318-2 DP", ["6ES7318-2AJ00-0AB0"]],
  ["S7-300", "CPU 319-3 PN/DP", ["6ES7318-3EL00-0AB0", "6ES7318-3EL01-0AB0"]],
  ["S7-300", "CPU 319F-3 PN/DP", ["6ES7318-3FL00-0AB0", "6ES7318-3FL01-0AB0"]],
  ["S7-300", "CPU 315T-2 DP", ["6ES7315-6TG10-0AB0", "6ES7315-6TH13-0AB0"]],
  ["S7-300", "CPU 315T-3 PN/DP", ["6ES7315-7TJ10-0AB0"]],
  ["S7-300", "CPU 317T-2 DP", ["6ES7317-6TJ10-0AB0", "6ES7317-6TK13-0AB0"]],
  ["S7-300", "CPU 317T-3 PN/DP", ["6ES7317-7TK10-0AB0"]],
  ["S7-300", "CPU 317TF-2 DP", ["6ES7317-6TF14-0AB0"]],
  ["S7-300", "CPU 317TF-3 PN/DP", ["6ES7317-7UL10-0AB0"]],
  ["S7-400", "CPU 412-1", ["6ES7412-1XF03-0AB0", "6ES7412-1XF04-0AB0", "6ES7412-1XJ05-0AB0", "6ES7412-1XJ07-0AB0"]],
  ["S7-400", "CPU 412-2 DP", ["6ES7412-2XG00-0AB0", "6ES7412-2XG04-0AB0", "6ES7412-2XJ05-0AB0", "6ES7412-2XK07-0AB0"]],
  ["S7-400", "CPU 412-2 PN", ["6ES7412-2EK06-0AB0", "6ES7412-2EK07-0AB0"]],
  ["S7-400", "CPU 414-2 DP", ["6ES7414-2XG03-0AB0", "6ES7414-2XG04-0AB0", "6ES7414-2XK05-0AB0", "6ES7414-2XL07-0AB0"]],
  ["S7-400", "CPU 414-3 DP", ["6ES7414-3XJ00-0AB0", "6ES7414-3XJ04-0AB0", "6ES7414-3XM05-0AB0", "6ES7414-3XM07-0AB0"]],
  ["S7-400", "CPU 414-3 PN/DP", ["6ES7414-3EM05-0AB0", "6ES7414-3EM06-0AB0", "6ES7414-3EM07-0AB0"]],
  ["S7-400", "CPU 414F-3 PN/DP", ["6ES7414-3FM06-0AB0", "6ES7414-3FM07-0AB0"]],
  ["S7-400", "CPU 416-2 DP", ["6ES7416-2XK02-0AB0", "6ES7416-2XK04-0AB0", "6ES7416-2XN05-0AB0", "6ES7416-2XP07-0AB0"]],
  ["S7-400", "CPU 416F-2 DP", ["6ES7416-2FK02-0AB0", "6ES7416-2FK04-0AB0", "6ES7416-2FN05-0AB0", "6ES7416-2FP07-0AB0"]],
  ["S7-400", "CPU 416-3 DP", ["6ES7416-3XL00-0AB0", "6ES7416-3XL04-0AB0", "6ES7416-3XR05-0AB0", "6ES7416-3XS07-0AB0"]],
  ["S7-400", "CPU 416-3 PN/DP", ["6ES7416-3ER05-0AB0", "6ES7416-3ES06-0AB0", "6ES7416-3ES07-0AB0"]],
  ["S7-400", "CPU 416F-3 PN/DP", ["6ES7416-3FR05-0AB0", "6ES7416-3FS06-0AB0", "6ES7416-3FS07-0AB0"]],
  ["S7-400", "CPU 417-4", ["6ES7417-4XL00-0AB0", "6ES7417-4XL04-0AB0", "6ES7417-4XT05-0AB0", "6ES7417-4XT07-0AB0"]],
  ["S7-400", "CPU 410 SMART", ["6ES7410-5HN08-0AB0"]],
  ["S7-400", "CPU 410E", ["6ES7410-5HM08-0AB0"]],
].flatMap(([series, cpu, identifiers]) => identifiers.map((identifier) => ({
  manufacturer: "Siemens", identifier, family: `SIMATIC ${series} ${cpu}`, category: "PLC controllers",
  attributes: { series, cpu, documentedFeature: "S7 routing" },
  source: {
    url: "https://support.industry.siemens.com/cs/attachments/584459/584459_overview_cpus_en.pdf",
    title: "Siemens S7 routing CPU overview, entry 584459", retrievedOn: "2026-11-24",
  },
  simulation: { status: "reference-only", model: null, limitations: "Terminal mapping, CPU firmware, and S7 routing are outside the simulation." },
})));

const siemensG2CpuReferences = [
  ["6ES7212-1BG50-0XB0", "1212C", "AC/DC/RLY", "siemensS71212CG2AcRelay"],
  ["6ES7212-1AG50-0XB0", "1212C", "DC/DC/DC", "siemensS71212CG2"],
  ["6ES7214-1BH50-0XB0", "1214C", "AC/DC/RLY", "siemensS71214CG2AcRelay"],
  ["6ES7214-1AH50-0XB0", "1214C", "DC/DC/DC", "siemensS71214CG2Transistor"],
  ["6ES7214-1HH50-0XB0", "1214C", "DC/DC/RLY", "siemensS71214CG2Relay"],
  ["6ES7212-1AF50-0XB0", "1212FC", "DC/DC/DC"],
  ["6ES7212-1HF50-0XB0", "1212FC", "DC/DC/RLY"],
  ["6ES7214-1AF50-0XB0", "1214FC", "DC/DC/DC"],
  ["6ES7214-1HF50-0XB0", "1214FC", "DC/DC/RLY"],
].map(([identifier, cpu, variant, model]) => ({
  manufacturer:"Siemens", identifier, family:`SIMATIC S7-1200 G2 CPU ${cpu}`, category:"PLC controllers",
  attributes:{ variant, failsafe:cpu.endsWith("FC") },
  source:{
    url:"https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/ordering-information/cpus",
    title:"Siemens SIMATIC S7-1200 G2 CPU ordering information", retrievedOn:"2026-11-24",
  },
  simulation:model
    ? { status:"educational-model", model, limitations:variant === "DC/DC/DC"
      ? "Ideal DC-powered CPU with externally supplied DC inputs and sourcing output power. Vendor firmware and electrical ratings are outside the simulation."
      : `Ideal ${variant.startsWith("AC") ? "AC" : "DC"}-powered CPU with externally supplied DC inputs and relay loads. Vendor firmware and electrical ratings are outside the simulation.` }
    : { status:"reference-only", model:null, limitations:"Manufacturer order reference. Terminal layout, controller firmware and fail-safe functions are outside the simulation." },
}));

const siemensG2ExpansionReferences = [
  ["6ES7223-5BH50-0XB0", "SM 1223", "Digital", { digitalInputs: 8, digitalOutputs: 8, outputType: "24 V DC sourcing" }, "siemensSM1223G2DI8DQ8"],
  ["6ES7223-5PH50-0XB0", "SM 1223", "Digital", { digitalInputs: 8, relayOutputs: 8 }, "siemensSM1223G2DI8Relay8"],
  ["6ES7233-4HF50-0XB0", "SM 1233", "Analog", { analogInputs: 4, analogOutputs: 4 }, "siemensSM1233G2AI4AQ4"],
  ["6ES7221-3BF50-0XB0", "SB 1221", "Digital", { digitalInputs: 8, inputVoltageV: 24, frequencyKHz: 100 }],
  ["6ES7222-5BF50-0XB0", "SB 1222", "Digital", { digitalOutputs: 8, outputVoltageV: 24, frequencyKHz: 100, outputType: "Push-pull" }],
  ["6ES7223-7BF50-0XB0", "SB 1223", "Digital", { digitalInputs: 4, digitalOutputs: 4, ratedVoltageV: 24, frequencyKHz: 100 }],
  ["6ES7223-7AF50-0XB0", "SB 1223", "Digital", { digitalInputs: 4, digitalOutputs: 4, ratedVoltageV: 5, frequencyKHz: 200 }],
  ["6ES7231-4HD50-0XB0", "SB 1231", "Analog", { analogInputs: 4 }],
  ["6ES7232-4HD50-0XB0", "SB 1232", "Analog", { analogOutputs: 4 }],
  ["6ES7233-4HD50-0XB0", "SB 1233", "Analog", { analogInputs: 2, analogOutputs: 2 }],
  ["6ES7231-5QD50-0XB0", "SB 1231", "Analog", { analogInputs: 4, inputType: "Thermocouple" }],
  ["6ES7231-5PB50-0XB0", "SB 1231", "Analog", { analogInputs: 2, inputType: "RTD" }],
].map(([identifier, family, domain, attributes, model]) => {
  const sourceSection = family.startsWith("SB") ? "signal-boards-sbs" : "signal-modules-sms";
  const sourceUrl = ["RTD", "Thermocouple"].includes(attributes.inputType)
    ? "https://docs.tia.siemens.cloud/r/fail_safe_modules_manual_collection_enus_20/device-specific-information/s7-1200-fail-safe-modules/s7-1200-g2-programmable-logic-controller/ordering-information/signal-boards-sbs"
    : `https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/ordering-information/${sourceSection}`;
  return {
    manufacturer: "Siemens", identifier, family: `SIMATIC S7-1200 G2 ${family}`, category: `${domain} I/O modules`,
    attributes,
    source: {
      url: sourceUrl,
      title: `Siemens SIMATIC S7-1200 G2 ${family} ordering information`, retrievedOn: "2026-11-24",
    },
    simulation: model
      ? { status: "educational-model", model, limitations: domain === "Digital" ? "Ideal digital input groups and output switching with a powered linked CPU and the required field supplies." : "Ideal differential input and voltage/current output behavior on a powered linked CPU and module." }
      : { status: "reference-only", model: null, limitations: "Terminal mapping, channel bindings, and electrical behavior are outside the simulation." },
  };
});

const omronVariants = [
  ["T61","Through-beam","15 m","NPN","pre-wired"],["T81","Through-beam","15 m","PNP","pre-wired"],
  ["T62","Through-beam","30 m","NPN","pre-wired"],["T82","Through-beam","30 m","PNP","pre-wired"],
  ["T61A","Through-beam","10 m","NPN","pre-wired"],["T81A","Through-beam","10 m","PNP","pre-wired"],
  ["T66","Through-beam","15 m","NPN","M8 connector"],["T86","Through-beam","15 m","PNP","M8 connector"],
  ["T67","Through-beam","30 m","NPN","M8 connector"],["T87","Through-beam","30 m","PNP","M8 connector"],
  ["T66A","Through-beam","10 m","NPN","M8 connector"],["T86A","Through-beam","10 m","PNP","M8 connector"],
  ["R61","Retro-reflective with MSR","4 m with E39-R1S reflector","NPN","pre-wired"],["R81","Retro-reflective with MSR","4 m with E39-R1S reflector","PNP","pre-wired"],
  ["R66","Retro-reflective with MSR","4 m with E39-R1S reflector","NPN","M8 connector"],["R86","Retro-reflective with MSR","4 m with E39-R1S reflector","PNP","M8 connector"],
  ["D61","Diffuse-reflective","100 mm on 100 × 100 mm white paper","NPN","pre-wired"],["D81","Diffuse-reflective","100 mm on 100 × 100 mm white paper","PNP","pre-wired"],
  ["D62","Diffuse-reflective","1 m on 300 × 300 mm white paper","NPN","pre-wired"],["D82","Diffuse-reflective","1 m on 300 × 300 mm white paper","PNP","pre-wired"],
  ["D66","Diffuse-reflective","100 mm on 100 × 100 mm white paper","NPN","M8 connector"],["D86","Diffuse-reflective","100 mm on 100 × 100 mm white paper","PNP","M8 connector"],
  ["D67","Diffuse-reflective","1 m on 300 × 300 mm white paper","NPN","M8 connector"],["D87","Diffuse-reflective","1 m on 300 × 300 mm white paper","PNP","M8 connector"],
  ["L61","Narrow-beam reflective","90 + 30 mm (datasheet notation)","NPN","pre-wired"],["L81","Narrow-beam reflective","90 + 30 mm (datasheet notation)","PNP","pre-wired"],
  ["L66","Narrow-beam reflective","90 + 30 mm (datasheet notation)","NPN","M8 connector"],["L86","Narrow-beam reflective","90 + 30 mm (datasheet notation)","PNP","M8 connector"],
].map(([suffix,method,distance,output,connection])=>({suffix,method,distance,output,connection}));
const omronSensors = omronVariants.map(({suffix,method:categoryName,distance,output,connection}) => {
  const modelId=`E3Z-${suffix}`;
  return {
    manufacturer:"OMRON",identifier:modelId,family:"E3Z",category:"Photoelectric sensors",
    attributes:{sensingMethod:categoryName,sensingDistance:distance,output,connection,supply:"12–24 V DC",outputCurrentMax:"100 mA",connectorPins:"1 +V; 2 unused; 3 0 V; 4 output"},
    source:{url:omronDatasheet,title:"E3Z Compact Photoelectric Sensor with Built-in Amplifier",revision:"v7",retrievedOn:capturedOn},
    simulation:{status:"reference-only",model:null,limitations:"Output polarity, optical sensing, response timing, and the four-pin wiring are not implemented; use the generic sensor only as a manually toggled logical input."},
  };
});

const finderSource = {
  url: "https://www.findernet.com/en/worldwide/support/general-catalog/",
  archiveUrl: "https://cdn.findernet.com/app/uploads/FINBMECAT_ENG_20260824_3996421788343213.zip",
  title: "Finder English BMEcat export", exportDate: "2026-09-02", retrievedOn: "2026-11-24",
};
const finderSimulation = {
  status: "reference-only", model: null,
  limitations: "Manufacturer order reference. Terminals, electrical ratings, device operation, and safety behavior are outside the simulation.",
};
const finderProducts = finderCatalogGroups.flatMap(([category, family, identifiers]) => identifiers.map((identifier) => ({
  manufacturer: "Finder", identifier, category, family, attributes: { officialDescription: family },
  source: finderSource, simulation: finderSimulation,
})));

const doepkeSource = {
  url: "https://www.doepke.de/en/bmecat/",
  archiveUrl: "https://www.doepke.de/fileadmin//user_upload/BME/Doepke-BMEcat2005-50-ETIM-100_PL2027-01-01_ml_2026-10-28.zip",
  title: "Doepke ETIM 10.0 BMEcat product export", exportDate: "2026-10-28", retrievedOn: "2026-11-24",
};
const doepkeSimulation = {
  status: "reference-only", model: null,
  limitations: "Manufacturer order reference. Terminal assignments, device ratings, trip characteristics, and protective behavior are outside the simulation.",
};
const doepkeProducts = doepkeCatalogGroups.flatMap(([category, family, etimClass, identifiers]) => identifiers.map((identifier) => ({
  manufacturer: "Doepke", identifier, category, family, attributes: { etimClass },
  source: doepkeSource, simulation: doepkeSimulation,
})));

const industrialProductCatalog = Object.freeze([
  ...siemensCpus,
  ...siemensModules,
  ...siemensPowerSupplies,
  ...siemensOverviewProducts,
  ...siemens1500Rows,
  ...siemensEt200spProducts,
  ...siemensEt200spExpansionProducts,
  ...siemensLogo8Products,
  ...siemensEt200alProducts,
  ...siemensEt200alCables,
  ...siemensEt200alPowerCables,
  ...unifiedComfortPanels,
  ...unifiedPanelOperatingReferences,
  ...classicComfortPanelReferences,
  ...basicMobilePanelReferences,
  ...rockwellPanelViewReferences,
  ...proFacePanelReferences,
  ...omronWeintekPanelReferences,
  ...omronControllerReferences,
  ...mitsubishiControllerReferences,
  ...rockwellMicro800References,
  ...rockwellCompactLogixReferences,
  ...rockwellControlLogixReferences,
  ...phoenixTerminalBlockReferences,
  ...beckhoffAnalogInputReferences,
  ...beckhoffSignalTerminalReferences,
  ...siemensG2CpuReferences,
  ...legacySiemensCpuReferences,
  ...siemensG2ExpansionReferences,
  ...omronSensors,
  ...finderProducts,
  ...doepkeProducts,
  {
    manufacturer:"Schneider Electric",identifier:"TM221CE24R",family:"Modicon M221",category:"PLC controllers",
    attributes:{digitalInputs:14,relayOutputs:10,analogInputs:2,supply:"100–240 V AC",ports:"Ethernet and serial",protection:"IP20"},
    source:{url:"https://www.se.com/us/en/product/TM221CE24R/logic-controller-modicon-m221-24-io-relay-ethernet/",title:"TM221CE24R product page",retrievedOn:capturedOn},
    simulation:{status:"reference-only",model:null,limitations:"The simulator does not implement Modicon hardware, its 14/10 I/O map, 100–240 V AC supply, Ethernet, or serial interfaces."},
  },
  {
    manufacturer:"Schneider Electric",identifier:"LC1D09B7",family:"TeSys D",category:"Contactors",
    attributes:{poles:"3P, 3 NO",ratedOperationalCurrent:"9 A AC-3",coil:"24 V AC, 50/60 Hz",ratedOperationalVoltage:"Up to 690 V AC",auxiliaryContacts:"1 NO + 1 NC"},
    source:{url:"https://www.se.com/us/en/product/LC1D09B7/iec-contactor-tesys-deca-nonreversing-9a-5hp-at-480vac-up-to-100ka-sccr-3-phase-3-no-24vac-50-60hz-coil-open-style/",title:"LC1D09B7 product page and datasheet",retrievedOn:capturedOn},
    simulation:{status:"reference-only",model:null,limitations:"The available generic contactor model uses a 24 V DC coil and is not electrically equivalent to this 24 V AC device."},
  },
  {
    manufacturer:"Schneider Electric",identifier:"LRD12",family:"TeSys LRD",category:"Overload relays",
    attributes:{adjustmentRange:"5.5–8 A",tripClass:"10A",auxiliaryContacts:"1 NO + 1 NC",ratedOperationalVoltage:"690 V AC",impulseWithstand:"6 kV"},
    source:{url:"https://iportal.se.com/Contents/docs/SQD-LRD12_DATA%20SHEET.PDF",title:"LRD12 product data sheet",retrievedOn:capturedOn},
    simulation:{status:"contact-only",model:"overloadNC",limitations:"Only the manually configured normally closed trip contact can be represented; motor current, thermal memory, and trip curve are not simulated."},
  },
  {
    manufacturer:"Phoenix Contact",identifier:"2904600",family:"QUINT4-PS/1AC/24DC/5",category:"Power supplies",
    attributes:{input:"1-phase AC",output:"24 V DC",ratedCurrent:"5 A",technology:"QUINT POWER, SFB, NFC configurable"},
    source:{url:"https://www.phoenixcontact.com/en-us/products/power-supply-quint4-ps1ac24dc5-2904600?type=pdf",title:"QUINT4-PS/1AC/24DC/5 product data",retrievedOn:capturedOn},
    simulation:{status:"reference-only",model:null,limitations:"No AC input, regulation, SFB selectivity, dynamic boost, or protection behavior is simulated."},
  },
  {
    manufacturer:"Phoenix Contact",identifier:"2966171",family:"PLC-RSC-24DC/21",category:"Relay modules",
    attributes:{productType:"Relay module",familyName:"PLC-INTERFACE",ratedInput:"24 V DC",mechanicalLife:"2 × 10^7 cycles",maxPowerDissipation:"0.22 W"},
    source:{url:"https://www.phoenixcontact.com/en-pc/products/relay-module-plc-rsc-24dc-21-2966171?type=pdf",title:"PLC-RSC-24DC/21 product data",retrievedOn:capturedOn},
    simulation:{status:"educational-model",model:"phoenixPlcRsc24Dc21",limitations:"Ideal polarized 24 V DC input and changeover contacts. Switching delay, diode dynamics, and contact ratings are outside the simulation."},
  },
  {
    manufacturer:"Phoenix Contact",identifier:"5603678",family:"PLC-RSC-24DC/21-21/AEX",category:"Relay modules",
    attributes:{productType:"Relay module",familyName:"PLC-INTERFACE",ratedInput:"24 V DC",changeoverContacts:2,mechanicalLife:"3 × 10^7 cycles"},
    source:{url:"https://www.phoenixcontact.com/en-us/products/relay-module-plc-rsc-24dc-21-21-aex-5603678",title:"PLC-RSC-24DC/21-21/AEX product page",retrievedOn:capturedOn},
    simulation:{status:"reference-only",model:null,limitations:"The relay's coil, contact terminals, switching ratings, and contact behavior have not been modeled."},
  },
  {
    manufacturer: "Siemens", identifier: "6ES7221-1BH50-0XB0", family: "SIMATIC S7-1200 G2 SM 1221", category: "Digital I/O modules",
    attributes: { digitalInputs: 16, ratedVoltageV: 24, isolationGroups: 4, inputType: "Sink/Source" },
    source: { url: "https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_itit_20/technical-specifications/digital-signal-modules-sms/sm-1221-di-16x24vdc", title: "Siemens SM 1221 DI 16x24VDC technical specifications", retrievedOn: "2026-11-23" },
    simulation: { status: "educational-model", model: "siemensSM1221G2DI16", limitations: "The four field common groups require a linked, powered compatible CPU. Input filtering and bus communication are outside the simulation." }
  },
  {
    manufacturer: "Siemens", identifier: "6ES7232-4HF50-0XB0", family: "SIMATIC S7-1200 G2 SM 1232", category: "Analog I/O modules",
    attributes: { analogOutputs:8, outputMode:"Voltage or current", voltageResolution:"14-bit", currentResolution:"13-bit", ratedSupplyV:24 },
    source: { url:"https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/technical-specifications/analog-signal-modules-sms/sm-1232-aq-8x14bit", title:"Siemens SM 1232 AQ 8x14bit specifications", retrievedOn:"2026-11-24" },
    simulation: { status:"educational-model", model:"siemensSM1232G2AQ8", limitations:"Nominal raw counts drive an ideal wired voltage or current indicator when the CPU and module have power." }
  },
  {
    manufacturer: "Siemens", identifier: "6ES7231-4HF50-0XB0", family: "SIMATIC S7-1200 G2 SM 1231", category: "Analog I/O modules",
    attributes: { analogInputs:8, resolution:"14-bit", inputMode:"Differential voltage or current", ratedSupplyV:24 },
    source: { url:"https://docs.tia.siemens.cloud/r/fail_safe_modules_manual_collection_enus_21/device-specific-information/s7-1200-fail-safe-modules/s7-1200-g2-programmable-logic-controller/technical-specifications/analog-signal-modules-sms/sm-1231-ai-8x14bit", title:"Siemens SM 1231 AI 8x14bit technical specifications", retrievedOn:"2026-11-24" },
    simulation: { status:"educational-model", model:"siemensSM1231G2AI8", limitations:"Ideal selectable voltage and current ranges, nominal raw counts, and 4–20 mA open-loop detection for two-wire and four-wire transmitters." }
  },
  {
    manufacturer: "Siemens", identifier: "6ES7222-5BH50-0XB0", family: "SIMATIC S7-1200 G2 SM 1222", category: "Digital I/O modules",
    attributes: { digitalOutputs: 16, ratedVoltageV: 24, ratedCurrentA: 0.5, isolationGroups: 2, outputType: "Sourcing MOSFET" },
    source: { url: "https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/technical-specifications/digital-signal-modules-sms/sm-1222-dq-16x24vdc", title: "Siemens SM 1222 DQ 16x24VDC technical specifications", retrievedOn: "2026-11-24" },
    simulation: { status: "educational-model", model: "siemensSM1222G2Transistor16", limitations: "Ideal sourcing outputs require a powered assigned CPU and a correctly wired DC supply and return on the used bank." }
  },
  {
    manufacturer: "Siemens", identifier: "6ES7222-5HH50-0XB0", family: "SIMATIC S7-1200 G2 SM 1222", category: "Digital I/O modules",
    attributes: { relayOutputs: 16, ratedVoltageV: 24, isolationGroups: 2, outputType: "Normally open relay" },
    source: { url: "https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/technical-specifications/digital-signal-modules-sms/sm1222-dq-16xrelay", title: "Siemens SM 1222 DQ 16xRelay technical specifications", retrievedOn: "2026-11-24" },
    simulation: { status: "educational-model", model: "siemensSM1222G2Relay16", limitations: "Ideal relay contacts require a powered compatible CPU, nominal 24 V DC control power, and a load supply wired to each used common." }
  },
  {
    manufacturer: "Siemens", identifier: "6ES7212-1HG50-0XB0", family: "SIMATIC S7-1200 G2 CPU 1212C", category: "PLC controllers",
    attributes: { variant: "DC/DC/RLY", digitalInputs: 8, relayOutputs: 6, cpuSupplyV: "20.4–28.8 DC", onboardAnalogChannels: 0 },
    source: { url: "https://sieportal.siemens.com/en-ww/products-services/10594019?tree=CatalogTree", title: "Siemens SiePortal CPU 1212C product variants", retrievedOn: "2026-11-23" },
    simulation: { status: "educational-model", model: "siemensS71212CG2Relay", limitations: "Ideal relay contacts require CPU power and an externally wired load supply. No vendor firmware emulation." }
  },
  {
    manufacturer:"Phoenix Contact", identifier:"3211861", family:"PT 4-HESI (5X20)", category:"Terminal systems",
    attributes:{ connections:2, fuseSize:"5 × 20 mm", nominalVoltageV:500, maximumLoadCurrentA:6.3 },
    source:{ url:"https://www.phoenixcontact.com/en-us/products/fuse-terminal-block-pt-4-hesi-5x20-3211861?type=pdf", title:"Phoenix Contact PT 4-HESI (5X20) data sheet", retrievedOn:"2026-11-24", terminalMapSection:"Product properties and connection data · two connections and 5 × 20 mm fuse" },
    simulation:{ status:"educational-model", model:"phoenixPT4HesiFuse", limitations:"Ideal continuity through an intact fuse with manual trip and replacement." },
  },
  {
    manufacturer:"Phoenix Contact", identifier:"3209578", family:"PT 2,5-QUATTRO", category:"Terminal systems",
    attributes:{ connections:4, potentials:1, nominalVoltageV:800, nominalCurrentA:24, connectionMethod:"Push-in" },
    source:{ url:"https://www.phoenixcontact.com/en-us/products/multi-conductor-terminal-block-pt-25-quattro-3209578?type=pdf", title:"Phoenix Contact PT 2,5-QUATTRO data sheet", retrievedOn:"2026-11-24", terminalMapSection:"Product properties · 4 connections, 1 potential" },
    simulation:{ status:"educational-model", model:"phoenixPT25Quattro", limitations:"Use the schematic picker to place the ideal four-connection node." },
  },
  {
    manufacturer: "Phoenix Contact", identifier: "3209549", family: "PT 2,5-TWIN", category: "Terminal systems",
    attributes: { connections: 3, potentials: 1, nominalVoltageV: 800, nominalCurrentA: 24, connectionMethod: "Push-in" },
    source: { url: "https://www.phoenixcontact.com/en-us/products/multi-conductor-terminal-block-pt-25-twin-3209549?type=pdf", title: "Phoenix Contact PT 2,5-TWIN data sheet", retrievedOn: "2026-11-23", terminalMapPages: [2, 7] },
    simulation: { status: "educational-model", model: "phoenixPT25Twin", limitations: "Use the schematic picker to place the ideal three-connection node. No resistance, heating, or rating enforcement is modeled." }
  },
  {
    manufacturer:"Phoenix Contact", identifier:"3209510", family:"PT 2,5", category:"Terminal systems",
    attributes:{ connections:2, potentials:1, nominalVoltageV:800, nominalCurrentA:24, connectionMethod:"Push-in" },
    source:{ url:"https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-pt-25-3209510", title:"Phoenix Contact PT 2,5 product data", retrievedOn:"2026-11-24" },
    simulation:{ status:"educational-model", model:"phoenixPT25FeedThrough", limitations:"Ideal two-port continuity. Resistance, heating, and rating enforcement are outside the simulation." }
  },
  {
    manufacturer:"Phoenix Contact", identifier:"3209536", family:"PT 2,5-PE", category:"Terminal systems",
    attributes:{ connections:2, connectionMethod:"Push-in", function:"Protective conductor" },
    source:{ url:"https://www.phoenixcontact.com/en-us/products/ground-terminal-block-pt-25-pe-3209536", title:"Phoenix Contact PT 2,5-PE product data", retrievedOn:"2026-11-24" },
    simulation:{ status:"educational-model", model:"phoenixPT25PE", limitations:"Ideal continuity between the two conductor connections. DIN-rail bonding, fault protection, and grounding impedance are outside the simulation." }
  },
  {
    manufacturer:"Phoenix Contact", identifier:"3212316", family:"PT 2,5-MT OG", category:"Terminal systems",
    attributes:{ connections:2, potentials:1, nominalVoltageV:400, nominalCurrentA:20, connectionMethod:"Push-in", mechanism:"Knife disconnect" },
    source:{ url:"https://www.phoenixcontact.com/en-us/products/disconnect-terminal-block-pt-25-mt-og-3212316", title:"Phoenix Contact PT 2,5-MT OG product data", retrievedOn:"2026-11-24" },
    simulation:{ status:"educational-model", model:"phoenixPT25KnifeDisconnect", limitations:"Ideal switchable continuity. Physical load-breaking behavior and rating enforcement are outside the simulation." }
  }
]);

export function validateIndustrialCatalog(entries=industrialProductCatalog) {
  const errors=[],seen=new Set();
  for(const [index,item] of entries.entries()){
    const key=`${item.manufacturer}|${item.identifier}`;
    if(seen.has(key))errors.push(`duplicate:${key}`);seen.add(key);
    for(const field of ["manufacturer","identifier","family","category"])if(!String(item[field]||"").trim())errors.push(`missing:${index}.${field}`);
    if(!item.attributes||!Object.keys(item.attributes).length)errors.push(`missing:${index}.attributes`);
    if(!/^https:\/\//.test(item.source?.url||""))errors.push(`source:${index}.url`);
    if(!item.source?.title||!/^\d{4}-\d{2}-\d{2}$/.test(item.source?.retrievedOn||""))errors.push(`provenance:${index}`);
    if(!item.simulation?.status||!item.simulation.limitations)errors.push(`simulation-boundary:${index}`);
  }
  return {ok:errors.length===0,errors,count:entries.length,unique:seen.size};
}

export function searchIndustrialCatalog({query="",category="",manufacturer="",limit=50,offset=0}={}) {
  const needle=String(query).trim().toLowerCase();
  const matching=industrialProductCatalog.filter((item)=>
    (!category||item.category===category)&&(!manufacturer||item.manufacturer===manufacturer)&&
    (!needle||`${item.manufacturer} ${item.identifier} ${item.family} ${item.category} ${Object.values(item.attributes).join(" ")}`.toLowerCase().includes(needle))
  );
  const start=Math.max(0,Number(offset)||0),size=Math.max(1,Math.min(100,Number(limit)||50));
  return {total:matching.length,items:matching.slice(start,start+size)};
}

export const industrialCatalogCategories=Object.freeze([...new Set(industrialProductCatalog.map((item)=>item.category))].sort());
export const industrialCatalogManufacturers=Object.freeze([...new Set(industrialProductCatalog.map((item)=>item.manufacturer))].sort());
export { industrialProductCatalog };
