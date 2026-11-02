// Keep source spans intact so comments, strings and diagnostics share one lexer.
function* sourceSpans(source) {
  let offset = 0;
  while (offset < source.length) {
    const start = offset;
    let kind = "text", closed = true;
    if (source.startsWith("(*", offset)) {
      kind = "comment"; let depth = 1; offset += 2;
      while (offset < source.length && depth) {
        if (source.startsWith("(*", offset)) { depth++; offset += 2; }
        else if (source.startsWith("*)", offset)) { depth--; offset += 2; }
        else offset++;
      }
      closed = depth === 0;
    } else if (source.startsWith("//", offset)) {
      kind = "comment"; while (offset < source.length && !/[\r\n]/.test(source[offset])) offset++;
    } else if (source[offset] === "'") {
      kind = "string"; closed = false; offset++;
      while (offset < source.length) {
        if (source[offset++] !== "'") continue;
        if (source[offset] === "'") { offset++; continue; }
        closed = true; break;
      }
    } else {
      const identifier = source.slice(offset).match(/^[A-Za-z_][A-Za-z0-9_.]*/);
      if (identifier) { kind = "identifier"; offset += identifier[0].length; }
      else offset++;
    }
    yield { text:source.slice(start,offset), kind, closed };
  }
}
export function renameStructuredTextIdentifier(source, oldName, newName) {
  const key = oldName.toLowerCase();
  return [...sourceSpans(String(source || ""))].map(span => span.kind === "identifier" && span.text.toLowerCase() === key ? newName : span.text).join("");
}
export function countStructuredTextReferences(source, name) {
  const key = name.toLowerCase(); let count = 0;
  for (const span of sourceSpans(String(source || ""))) if (span.kind === "identifier" && span.text.toLowerCase() === key) count++;
  return count;
}
function splitStatements(source, errors) {
  const statements = []; let text = "", startLine = 1, line = 1, header = false;
  const flush = () => { if (text.trim()) statements.push({ text:text.trim(), line:startLine }); text = ""; header = false; };
  const append = (value) => { if (!text.trim() && value.trim()) startLine = line; text += value; };
  for (const span of sourceSpans(String(source || ""))) {
    if (span.kind === "comment") {
      if (!span.closed) errors.push(`Line ${line}: block comment is missing *).`);
      append(span.text.replace(/[^\r\n]/g," "));
    } else if (span.kind === "identifier" && /^(IF|ELSIF|ELSE|END_IF)$/i.test(span.text)) {
      flush(); append(span.text);
      if (/^(IF|ELSIF)$/i.test(span.text)) header = true; else flush();
    } else if (span.kind === "identifier" && /^THEN$/i.test(span.text) && header) {
      append(span.text); flush();
    } else if (span.kind === "text" && span.text === ";") {
      if (text.trim()) { append(";"); flush(); }
    } else append(span.text);
    line += (span.text.match(/\n/g) || []).length;
  }
  flush(); return statements;
}

function tokenize(source, line) {
  const tokens = []; let rest = source;
  const pattern = /^(>=|<=|<>|[()+\-*/;=<>]|AND\b|OR\b|XOR\b|MOD\b|NOT\b|TRUE\b|FALSE\b|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z0-9_.]*)/i;
  while (rest.trim()) {
    rest = rest.trimStart(); const match = rest.match(pattern);
    if (!match) throw new Error(`Line ${line}: unsupported token “${rest[0]}”.`);
    tokens.push(match[0]); rest = rest.slice(match[0].length);
  }
  return tokens;
}

function parseExpression(tokens, line) {
  let cursor = 0;
  const primary = () => {
    const token = tokens[cursor++]; if (!token) throw new Error(`Line ${line}: expected a value.`);
    if (token === "(") { const expr = parseOr(); if (tokens[cursor++] !== ")") throw new Error(`Line ${line}: missing closing parenthesis.`); return expr; }
    if (/^(TRUE|FALSE)$/i.test(token)) return { op:"literal", value:token.toUpperCase() === "TRUE" };
    if (/^(AND|OR|XOR|MOD|NOT|\)|[+*/=<>]|>=|<=|<>)$/i.test(token)) throw new Error(`Line ${line}: unexpected “${token}”.`);
    if (/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(token)) return { op:"literal", value:Number(token) };
    return { op:"tag", name:token };
  };
  const unary = () => { const token = tokens[cursor]; if (/^NOT$/i.test(token || "")) { cursor++; return { op:"not", value:unary() }; } if (token === "-") { cursor++; return { op:"negate", value:unary() }; } if (token === "+") { cursor++; return unary(); } return primary(); };
  const parseMultiply = () => { let left = unary(); while (["*", "/"].includes(tokens[cursor]) || /^MOD$/i.test(tokens[cursor] || "")) { const token = tokens[cursor++], op = /^MOD$/i.test(token) ? "MOD" : token; left = { op, left, right:unary() }; } return left; };
  const parseAdd = () => { let left = parseMultiply(); while (["+", "-"].includes(tokens[cursor])) { const op = tokens[cursor++]; left = { op, left, right:parseMultiply() }; } return left; };
  const parseCompare = () => { let left = parseAdd(); if (["=", "<>", ">", ">=", "<", "<="].includes(tokens[cursor])) { const op = tokens[cursor++]; left = { op, left, right:parseAdd() }; } return left; };
  const parseAnd = () => { let left = parseCompare(); while (/^AND$/i.test(tokens[cursor] || "")) { cursor++; left = { op:"and", left, right:parseCompare() }; } return left; };
  const parseXor = () => { let left = parseAnd(); while (/^XOR$/i.test(tokens[cursor] || "")) { cursor++; left = { op:"xor", left, right:parseAnd() }; } return left; };
  const parseOr = () => { let left = parseXor(); while (/^OR$/i.test(tokens[cursor] || "")) { cursor++; left = { op:"or", left, right:parseXor() }; } return left; };
  const tree = parseOr(); if (cursor !== tokens.length) throw new Error(`Line ${line}: unexpected “${tokens[cursor]}”.`); return tree;
}

