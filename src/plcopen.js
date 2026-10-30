const NS = "http://www.plcopen.org/xml/tc6_0200";
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
    if (paths.length !== 1 || !rung.coil || rung.timer || rung.counter || rung.scale || (rung.coilMode && rung.coilMode !== "normal") || paths[0].some((contact) => !["NO", "NC"].includes(contact.mode))) {
      throw new Error(`Network ${index + 1} uses branches or instructions outside the supported PLCopen LD subset.`);
    }
    if (!declared.has(rung.coil) || paths[0].some((contact) => !declared.has(contact.tag))) throw new Error(`Network ${index + 1} references an undeclared tag.`);
    return { ...rung, contacts:paths[0] };
  });
}

export function createPlcopenXml(project) {
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
  let id = 1;
  const body = rungs.map((rung, rungIndex) => {
    const rail = id++, y = rungIndex * 96, nodes = [];
    let previous = rail;
    rung.contacts.forEach((contact, contactIndex) => {
      const localId = id++;
      nodes.push(`<contact localId="${localId}" width="16" height="2"${contact.mode === "NC" ? ' negated="true"' : ""}><position x="${64 + contactIndex * 80}" y="${y + 32}"/><connectionPointIn><relPosition x="0" y="1"/><connection refLocalId="${previous}"/></connectionPointIn><connectionPointOut><relPosition x="16" y="1"/></connectionPointOut><variable>${esc(contact.tag)}</variable></contact>`);
      previous = localId;
    });
    const coilId = id++;
    nodes.push(`<coil localId="${coilId}" width="16" height="2"><position x="${64 + rung.contacts.length * 80}" y="${y + 32}"/><connectionPointIn><relPosition x="0" y="1"/><connection refLocalId="${previous}"/></connectionPointIn><variable>${esc(rung.coil)}</variable></coil>`);
    nodes.unshift(`<leftPowerRail localId="${rail}" width="4" height="8"><position x="32" y="${y + 24}"/><connectionPointOut><relPosition x="4" y="4"/></connectionPointOut></leftPowerRail>`);
    if (rung.comment) nodes.push(`<comment localId="${id++}"><position x="32" y="${y}"/><content><xhtml:p>${esc(rung.comment)}</xhtml:p></content></comment>`);
    return nodes.join("");
  }).join("");
  const vars = Object.entries(groups).map(([name, items]) => items.length ? `<${name}>${items.join("")}</${name}>` : "").join("");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<project xmlns="${NS}" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${NS} ${NS}"><fileHeader companyName="HEPHZIBAH BEHULAH" productName="AdigunSPs" productVersion="0.1" creationDateTime="${now}"/><contentHeader name="${esc(project.name || "AdigunSPs project")}"><coordinateInfo><ld><scaling x="16" y="16"/></ld></coordinateInfo></contentHeader><types><dataTypes/><pous><pou name="Main" pouType="program"><interface>${vars}</interface><body><LD>${body}</LD></body></pou></pous></types><instances><configurations/></instances></project>`;
}

function toPlcAddress(address) {
  return String(address).replace(/^([IQM])(\d)/i, (_, area, rest) => `%${area.toUpperCase()}X${rest}`);
}
function fromPlcAddress(address) {
  return String(address || "").replace(/^%([IQM])X/i, (_, area) => `${area.toUpperCase()}`);
}
function descendants(node, name) { return [...(node?.getElementsByTagName?.("*") || [])].filter((item) => item.localName === name); }
function uniqueConnection(node) {
  const points = children(node, "connectionPointIn"), connections = points.flatMap((point) => children(point, "connection"));
  if (connections.length !== 1) throw new Error("PLCopen import supports one series connection per LD element; branches are not imported.");
  return connections[0].getAttribute("refLocalId");
}

export function parsePlcopenXml(xml, DOMParserImpl = globalThis.DOMParser) {
  if (typeof xml !== "string" || /<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Invalid or unsafe PLCopen XML document.");
  if (!DOMParserImpl) throw new Error("XML import is unavailable in this browser.");
  const document = new DOMParserImpl().parseFromString(xml, "application/xml"), root = document.documentElement;
  if (root?.localName !== "project" || !/^http:\/\/www\.plcopen\.org\/xml\/tc6_020[01]$/.test(root.namespaceURI || "") || descendants(document, "parsererror").length) throw new Error("This is not a supported PLCopen TC6 project XML document.");
  const pou = descendants(root, "pou").find((node) => node.getAttribute("pouType") === "program" && child(child(node, "body"), "LD"));
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
    if (coil.getAttribute("negated") === "true" || coil.hasAttribute("edge") || coil.hasAttribute("storage")) throw new Error("PLCopen import supports normal coils only.");
    const chain = [], visited = new Set(); let ref = uniqueConnection(coil);
    while (true) {
      if (visited.has(ref)) throw new Error("PLCopen LD contains a cyclic connection.");
      visited.add(ref);
      const source = byId.get(ref);
      if (!source) throw new Error("PLCopen LD references an unknown localId.");
      if (source.localName === "leftPowerRail") break;
      if (source.localName !== "contact") throw new Error("PLCopen LD has a connection outside the supported series contact path.");
      if (source.hasAttribute("edge") || source.hasAttribute("storage")) throw new Error("PLCopen import supports standard NO and NC contacts only.");
      const tag = text(child(source, "variable")) || source.getAttribute("name");
      if (!declarations.has(tag)) throw new Error(`PLCopen contact references undeclared tag ${tag || "(unnamed)"}.`);
      chain.push({ tag, mode:source.getAttribute("negated") === "true" ? "NC" : "NO" });
      ref = uniqueConnection(source);
    }
    const coilTag = text(child(coil, "variable")) || coil.getAttribute("name");
    if (!declarations.has(coilTag)) throw new Error(`PLCopen coil references undeclared tag ${coilTag || "(unnamed)"}.`);
    const ids = [...visited];
    if (ids.some((id) => used.has(id))) throw new Error("PLCopen LD contact paths are shared; only independent series networks can be imported.");
    ids.forEach((id) => used.add(id));
    chain.reverse();
    const coilY = Number(child(coil, "position")?.getAttribute("y")), comment = commentByY.get(String(coilY - 32));
    return { id:`plcopen-rung-${index + 1}`, comment:comment || `Network ${index + 1}`, branches:[chain], coil:coilTag };
  });
  if (!rungs.length) throw new Error("PLCopen LD contains no output coils to import.");
  if (nodes.filter((node) => node.localName === "contact").some((node) => !used.has(node.getAttribute("localId")))) throw new Error("PLCopen LD contains contacts outside imported coil networks.");
  const inputs = tags.filter((tag) => tag.role === "input" || /^I\d/i.test(tag.address || "")).map((tag) => tag.name), outputs = tags.filter((tag) => tag.role === "output" || /^Q\d/i.test(tag.address || "")).map((tag) => tag.name);
  const name = child(root, "contentHeader")?.getAttribute("name") || "Imported PLCopen project";
  return { id:"", name, language:"en", editorType:"LD", task:{ name:"Main", mode:"cyclic", cycleMs:100 }, tags, io:{ inputs, outputs }, initialState, rungs };
}
