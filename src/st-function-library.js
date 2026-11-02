import { compileStructuredText } from "./structured-text.js";

const labels = {
 en:{title:"Functions",intro:"Scalar ST functions have private inputs and local storage. Select a definition to edit its source.",empty:"No functions declared. Open ST and add FUNCTION / END_FUNCTION declarations; the User Guide includes a working example.",open:"Open ST editor",edit:"Edit source",locals:"Local variables",line:"Line",errors:"Compile errors",limits:"Stateful function blocks and multi-program task assignment are not available yet."},
 de:{title:"Funktionen",intro:"Skalare ST-Funktionen haben eigene Eingänge und lokale Variablen. Wählen Sie eine Definition, um den Quelltext zu bearbeiten.",empty:"Keine Funktionen deklariert. Öffnen Sie ST und ergänzen Sie FUNCTION / END_FUNCTION; das Benutzerhandbuch enthält ein ausführbares Beispiel.",open:"ST-Editor öffnen",edit:"Quelltext bearbeiten",locals:"Lokale Variablen",line:"Zeile",errors:"Kompilierfehler",limits:"Zustandsbehaftete Funktionsbausteine und die Zuordnung mehrerer Programme zu Tasks sind noch nicht verfügbar."},
 yo:{title:"Àwọn iṣẹ́",intro:"Àwọn iṣẹ́ ST ní àwọn ìwọlé àti ààyè ìpamọ́ tiwọn. Yan ìtumọ̀ iṣẹ́ kan láti ṣàtúnṣe orísun rẹ̀.",empty:"Kò sí iṣẹ́ tí a kéde. Ṣí ST kí o sì fi FUNCTION / END_FUNCTION kún un; àpẹẹrẹ tó ń ṣiṣẹ́ wà nínú ìtọ́sọ́nà olùlò.",open:"Ṣí olùṣàtúnṣe ST",edit:"Ṣàtúnṣe orísun",locals:"Àwọn oníyípadà inú iṣẹ́",line:"Laini",errors:"Àṣìṣe àkójọpọ̀",limits:"Àwọn bulọọki iṣẹ́ tó ń pa ipò mọ́ àti pípín ọ̀pọ̀ ètò sí iṣẹ́ àkókò kò tíì wà."},
 pcm:{title:"Functions",intro:"Scalar ST functions get their own inputs and local storage. Pick one definition to edit the source.",empty:"No function declaration yet. Open ST and add FUNCTION / END_FUNCTION; User Guide get working example.",open:"Open ST editor",edit:"Edit source",locals:"Local variables",line:"Line",errors:"Compile errors",limits:"Stateful function blocks and assigning plenty programs to tasks never ready yet."}
};
const escape = value => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
export function structuredTextFunctionLibrary(project, locale = "en") {
 const copy = labels[locale] || labels.en;
 const compiled = compileStructuredText(project.stSource || "",(project.tags || []).map(tag=>tag.name));
 const definitions = compiled.functions || [];
 const rows = definitions.map(definition => `<li><strong>${escape(definition.name)}(${definition.inputs.map(input=>`${escape(input.name)}: ${escape(input.type)}`).join(", ")}) : ${escape(definition.type)}</strong><p>${escape(copy.locals)}: ${definition.locals.length} · ${escape(copy.line)} ${definition.line}</p><button class="secondary" type="button" aria-label="${escape(copy.edit)}: ${escape(definition.name)}" data-st-function-line="${definition.line}">${escape(copy.edit)}</button></li>`).join("");
 return {title:copy.title,html:`<div class="modal-body"><p>${escape(copy.intro)}</p>${rows?`<ul class="resource-list st-function-list">${rows}</ul>`:`<p>${escape(copy.empty)}</p>`}${compiled.errors.length&&project.stSource?.trim()?`<details><summary>${escape(copy.errors)}</summary><ul>${compiled.errors.map(error=>`<li>${escape(error)}</li>`).join("")}</ul></details>`:""}<p class="safety-copy">${escape(copy.limits)}</p><div class="modal-actions"><button class="primary" type="button" id="openFunctionSource">${escape(copy.open)}</button></div></div>`};
}
export function structuredTextLineOffset(source,line) {
 const target = Math.max(1,Math.trunc(Number(line) || 1)); let offset=0;
 for(let current=1;current<target;current++){const next=source.indexOf("\n",offset);if(next<0)return source.length;offset=next+1;}
 return offset;
}
