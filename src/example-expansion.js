const locales = ["en", "de", "yo", "pcm"];

const categoryLabels = {
  core: { en:"Core / Beginner", de:"Grundlagen / Anfänger", yo:"Ìpìlẹ̀ / Alákọ̀ọ́bẹ̀rẹ̀", pcm:"Core / Beginner" },
  motor: { en:"Motor Control", de:"Motorsteuerung", yo:"Ìṣàkóso mọ́tò", pcm:"Motor Control" },
  process: { en:"Process Control", de:"Prozesssteuerung", yo:"Ìṣàkóso iṣẹ́", pcm:"Process Control" },
  safety: { en:"Safety & Interlocks", de:"Sicherheit und Verriegelungen", yo:"Ààbò àti ìdènà", pcm:"Safety and Interlocks" },
  traffic: { en:"Traffic & Lighting", de:"Verkehr und Beleuchtung", yo:"Ìrìnàjò àti ìmọ́lẹ̀", pcm:"Traffic and Lighting" },
  building: { en:"Building Automation", de:"Gebäudeautomation", yo:"Ìṣàkóso ilé aládàáṣiṣẹ́", pcm:"Building Automation" },
};

const difficulty = {
  core: { en:"Beginner", de:"Anfänger", yo:"Alákọ̀ọ́bẹ̀rẹ̀", pcm:"Beginner" },
  advanced: { en:"Advanced", de:"Fortgeschritten", yo:"Onímọ̀", pcm:"Advanced" },
};

const coreContexts = [
  "CIP return pump dry-run permissive", "carton sealer guard and restart inhibit", "sump pump high-level alarm", "case conveyor photoeye enable",
  "batch mixer start and discharge check", "loading bay traffic beacon", "cooling tank fill cut-off", "filter differential fault lamp",
  "oven conveyor timed release", "palletizer two-step count", "washdown pump overload monitor", "labeler bottle-present interlock",
  "booster pump pressure request", "warehouse aisle lighting sequence", "blending vessel cycle-ready circuit", "cooling fan start permissive",
  "reject gate sensor check", "utility room alarm summary", "metered dosing cycle", "packaging cell restart interlock",
];

const sites = {
  motor: [
    "CIP return pump P-201", "carton conveyor M-14", "cooling tower fan F-03", "bagging line mixer MX-2", "wastewater lift pump P-8",
    "palletizer infeed drive CV-11", "dust extraction fan EF-4", "air compressor C-2", "washdown pump P-17", "case sealer drive M-6",
    "silo screw feeder SF-1", "cooling tunnel conveyor CV-22", "press lubrication pump P-5", "bottle rinser drum M-3", "loading dock roller M-9",
    "utility room exhaust fan EF-2", "batch tank agitator MX-7", "chiller condenser fan F-12", "grain elevator bucket drive M-5", "filter backwash pump P-31",
  ],
  process: [
    "CIP caustic tank TK-4", "syrup blend vessel MX-12", "bottle filler lane 2", "carton color sorter CV-8", "wastewater equalization tank TK-9",
    "powder dosing hopper DH-3", "pasteurizer zone 1", "coolant reservoir TK-2", "bag reject station RS-4", "brew kettle transfer line",
    "polymer make-down tank TK-6", "rinse-water recovery loop", "grain weigh hopper WH-5", "label-and-inspect conveyor CV-3", "milk balance tank TK-1",
    "resin batching skid BS-7", "chilled-water loop CHW-2", "pallet stretch wrapper SW-1", "food-grade mixing vessel MX-5", "boiler feedwater tank TK-10",
  ],
  safety: [
    "carton sealer guard door G-2", "press enclosure light curtain LC-1", "mixer two-hand start station TH-4", "palletizer access gate G-7", "pump overload reset circuit P-8",
    "conveyor pull-cord loop PC-3", "robot cell access zone Z-2", "filler emergency-stop monitor ES-5", "hoist upper-limit monitor LS-9", "washdown skid pressure permissive PS-4",
    "wrapping cell restart inhibit RI-2", "saw blade guard switch GS-6", "boiler low-water alarm LW-1", "dock leveller interlock DL-3", "filter fan trip latch FT-5",
    "chemical dosing cabinet leak alarm LK-2", "compressor high-temperature trip HT-8", "elevator door-zone monitor DZ-1", "crossing gate obstruction check OB-4", "utility room smoke alarm SM-3",
  ],
  traffic: [
    "North–East four-way junction", "school crossing on Oak Road", "pedestrian refuge at Central Avenue", "rail approach warning at Mile 12", "single-lane bridge signal at River Road",
    "hospital entrance beacon", "bus depot exit signal", "industrial estate gate lights", "two-stage crosswalk at Market Street", "roundabout entry beacon",
    "tram crossing at Station Road", "warehouse yard one-way lights", "fire station road signal", "port access barrier lights", "service road pedestrian phase",
    "airport apron vehicle beacon", "construction detour lights", "cycle crossing at Park Lane", "tunnel lane-control beacons", "emergency vehicle priority junction",
  ],
  building: [
    "office AHU-1 supply fan", "warehouse occupancy lighting zone 3", "loading bay automatic door D-4", "booster pump set BP-2", "elevator lobby door sequence E-1",
    "school ventilation zone V-5", "plant-room extract fan EF-2", "cold-store alarm and fan CF-1", "hotel corridor lighting L-8", "fire-water jockey pump JP-1",
    "library meeting-room ventilation V-3", "car-park CO extract zone CO-2", "clinic entry door D-2", "residential roof-tank pump P-6", "server-room cooling unit CR-1",
    "sports hall lighting bank L-5", "laundry exhaust fan EF-8", "stairwell pressure fan PF-1", "retail entrance air curtain AC-3", "kitchen make-up air unit MAU-2",
  ],
};

