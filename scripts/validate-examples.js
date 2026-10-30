import { writeFile } from "node:fs/promises";
import { examples } from "../src/examples.js";
import { makeProjectFromExample, runExampleChecks } from "../src/engine.js";
import { validateProject } from "../src/validation.js";
import { simulateElectricalDiagram } from "../src/electrical.js";

const results = examples.map((example) => {
  const cases = runExampleChecks(example).map((item) => ({
    name: item.name.en,
    pass: item.pass,
    expected: item.expected,
    actual: item.actual,
    sequenceSteps: item.sequence?.length || 1,
  }));
  const issues = validateProject(makeProjectFromExample(example));
  const project = makeProjectFromExample(example), diagram = project.electrical;
  const boolInputs = example.tags.filter((tag) => tag.role === "input" && tag.type === "BOOL");
  const boolOutputs = example.tags.filter((tag) => tag.role === "output" && tag.type === "BOOL");
  const componentCases = [
    ...boolInputs.map((tag) => { const result=simulateElectricalDiagram(diagram,{[tag.name]:true});return {name:`input ${tag.name}`,pass:result.inputs[tag.name]===true,actual:result.inputs[tag.name]}; }),
    ...boolOutputs.flatMap((tag) => { const load=diagram.components.find((item)=>item.tag===tag.name);return [false,true].map((value)=>({name:`output ${tag.name}=${value}`,pass:Boolean(simulateElectricalDiagram(diagram,{}, {[tag.name]:value}).energized[load?.id])===value,actual:Boolean(simulateElectricalDiagram(diagram,{}, {[tag.name]:value}).energized[load?.id])})); }),
  ];
  const structural = Boolean(example.id && example.title.en && example.description.en && example.logic.rungs.length && example.tags.length && example.io.inputs.length && example.io.outputs.length && example.testCases.length && diagram.components.length && diagram.wires.length) && !issues.some((item) => item.level === "error");
  const logicPassBits=cases.map((item)=>item.pass?"1":"0").join(""),componentPassBits=componentCases.map((item)=>item.pass?"1":"0").join("");
  return {
    id: example.id,
    name: example.title.en,
    structuralPass: structural,
    structuralErrors: issues.filter((item)=>item.level==="error").map(({code,message})=>({code,message})),
    structuralWarningCount: issues.filter((item)=>item.level==="warning").length,
    logicCaseCount: cases.length,
    logicPassBits,
    logicFailures: cases.filter((item)=>!item.pass),
    electricalCaseCount: componentCases.length,
    electricalPassBits:componentPassBits,
    electricalFailures:componentCases.filter((item)=>!item.pass),
    componentPass: componentCases.length > 0 && componentCases.every((item) => item.pass),
    componentCounts: { devices:diagram.components.length, wires:diagram.wires.length, mappedInputs:boolInputs.length, mappedOutputs:boolOutputs.length },
    passed: structural && cases.every((item) => item.pass) && componentCases.length > 0 && componentCases.every((item) => item.pass),
  };
});
const report = {
  product: "AdigunSPs",
  scope: "Generic educational PLC I/O schematics are checked for project validity, mapped boolean-input sensing, and output-to-lamp simulation. This does not validate manufacturer hardware, electrical code, physical wiring, analog signal physics, or safety.",
  acceptanceTarget: 200,
  caseEncoding: { logic:"logicPassBits uses testCases order from src/examples.js (1=pass, 0=fail)", electrical:"electricalPassBits uses BOOL input tag order (pressed cases), then BOOL output tag order (off then on); 1=pass, 0=fail" },
  exampleCount: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  caseCount: results.reduce((sum, item) => sum + item.logicCaseCount, 0),
  componentCaseCount: results.reduce((sum,item)=>sum+item.electricalCaseCount,0),
  componentCasesPassed: results.reduce((sum,item)=>sum+(item.electricalPassBits.match(/1/g)||[]).length,0),
  examplesWithComponentsPassed: results.filter((item)=>item.componentPass).length,
  acceptanceMet: results.length === 200 && results.every((item) => item.passed),
  examples: results,
};

await writeFile(new URL("../docs/engineering-validation-report.json", import.meta.url), `${JSON.stringify(report)}\n`);
console.log(`Examples: ${report.passed}/${report.exampleCount} passed; ${report.caseCount} logic cases; ${report.componentCasesPassed}/${report.componentCaseCount} electrical cases across ${report.examplesWithComponentsPassed} examples; target ${report.acceptanceTarget}; acceptance ${report.acceptanceMet ? "met" : "NOT MET"}.`);
if (!report.acceptanceMet) process.exitCode = 1;
