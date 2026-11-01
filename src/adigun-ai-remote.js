export function summarizeAdigunProjectForAI(project = {}, diagnostics = []) {
  return JSON.stringify({
    editor: project.editorType || "LD",
    counts: {
      tags: project.tags?.length || 0,
      inputs: project.io?.inputs?.length || 0,
      outputs: project.io?.outputs?.length || 0,
      ladderNetworks: project.rungs?.length || 0,
      functionBlocks: project.fbdBlocks?.length || 0,
      sequentialSteps: project.sfc?.steps?.length || 0,
    },
    issueCodes: diagnostics.map((issue) => String(issue.code || "project-check").slice(0, 80)).slice(0, 8),
  });
}

export async function askAdigunHostedAI({ client, question, project, diagnostics, consent = false, workerUrl = "", fetchImpl = fetch }) {
  if (consent !== true) return { error: "explicit-consent-required" };
  if (!client?.auth?.getSession || !workerUrl) return { error: "account-service-unavailable" };
  if (typeof question !== "string" || !question.trim() || question.length > 1_000) return { error: "invalid-question" };
  const { data:sessionData, error:sessionError } = await client.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (sessionError || !accessToken) return { error: "authenticated-session-required" };
  try {
    const response = await fetchImpl(workerUrl, {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ question: question.trim(), projectSummary: summarizeAdigunProjectForAI(project, diagnostics), consent: true }),
    });
    if (!response.ok) return { error: "hosted-ai-unavailable" };
    const data = await response.json();
    if (typeof data?.answer !== "string" || !data.answer.trim()) return { error: "hosted-ai-invalid-response" };
    return { answer: data.answer.trim(), source: data.source || "Cloudflare Workers AI · review before use" };
  } catch {
    return { error: "hosted-ai-unavailable" };
  }
}

const labels = {
  en: { consent: (provider) => `Send this question and a brief project summary to ${provider}, hosted by HEPHZIBAH BEHULAH.`, hosted: "Cloudflare Workers AI · review before use", unavailable: "Hosted AI is not available. Your question was not sent.", failed: "Hosted AI did not return a usable answer. Your project was not changed." },
  de: { consent: (provider) => `Diese Frage und eine kurze Projektübersicht an ${provider} senden, gehostet von HEPHZIBAH BEHULAH.`, hosted: "Cloudflare Workers AI · vor Verwendung prüfen", unavailable: "Die gehostete KI ist nicht verfügbar. Deine Frage wurde nicht gesendet.", failed: "Die gehostete KI lieferte keine brauchbare Antwort. Dein Projekt wurde nicht geändert." },
  yo: { consent: (provider) => `Fi ìbéèrè yìí àti àkótán iṣẹ́ díẹ̀ ránṣẹ́ sí ${provider}, tí HEPHZIBAH BEHULAH ń gbàlejò.`, hosted: "Cloudflare Workers AI · ṣàyẹ̀wò kí o tó lò ó", unavailable: "Hosted AI kò sí ní báyìí. A kò fi ìbéèrè rẹ ránṣẹ́.", failed: "Hosted AI kò dáhùn tó yẹ. A kò yí iṣẹ́ rẹ padà." },
};

labels.pcm = {
  consent: (provider) => `Send this question and small project summary go ${provider}, wey HEPHZIBAH BEHULAH dey host.`,
  hosted: "Cloudflare Workers AI · review am before you use am",
  unavailable: "Hosted AI no dey available. We no send your question.",
  failed: "Hosted AI no bring usable answer. Your project no change.",
};

export const adigunAiRemoteLabels = (language = "en") => labels[language] || labels.en;
