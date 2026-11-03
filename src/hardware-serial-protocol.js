export function encodeSerialCommand(id, command, channel, enabled) {
  if (!Number.isSafeInteger(id) || id < 1) throw new TypeError("Invalid command ID");
  if (command === "SET_RELAY") {
    if (!Number.isInteger(channel) || channel < 1 || channel > 4 || typeof enabled !== "boolean") {
      throw new TypeError("Invalid relay command");
    }
    return JSON.stringify({ id, command, channel, enabled }) + "\n";
  }
  if (!["SYNC", "HEARTBEAT", "STOP_ALL"].includes(command)) throw new TypeError("Unknown command");
  return JSON.stringify({ id, command }) + "\n";
}

export function decodeSerialReply(line) {
  if (typeof line !== "string" || line.length > 1024) throw new TypeError("Invalid serial frame");
  const reply = JSON.parse(line);
  if (reply?.type === "HARD_FAULT") return reply;
  if (!["ACK", "NACK"].includes(reply?.type) || !Number.isSafeInteger(reply.id) || reply.id < 1) {
    throw new TypeError("Invalid acknowledgement");
  }
  return reply;
}

export function createSerialExchange(write, timeoutMs = 750, firstId = 1) {
  let nextId = firstId;
  let pending;
  let closed = false;

  function finish(error, reply) {
    if (!pending) return;
    const { timer, resolve, reject } = pending;
    pending = undefined;
    clearTimeout(timer);
    if (error) reject(error);
    else resolve(reply);
  }

  function close(error = new Error("Device Offline")) {
    closed = true;
    finish(error);
  }

  return {
    async send(command, channel, enabled) {
      if (closed) throw new Error("Device Offline");
      if (pending && command === "STOP_ALL") finish(new Error("Command superseded by stop"));
      if (pending) throw new Error("A command is awaiting acknowledgement");
      const id = nextId++;
      const frame = encodeSerialCommand(id, command, channel, enabled);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => close(new Error("Command Failed: acknowledgement timed out")), timeoutMs);
        pending = { id, command, channel, enabled, timer, resolve, reject };
        Promise.resolve().then(() => {
          if (!closed && pending?.id === id) return write(frame);
        }).catch(error => {
          if (pending?.id === id) close(error);
        });
      });
    },
    receive(line) {
      const reply = decodeSerialReply(line);
      if (reply.type === "HARD_FAULT") {
        const detail = typeof reply.reason === "string" && reply.reason.trim();
        const error = new Error(detail ? "HARD_FAULT: " + detail : "HARD_FAULT");
        close(error);
        throw error;
      }
      else if (pending?.id === reply.id) {
        if (reply.type === "NACK") finish(new Error(typeof reply.reason === "string" && reply.reason.trim() ? "Command Failed: " + reply.reason : "Command Failed: NACK"));
        else if (pending.command === "SET_RELAY" &&
          (reply.channel !== pending.channel || reply.enabled !== pending.enabled)) {
          close(new Error("Command Failed: relay readback mismatch"));
        } else finish(null, reply);
      }
      return reply;
    },
    get closed() { return closed; },
    close
  };
}

export async function openSerialExchange(port, timeoutMs) {
  await port.open({ baudRate: 115200 });
  let reader, writer;
  try {
    reader = port.readable.getReader();
    writer = port.writable.getWriter();
  } catch (error) {
    reader?.releaseLock();
    await port.close().catch(() => {});
    throw error;
  }
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const exchange = createSerialExchange(frame => writer.write(encoder.encode(frame)), timeoutMs,
    1 + (crypto.getRandomValues(new Uint32Array(1))[0] >>> 1));
  let cleanup;
  let failure;

  function close() {
    exchange.close();
    cleanup ??= (async () => {
      await Promise.allSettled([reader.cancel(), writer.abort()]);
      reader.releaseLock();
      writer.releaseLock();
      await port.close();
    })();
    return cleanup;
  }

  async function readReplies() {
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let end;
        while ((end = buffer.indexOf("\n")) !== -1) {
          exchange.receive(buffer.slice(0, end));
          buffer = buffer.slice(end + 1);
        }
        if (buffer.length > 1024) throw new Error("Serial reply exceeds frame limit");
      }
    } finally {
      await close();
    }
  }

  const disconnected = readReplies().then(() => failure ?? null, error => error);
  return { async send(...args) {
    try {
      return await exchange.send(...args);
    } catch (error) {
      if (exchange.closed && !cleanup) {
        failure ??= error;
        void close().catch(() => {});
      }
      throw error;
    }
  }, close, disconnected };
}
