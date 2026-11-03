import assert from "node:assert/strict";
import test from "node:test";
import { createSerialExchange, openSerialExchange } from "../src/hardware-serial-protocol.js";

test("serial adapter accepts split replies and rejects pending commands on EOF", async () => {
  let input, closed = false;
  const encoder = new TextEncoder();
  const port = {
    readable: new ReadableStream({ start(controller) { input = controller; } }),
    writable: new WritableStream({
      write(bytes) {
        const frame = JSON.parse(new TextDecoder().decode(bytes));
        if (frame.command === "HEARTBEAT") {
          input.close();
          return;
        }
        const reply = JSON.stringify({ type: "ACK", id: frame.id }) + "\n";
        input.enqueue(encoder.encode(reply.slice(0, 5)));
        input.enqueue(encoder.encode(reply.slice(5)));
      }
    }),
    async open(options) { assert.equal(options.baudRate, 115200); },
    async close() {
      assert.equal(this.readable.locked, false);
      assert.equal(this.writable.locked, false);
      closed = true;
    }
  };
  const session = await openSerialExchange(port);
  assert.equal((await session.send("SYNC")).type, "ACK");
  await assert.rejects(session.send("HEARTBEAT"), /Offline/);
  assert.equal(await session.disconnected, null);
  assert.equal(closed, true);
});

for (const fault of [false, true]) {
  test(fault ? "hard fault closes the serial port" : "timeout closes the serial port", async () => {
    let input;
    let closed = false;
    const port = {
      readable: new ReadableStream({ start(controller) { input = controller; } }),
      writable: new WritableStream({ write() {
        if (fault) input.enqueue(new TextEncoder().encode('{"type":"HARD_FAULT"}\n'));
      } }),
      async open() {},
      async close() { closed = true; }
    };
    const session = await openSerialExchange(port, 30);
    await assert.rejects(session.send("SYNC"), fault ? /HARD_FAULT/ : /timed out/);
    const reason = await session.disconnected;
    assert.match(reason.message, fault ? /HARD_FAULT/ : /timed out/);
    assert.equal(closed, true);
    await assert.rejects(session.send("HEARTBEAT"), /Offline/);
  });
}

test("interlock rejection keeps the device reason", async () => {
  const exchange = createSerialExchange(() => {});
  const command = exchange.send("SET_RELAY", 2, true);
  exchange.receive('{"type":"NACK","id":1,"reason":"Interlock Violation"}');
  await assert.rejects(command, /Command Failed: Interlock Violation/);
  exchange.close();
});

test("reopening a port does not replay commands", async () => {
  const commands = [];
  const port = {
    async open() {
      let input;
      this.readable = new ReadableStream({ start(controller) { input = controller; } });
      this.writable = new WritableStream({
        write(bytes) {
          const frame = JSON.parse(new TextDecoder().decode(bytes));
          commands.push(frame.command);
          input.enqueue(new TextEncoder().encode(JSON.stringify({ type: "ACK", id: frame.id }) + "\n"));
        }
      });
    },
    async close() {}
  };
  const first = await openSerialExchange(port);
  await first.send("SYNC");
  await first.close();
  const next = await openSerialExchange(port);
  assert.deepEqual(commands, ["SYNC"]);
  await next.send("SYNC");
  assert.deepEqual(commands, ["SYNC", "SYNC"]);
  await next.close();
});

test("relay ACK must confirm the requested channel and GPIO state", async () => {
  const exchange = createSerialExchange(() => {});
  const first = exchange.send("SET_RELAY", 3, true);
  exchange.receive('{"type":"ACK","id":1,"channel":3,"enabled":true}');
  assert.equal((await first).enabled, true);
  const second = exchange.send("SET_RELAY", 3, false);
  exchange.receive('{"type":"ACK","id":2,"channel":3,"enabled":true}');
  await assert.rejects(second, /readback mismatch/);
  await assert.rejects(exchange.send("HEARTBEAT"), /Offline/);
});

test("stop supersedes heartbeat and ignores its late ACK", async () => {
  const exchange = createSerialExchange(() => {});
  const heartbeat = exchange.send("HEARTBEAT");
  const stop = exchange.send("STOP_ALL");
  await assert.rejects(heartbeat, /superseded/);
  exchange.receive('{"type":"ACK","id":1}');
  exchange.receive('{"type":"ACK","id":2}');
  assert.equal((await stop).id, 2);
  exchange.close();
});

test("serial setup failure releases a partially acquired reader", async () => {
  const readable = new ReadableStream();
  let closed = false;
  await assert.rejects(openSerialExchange({
    readable,
    writable: null,
    async open() {},
    async close() { closed = true; }
  }), TypeError);
  assert.equal(readable.locked, false);
  assert.equal(closed, true);
});

test("superseded write failure cannot close a pending stop", async () => {
  let failHeartbeat;
  const exchange = createSerialExchange(frame =>
    JSON.parse(frame).command === "HEARTBEAT"
      ? new Promise((resolve, reject) => { failHeartbeat = reject; })
      : undefined
  );
  const heartbeat = exchange.send("HEARTBEAT");
  await Promise.resolve();
  const stop = exchange.send("STOP_ALL");
  await assert.rejects(heartbeat, /superseded/);
  failHeartbeat(new Error("Stale write failed"));
  await Promise.resolve();
  await Promise.resolve();
  exchange.receive('{"type":"ACK","id":2}');
  assert.equal((await stop).id, 2);
  exchange.close();
});
