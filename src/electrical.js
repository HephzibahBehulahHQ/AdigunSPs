import { ioHardwareProfiles } from "./io-allocator.js";

const relayInputPins = { I1:"X10-1", I2:"X10-3", I3:"X10-5", I4:"X10-7", I5:"X10-9", I6:"X10-2", I7:"X10-4", I8:"X10-6" };
const relayOutputPins = { Q1:"X11-3", Q2:"X11-5", Q3:"X11-7", Q4:"X11-4", Q5:"X11-6", Q6:"X11-8" };
const connectorPins = (connector, count) => Array.from({ length: count }, (_, index) => `${connector}-${index + 1}`);
const relayPinLayout = [...connectorPins("X80", 6), ...connectorPins("X10", 10), ...connectorPins("X11", 8)];
const sm1221InputGroups = [
  { common:"X10-1", inputs:["X10-3","X10-5","X10-7","X10-9"] },
  { common:"X10-2", inputs:["X10-4","X10-6","X10-8","X10-10"] },
  { common:"X11-1", inputs:["X11-3","X11-5","X11-7","X11-9"] },
  { common:"X11-2", inputs:["X11-4","X11-6","X11-8","X11-10"] }
];
const sm1221InputPins = Object.fromEntries(sm1221InputGroups.flatMap(({ inputs }) => inputs).map((pin, index) => [`I${index + 1}`, pin]));
const sm1222RelayGroups = [
  { commonPins:["X10-1","X10-2"], outputs:["X10-3","X10-5","X10-7","X10-9","X10-4","X10-6","X10-8","X10-10"] },
  { commonPins:["X11-13","X11-14"], outputs:["X11-5","X11-7","X11-9","X11-11","X11-6","X11-8","X11-10","X11-12"] }
];
const sm1222OutputPins = Object.fromEntries(sm1222RelayGroups.flatMap(({ outputs }) => outputs).map((pin, index) => [`Q${index + 1}`, pin]));
const sm1222RelayLayout = [...connectorPins("X10", 14), ...connectorPins("X11", 14)];

