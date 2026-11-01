function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[character]);
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((#[a-z0-9-]+)\)/gi, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderHelpMarkdown(markdown) {
  const lines = markdown.replace(/\r/g, "").split("\n"), output = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length, text = heading[2], id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
      output.push(`<h${level} id="${id}">${inlineMarkdown(text)}</h${level}>`); index += 1; continue;
    }
    if (/^\|/.test(line) && index + 1 < lines.length && /^\|?\s*[-:| ]+\|?\s*$/.test(lines[index + 1].trim())) {
      const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => inlineMarkdown(cell.trim()));
      const headings = cells(line); index += 2; const rows = [];
      while (index < lines.length && /^\|/.test(lines[index].trim())) { rows.push(cells(lines[index])); index += 1; }
      output.push(`<div class="help-table-wrap"><table><thead><tr>${headings.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headings.map((_, cellIndex) => `<td>${row[cellIndex] || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue;
    }
    if (/^\d+\.\s+/.test(line) || /^[-*]\s+/.test(line)) {
      const ordered = /^\d+\./.test(line), tag = ordered ? "ol" : "ul", items = [];
      while (index < lines.length && (ordered ? /^\d+\.\s+/.test(lines[index].trim()) : /^[-*]\s+/.test(lines[index].trim()))) {
        items.push(`<li>${inlineMarkdown(lines[index].trim().replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""))}</li>`); index += 1;
      }
      output.push(`<${tag}>${items.join("")}</${tag}>`); continue;
    }
    const paragraph = [line]; index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^\|/.test(lines[index].trim()) && !/^\d+\.\s+|^[-*]\s+/.test(lines[index].trim())) { paragraph.push(lines[index].trim()); index += 1; }
    output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }
  return output.join("");
}
