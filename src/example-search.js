const terms = (value) => String(value || "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter(Boolean).map((word) => word.length > 5 ? word.replace(/(ing|ers|er|ed|es|s)$/u, "") : word);

export function searchExamples(examples, query, language = "en", limit = 5) {
  const queryTerms = terms(query);
  if (!queryTerms.length) return [];
  const ranked = examples.map((example) => {
    const fields = [example.id, example.title?.[language], example.category?.[language], example.description?.[language], example.howToTest?.[language], ...(example.tags || [])].map(terms);
    const corpus = new Set(fields.flat());
    let score = queryTerms.reduce((sum, term) => sum + (corpus.has(term) ? 2 : [...corpus].some((word) => word.includes(term) || term.includes(word)) ? 1 : 0), 0);
    const title = fields[1].join(" ");
    if (queryTerms.some((term) => title.includes(term))) score += 2;
    if (score >= Math.max(2, queryTerms.length)) return { example, score };
    return null;
  }).filter(Boolean);
  return ranked.sort((a, b) => b.score - a.score || a.example.id.localeCompare(b.example.id)).slice(0, limit).map(({ example, score }) => ({ example, score }));
}