const scenarios = {
  motor: [
    ["Direct-on-line starter with overload trip",0], ["Forward–reverse conveyor interlock",4], ["Star–delta timed transition",6], ["Soft-starter bypass permissive",2],
    ["VFD run and ready handshake",1], ["Lead–lag twin pump rotation",5], ["Compressor load–unload sequence",7], ["Hoist brake and direction permissive",8],
    ["Dust fan filter-ready control",3], ["Mixer guard and timed run",9],
  ],
  process: [
    ["Tank fill with high-level cut-out",1], ["Batch dosing with count limit",4], ["Mix, settle, and discharge cycle",6], ["Photoeye conveyor sorting",8],
    ["Bottle index and fill sequence",2], ["Temperature demand and timed heat",5], ["Pump alternation on level demand",7], ["Silo feed with high-level inhibit",3],
    ["Packaging reject and batch count",9], ["Flow-ratio enable and alarm",0],
  ],
  safety: [
    ["Emergency-stop permissive monitor",0], ["Guard-door restart inhibit",2], ["Two-hand start coincidence monitor",4], ["Light-curtain stop interface",6],
    ["Overload trip and manual-reset latch",1], ["Access-zone mutual exclusion",8], ["Fault reset with restart inhibit",7], ["Pressure permissive and alarm",3],
    ["Speed-feedback loss monitor",9], ["Obstruction trip and reset check",5],
  ],
  traffic: [
    ["Two-road signal with all-red clearance",1], ["Pedestrian request and walk phase",4], ["School beacon with crossing request",6],
    ["Rail crossing warning sequence",8], ["Single-lane bridge direction control",2],
  ],
  building: [
    ["AHU fan with filter and occupancy permissives",1], ["Occupancy and schedule lighting control",4], ["Automatic door with obstruction inhibit",6],
    ["Booster pump demand and run timer",8], ["Elevator door-zone sequence monitor",2],
  ],
};

const inputsByCategory = {
  motor: ["StartPB", "StopPB", "OverloadOK", "DriveReady"],
  process: ["StartPB", "StopPB", "SafetyPermit", "ProcessSensor"],
  safety: ["ResetPB", "TripRequest", "GuardClosed", "SensorClear"],
  traffic: ["VehicleCall", "PedRequest", "ConflictClear", "LoopSensor"],
  building: ["Occupancy", "ScheduleEnable", "EquipmentHealthy", "DemandSensor"],
};

