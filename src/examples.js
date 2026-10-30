import { scan } from "./engine.js";

const locales = ["en", "de", "yo", "pcm"];
const categoryNames = {
  en: ["Basic logic and analog scaling", "Start/stop and PID control", "Interlocks", "Motor control", "Conveyors", "Traffic lights", "Tank control", "Alarms", "Timers", "Counters and sequencers"],
  de: ["Grundlogik und Analogskalierung", "Start/Stopp und PID-Regelung", "Verriegelungen", "Motorsteuerung", "Förderbänder", "Ampeln", "Tanksteuerung", "Alarme", "Zeitglieder", "Zähler und Ablaufsteuerungen"],
  yo: ["Ìpìlẹ̀ ìṣàkóso àti scaling analog", "Bẹ̀rẹ̀/Dá dúró àti ìṣàkóso PID", "Ìdènà ààbò", "Ìṣàkóso mọ́tò", "Gbigbe ọjà", "Ìmọ́lẹ̀ ojú ọ̀nà", "Ìṣàkóso ojò", "Ìkìlọ̀", "Aago", "Àwọn kọ́ńtà àti ìtẹ̀lé ìpele"],
  pcm: ["Basic control and analog scaling", "Start/stop and PID control", "Safety lock", "Motor control", "Conveyor", "Traffic light", "Tank control", "Alarm", "Timer", "Counter and sequence checks"],
};
const equipmentTags = [
  ["InputA", "InputB", "InputC"],
  ["StartPB", "StopPB", "RunFeedback"],
  ["ForwardCmd", "ReverseCmd", "SafetyPermit"],
  ["StartCmd", "StopCmd", "OverloadOK"],
  ["InfeedSensor", "OutfeedClear", "ConveyorReady"],
  ["NorthVehicle", "EastVehicle", "Emergency"],
  ["LowLevel", "HighLevel", "PumpReady"],
  ["FaultA", "FaultB", "AlarmEnable"],
  ["TimerEnable", "TimerReset", "CyclePermit"],
  ["SensorA", "SensorB", "DiagnosticEnable"],
];
const copy = {
  en: { desc:"Practice {category} logic. Check how {a}, {b}, and {c} control {out}.", objective:"Trace each branch, identify the Boolean condition, then predict the output.", behavior:"{out} follows the logic path shown in the rung. Timer examples energize only after their preset.", fault:"If {out} is unexpected, inspect each input state, contact polarity, and timer preset.", case:"Input case", beginner:"Beginner", intermediate:"Intermediate", advanced:"Advanced", input:"Input", output:"Output", internal:"Internal" },
  de: { desc:"Übe {category}. Prüfe, wie {a}, {b} und {c} {out} steuern.", objective:"Verfolge jeden Pfad, bestimme die boolesche Bedingung und sage den Ausgang voraus.", behavior:"{out} folgt dem Logikpfad im Netzwerk. Zeitbeispiele schalten erst nach dem Vorgabewert.", fault:"Wenn {out} unerwartet ist, prüfe Eingänge, Kontaktart und Zeitvorgabe.", case:"Eingangsfall", beginner:"Anfänger", intermediate:"Mittel", advanced:"Fortgeschritten", input:"Eingang", output:"Ausgang", internal:"Intern" },
  yo: { desc:"Kẹ́kọ̀ọ́ {category}. Wo bí {a}, {b}, àti {c} ṣe ń ṣàkóso {out}.", objective:"Tẹ̀lé gbogbo ẹ̀ka, mọ̀ ìlànà Boolean, kí o sọ ohun tí ìjáde yóò ṣe.", behavior:"{out} ń tẹ̀lé ọ̀nà ìṣàkóso inú rung. Àpẹẹrẹ aago yóò ṣiṣẹ́ lẹ́yìn àkókò tí a ṣètò.", fault:"Tí {out} kò bá ṣe bó ti yẹ, ṣàyẹ̀wò ìwọlé, irú contact àti àkókò aago.", case:"Ìdánwò ìwọlé", beginner:"Alákọ̀ọ́bẹ̀rẹ̀", intermediate:"Agbedeméjì", advanced:"Onímọ̀", input:"Ìwọlé", output:"Ìjáde", internal:"Inú ètò" },
  pcm: { desc:"Learn {category} logic. See how {a}, {b}, and {c} dey control {out}.", objective:"Follow each path, find the Boolean condition, then predict the output.", behavior:"{out} dey follow the rung logic. Timer examples turn on after their preset time.", fault:"If {out} no behave well, check input state, contact type, and timer preset.", case:"Input case", beginner:"Beginner", intermediate:"Middle level", advanced:"Advanced", input:"Input", output:"Output", internal:"Inside" },
};
const patterns = [
  { inputs: ["A", "B"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NO" }]], eval: (s, t) => s[t[0]] && s[t[1]] },
  { inputs: ["A", "B"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NC" }]], eval: (s, t) => s[t[0]] && !s[t[1]] },
  { inputs: ["A", "B"], branches: (t) => [[{ tag:t[0], mode:"NO" }], [{ tag:t[1], mode:"NO" }]], eval: (s, t) => s[t[0]] || s[t[1]] },
  { inputs: ["A", "B", "C"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NO" }, { tag:t[2], mode:"NO" }]], eval: (s, t) => s[t[0]] && s[t[1]] && s[t[2]] },
  { inputs: ["A", "B", "C"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NO" }], [{ tag:t[0], mode:"NO" }, { tag:t[2], mode:"NO" }]], eval: (s, t) => s[t[0]] && (s[t[1]] || s[t[2]]) },
  { inputs: ["A", "B", "C"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NO" }], [{ tag:t[2], mode:"NO" }]], eval: (s, t) => (s[t[0]] && s[t[1]]) || s[t[2]] },
  { inputs: ["A", "B", "C"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NC" }, { tag:t[2], mode:"NO" }]], eval: (s, t) => s[t[0]] && !s[t[1]] && s[t[2]] },
  { inputs: ["A", "B", "C"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[2], mode:"NC" }], [{ tag:t[1], mode:"NO" }, { tag:t[2], mode:"NC" }]], eval: (s, t) => (s[t[0]] || s[t[1]]) && !s[t[2]] },
  { inputs: ["A", "B", "C"], branches: (t) => [[{ tag:t[0], mode:"NO" }, { tag:t[1], mode:"NO" }, { tag:t[2], mode:"NC" }]], eval: (s, t) => s[t[0]] && s[t[1]] && !s[t[2]] },
  { inputs: ["A", "B"], branches: (t) => [[{ tag:t[0], mode:"NC" }, { tag:t[1], mode:"NO" }]], eval: (s, t) => !s[t[0]] && s[t[1]] },
];
const additionalPatterns = [
  { id:"xor", inputs:["A","B"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"}],[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NO"}]], eval:(s,t) => s[t[0]] !== s[t[1]],
    label:{en:"Exclusive OR",de:"Exklusives ODER",yo:"OR àrà ọ̀tọ̀",pcm:"Exclusive OR"}, formula:{en:"Output is on when exactly one input is on.",de:"Der Ausgang ist aktiv, wenn genau ein Eingang aktiv ist.",yo:"Ìjáde ń ṣiṣẹ́ tí ìwọlé kan ṣoṣo bá ṣiṣẹ́.",pcm:"Output dey on when exactly one input dey on."} },
  { id:"xnor", inputs:["A","B"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NO"}],[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NC"}]], eval:(s,t) => s[t[0]] === s[t[1]],
    label:{en:"Input equivalence",de:"Eingangsäquivalenz",yo:"Ìbámu ìwọlé",pcm:"Input equivalence"}, formula:{en:"Output is on when both inputs have the same state.",de:"Der Ausgang ist aktiv, wenn beide Eingänge denselben Zustand haben.",yo:"Ìjáde ń ṣiṣẹ́ tí ipò àwọn ìwọlé méjèèjì bá dọ́gba.",pcm:"Output dey on when both inputs get the same state."} },
  { id:"one-of-three", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NC"}],[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NO"},{tag:t[2],mode:"NC"}],[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]], eval:(s,t) => Number(s[t[0]])+Number(s[t[1]])+Number(s[t[2]]) === 1,
    label:{en:"Exactly one of three",de:"Genau einer von drei",yo:"Ọ̀kan ṣoṣo nínú mẹ́ta",pcm:"Exactly one of three"}, formula:{en:"Output is on only when one of the three inputs is on.",de:"Der Ausgang ist nur aktiv, wenn einer der drei Eingänge aktiv ist.",yo:"Ìjáde ń ṣiṣẹ́ tí ìwọlé kan ṣoṣo nínú mẹ́ta bá ṣiṣẹ́.",pcm:"Output dey on only when one of the three inputs dey on."} },
  { id:"two-of-three", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NO"}],[{tag:t[0],mode:"NO"},{tag:t[2],mode:"NO"}],[{tag:t[1],mode:"NO"},{tag:t[2],mode:"NO"}]], eval:(s,t) => Number(s[t[0]])+Number(s[t[1]])+Number(s[t[2]]) >= 2,
    label:{en:"Two-out-of-three vote",de:"Zwei-aus-drei-Abstimmung",yo:"Ìdìbò méjì nínú mẹ́ta",pcm:"Two-out-of-three vote"}, formula:{en:"Output is on when at least two inputs are on.",de:"Der Ausgang ist aktiv, wenn mindestens zwei Eingänge aktiv sind.",yo:"Ìjáde ń ṣiṣẹ́ tí ó kéré tán ìwọlé méjì bá ṣiṣẹ́.",pcm:"Output dey on when at least two inputs dey on."} },
  { id:"odd-parity", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NC"}],[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NO"},{tag:t[2],mode:"NC"}],[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}],[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NO"},{tag:t[2],mode:"NO"}]], eval:(s,t) => (Number(s[t[0]])+Number(s[t[1]])+Number(s[t[2]])) % 2 === 1,
    label:{en:"Odd parity",de:"Ungerade Parität",yo:"Iye àjèjì tí kò dọ́gba",pcm:"Odd parity"}, formula:{en:"Output is on when an odd number of inputs are on.",de:"Der Ausgang ist aktiv, wenn eine ungerade Anzahl von Eingängen aktiv ist.",yo:"Ìjáde ń ṣiṣẹ́ tí iye ìwọlé tó ṣiṣẹ́ bá jẹ́ àjèjì.",pcm:"Output dey on when odd number of inputs dey on."} },
  { id:"gated-xor", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NO"},{tag:t[2],mode:"NC"}],[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NO"}]], eval:(s,t) => s[t[0]] && (s[t[1]] !== s[t[2]]),
    label:{en:"Enable-gated exclusive OR",de:"Freigabe mit exklusivem ODER",yo:"OR àrà ọ̀tọ̀ pẹ̀lú ìfọwọ́sí",pcm:"Enable-gated exclusive OR"}, formula:{en:"Input A enables the output when exactly one of B or C is on.",de:"Eingang A gibt den Ausgang frei, wenn genau B oder C aktiv ist.",yo:"Ìwọlé A ń fún ìjáde láyè tí B tàbí C kan ṣoṣo bá ṣiṣẹ́.",pcm:"Input A enables output when exactly one of B or C dey on."} },
  { id:"any-of-three", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NO"}],[{tag:t[1],mode:"NO"}],[{tag:t[2],mode:"NO"}]], eval:(s,t) => s[t[0]] || s[t[1]] || s[t[2]],
    label:{en:"Any-of-three request",de:"Anforderung durch beliebigen Eingang",yo:"Ìbéèrè láti ọ̀dọ̀ ìwọlé èyíkéyìí",pcm:"Any-of-three request"}, formula:{en:"Output is on when any one or more inputs are on.",de:"Der Ausgang ist aktiv, wenn mindestens ein Eingang aktiv ist.",yo:"Ìjáde ń ṣiṣẹ́ tí ìwọlé kan tàbí jù bẹ́ẹ̀ lọ bá ṣiṣẹ́.",pcm:"Output dey on when one or more inputs dey on."} },
  { id:"none-of-three", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NC"},{tag:t[1],mode:"NC"},{tag:t[2],mode:"NC"}]], eval:(s,t) => !s[t[0]] && !s[t[1]] && !s[t[2]],
    label:{en:"All-clear permissive",de:"Freigabe bei allen Eingängen aus",yo:"Ìfọwọ́sí tí gbogbo ìwọlé bá ti wa ni pipa",pcm:"All-clear permissive"}, formula:{en:"Output is on only while all three inputs are off.",de:"Der Ausgang ist nur aktiv, solange alle drei Eingänge aus sind.",yo:"Ìjáde ń ṣiṣẹ́ bí gbogbo ìwọlé mẹ́tẹ̀ẹ̀ta kò bá ṣiṣẹ́.",pcm:"Output dey on only while all three inputs dey off."} },
  { id:"selector", inputs:["A","B","C"], branches:(t) => [[{tag:t[1],mode:"NC"},{tag:t[0],mode:"NO"}],[{tag:t[1],mode:"NO"},{tag:t[2],mode:"NO"}]], eval:(s,t) => s[t[1]] ? s[t[2]] : s[t[0]],
    label:{en:"B-selects A or C",de:"B wählt A oder C",yo:"B yan A tàbí C",pcm:"B selects A or C"}, formula:{en:"B off selects A; B on selects C.",de:"Bei B aus gilt A; bei B ein gilt C.",yo:"B bá wa ni pipa, A ni a lò; tí B bá tan, C ni a lò.",pcm:"When B dey off, use A; when B dey on, use C."} },
  { id:"dual-interlock", inputs:["A","B","C"], branches:(t) => [[{tag:t[0],mode:"NO"},{tag:t[1],mode:"NC"}],[{tag:t[1],mode:"NO"},{tag:t[2],mode:"NO"}]], eval:(s,t) => (s[t[0]] && !s[t[1]]) || (s[t[1]] && s[t[2]]),
    label:{en:"Two-path interlock",de:"Zweigpfad-Verriegelung",yo:"Ìdènà ọ̀nà méjì",pcm:"Two-path interlock"}, formula:{en:"Output follows A when B is off, or follows C when B is on.",de:"Bei B aus folgt der Ausgang A, bei B ein folgt er C.",yo:"Tí B bá wa ni pipa, ìjáde tẹ̀lé A; tí B bá tan, ó tẹ̀lé C.",pcm:"When B dey off, output follows A; when B dey on, e follows C."} },
];
const difficultyByFamily = ["beginner", "beginner", "intermediate", "intermediate", "intermediate", "advanced", "intermediate", "beginner", "intermediate", "advanced"];
const inputCaseName = (n) => Object.fromEntries(locales.map((lang) => [lang, `${copy[lang].case} ${n}`]));
const localize = (textByLocale, key, valuesByLocale = {}) => Object.fromEntries(locales.map((lang) => [lang, textByLocale[lang][key].replace(/\{(\w+)\}/g, (_, name) => valuesByLocale[lang]?.[name] ?? "")]));