export const electricalComponentCatalog = Object.freeze({
  supply24vdc: { name:"24 V DC supply", category:"Power supplies", prefix:"PS", terminals:["+","−"], kind:"source", nominalVoltageV:24 },
  sitopPSU100C: { name:"Siemens SITOP PSU100C · 24 V / 2.5 A", category:"Power supplies", prefix:"PS", terminals:["L","N","PE","+","−A","−B"], terminalLabels:{"−A":"−","−B":"−"}, kind:"power-converter", manufacturer:"Siemens", partNumber:"6EP1332-5BA00", nominalVoltageV:24, ratedVoltageV:24, ratedCurrentA:2.5, source:{title:"SITOP PSU100C Operating Instructions",url:"https://support.industry.siemens.com/cs/attachments/65647808/PSU100C_Handbuch_englisch_en-US.pdf"}, terminalNotes:{L:"AC line",N:"AC neutral",PE:"Protective earth", "+":"24 V DC positive output","−A":"0 V DC output terminal (first of two)","−B":"0 V DC output terminal (second of two)"}, simulationLimitations:"Educational ideal converter: the 24 V DC output is enabled by wired single-phase line/neutral paths. AC waveform, regulation, overload/current limiting, startup behavior, isolation, protection and device faults are not simulated." },
  ifmPN2070: { name:"ifm PN2070 pressure sensor · M12 4-pin", category:"Sensors", prefix:"B", terminals:["1","2","4","3"], kind:"analog-signal-source", signalModel:"manual pressure scalar in bar; ideal analog pin behavior only",signalPins:{positive:"2",negative:"3"},signalPowerPins:{positive:"1",negative:"3",minimumVoltageV:18,maximumVoltageV:30}, manufacturer:"ifm", partNumber:"PN-400-SER14-MFRKG/USI /V", source:{title:"ifm PN2070 data sheet",url:"https://media.ifm.com/dam/10387d12-99eb-42a0-8cfe-db5fc607ec3d/Original/PN2070-02_DE-DE.pdf"}, terminalNotes:{"1":"Pin 1 · BN · sensor supply L+ · 18–30 V DC","2":"Pin 2 · WH · OUT2 · configurable analog output","4":"Pin 4 · BK · OUT1 switching output / IO-Link (not simulated)","3":"Pin 3 · BU · L− and analog output return"}, simulationLimitations:"The scalar pressure value is manually supplied by the project’s REAL input tag in bar and passes from pin 2 to an analog input only when pin 1/3 have modeled 18–30 V DC power. Analog mode/range configuration, 4–20 mA or 0–10 V electrical behavior, OUT1/IO-Link, pressure physics, accuracy, response and faults are not simulated." },
  phoenixPT25PE: { name:"Phoenix Contact PT 2,5-PE protective conductor terminal · 3209536", category:"Terminals and wiring", prefix:"XPE", terminals:["1","2"], kind:"pass-through", manufacturer:"Phoenix Contact", partNumber:"3209536", source:{title:"Phoenix Contact PT 2,5-PE product data",url:"https://www.phoenixcontact.com/en-us/products/ground-terminal-block-pt-25-pe-3209536"}, terminalNotes:{"1":"Protective conductor connection 1","2":"Protective conductor connection 2"}, simulationLimitations:"The two manufacturer-specified conductor connections are modeled as ideal pass-through continuity. The protective grounding foot bonds through the DIN rail in the physical product; DIN-rail bonding, ground potential, impedance, conductor ratings and fault protection are not simulated." },
  singlePhaseSupply: { name:"Single-phase AC supply · L/N/PE model", category:"Power supplies", prefix:"G", terminals:["L","N","PE"], kind:"single-phase-source", nominalVoltageV:230 },
  supply3phase: { name:"three-phase supply (educational)", category:"Power supplies", prefix:"G", terminals:["L1","L2","L3","PE"], kind:"three-phase-source", nominalVoltageV:400 },
  genericPlc24v4di4do: { name:"24 V DC PLC · 4 DI / 4 DO", category:"PLC controllers", prefix:"PLC", terminals:["L+","M","PE","I1","I2","I3","I4","Q1","Q2","Q3","Q4"], kind:"plc", channels:{inputs:["I1","I2","I3","I4"],outputs:["Q1","Q2","Q3","Q4"]} },
  siemensS71212CG2: { name:"Siemens SIMATIC S7-1200 G2 CPU 1212C DC/DC/DC · 8 DI / 6 DQ", category:"PLC controllers", prefix:"PLC", terminals:["X80-1","X80-2","X80-4","X80-5","X80-6","X10-1","X10-2","X10-3","X10-4","X10-5","X10-6","X10-7","X10-8","X10-9","X10-10","X11-1","X11-2","X11-3","X11-4","X11-5","X11-6","X11-7","X11-8"],terminalLayout:["X80-1","X80-2","X80-3","X80-4","X80-5","X80-6","X10-1","X10-2","X10-3","X10-4","X10-5","X10-6","X10-7","X10-8","X10-9","X10-10","X11-1","X11-2","X11-3","X11-4","X11-5","X11-6","X11-7","X11-8"], kind:"plc", channels:{inputs:["I1","I2","I3","I4","I5","I6","I7","I8"],outputs:["Q1","Q2","Q3","Q4","Q5","Q6"],inputPins:{I1:"X10-1",I2:"X10-3",I3:"X10-5",I4:"X10-7",I5:"X10-9",I6:"X10-2",I7:"X10-4",I8:"X10-6"},outputPins:{Q1:"X11-3",Q2:"X11-5",Q3:"X11-7",Q4:"X11-4",Q5:"X11-6",Q6:"X11-8"},powerPositivePin:"X80-1",powerNegativePin:"X80-5",inputCommonPins:["X10-8","X10-10"],outputSupplyPin:"X11-2",outputReturnPin:"X11-1"}, manufacturer:"Siemens", partNumber:"6ES7212-1AG50-0XB0", source:{title:"Siemens S7-1200 G2 System Manual · CPU 1212C wiring diagrams",url:"https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_itit_20/technical-specifications/cpu-1212c/wiring-diagrams?contentId=JKtYbF20ULXLF_Hv6EcPNQ",terminalMapSection:"CPU 1212C DC/DC/DC"}, terminalNotes:{"X80-1":"X80 physical pin 1 · DC power L+","X80-2":"X80 physical pin 2 · sensor power GND","X80-3":"X80 physical pin 3 · unassigned in the Siemens terminal table; display only","X80-4":"X80 physical pin 4 · sensor power L+","X80-5":"X80 physical pin 5 · DC power M","X80-6":"X80 physical pin 6 · sensor power M","X10-1":"X10 physical pin 1 · digital input DI a.0","X10-2":"X10 physical pin 2 · digital input DI a.5","X10-3":"X10 physical pin 3 · digital input DI a.1","X10-4":"X10 physical pin 4 · digital input DI a.6","X10-5":"X10 physical pin 5 · digital input DI a.2","X10-6":"X10 physical pin 6 · digital input DI a.7","X10-7":"X10 physical pin 7 · digital input DI a.3","X10-8":"X10 physical pin 8 · digital input common 1M","X10-9":"X10 physical pin 9 · digital input DI a.4","X10-10":"X10 physical pin 10 · digital input common 1M","X11-1":"X11 physical pin 1 · digital output common 2M","X11-2":"X11 physical pin 2 · digital output common 2L+","X11-3":"X11 physical pin 3 · digital output DQ a.0","X11-4":"X11 physical pin 4 · digital output DQ a.3","X11-5":"X11 physical pin 5 · digital output DQ a.1","X11-6":"X11 physical pin 6 · digital output DQ a.4","X11-7":"X11 physical pin 7 · digital output DQ a.2","X11-8":"X11 physical pin 8 · digital output DQ a.5"}, simulationLimitations:"Verified CPU identity, three connector blocks and 24 physical terminal-pin identities from the Siemens system manual. This educational simulation binds the documented digital I/O pins to project tags and follows explicit 24 V DC power/common wiring; CPU program execution, timing, diagnostics and hardware behavior are not simulated." },
  siemensS71212CG2Relay: {
    name:"Siemens SIMATIC S7-1200 G2 CPU 1212C DC/DC/RLY · 8 DI / 6 relay DO", category:"PLC controllers", prefix:"PLC", kind:"plc",
    manufacturer:"Siemens", partNumber:"6ES7212-1HG50-0XB0",
    terminalLayout:relayPinLayout, terminals:relayPinLayout.filter((pin) => pin !== "X80-3"),
    channels:{ inputs:Object.keys(relayInputPins), outputs:Object.keys(relayOutputPins), inputPins:relayInputPins, outputPins:relayOutputPins,
      powerPositivePin:"X80-1", powerNegativePin:"X80-5", inputCommonPins:["X10-8","X10-10"], inputPolarity:"sink-source", relayCommonPins:["X11-1","X11-2"] },
    controllerSupply:{ minimumVoltageV:20.4, maximumVoltageV:28.8 },
    source:{ title:"Siemens S7-1200 G2 System Manual · CPU 1212C wiring diagrams", url:"https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_itit_20/technical-specifications/cpu-1212c/wiring-diagrams?contentId=JKtYbF20ULXLF_Hv6EcPNQ", terminalMapSection:"CPU 1212C DC/DC/Relay" },
    terminalNotes:{
      "X80-1":"CPU power L+", "X80-2":"Chassis ground", "X80-3":"Unassigned position", "X80-4":"Sensor supply L+", "X80-5":"CPU power M", "X80-6":"Sensor supply M",
      "X10-8":"Digital input common 1M", "X10-10":"Digital input common 1M", "X11-1":"Relay common 1L", "X11-2":"Relay common 1L",
      ...Object.fromEntries(Object.values(relayInputPins).map((pin, index) => [pin, `Digital input DI a.${index}`])),
      ...Object.fromEntries(Object.values(relayOutputPins).map((pin, index) => [pin, `Relay output DQ a.${index}`]))
    },
    simulationLimitations:"Ideal relay contacts switch the external 1L common only with a powered DC CPU and a mapped true output. A digital input requires a complete DC path to the opposite pole from its 1M common. Sensor-supply output, ratings, firmware, and relay dynamics are outside the simulation."
  },
  digitalInputModule4: { name:"digital input module · 4 channels", category:"PLC I/O modules", prefix:"DI", terminals:["M","I1","I2","I3","I4"], kind:"digital-input-module", channels:{inputs:["I1","I2","I3","I4"]} },
  siemensSM1221G2DI16: {
    name:"Siemens S7-1200 G2 SM 1221 · 16 DI · 6ES7221-1BH50-0XB0", category:"PLC I/O modules", prefix:"DI", kind:"digital-input-module",
    manufacturer:"Siemens", partNumber:"6ES7221-1BH50-0XB0", terminals:[...connectorPins("X10", 10), ...connectorPins("X11", 10)],
    channels:{ inputs:Object.keys(sm1221InputPins), inputPins:sm1221InputPins }, inputGroups:sm1221InputGroups,
    backplaneCpuTypes:["siemensS71212CG2", "siemensS71212CG2Relay"],
    inputSignalVoltage:{ minimumVoltageV:15, maximumVoltageV:30 },
    source:{ title:"Siemens S7-1200 G2 SM 1221 DI 16x24VDC specifications and wiring", url:"https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_itit_20/technical-specifications/digital-signal-modules-sms/sm-1221-di-16x24vdc", terminalMapSection:"Wiring diagram" },
    terminalNotes:Object.fromEntries(sm1221InputGroups.flatMap(({ common, inputs }, group) => [
      [common, `Field input common ${group + 1}M`],
      ...inputs.map((pin, index) => [pin, `Digital input DI ${group < 2 ? "a" : "b"}.${(group % 2) * 4 + index}`])
    ])),
    simulationLimitations:"Four isolated field common groups support either DC polarity. The module reads its mapped inputs only while the assigned compatible CPU has DC power. Slot routing, power budget, scan filtering, and bus timing are outside the simulation."
  },
  digitalOutputModule4: { name:"digital output module · 4 channels", category:"PLC I/O modules", prefix:"DO", terminals:["L+","M","Q1","Q2","Q3","Q4"], kind:"digital-output-module", channels:{outputs:["Q1","Q2","Q3","Q4"]} },
  siemensSM1222G2Relay16: {
    name:"Siemens S7-1200 G2 SM 1222 · 16 relay DO · 6ES7222-5HH50-0XB0", category:"PLC I/O modules", prefix:"DO", kind:"digital-output-module",
    manufacturer:"Siemens", partNumber:"6ES7222-5HH50-0XB0", terminalLayout:sm1222RelayLayout,
    terminals:sm1222RelayLayout.filter((pin) => !["X10-11","X10-12","X10-13","X10-14","X11-3","X11-4"].includes(pin)),
    channels:{ outputs:Object.keys(sm1222OutputPins), outputPins:sm1222OutputPins, powerPositivePin:"X11-1", powerNegativePin:"X11-2" },
    relayOutputGroups:sm1222RelayGroups, backplaneCpuTypes:["siemensS71212CG2","siemensS71212CG2Relay"],
    source:{ title:"Siemens S7-1200 G2 SM 1222 relay specifications and wiring", url:"https://docs.tia.siemens.cloud/r/simatic_s7_1200_g2_manual_collection_enus_20/technical-specifications/digital-signal-modules-sms/sm1222-dq-16xrelay", terminalMapSection:"Wiring diagram" },
    terminalNotes:{ "X11-1":"Relay control supply L+", "X11-2":"Relay control supply M",
      ...Object.fromEntries(sm1222RelayGroups.flatMap(({ commonPins, outputs }, group) => [
        ...commonPins.map((pin) => [pin, `Isolated load common ${group + 1}L`]),
        ...outputs.map((pin, index) => [pin, `Relay output DQ ${group ? "b" : "a"}.${index}`])
      ])) },
    simulationLimitations:"Ideal normally open contacts require the assigned powered CPU, a wired nominal 24 V DC relay control supply, and an external load circuit on the correct common. Contact ratings, protection, relay timing, and fieldbus timing are outside the simulation."
  },
  analogInputModule2: { name:"analog input module · 2 channels", category:"PLC I/O modules", prefix:"AI", terminals:["MANA","AI1+","AI1−","AI2+","AI2−"], kind:"analog-input-module", channels:{analogInputs:["AI1","AI2"]} },
  analogOutputModule2: { name:"analog output module · 2 channels", category:"PLC I/O modules", prefix:"AO", terminals:["MANA","AQ1+","AQ1−","AQ2+","AQ2−"], kind:"analog-output-module", channels:{analogOutputs:["AQ1","AQ2"]} },
  siemens3SU1400NCContact: { name:"Siemens SIRIUS ACT 3SU1400-1AA10-1CA0 · 1 NC contact module", category:"Control devices", prefix:"S", terminals:["1","2"], kind:"contact", normallyClosed:true, manufacturer:"Siemens", partNumber:"3SU1400-1AA10-1CA0", source:{title:"Siemens SIRIUS ACT 3SU1 system manual · 1NC contact module and terminal marks",url:"https://support.industry.siemens.com/cs/attachments/107542462/manual_SIRIUS_ACT_3SU1_en-US.pdf"}, terminalNotes:{"1":"Normally-closed contact terminal 1","2":"Normally-closed contact terminal 2"}, simulationLimitations:"The Siemens manual identifies this as a 1 NC contact module and shows terminal marks 1 and 2. The educational model simulates an ideal manually controlled contact path; actuator mechanics, ratings, switching dynamics, and safety performance are not simulated." },
  siemens3RU21264BC0OverloadRelay: { name:"Siemens SIRIUS 3RU2126-4BC0 thermal overload relay · 3-pole · 1 NC + 1 NO", category:"Protection", prefix:"F", terminals:["1/L1","3/L2","5/L3","2/T1","4/T2","6/T3","95","96","97","98"], terminalLayout:["1/L1","3/L2","5/L3","95","97","2/T1","4/T2","6/T3","96","98"], kind:"overload-contact", normallyClosed:true, mainPairs:[["1/L1","2/T1"],["3/L2","4/T2"],["5/L3","6/T3"]], contactPairs:[{terminals:["95","96"],normallyClosed:true},{terminals:["97","98"],normallyClosed:false}], manufacturer:"Siemens", partNumber:"3RU2126-4BC0", source:{title:"Siemens SIRIUS 3RU21 overload relay data sheet",url:"https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RU2126-4BC0"}, terminalNotes:{"1/L1":"Three-phase main circuit · incoming phase L1","3/L2":"Three-phase main circuit · incoming phase L2","5/L3":"Three-phase main circuit · incoming phase L3","2/T1":"Three-phase main circuit · outgoing phase T1 paired with 1/L1","4/T2":"Three-phase main circuit · outgoing phase T2 paired with 3/L2","6/T3":"Three-phase main circuit · outgoing phase T3 paired with 5/L3","95":"Normally-closed trip contact input","96":"Normally-closed trip contact output","97":"Normally-open trip indication contact input","98":"Normally-open trip indication contact output"}, simulationLimitations:"The manufacturer identifies a three-pole thermal overload relay with one NC 95/96 auxiliary contact for contactor disconnection and one NO 97/98 trip indication contact. The three main paths are ideal pass-through connections. The trip flag is a manual simulation input; thermal/current trip, motor protection, ratings, reset dynamics, and safety performance are not simulated." },

  siemens3SU14001NO1NCContact: { name:"Siemens SIRIUS ACT 3SU1400-1AA10-1FA0 · 1 NO + 1 NC contact module", category:"Control devices", prefix:"S", terminals:["1","2","3","4"], terminalLayout:["1","3","2","4"], kind:"contact", contactPairs:[{terminals:["1","2"],normallyClosed:true},{terminals:["3","4"],normallyClosed:false}], manufacturer:"Siemens", partNumber:"3SU1400-1AA10-1FA0", source:{title:"Siemens SIRIUS ACT contact module data sheet",url:"https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3SU1400-1AA10-1FA0"}, terminalNotes:{"1":"Normally-closed contact terminal 1","2":"Normally-closed contact terminal 2","3":"Normally-open contact terminal 3","4":"Normally-open contact terminal 4"}, simulationLimitations:"The manufacturer identifies separate 1/2 NC and 3/4 NO contact paths. The educational model simulates ideal manually actuated paths; actuator mechanics, ratings, switching dynamics and safety performance are not simulated." },
  siemens3SU1400NOContact: { name:"Siemens SIRIUS ACT 3SU1400-1AA10-1BA0 · 1 NO contact module", category:"Control devices", prefix:"S", terminals:["3","4"], kind:"contact", normallyClosed:false, manufacturer:"Siemens", partNumber:"3SU1400-1AA10-1BA0", source:{title:"Siemens SIRIUS ACT 3SU1 data sheet",url:"https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3SU1400-1AA10-1BA0"}, terminalNotes:{"3":"Normally-open contact terminal 3","4":"Normally-open contact terminal 4"}, simulationLimitations:"Verified device identity and terminal marks. The normally-open path can be toggled as a manual simulation input; actuator mechanics and electrical ratings are not modeled." },
  schneiderXB5AA31GreenPushbutton: { name:"Schneider Electric Harmony XB5AA31 green flush spring-return pushbutton · 1 NO", category:"Control devices", prefix:"S", terminals:["13","14"], kind:"contact", normallyClosed:false, manufacturer:"Schneider Electric", partNumber:"XB5AA31", source:{title:"Schneider Electric XB5AA31 product data sheet",url:"https://iportal.se.com/Contents/docs/SQD-XB5AA31_DATA%20SHEET.PDF"}, terminalNotes:{"13":"Normally-open contact terminal 13","14":"Normally-open contact terminal 14"}, simulationLimitations:"The source identifies a green flush spring-return pushbutton with one normally-open contact at terminals 13–14. The editor's binary manual input simulates only the contact state; spring mechanics, bounce, electrical ratings and life are not simulated." },
  schneiderXB5AA42RedPushbuttonNC: { name:"Schneider Electric Harmony XB5AA42 red flush spring-return pushbutton · 1 NC", category:"Control devices", prefix:"S", terminals:["21","22"], kind:"contact", normallyClosed:true, manufacturer:"Schneider Electric", partNumber:"XB5AA42", source:{title:"Schneider Electric Harmony XB5AA42 product data",url:"https://shop.se.com/pro/us/en/product/push-button-harmony-xb5-plastic-flush-red-22mm-spring-return-unmarked-1nc/"}, terminalNotes:{"21":"Normally-closed contact terminal 21","22":"Normally-closed contact terminal 22"}, simulationLimitations:"The source identifies a red flush spring-return pushbutton with one normally-closed contact at terminals 21–22. The editor's binary manual input simulates only the contact state; spring mechanics, bounce, electrical ratings and life are not simulated." },
  pushbuttonNO: { name:"normally-open start push button", category:"Control devices", prefix:"S", terminals:["13","14"], kind:"contact", normallyClosed:false },
  pushbuttonNC: { name:"normally-closed stop push button", category:"Control devices", prefix:"S", terminals:["21","22"], kind:"contact", normallyClosed:true },
  emergencyStopNC: { name:"Emergency-stop switch · latching NC model", category:"Control devices", prefix:"ES", terminals:["11","12"], kind:"manual-switch", normallyClosed:true },
  toggleSwitchNO: { name:"Maintained toggle switch · NO", category:"Control devices", prefix:"SA", terminals:["13","14"], kind:"manual-switch", normallyClosed:false },
  toggleSwitchNC: { name:"Maintained toggle switch · NC", category:"Control devices", prefix:"SA", terminals:["21","22"], kind:"manual-switch", normallyClosed:true },
  selectorSwitch: { name:"two-position selector switch · SPDT model", category:"Control devices", prefix:"SA", terminals:["11","12","14"], kind:"selector-switch", positionPairs:{I:["11","12"],II:["11","14"]} },
  limitSwitchNO: { name:"normally-open limit switch", category:"Sensors", prefix:"B", terminals:["13","14"], kind:"contact", normallyClosed:false },
  limitSwitchNC: { name:"normally-closed limit switch", category:"Sensors", prefix:"B", terminals:["21","22"], kind:"contact", normallyClosed:true },
  proximityNO: { name:"proximity sensor · NO simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:false },
  proximityNC: { name:"proximity sensor · NC simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:true },
  photoelectricNO: { name:"photoelectric sensor · NO simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:false },
  photoelectricNC: { name:"photoelectric sensor · NC simulation", category:"Sensors", prefix:"B", terminals:["1","2"], kind:"contact", normallyClosed:true },
  pressureSwitchNO: { name:"Pressure switch · NO simulation", category:"Sensors", prefix:"B", terminals:["13","14"], kind:"contact", normallyClosed:false },
  temperatureSwitchNO: { name:"Temperature switch · NO simulation", category:"Sensors", prefix:"B", terminals:["13","14"], kind:"contact", normallyClosed:false },
  temperatureSwitchNC: { name:"Temperature switch · NC simulation", category:"Sensors", prefix:"B", terminals:["21","22"], kind:"contact", normallyClosed:true },
  floatSwitchNO: { name:"Float switch · NO simulation", category:"Sensors", prefix:"B", terminals:["13","14"], kind:"contact", normallyClosed:false },
  analogSignalSource: { name:"analog signal source · scalar simulation", category:"Sensors", prefix:"B", terminals:["SIG+","SIG−"], kind:"analog-signal-source", signalModel:"tag-scaled scalar; no voltage physics" },
  analogSignalIndicator: { name:"analog signal indicator · scalar simulation", category:"Actuators and indicators", prefix:"Y", terminals:["SIG+","SIG−"], kind:"analog-signal-indicator", signalModel:"tag-scaled scalar; no voltage physics" },
  contactor3P: { name:"three-pole contactor · 24 V DC coil", category:"Contactors and relays", prefix:"K", terminals:["1L1","2T1","3L2","4T2","5L3","6T3","A1","A2","13","14","21","22"], kind:"contactor", mainPairs:[["1L1","2T1"],["3L2","4T2"],["5L3","6T3"]], coil:["A1","A2"], auxNOPair:["13","14"], auxNCPair:["21","22"] },
  siemensSirius3RT20171WB41: { name:"Siemens SIRIUS 3RT2017-1WB41 power contactor · 3-pole + 1 NO", category:"Contactors and relays", prefix:"K", terminals:["1/L1","3/L2","5/L3","13","A1+","2/T1","4/T2","6/T3","14","A2−"], kind:"contactor", mainPairs:[["1/L1","2/T1"],["3/L2","4/T2"],["5/L3","6/T3"]], coil:["A1+","A2−"], auxNOPair:["13","14"], coilSupply:{kind:"dc",minimumVoltageV:20.4,maximumVoltageV:44.4}, manufacturer:"Siemens", partNumber:"3RT2017-1WB41", source:{title:"Siemens SIRIUS 3RT2017-1WB41 data sheet",url:"https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RT2017-1WB41"}, terminalNotes:{"1/L1":"Main power contact pole 1 input","2/T1":"Main power contact pole 1 output","3/L2":"Main power contact pole 2 input","4/T2":"Main power contact pole 2 output","5/L3":"Main power contact pole 3 input","6/T3":"Main power contact pole 3 output","13":"Normally-open auxiliary contact input","14":"Normally-open auxiliary contact output","A1+":"Contactor coil positive","A2−":"Contactor coil negative"}, simulationLimitations:"The documented 24 V DC coil energizes only from a wired modeled DC source within the published 0.85–1.85 × Uc operating range (20.4–44.4 V). Main and auxiliary contacts switch immediately in the educational connectivity model; coil power, response time, contact ratings, arc behavior, motor protection, and device performance are not simulated." },
  siemensSirius3RV20111JA10: { name:"Siemens SIRIUS 3RV2011-1JA10 motor-protection circuit breaker · 3-pole", category:"Protection", prefix:"QF", terminals:["1/L1","3/L2","5/L3","2/T1","4/T2","6/T3"], kind:"multi-pole-breaker", mainPairs:[["1/L1","2/T1"],["3/L2","4/T2"],["5/L3","6/T3"]], manufacturer:"Siemens", partNumber:"3RV2011-1JA10", source:{title:"Siemens SIRIUS 3RV2011-1JA10 data sheet",url:"https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3RV2011-1JA10"}, terminalNotes:{"1/L1":"Line input · phase L1","2/T1":"Load output · phase T1","3/L2":"Line input · phase L2","4/T2":"Load output · phase T2","5/L3":"Line input · phase L3","6/T3":"Load output · phase T3"}, simulationLimitations:"Three main-pole terminal pairs are manually opened and closed together. This is ideal continuity only; thermal/magnetic trip behavior, current adjustment, arc behavior and protective performance are not simulated." },
  relayCoil: { name:"control relay coil · 24 V DC simulation", category:"Contactors and relays", prefix:"K", terminals:["A1","A2"], coil:["A1","A2"], kind:"load" },
  auxiliaryNO: { name:"normally-open auxiliary contact", category:"Contactors and relays", prefix:"K", terminals:["13","14"], kind:"contact", normallyClosed:false },
  auxiliaryNC: { name:"normally-closed auxiliary contact", category:"Contactors and relays", prefix:"K", terminals:["21","22"], kind:"contact", normallyClosed:true },
  overloadNC: { name:"overload relay · NC trip contact simulation", category:"Protection", prefix:"F", terminals:["95","96"], kind:"overload-contact", normallyClosed:true },
  circuitBreaker: { name:"manually-reset circuit breaker", category:"Protection", prefix:"QF", terminals:["1","2"], kind:"manual-switch", normallyClosed:false, initialClosed:true },
  fuse: { name:"fuse · replace-after-open simulation", category:"Protection", prefix:"FU", terminals:["1","2"], kind:"manual-switch", normallyClosed:false, initialClosed:true },
  siemens3SU1152AmberIndicator: { name:"Siemens SIRIUS ACT 3SU1152-6AA00-1AA0 amber indicator · 24 V AC/DC", category:"Actuators and indicators", prefix:"H", terminals:["X1","X2"], kind:"load", manufacturer:"Siemens", partNumber:"3SU1152-6AA00-1AA0", ratedVoltageV:24, source:{title:"Siemens SIRIUS ACT 3SU1152-6AA00-1AA0 data sheet",url:"https://support.industry.siemens.com/teddatasheet/?caller=SIOS&format=pdf&language=en&mlfbs=3SU11526AA001AA0"}, terminalNotes:{X1:"Indicator lamp terminal X1",X2:"Indicator lamp terminal X2"}, simulationLimitations:"The complete amber LED indicator is specified for 24 V AC/DC and its data sheet identifies terminals X1 and X2. The educational circuit simulator models only ideal on/off connectivity in its DC topology; it does not model AC operation, LED polarity, current, brightness, photometry or protection." },
  pilotLamp: { name:"pilot lamp", category:"Actuators and indicators", prefix:"H", terminals:["X1","X2"], kind:"load" },
  solenoidValve: { name:"solenoid valve coil · 24 V DC simulation", category:"Actuators and indicators", prefix:"Y", terminals:["A1","A2"], kind:"load" },
  buzzer: { name:"Audible buzzer · on/off simulation", category:"Actuators and indicators", prefix:"H", terminals:["X1","X2"], kind:"load" },
  heaterElement: { name:"Heater element · on/off simulation", category:"Actuators and indicators", prefix:"E", terminals:["1","2"], kind:"load" },
  wegW22XBCMotor: { name:"WEG W22XB-C hazardous-area motor family · 6-lead terminal board", category:"Motors", prefix:"M", terminals:["U1","V1","W1","U2","V2","W2"], kind:"motor", windingPairs:[["U1","U2"],["V1","V2"],["W1","W2"]], manufacturer:"WEG", partNumber:"W22XB-C · frame 315–500 family reference", source:{title:"WEG W22XB-C motor instruction manual · connection diagrams",url:"https://static.weg.net/medias/downloadcenter/h4f/hcf/WEG-hazardous-area-motors-instructions-manual-w22xb-c-315-500-110.11-manual-english-dcpreview_130Wx180.pdf"}, terminalNotes:{U1:"Stator winding U start",V1:"Stator winding V start",W1:"Stator winding W start",U2:"Stator winding U finish",V2:"Stator winding V finish",W2:"Stator winding W finish"}, simulationLimitations:"Manufacturer documentation shows the W22XB-C six-lead U/V/W terminal board and star/delta connection diagrams. This is a motor-family reference, not an order-specific model; ratings, star/delta links, motor physics and hazardous-area compliance are not simulated." },
  wegW22IE2Motor: { name:"WEG W22 IE2 three-phase motor · 1.5 kW · 4-pole · 90L · 220–240/380–415/460 V", category:"Motors", prefix:"M", terminals:["U1","V1","W1","U2","V2","W2","PE"], kind:"motor", windingPairs:[["U1","U2"],["V1","V2"],["W1","W2"]], manufacturer:"WEG", partNumber:"11673230", source:{title:"WEG W22 IE2 1.5 kW 4P 90L product 11673230",url:"https://www.weg.net/catalog/weg/FR/fr/Electric-Motors/Low-Voltage-IEC-Motors/Three-Phase/W22-/W22-IE2-1-5-kW-4P-90L-3Ph-220-230-240-380-400-415-460-V-50-Hz-IC411---TEFC---B14T/p/11673230"}, sources:[{title:"WEG safe-area motor installation manual · connections and grounding",url:"https://static.weg.net/medias/downloadcenter/ha6/h39/WEG-WMO-safe-area-50033244-manual-pt-en-es.pdf"}], terminalNotes:{U1:"Stator winding U start",V1:"Stator winding V start",W1:"Stator winding W start",U2:"Stator winding U finish",V2:"Stator winding V finish",W2:"Stator winding W finish",PE:"Protective earth to the motor housing"}, simulationLimitations:"WEG product data identifies this 1.5 kW, 4-pole, 90L, 50 Hz, IP55 motor and its 220–240/380–415/460 V range. The educational motor reports energized only with three distinct supply phases wired into a valid star or delta arrangement across U1/V1/W1 and U2/V2/W2. Wire PE to the housing terminal. AC waveforms, current, torque/speed, efficiency, protection, startup transients and physical grounding are not simulated; verify nameplate connections before real installation." },
  singlePhaseMotor: { name:"single-phase motor · on/off model", category:"Motors", prefix:"M", terminals:["U1","U2","PE"], kind:"motor", phasePairs:[["U1","U2"]] },
  threePhaseMotor: { name:"three-phase motor · on/off model", category:"Motors", prefix:"M", terminals:["U1","V1","W1","PE"], kind:"motor", phasePairs:[["U1","V1"],["V1","W1"],["W1","U1"]] },
  phoenixPT25FeedThrough: { name:"Phoenix Contact PT 2,5 feed-through terminal · 3209510", category:"Terminals and wiring", prefix:"X", terminals:["1","2"], kind:"pass-through", manufacturer:"Phoenix Contact", partNumber:"3209510", ratedVoltageV:800, ratedCurrentA:24, source:{title:"Phoenix Contact PT 2,5 product data",url:"https://www.phoenixcontact.com/en-us/products/feed-through-terminal-block-pt-25-3209510"}, terminalNotes:{"1":"Conductor connection 1 · editor port label","2":"Conductor connection 2 · editor port label"}, simulationLimitations:"Manufacturer data lists two push-in conductor connections, 800 V nominal voltage and 24 A nominal current. The schematic treats pins 1–2 as an ideal pass-through; resistance, heating, physical conductor fit, rail mounting and rating enforcement are not simulated." },
  terminal: { name:"feed-through terminal block", category:"Terminals and wiring", prefix:"X", terminals:["1","2"], kind:"pass-through" },
  dcPowerRail: { name:"24 V DC distribution rail", category:"Terminals and wiring", prefix:"XR", terminals:["1","2","3","4","5","6","7","8"], kind:"junction" },
  neutralRail: { name:"Neutral distribution rail · N", category:"Terminals and wiring", prefix:"XN", terminals:["N1","N2","N3","N4","N5","N6","N7","N8"], kind:"junction" },
  junction: { name:"electrical junction", category:"Terminals and wiring", prefix:"J", terminals:["1","2","3","4"], kind:"junction" },
  phoenixPT25Twin: {
    name: "Phoenix Contact PT 2,5-TWIN · 3209549", category: "Terminals and wiring", prefix: "X",
    terminals: ["1", "2", "3"], kind: "junction", manufacturer: "Phoenix Contact", partNumber: "3209549",
    ratedVoltageV: 800, ratedCurrentA: 24, commonGroups: [{ terminals: ["1", "2", "3"], relationship: "one potential" }],
    source: { title: "Phoenix Contact PT 2,5-TWIN data sheet", url: "https://www.phoenixcontact.com/en-us/products/multi-conductor-terminal-block-pt-25-twin-3209549?type=pdf", terminalMapPages: [2, 7] },
    terminalNotes: { "1": "Twin-side conductor connection · editor port 1", "2": "Twin-side conductor connection · editor port 2", "3": "Single-side conductor connection · editor port 3" },
    simulationLimitations: "Three push-in connections form one ideal node. The editor numbers are positional labels. Resistance, heating, conductor fit, mounting, and rating enforcement are outside the model."
  },
  protectiveEarth: { name:"Protective-earth terminal", category:"Terminals and wiring", prefix:"PE", terminals:["PE"], kind:"earth" },
  groundCommon: { name:"Ground / common node · simulated equipotential", category:"Terminals and wiring", prefix:"COM", terminals:["COM1","COM2","COM3","COM4"], kind:"junction" },
});

const safeNumber = (value) => value === null || value === "" || value === undefined ? null : Number(value);
export const emptyElectricalDiagram = () => ({ components:[], wires:[] });

export function nextElectricalReference(type, components = []) {
  const spec=electricalComponentCatalog[type];
  if(!spec)throw new Error(`Unsupported generic electrical component: ${type}`);
  const used=new Set(components.map((component)=>String(component.reference||"").trim().toUpperCase()));
  for(let sequence=1;sequence<=9999;sequence++)if(!used.has(`${spec.prefix}${sequence}`))return `${spec.prefix}${sequence}`;
  throw new Error(`No available reference numbers remain for ${spec.prefix}.`);
}

function electricalChannelAddress(channel, index = Number(channel.match(/\d+$/)?.[0] || 1) - 1) {
  if (channel.startsWith("AI")) return `IW${index * 2}`;
  if (channel.startsWith("AQ")) return `QW${index * 2}`;
  return ioHardwareProfiles.siemensS7.address(channel.startsWith("I") ? "input" : "output", index);
}

export function hasElectricalChannelBinding(component, channel) {
  const mapping = component.ioMap?.[channel];
  const address = mapping?.address?.trim().toUpperCase();
  const legacyDefault = /^[IQ]\d+$/.test(channel) ? `${channel[0]}0.${Number(channel.slice(1)) - 1}` : null;
  return Boolean(mapping?.tag || (address && address !== electricalChannelAddress(channel) && address !== legacyDefault));
}

function allocateElectricalChannelDefaults(ioMap, existingComponents, mappedChannels = new Map()) {
  const used = new Set(existingComponents.flatMap((component) =>
    Object.values(component.ioMap || {}).map(({ address }) => address?.trim().toUpperCase())));
  for (const binding of mappedChannels.values()) used.add(binding.address?.trim().toUpperCase());
  const defaultsToMove = [];
  for (const [channel, binding] of Object.entries(ioMap)) {
    if (mappedChannels.has(channel)) continue;
    if (!mappedChannels.size || used.has(binding.address)) defaultsToMove.push(channel);
    else used.add(binding.address);
  }
  for (const channel of defaultsToMove) {
    let index = 0, address = electricalChannelAddress(channel, index);
    while (used.has(address)) address = electricalChannelAddress(channel, ++index);
    ioMap[channel].address = address;
    used.add(address);
  }
}

export function createElectricalComponent(type, sequence, x = 120, y = 120, existingComponents = []) {
  const spec = electricalComponentCatalog[type];
  if (!spec) throw new Error(`Unsupported generic electrical component: ${type}`);
  const channels = [...(spec.channels?.inputs || []),...(spec.channels?.outputs || []),
    ...(spec.channels?.analogInputs || []),...(spec.channels?.analogOutputs || [])];
  const ioMap = Object.fromEntries(channels.map((channel) => [channel, { tag:"", address:electricalChannelAddress(channel) }]));
  if (channels.length && existingComponents.length) allocateElectricalChannelDefaults(ioMap, existingComponents);
  return {
    id:crypto.randomUUID(), type, reference:`${spec.prefix}${sequence}`, label:spec.name,
    x:Math.round(x / 20) * 20, y:Math.round(y / 20) * 20, rotation:0,
    terminals:[...spec.terminals], tag:"", normallyClosed:Boolean(spec.normallyClosed),
    nominalVoltageV:spec.nominalVoltageV ?? null, ratedVoltageV:spec.ratedVoltageV ?? null, ratedCurrentA:spec.ratedCurrentA ?? null,
    manufacturer:spec.manufacturer||"", partNumber:spec.partNumber||"", productSource:spec.source?{...spec.source}:null, simulationOnly:true, ioMap,
    coilRef:"", closed:spec.kind === "manual-switch" ? Boolean(spec.initialClosed ?? (spec.normallyClosed ?? true)) : spec.kind === "junction", tripped:false, ...(spec.kind === "multi-pole-breaker" ? {breakerOpen:false} : {}),
    ...(spec.kind === "selector-switch" ? { selectorPosition:"I" } : {}),
    ...(spec.signalModel ? { signalModel:spec.signalModel, signalValue:null } : {}),
  };
}

export function connectElectricalTerminals(diagram, from, to, waypoints = []) {
  const components = new Map((diagram.components || []).map((component) => [component.id, component]));
  const valid = (endpoint) => {
    const component = components.get(endpoint?.componentId);
    return component && (component.terminals || []).includes(endpoint.terminal);
  };
  if (!valid(from) || !valid(to)) return { ok:false, error:"A wire endpoint must reference an existing component terminal." };
  if (!Array.isArray(waypoints) || waypoints.length > 200 || waypoints.some((point) => !Number.isFinite(Number(point?.x)) || !Number.isFinite(Number(point?.y)) || Number(point.x) < 0 || Number(point.x) > 2200 || Number(point.y) < 0 || Number(point.y) > 1400)) return { ok:false, error:"Wire route points must be finite canvas coordinates." };
  if (from.componentId === to.componentId && from.terminal === to.terminal) return { ok:false, error:"A terminal cannot be connected to itself." };
  const key = (endpoint) => `${endpoint.componentId}:${endpoint.terminal}`;
  if ((diagram.wires || []).some((wire) => wire.to && !wire.draft && (key(wire.from) === key(from) || key(wire.to) === key(from) || key(wire.from) === key(to) || key(wire.to) === key(to)))) return { ok:false, error:"A terminal already has a wire. Add an explicit junction or distribution rail for branches." };
  if ((diagram.wires || []).some((wire) => wire.to && !wire.draft && ((key(wire.from) === key(from) && key(wire.to) === key(to)) || (key(wire.from) === key(to) && key(wire.to) === key(from))))) return { ok:false, error:"These terminals are already connected." };
  const wire={ id:crypto.randomUUID(), from:{...from}, to:{...to} };
  if(waypoints.length)wire.waypoints=waypoints.map(({x,y})=>({x:Math.round(Number(x)),y:Math.round(Number(y))}));
  return { ok:true, wire };
}

export function rewireElectricalTerminal(diagram, wireId, side, endpoint) {
  const wire=(diagram.wires||[]).find((item)=>item.id===wireId);
  if(!wire||wire.draft||!wire.to)return {ok:false,error:"Select a completed wire to reconnect."};
  if(!["from","to"].includes(side))return {ok:false,error:"Choose the wire start or end terminal to reconnect."};
  const from=side==="from"?endpoint:wire.from,to=side==="to"?endpoint:wire.to;
  const check=connectElectricalTerminals({...diagram,wires:diagram.wires.filter((item)=>item.id!==wire.id)},from,to,wire.waypoints||[]);
  if(!check.ok)return check;
  return {ok:true,wire:{...wire,[side]:{...endpoint}}};
}

export function moveElectricalComponent(component, x, y, {snap=true} = {}) {
  const height=Math.max(80,32+Math.ceil((component.terminals?.length||0)/2)*22);
  const angle=(component.rotation||0)*Math.PI/180,cos=Math.round(Math.cos(angle)),sin=Math.round(Math.sin(angle));
  const corners=[[-16,0],[136,0],[136,height],[-16,height]].map(([cx,cy])=>[60+(cx-60)*cos-(cy-40)*sin,40+(cx-60)*sin+(cy-40)*cos]);
  const step=snap?20:1;
  const clamp=(value,axis,size)=>Math.max(Math.ceil(-Math.min(...corners.map(p=>p[axis]))/step)*step,Math.min(Math.floor((size-Math.max(...corners.map(p=>p[axis])))/step)*step,Math.round(Number(value)/step)*step));
  return { ...component, x:clamp(x,0,2200), y:clamp(y,1,1400) };
}
export function rotateElectricalComponent(component, degrees = 90) {
  const rotation = ((Number(component.rotation || 0) + degrees) % 360 + 360) % 360;
  if (![0,90,180,270].includes(rotation)) throw new Error("Electrical components rotate in 90-degree steps.");
  return moveElectricalComponent({ ...component, rotation },component.x,component.y);
}
export function duplicateElectricalComponent(component, reference, offset = 40) {
  return { ...structuredClone(component), id:crypto.randomUUID(), reference, x:component.x + offset, y:component.y + offset };
}

export function replaceElectricalComponent(diagram, componentId, newType, { terminalMap = {}, channelMap = {} } = {}) {
  const current=(diagram.components||[]).find((component)=>component.id===componentId),spec=electricalComponentCatalog[newType];
  if(!current)return {ok:false,error:"Select an existing component to replace."};
  if(!spec)return {ok:false,error:"Choose a supported component model from the toolbox."};
  if(current.type===newType)return {ok:false,error:"Choose a different component model."};
  const others = diagram.components.filter((component) => component.id !== current.id);
  const connectedTerminals = new Set((diagram.wires || []).flatMap(({ from, to }) =>
    [from, to].filter((endpoint) => endpoint?.componentId === current.id).map(({ terminal }) => terminal)));
  const mappedTerminals = new Map();
  for (const terminal of connectedTerminals) {
    const target = Object.hasOwn(terminalMap, terminal) ? terminalMap[terminal] : terminal;
    if (!spec.terminals.includes(target)) return { ok:false, error:`Map connected terminal ${terminal} to a terminal on the replacement.` };
    mappedTerminals.set(terminal, target);
  }
  if (new Set(mappedTerminals.values()).size !== mappedTerminals.size) {
    return { ok:false, error:"Assign each connected terminal to a different replacement terminal." };
  }
  const linkedContacts=others.filter((component)=>component.coilRef===current.reference),replacementKeepsCoil=spec.kind==="contactor"||newType==="relayCoil";
  if(linkedContacts.length&&!replacementKeepsCoil)return {ok:false,error:`Unlink the associated coil contacts from ${current.reference} before replacing it with this model.`};
  if(current.coilRef&&!(["auxiliaryNO","auxiliaryNC"].includes(newType)))return {ok:false,error:`Unlink ${current.reference} from its associated coil before replacing it with this model.`};
  const reference=nextElectricalReference(newType,others),sequence=Number(reference.slice(spec.prefix.length)),replacement=createElectricalComponent(newType,sequence,current.x,current.y);
  replacement.id=current.id;replacement.rotation=current.rotation||0;
  const currentSpec = electricalComponentCatalog[current.type];
  const mappedChannels = new Map();
  for (const direction of ["inputs", "outputs", "analogInputs", "analogOutputs"]) {
    for (const channel of currentSpec.channels?.[direction] || []) {
      const binding = current.ioMap?.[channel];
      if (!hasElectricalChannelBinding(current, channel)) continue;
      const target = Object.hasOwn(channelMap, channel) ? channelMap[channel] : channel;
      if (!spec.channels?.[direction]?.includes(target)) {
        return { ok:false, error:`Map bound channel ${channel} to a compatible channel on the replacement.` };
      }
      if (mappedChannels.has(target)) return { ok:false, error:`Replacement channel ${target} already has a mapping.` };
      const pinMap = direction === "inputs" ? "inputPins" : direction === "outputs" ? "outputPins" : null;
      if (pinMap) {
        const oldPin = currentSpec.channels[pinMap]?.[channel] || channel;
        const newPin = spec.channels[pinMap]?.[target] || target;
        if (connectedTerminals.has(oldPin) && mappedTerminals.get(oldPin) !== newPin) {
          return { ok:false, error:`Map terminal ${oldPin} to ${newPin} to keep its wire on channel ${target}.` };
        }
      }
      mappedChannels.set(target, { ...binding });
    }
  }
  const carriedAddresses = new Set();
  for (const [target, binding] of mappedChannels) {
    const address = binding.address?.trim().toUpperCase();
    if (address && carriedAddresses.has(address)) return { ok:false, error:`Multiple mapped channels share PLC address ${address}.` };
    if (address) carriedAddresses.add(address);
    replacement.ioMap[target] = binding;
  }
  allocateElectricalChannelDefaults(replacement.ioMap, others, mappedChannels);
  if (current.backplaneCpuId) {
    const cpu = others.find(({ id }) => id === current.backplaneCpuId);
    if (!isCompatibleBackplaneCpu(replacement, cpu)) return { ok:false, error:"Clear or change the Backplane CPU assignment before replacing this module." };
    replacement.backplaneCpuId = cpu.id;
  }
  if (others.some((module) => module.backplaneCpuId === current.id && !isCompatibleBackplaneCpu(module, replacement))) {
    return { ok:false, error:"Reassign the connected expansion modules before replacing their Backplane CPU." };
  }
  const clearanceOverlap=(first,second)=>{const a=electricalComponentBounds(first),b=electricalComponentBounds(second),gap=12;return Math.max(0,Math.min(a.right,b.right+gap)-Math.max(a.left,b.left-gap))*Math.max(0,Math.min(a.bottom,b.bottom+gap)-Math.max(a.top,b.top-gap));};
  if(others.some((other)=>clearanceOverlap(replacement,other)>clearanceOverlap(current,other)))return {ok:false,error:"Move nearby components before replacing this component; the replacement would create or worsen an overlap."};
  if(["auxiliaryNO","auxiliaryNC"].includes(newType))replacement.coilRef=current.coilRef||"";
  const mapEndpoint = (endpoint) => endpoint?.componentId === current.id
    ? { ...endpoint, terminal:mappedTerminals.get(endpoint.terminal) }
    : endpoint;
  const wires = (diagram.wires || []).map((wire) => ({ ...wire, from:mapEndpoint(wire.from), to:mapEndpoint(wire.to) }));
  return {ok:true,component:replacement,wires,previousReference:current.reference,referenceUpdates:linkedContacts.map((component)=>component.id)};
}

export function updateElectricalComponentProperties(component, updates = {}) {
  const next = { ...component, ...updates };
  if (component.type === "fuse" && component.tripped) next.tripped = true;
  return next;
}

export function isCompatibleBackplaneCpu(module, cpu) {
  return Boolean(cpu && electricalComponentCatalog[module.type]?.backplaneCpuTypes?.includes(cpu.type));
}

export function createExampleElectricalDiagram(tags, io, initialState = {}, outputLoadTypes = {}, deviceDefaults = {}) {
  const inputContactType=electricalComponentCatalog[deviceDefaults.inputContactType]?.kind==="contact"?deviceDefaults.inputContactType:"pushbuttonNO";
  const outputIndicatorType=electricalComponentCatalog[deviceDefaults.outputIndicatorType]?.kind==="load"?deviceDefaults.outputIndicatorType:"pilotLamp";
  const motorContactorType=electricalComponentCatalog[deviceDefaults.motorContactorType]?.kind==="contactor"?deviceDefaults.motorContactorType:"contactor3P";
  const requestedPlcType=deviceDefaults.plcType,plcType=electricalComponentCatalog[requestedPlcType]?.kind==="plc"?requestedPlcType:"genericPlc24v4di4do",plcSpec=electricalComponentCatalog[plcType];
  const requestedSupplyType=deviceDefaults.dcSupplyType,powerSupplyType=electricalComponentCatalog[requestedSupplyType]?.kind==="power-converter"?requestedSupplyType:"supply24vdc",mainsType=powerSupplyType==="supply24vdc"?null:(electricalComponentCatalog[deviceDefaults.acSupplyType]?.kind==="single-phase-source"?deviceDefaults.acSupplyType:"singlePhaseSupply");
  const usesMainsSupply=Boolean(mainsType),plcX=usesMainsSupply?740:520,positiveRailX=usesMainsSupply?520:300,returnRailX=usesMainsSupply?960:740;
  const components = [], wires = [];
  const add = (type, x, y, tag = "") => {
    const sequence = Number(nextElectricalReference(type,components).replace(electricalComponentCatalog[type].prefix,""));
    const component = createElectricalComponent(type, sequence, x, y); component.tag = tag; components.push(component); return component;
  };
  const wire = (a, at, b, bt) => { const result = connectElectricalTerminals({ components, wires }, { componentId: a.id, terminal: at }, { componentId: b.id, terminal: bt }); if (!result.ok) throw new Error(result.error); wires.push(result.wire); };
  const mains=usesMainsSupply?add(mainsType,80,80):null,supply = add(powerSupplyType, usesMainsSupply?300:80, 80), plc = add(plcType, plcX, 80), positiveRail=add("dcPowerRail",positiveRailX,80),returnRail=add("dcPowerRail",returnRailX,80);
  if(mains){wire(mains,"L",supply,"L");wire(mains,"N",supply,"N");wire(mains,"PE",supply,"PE");}
  wire(supply, "+", positiveRail, "1"); wire(supply, usesMainsSupply?"−A":"−", returnRail, "1"); wire(positiveRail,"2",plc,plcSpec.channels.powerPositivePin||"L+");
  if(plcSpec.channels.inputCommonPins?.length&&plcSpec.channels.outputReturnPin){const inputCommon=add("groundCommon",1520,80),outputCommon=add("groundCommon",1720,80);wire(returnRail,"2",inputCommon,"COM1");wire(inputCommon,"COM2",plc,plcSpec.channels.powerNegativePin||"M");wire(inputCommon,"COM3",plc,plcSpec.channels.inputCommonPins[0]);wire(inputCommon,"COM4",outputCommon,"COM1");wire(outputCommon,"COM2",plc,plcSpec.channels.inputCommonPins[1]||plcSpec.channels.inputCommonPins[0]);wire(outputCommon,"COM3",plc,plcSpec.channels.outputReturnPin);if(plcSpec.channels.outputSupplyPin)wire(positiveRail,"7",plc,plcSpec.channels.outputSupplyPin);}else wire(returnRail,"2",plc,plcSpec.channels.powerNegativePin||"M");
  if(plc.terminals.includes("PE")){const plcEarth=add("protectiveEarth",plcX,280);wire(plc,"PE",plcEarth,"PE");}
  const boolInputs = (tags || []).filter((tag) => tag.role === "input" && tag.type === "BOOL");
  boolInputs.slice(0, 4).forEach((tag, index) => {
    const button = add(inputContactType, 80, 300 + index * 120, tag.name),[lineTerminal,signalTerminal]=electricalComponentCatalog[inputContactType].terminals,channel=`I${index+1}`; plc.ioMap[channel] = { tag: tag.name, address: /^I\d+\.\d+$/.test(tag.address||"")?tag.address:`I0.${index}` };
    wire(positiveRail, String(index+3), button, lineTerminal); wire(button, signalTerminal, plc, plcSpec.channels.inputPins?.[channel]||channel);
    if (initialState[tag.name]) button.closed = true;
  });
  const boolOutputs = (tags || []).filter((tag) => tag.role === "output" && tag.type === "BOOL");
  boolOutputs.slice(0, 4).forEach((tag, index) => {
    const requestedType=outputLoadTypes[tag.name],type=requestedType==="pilotLamp"&&deviceDefaults.outputIndicatorType?outputIndicatorType:electricalComponentCatalog[requestedType]?.kind?requestedType:outputIndicatorType,load = add(type, 960, 300 + index * 160, tag.name),channel=`Q${index+1}`,plcOutput=plcSpec.channels.outputPins?.[channel]||channel; plc.ioMap[channel] = { tag: tag.name, address: /^Q\d+\.\d+$/.test(tag.address||"")?tag.address:`Q0.${index}` };
    if (type === "threePhaseMotor") {
      const contactor=add(motorContactorType,1180,300+index*200),phaseSource=add("supply3phase",80+index*220,1140),contactorSpec=electricalComponentCatalog[motorContactorType],[coilPositive,coilNegative]=contactorSpec.coil;
      wire(plc,plcOutput,contactor,coilPositive); wire(contactor,coilNegative,returnRail,String(index+3));
      for(const [phaseIndex,phase,motorPin] of [[0,"L1","U1"],[1,"L2","V1"],[2,"L3","W1"]]) { const [mainIn,mainOut]=contactorSpec.mainPairs[phaseIndex]; wire(phaseSource,phase,contactor,mainIn); wire(contactor,mainOut,load,motorPin); }
      wire(phaseSource,"PE",load,"PE");
    } else { wire(plc,plcOutput,load,electricalComponentCatalog[type].terminals[0]); wire(load,electricalComponentCatalog[type].terminals[1],returnRail,String(index+3)); }
  });
  const analogInputs = (tags || []).filter((tag) => tag.role === "input" && ["INT", "REAL"].includes(tag.type));
  if (analogInputs.length) {
    const module = add("analogInputModule2", 520, 800);
    wire(returnRail,"7",module,"MANA");
    analogInputs.slice(0, 2).forEach((tag, index) => {
      module.ioMap[`AI${index + 1}`] = { tag: tag.name, address: /^IW\d+$/.test(tag.address||"")?tag.address:`IW${index * 2}` };
      const source=add("analogSignalSource",80,800+index*100,tag.name);
      wire(source,"SIG+",module,`AI${index+1}+`); wire(source,"SIG−",module,`AI${index+1}−`);
    });
  }
  const analogOutputs = (tags || []).filter((tag) => tag.role === "output" && ["INT", "REAL"].includes(tag.type));
  if (analogOutputs.length) {
    const module = add("analogOutputModule2", 960, 800);
    wire(returnRail,"8",module,"MANA");
    analogOutputs.slice(0, 2).forEach((tag, index) => {
      module.ioMap[`AQ${index + 1}`] = { tag: tag.name, address: /^QW\d+$/.test(tag.address||"")?tag.address:`QW${index * 2}` };
      const indicator=add("analogSignalIndicator",1180,840+index*100,tag.name);
      wire(module,`AQ${index+1}+`,indicator,"SIG+"); wire(module,`AQ${index+1}−`,indicator,"SIG−");
    });
  }
  return { components, wires, inputStates: { ...initialState } };
}

export function electricalComponentBounds(component,x=component?.x,y=component?.y) {
  const spec=electricalComponentCatalog[component?.type],layout=spec?.terminalLayout||spec?.terminals||[],height=Math.max(80,32+Math.ceil(layout.length/2)*22),angle=Number(component?.rotation||0)*Math.PI/180,cos=Math.round(Math.cos(angle)),sin=Math.round(Math.sin(angle)),originX=Number(x),originY=Number(y);
  const corners=[[-16,0],[136,0],[136,height],[-16,height]].map(([cx,cy])=>[60+(cx-60)*cos-(cy-40)*sin,40+(cx-60)*sin+(cy-40)*cos]);
  return {left:originX+Math.min(...corners.map(point=>point[0])),top:originY+Math.min(...corners.map(point=>point[1])),right:originX+Math.max(...corners.map(point=>point[0])),bottom:originY+Math.max(...corners.map(point=>point[1]))};
}

export function separateElectricalComponentOverlaps(diagram) {
  const components=Array.isArray(diagram?.components)?diagram.components:[],placed=[],moved=[],grid=20,clearance=12;
  const overlaps=(a,b)=>a.left<b.right+clearance&&a.right>b.left-clearance&&a.top<b.bottom+clearance&&a.bottom>b.top-clearance;
  for(const component of components){
    if(!electricalComponentCatalog[component?.type]||!Number.isFinite(Number(component.x))||!Number.isFinite(Number(component.y)))continue;
    let bounds=electricalComponentBounds(component);
    if(!placed.some((item)=>overlaps(bounds,item.bounds))){placed.push({component,bounds});continue;}
    const originX=Math.round(Number(component.x)/grid)*grid,originY=Math.round(Number(component.y)/grid)*grid;
    let location=null;
    search: for(let radius=1;radius<=160;radius++){
      const offsets=[];
      for(let dx=-radius;dx<=radius;dx++)offsets.push([dx,-radius],[dx,radius]);
      for(let dy=-radius+1;dy<radius;dy++)offsets.push([-radius,dy],[radius,dy]);
      for(const [dx,dy] of offsets){
        const x=originX+dx*grid,y=originY+dy*grid,candidate=electricalComponentBounds(component,x,y);
        if(candidate.left<0||candidate.top<0||candidate.right>2200||candidate.bottom>1400)continue;
        if(placed.some((item)=>overlaps(candidate,item.bounds)))continue;
        location={x,y,bounds:candidate};break search;
      }
    }
    if(location){component.x=location.x;component.y=location.y;bounds=location.bounds;moved.push(component.id);}
    placed.push({component,bounds});
  }
  return moved;
}

export function validateElectricalDiagram(diagram, projectTags = []) {
  const issues = [], components = Array.isArray(diagram?.components) ? diagram.components : [], wires = Array.isArray(diagram?.wires) ? diagram.wires : [];
  const ids = new Set(), references = new Set(), endpoints = new Set(), mappedAddresses = new Set();
  for (const component of components) {
    const spec = electricalComponentCatalog[component.type];
    if (!component.id || ids.has(component.id)) issues.push({level:"error",code:"electrical-component-id",message:"Electrical component IDs must be unique."}); else ids.add(component.id);
    if (!spec) { issues.push({level:"error",code:"electrical-component-type",message:`Unsupported component type ${component.type || "(missing)"}.`}); continue; }
    if (spec.backplaneCpuTypes && !isCompatibleBackplaneCpu(component, components.find(({ id }) => id === component.backplaneCpuId))) {
      issues.push({level:"warning",code:"electrical-backplane-cpu",message:`${component.reference} needs a compatible backplane CPU assignment before its field inputs can run.`});
    }
    const reference = String(component.reference || "").trim().toUpperCase();
    if (!reference || references.has(reference)) issues.push({level:"error",code:"electrical-reference",message:`Component reference ${reference || "(missing)"} must be present and unique.`}); else references.add(reference);
    if (!Number.isFinite(Number(component.x)) || !Number.isFinite(Number(component.y)) || ![0,90,180,270].includes(Number(component.rotation || 0))) issues.push({level:"error",code:"electrical-layout",message:`${reference} needs finite grid coordinates and a right-angle rotation.`});
    for (const field of ["ratedVoltageV","ratedCurrentA"]) { const value = safeNumber(component[field]); if (value !== null && (!Number.isFinite(value) || value <= 0)) issues.push({level:"error",code:"electrical-rating",message:`${reference} ${field} must be blank or a positive number.`}); }
    const sourceVerified=Boolean(spec.source?.url)&&component.manufacturer===spec.manufacturer&&component.partNumber===spec.partNumber&&component.productSource?.url===spec.source.url;
    if ((component.manufacturer || component.partNumber) && !sourceVerified) issues.push({level:"warning",code:"electrical-unverified-device",message:`${reference} contains user-entered manufacturer data; AdigunSPs does not verify it.`});
    if (spec.kind === "selector-switch" && !Object.hasOwn(spec.positionPairs,component.selectorPosition)) issues.push({level:"error",code:"electrical-selector-position",message:`${reference} selector position must be I or II.`});
    if (["auxiliaryNO","auxiliaryNC"].includes(component.type) && component.coilRef) {
      const linked = components.find((item) => String(item.reference || "").trim().toUpperCase() === String(component.coilRef).trim().toUpperCase() && (electricalComponentCatalog[item.type]?.kind === "contactor" || item.type === "relayCoil"));
      if (!linked) issues.push({level:"error",code:"electrical-coil-reference",message:`${reference} links to missing or unsupported coil ${component.coilRef}.`});
    }
    const tagMap = new Map(projectTags.map((tag) => [tag.name,tag]));
    for (const [channel,mapping] of Object.entries(component.ioMap || {})) {
      if (!mapping.address?.trim()) issues.push({level:"error",code:"electrical-io-address",message:`${reference} channel ${channel} needs an address.`});
      else if (mappedAddresses.has(mapping.address.trim().toUpperCase())) issues.push({level:"error",code:"electrical-io-address-duplicate",message:`${reference} assigns address ${mapping.address} to more than one channel.`});
      else mappedAddresses.add(mapping.address.trim().toUpperCase());
      const isAnalogInput=spec.channels?.analogInputs?.includes(channel),isAnalogOutput=spec.channels?.analogOutputs?.includes(channel),isDigitalInput=spec.channels?.inputs?.includes(channel),isDigitalOutput=spec.channels?.outputs?.includes(channel),formatValid=isAnalogInput?/^IW\d+$/.test(mapping.address||""):isAnalogOutput?/^QW\d+$/.test(mapping.address||""):isDigitalInput?/^I\d+\.\d+$/.test(mapping.address||""):isDigitalOutput?/^Q\d+\.\d+$/.test(mapping.address||""):false;
      if (!formatValid) issues.push({level:"error",code:"electrical-io-address-format",message:`${reference} channel ${channel} needs a matching generic I/Q or IW/QW address.`});
      if (mapping.tag && projectTags.length) {
        const tag = tagMap.get(mapping.tag), isInput = spec.channels?.inputs?.includes(channel) || spec.channels?.analogInputs?.includes(channel), isOutput = spec.channels?.outputs?.includes(channel) || spec.channels?.analogOutputs?.includes(channel);
        if (!tag) issues.push({level:"error",code:"electrical-io-tag",message:`${reference} channel ${channel} references missing PLC tag ${mapping.tag}.`});
        else if (isInput && tag.role !== "input") issues.push({level:"error",code:"electrical-io-role",message:`${reference} input ${channel} must map to an input tag.`});
        else if (isOutput && tag.role !== "output") issues.push({level:"error",code:"electrical-io-role",message:`${reference} output ${channel} must map to an output tag.`});
        else if ((isInput || isOutput) && tag.type !== "BOOL" && !channel.startsWith("AI") && !channel.startsWith("AQ")) issues.push({level:"error",code:"electrical-io-type",message:`${reference} digital channel ${channel} must map to a BOOL tag.`});
        else if ((channel.startsWith("AI") || channel.startsWith("AQ")) && !["INT","REAL"].includes(tag.type)) issues.push({level:"error",code:"electrical-io-type",message:`${reference} analog channel ${channel} must map to an INT or REAL tag.`});
      }
    }
    for (const terminal of spec.terminals) endpoints.add(`${component.id}:${terminal}`);
  }
  const spatialCells=new Map(),placed=[];
  for(const component of components) {
    if(!electricalComponentCatalog[component.type]||!Number.isFinite(Number(component.x))||!Number.isFinite(Number(component.y)))continue;
    const bounds=electricalComponentBounds(component);
    if(Object.values(bounds).some((value)=>!Number.isFinite(value)))continue;
    placed.push({component,bounds});
  }
  const overlapPairs=[];let additionalOverlaps=false;const cellSize=120,maxOverlapPairs=6;
  overlapScan: for(let index=0;index<placed.length;index++) {
    const current=placed[index],minX=Math.floor(current.bounds.left/cellSize),maxX=Math.floor(current.bounds.right/cellSize),minY=Math.floor(current.bounds.top/cellSize),maxY=Math.floor(current.bounds.bottom/cellSize),candidates=new Set();
    for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)for(const candidate of spatialCells.get(`${x},${y}`)||[])candidates.add(candidate);
    for(const candidateIndex of candidates) {
      const prior=placed[candidateIndex],a=prior.bounds,b=current.bounds;
      if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top) {
        if(overlapPairs.length===maxOverlapPairs){additionalOverlaps=true;break overlapScan;}
        overlapPairs.push([prior.component,current.component]);
      }
    }
    for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){const key=`${x},${y}`,bucket=spatialCells.get(key)||[];bucket.push(index);spatialCells.set(key,bucket);}
  }
  if(overlapPairs.length)issues.unshift({level:"warning",code:"electrical-component-overlap",message:`Overlapping component cards: ${overlapPairs.map(([a,b])=>`${a.reference||a.id} and ${b.reference||b.id}`).join("; ")}.${additionalOverlaps?" Additional overlaps may exist.":" Move the listed components apart before wiring."}`});
  const completeWires=wires.filter((wire)=>wire?.from&&wire?.to&&!wire.draft),seenWires = new Set();
  for (const wire of wires) {
    if(wire?.draft===true&&!wire.to){const endpoint=`${wire.from?.componentId}:${wire.from?.terminal}`;if(!endpoints.has(endpoint))issues.push({level:"error",code:"electrical-wire-endpoint",message:`Wire ${wire.id||"(missing)"} references a missing source terminal.`});if(wire.waypoints!==undefined&&(!Array.isArray(wire.waypoints)||wire.waypoints.length>200||wire.waypoints.some((point)=>!Number.isFinite(Number(point?.x))||!Number.isFinite(Number(point?.y))||Number(point.x)<0||Number(point.x)>2200||Number(point.y)<0||Number(point.y)>1400)))issues.push({level:"error",code:"electrical-wire-route",message:`Wire ${wire.id||"(missing)"} has invalid route points.`});if(wire.end&&(!Number.isFinite(Number(wire.end.x))||!Number.isFinite(Number(wire.end.y))||Number(wire.end.x)<0||Number(wire.end.x)>2200||Number(wire.end.y)<0||Number(wire.end.y)>1400))issues.push({level:"error",code:"electrical-wire-route",message:`Wire ${wire.id||"(missing)"} has an invalid free endpoint.`});issues.push({level:"warning",code:"electrical-wire-draft",message:`Wire ${wire.id||"(draft)"} is paused before reaching a destination terminal.`});continue;}
    const from = `${wire.from?.componentId}:${wire.from?.terminal}`, to = `${wire.to?.componentId}:${wire.to?.terminal}`;
    if (!endpoints.has(from) || !endpoints.has(to)) issues.push({level:"error",code:"electrical-wire-endpoint",message:`Wire ${wire.id || "(missing)"} references a missing terminal.`});
    if (from === to) issues.push({level:"error",code:"electrical-wire-self",message:"A wire cannot connect a terminal to itself."});
    if(wire.waypoints!==undefined&&(!Array.isArray(wire.waypoints)||wire.waypoints.length>200||wire.waypoints.some((point)=>!Number.isFinite(Number(point?.x))||!Number.isFinite(Number(point?.y))||Number(point.x)<0||Number(point.x)>2200||Number(point.y)<0||Number(point.y)>1400)))issues.push({level:"error",code:"electrical-wire-route",message:`Wire ${wire.id||"(missing)"} has invalid route points.`});
    const normalized = [from,to].sort().join("|");
    if (seenWires.has(normalized)) issues.push({level:"error",code:"electrical-wire-duplicate",message:"Duplicate terminal connection."}); else seenWires.add(normalized);
    for (const endpoint of [from,to]) { const count=completeWires.filter((item)=>`${item.from?.componentId}:${item.from?.terminal}`===endpoint||`${item.to?.componentId}:${item.to?.terminal}`===endpoint).length;if(count>1)issues.push({level:"error",code:"electrical-terminal-branch",message:`${endpoint} has multiple wires; branch through an explicit junction.`}); }
  }
  for (const component of components) {
    const spec = electricalComponentCatalog[component.type]; if (!spec) continue;
    const mappedChannels = Object.entries(component.ioMap || {}).filter(([, mapping]) => typeof mapping?.tag === "string" && mapping.tag.trim()).map(([channel]) => channel);
    const channelNames = [...(spec.channels?.inputs || []), ...(spec.channels?.outputs || []), ...(spec.channels?.analogInputs || []), ...(spec.channels?.analogOutputs || [])];
    const hasMappedChannel = (channels) => channels?.some((channel) => mappedChannels.includes(channel));
    for (const terminal of spec.terminals) {
      const channel = terminal.replace(/[+−-]$/u, "");
      if (channelNames.includes(channel) && !mappedChannels.includes(channel)) continue;
      if (Object.values(spec.channels?.inputPins || {}).includes(terminal) && !mappedChannels.some((name) => spec.channels.inputPins[name] === terminal)) continue;
      if (Object.values(spec.channels?.outputPins || {}).includes(terminal) && !mappedChannels.some((name) => spec.channels.outputPins[name] === terminal)) continue;
      if (spec.kind === "junction") continue;
      if (spec.kind === "digital-input-module" && !hasMappedChannel(spec.channels?.inputs)) continue;
      if (spec.kind === "digital-output-module" && !hasMappedChannel(spec.channels?.outputs)) continue;
      if (spec.kind === "analog-input-module" && !hasMappedChannel(spec.channels?.analogInputs)) continue;
      if (spec.kind === "analog-output-module" && !hasMappedChannel(spec.channels?.analogOutputs)) continue;
      if (!completeWires.some((wire) => (wire.from?.componentId === component.id && wire.from?.terminal === terminal) || (wire.to?.componentId === component.id && wire.to?.terminal === terminal))) issues.push({level:"warning",code:"electrical-floating-terminal",message:`${component.reference || component.id} terminal ${terminal} is not wired.`});
    }
  }
  return issues;
}

