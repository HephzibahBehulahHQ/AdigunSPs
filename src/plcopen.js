const NS = "http://www.plcopen.org/xml/tc6_0201";
const TYPES = new Set(["BOOL", "INT", "REAL", "TIME"]);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
const children = (node, name) => [...(node?.children || [])].filter((child) => child.localName === name);
const child = (node, name) => children(node, name)[0] || null;
const text = (node) => node?.textContent?.trim() || "";

function supportedRungs(project) {
  if ((project.editorType || "LD") !== "LD") throw new Error("PLCopen export currently supports Ladder Diagram projects only.");
  if (!Array.isArray(project.rungs) || !project.rungs.length) throw new Error("Add at least one ladder network before exporting PLCopen XML.");
  const declared = new Set((project.tags || []).map((tag) => tag.name));
  return project.rungs.map((rung, index) => {
    const paths = rung.branches?.length ? rung.branches : [rung.contacts || []];
    const timer = rung.timer;
    const supportedTimer = !timer || ((timer.type || "TON") === "TON" && Number.isInteger(Number(timer.preset)) && Number(timer.preset) > 0 && !timer.resetTag && (timer.output === undefined || timer.output === "DN" || timer.output === "EN") && /^[A-Za-z_][A-Za-z0-9_]*$/.test(timer.tag || ""));
    if (!Array.isArray(paths) || paths.some((path) => !Array.isArray(path)) || !rung.coil || !supportedTimer || rung.counter || rung.scale || ![undefined, "normal", "set", "reset"].includes(rung.coilMode) || paths.flat().some((contact) => !["NO", "NC", "R_TRIG", "F_TRIG"].includes(contact.mode))) {
      throw new Error(`Network ${index + 1} uses instructions outside the supported PLCopen LD subset.`);
    }
    if (!declared.has(rung.coil) || paths.flat().some((contact) => !declared.has(contact.tag))) throw new Error(`Network ${index + 1} references an undeclared tag.`);
    return { ...rung, branches:paths };
  });
}

export function createPlcopenXml(project) {
  if (project.programUnits?.length || project.tasks?.length) {
    throw new Error("PLCopen XML export supports a single ladder body. Use project JSON to preserve program units and task assignments.");
  }
  const rungs = supportedRungs(project), tags = project.tags || [];
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
  const timerInstances = [...new Set(rungs.filter((rung) => rung.timer).map((rung) => rung.timer.tag))];
  if (timerInstances.some((name) => tags.some((tag) => tag.name === name)) || rungs.filter((rung) => rung.timer).length !== timerInstances.length) throw new Error("PLCopen export requires each TON instance name to be unique and undeclared as a project tag.");
  groups.localVars.push(...timerInstances.map((name) => `<variable name="${esc(name)}"><type><derived name="TON"/></type></variable>`));
  let id = 1, y = 0;
  const body = rungs.map((rung) => {
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
      nodes.push(`<block localId="${timerId}" width="${timerWidth}" height="48" typeName="TON" instanceName="${esc(rung.timer.tag)}"><position x="${timerX}" y="${y + 24}"/><inputVariables><variable formalParameter="IN"><connectionPointIn><relPosition x="0" y="12"/>${tails.map((tail) => `<connection refLocalId="${tail}"/>`).join("")}</connectionPointIn></variable><variable formalParameter="PT"><connectionPointIn><relPosition x="0" y="36"/><expression>T#${preset}ms</expression></connectionPointIn></variable></inputVariables><inOutVariables/><outputVariables><variable formalParameter="Q"><connectionPointOut><relPosition x="${timerWidth}" y="12"/></connectionPointOut></variable></outputVariables></block>`);
      coilSource = rung.timer.output === "DN" ? [timerId] : tails;
    } else coilSource = tails;
    const storage = rung.coilMode === "set" || rung.coilMode === "reset" ? ` storage="${rung.coilMode}"` : "";
    const coilX = 64 + maxContacts * 80 + (rung.timer ? 80 : 0);
    nodes.push(`<coil localId="${coilId}" width="16" height="2"${storage}><position x="${coilX}" y="${y + 32 + (paths.length - 1) * 16}"/><connectionPointIn><relPosition x="0" y="1"/>${coilSource.map((source) => `<connection refLocalId="${source}"/>`).join("")}</connectionPointIn><variable>${esc(rung.coil)}</variable></coil>`);
    nodes.unshift(`<leftPowerRail localId="${rail}" width="4" height="${Math.max(8, (paths.length - 1) * 2 + 8)}"><position x="32" y="${y + 24}"/><connectionPointOut formalParameter="rail"><relPosition x="4" y="4"/></connectionPointOut></leftPowerRail>`);
    if (rung.comment) nodes.push(`<comment localId="${id++}" width="240" height="16"><position x="32" y="${y + (paths.length - 1) * 16}"/><content><xhtml:p>${esc(rung.comment)}</xhtml:p></content></comment>`);
    y += rungHeight;
    return nodes.join("");
  }).join("");
  const vars = Object.entries(groups).map(([name, items]) => items.length ? `<${name}>${items.join("")}</${name}>` : "").join("");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="${NS}" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${NS} ${NS}"><fileHeader companyName="HEPHZIBAH BEHULAH" productName="AdigunSPs" productVersion="0.1" creationDateTime="${now}"/><contentHeader name="${esc(project.name || "AdigunSPs project")}"><coordinateInfo><fbd><scaling x="16" y="16"/></fbd><ld><scaling x="16" y="16"/></ld><sfc><scaling x="16" y="16"/></sfc></coordinateInfo></contentHeader><types><dataTypes/><pous><pou name="Main" pouType="program"><interface>${vars}</interface><body><LD>${body}</LD></body></pou></pous></types><instances><configurations/></instances></project>`;
}

