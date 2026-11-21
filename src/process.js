const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const active = (signals, tag) => Boolean(tag && signals[tag]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stepPid(model, signals, state, dt) {
  const enabled = !model.controlTag || active(signals, model.controlTag);
  if (!enabled) {
    state.enabled = false;
    return state.output = 0;
  }

  const elapsed = finiteNumber(dt);
  const min = finiteNumber(model.min);
  const max = finiteNumber(model.max, 100);
  const error = finiteNumber(model.setpoint) - finiteNumber(signals[model.inputTag]);
  const derivative = elapsed > 0 && state.enabled !== false && Number.isFinite(state.previousError) ?
    (error - state.previousError) / elapsed : 0;
  const ki = finiteNumber(model.ki);
  const baseOutput = finiteNumber(model.kp) * error + finiteNumber(model.kd) * derivative;
  let integral = finiteNumber(state.integral);
  const output = baseOutput + ki * integral;
  const delta = ki * error * elapsed;
  // Limit the integrator contribution at saturation while allowing it to move back into range.
  if (ki !== 0 && Number.isFinite(delta)) {
    const boundedDelta = clamp(delta, Math.min(0, min - output), Math.max(0, max - output));
    integral = finiteNumber(integral + boundedDelta / ki, integral);
  }
  state.integral = integral;
  state.previousError = error;
  state.enabled = true;
  return state.output = clamp(baseOutput + ki * integral, min, max);
}

export function stepProcesses(models, inputs, previous = {}, dtMs = 100) {
  const states = structuredClone(previous), signals = { ...inputs }, values = {}, dt = Math.max(0, Number(dtMs) || 0) / 1000;
  for (const model of models || []) {
    const state = states[model.id] ||= {};
    let value = 0;
    if (model.type === "tank") {
      const capacity = Math.max(0.001, Number(model.capacity) || 100), level = Number.isFinite(state.level) ? state.level : Number(model.initial) || 0;
      const fill = active(signals, model.controlTag) ? (Number(model.fillRate) || 0) * dt : 0;
      const drain = active(signals, model.secondaryTag) ? (Number(model.drainRate) || 0) * dt : 0;
      value = state.level = clamp(level + fill - drain, 0, capacity);
    } else if (model.type === "conveyor") {
      const length = Math.max(0.001, Number(model.length) || 100), position = Number.isFinite(state.position) ? state.position : Number(model.initial) || 0;
      value = state.position = active(signals, model.controlTag) ? (position + (Number(model.speed) || 0) * dt) % length : position;
    } else if (model.type === "motor") {
      const rated = Number(model.ratedSpeed) || 100, tau = Math.max(0.001, Number(model.responseSeconds) || 2), speed = Number.isFinite(state.speed) ? state.speed : Number(model.initial) || 0;
      const target = active(signals, model.controlTag) ? rated : 0;
      value = state.speed = speed + (target - speed) * (1 - Math.exp(-dt / tau));
    } else if (model.type === "thermal") {
      const ambientValue = Number(model.ambient), ambient = Number.isFinite(ambientValue) ? ambientValue : 20, initial = Number(model.initial), temp = Number.isFinite(state.temp) ? state.temp : Number.isFinite(initial) ? initial : ambient;
      const heating = active(signals, model.controlTag), cooling = active(signals, model.secondaryTag);
      value = state.temp = heating || cooling ? temp + ((heating ? Number(model.heatRate) || 0 : 0) - (cooling ? Number(model.coolingRate) || 0 : 0)) * dt : temp + (ambient - temp) * Math.min(1, (Number(model.passiveCoolingRate) || 0) * dt);
    } else if (model.type === "pump") {
      const maxHead = Math.max(0.001, Number(model.maxHead) || 100), ratio = clamp((Number(model.head) || 0) / maxHead, 0, 1);
      value = active(signals, model.controlTag) ? (Number(model.maxFlow) || 100) * (1 - ratio * ratio) : 0;
    } else if (model.type === "pid") {
      value = stepPid(model, signals, state, dt);
    }
    if (model.outputTag) { values[model.outputTag] = value; signals[model.outputTag] = value; }
  }
  return { states, values };
}

export function defaultProcessModel(type, id, name, controlTag, outputTag, inputTag = "", secondaryTag = "") {
  const common = { id, type, name, controlTag, inputTag, secondaryTag, outputTag };
  const defaults = {
    tank:{ initial:0, capacity:100, fillRate:10, drainRate:8 },
    conveyor:{ initial:0, speed:10, length:100 },
    motor:{ initial:0, ratedSpeed:100, responseSeconds:2 },
    thermal:{ initial:20, ambient:20, heatRate:5, coolingRate:2, passiveCoolingRate:0.2 },
    pump:{ maxFlow:100, head:20, maxHead:100 },
    pid:{ setpoint:50, kp:1, ki:0.1, kd:0, min:0, max:100 },
  };
  if (!defaults[type]) throw new Error(`Unsupported process model: ${type}`);
  return { ...common, ...defaults[type] };
}
