Warning: truncated output (original token count: 8201)
Total output lines: 222

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
  en: { desc:"Practice {category} logic. Check how {inputs} control {out}.", objective:"Trace each branch, identify the Boolean condition, then predict the output.", behavior:"{out} follows the logic path shown in the rung. Timer examples energize only after their preset.", fault:"If {out} is unexpected, inspect each input state, contact polarity, and timer preset.", case:"Input case", beginner:"Beginner", intermediate:"Intermediate", advanced:"Advanced", input:"Input", output:"Outp…7201 tokens truncated…cales.map((lang) => [lang,`${categoryNames[lang][family]} — CTU preset ${preset}`]));
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