export function compileStructuredText(source, variableNames = []) {
  const statements = [], errors = [], allowed = new Map(), stack = [];
  for (const name of variableNames) { const key = name.toLowerCase(); if (allowed.has(key)) errors.push(`Tag "${name}" is declared more than once (ignoring case).`); else allowed.set(key,name); }
  const append = (statement) => { const parent = stack.at(-1); if (!parent) statements.push(statement); else if (parent.branch === "then") parent.node.consequent.push(statement); else if (parent.branch === "else") parent.node.alternate.push(statement); else parent.node.elseIf[parent.index].statements.push(statement); };
  const validateNames = (expression, line) => {
    const visit = (node) => { if (!node || typeof node !== "object") return;
      if (node.op === "tag") { const key = node.name.toLowerCase(); if (allowed.size && !allowed.has(key)) errors.push(`Line ${line}: "${node.name}" is not declared in the tag table.`); else if (allowed.has(key)) node.name = allowed.get(key); }
      visit(node.left); visit(node.right); if (typeof node.value === "object") visit(node.value);
    }; visit(expression);
  };
  splitStatements(source, errors).forEach(({ text:line, line:lineNumber }) => {
    const ifMatch = line.match(/^IF\s+([\s\S]+)\s+THEN$/i);
    if (ifMatch) {
      try { const condition = parseExpression(tokenize(ifMatch[1], lineNumber), lineNumber); validateNames(condition, lineNumber); const node = { kind:"if", condition, consequent:[], elseIf:[], alternate:[], line:lineNumber }; append(node); stack.push({ node, branch:"then" }); }
      catch (error) { errors.push(error.message); }
      return;
    }
    const elseIfMatch = line.match(/^ELSIF\s+([\s\S]+)\s+THEN$/i);
    if (elseIfMatch) { const current = stack.at(-1); if (!current || current.branch === "else") { errors.push(`Line ${lineNumber}: ELSIF must precede ELSE in an IF block.`); return; } try { const condition = parseExpression(tokenize(elseIfMatch[1], lineNumber), lineNumber); validateNames(condition, lineNumber); current.node.elseIf.push({ condition, statements:[], line:lineNumber }); current.branch = "elseIf"; current.index = current.node.elseIf.length - 1; } catch (error) { errors.push(error.message); } return; }
    if (/^ELSE$/i.test(line)) { const current = stack.at(-1); if (!current) errors.push(`Line ${lineNumber}: ELSE has no matching IF.`); else if (current.branch === "else") errors.push(`Line ${lineNumber}: duplicate ELSE branch.`); else current.branch = "else"; return; }
    if (/^END_IF\s*;?$/i.test(line)) { if (!stack.length) errors.push(`Line ${lineNumber}: END_IF has no matching IF.`); else stack.pop(); return; }
    const assignment = line.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*:=\s*([\s\S]+);$/);
    if (!assignment) { errors.push(`Line ${lineNumber}: use “Tag := expression;”, IF … THEN, ELSE, or END_IF.`); return; }
    const target = allowed.get(assignment[1].toLowerCase()) || assignment[1];
    if (allowed.size && !allowed.has(target.toLowerCase())) errors.push(`Line ${lineNumber}: “${target}” is not declared in the tag table.`);
    try {
      const expression = parseExpression(tokenize(assignment[2], lineNumber), lineNumber); validateNames(expression, lineNumber);
      append({ kind:"assignment", target, expression, line:lineNumber });
    } catch (error) { errors.push(error.message); }
  });
  for (const open of stack) errors.push(`Line ${open.node.line}: IF block is missing END_IF.`);
  const hasAssignment = (items) => items.some((item) => item.kind === "assignment" || hasAssignment(item.consequent || []) || (item.elseIf || []).some((branch) => hasAssignment(branch.statements)) || hasAssignment(item.alternate || []));
  if (!hasAssignment(statements) && !errors.length) errors.push("Enter at least one assignment.");
  return { ok:errors.length === 0, statements, errors, variables:[...allowed.values()] };
}