export function simulateElectricalDiagram(diagram, inputStates = {}, outputStates = {}) {
  const all = diagram.components || [], byId = new Map(all.map((component) => [component.id, component]));
  const key = (id, pin) => `${id}:${pin}`;
  const supplies = all.filter((component) => ["source", "three-phase-source", "single-phase-source", "power-converter"].includes(electricalComponentCatalog[component.type]?.kind));
  let coilEnergized = new Set();
  const makeGraph = () => {
    const nodes = new Map();
    const addEdge = (a, b) => { if (!nodes.has(a)) nodes.set(a, new Set()); if (!nodes.has(b)) nodes.set(b, new Set()); nodes.get(a).add(b); nodes.get(b).add(a); };
    for (const wire of diagram.wires || []) {
      const from = byId.get(wire.from?.componentId), to = byId.get(wire.to?.componentId);
      if (from?.terminals?.includes(wire.from?.terminal) && to?.terminals?.includes(wire.to?.terminal)) addEdge(key(from.id, wire.from.terminal), key(to.id, wire.to.terminal));
    }
    for (const component of all) {
      const spec = electricalComponentCatalog[component.type]; if (!spec) continue;
      const signal = Boolean(inputStates[component.tag || component.reference]);
      if (spec.channels?.relayCommonPins) {
        const [first, second] = spec.channels.relayCommonPins;
        addEdge(key(component.id, first), key(component.id, second));
      }
      if (spec.channels?.inputPolarity === "sink-source") {
        const [first, second] = spec.channels.inputCommonPins;
        addEdge(key(component.id, first), key(component.id, second));
      }
      for (const { commonPins:[first, second] } of spec.relayOutputGroups || []) {
        addEdge(key(component.id, first), key(component.id, second));
      }
      if (spec.kind === "junction") for (let i = 0; i < spec.terminals.length; i++) for (let j = i + 1; j < spec.terminals.length; j++) addEdge(key(component.id, spec.terminals[i]), key(component.id, spec.terminals[j]));
      else if (spec.kind === "power-converter") addEdge(key(component.id,"−A"),key(component.id,"−B"));
      else if (spec.kind === "pass-through") addEdge(key(component.id,spec.terminals[0]),key(component.id,spec.terminals[1]));
      else if (spec.kind === "multi-pole-breaker" && !component.breakerOpen && !signal) for (const pair of spec.mainPairs||[]) addEdge(key(component.id,pair[0]),key(component.id,pair[1]));
      else if (spec.kind === "selector-switch") for (const terminal of spec.positionPairs[component.selectorPosition]?.slice(1)||[]) addEdge(key(component.id,spec.positionPairs[component.selectorPosition][0]),key(component.id,terminal));
      else if (spec.kind === "contact" || spec.kind === "overload-contact") {
        const linkedCoil = component.coilRef ? all.find((item) => String(item.reference || "").trim().toUpperCase() === String(component.coilRef).trim().toUpperCase() && (electricalComponentCatalog[item.type]?.kind === "contactor" || item.type === "relayCoil")) : null;
        const actuated = component.coilRef ? Boolean(linkedCoil && coilEnergized.has(linkedCoil.id)) : signal;
        const contactPairs = spec.contactPairs || [{terminals:spec.terminals,normallyClosed:component.normallyClosed ?? spec.normallyClosed}];
        for (const pair of contactPairs) {
          const tripped=Boolean(component.tripped||signal);
          const normallyClosed=pair.normallyClosed ?? component.normallyClosed ?? spec.normallyClosed ?? true;
          const closed = spec.kind === "overload-contact" ? normallyClosed ? !tripped : tripped : normallyClosed ? !actuated : actuated;
          if (closed) addEdge(key(component.id, pair.terminals[0]), key(component.id, pair.terminals[1]));
        }
        for(const pair of spec.mainPairs||[])addEdge(key(component.id,pair[0]),key(component.id,pair[1]));
      } else if (spec.kind === "manual-switch" && component.closed && !component.tripped && !signal) addEdge(key(component.id, spec.terminals[0]), key(component.id, spec.terminals[1]));
      else if (spec.kind === "contactor") {
        const on = coilEnergized.has(component.id);
        if (on) { for (const pair of spec.mainPairs || []) addEdge(key(component.id, pair[0]), key(component.id, pair[1])); if (spec.auxNOPair) addEdge(key(component.id, spec.auxNOPair[0]), key(component.id, spec.auxNOPair[1])); }
        else if (spec.auxNCPair) addEdge(key(component.id, spec.auxNCPair[0]), key(component.id, spec.auxNCPair[1]));
      }
    }
    for (const component of all) for (const channel of electricalComponentCatalog[component.type]?.channels?.outputs || []) {
      const spec = electricalComponentCatalog[component.type], tag = component.ioMap?.[channel]?.tag;
      if (!tag || !Boolean(outputStates[tag])) continue;
      if (spec.relayOutputGroups) {
        const { powerPositivePin, powerNegativePin, outputPins } = spec.channels;
        const nets = sourceNets(nodes), output = outputPins[channel];
        const group = spec.relayOutputGroups.find(({ outputs }) => outputs.includes(output));
        if (group && hasPoweredBackplane(component, nets) && coilPowered(nets, component, powerPositivePin,
          powerNegativePin, { minimumVoltageV:24, maximumVoltageV:24 })) {
          addEdge(key(component.id, group.commonPins[0]), key(component.id, output));
        }
        continue;
      }
      if (spec.channels.relayCommonPins) {
        const { powerPositivePin, powerNegativePin, outputPins, relayCommonPins } = spec.channels;
        if (coilPowered(sourceNets(nodes), component, powerPositivePin, powerNegativePin, spec.controllerSupply)) {
          addEdge(key(component.id, relayCommonPins[0]), key(component.id, outputPins[channel]));
        }
        continue;
      }
      const supplyPin = spec.channels.outputSupplyPin || "L+", outputPin = spec.channels.outputPins?.[channel] || channel;
      const supplied = spec.channels.outputReturnPin
        ? poweredPair(sourceNets(nodes), component, supplyPin, spec.channels.outputReturnPin)
        : true;
      if (supplied) addEdge(key(component.id, supplyPin), key(component.id, outputPin));
    }
    return nodes;
  };
  const reachable = (nodes, start) => { const found = new Set([start]), queue = [start]; while (queue.length) for (const next of nodes.get(queue.shift()) || []) if (!found.has(next)) { found.add(next); queue.push(next); } return found; };
  const sourceNets = (nodes) => supplies.map((component) => {
    const kind = electricalComponentCatalog[component.type].kind;
    if (kind === "three-phase-source") return { component, nets: Object.fromEntries(["L1", "L2", "L3", "PE"].map((pin) => [pin, reachable(nodes, key(component.id, pin))])) };
    if (kind === "single-phase-source") return { component, nets: Object.fromEntries(["L", "N", "PE"].map((pin) => [pin, reachable(nodes, key(component.id, pin))])) };
    if (kind === "power-converter") {
      const inputPowered = supplies.some((input) => {
        if (electricalComponentCatalog[input.type]?.kind !== "single-phase-source") return false;
        const line=reachable(nodes,key(input.id,"L")),neutral=reachable(nodes,key(input.id,"N"));
        return !sourceHasShort({L:line,N:neutral})&&line.has(key(component.id,"L"))&&neutral.has(key(component.id,"N"));
      });
      return { component, nets: inputPowered ? { positive:reachable(nodes,key(component.id,"+")),negative:reachable(nodes,key(component.id,"−A")) } : { positive:new Set(),negative:new Set() } };
    }
    return { component, nets: { positive: reachable(nodes, key(component.id, "+")), negative: reachable(nodes, key(component.id, "−")) } };
  });
  const sourceHasShort=(poles)=>{const names=Object.keys(poles);for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)if([...poles[names[i]]].some((node)=>poles[names[j]].has(node)))return true;return false;};
  const poweredPair = (nets, component, a, b) => nets.some(({ nets: poles }) => {
    const positive=poles.positive||poles.L,negative=poles.negative||poles.N;
    return !sourceHasShort(poles) && positive && negative && positive.has(key(component.id,a)) && negative.has(key(component.id,b));
  });
  const coilPowered = (nets, component, a, b, coilSupply) => {
    if (!coilSupply) return poweredPair(nets, component, a, b);
    return nets.some((entry) => {
      const sourceSpec=electricalComponentCatalog[entry.component.type],kind=sourceSpec?.kind,voltage=Number(entry.component.nominalVoltageV??sourceSpec?.nominalVoltageV);
      return (kind==="source"||kind==="power-converter")&&Number.isFinite(voltage)&&voltage>=coilSupply.minimumVoltageV&&voltage<=coilSupply.maximumVoltageV&&poweredPair([entry],component,a,b);
    });
  };
  // Coil power is derived from terminal voltage paths, never from the output tag alone.
  const hasPoweredBackplane = (module, nets) => {
    const cpu = all.find(({ id }) => id === module.backplaneCpuId);
    if (!isCompatibleBackplaneCpu(module, cpu)) return false;
    const { powerPositivePin, powerNegativePin } = electricalComponentCatalog[cpu.type].channels;
    return coilPowered(nets, cpu, powerPositivePin, powerNegativePin, { minimumVoltageV: 20.4, maximumVoltageV: 28.8 });
  };
  const coilComponents = all.filter((component) => electricalComponentCatalog[component.type]?.kind === "contactor" || component.type === "relayCoil");
  let coilStatesStable = coilComponents.length === 0;
  for (let pass = 0; pass <= coilComponents.length + 1; pass++) {
    const nodes = makeGraph(), nets = sourceNets(nodes);
    const nextEnergized = new Set();
    for (const component of coilComponents) {
      const [a, b] = electricalComponentCatalog[component.type].coil || ["A1", "A2"];
      if (coilPowered(nets, component, a, b, electricalComponentCatalog[component.type].coilSupply)) nextEnergized.add(component.id);
    }
    coilStatesStable = nextEnergized.size === coilEnergized.size && [...nextEnergized].every((id) => coilEnergized.has(id));
    coilEnergized = nextEnergized;
    if (coilStatesStable) break;
  }
  if (!coilStatesStable) coilEnergized.clear();
  const nodes = makeGraph(), nets = sourceNets(nodes), plcInputs = {}, analogInputs = {}, analogOutputs = {}, componentStates = {};
  const pairedConnected=(a,aPositive,aNegative,b,bPositive,bNegative)=>{const positive=reachable(nodes,key(a.id,aPositive)),negative=reachable(nodes,key(a.id,aNegative));return positive.has(key(b.id,bPositive))&&negative.has(key(b.id,bNegative))&&![...positive].some((node)=>negative.has(node));};
  for (const controller of all) {
    const spec = electricalComponentCatalog[controller.type]; if (!spec || !(spec.channels?.inputs?.length || spec.channels?.analogInputs?.length || spec.channels?.analogOutputs?.length)) continue;
    const physicalMap = spec.channels.inputPins || {}, positivePowerPin = spec.channels.powerPositivePin || "L+", negativePowerPin = spec.channels.powerNegativePin || "M";
    const hasReturn = nets.some(({ nets: poles }) => !sourceHasShort(poles) && (poles.negative?.has(key(controller.id, negativePowerPin)) || poles.N?.has(key(controller.id, negativePowerPin))));
    const hasPositivePower = nets.some(({ nets: poles }) => !sourceHasShort(poles) && (poles.positive || poles.L)?.has(key(controller.id, positivePowerPin)));
    const hasInputCommon = !spec.channels.inputCommonPins?.length || spec.channels.inputCommonPins.some((pin) => nets.some(({ nets: poles }) => !sourceHasShort(poles) && (poles.negative || poles.N)?.has(key(controller.id, pin))));
    const backplanePowered = spec.inputGroups && hasPoweredBackplane(controller, nets);
    for (const channel of spec.channels.inputs || []) {
      const tag = controller.ioMap?.[channel]?.tag, pin = physicalMap[channel] || channel;
      if (!tag) continue;
      if (spec.inputGroups) {
        const group = spec.inputGroups.find(({ inputs }) => inputs.includes(pin));
        plcInputs[tag] = Boolean(backplanePowered && group && (coilPowered(nets, controller, pin, group.common, spec.inputSignalVoltage)
          || coilPowered(nets, controller, group.common, pin, spec.inputSignalVoltage)));
      } else if (spec.channels.inputPolarity === "sink-source") {
        plcInputs[tag] = coilPowered(nets, controller, positivePowerPin, negativePowerPin, spec.controllerSupply)
          && spec.channels.inputCommonPins.some((common) => coilPowered(nets, controller, pin, common, spec.controllerSupply)
            || coilPowered(nets, controller, common, pin, spec.controllerSupply));
      } else {
        plcInputs[tag] = Boolean(hasReturn && (!spec.channels.powerPositivePin || hasPositivePower) && hasInputCommon
          && nets.some(({ nets: poles }) => !sourceHasShort(poles) && (poles.positive || poles.L)?.has(key(controller.id, pin))));
      }
    }
    for (const channel of spec.channels.analogInputs || []) {
      const tag=controller.ioMap?.[channel]?.tag, signal=all.find((item)=>item.tag===tag&&electricalComponentCatalog[item.type]?.kind==="analog-signal-source");
      if (!tag||!signal) continue;
      const positivePin=`${channel}+`,negativePin=`${channel}−`;
      const signalSpec=electricalComponentCatalog[signal.type],signalPositive=signalSpec.signalPins?.positive||"SIG+",signalNegative=signalSpec.signalPins?.negative||"SIG−",powerPins=signalSpec.signalPowerPins;
      const powered=!powerPins||nets.some(({component:source,nets:poles})=>{const sourceSpec=electricalComponentCatalog[source.type],kind=sourceSpec?.kind,voltage=Number(source.nominalVoltageV??sourceSpec?.nominalVoltageV),dcSource=kind==="source"||kind==="power-converter";return dcSource&&(!Number.isFinite(powerPins.minimumVoltageV)||voltage>=powerPins.minimumVoltageV)&&(!Number.isFinite(powerPins.maximumVoltageV)||voltage<=powerPins.maximumVoltageV)&&!sourceHasShort(poles)&&(poles.positive||poles.L)?.has(key(signal.id,powerPins.positive))&&(poles.negative||poles.N)?.has(key(signal.id,powerPins.negative));});
      const value=Number(inputStates[tag]);
      if (powered&&pairedConnected(signal,signalPositive,signalNegative,controller,positivePin,negativePin)&&Number.isFinite(value)) { analogInputs[tag]=value; componentStates[signal.id]={signalValue:value,signalModel:signal.signalModel}; }
    }
    for (const channel of spec.channels.analogOutputs || []) {
      const tag=controller.ioMap?.[channel]?.tag, indicator=all.find((item)=>item.tag===tag&&electricalComponentCatalog[item.type]?.kind==="analog-signal-indicator");
      if (!tag||!indicator) continue;
      const positivePin=`${channel}+`,negativePin=`${channel}−`;
      const value=Number(outputStates[tag]);
      if (pairedConnected(controller,positivePin,negativePin,indicator,"SIG+","SIG−")&&Number.isFinite(value)) { analogOutputs[tag]=value; componentStates[indicator.id]={signalValue:value,signalModel:indicator.signalModel}; }
    }
  }
  const loads = all.filter((component) => ["load", "motor"].includes(electricalComponentCatalog[component.type]?.kind));
  const energized = Object.fromEntries(loads.map((load) => {
    const spec = electricalComponentCatalog[load.type];
    const powered = spec.kind === "motor" && spec.windingPairs?.length === 3
      ? nets.some(({nets:poles}) => {
        if(sourceHasShort(poles))return false;
        const phases=["L1","L2","L3"],starts=spec.windingPairs.map((pair)=>pair[0]),ends=spec.windingPairs.map((pair)=>pair[1]),terminals=spec.windingPairs.flat(),has=(phase,pin)=>poles[phase]?.has(key(load.id,pin));
        const phaseGroups=phases.map((phase)=>terminals.filter((pin)=>has(phase,pin)));
        const separatePhases=phases.every((phase,index)=>phaseGroups[index].length>0&&phaseGroups.slice(index+1).every((group)=>phaseGroups[index].every((pin)=>!group.includes(pin))));
        const tails=ends.map((pin)=>reachable(nodes,key(load.id,pin)));
        const star=separatePhases&&phaseGroups.every((group)=>group.filter((pin)=>starts.includes(pin)).length===1)&&phaseGroups.every((group)=>group.every((pin)=>!ends.includes(pin)))&&ends.every((pin,index)=>ends.every((other)=>tails[index].has(key(load.id,other))));
        const allLeadMemberships=terminals.map((pin)=>phases.filter((phase)=>has(phase,pin)));
        const delta=separatePhases&&allLeadMemberships.every((membership)=>membership.length===1)&&phaseGroups.every((group)=>group.length===2&&group.filter((pin)=>starts.includes(pin)).length===1&&group.filter((pin)=>ends.includes(pin)).length===1)&&spec.windingPairs.every(([start,end])=>allLeadMemberships[terminals.indexOf(start)][0]!==allLeadMemberships[terminals.indexOf(end)][0]);
        return star||delta;
      })
      : spec.kind === "motor" && spec.phasePairs?.length > 1
        ? nets.some(({ nets: poles }) => {
          const phaseNets=[["L1","U1"],["L2","V1"],["L3","W1"]].map(([phase,pin])=>({phase,pin,nodes:poles[phase]}));
          return !sourceHasShort(poles) && phaseNets.every(({nodes,pin})=>nodes?.has(key(load.id,pin))) && phaseNets.every(({nodes},index)=>phaseNets.slice(index+1).every((other)=>![...nodes].some((node)=>other.nodes?.has(node))));
        })
        : spec.kind === "motor"
          ? nets.some(({ nets: poles }) => poles.L?.has(key(load.id, "U1")) && poles.N?.has(key(load.id, "U2")))
          : poweredPair(nets, load, spec.terminals[0], spec.terminals[1]);
    return [load.id, Boolean(powered)];
  }));
  Object.assign(componentStates,Object.fromEntries([
    ...loads.map((item) => { const spec=electricalComponentCatalog[item.type],on=coilEnergized.has(item.id); return [item.id, { energized:energized[item.id], ...(spec.kind === "motor" ? { running:energized[item.id], speedModel:"on/off educational state; no validated torque or speed model" } : {}), ...(spec.kind === "contactor" || item.type === "relayCoil" ? { coilEnergized:on, ...(spec.kind === "contactor" ? { mainContactsClosed:on, auxNOPairClosed:on, auxNCPairClosed:!on } : {}) } : {}) }]; }),
    ...coilComponents.filter((item) => !loads.some((load) => load.id === item.id)).map((item) => { const on=coilEnergized.has(item.id); return [item.id, { coilEnergized:on, mainContactsClosed:on, auxNOPairClosed:on, auxNCPairClosed:!on }]; }),
    ...all.filter((item) => ["contact","overload-contact"].includes(electricalComponentCatalog[item.type]?.kind)).map((item) => {
      const spec=electricalComponentCatalog[item.type],signal=Boolean(inputStates[item.tag||item.reference]),linked=coilComponents.find((coil)=>String(coil.reference||"").trim().toUpperCase()===String(item.coilRef||"").trim().toUpperCase()),actuated=item.coilRef?Boolean(linked&&coilEnergized.has(linked.id)):signal,contactPairs=spec.contactPairs||[{terminals:spec.terminals,normallyClosed:item.normallyClosed??spec.normallyClosed}],tripped=Boolean(item.tripped||signal),pairStates=contactPairs.map((pair)=>{const normallyClosed=pair.normallyClosed??item.normallyClosed??spec.normallyClosed??true;return spec.kind==="overload-contact"?(normallyClosed?!tripped:tripped):(normallyClosed?!actuated:actuated);});
      return [item.id,{contactClosed:pairStates[0],contactActuated:actuated,contactPairStates:pairStates}];
    }),
    ...all.filter((item) => electricalComponentCatalog[item.type]?.kind === "selector-switch").map((item) => [item.id,{selectorPosition:item.selectorPosition}]),
    ...all.filter((item) => electricalComponentCatalog[item.type]?.kind === "multi-pole-breaker").map((item) => [item.id,{contactClosed:!item.breakerOpen,breakerOpen:Boolean(item.breakerOpen)}]),
  ]));
  const resolvedInputs={...inputStates,...plcInputs};
  for (const controller of all) for(const channel of electricalComponentCatalog[controller.type]?.channels?.analogInputs||[]){const tag=controller.ioMap?.[channel]?.tag;if(tag)resolvedInputs[tag]=analogInputs[tag]??0;}
  Object.assign(resolvedInputs,analogInputs);
  const sourceShorts=nets.flatMap(({component,nets:poles})=>{
    const names=Object.keys(poles),shorted=[];
    for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)if([...poles[names[i]]].some((node)=>poles[names[j]].has(node)))shorted.push(`${names[i]}/${names[j]}`);
    return shorted.length?[{level:"error",code:"electrical-source-short",message:`${component.reference||component.id} source poles are shorted: ${shorted.join(", ")}. Connected loads are de-energized in this simulation.`}]:[];
  });
  if(sourceShorts.length)for(const tag of Object.keys(plcInputs))resolvedInputs[tag]=false;
  const liveNodes = new Set(nets.flatMap(({nets:poles}) => Object.values(poles).flatMap((nodes) => [...nodes])));
  const energizedWires = (diagram.wires || []).filter((wire) => wire?.from && wire?.to && (liveNodes.has(key(wire.from.componentId, wire.from.terminal)) || liveNodes.has(key(wire.to.componentId, wire.to.terminal)))).map((wire) => wire.id).filter(Boolean);
  const coilStateFault = coilStatesStable ? [] : [{level:"error",code:"electrical-coil-state-unstable",message:"Contactor/relay coil state did not settle; all coils were de-energized in this simulation."}];
  return { energized, energizedWires, componentStates, inputs: resolvedInputs, analogOutputs, sourceCount: supplies.length, simulationOnly: true, faults:[...sourceShorts,...coilStateFault], warnings:validateElectricalDiagram(diagram).filter((issue) => issue.level === "warning") };
}


