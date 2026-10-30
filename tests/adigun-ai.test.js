import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adigunAiLabels, answerAdigunQuestion } from "../src/adigun-ai.js";
import { createApplicationMenuEntries } from "../src/app-menus.js";

const project = { editorType:"LD", rungs:[{ branches:[[{ tag:"Start", mode:"NO" }, { tag:"Stop", mode:"NC" }]], coil:"Motor", timer:{ type:"TON", tag:"Delay", preset:500 } }], tags:[{ name:"Start" }, { name:"Stop" }, { name:"Motor" }], fbdBlocks:[], sfc:{ steps:[] } };
const localizedQuestions = {
  en:["Ohm's law", "normally closed contact", "digital analog signal", "CTU counter", "linear scaling", "PID setpoint", "difference between LD FBD ST SFC"],
  de:["Spannung Strom Widerstand", "Öffner", "Analogwert Digitalwert", "Zähler CTU", "Skalierung Rohwert", "PID Sollwert", "Unterschied zwischen LD FBD ST SFC"],
  yo:["agbára itanna", "contact NC", "àmì analog digital", "kóńtà CTU", "ìwọ̀n linear", "PID setpoint", "ìyàtọ̀ LD FBD ST SFC"],
  pcm:["voltage current resistance", "normally closed contact", "digital analog signal", "CTU counter", "linear scaling", "PID setpoint", "difference between LD FBD ST SFC"],
};
for (const language of ["en", "de", "yo", "pcm"]) {
  const c = adigunAiLabels(language);
  assert.ok(c.name.includes("Adigun BOT") && c.privacy.includes("AdigunSPs") && c.privacy.includes("HB Elektroniker") && c.privacy.includes("HEPHZIBAH BEHULAH"), `${language} assistant identity and full ownership disclosure`);
  assert.ok(createApplicationMenuEntries(language).tools.some((entry) => entry.action === "adigun-ai" && entry.label.includes("Adigun BOT")), `${language} Tools menu entry`);
  assert.match(answerAdigunQuestion({ question:"scan cycle", project, language }), /scan|Zyklus|Scan|ka ìwọlé/i, `${language} scan explanation`);
  assert.ok(answerAdigunQuestion({ question:"explain project", project, language }).includes("3"), `${language} project context counts`);
  assert.ok(answerAdigunQuestion({ question:"Explain selected network", project, selection:{ rung:0 }, language }).includes("Start"), `${language} selected network context`);
  assert.ok(answerAdigunQuestion({ question:"safety bypass", project, language }).length > 40, `${language} safety refusal`);
  for (const topic of ["Ohm's law voltage current resistance", "normally closed ladder contact", "digital versus analog signal", "CTU counter preset reset", "linear scale raw value engineering units", "PID setpoint proportional integral derivative", "difference between LD FBD ST and SFC"]) {
    const lesson = answerAdigunQuestion({ question:topic, project, language });
    assert.ok(lesson.length > 80 && lesson !== c.unknown, `${language} curated lesson: ${topic}`);
  }
  for (const question of localizedQuestions[language]) assert.notEqual(answerAdigunQuestion({ question, project, language }), c.unknown, `${language} localized learner question: ${question}`);
  assert.equal(answerAdigunQuestion({ question:"safety bypass Ohm's law voltage", project, language }), c.safety, `${language} safety policy takes precedence over lesson matches`);
  assert.ok(answerAdigunQuestion({ question:"review project", project, diagnostics:[{ message:"Missing tag" }], language }).includes("Missing tag"), `${language} diagnostics context`);
}
const app = readFileSync("src/app.js", "utf8"), html = readFileSync("index.html", "utf8"), sw = readFileSync("service-worker.js", "utf8");
assert.ok(html.includes('id="adigunAiButton"'), "assistant has always-available header entry");
assert.ok(app.includes('id="adigunAiForm"') && app.includes('id="adigunAiClear"') && app.includes('name === "adigun-ai"'), "assistant supports questions, conversation clearing, and menu dispatch");
assert.ok(app.includes('escapeHtml(message.text)'), "assistant escapes user and answer text before rendering");
assert.ok(sw.includes("./src/adigun-ai.js"), "offline shell caches assistant module");
console.log("PASS: offline Adigun BOT learning intents, project grounding, safety disclosure, four locales, and app/offline bindings");
