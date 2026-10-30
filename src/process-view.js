import { formatLocaleNumber } from "./formatting.js";

const xml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" })[char]);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function equipment(model, value, ratio) {
  const fill = 50 * ratio, phase = ((value % 24) + 24) % 24, angle = value * 3;
  if (model.type === "tank") return `<path class="twin-pipe" d="M92 42h20v18"/><rect class="twin-shell" x="28" y="16" width="58" height="68" rx="7"/><rect class="twin-liquid" x="31" y="${81-fill}" width="52" height="${fill}"/><path class="twin-level" d="M31 ${81-fill}h52"/>`;
  if (model.type === "conveyor") return `<path class="twin-pipe" d="M12 83h108"/><rect class="twin-belt" x="12" y="55" width="108" height="26" rx="7"/><circle class="twin-roller" cx="25" cy="83" r="7"/><circle class="twin-roller" cx="107" cy="83" r="7"/><rect class="twin-box" x="${25+phase}" y="39" width="14" height="15" rx="2"/><rect class="twin-box alt" x="${73-phase/2}" y="39" width="14" height="15" rx="2"/>`;
  if (model.type === "motor") return `<rect class="twin-shell" x="26" y="31" width="70" height="49" rx="15"/><path class="twin-pipe" d="M96 44h15v23H96M37 80v8m48-8v8"/><circle class="twin-rotor" cx="61" cy="55" r="16"/><g class="twin-spokes" transform="rotate(${angle} 61 55)"><path d="M61 40v30M46 55h30M50 44l22 22M72 44 50 66"/></g>`;
  if (model.type === "thermal") return `<rect class="twin-shell" x="24" y="19" width="76" height="68" rx="9"/><path class="twin-coil" style="stroke-width:${3+ratio*4}" d="M37 60c8-27 14 27 22 0s14 27 22 0 12 19 14 0"/><path class="twin-pipe" d="M61 19V8m0 79v8"/>`;
  if (model.type === "pump") return `<path class="twin-pipe" d="M10 58h25m54 0h27"/><rect class="twin-shell" x="34" y="34" width="58" height="48" rx="14"/><circle class="twin-rotor" cx="63" cy="58" r="18"/><g class="twin-spokes" transform="rotate(${angle} 63 58)"><path d="M63 42v32M47 58h32M52 47l22 22M74 47 52 69"/></g>`;
  const needle = -125 + 250 * ratio;
  return `<path class="twin-gauge" d="M24 79a39 39 0 0 1 78 0"/><path class="twin-needle" d="M63 77 63 44" transform="rotate(${needle} 63 77)"/><circle class="twin-rotor" cx="63" cy="77" r="5"/>`;
}

export function renderProcessTwin(models = [], values = {}, language = "en") {
  if (!models.length) return "";
  const width = Math.max(300, models.length * 150 + 20), units = { tank:"%", conveyor:"m", motor:"rpm", thermal:"°C", pump:"L/min", pid:"%" };
  const nodes = models.map((model, index) => {
    const raw = Number(values[model.outputTag] ?? model.initial ?? 0), value = Number.isFinite(raw) ? raw : 0;
    const max = Number(model.type === "tank" ? model.capacity : model.type === "conveyor" ? model.length : model.type === "motor" ? model.ratedSpeed : model.type === "pump" ? model.maxFlow : model.type === "pid" ? model.max : 100) || 100;
    const ratio = clamp(value / max, 0, 1), x = 10 + index * 150;
    const shown = formatLocaleNumber(value, language, 1);
    return `<g class="twin-node" data-bound-tag="${xml(model.outputTag)}" transform="translate(${x} 5)"><title>${xml(model.name)} · ${xml(model.outputTag)} · ${xml(shown)} ${xml(units[model.type] || "")}</title>${equipment(model, value, ratio)}<text class="twin-label" x="63" y="108">${xml(model.name)}</text><text class="twin-value" x="63" y="125">${xml(model.outputTag)} · ${xml(shown)} ${xml(units[model.type] || "")}</text></g>`;
  }).join("");
  return `<svg class="process-twin-svg" role="img" aria-label="2D educational process view with tag-bound process values" viewBox="0 0 ${width} 140" width="${width}" xmlns="http://www.w3.org/2000/svg">${nodes}</svg>`;
}