const foundationalExamples = Array.from({ length: 100 }, (_, i) => {
  const family = Math.floor(i / 10), variant = i % 10, spec = patterns[variant], semantic = equipmentTags[family];
  const counterExample = family === 9 && variant < 5, sequencerExample = family === 9 && variant >= 5, scaleExample = family === 0 && variant >= 5, pidExample = family === 1 && variant >= 5, specialExample = counterExample || sequencerExample || scaleExample || pidExample;
  const inputs = counterExample ? ["CountPulse", "CountReset"] : sequencerExample ? ["StartCycle", "AdvanceStep", "ResetSequence"] : scaleExample ? ["Enable", "RawAI"] : pidExample ? ["Enable", "ProcessValue"] : spec.inputs.map((key) => semantic["ABC".indexOf(key)]), out = counterExample ? "CountReached" : sequencerExample ? "PhaseB" : scaleExample ? "ScaleEnabled" : pidExample ? "PIDEnabled" : ["Motor", "Conveyor", "NorthGreen", "Pump", "Drive", "GreenLamp", "FillValve", "Alarm", "CycleDone", "Mismatch"][family];
  const branches = counterExample ? [[{ tag:inputs[0], mode:"NO" }]] : sequencerExample ? [] : spec.branches(inputs), preset = family === 8 ? 500 + variant * 100 : null, counterPreset = counterExample ? variant + 2 : null, timerTag = `Timer${variant + 1}`;
  const title = Object.fromEntries(locales.map((lang) => [lang, `${categoryNames[lang][family]} ${String(variant + 1).padStart(2, "0")}`]));
  const description = localize(copy, "desc", Object.fromEntries(locales.map((lang) => [lang, { category:categoryNames[lang][family], a:inputs[0], b:inputs[1], c:inputs[2] || inputs[0], out }])));
  const tag = (name, type, role, address) => ({ name, type, role, address, label:Object.fromEntries(locales.map((lang) => [lang, `${copy[lang][role === "input" ? "input" : role === "output" ? "output" : "internal"]}: ${name}`])) });
  const tagList = [...inputs.map((name) => tag(name, (scaleExample && name === "RawAI") || (pidExample && name === "ProcessValue") ? "REAL" : "BOOL", "input", name)), tag(out, "BOOL", scaleExample || pidExample ? "internal" : "output", out), ...(scaleExample ? [tag("ScaledValue", "REAL", "output", "ScaledValue")] : []), ...(pidExample ? [tag("PIDOutput", "REAL", "output", "PIDOutput")] : []), ...(sequencerExample ? [tag("PhaseA", "BOOL", "output", "PhaseA"), tag("Step1", "BOOL", "internal", "Step1"), tag("Step2", "BOOL", "internal", "Step2")] : []), ...(preset ? [tag(timerTag, "BOOL", "internal", timerTag)] : []), ...(counterExample ? [tag("CountValue", "INT", "internal", "CV")] : [])];
  const sequenceRungs = [
    { id:`seq-start-${i}`, branches:[[{ tag:inputs[0], mode:"NO" }]], coil:"Step1", coilMode:"set" },
    { id:`seq-advance-${i}`, branches:[[{ tag:"Step1", mode:"NO" }, { tag:inputs[1], mode:"NO" }]], coil:"Step2", coilMode:"set" },
    { id:`seq-clear-step1-${i}`, branches:[[{ tag:inputs[1], mode:"NO" }]], coil:"Step1", coilMode:"reset" },
    { id:`seq-reset-${i}`, branches:[[{ tag:inputs[2], mode:"NO" }]], coil:"Step2", coilMode:"reset" },
    { id:`seq-phase-a-${i}`, branches:[[{ tag:"Step1", mode:"NO" }]], coil:"PhaseA" },
    { id:`seq-phase-b-${i}`, branches:[[{ tag:"Step2", mode:"NO" }]], coil:"PhaseB" },
  ];
  const logic = sequencerExample ? { outputTag:"PhaseB", rungs:sequenceRungs } : scaleExample ? { outputTag:"ScaledValue", rungs:[{ id:`r${i + 1}`, branches:[[ { tag:"Enable", mode:"NO" } ]], contacts:[{ tag:"Enable", mode:"NO" }], coil:out, scale:{ inputTag:"RawAI", outputTag:"ScaledValue", rawMin:0, rawMax:1000, scaledMin:0, scaledMax:100, clamp:true } }] } : pidExample ? { outputTag:"PIDOutput", rungs:[{ id:`r${i + 1}`, branches:[[ { tag:"Enable", mode:"NO" } ]], contacts:[{ tag:"Enable", mode:"NO" }], coil:out }] } : { rungs:[{ id:`r${i + 1}`, branches, contacts:branches.flat(), coil:out, ...(preset ? { timer:{ tag:timerTag, preset, output:"DN" } } : {}), ...(counterExample ? { counter:{ tag:`C0.${variant}`, preset:counterPreset, resetTag:inputs[1], countTag:"CountValue" } } : {}) }] };
  const processes = pidExample ? [{ id:`pid-${i}`, type:"pid", name:"Process controller", controlTag:"Enable", inputTag:"ProcessValue", outputTag:"PIDOutput", setpoint:50, kp:1, ki:0.1, kd:0, min:0, max:100 }] : [];
  const assignments = [];
  for (let bits = 0; bits < 2 ** inputs.length; bits++) {
    const state = Object.fromEntries(inputs.map((name, bit) => [name, Boolean(bits & (1 << bit))]));
    const condition = Boolean(spec.eval(state, inputs));
    const testCase = { name:inputCaseName(bits + 1), inputs:state, expected:preset ? false : condition };
    assignments.push({ state, condition });
    assignments[assignments.length - 1].testCase = testCase;
  }
  let testCases = assignments.map((item) => item.testCase);
  if (scaleExample) testCases = [0, 250, 500, 1000, 1250].map((value) => ({ name:inputCaseName(value), inputs:{ Enable:true }, numericInputs:{ RawAI:value }, expected:Math.min(100, value / 10) }));
  if (pidExample) testCases = [
    { name:{ en:"Disabled", de:"Deaktiviert", yo:"Kò ṣiṣẹ́", pcm:"Off" }, inputs:{ Enable:false }, numericInputs:{ ProcessValue:40 }, expected:0 },
    { name:{ en:"At setpoint", de:"Am Sollwert", yo:"Ní setpoint", pcm:"At setpoint" }, inputs:{ Enable:true }, numericInputs:{ ProcessValue:50 }, expected:0 },
    { name:{ en:"Below setpoint", de:"Unter Sollwert", yo:"Ní isalẹ setpoint", pcm:"Below setpoint" }, inputs:{ Enable:true }, numericInputs:{ ProcessValue:40 }, expected:11 },
    { name:{ en:"Above setpoint clamps", de:"Oberhalb begrenzt", yo:"Lókè setpoint, a dín output kù", pcm:"Above setpoint clamps" }, inputs:{ Enable:true }, numericInputs:{ ProcessValue:60 }, expected:0 },
  ];
  if (preset) {
    const satisfying = assignments.find((item) => item.condition);
    testCases.push({ name:Object.fromEntries(locales.map((lang) => [lang, "Preset complete"])), inputs:satisfying.state, dt:preset, expected:true });
  }
  if (counterExample) {
    const caseNames = {
      en:["No pulse", "Held pulse counts once", "Below preset", "Preset reached", "Reset clears count", "Reset dominates pulse"],
      de:["Kein Impuls", "Dauersignal zählt einmal", "Unter Sollwert", "Sollwert erreicht", "Reset löscht Zähler", "Reset hat Vorrang"],
      yo:["Kò sí pulse", "Pulse tó dúró ka lẹ́ẹ̀kan", "Kéré sí iye ìṣètò", "A dé iye ìṣètò", "Reset pa iye rẹ́", "Reset ló borí pulse"],
      pcm:["No pulse", "Held pulse count once", "Below preset", "Preset reached", "Reset clear count", "Reset override pulse"],
    };
    const pulseSteps = (count) => Array.from({ length:count }, () => [{ CountPulse:true, CountReset:false }, { CountPulse:false, CountReset:false }]).flat();
    const throughPreset = pulseSteps(counterPreset), belowPreset = pulseSteps(counterPreset - 1);
    testCases = [
      [{ CountPulse:false, CountReset:false }],
      [{ CountPulse:true, CountReset:false }, { CountPulse:true, CountReset:false }, { CountPulse:false, CountReset:false }],
      belowPreset,
      throughPreset,
      [...throughPreset, { CountPulse:false, CountReset:true }],
      [...pulseSteps(counterPreset - 1), { CountPulse:true, CountReset:true }, { CountPulse:false, CountReset:false }],
    ].map((sequence, index) => ({ name:Object.fromEntries(locales.map((lang) => [lang, caseNames[lang][index]])), sequence, inputs:sequence.at(-1), expected:index === 3 }));
  }
  if (sequencerExample) {
    const caseNames = { en:["Start first phase", "Advance to phase two", "Advance without start", "Reset completed phase"], de:["Erste Phase starten", "Zu Phase zwei wechseln", "Ohne Start weiterschalten", "Abgeschlossene Phase zurücksetzen"], yo:["Bẹ̀rẹ̀ ìpele àkọ́kọ́", "Lọ sí ìpele kejì", "Lọ síwájú láìbẹ̀rẹ̀", "Tún ìpele tó parí ṣe"], pcm:["Start first phase", "Move to phase two", "Advance without start", "Reset completed phase"] };
    const start = { StartCycle:true, AdvanceStep:false, ResetSequence:false }, advance = { StartCycle:false, AdvanceStep:true, ResetSequence:false }, reset = { StartCycle:false, AdvanceStep:false, ResetSequence:true }, idle = { StartCycle:false, AdvanceStep:false, ResetSequence:false };
    testCases = [[start], [start, advance], [advance], [start, advance, reset]].map((sequence, index) => ({ name:Object.fromEntries(locales.map((lang) => [lang, caseNames[lang][index]])), sequence, inputs:sequence.at(-1), expected:index === 1 }));
  }
  const resultTag = logic.outputTag || out, expectedOutputs = testCases.map((test) => ({ case:test.name, [resultTag]:test.expected }));
  return {
    id:`AD-${String(i + 1).padStart(3, "0")}`,
    category:Object.fromEntries(locales.map((lang) => [lang, categoryNames[lang][family]])),
    difficulty:Object.fromEntries(locales.map((lang) => [lang, copy[lang][difficultyByFamily[family]]])),
    title,
    description,
    learningObjective:counterExample ? Object.fromEntries(locales.map((lang) => [lang, ({ en:"Trace count pulses, reset behavior, and the preset-reached output.", de:"Verfolge Zählimpulse, Rücksetzen und den Ausgang am Sollwert.", yo:"Tẹ̀lé àwọn pulse ìṣirò, àtúnṣe àti ìjáde ní iye ìṣètò.", pcm:"Follow count pulses, reset, and the preset reached output." })[lang]])) : sequencerExample ? Object.fromEntries(locales.map((lang) => [lang, ({ en:"Follow the latched phase bits through start, advance, and reset.", de:"Verfolge die gespeicherten Phasenbits bei Start, Weiterschalten und Reset.", yo:"Tẹ̀lé àwọn àmì ìpele tí a pa mọ́ nígbà bẹ̀rẹ̀, ìlọsíwájú àti àtúnṣe.", pcm:"Follow the latched phase bits through start, advance, and reset." })[lang]])) : localize(copy, "objective"),
    logic,
    ...(pidExample ? { processes } : {}),
    tags:tagList,
    io:{ inputs, outputs:sequencerExample ? ["PhaseA", "PhaseB"] : scaleExample ? ["ScaledValue"] : pidExample ? ["PIDOutput"] : [out] },
    initialState:Object.fromEntries(inputs.map((name) => [name, false])),
    expectedBehavior:counterExample ? Object.fromEntries(locales.map((lang) => [lang, ({ en:"The counter increments on each rising edge, resets from CountReset, and energizes CountReached at its preset.", de:"Der Zähler erhöht sich bei jeder steigenden Flanke, wird über CountReset zurückgesetzt und schaltet CountReached am Sollwert.", yo:"Kọ́ńtà ń pọ̀ sí i ní gbogbo rising edge, CountReset sì tún un ṣe; CountReached yóò ṣiṣẹ́ ní iye ìṣètò.", pcm:"The counter adds on each rising edge, CountReset clears am, and CountReached turns on at preset." })[lang]])) : sequencerExample ? Object.fromEntries(locales.map((lang) => [lang, ({ en:"Start latches Step1; Advance latches Step2 and clears Step1; Reset clears Step2.", de:"Start speichert Step1; Advance speichert Step2 und löscht Step1; Reset löscht Step2.", yo:"Start ń pa Step1 mọ́; Advance ń pa Step2 mọ́, ó sì pa Step1 rẹ́; Reset ń pa Step2 rẹ́.", pcm:"Start holds Step1; Advance holds Step2 and clears Step1; Reset clears Step2." })[lang]])) : localize(copy, "behavior", Object.fromEntries(locales.map((lang) => [lang, { out }]))),
    testCases,
    expectedOutputs,
    faultExplanations:counterExample ? Object.fromEntries(locales.map((lang) => [lang, ({ en:"If the count is wrong, inspect pulse edges, reset polarity, and the configured preset.", de:"Bei falschem Zählwert prüfe Impulsflanken, Reset-Polarität und Sollwert.", yo:"Tí iye kò bá tọ́, ṣàyẹ̀wò rising edge, reset polarity àti iye ìṣètò.", pcm:"If count no correct, check pulse edge, reset polarity, and preset." })[lang]])) : sequencerExample ? Object.fromEntries(locales.map((lang) => [lang, ({ en:"If a phase does not advance, inspect the SET and RESET coil modes and contact order.", de:"Wenn eine Phase nicht wechselt, prüfe SET/RESET-Spulen und Kontaktreihenfolge.", yo:"Tí ìpele kò bá lọ síwájú, ṣàyẹ̀wò SET/RESET coil àti ìtòlẹ́sẹẹsẹ contact.", pcm:"If phase no advance, check SET/RESET coil mode and contact order." })[lang]])) : localize(copy, "fault", Object.fromEntries(locales.map((lang) => [lang, { out }]))),
  };
});

