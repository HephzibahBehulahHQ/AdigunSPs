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
