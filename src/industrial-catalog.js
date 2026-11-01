const capturedOn = "2026-10-30";
const siemensCatalog = "https://mall.industry.siemens.com/tstcloud/Api/Catalog/ExportInformation?catalogItemId=S7_1200&lang=en";
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

const industrialProductCatalog = Object.freeze([
  ...siemensCpus,
  ...siemensModules,
  ...siemensPowerSupplies,
  ...siemensOverviewProducts,
  ...omronSensors,
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
    simulation:{status:"reference-only",model:null,limitations:"The relay's coil, contact terminals, switching ratings, and contact behavior have not been modeled."},
  },
  {
    manufacturer:"Phoenix Contact",identifier:"5603678",family:"PLC-RSC-24DC/21-21/AEX",category:"Relay modules",
    attributes:{productType:"Relay module",familyName:"PLC-INTERFACE",ratedInput:"24 V DC",changeoverContacts:2,mechanicalLife:"3 × 10^7 cycles"},
    source:{url:"https://www.phoenixcontact.com/en-us/products/relay-module-plc-rsc-24dc-21-21-aex-5603678",title:"PLC-RSC-24DC/21-21/AEX product page",retrievedOn:capturedOn},
    simulation:{status:"reference-only",model:null,limitations:"The relay's coil, contact terminals, switching ratings, and contact behavior have not been modeled."},
  },
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
