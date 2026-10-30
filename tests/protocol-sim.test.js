import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createProtocolMemory, simulateModbusTcp } from "../src/protocol-sim.js";
import { createApplicationMenuEntries } from "../src/app-menus.js";

function frame(functionCode, data = [], transaction = 0x1234, unit = 1) {
  const body = [unit, functionCode, ...data];
  const bytes = [transaction >> 8, transaction & 255, 0, 0, body.length >> 8, body.length & 255, ...body];
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
const w = (value) => [value >> 8 & 255, value & 255], m = createProtocolMemory();
const coils = simulateModbusTcp(frame(1, [...w(0), ...w(2)]), m);
assert.equal(coils.response, "12 34 00 00 00 04 01 01 01 01", "read-coils packs LSB-first values and preserves transaction ID");
assert.ok(simulateModbusTcp(frame(2, [...w(0), ...w(2)]), m).response.endsWith("01 02 01 01"), "read-discrete-inputs returns packed bits");
assert.equal(simulateModbusTcp(frame(3, [...w(0), ...w(2)]), m).response, "12 34 00 00 00 07 01 03 04 04 D2 00 00", "read-holding-registers returns big-endian values");
assert.ok(simulateModbusTcp(frame(4, [...w(0), ...w(1)]), m).response.endsWith("01 04 02 16 2E"), "read-input-registers returns big-endian values");
assert.equal(simulateModbusTcp(frame(6, [...w(1), ...w(4321)]), m).memory.holdingRegisters[1], 4321, "single-register write changes memory");
assert.equal(simulateModbusTcp(frame(5, [...w(1), ...w(0xff00)]), m).memory.coils[1], true, "single-coil write changes memory");
assert.equal(simulateModbusTcp(frame(16, [...w(2), ...w(2), 4, ...w(7), ...w(8)]), m).memory.holdingRegisters[3], 8, "multiple-register write changes addressed words");
assert.equal(simulateModbusTcp(frame(15, [...w(2), ...w(3), 1, 0b00000101]), m).memory.coils[4], true, "multiple-coil write unpacks LSB-first bits");
assert.ok(simulateModbusTcp(frame(4, [...w(0xffff), ...w(2)]), m).response.endsWith("01 84 02"), "address overflow returns illegal-address exception");
assert.ok(simulateModbusTcp(frame(99), m).response.endsWith("01 E3 01"), "unsupported function returns illegal-function exception");
assert.equal(simulateModbusTcp("120000010005010300000001", m).ok, false, "invalid protocol identifier is rejected");
assert.equal(simulateModbusTcp("120000000005010300000001", m).ok, false, "MBAP length mismatch is rejected");
assert.equal(simulateModbusTcp("not hex", m).ok, false, "invalid hex is rejected");
assert.equal(simulateModbusTcp("00".repeat(261), m).ok, false, "oversized Modbus TCP ADU is rejected");
for (const locale of ["en", "de", "yo", "pcm"]) assert.ok(createApplicationMenuEntries(locale).tools.some((entry) => entry.action === "protocol-simulator"), `${locale} Tools menu exposes protocol simulation`);
const app = readFileSync("src/app.js", "utf8"), worker = readFileSync("service-worker.js", "utf8");
assert.ok(app.includes('name === "protocol-simulator"') && app.includes('id="protocolTrafficRows"') && app.includes('id="runProtocolRequest"'), "local protocol simulator UI and traffic monitor are wired");
assert.ok(worker.includes("./src/protocol-sim.js"), "service worker caches protocol simulator module");
console.log("PASS: Modbus TCP read/write functions, exceptions, validation, locale menu entry, and offline UI bindings");
