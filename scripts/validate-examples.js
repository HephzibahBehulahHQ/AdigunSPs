import { writeFile } from "node:fs/promises";
import { examples } from "../src/examples.js";
import { makeProjectFromExample, runExampleChecks, scan, scanFBD } from "../src/engine.js";
import { stepProcesses } from "../src/process.js";
import { validateProject } from "../src/validation.js";
import { electricalComponentCatalog, simulateElectricalDiagram } from "../src/electrical.js";
import { normalizeImportedProject } from "../src/project-import.js";

const results = examples.map((example) => {
  const cases = runExampleChecks(example).map((item) => ({
    name: item.name.en,
    pass: item.pass,
    expected: item.expected,
    actual: item.actual,
    sequenceSteps: item.sequence?.length || 1,
  }));
  const project = makeProjectFromExample(example), serializedProject = JSON.stringify(project), reopenedProject = normalizeImportedProject(JSON.parse(serializedProject));
  const saveReopenPass = JSON.stringify(reopenedProject) === serializedProject;
  const issues = validateProject(reopenedProject), diagram = reopenedProject.electrical;
  const boolInputs = example.tags.filter((tag) => tag.role === "input" && tag.type === "BOOL");
  const boolOutputs = example.tags.filter((tag) => tag.role === "output" && tag.type === "BOOL");
  const componentCases = [
    ...boolInputs.map((tag) => { const result=simulateElectricalDiagram(diagram,{[tag.name]:true});return {name:`input ${tag.name}`,pass:result.inputs[tag.name]===true,actual:result.inputs[tag.name]}; }),
    ...boolOutputs.flatMap((tag) => { const load=diagram.components.find((item)=>item.tag===tag.name);return [false,true].map((value)=>({name:`output ${tag.name}=${value}`,pass:Boolean(simulateElectricalDiagram(diagram,{}, {[tag.name]:value}).energized[load?.id])===value,actual:Boolean(simulateElectricalDiagram(diagram,{}, {[tag.name]:value}).energized[load?.id])})); }),
  ];
  const structural = Boolean(example.id && example.title.en && example.description.en && example.logic.rungs.length && example.tags.length && example.io.inputs.length && example.io.outputs.length && example.testCases.length && diagram.components.length && diagram.wires.length) && !issues.some((item) => item.level === "error");
  // Replay each documented project scenario through the electrical input path,
  // PLC scan, and mapped output load. This proves the output tag reaches its
  // connected schematic load for the actual example case, rather than testing
  // the schematic only with forced output values.
  const integrationCases = example.testCases.map((testCase) => {
    let state = {}, result, circuit, inputsForCircuit = {};
    const sequence = testCase.sequence || [{ inputs:testCase.inputs, dt:testCase.dt, numericInputs:testCase.numericInputs }];
    for (const step of sequence) {
      const rawInputs = { ...example.initialState, ...(step.inputs || step) };
      const numericInputs = { ...(testCase.numericInputs || {}), ...(step.numericInputs || {}) };
      circuit = simulateElectricalDiagram(diagram, { ...rawInputs, ...numericInputs }, state.outputs || {});
      inputsForCircuit = circuit.inputs;
      const connectedNumericInputs=Object.fromEntries(Object.entries(numericInputs).filter(([name])=>Object.hasOwn(inputsForCircuit,name)));
      const dt = step.dt || testCase.dt || (example.processes?.length ? 1000 : 100);
      result = example.editorType === "FBD"
        ? scanFBD(reopenedProject.fbdBlocks, inputsForCircuit, state, example.io.outputs, dt, connectedNumericInputs)
        : scan(reopenedProject, { ...inputsForCircuit, ...connectedNumericInputs }, state, dt);
      if (reopenedProject.processes?.length) {
        const processStep = stepProcesses(reopenedProject.processes, { ...result.values, ...connectedNumericInputs }, state.processStates || {}, dt);
        result = { ...result, processValues:processStep.values, processStates:processStep.states, values:{ ...result.values, ...connectedNumericInputs, ...processStep.values } };
      } else result.values = { ...result.values, ...connectedNumericInputs };
      state = result;
    }
    const resultTag = example.logic.outputTag || example.logic.rungs[0].coil;
    const actual = example.processes?.length ? result?.processValues?.[resultTag] : example.editorType === "FBD" || example.logic.rungs.some((rung) => rung.scale) ? result?.outputs[resultTag] : Boolean(result?.outputs[resultTag]);
    const outputComponent = diagram.components.find((item) => item.tag === resultTag);
    const electricalResult=simulateElectricalDiagram(diagram,inputsForCircuit,{...(result?.outputs||{}),...(result?.processValues||{})});
    const isDigital=Boolean(outputComponent&&typeof testCase.expected==="boolean"&&electricalComponentCatalog[outputComponent.type]?.kind==="load");
    const isAnalog=Boolean(outputComponent&&typeof testCase.expected==="number"&&electricalComponentCatalog[outputComponent.type]?.kind==="analog-signal-indicator");
    const electrical=isDigital?Boolean(electricalResult.energized[outputComponent.id]):isAnalog?electricalResult.analogOutputs[resultTag]??null:null;
    const supported=isDigital||isAnalog;
    const numericEqual=(a,b)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<1e-6;
    const pass=supported?(typeof testCase.expected==="number"?numericEqual(actual,testCase.expected)&&numericEqual(electrical,testCase.expected):actual===testCase.expected&&electrical===testCase.expected):null;
    return { name:testCase.name.en, pass, logicExpected:testCase.expected, logicActual:actual, outputTag:resultTag, connectedLoad:outputComponent?.reference || null, loadActual:electrical, supported };
  });
  const integrationPassBits=integrationCases.map((item)=>item.supported?(item.pass?"1":"0"):"-").join("");
  const logicPassBits=cases.map((item)=>item.pass?"1":"0").join(""),componentPassBits=componentCases.map((item)=>item.pass?"1":"0").join("");
  return {
    id: example.id,
    name: example.title.en,
    saveReopenPass,
    saveReopenErrors: saveReopenPass ? [] : ["Project JSON changed during save/reopen round-trip."],
    structuralPass: structural,
    structuralErrors: issues.filter((item)=>item.level==="error").map(({code,message})=>({code,message})),
    structuralWarningCount: issues.filter((item)=>item.level==="warning").length,
    logicCaseCount: cases.length,
    logicPassBits,
    logicFailures: cases.filter((item)=>!item.pass),
    electricalCaseCount: componentCases.length,
    electricalPassBits:componentPassBits,
    electricalFailures:componentCases.filter((item)=>!item.pass),
    integrationCaseCount:integrationCases.filter((item)=>item.supported).length,
    integrationPassBits,
    integrationFailures:integrationCases.filter((item)=>item.pass===false),
    componentPass: componentCases.length > 0 && componentCases.every((item) => item.pass),
    componentCounts: { devices:diagram.components.length, wires:diagram.wires.length, mappedInputs:boolInputs.length, mappedOutputs:boolOutputs.length },
    passed: saveReopenPass && structural && cases.every((item) => item.pass) && componentCases.length > 0 && componentCases.every((item) => item.pass) && integrationCases.some((item) => item.supported) && integrationCases.filter((item) => item.supported).every((item) => item.pass),
  };
});
const report = {
  product: "AdigunSPs",
  scope: "Each generated project is JSON serialized and parsed through the same structural import normalizer used by the app before validation, mapped schematic I/O checks, and documented scenarios through the schematic input path, PLC scan, and connected digital or scalar analog output where present. This import-normalized project-model round-trip is not a browser-storage UI test. Scalar analog wiring carries tag values only; it does not simulate voltage/current physics. Manufacturer hardware, electrical code, physical wiring, component layout quality, and safety are not certified.",
  acceptanceTarget: 200,
  caseEncoding: { logic:"logicPassBits uses testCases order from src/examples.js (1=pass, 0=fail)", electrical:"electricalPassBits uses BOOL input tag order (pressed cases), then BOOL output tag order (off then on); 1=pass, 0=fail", integration:"integrationPassBits follows testCases order; 1=pass, 0=fail, -=not applicable to a wired output model" },
  exampleCount: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  caseCount: results.reduce((sum, item) => sum + item.logicCaseCount, 0),
  componentCaseCount: results.reduce((sum,item)=>sum+item.electricalCaseCount,0),
  componentCasesPassed: results.reduce((sum,item)=>sum+(item.electricalPassBits.match(/1/g)||[]).length,0),
  integrationCaseCount: results.reduce((sum,item)=>sum+item.integrationCaseCount,0),
  integrationCasesPassed: results.reduce((sum,item)=>sum+item.integrationCaseCount-(item.integrationPassBits.match(/0/g)||[]).length,0),
  examplesWithComponentsPassed: results.filter((item)=>item.componentPass).length,
  projectsSaveReopenPassed: results.filter((item)=>item.saveReopenPass).length,
  acceptanceMet: results.length === 200 && results.every((item) => item.passed),
  examples: results,
};

await writeFile(new URL("../docs/engineering-validation-report.json", import.meta.url), `${JSON.stringify(report)}\n`);
console.log(`Examples: ${report.passed}/${report.exampleCount} passed; ${report.projectsSaveReopenPassed}/${report.exampleCount} project-model JSON round-trips; ${report.caseCount} logic cases; ${report.componentCasesPassed}/${report.componentCaseCount} schematic checks; ${report.integrationCasesPassed}/${report.integrationCaseCount} integrated PLC-to-component cases; target ${report.acceptanceTarget}; acceptance ${report.acceptanceMet ? "met" : "NOT MET"}.`);
if (!report.acceptanceMet) process.exitCode = 1;
