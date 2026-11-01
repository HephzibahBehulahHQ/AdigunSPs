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
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      return { error: typeof failure?.error === "string" ? failure.error : "hosted-ai-unavailable" };
    }
    const data = await response.json();
    if (typeof data?.answer !== "string" || !data.answer.trim()) return { error: "hosted-ai-invalid-response" };
    return { answer: data.answer.trim(), source: data.source || "Cloudflare Workers AI · review before use" };
  } catch {
    return { error: "hosted-ai-unavailable" };
  }
}

export function adigunAiRemoteErrorLabel(error) {
  if (["authentication-required", "authenticated-session-required", "invalid-session", "signed-in-account-required"].includes(error)) return "accountRequired";
  if (["account-service-unavailable", "authentication-service-unavailable", "worker-not-configured"].includes(error)) return "serviceUnavailable";
  if (["hosted-ai-unavailable", "model-unavailable"].includes(error)) return "unavailable";
  return "failed";
}

const labels = {
  en: { consent: (provider) => `Send this question and a brief project summary to ${provider}, hosted by HEPHZIBAH BEHULAH.`, hosted: "Cloudflare Workers AI · review before use", accountRequired: "Hosted AI needs a signed-in account; guest sessions are not supported. Sign in and try again. Your question was not sent.", serviceUnavailable: "Hosted AI could not verify your account or is not configured. Your question was not sent; try again later.", unavailable: "Hosted AI is not available. Your question was not sent.", failed: "Hosted AI did not return a usable answer. Your project was not changed." },
  de: { consent: (provider) => `Diese Frage und eine kurze Projektübersicht an ${provider} senden, gehostet von HEPHZIBAH BEHULAH.`, hosted: "Cloudflare Workers AI · vor Verwendung prüfen", accountRequired: "Für Hosted AI brauchst du ein angemeldetes Konto; Gastzugänge werden nicht unterstützt. Melde dich an und versuche es erneut. Deine Frage wurde nicht gesendet.", serviceUnavailable: "Hosted AI konnte dein Konto nicht prüfen oder ist nicht konfiguriert. Deine Frage wurde nicht gesendet; versuche es später erneut.", unavailable: "Die gehostete KI ist nicht verfügbar. Deine Frage wurde nicht gesendet.", failed: "Die gehostete KI lieferte keine brauchbare Antwort. Dein Projekt wurde nicht geändert." },
  yo: { consent: (provider) => `Fi ìbéèrè yìí àti àkótán iṣẹ́ díẹ̀ ránṣẹ́ sí ${provider}, tí HEPHZIBAH BEHULAH ń gbàlejò.`, hosted: "Cloudflare Workers AI · ṣàyẹ̀wò kí o tó lò ó", accountRequired: "Hosted AI nílò àkọọ́lẹ̀ tí o ti wọlé sí; kò gba àlejò. Wọlé kí o sì tún gbìyànjú. A kò fi ìbéèrè rẹ ránṣẹ́.", serviceUnavailable: "Hosted AI kò lè ṣàyẹ̀wò àkọọ́lẹ̀ rẹ tàbí kò tíì ṣètò. A kò fi ìbéèrè rẹ ránṣẹ́; tún gbìyànjú nígbà míì.", unavailable: "Hosted AI kò sí ní báyìí. A kò fi ìbéèrè rẹ ránṣẹ́.", failed: "Hosted AI kò dáhùn tó yẹ. A kò yí iṣẹ́ rẹ padà." },
};

labels.pcm = {
  consent: (provider) => `Send this question and small project summary go ${provider}, wey HEPHZIBAH BEHULAH dey host.`,
  hosted: "Cloudflare Workers AI · review am before you use am",
  accountRequired: "Hosted AI need make you sign in to your account; guest session no work. Sign in and try again. We no send your question.",
  serviceUnavailable: "Hosted AI no fit check your account or e never set up. We no send your question; try again later.",
  unavailable: "Hosted AI no dey available. We no send your question.",
  failed: "Hosted AI no bring usable answer. Your project no change.",
};

export const adigunAiRemoteLabels = (language = "en") => labels[language] || labels.en;
