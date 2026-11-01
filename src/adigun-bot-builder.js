import { createExampleElectricalDiagram } from "./electrical.js";
import { executeAdigunBotTools } from "./adigun-bot-tools.js";

const id = () => globalThis.crypto?.randomUUID?.() || `bot-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function baseProject(name, editorType, tags, io) {
  return { id:id(), name, language:"en", updatedAt:Date.now(), task:{ name:"Main", mode:"cyclic", cycleMs:100 }, tags, io, initialState:Object.fromEntries(io.inputs.map((tag) => [tag,false])), rungs:[], fbdBlocks:[], editorType, electrical:{ components:[], wires:[], inputStates:{} } };
}

export async function planAdigunBotBuild(prompt, { project:currentProject } = {}) {
  const text = String(prompt || "").trim(), q = text.toLowerCase();
  const rename = text.match(/\brename\s+(?:tag\s+)?["']?([\w.:-]+)["']?\s+to\s+["']?([\w.:-]+)["']?(?:\s+everywhere)?\s*$/i);
  if (rename) {
    if (!currentProject) return { ok:false, reason:"Open a project before asking Adigun BOT to change it." };
    const [,oldName,newName] = rename, execution = await executeAdigunBotTools(currentProject,[{name:"rename_tag",arguments:{oldName,newName}}]);
    if (!execution.ok) return { ok:false, reason:execution.error };
    return { ok:true,prompt:text,project:execution.project,baselineProject:structuredClone(currentProject),intent:"project-edit",change:{type:"rename-tag",oldName,newName},assumptions:["The existing project is the starting point.","Every supported reference to this tag is renamed; logic behavior should remain equivalent."],plan:[`Rename tag ${oldName} to ${newName}.`,`Update supported ladder, FBD, I/O, electrical, initial-state, and alarm references.`,`Compare the original and edited project outputs across all Boolean input combinations.`] };
  }
  const deleteRung = text.match(/\b(?:delete|remove)\s+(?:ladder\s+)?rung\s+(\d+)\b/i);
  if (deleteRung) {
    if (!currentProject) return { ok:false, reason:"Open a project before asking Adigun BOT to change it." };
    if (currentProject.editorType !== "LD") return { ok:false, reason:"Rung deletion is available only in a ladder (LD) project." };
    const index = Number(deleteRung[1]) - 1, rung = currentProject.rungs?.[index];
    if (!rung) return { ok:false, reason:`Rung ${deleteRung[1]} does not exist in the open project.` };
    const execution = await executeAdigunBotTools(currentProject,[{name:"delete",arguments:{id:rung.id,confirmed:true}}]);
    if (!execution.ok) return { ok:false, reason:execution.error };
    return { ok:true,prompt:text,project:execution.project,baselineProject:structuredClone(currentProject),intent:"project-edit",change:{type:"delete-rung",rungId:rung.id,index:index+1},assumptions:["Rung numbers refer to the current ladder order.","The selected rung is removed from the draft only; the open project changes only if you import the reviewed plan."],plan:[`Remove rung ${index+1} (${rung.id}).`,`Keep all other project elements unchanged.`,`Run simulator scenarios on the edited project and show the resulting outputs before import.`] };
  }
  if (!text || !/\b(build|create|make|generate|add|construct)\b|(?:k[ọo]́?|ṣe|bauen|erstelle)/iu.test(q)) return { ok:false, reason:"I can explain PLC topics, but this request does not match a supported build command yet." };
  const gates = [...new Set(["AND","OR","NAND","NOR","XOR","XNOR","NOT"].filter((gate) => gate === "AND" ? /\bAND\b|\band\s+(?:gate|block|logic)\b|\b\d+\s*[- ]?input\s+and\b/.test(text) : new RegExp(`\\b${gate}\\b`,"i").test(text)))];
  const switches = Number(q.match(/(\d+)\s*(?:input\s*)?(?:switch(?:es)?|buttons?)/)?.[1] || q.match(/(\d+)[ -]?input\s+(?:and|or)\s+gate/)?.[1] || 2);
  const asksTimer = /\b(timer|delay|after\s+\d+\s*(?:ms|s|sec|second))/i.test(q), hasMotor = /\bmotor\b/i.test(q), hasLamp = /\b(?:lamp|light|indicator)\b/i.test(q), hasBuzzer = /\b(?:buzzer|alarm)\b/i.test(q);
  if (gates.length && !asksTimer) {
    if (switches < 2 || switches > 8) return { ok:false, reason:"Gate builds currently support two to eight named Boolean inputs." };
    const inputNames = Array.from({length:switches},(_,i) => `Switch${i+1}`), outputs = [hasMotor?"Motor":null,hasLamp?"Lamp":null,hasBuzzer?"Buzzer":null].filter(Boolean);
    if (!outputs.length) outputs.push("Output");
    while (outputs.length < gates.length) outputs.push(`LogicOutput${outputs.length+1}`);
    const io = { inputs:inputNames, outputs }, tags = [...inputNames.map((name,address) => ({name,type:"BOOL",role:"input",address:`I0.${address}`})),...outputs.map((name,address) => ({name,type:"BOOL",role:"output",address:`Q0.${address}`}))];
    const blocks = gates.map((type,index) => { const start=text.toLowerCase().indexOf(type.toLowerCase())+type.length, match=text.slice(start,start+70).match(/(?:output\s+to|drives?\s+|to\s+)(?:the\s+)?(motor|lamp|light|buzzer|alarm)/i); const named={motor:"Motor",lamp:"Lamp",light:"Lamp",buzzer:"Buzzer",alarm:"Buzzer"}[match?.[1]?.toLowerCase()]; return {id:id(),type,inputs:inputNames.slice(0, type === "NOT" ? 1 : switches),outputTag:outputs.includes(named) ? named : outputs[index % outputs.length]}; });
    const project = baseProject("Adigun BOT logic draft","FBD",tags,io); project.fbdBlocks = blocks; const loadTypes = Object.fromEntries(outputs.map((name) => [name,name === "Motor" ? "threePhaseMotor" : name === "Buzzer" ? "buzzer" : "pilotLamp"])); project.electrical = createExampleElectricalDiagram(tags,io,project.initialState,loadTypes);
    return { ok:true, prompt:text, project, intent:"logic-build", assumptions:["Each named switch is a simulated Boolean PLC input.","A generic PLC and tagged schematic device are generated for each output; Motor uses an on/off three-phase motor and contactor model.","Schematic behavior is educational and does not validate physical wiring or equipment."], plan:[`Create ${switches} simulated switch inputs: ${inputNames.join(", ")}.`,`Create function blocks: ${gates.join(", ")}.`,...blocks.map((block) => `Connect ${block.inputs.join(" + ")} to ${block.type}; drive ${block.outputTag}.`),"Add generic schematic I/O, wire outputs to simulated loads, and run the program."] };
  }
  if (asksTimer && hasLamp) {
    const sec = Number(q.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|second)/)?.[1] || 5), preset = Math.max(1,Math.round(sec*1000)), input="Start", output="Lamp";
    const tags=[{name:input,type:"BOOL",role:"input",address:"I0.0"},{name:output,type:"BOOL",role:"output",address:"Q0.0"}],io={inputs:[input],outputs:[output]},project=baseProject("Adigun BOT timer lamp","LD",tags,io); project.electrical=createExampleElectricalDiagram(tags,io,project.initialState,{Lamp:"pilotLamp"});
    project.rungs=[{id:id(),comment:"Delayed lamp",branches:[[{tag:input,mode:"NO"}]],timer:{type:"TON",tag:"T0",preset,output:"DN"},coil:output}];
    return {ok:true,prompt:text,project,intent:"timer-build",assumptions:[`Delay interpreted as ${preset} ms.`,"Generic simulated PLC, pushbutton, and lamp models are included; this is not physical wiring guidance."],plan:["Create simulated Start input and Lamp output.",`Add TON with a ${preset} ms preset.`,"Include a generic PLC-to-lamp schematic path.","Run the generated ladder and connected load model."]};
  }
  if (/\b(start|stop)\b/.test(q) && hasMotor && !gates.length) {
    const tags=[{name:"Start",type:"BOOL",role:"input",address:"I0.0"},{name:"Stop",type:"BOOL",role:"input",address:"I0.1"},{name:"Motor",type:"BOOL",role:"output",address:"Q0.0"}];
    const io={inputs:["Start","Stop"],outputs:["Motor"]},project=baseProject("Adigun BOT start-stop motor","LD",tags,io); project.electrical=createExampleElectricalDiagram(tags,io,project.initialState,{Motor:"threePhaseMotor"});
    project.rungs=[{id:id(),comment:"Start/stop motor seal-in",branches:[[{tag:"Start",mode:"NO"},{tag:"Stop",mode:"NC"}],[{tag:"Motor",mode:"NO"},{tag:"Stop",mode:"NC"}]],coil:"Motor"}];
    return {ok:true,prompt:text,project,intent:"motor-latch",assumptions:["Stop is modeled as an NC logic contact.","A generic contactor/three-phase motor schematic is connected to the Motor PLC output.","This simulator does not model motor physics or safety-rated stopping."],plan:["Create Start and Stop inputs and a Motor output.","Add a seal-in branch around Start with Stop in series.","Add a generic PLC-to-contactor-to-motor schematic path.","Run the ladder and connected load model; test Start and Stop states."]};
  }
  return {ok:false,reason:"Supported build prompts: Boolean gate networks, a delayed lamp (TON), or a start/stop motor seal-in ladder. This offline builder does not yet generate arbitrary electrical schematics, comments-only edits, traffic-light sequences, or debug fixes."};
}

export const adigunBotCanSave = (accountAccess) => accountAccess === "member";

export async function planAdigunBotCopilotFix(currentProject, action) {
  if (action?.type !== "add-fbd-input") return {ok:false,reason:"This suggestion does not have an automatic fix."};
  const execution=await executeAdigunBotTools(currentProject,[{name:"add_fbd_input",arguments:{blockId:action.blockId,blockIndex:action.blockIndex}}]);
  if(!execution.ok)return {ok:false,reason:execution.error};
  const change=execution.results[0].result;
  return {ok:true,prompt:`Add a missing input to the ${currentProject.fbdBlocks[change.blockIndex].type} block`,project:execution.project,baselineProject:structuredClone(currentProject),intent:"project-edit",change:{type:"add-fbd-input",...change},assumptions:["The new input is a simulated BOOL PLC input, not a physically mapped channel.","The original canvas remains unchanged until you review and import this draft."],plan:[`Add simulated input ${change.tag}.`,`Connect ${change.tag} to input ${change.inputIndex+1} of ${currentProject.fbdBlocks[change.blockIndex].type} block ${change.blockIndex+1}.`,`Verify the gate output with the new input both false and true; preview before importing.`]};
}