const modeNames = [
  "start AND permit AND sensor", "(start OR sensor) AND permit", "sensor AND permit", "start AND permit",
  "exactly one of start and sensor, with permit", "start AND sensor AND permit", "start AND NOT sensor AND permit",
  "(start OR sensor) AND permit, with stop released", "permit AND sensor AND NOT start", "sensor AND permit, gated by start OR demand",
];
const modeBranches = [
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"},{tag:t[3],mode:"NO"}]],
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}],[{tag:t[3],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]],
  (t) => [[{tag:t[3],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]],
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]],
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[3],mode:"NC"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}],[{tag:t[0],mode:"NC"},{tag:t[3],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]],
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"},{tag:t[3],mode:"NO"}]],
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"},{tag:t[3],mode:"NC"}]],
  (t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}],[{tag:t[3],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]],
  (t) => [[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"},{tag:t[3],mode:"NO"}]],
  (t) => [[{tag:t[3],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}],[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"},{tag:t[3],mode:"NO"}]],
];
const evaluateMode = (mode, [start, stop, permit, sensor]) => {
  const noStop = !Boolean(stop), s = Boolean(start), p = Boolean(permit), d = Boolean(sensor);
  return [s && noStop && p && d, (s || d) && noStop && p, d && noStop && p, s && noStop && p,
    s !== d && noStop && p, s && noStop && p && d, s && noStop && p && !d,
    (s || d) && noStop && p, !s && noStop && p && d,
    d && noStop && p && (s || d)][mode];
};

const localized = (en, de, yo, pcm) => ({en,de,yo,pcm});
const englishFallback = (value) => Object.fromEntries(locales.map((locale) => [locale, value]));
const tagRecord = (name, role, address = "") => ({
  name, type:"BOOL", role, ...(address ? {address} : {}),
  label:localized(`Input or output: ${name}`, `Ein- oder Ausgang: ${name}`, `Ìwọlé tàbí ìjáde: ${name}`, `Input or output: ${name}`),
});
const rung = (id, comment, branches, coil, extras = {}) => ({id,comment,branches,contacts:branches.flat(),coil,...extras});
const inputsFor = (tags, state) => Object.fromEntries(tags.map((tag) => [tag,Boolean(state[tag])]));
const localCase = (en, de, yo, pcm, inputs, expected, extra = {}) => ({name:localized(en,de,yo,pcm),inputs,expected,...extra});

function enrichCoreExample(example, index) {
  const inputTags = example.tags.filter((tag) => tag.role === "input" && tag.type === "BOOL").map((tag) => tag.name).slice(0,2);
  const a = inputTags[0];
  const prefix = `Core${String(index + 1).padStart(3,"0")}`;
  if (!inputTags[1]) {
    inputTags[1] = `${prefix}Event`;
    example.io.inputs.push(inputTags[1]);
    example.initialState[inputTags[1]] = false;
    example.tags.push(tagRecord(inputTags[1],"input",`I1.0`));
  }
  const b = inputTags[1];
  const tags = ["Permit","Ready","Alarm","StartAllowed","ProcessActive","Timed","Counted","Complete","CycleLamp"].map((name) => tagRecord(`${prefix}${name}`,"internal"));
  const [permit,ready,alarm,startAllowed,processActive,timed,counted,complete,cycleLamp] = tags.map((item) => item.name);
  const preset = 600 + (index % 8) * 200;
  const additions = [
    rung(`${prefix}-permit`,"Input permissive and stop contact",[[{tag:a,mode:"NO"},{tag:b,mode:"NC"}]],permit),
    rung(`${prefix}-ready`,"Ready indicator logic",[[{tag:permit,mode:"NO"}]],ready),
    rung(`${prefix}-alarm`,"Input loss or stop alarm logic",[[{tag:a,mode:"NC"}],[{tag:b,mode:"NO"}]],alarm),
    rung(`${prefix}-start`,"Start allowed when permissive is true",[[{tag:a,mode:"NO"},{tag:permit,mode:"NO"}]],startAllowed),
    rung(`${prefix}-process`,"Process activity follows the second input",[[{tag:a,mode:"NO"},{tag:b,mode:"NO"}]],processActive),
    rung(`${prefix}-ton`,"Timed operation",[[{tag:a,mode:"NO"}]],timed,{timer:{tag:`${prefix}TON`,preset,output:"DN"}}),
    rung(`${prefix}-ctu`,"Count two rising input events",[[{tag:b,mode:"NO"}]],counted,{counter:{tag:`${prefix}CTU`,preset:2,countTag:`${prefix}CountValue`}}),
    rung(`${prefix}-complete`,"Completion requires timer and count",[[{tag:timed,mode:"NO"},{tag:counted,mode:"NO"}]],complete),
    rung(`${prefix}-lamp`,"Cycle-complete indicator",[[{tag:complete,mode:"NO"}]],cycleLamp),
  ];
  const baseCases = example.testCases || [];
  const sequence = [];
  for (let pulse = 0; pulse < 2; pulse++) {
    sequence.push({inputs:{[a]:true,[b]:true},dt:pulse === 0 ? preset : 100});
    sequence.push({inputs:{[a]:true,[b]:false},dt:100});
  }
  const validationCase = localCase("Timed two-event cycle", "Zeitzyklus mit zwei Ereignissen", "Ìyípo pẹ̀lú ìṣẹ̀lẹ̀ méjì àti aago", "Timed cycle with two events", sequence.at(-1).inputs, undefined, {
    sequence,
    expectedSignals:{[permit]:true,[ready]:true,[alarm]:false,[startAllowed]:true,[processActive]:false,[timed]:true,[counted]:true,[complete]:true,[cycleLamp]:true},
  });
  const inputsSummary = example.io.inputs.join(", ");
  const desc = localized(
    `Core control exercise for ${coreContexts[index % coreContexts.length]}. The original logic lesson uses ${inputsSummary} and is extended with a permissive, ready/alarm branches, a ${preset} ms TON, a two-event CTU, and a cycle-complete indicator.`,
    `Grundlagenübung für ${coreContexts[index % coreContexts.length]}. Die ursprüngliche Logik verwendet ${inputsSummary} und wird um Freigabe, Bereit-/Alarmzweige, TON (${preset} ms), CTU (zwei Ereignisse) und Zyklusmeldung ergänzt.`,
    `Ìdánwò ìṣàkóso ìpìlẹ̀ fún ${coreContexts[index % coreContexts.length]}. Ẹ̀kọ́ ìpilẹ̀ náà lo ${inputsSummary}; a fi permissive, àmì ready/alarm, TON ${preset} ms, CTU ìṣẹ̀lẹ̀ méjì àti àmì ìparí kún un.`,
    `Core control exercise for ${coreContexts[index % coreContexts.length]}. The original logic uses ${inputsSummary}; e adds permit, ready/alarm, TON ${preset} ms, CTU for two events, and a cycle-complete lamp.`,
  );
  const how = localized(
    `Open I/O. Set ${a} on and pulse ${b} on/off twice. Advance the scan by at least ${preset} ms while ${a} stays on; verify ${cycleLamp} turns on after both the timer and counter complete.`,
    `Öffne I/O. Setze ${a} und pulsiere ${b} zweimal ein/aus. Lasse mindestens ${preset} ms scannen, während ${a} aktiv bleibt; ${cycleLamp} leuchtet nach Timer und Zähler.`,
    `Ṣí I/O. Tan ${a}, kí o sì tan/dá ${b} lẹ́ẹ̀mejì. Jẹ́ kí scan gba ó kéré tán ${preset} ms nígbà tí ${a} wà lórí; ṣàyẹ̀wò pé ${cycleLamp} tan lẹ́yìn aago àti kọ́ńtà.`,
    `Open I/O. Turn ${a} on and pulse ${b} on/off twice. Let scan reach ${preset} ms while ${a} stays on; check ${cycleLamp} after timer and counter finish.`,
  );
  example.category = categoryLabels.core;
  example.difficulty = difficulty.core;
  example.title = localized(
    `${coreContexts[index % coreContexts.length]} — core logic ${String(index + 1).padStart(3,"0")}`,
    `${coreContexts[index % coreContexts.length]} — Grundlagenlogik ${String(index + 1).padStart(3,"0")}`,
    `${coreContexts[index % coreContexts.length]} — ìṣàkóso ìpìlẹ̀ ${String(index + 1).padStart(3,"0")}`,
    `${coreContexts[index % coreContexts.length]} — core logic ${String(index + 1).padStart(3,"0")}`,
  );
  example.description = desc;
  example.howToTest = how;
  example.learningObjective = localized("Combine the original logic exercise with permits, timing, event counting, and completion indication.","Verbinde die ursprüngliche Logikübung mit Freigabe, Zeit, Ereigniszählung und Abschlussanzeige.","So ìdánwò ìpilẹ̀ pọ̀ mọ́ permissive, aago, ìṣírò ìṣẹ̀lẹ̀ àti àmì ìparí.","Join the original logic exercise with permit, timing, event counting, and completion indication.");
  example.expectedBehavior = desc;
  example.tags.push(...tags, tagRecord(`${prefix}TON`,"internal"), tagRecord(`${prefix}CTU`,"internal"), {name:`${prefix}CountValue`,type:"INT",role:"internal",address:"CV",label:englishFallback(`Count value ${prefix}`)});
  example.logic.rungs.push(...additions);
  example.testCases = baseCases;
  example.additionalTestCases = [validationCase];
  example.expectedOutputs = baseCases.map((test) => ({case:test.name,[example.logic.outputTag || example.io.outputs[0]]:test.expected}));
  example.outputLoadTypes = { [example.logic.outputTag || example.io.outputs[0]]: index % 5 === 3 || index % 5 === 4 ? "threePhaseMotor" : "pilotLamp" };
  return example;
}

function buildScenarioExample(category, blueprintIndex, profileIndex, idNumber) {
  const [scenarioName, baseMode] = scenarios[category][blueprintIndex];
  const site = sites[category][profileIndex];
  const tags = inputsByCategory[category];
  const [start, stop, permitInput, sensor] = tags;
  const mode = (baseMode + profileIndex) % modeBranches.length;
  const preset = 500 + profileIndex * 250;
  const batch = 2 + (profileIndex % 4);
  const suffix = String(idNumber).padStart(3,"0");
  const mainOutput = category === "motor" ? "MotorContactor" : category === "process" ? "ProcessActuator" : category === "traffic" ? "SignalLamp" : category === "building" ? "BuildingLoad" : "InterlockPermit";
  const outputTags = [mainOutput,"ReadyLamp","AlarmLamp"];
  const internalTags = ["CyclePermit","CycleActive","SensorQualified","TimerDone","CountDone","CycleComplete","MaintenanceRequest","DemandAccepted","StartIndicator"];
  const inputRecords = tags.map((name,index) => tagRecord(name,"input",`I0.${index}`));
  const outputs = outputTags.map((name,index) => tagRecord(name,"output",`Q0.${index}`));
  const internals = internalTags.map((name) => tagRecord(name,"internal"));
  const allTags = [...inputRecords,...outputs,...internals,
    {name:"BatchCount",type:"INT",role:"internal",address:"CV",label:englishFallback("Batch event count")},
    tagRecord("CycleTON","internal"),tagRecord("BatchCTU","internal")];
  const [cyclePermit,cycleActive,sensorQualified,timerDone,countDone,cycleComplete,maintenance,demand,startLamp] = internalTags;
  const rungs = [
    rung(`AD${suffix}-permit`,`Permit: ${permitInput} healthy and stop released`,[[{tag:permitInput,mode:"NO"},{tag:stop,mode:"NC"}]],cyclePermit),
    rung(`AD${suffix}-main`,`${scenarioName} main control`,modeBranches[mode](tags),mainOutput),
    rung(`AD${suffix}-ready`,`Ready indicator: permit and stop chain`,[[{tag:cyclePermit,mode:"NO"}]],"ReadyLamp"),
    rung(`AD${suffix}-alarm`,`Trip or stop alarm`,[[{tag:permitInput,mode:"NC"}],[{tag:stop,mode:"NO"}]],"AlarmLamp"),
    rung(`AD${suffix}-active`,`Cycle active request`,[[{tag:start,mode:"NO"},{tag:cyclePermit,mode:"NO"}]],cycleActive),
    rung(`AD${suffix}-sensor`,`Qualified sensor event`,[[{tag:sensor,mode:"NO"},{tag:cyclePermit,mode:"NO"}]],sensorQualified),
    rung(`AD${suffix}-timer`,`TON process interval`,[[{tag:start,mode:"NO"},{tag:permitInput,mode:"NO"},{tag:stop,mode:"NC"}]],timerDone,{timer:{tag:"CycleTON",preset,output:"DN"}}),
    rung(`AD${suffix}-counter`,`CTU batch event count`,[[{tag:sensor,mode:"NO"}]],countDone,{counter:{tag:"BatchCTU",preset:batch,resetTag:stop,countTag:"BatchCount"}}),
    rung(`AD${suffix}-complete`,`Complete after time and batch target`,[[{tag:timerDone,mode:"NO"},{tag:countDone,mode:"NO"}]],cycleComplete),
    rung(`AD${suffix}-maintenance`,`Demand accepted while available`,[[{tag:start,mode:"NO"},{tag:permitInput,mode:"NO"},{tag:stop,mode:"NC"}]],demand),
    rung(`AD${suffix}-maintenance-request`,`Maintenance request on loss of equipment permit`,[[{tag:permitInput,mode:"NC"}]],maintenance),
    rung(`AD${suffix}-start-indicator`,`Start indicator with ready permissive`,[[{tag:start,mode:"NO"},{tag:cyclePermit,mode:"NO"}]],startLamp),
  ];
  const initialState = {[start]:false,[stop]:false,[permitInput]:true,[sensor]:false};
  const idle = {...initialState};
  const operating = {...initialState,[start]:true,[sensor]:true};
  const inhibited = {...initialState,[start]:true,[permitInput]:false};
  const pulseSequence = [];
  pulseSequence.push({inputs:{...initialState,[start]:true},dt:preset});
  for (let count=0; count<batch; count++) {
    pulseSequence.push({inputs:{...initialState,[start]:true,[sensor]:true},dt:100});
    pulseSequence.push({inputs:{...initialState,[start]:true,[sensor]:false},dt:100});
  }
  const expectedSignals = (input, done = false) => ({
    CyclePermit:Boolean(input[permitInput] && !input[stop]),
    ReadyLamp:Boolean(input[permitInput] && !input[stop]),
    AlarmLamp:Boolean(!input[permitInput] || input[stop]),
    CycleActive:Boolean(input[start] && input[permitInput] && !input[stop]),
    SensorQualified:Boolean(input[sensor] && input[permitInput] && !input[stop]),
    TimerDone:done,
    CountDone:done,
    CycleComplete:done,
    MaintenanceRequest:!input[permitInput],
    DemandAccepted:Boolean(input[start] && input[permitInput] && !input[stop]),
    StartIndicator:Boolean(input[start] && input[permitInput] && !input[stop]),
  });
  const scenariosForProject = [
    localCase("Idle and ready", "Stillstand und bereit", "Dúró àti setán", "Idle and ready", idle, false,{expectedSignals:expectedSignals(idle)}),
    localCase("Demand with sensor", "Anforderung mit Sensor", "Ìbéèrè pẹ̀lú sensor", "Demand with sensor", operating, evaluateMode(mode,[operating[start],operating[stop],operating[permitInput],operating[sensor]]),{expectedSignals:expectedSignals(operating)}),
    localCase("Inhibited by permit", "Durch Freigabe gesperrt", "A dí i pẹ̀lú permissive", "Permit blocks request", inhibited, false,{expectedSignals:expectedSignals(inhibited)}),
    localCase("Timed batch completes", "Zeitgesteuerte Charge abgeschlossen", "Batch pẹ̀lú aago ti parí", "Timed batch completes", pulseSequence.at(-1).inputs, evaluateMode(mode,[true,false,true,false]),{sequence:pulseSequence,expectedSignals:expectedSignals(pulseSequence.at(-1).inputs,true)}),
  ];
  const scenarioDescription = localized(
    `${scenarioName} for ${site}. The ladder program combines a stop/permissive chain, a ${modeNames[mode]} command, ready and trip indicators, a ${preset} ms TON, a CTU batch target of ${batch}, and a completion condition. It is an educational control model built from the supported generic PLC, contacts, motor/actuator and pilot-lamp symbols.`,
    `${scenarioName} für ${site}. Das Programm verbindet Stop-/Freigabekette, ${modeNames[mode]}, Bereit- und Störanzeige, TON ${preset} ms, CTU-Sollwert ${batch} und eine Abschlussbedingung. Es nutzt unterstützte generische SPS-, Kontakt-, Motor/Aktor- und Meldeleuchtensymbole.`,
    `${scenarioName} fún ${site}. Ètò ladder náà so stop/permissive pọ̀ mọ́ ${modeNames[mode]}, àmì ready àti fault, TON ${preset} ms, CTU iye ${batch}, àti ipò ìparí. Ó lo PLC generic, contact, motor/actuator àti àmì ìmọ́lẹ̀ tí app ń ṣe àtìlẹ́yìn fún.`,
    `${scenarioName} for ${site}. The ladder join stop/permit chain, ${modeNames[mode]} command, ready and trip lamps, TON ${preset} ms, CTU target ${batch}, and a completion condition using supported generic PLC and component symbols.`,
  );
  const howToTest = localized(
    `In I/O, leave ${stop} off and ${permitInput} on. Turn ${start} on, pulse ${sensor} on/off ${batch} times, and advance scans through ${preset} ms; verify the main output, ReadyLamp, AlarmLamp, TimerDone, CountDone, and CycleComplete. Then turn ${permitInput} off and confirm the main output drops and AlarmLamp turns on.`,
    `Lasse ${stop} aus und ${permitInput} ein. Schalte ${start} ein, pulsiere ${sensor} ${batch}-mal und scanne ${preset} ms; prüfe Hauptausgang, ReadyLamp, AlarmLamp, TimerDone, CountDone und CycleComplete. Schalte danach ${permitInput} aus und prüfe Ausgang und Alarm.`,
    `Nínú I/O, jẹ́ kí ${stop} wà ní off, ${permitInput} sì wà ní on. Tan ${start}, pulsiere ${sensor} ní on/off ní ìgbà ${batch}, kí scan sì gba ${preset} ms; ṣàyẹ̀wò main output, ReadyLamp, AlarmLamp, TimerDone, CountDone àti CycleComplete. Pa ${permitInput} lẹ́yìn náà láti rí pé output dúró tí AlarmLamp sì tan.`,
    `In I/O, keep ${stop} off and ${permitInput} on. Turn ${start} on, pulse ${sensor} ${batch} times, scan through ${preset} ms; check the main output, ReadyLamp, AlarmLamp, TimerDone, CountDone and CycleComplete. Turn ${permitInput} off and verify trip response.`,
  );
  const categoryName = categoryLabels[category];
  const title = localized(`${scenarioName} — ${site} [${suffix}]`,`${scenarioName} — ${site} [${suffix}]`,`${scenarioName} — ${site} [${suffix}]`,`${scenarioName} — ${site} [${suffix}]`);
  const outputLoadTypes = { [mainOutput]:category === "motor" ? "threePhaseMotor" : category === "process" ? "solenoidValve" : "pilotLamp", ReadyLamp:"pilotLamp", AlarmLamp:"pilotLamp" };
  const testCases = scenariosForProject;
  return {
    id:`AD-${suffix}`,category:categoryName,difficulty:difficulty.advanced,title,description:scenarioDescription,howToTest,
    learningObjective:localized(`Trace the ${modeNames[mode]} branches, verify the permit and trip path, then observe the timer and batch counter.`,`Verfolge die ${modeNames[mode]}-Zweige und prüfe Freigabe, Störung, Timer und Zähler.`,`Tẹ̀lé àwọn ẹ̀ka ${modeNames[mode]}, kí o sì ṣàyẹ̀wò permissive, fault, aago àti kọ́ńtà.`,`Follow the ${modeNames[mode]} branches and check permit, trip, timer and counter.`),
    expectedBehavior:scenarioDescription,
    faultExplanations:localized(`If the actuator does not respond, inspect the stop contact, ${permitInput}, ${start}, and ${sensor}; then read the timer and counter status.`,`Wenn der Aktor nicht reagiert, prüfe Stopkontakt, ${permitInput}, ${start} und ${sensor} sowie Timer und Zähler.`,`Tí actuator kò bá dáhùn, ṣàyẹ̀wò stop contact, ${permitInput}, ${start}, ${sensor}, aago àti kọ́ńtà.`,`If the actuator no respond, check stop contact, ${permitInput}, ${start}, ${sensor}, timer and counter.`),
    logic:{outputTag:mainOutput,rungs},tags:allTags,io:{inputs:tags,outputs:outputTags},initialState,testCases,expectedOutputs:testCases.map((test)=>({case:test.name,[mainOutput]:test.expected})),outputLoadTypes,
    scenarioKey:`${category}:${blueprintIndex}:${profileIndex}`,variant:{mode,presetMs:preset,batchTarget:batch,site},
  };
}

export function expandExampleLibrary(coreExamples) {
  const core = coreExamples.map((example,index)=>enrichCoreExample(structuredClone(example),index));
  const generated = [], categoryOrder = ["motor","process","safety","traffic","building"];
  let id = 201;
  for (const category of categoryOrder) {
    for (let blueprintIndex=0; blueprintIndex<scenarios[category].length; blueprintIndex++) {
      for (let profileIndex=0; profileIndex<20; profileIndex++) generated.push(buildScenarioExample(category,blueprintIndex,profileIndex,id++));
    }
  }
  if (core.length !== 200 || generated.length !== 800 || id !== 1001) throw new Error("The example generator must produce exactly 200 core and 800 industrial projects.");
  return [...core,...generated];
}