function toPlcAddress(address) {
  return String(address).replace(/^([IQM])(\d)/i, (_, area, rest) => `%${area.toUpperCase()}X${rest}`);
}
function fromPlcAddress(address) {
  return String(address || "").replace(/^%([IQM])X/i, (_, area) => `${area.toUpperCase()}`);
}
function descendants(node, name) { return [...(node?.getElementsByTagName?.("*") || [])].filter((item) => item.localName === name); }
function connectionRefs(node) {
  const points = children(node, "connectionPointIn"), connections = points.flatMap((point) => children(point, "connection"));
  if (!connections.length) throw new Error("PLCopen LD element has no incoming connection.");
  return connections.map((connection) => connection.getAttribute("refLocalId"));
}
function xmlBoolean(value, attribute) {
  if (value === null || value === undefined || value === "false" || value === "0") return false;
  if (value === "true" || value === "1") return true;
  throw new Error(`PLCopen ${attribute} attribute must be a valid XML boolean.`);
}

export function parsePlcopenXml(xml, DOMParserImpl = globalThis.DOMParser) {
  if (typeof xml !== "string" || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Invalid or unsafe PLCopen XML document.");
  if (!DOMParserImpl) throw new Error("XML import is unavailable in this browser.");
  const document = new DOMParserImpl().parseFromString(xml, "application/xml"), root = document.documentElement;
  if (root?.localName !== "project" || !/^http:\/\/www\.plcopen\.org\/xml\/tc6_020[01]$/.test(root.namespaceURI || "") || descendants(document, "parsererror").length) throw new Error("This is not a supported PLCopen TC6 project XML document.");
  const pous = descendants(root, "pou");
  if (pous.length > 1) throw new Error("PLCopen import supports one program POU. This file contains multiple POUs.");
  const pou = pous.find((node) => node.getAttribute("pouType") === "program" && child(child(node, "body"), "LD"));
  if (!pou) throw new Error("PLCopen import needs a program POU with a Ladder Diagram body.");
  const ld = child(child(pou, "body"), "LD"), names = new Set(["leftPowerRail", "rightPowerRail", "contact", "coil", "comment"]);
  const nodes = [...ld.children].filter((node) => !["position"].includes(node.localName));
  if (nodes.some((node) => !names.has(node.localName))) throw new Error("PLCopen import found LD instructions outside the supported contact and coil subset.");
  const byId = new Map(nodes.filter((node) => node.hasAttribute("localId")).map((node) => [node.getAttribute("localId"), node]));
  const variableNodes = descendants(child(pou, "interface"), "variable"), tags = [], initialState = {};
  const declarations = new Map();
  for (const variable of variableNodes) {
    const name = variable.getAttribute("name"), typeNode = child(child(variable, "type"), "BOOL") || child(child(variable, "type"), "INT") || child(child(variable, "type"), "REAL") || child(child(variable, "type"), "TIME");
    const type = typeNode?.localName;
    if (!name || !type || !TYPES.has(type)) throw new Error(`PLCopen tag ${name || "(unnamed)"} uses an unsupported data type.`);
    const address = fromPlcAddress(variable.getAttribute("address")), section = variable.parentElement?.localName;
    const tag = { name, type, ...(address ? { address } : {}), ...(section === "inputVars" ? { role:"input" } : section === "outputVars" ? { role:"output" } : {}) }, docs = descendants(child(variable, "documentation"), "p").map(text);
    const alias = docs.find((item) => item.startsWith("AdigunSPs alias: "))?.slice(17), label = docs.find((item) => item.startsWith("AdigunSPs label: "))?.slice(17), otherDocs = docs.filter((item) => !item.startsWith("AdigunSPs alias: ") && !item.startsWith("AdigunSPs label: "));
    if (alias) tag.alias = alias; if (label || otherDocs.length) tag.label = [label, ...otherDocs].filter(Boolean).join("\n");
    tags.push(tag); declarations.set(name, tag);
    const value = child(child(variable, "initialValue"), "simpleValue")?.getAttribute("value");
    if (value !== null && value !== undefined) initialState[name] = type === "BOOL" ? value.toUpperCase() === "TRUE" : type === "TIME" ? Number.parseFloat(value.replace(/^T#/, "")) || 0 : Number(value);
  }
  const commentByY = new Map(nodes.filter((node) => node.localName === "comment").map((node) => [child(node, "position")?.getAttribute("y"), text(child(node, "content"))]));
  const coils = nodes.filter((node) => node.localName === "coil"), used = new Set(), rungs = coils.map((coil, index) => {
    const coilStorage = coil.getAttribute("storage") || "none";
    if (xmlBoolean(coil.getAttribute("negated"), "coil negated") || (coil.getAttribute("edge") || "none") !== "none" || !["none", "set", "reset"].includes(coilStorage)) throw new Error("PLCopen import supports normal, set, and reset coils only.");
    const branches = connectionRefs(coil).map((startRef) => {
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
    return { id:`plcopen-rung-${index + 1}`, comment:comment || `Network ${index + 1}`, branches:branches.map((branch) => branch.contacts), coil:coilTag, ...(coilStorage === "none" ? {} : { coilMode:coilStorage }) };
  });
  if (!rungs.length) throw new Error("PLCopen LD contains no output coils to import.");
  if (nodes.filter((node) => node.localName === "contact").some((node) => !used.has(node.getAttribute("localId")))) throw new Error("PLCopen LD contains contacts outside imported coil networks.");
  const inputs = tags.filter((tag) => tag.role === "input" || /^I\d/i.test(tag.address || "")).map((tag) => tag.name), outputs = tags.filter((tag) => tag.role === "output" || /^Q\d/i.test(tag.address || "")).map((tag) => tag.name);
  const name = child(root, "contentHeader")?.getAttribute("name") || "Imported PLCopen project";
  return { id:"", name, language:"en", editorType:"LD", task:{ name:"Main", mode:"cyclic", cycleMs:100 }, tags, io:{ inputs, outputs }, initialState, rungs };
}

