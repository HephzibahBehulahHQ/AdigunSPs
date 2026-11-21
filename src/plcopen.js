import { compileStructuredText } from "./structured-text.js";
import { validateFbdBlocks } from "./fbd-validation.js";
import { fbdBlockPosition } from "./fbd-layout.js";

const NS = "http://www.plcopen.org/xml/tc6_0201";
const XHTML = "http://www.w3.org/1999/xhtml";
const TYPES = new Set(["BOOL", "INT", "REAL", "TIME"]);
const IEC_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const LADDER_TIMER_ADDRESS = /^T\d+\.\d+$/i;
const TIMER_TAG_NOTE = "AdigunSPs timer tag: ";
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const children = (node, name) => [...(node?.children || [])].filter((child) => child.localName === name);
const child = (node, name) => children(node, name)[0] || null;
const text = (node) => node?.textContent?.trim() || "";

function supportedRungs(project) {
  if (!Array.isArray(project.rungs) || !project.rungs.length) throw new Error("Add at least one ladder network before exporting PLCopen XML.");
  const declared = new Set((project.tags || []).map((tag) => tag.name));
  return project.rungs.map((rung, index) => {
    const paths = rung.branches?.length ? rung.branches : [rung.contacts || []];
    const timer = rung.timer;
    const supportedTimer = !timer || ((timer.type || "TON") === "TON" && Number.isSafeInteger(Number(timer.preset)) && Number(timer.preset) > 0 && !timer.resetTag && (timer.output === undefined || timer.output === "DN" || timer.output === "EN") && (IEC_IDENTIFIER.test(timer.tag || "") || LADDER_TIMER_ADDRESS.test(timer.tag || "")));
    if (!Array.isArray(paths) || paths.some((path) => !Array.isArray(path)) || !rung.coil || !supportedTimer || rung.counter || rung.scale || ![undefined, "normal", "set", "reset"].includes(rung.coilMode) || paths.flat().some((contact) => !["NO", "NC", "R_TRIG", "F_TRIG"].includes(contact.mode))) {
      throw new Error(`Network ${index + 1} uses instructions outside the supported PLCopen LD subset.`);
    }
    if (!declared.has(rung.coil) || paths.flat().some((contact) => !declared.has(contact.tag))) throw new Error(`Network ${index + 1} references an undeclared tag.`);
    return { ...rung, branches:paths };
  });
}

function checkedStSource(source, tags) {
  if (typeof source !== "string" || !source.trim()) throw new Error("PLCopen ST needs a nonempty program body.");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(source)) throw new Error("PLCopen ST contains characters outside XML 1.0.");
  const compiled = compileStructuredText(source, tags.map(({ name }) => name));
  if (!compiled.ok) throw new Error(`PLCopen ST uses unsupported or invalid statements: ${compiled.errors[0]}`);
  if (compiled.functions.length || compiled.functionBlocks.length || compiled.programs.length) {
    throw new Error("PLCopen ST supports a single program body without embedded program or function declarations.");
  }
  return source;
}

function readStSource(body, tags) {
  const elements = [...body.children];
  const container = elements[0];
  if (elements.length !== 1 || container.namespaceURI !== XHTML ||
      !["p", "pre", "code"].includes(container.localName) || container.children.length) {
    throw new Error("PLCopen ST needs a plain-text XHTML program body.");
  }
  return checkedStSource(container.textContent, tags);
}

const FBD_COMPARISONS = new Set(["GT", "LT", "EQ"]);

function fbdPins(type, count) {
  if (type === "NOT" && count === 1) return ["IN"];
  if (((type === "XOR" || FBD_COMPARISONS.has(type)) && count === 2) || (["AND", "OR"].includes(type) && count >= 2 && count <= 8)) {
    return Array.from({ length:count }, (_, index) => `IN${index + 1}`);
  }
  throw new Error("PLCopen FBD supports NOT, two-input XOR/GT/LT/EQ, and AND/OR with two to eight inputs.");
}

