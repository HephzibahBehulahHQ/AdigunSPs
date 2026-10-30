const localeTags = { en:"en-NG", de:"de-DE", yo:"yo-NG", pcm:"en-NG" };

export function formatLocaleNumber(value, language = "en", digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  const fractionDigits = Math.max(0, Math.min(12, Math.trunc(Number(digits) || 0)));
  return new Intl.NumberFormat(localeTags[language] || localeTags.en, { minimumFractionDigits:fractionDigits, maximumFractionDigits:fractionDigits }).format(number);
}

export function formatLocaleDateTime(value, language = "en") {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTags[language] || localeTags.en, { dateStyle:"medium", timeStyle:"short" }).format(date);
}

export function formatLocaleTime(value, language = "en") {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(localeTags[language] || localeTags.en, { hour:"2-digit", minute:"2-digit", second:"2-digit" }).format(date);
}
