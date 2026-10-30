import assert from "node:assert/strict";
import { allocateIoAddresses, validateIoAllocation } from "../src/io-allocator.js";
import { createIoScheduleCsv, createWiringReferenceHtml } from "../src/reports.js";

const project = {
  name:"Conveyor",
  io:{ inputs:["Start","Stop","Speed"], outputs:["Motor"] },
  tags:[
    { name:"Start", type:"BOOL", role:"input" },
    { name:"Stop", type:"BOOL", role:"input" },
    { name:"Speed", type:"REAL", role:"input" },
    { name:"Motor", type:"BOOL", role:"output" },
    { name:"InternalFlag", type:"BOOL", role:"internal" },
  ],
};

const s7 = allocateIoAddresses(project, "siemensS7", { input:2, output:1, analogInput:1, analogOutput:0 });
assert.deepEqual(s7.rows.map((row) => row.address), ["I0.0", "I0.1", "IW64", "Q0.0", ""]);
assert.equal(s7.rows[0].terminal, "DI-0");
assert.equal(s7.rows[0].wire, "W-0001");
assert.ok(!s7.issues.some((issue) => issue.severity === "error"), "valid proposed channels have no errors");
assert.ok(s7.issues.some((issue) => issue.code === "terminal-assumptions"), "physical terminal verification is disclosed");
assert.deepEqual(project.tags[0], { name:"Start", type:"BOOL", role:"input" }, "allocation does not mutate the source project");

const ab = allocateIoAddresses(project, "allenBradleySlc", { input:2, output:1, analogInput:1, analogOutput:0 });
assert.equal(ab.rows[0].address, "I:0/0");
assert.equal(ab.rows[3].address, "O:0/0");
assert.ok(ab.issues.some((issue) => issue.code === "unsupported-profile-type" && issue.tag === "Speed"));

const full = allocateIoAddresses(project, "generic", { input:1, output:0, analogInput:0, analogOutput:0 });
assert.ok(full.issues.some((issue) => issue.code === "capacity-exceeded" && issue.tag === "Stop"));
assert.ok(full.issues.some((issue) => issue.code === "capacity-exceeded" && issue.tag === "Motor"));

const duplicate = validateIoAllocation([
  { tag:"A", type:"BOOL", role:"input", direction:"input", address:"I:0/0", status:"proposed" },
  { tag:"B", type:"BOOL", role:"input", direction:"input", address:"i:0/0", status:"proposed" },
]);
assert.ok(duplicate.some((issue) => issue.code === "duplicate-address"));
assert.ok(validateIoAllocation([{ tag:"Wrong", type:"REAL", role:"input", direction:"input", address:"I:0/0", status:"proposed" }]).some((issue) => issue.code === "type-mismatch"));

const approved = {
  ...project,
  tags:project.tags.map((tag,index) => index === 0 ? { ...tag, address:"I:0/0" } : tag),
  ioAllocation:{ approved:true, verified:false, allocations:[{ tag:"Start", address:"I:0/0", role:"input", terminal:"DI-0", wire:"W-0001" }] },
};
const presentation = { productName:"AdigunSPs", companyName:"HB", attribution:"Attribution", companyLogo:"", divisionLabel:"" };
const csv = createIoScheduleCsv(approved, presentation);
assert.match(csv, /Logical terminal/);
assert.match(csv, /DI-0/);
assert.match(createWiringReferenceHtml(approved, presentation), /W-0001/);
assert.doesNotMatch(createIoScheduleCsv(project, presentation), /Logical terminal/, "existing export keeps its original columns without an approved allocation");
assert.doesNotThrow(() => createIoScheduleCsv({ ...project, ioAllocation:{ approved:true, allocations:{} } }, presentation), "unexpected optional metadata does not break existing exports");

console.log("I/O allocator checks passed.");