function checkedFbdBlocks(project) {
  const blocks = project.fbdBlocks || [];
  if (!blocks.length) throw new Error("PLCopen FBD needs at least one supported block.");
  const tags = new Map((project.tags || []).map((tag) => [tag.name, tag]));
  for (const block of blocks) {
    const inputs = block.inputs || [];
    fbdPins(block.type, inputs.length);
    const output = tags.get(block.outputTag);
    if (output?.type !== "BOOL" || output.role === "input" || project.io?.inputs?.includes(block.outputTag)) {
      throw new Error("PLCopen FBD blocks require a declared BOOL result and cannot write to input tags.");
    }
    const inputTypes = inputs.map((name) => tags.get(name)?.type);
    const expectedType = inputTypes[0];
    if (FBD_COMPARISONS.has(block.type)) {
      if (!["INT", "REAL"].includes(expectedType) || inputTypes[1] !== expectedType) {
        throw new Error("PLCopen FBD comparisons require two declared inputs of the same INT or REAL type.");
      }
    } else if (!inputTypes.every((type) => type === "BOOL")) {
      throw new Error("PLCopen FBD Boolean gates require declared BOOL inputs.");
    }
  }
  const errors = validateFbdBlocks(project);
  if (errors.length) throw new Error(errors[0].message);
  return blocks;
}

function createFbdBody(project) {
  const blocks = checkedFbdBlocks(project);
  const producers = new Map(blocks.map((block, index) => [block.outputTag, index + 1]));
  const externalTags = [...new Set(blocks.flatMap((block) => block.inputs).filter((tag) => !producers.has(tag)))];
  const inputs = new Map(externalTags.map((tag, index) => [tag, blocks.length + index + 1]));
  const inputNodes = externalTags.map((tag, index) =>
    `<inVariable localId="${inputs.get(tag)}"><position x="0" y="${24 + index * 28}"/><connectionPointOut/><expression>${esc(tag)}</expression></inVariable>`);
  const blockNodes = blocks.map((block, index) => {
    const id = index + 1, { x, y } = fbdBlockPosition(block, index);
    const pins = fbdPins(block.type, block.inputs.length).map((pin, inputIndex) => {
      const tag = block.inputs[inputIndex], producer = producers.get(tag);
      return `<variable formalParameter="${pin}"><connectionPointIn><connection refLocalId="${producer ?? inputs.get(tag)}"${producer ? ' formalParameter="OUT"' : ""}/></connectionPointIn></variable>`;
    }).join("");
    const outputId = blocks.length + inputs.size + id;
    return `<block localId="${id}" typeName="${block.type}" width="100" height="72"><position x="${x}" y="${y}"/><inputVariables>${pins}</inputVariables><inOutVariables/><outputVariables><variable formalParameter="OUT"><connectionPointOut/></variable></outputVariables></block>` +
      `<outVariable localId="${outputId}"><position x="${x + 115}" y="${y}"/><connectionPointIn><connection refLocalId="${id}" formalParameter="OUT"/></connectionPointIn><expression>${esc(block.outputTag)}</expression></outVariable>`;
  });
  return `<FBD>${inputNodes.join("")}${blockNodes.join("")}</FBD>`;
}

function createTaskConfiguration(task) {
  if (!task) return "<configurations/>";
  const { name = "Main", mode = "cyclic", cycleMs = 100 } = task;
  if (mode !== "cyclic" || typeof name !== "string" ||
      !Number.isInteger(cycleMs) || cycleMs < 1 || cycleMs > 60000) {
    throw new Error("PLCopen export requires a named cyclic task with a period of 1–60000 milliseconds.");
  }
  return `<configurations><configuration name="Config"><resource name="Resource"><task name="${esc(name.trim() || "Main")}" interval="T#${cycleMs}ms" priority="0"><pouInstance name="MainInstance" typeName="Main"/></task></resource></configuration></configurations>`;
}

