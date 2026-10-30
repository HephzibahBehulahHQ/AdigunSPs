const MAX_ADDRESS = 0xffff;
export const MODBUS_FUNCTIONS = Object.freeze({ READ_COILS:1, READ_DISCRETE_INPUTS:2, READ_HOLDING_REGISTERS:3, READ_INPUT_REGISTERS:4, WRITE_SINGLE_COIL:5, WRITE_SINGLE_REGISTER:6, WRITE_MULTIPLE_COILS:15, WRITE_MULTIPLE_REGISTERS:16 });
export function createProtocolMemory() { return { coils:{ 0:true, 1:false }, discreteInputs:{ 0:true, 1:false }, holdingRegisters:{ 0:1234, 1:0 }, inputRegisters:{ 0:5678, 1:0 } }; }

function bytesFromHex(value) {
  const compact = String(value || "").replace(/0x/gi, "").replace(/[\s,:-]/g, "");
  if (!compact || compact.length % 2 || !/^[0-9a-f]+$/i.test(compact)) throw new Error("Enter an even-length hexadecimal Modbus TCP frame.");
  return Uint8Array.from(compact.match(/../g), (byte) => Number.parseInt(byte, 16));
}
function hex(bytes) { return [...bytes].map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" "); }
function readWord(bytes, offset) { return (bytes[offset] << 8) | bytes[offset + 1]; }
function word(value) { return [value >> 8 & 0xff, value & 0xff]; }
function snapshot(memory) { return Object.fromEntries(Object.entries(memory).map(([area, values]) => [area, { ...values }])); }
function exception(functionCode, code, tx, unit) { const pdu = [functionCode | 0x80, code], body = [unit, ...pdu]; return Uint8Array.from([...word(tx), 0, 0, ...word(body.length), ...body]); }

export function simulateModbusTcp(frame, memory = createProtocolMemory()) {
  let request;
  try { request = bytesFromHex(frame); } catch (error) { return { ok:false, error:error.message, memory:snapshot(memory) }; }
  if (request.length > 260) return { ok:false, error:"A Modbus TCP application data unit cannot exceed 260 bytes.", request:hex(request.slice(0, 16)), memory:snapshot(memory) };
  if (request.length < 8) return { ok:false, error:"A Modbus TCP request must contain the 7-byte MBAP header and a function code.", request:hex(request), memory:snapshot(memory) };
  const tx = readWord(request, 0), protocol = readWord(request, 2), length = readWord(request, 4), unit = request[6], functionCode = request[7], pdu = request.slice(7);
  if (protocol !== 0) return { ok:false, error:"The Modbus TCP protocol identifier must be 0.", request:hex(request), memory:snapshot(memory) };
  if (length !== request.length - 6 || length < 2) return { ok:false, error:"The MBAP length does not match the request frame.", request:hex(request), memory:snapshot(memory) };
  const fail = (code) => ({ ok:true, exception:code, request:hex(request), response:hex(exception(functionCode, code, tx, unit)), functionCode, memory:snapshot(memory) });
  const malformed = () => fail(3), getRange = (area, start, quantity) => Array.from({ length:quantity }, (_, i) => Number(memory[area][start + i] ?? 0));
  let responsePdu;
  if ([1, 2, 3, 4].includes(functionCode)) {
    if (pdu.length !== 5) return malformed();
    const start = readWord(request, 8), quantity = readWord(request, 10);
    const bitRead = functionCode <= 2, validQuantity = bitRead ? quantity >= 1 && quantity <= 2000 : quantity >= 1 && quantity <= 125;
    if (!validQuantity) return malformed();
    if (start + quantity - 1 > MAX_ADDRESS) return fail(2);
    const area = ({ 1:"coils", 2:"discreteInputs", 3:"holdingRegisters", 4:"inputRegisters" })[functionCode], values = getRange(area, start, quantity);
    if (bitRead) {
      const bytes = Array.from({ length:Math.ceil(quantity / 8) }, () => 0);
      values.forEach((value, i) => { if (value) bytes[Math.floor(i / 8)] |= 1 << (i % 8); });
      responsePdu = [functionCode, bytes.length, ...bytes];
    } else responsePdu = [functionCode, quantity * 2, ...values.flatMap((value) => word(value & 0xffff))];
  } else if (functionCode === 5 || functionCode === 6) {
    if (pdu.length !== 5) return malformed();
    const address = readWord(request, 8), value = readWord(request, 10);
    if (functionCode === 5 && value !== 0xff00 && value !== 0) return malformed();
    memory[functionCode === 5 ? "coils" : "holdingRegisters"][address] = functionCode === 5 ? value === 0xff00 : value;
    responsePdu = [...pdu];
  } else if (functionCode === 15 || functionCode === 16) {
    if (pdu.length < 6) return malformed();
    const address = readWord(request, 8), quantity = readWord(request, 10), byteCount = request[12], bitWrite = functionCode === 15;
    const max = bitWrite ? 1968 : 123, expectedBytes = bitWrite ? Math.ceil(quantity / 8) : quantity * 2;
    if (quantity < 1 || quantity > max || byteCount !== expectedBytes || pdu.length !== 6 + byteCount) return malformed();
    if (address + quantity - 1 > MAX_ADDRESS) return fail(2);
    const area = bitWrite ? "coils" : "holdingRegisters";
    for (let i = 0; i < quantity; i++) memory[area][address + i] = bitWrite ? Boolean(request[13 + Math.floor(i / 8)] & (1 << (i % 8))) : readWord(request, 13 + i * 2);
    responsePdu = [functionCode, ...word(address), ...word(quantity)];
  } else return fail(1);
  const body = [unit, ...responsePdu], response = Uint8Array.from([...word(tx), 0, 0, ...word(body.length), ...body]);
  return { ok:true, request:hex(request), response:hex(response), functionCode, memory:snapshot(memory) };
}