const supplementalTag = (name, role) => ({ name, type:"BOOL", role, address:name, label:Object.fromEntries(locales.map((lang) => [lang, `${copy[lang][role === "input" ? "input" : role === "output" ? "output" : "internal"]}: ${name}`])) });
const makeSupplementalLogicExample = (family, pattern, offset) => {
  const base = foundationalExamples[family * 10 + 1], id = 101 + offset, inputs = pattern.inputs.map((letter) => equipmentTags[family]["ABC".indexOf(letter)]), output = base.io.outputs[0];
  const branches = pattern.branches(inputs), assignments = Array.from({length:2 ** inputs.length}, (_, bits) => {
    const state = Object.fromEntries(inputs.map((tag, bit) => [tag, Boolean(bits & (1 << bit))]));
    return {name:inputCaseName(bits + 1), inputs:state, expected:Boolean(pattern.eval(state, inputs))};
  });
  const title = Object.fromEntries(locales.map((lang) => [lang, `${categoryNames[lang][family]} — ${pattern.label[lang]}`]));
  const description = Object.fromEntries(locales.map((lang) => [lang, `${pattern.formula[lang]} ${categoryNames[lang][family]}: ${output}.`]));
  const tags = [...inputs.map((tag) => supplementalTag(tag, "input")), supplementalTag(output, "output")];
  return {
    id:`AD-${String(id).padStart(3,"0")}`, category:base.category, difficulty:base.difficulty, title, description,
    learningObjective:Object.fromEntries(locales.map((lang) => [lang, pattern.formula[lang]])),
    logic:{rungs:[{id:`r${id}`,branches,contacts:branches.flat(),coil:output}]}, tags,
    io:{inputs,outputs:[output]}, initialState:Object.fromEntries(inputs.map((tag) => [tag,false])),
    expectedBehavior:Object.fromEntries(locales.map((lang) => [lang,pattern.formula[lang]])),
    testCases:assignments, expectedOutputs:assignments.map((test) => ({case:test.name,[output]:test.expected})),
    faultExplanations:Object.fromEntries(locales.map((lang) => [lang, `Check the input polarity and branch paths. ${pattern.formula[lang]}`])),
  };
};
const makeSupplementalTimerExample = (pattern, offset) => {
  const family = 8, base = foundationalExamples[80], id = 181 + offset, inputs = pattern.inputs.map((letter) => equipmentTags[family]["ABC".indexOf(letter)]), output = base.io.outputs[0], preset = (offset + 11) * 100, timerTag = `Timer${offset + 11}`;
  const branches = pattern.branches(inputs), assignments = Array.from({length:2 ** inputs.length}, (_, bits) => {
    const state = Object.fromEntries(inputs.map((tag, bit) => [tag, Boolean(bits & (1 << bit))]));
    return {name:inputCaseName(bits + 1),inputs:state,expected:false};
  });
  const satisfying = Array.from({length:2 ** inputs.length}, (_, bits) => Object.fromEntries(inputs.map((tag, bit) => [tag, Boolean(bits & (1 << bit))]))).find((state) => pattern.eval(state, inputs));
  const testCases = [...assignments,{name:Object.fromEntries(locales.map((lang) => [lang, "Preset complete"])),inputs:satisfying,dt:preset,expected:true}];
  const title = Object.fromEntries(locales.map((lang) => [lang, `${categoryNames[lang][family]} — TON ${preset} ms · ${pattern.label[lang]}`]));
  const description = Object.fromEntries(locales.map((lang) => [lang, `${pattern.formula[lang]} A TON instruction delays ${output} for ${preset} ms.`]));
  const tags = [...inputs.map((tag) => supplementalTag(tag,"input")), supplementalTag(output,"output"), supplementalTag(timerTag,"internal")];
  return {
    id:`AD-${String(id).padStart(3,"0")}`,category:base.category,difficulty:base.difficulty,title,description,
    learningObjective:Object.fromEntries(locales.map((lang) => [lang, `${pattern.formula[lang]} The output must wait for the preset.`])),
    logic:{rungs:[{id:`r${id}`,branches,contacts:branches.flat(),coil:output,timer:{tag:timerTag,preset,output:"DN"}}]},tags,
    io:{inputs,outputs:[output]},initialState:Object.fromEntries(inputs.map((tag) => [tag,false])),
    expectedBehavior:Object.fromEntries(locales.map((lang) => [lang, `${pattern.formula[lang]} TON energizes ${output} after ${preset} ms.`])),
    testCases,expectedOutputs:testCases.map((test) => ({case:test.name,[output]:test.expected})),
    faultExplanations:Object.fromEntries(locales.map((lang) => [lang, `Check the enabling contacts, TON preset (${preset} ms), and reset behavior.`])),
  };
};
const counterCopy = {
  en:{names:["No pulses","Below preset","Preset reached","Reset after count","Reset dominates pulse"],desc:"Count rising edges of CountPulse; the preset is {preset} pulses and CountReset clears the accumulated value."},
  de:{names:["Keine Impulse","Unter Sollwert","Sollwert erreicht","Reset nach Zählung","Reset hat Vorrang"],desc:"Steigende Flanken von CountPulse zählen; der Sollwert beträgt {preset} Impulse, CountReset löscht den Zähler."},
  yo:{names:["Kò sí pulse","Kéré sí iye ìṣètò","A dé iye ìṣètò","Reset lẹ́yìn ìṣírò","Reset ló borí pulse"],desc:"Ka rising edge CountPulse; iye ìṣètò jẹ́ pulse {preset}, CountReset sì tún iye náà ṣe."},
  pcm:{names:["No pulses","Below preset","Preset reached","Reset after count","Reset override pulse"],desc:"Count CountPulse rising edges; preset na be {preset} pulses, and CountReset clear the count."},
};
const makeSupplementalCounterExample = (offset) => {
  const family = 9, base = foundationalExamples[90], id = 191 + offset, preset = offset + 7, inputs = ["CountPulse","CountReset"], output = "CountReached", countTag = "CountValue", counterTag = `C0.${offset + 5}`;
  const pulseSteps = (count) => Array.from({length:count}, () => [{CountPulse:true,CountReset:false},{CountPulse:false,CountReset:false}]).flat();
  const throughPreset = pulseSteps(preset), testCases = [
    [{CountPulse:false,CountReset:false}], pulseSteps(preset - 1), throughPreset,
    [...throughPreset,{CountPulse:false,CountReset:true}], [...pulseSteps(preset - 1),{CountPulse:true,CountReset:true},{CountPulse:false,CountReset:false}],
  ].map((sequence,index) => ({name:Object.fromEntries(locales.map((lang) => [lang,counterCopy[lang].names[index]])),sequence,inputs:sequence.at(-1),expected:index === 2}));
  const title = Object.fromEntries(locales.map((lang) => [lang,`${categoryNames[lang][family]} — CTU preset ${preset}`]));
  const description = Object.fromEntries(locales.map((lang) => [lang,counterCopy[lang].desc.replace("{preset}",String(preset))]));
  const tags = [...inputs.map((tag) => supplementalTag(tag,"input")),supplementalTag(output,"output"),{name:countTag,type:"INT",role:"internal",address:"CV",label:Object.fromEntries(locales.map((lang) => [lang,`${copy[lang].internal}: ${countTag}`]))}];
  return {
    id:`AD-${String(id).padStart(3,"0")}`,category:base.category,difficulty:base.difficulty,title,description,
    learningObjective:Object.fromEntries(locales.map((lang) => [lang,counterCopy[lang].desc.replace("{preset}",String(preset))])),
    logic:{rungs:[{id:`r${id}`,branches:[[{tag:inputs[0],mode:"NO"}]],contacts:[{tag:inputs[0],mode:"NO"}],coil:output,counter:{tag:counterTag,preset,resetTag:inputs[1],countTag}}]},tags,
    io:{inputs,outputs:[output]},initialState:Object.fromEntries(inputs.map((tag) => [tag,false])),
    expectedBehavior:Object.fromEntries(locales.map((lang) => [lang,counterCopy[lang].desc.replace("{preset}",String(preset))])),
    testCases,expectedOutputs:testCases.map((test) => ({case:test.name,[output]:test.expected})),
    faultExplanations:Object.fromEntries(locales.map((lang) => [lang,`Inspect rising edges, reset priority, and preset ${preset}.`])),
  };
};
const supplementalLogicExamples = Array.from({length:80}, (_,index) => makeSupplementalLogicExample(Math.floor(index / 10),additionalPatterns[index % 10],index));
const supplementalTimerExamples = additionalPatterns.map((pattern,index) => makeSupplementalTimerExample(pattern,index));
const supplementalCounterExamples = Array.from({length:10}, (_,index) => makeSupplementalCounterExample(index));
export const examples = [...foundationalExamples,...supplementalLogicExamples,...supplementalTimerExamples,...supplementalCounterExamples];

export function exampleNames() { return categoryNames; }