function lookup(values, name) { if (Object.hasOwn(values, name)) return values[name]; const key = Object.keys(values).find((item) => item.toLowerCase() === name.toLowerCase()); return key ? values[key] : false; }
function numeric(value, op) { const result = Number(value); if (!Number.isFinite(result)) throw new Error(`Operator ${op} requires numeric values.`); return result; }
function evaluate(node, values) {
  if (node.op === "literal") return node.value;
  if (node.op === "tag") return lookup(values, node.name);
  if (node.op === "not") return !Boolean(evaluate(node.value, values));
  if (node.op === "negate") return -numeric(evaluate(node.value, values), node.op);
  if (node.op === "and") return Boolean(evaluate(node.left, values)) && Boolean(evaluate(node.right, values));
  if (node.op === "xor") return Boolean(evaluate(node.left, values)) !== Boolean(evaluate(node.right, values));
  if (node.op === "or") return Boolean(evaluate(node.left, values)) || Boolean(evaluate(node.right, values));
  const left = evaluate(node.left, values), right = evaluate(node.right, values);
  if (node.op === "+") return numeric(left, node.op) + numeric(right, node.op);
  if (node.op === "-") return numeric(left, node.op) - numeric(right, node.op);
  if (node.op === "*") return numeric(left, node.op) * numeric(right, node.op);
  if (node.op === "/") { const divisor = numeric(right, node.op); if (divisor === 0) throw new Error("Division by zero."); return numeric(left, node.op) / divisor; }
  if (node.op === "MOD") { const divisor = numeric(right, node.op); if (divisor === 0) throw new Error("Modulo by zero."); return numeric(left, node.op) % divisor; }
  if (node.op === "=") return left === right;
  if (node.op === "<>") return left !== right;
  if ([">", ">=", "<", "<="].includes(node.op)) { const a = numeric(left, node.op), b = numeric(right, node.op); return node.op === ">" ? a > b : node.op === ">=" ? a >= b : node.op === "<" ? a < b : a <= b; }
  return false;
}

export function executeStructuredText(compiled, inputs, previousOutputs = {}, outputNames = [], tagTypes = {}) {
  if (!compiled.ok) return { values:{ ...inputs, ...previousOutputs }, outputs:{ ...previousOutputs }, errors:compiled.errors };
  const errors = [], names = new Map(), outputSet = new Set(outputNames.map((name) => name.toLowerCase()));
  const canonical = (name) => { const key = name.toLowerCase(); if (!names.has(key)) names.set(key,name); return names.get(key); };
  [...outputNames,...(compiled.variables || []),...Object.keys(tagTypes),...Object.keys(inputs),...Object.keys(previousOutputs)].forEach(canonical);
  for (const [label,record] of [["Inputs",inputs],["Previous outputs",previousOutputs],["Tag types",tagTypes]]) {
    const seen = new Map(); for (const name of Object.keys(record)) { const key = name.toLowerCase(); if (seen.has(key)) errors.push(`${label} contain ambiguous identifiers: ${seen.get(key)} / ${name}.`); else seen.set(key,name); }
  }
  if (errors.length) return { values:{ ...inputs, ...previousOutputs }, outputs:{ ...previousOutputs }, errors };
  const values = Object.create(null), outputs = Object.create(null), types = new Map(Object.entries(tagTypes).map(([name,type]) => [name.toLowerCase(),type]));
  for (const source of [inputs,previousOutputs]) for (const [name,value] of Object.entries(source)) values[canonical(name)] = value;
  for (const [name,value] of Object.entries(previousOutputs)) outputs[canonical(name)] = value;
  const executeList = (statements) => { for (const statement of statements) {
    if (statement.kind === "if") { try { if (Boolean(evaluate(statement.condition, values))) executeList(statement.consequent); else { const branch = statement.elseIf.find((item) => Boolean(evaluate(item.condition, values))); executeList(branch?.statements || statement.alternate); } } catch (error) { errors.push(`Line ${statement.line}: ${error.message}`); } continue; }
    try { const target = canonical(statement.target); let value = evaluate(statement.expression, values), type = types.get(target.toLowerCase()); if (type === "BOOL") value = Boolean(value); else if (["INT", "REAL", "TIME"].includes(type)) { value = numeric(value, "assignment"); if (type !== "REAL") value = Math.trunc(value); } values[target] = value; if (outputSet.has(target.toLowerCase())) outputs[target] = value; }
    catch (error) { errors.push(`Line ${statement.line}: ${error.message}`); }
  } };
  executeList(compiled.statements);
  return { values:{...values}, outputs:{...outputs}, errors };
}