export function createPlcopenXml(project) {
  if (project.programUnits?.length || project.tasks?.length) {
    throw new Error("PLCopen XML export supports a single program body. Use project JSON to preserve program units and task assignments.");
  }
  const mode = project.editorType || "LD", tags = project.tags || [];
  if (!["LD", "ST", "FBD"].includes(mode)) throw new Error("PLCopen export supports Ladder Diagram, Structured Text, and FBD programs in the supported subset.");
  const rungs = mode === "LD" ? supportedRungs(project) : [];
  const stBody = mode === "ST" ? checkedStSource(project.stSource, tags) : null;
  const variables = tags.map((tag) => {
    const type = String(tag.type || "BOOL").toUpperCase();
    if (!TYPES.has(type)) throw new Error(`Tag ${tag.name} has unsupported PLCopen data type ${type}.`);
    const initial = project.initialState?.[tag.name], initialValue = type === "BOOL" ? String(initial).toUpperCase() : type === "TIME" ? `T#${initial}ms` : initial;
    const init = initial === undefined ? "" : `<initialValue><simpleValue value="${esc(initialValue)}"/></initialValue>`;
    const documentationItems = [...(tag.alias ? [`AdigunSPs alias: ${tag.alias}`] : []), ...(tag.label ? [`AdigunSPs label: ${tag.label}`] : [])];
    const documentation = documentationItems.length ? `<documentation>${documentationItems.map((item) => `<xhtml:p>${esc(item)}</xhtml:p>`).join("")}</documentation>` : "";
    return `<variable name="${esc(tag.name)}"${tag.address ? ` address="${esc(toPlcAddress(tag.address))}"` : ""}><type><${type}/></type>${init}${documentation}</variable>`;
  });
  const isInput = (tag) => tag.role === "input" || /^I\b/i.test(tag.address || "") || (project.io?.inputs || []).includes(tag.name);
  const isOutput = (tag) => tag.role === "output" || /^Q\b/i.test(tag.address || "") || (project.io?.outputs || []).includes(tag.name);
  const groups = { inputVars:[], outputVars:[], localVars:[] };
  tags.forEach((tag, index) => groups[isInput(tag) ? "inputVars" : isOutput(tag) ? "outputVars" : "localVars"].push(variables[index]));
  const timerTags = rungs.filter((rung) => rung.timer).map((rung) => rung.timer.tag);
  const reserved = new Set(tags.map(({ name }) => name.toUpperCase()));
  for (const tag of timerTags) {
    if (reserved.has(tag.toUpperCase())) throw new Error("PLCopen export requires each TON instance name to be unique and undeclared as a project tag.");
    reserved.add(tag.toUpperCase());
  }
  const timerInstances = new Map();
  let nextTimerId = 1;
  for (const tag of timerTags) {
    let instance = tag;
    if (LADDER_TIMER_ADDRESS.test(tag)) {
      do { instance = `AdigunTimer_${nextTimerId++}`; } while (reserved.has(instance.toUpperCase()));
      reserved.add(instance.toUpperCase());
    }
    const note = instance === tag ? "" : `<documentation><xhtml:p>${TIMER_TAG_NOTE}${esc(tag)}</xhtml:p></documentation>`;
    groups.localVars.push(`<variable name="${esc(instance)}"><type><derived name="TON"/></type>${note}</variable>`);
    timerInstances.set(tag, instance);
  }
  let id = 1, y = 0;
  const ladderBody = rungs.map((rung) => {
    const rail = id++, nodes = [], tails = [], paths = rung.branches;
    const rungHeight = Math.max(96, 56 + Math.max(0, paths.length - 1) * 32);
    let maxContacts = 0;
    paths.forEach((path, branchIndex) => {
      const branchY = y + 32 + branchIndex * 32;
      let previous = rail;
      maxContacts = Math.max(maxContacts, path.length);
      path.forEach((contact, contactIndex) => {
        const localId = id++;
        const contactAttrs = contact.mode === "NC" ? ' negated="true"' : contact.mode === "R_TRIG" ? ' edge="rising"' : contact.mode === "F_TRIG" ? ' edge="falling"' : "";
        nodes.push(`<contact localId="${localId}" width="16" height="2"${contactAttrs}><position x="${64 + contactIndex * 80}" y="${branchY}"/><connectionPointIn><relPosition x="0" y="1"/><connection refLocalId="${previous}"/></connectionPointIn><connectionPointOut><relPosition x="16" y="1"/></connectionPointOut><variable>${esc(contact.tag)}</variable></contact>`);
        previous = localId;
      });
      tails.push(previous);
    });
    let coilSource, timerId = null;
    const coilId = id++;
    if (rung.timer) {
      timerId = id++; const preset = Math.trunc(Number(rung.timer.preset)), timerWidth = 48, timerX = 64 + maxContacts * 80;
      nodes.push(`<block localId="${timerId}" width="${timerWidth}" height="48" typeName="TON" instanceName="${esc(timerInstances.get(rung.timer.tag))}"><position x="${timerX}" y="${y + 24}"/><inputVariables><variable formalParameter="IN"><connectionPointIn><relPosition x="0" y="12"/>${tails.map((tail) => `<connection refLocalId="${tail}"/>`).join("")}</connectionPointIn></variable><variable formalParameter="PT"><connectionPointIn><relPosition x="0" y="36"/><expression>T#${preset}ms</expression></connectionPointIn></variable></inputVariables><inOutVariables/><outputVariables><variable formalParameter="Q"><connectionPointOut><relPosition x="${timerWidth}" y="12"/></connectionPointOut></variable></outputVariables></block>`);
      coilSource = rung.timer.output === "DN" ? [timerId] : tails;
    } else coilSource = tails;
    const storage = rung.coilMode === "set" || rung.coilMode === "reset" ? ` storage="${rung.coilMode}"` : "";
    const coilX = 64 + maxContacts * 80 + (rung.timer ? 80 : 0);
    nodes.push(`<coil localId="${coilId}" width="16" height="2"${storage}><position x="${coilX}" y="${y + 32 + (paths.length - 1) * 16}"/><connectionPointIn><relPosition x="0" y="1"/>${coilSource.map((source) => `<connection refLocalId="${source}"${source === timerId ? ' formalParameter="Q"' : ""}/>`).join("")}</connectionPointIn><variable>${esc(rung.coil)}</variable></coil>`);
    nodes.unshift(`<leftPowerRail localId="${rail}" width="4" height="${Math.max(8, (paths.length - 1) * 2 + 8)}"><position x="32" y="${y + 24}"/><connectionPointOut formalParameter="rail"><relPosition x="4" y="4"/></connectionPointOut></leftPowerRail>`);
    if (rung.comment) nodes.push(`<comment localId="${id++}" width="240" height="16"><position x="32" y="${y + (paths.length - 1) * 16}"/><content><xhtml:p>${esc(rung.comment)}</xhtml:p></content></comment>`);
    y += rungHeight;
    return nodes.join("");
  }).join("");
  const body = mode === "ST" ? `<ST><xhtml:pre>${esc(stBody)}</xhtml:pre></ST>` :
    mode === "FBD" ? createFbdBody(project) : `<LD>${ladderBody}</LD>`;
  const vars = Object.entries(groups).map(([name, items]) => items.length ? `<${name}>${items.join("")}</${name}>` : "").join("");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="${NS}" xmlns:xhtml="${XHTML}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${NS} ${NS}"><fileHeader companyName="HEPHZIBAH BEHULAH" productName="AdigunSPs" productVersion="0.1" creationDateTime="${now}"/><contentHeader name="${esc(project.name || "AdigunSPs project")}"><coordinateInfo><fbd><scaling x="16" y="16"/></fbd><ld><scaling x="16" y="16"/></ld><sfc><scaling x="16" y="16"/></sfc></coordinateInfo></contentHeader><types><dataTypes/><pous><pou name="Main" pouType="program"><interface>${vars}</interface><body>${body}</body></pou></pous></types><instances>${createTaskConfiguration(project.task)}</instances></project>`;
}

function toPlcAddress(address) {
  return String(address).replace(/^([IQM])(\d)/i, (_, area, rest) => `%${area.toUpperCase()}X${rest}`);
}
function fromPlcAddress(address) {
  return String(address || "").replace(/^%([IQM])X/i, (_, area) => `${area.toUpperCase()}`);
}
function descendants(node, name) { return [...(node?.getElementsByTagName?.("*") || [])].filter((item) => item.localName === name); }
function connectionNodes(node) { return children(node, "connectionPointIn").flatMap((point) => children(point, "connection")); }
function connectionRefs(node) {
  const connections = connectionNodes(node);
  if (!connections.length) throw new Error("PLCopen LD element has no incoming connection.");
  return connections.map((connection) => connection.getAttribute("refLocalId"));
}
function checkFbdModifiers(node) {
  if (xmlBoolean(node.getAttribute("negated"), "FBD negated") || xmlBoolean(node.getAttribute("hidden"), "FBD hidden") ||
      (node.getAttribute("edge") || "none") !== "none" || (node.getAttribute("storage") || "none") !== "none") {
    throw new Error("PLCopen FBD pin and variable modifiers are outside the supported subset.");
  }
}

function readFbdSource(node, nodes) {
  const points = children(node, "connectionPointIn"), connections = connectionNodes(node);
  if (points.length !== 1 || connections.length !== 1 || child(points[0], "expression")) {
    throw new Error("PLCopen FBD supports exactly one direct connection per input.");
  }
  const connection = connections[0], id = connection.getAttribute("refLocalId"), source = nodes.get(id);
  const pin = connection.getAttribute("formalParameter");
  if (!source || (source.localName === "block" ? pin !== null && pin !== "OUT" : pin !== null)) {
    throw new Error("PLCopen FBD source must reference a variable or the OUT pin of a supported block.");
  }
  return source;
}

function readFbdBody(body, imported) {
  const nodes = new Map();
  for (const node of body.children) {
    const id = node.getAttribute("localId");
    if (!["block", "inVariable", "outVariable"].includes(node.localName) || !id || nodes.has(id)) {
      throw new Error("PLCopen FBD supports uniquely identified supported blocks and input/output variables only.");
    }
    checkFbdModifiers(node);
    nodes.set(id, node);
  }
  const outputs = new Map();
  for (const node of nodes.values()) {
    if (node.localName !== "outVariable") continue;
    const source = readFbdSource(node, nodes), tag = text(child(node, "expression"));
    if (source.localName !== "block" || outputs.has(source) || !tag) {
      throw new Error("PLCopen FBD allows at most one declared output variable per block.");
    }
    outputs.set(source, tag);
  }
  const usedNames = new Set([...imported.tags.map(({ name }) => name), ...outputs.values()].map((name) => name.toUpperCase()));
  const wireOutputs = new Set(), usedSources = new Set();
  let wireNumber = 1;
  for (const node of nodes.values()) {
    if (node.localName !== "block" || outputs.has(node)) continue;
    let name;
    do { name = `FbdWire_${wireNumber++}`; } while (usedNames.has(name.toUpperCase()));
    usedNames.add(name.toUpperCase());
    imported.tags.push({ name, type:"BOOL" });
    outputs.set(node, name);
    wireOutputs.add(node);
  }
  const writtenTags = new Set(outputs.values()), usedInputs = new Set(), blocks = [];
  for (const [id, node] of nodes) {
    if (node.localName !== "block") continue;
    const type = node.getAttribute("typeName");
    const pins = children(child(node, "inputVariables"), "variable");
    const expectedPins = fbdPins(type, pins.length);
    const pinNames = new Map(pins.map((pin) => [pin.getAttribute("formalParameter"), pin]));
    const output = children(child(node, "outputVariables"), "variable");
    if (node.getAttribute("instanceName") || children(child(node, "inOutVariables"), "variable").length ||
        output.length !== 1 || output[0].getAttribute("formalParameter") !== "OUT" ||
        expectedPins.some((pin) => !pinNames.has(pin))) {
      throw new Error("PLCopen FBD block pins or output assignment are outside the supported subset.");
    }
    checkFbdModifiers(output[0]);
    const inputs = expectedPins.map((name) => {
      const pin = pinNames.get(name);
      checkFbdModifiers(pin);
      const source = readFbdSource(pin, nodes);
      if (source.localName === "block") {
        usedSources.add(source);
        return outputs.get(source);
      }
      if (source.localName === "inVariable") {
        const tag = text(child(source, "expression"));
        if (!writtenTags.has(tag)) { usedInputs.add(source); return tag; }
      }
      throw new Error("PLCopen FBD inputs must use direct block connections or external declared tags.");
    });
    const position = child(node, "position");
    const x = Number(position?.getAttribute("x")), y = Number(position?.getAttribute("y"));
    const layout = Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
    blocks.push({ id:`plcopen-block-${id}`, type, inputs, outputTag:outputs.get(node), ...(layout ? { layout } : {}) });
  }
  if ([...wireOutputs].some((node) => !usedSources.has(node))) {
    throw new Error("PLCopen FBD block outputs must connect to a variable or another block.");
  }
  if ([...nodes.values()].some((node) => node.localName === "inVariable" && !usedInputs.has(node))) {
    throw new Error("PLCopen FBD contains an input variable outside the imported networks.");
  }
  return checkedFbdBlocks({ ...imported, fbdBlocks:blocks });
}
function readTonBlock(block) {
  const inputs = children(child(block, "inputVariables"), "variable");
  const outputs = children(child(block, "outputVariables"), "variable");
  const inPin = inputs.find((pin) => pin.getAttribute("formalParameter") === "IN");
  const ptPin = inputs.find((pin) => pin.getAttribute("formalParameter") === "PT");
  if (inputs.length !== 2 || !inPin || !ptPin || children(child(block, "inOutVariables"), "variable").length ||
      outputs.length !== 1 || outputs[0].getAttribute("formalParameter") !== "Q") {
    throw new Error("PLCopen TON import supports only IN/PT inputs and the Q output.");
  }
  const ptPoints = children(ptPin, "connectionPointIn");
  const ptPoint = ptPoints[0];
  const expressions = children(ptPoint, "expression");
  const presetMatch = /^(?:T|TIME)#(\d+)ms$/i.exec(text(expressions[0]));
  const preset = Number(presetMatch?.[1]);
  if (ptPoints.length !== 1 || expressions.length !== 1 || children(ptPoint, "connection").length ||
      !Number.isSafeInteger(preset) || preset <= 0) {
    throw new Error("PLCopen TON preset must be a positive integer-millisecond literal.");
  }
  return { tag:block.getAttribute("instanceName"), type:"TON", preset, refs:connectionRefs(inPin) };
}

function contactPathKey(refs) {
  return JSON.stringify([...refs].sort());
}
function xmlBoolean(value, attribute) {
  if (value === null || value === undefined || value === "false" || value === "0") return false;
  if (value === "true" || value === "1") return true;
  throw new Error(`PLCopen ${attribute} attribute must be a valid XML boolean.`);
}

function readTaskConfiguration(root, pou) {
  const meaningfulChildren = (node) => [...(node?.children || [])].filter((item) => item.localName !== "documentation");
  const instanceSections = children(root, "instances");
  if (instanceSections.length > 1) throw new Error("PLCopen import supports one instances section.");
  const instances = meaningfulChildren(instanceSections[0]);
  const configurations = meaningfulChildren(instances[0]);
  if (!instances.length || (instances.length === 1 && instances[0].localName === "configurations" && !configurations.length)) {
    return { name:"Main", mode:"cyclic", cycleMs:100 };
  }
  const resources = meaningfulChildren(configurations[0]);
  const tasks = meaningfulChildren(resources[0]);
  const [task] = tasks;
  const programs = meaningfulChildren(task), typeName = pou.getAttribute("name");
  if (instances.length !== 1 || instances[0].localName !== "configurations" ||
      configurations.length !== 1 || configurations[0].localName !== "configuration" ||
      resources.length !== 1 || resources[0].localName !== "resource" ||
      tasks.length !== 1 || task.localName !== "task" ||
      programs.length !== 1 || programs[0].localName !== "pouInstance" ||
      !typeName || programs[0].getAttribute("typeName")?.toUpperCase() !== typeName.toUpperCase() || meaningfulChildren(programs[0]).length) {
    throw new Error("PLCopen import supports one cyclic task assigned to the imported program.");
  }
  const name = task.getAttribute("name")?.trim();
  const interval = /^(?:T|TIME)#(?:(\d+)m)?(?:(\d+)s)?(?:(\d+)ms)?$/i.exec(task.getAttribute("interval") || "");
  const cycleMs = interval ? Number(interval[1] || 0) * 60000 + Number(interval[2] || 0) * 1000 + Number(interval[3] || 0) : NaN;
  if (!name || task.hasAttribute("single") || !Number.isInteger(cycleMs) || cycleMs < 1 || cycleMs > 60000) {
    throw new Error("PLCopen import requires a named cyclic task with a period of 1–60000 whole milliseconds.");
  }
  return { name, mode:"cyclic", cycleMs };
}

export function parsePlcopenXml(xml, DOMParserImpl = globalThis.DOMParser) {
  if (typeof xml !== "string" || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Invalid or unsafe PLCopen XML document.");
  if (!DOMParserImpl) throw new Error("XML import is unavailable in this browser.");
  const document = new DOMParserImpl().parseFromString(xml, "application/xml"), root = document.documentElement;
  if (root?.localName !== "project" || !/^http:\/\/www\.plcopen\.org\/xml\/tc6_020[01]$/.test(root.namespaceURI || "") || descendants(document, "parsererror").length) throw new Error("This is not a supported PLCopen TC6 project XML document.");
  const pous = descendants(root, "pou");
  if (pous.length > 1) throw new Error("PLCopen import supports one program POU. This file contains multiple POUs.");
  const pou = pous.find((node) => node.getAttribute("pouType") === "program");
  const bodies = children(pou, "body");
  const ld = child(bodies[0], "LD"), st = child(bodies[0], "ST"), fbd = child(bodies[0], "FBD");
  const languages = [...(bodies[0]?.children || [])].filter((node) => ["LD", "ST", "FBD", "SFC", "IL"].includes(node.localName));
  if (bodies.length !== 1 || languages.length !== 1 || !(ld || st || fbd)) throw new Error("PLCopen import needs one program POU with a Ladder Diagram, Structured Text, or supported FBD body.");
  const names = new Set(["leftPowerRail", "rightPowerRail", "contact", "coil", "block", "comment"]);
  const nodes = [...(ld?.children || [])].filter((node) => node.localName !== "position");
  if (nodes.some((node) => !names.has(node.localName))) throw new Error("PLCopen import found LD instructions outside the supported contact and coil subset.");
  const identified = nodes.filter((node) => node.hasAttribute("localId"));
  const byId = new Map(identified.map((node) => [node.getAttribute("localId"), node]));
  if (byId.size !== identified.length) throw new Error("PLCopen LD localIds must be unique.");
  const blocks = nodes.filter((node) => node.localName === "block"), timerInstances = new Map();
  for (const block of blocks) {
    const name = block.getAttribute("instanceName");
    if (!block.getAttribute("localId") || block.getAttribute("typeName") !== "TON" || !name || !IEC_IDENTIFIER.test(name) || timerInstances.has(name)) throw new Error("PLCopen import supports uniquely identified and named TON blocks only.");
    timerInstances.set(name, block);
  }
  const variableNodes = descendants(child(pou, "interface"), "variable"), tags = [], initialState = {};
  const declarations = new Map(), timerDeclarations = new Map();
  for (const variable of variableNodes) {
    const name = variable.getAttribute("name"), typeContainer = child(variable, "type"), typeNode = child(typeContainer, "BOOL") || child(typeContainer, "INT") || child(typeContainer, "REAL") || child(typeContainer, "TIME"), derived = child(typeContainer, "derived");
    const type = typeNode?.localName;
    if (!type && name && derived?.getAttribute("name") === "TON" && timerInstances.has(name) && variable.parentElement?.localName === "localVars") {
      const notes = descendants(child(variable, "documentation"), "p").map(text).filter((line) => line.startsWith(TIMER_TAG_NOTE));
      const restoredTag = notes[0]?.slice(TIMER_TAG_NOTE.length);
      if (timerDeclarations.has(name) || notes.length > 1 || (notes.length && !LADDER_TIMER_ADDRESS.test(restoredTag))) {
        throw new Error("PLCopen TON declaration has duplicate or invalid timer tag information.");
      }
      timerDeclarations.set(name, restoredTag || name);
      continue;
    }
    if (!name || !type || !TYPES.has(type)) throw new Error(`PLCopen tag ${name || "(unnamed)"} uses an unsupported data type.`);
    const address = fromPlcAddress(variable.getAttribute("address")), section = variable.parentElement?.localName;
    const tag = { name, type, ...(address ? { address } : {}), ...(section === "inputVars" ? { role:"input" } : section === "outputVars" ? { role:"output" } : {}) }, docs = descendants(child(variable, "documentation"), "p").map(text);
    const alias = docs.find((item) => item.startsWith("AdigunSPs alias: "))?.slice(17), label = docs.find((item) => item.startsWith("AdigunSPs label: "))?.slice(17), otherDocs = docs.filter((item) => !item.startsWith("AdigunSPs alias: ") && !item.startsWith("AdigunSPs label: "));
    if (alias) tag.alias = alias; if (label || otherDocs.length) tag.label = [label, ...otherDocs].filter(Boolean).join("\n");
    tags.push(tag); declarations.set(name, tag);
    const value = child(child(variable, "initialValue"), "simpleValue")?.getAttribute("value");
    if (value !== null && value !== undefined) initialState[name] = type === "BOOL" ? value.toUpperCase() === "TRUE" : type === "TIME" ? Number.parseFloat(value.replace(/^T#/, "")) || 0 : Number(value);
  }
  const occupiedNames = new Set(tags.map(({ name }) => name.toUpperCase()));
  for (const [instance, tag] of timerDeclarations) {
    if (occupiedNames.has(instance.toUpperCase()) || occupiedNames.has(tag.toUpperCase())) throw new Error("PLCopen TON instance and tag names must be unique.");
    occupiedNames.add(instance.toUpperCase());
    occupiedNames.add(tag.toUpperCase());
  }
  if (timerInstances.size !== timerDeclarations.size || [...timerInstances.keys()].some((name) => !timerDeclarations.has(name))) throw new Error("PLCopen TON blocks need matching local instance declarations.");
  const inputs = tags.filter((tag) => tag.role === "input" || /^I\d/i.test(tag.address || "")).map((tag) => tag.name);
  const outputs = tags.filter((tag) => tag.role === "output" || /^Q\d/i.test(tag.address || "")).map((tag) => tag.name);
  const name = child(root, "contentHeader")?.getAttribute("name") || "Imported PLCopen project";
  const imported = { id:"", name, language:"en", task:readTaskConfiguration(root, pou), tags, io:{ inputs, outputs }, initialState };
  if (st) return { ...imported, editorType:"ST", stSource:readStSource(st, tags), rungs:[] };
  if (fbd) return { ...imported, editorType:"FBD", fbdBlocks:readFbdBody(fbd, imported), rungs:[] };
  const commentByY = new Map(nodes.filter((node) => node.localName === "comment").map((node) => [child(node, "position")?.getAttribute("y"), text(child(node, "content"))]));
  const coils = nodes.filter((node) => node.localName === "coil");
  const timers = new Map(blocks.map((block) => [block.getAttribute("localId"), readTonBlock(block)]));
  const coilSources = new Set(coils.flatMap(connectionRefs));
  const enabledTimersByPath = new Map();
  for (const [id, timer] of timers) {
    if (coilSources.has(id)) continue;
    const key = contactPathKey(timer.refs);
    if (enabledTimersByPath.has(key)) throw new Error("PLCopen LD has multiple TON blocks on the same enabled coil paths.");
    enabledTimersByPath.set(key, id);
  }
  const used = new Set(), usedBlocks = new Set(), rungs = coils.map((coil, index) => {
    const coilStorage = coil.getAttribute("storage") || "none";
    if (xmlBoolean(coil.getAttribute("negated"), "coil negated") || (coil.getAttribute("edge") || "none") !== "none" || !["none", "set", "reset"].includes(coilStorage)) throw new Error("PLCopen import supports normal, set, and reset coils only.");
    const coilConnections = connectionNodes(coil);
    const singleSource = coilConnections.length === 1 ? coilConnections[0].getAttribute("refLocalId") : null;
    let output = "EN", branchRefs = connectionRefs(coil), timerId = enabledTimersByPath.get(contactPathKey(branchRefs));
    if (timers.has(singleSource)) {
      const outputPin = coilConnections[0].getAttribute("formalParameter");
      if (outputPin !== null && outputPin !== "Q") throw new Error("PLCopen TON coil input must connect to its declared Q output.");
      timerId = singleSource;
      branchRefs = timers.get(timerId).refs;
      output = "DN";
    }
    let timer;
    if (timerId !== undefined) {
      if (usedBlocks.has(timerId)) throw new Error("PLCopen TON block belongs to more than one coil network.");
      const { tag, type, preset } = timers.get(timerId);
      timer = { tag:timerDeclarations.get(tag), type, preset, output };
      usedBlocks.add(timerId);
    }
    const branches = branchRefs.map((startRef) => {
      const chain = [], visited = new Set(); let ref = startRef;
      while (true) {
        if (visited.has(ref)) throw new Error("PLCopen LD contains a cyclic connection.");
        visited.add(ref);
        const source = byId.get(ref);
        if (!source) throw new Error("PLCopen LD references an unknown localId.");
        if (source.localName === "leftPowerRail") break;
        if (source.localName !== "contact") throw new Error("PLCopen LD has a connection outside the supported series or parallel contact paths.");
        const edge = source.getAttribute("edge") || "none", storage = source.getAttribute("storage") || "none", negated = xmlBoolean(source.getAttribute("negated"), "contact negated");
        if (!["none", "rising", "falling"].includes(edge) || storage !== "none" || (edge !== "none" && negated)) throw new Error("PLCopen import supports standard NO/NC contacts and non-negated rising/falling edge contacts only.");
        const tag = text(child(source, "variable")) || source.getAttribute("name");
        if (!declarations.has(tag)) throw new Error(`PLCopen contact references undeclared tag ${tag || "(unnamed)"}.`);
        chain.push({ tag, mode:edge === "rising" ? "R_TRIG" : edge === "falling" ? "F_TRIG" : negated ? "NC" : "NO" });
        const refs = connectionRefs(source);
        if (refs.length !== 1) throw new Error("PLCopen import supports parallel series paths that merge at a coil; nested or converging branches are not imported.");
        ref = refs[0];
      }
      return { contacts:chain.reverse(), ids:[...visited].filter((id) => byId.get(id)?.localName === "contact") };
    });
    const coilTag = text(child(coil, "variable")) || coil.getAttribute("name");
    if (!declarations.has(coilTag)) throw new Error(`PLCopen coil references undeclared tag ${coilTag || "(unnamed)"}.`);
    const ids = branches.flatMap((branch) => branch.ids);
    if (new Set(ids).size !== ids.length || ids.some((id) => used.has(id))) throw new Error("PLCopen LD contact paths are shared; only independent series networks can be imported.");
    ids.forEach((id) => used.add(id));
    const coilY = Number(child(coil, "position")?.getAttribute("y")), comment = commentByY.get(String(coilY - 32));
    return { id:`plcopen-rung-${index + 1}`, comment:comment || `Network ${index + 1}`, branches:branches.map((branch) => branch.contacts), ...(timer ? { timer } : {}), coil:coilTag, ...(coilStorage === "none" ? {} : { coilMode:coilStorage }) };
  });
  if (!rungs.length) throw new Error("PLCopen LD contains no output coils to import.");
  if (nodes.filter((node) => node.localName === "contact").some((node) => !used.has(node.getAttribute("localId")))) throw new Error("PLCopen LD contains contacts outside imported coil networks.");
  if (blocks.some((block) => !usedBlocks.has(block.getAttribute("localId")))) throw new Error("PLCopen LD contains TON blocks outside imported coil networks.");
  return { ...imported, editorType:"LD", rungs };
}
