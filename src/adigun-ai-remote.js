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

function sanitizeHostedAnswer(answer) {
  return answer
    .replace(/\bCloudflare(?:\s+Workers\s+AI)?\b/gi, "hosted AI")
    .replace(/\bGemma(?:\s+\d+(?:\s+\d+B)?(?:\s+A\d+B)?)?\b/gi, "the configured model")
    .replace(/\bSupabase\b/gi, "account service")
    .replace(/\bservice[_ -]?role\b/gi, "privileged credential")
    .replace(/\bedge function\b/gi, "hosted service")
    .replace(/\bendpoint\b/gi, "service address")
    .replace(/https?:\/\/[^\s<>]*(?:workers\.dev|supabase\.co)[^\s<>]*/gi, "hosted service");
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
    return { answer: sanitizeHostedAnswer(data.answer.trim()), source: "Hosted AI response · review before use" };
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
  en: { consent: (provider) => `If you check this and send, your question and a brief project summary go to ${provider} to generate an educational reply. A sign-in token goes to HEPHZIBAH BEHULAH to verify your account. Replies are not engineering or safety approval.`, hosted: "Hosted AI response · review before use", accountRequired: "Hosted AI needs a signed-in account; guest sessions are not supported. Sign in and try again. Your question was not sent.", serviceUnavailable: "Hosted AI could not verify your account or is not configured. Your question was not sent; try again later.", unavailable: "Hosted AI could not return an answer. Your project was not changed.", failed: "Hosted AI did not return a usable answer. Your project was not changed." },
  de: { consent: (provider) => `Wenn du zustimmst und sendest, werden deine Frage und eine kurze Projektübersicht an ${provider} gesendet, damit eine Lernantwort erstellt wird. Ein Anmeldetoken wird an HEPHZIBAH BEHULAH zur Kontoüberprüfung gesendet. Antworten sind keine technische oder sicherheitstechnische Freigabe.`, hosted: "Antwort der gehosteten KI · vor Verwendung prüfen", accountRequired: "Für Hosted AI brauchst du ein angemeldetes Konto; Gastzugänge werden nicht unterstützt. Melde dich an und versuche es erneut. Deine Frage wurde nicht gesendet.", serviceUnavailable: "Hosted AI konnte dein Konto nicht prüfen oder ist nicht konfiguriert. Deine Frage wurde nicht gesendet; versuche es später erneut.", unavailable: "Die gehostete KI konnte nicht antworten. Dein Projekt wurde nicht geändert.", failed: "Die gehostete KI lieferte keine brauchbare Antwort. Dein Projekt wurde nicht geändert." },
  yo: { consent: (provider) => `Tí o bá fọwọ́ sí i tí o sì fi ránṣẹ́, a ó fi ìbéèrè rẹ àti àkótán iṣẹ́ díẹ̀ ránṣẹ́ sí ${provider} kí ó lè dá ìdáhùn ẹ̀kọ́ sílẹ̀. A ó fi àmì ìwọlé ránṣẹ́ sí HEPHZIBAH BEHULAH láti ṣàyẹ̀wò àkọọ́lẹ̀ rẹ. Ìdáhùn kì í ṣe ìfọwọ́sí iṣẹ́ ẹ̀rọ tàbí ààbò.`, hosted: "Ìdáhùn AI tí a gbàlejò · ṣàyẹ̀wò kí o tó lò ó", accountRequired: "Hosted AI nílò àkọọ́lẹ̀ tí o ti wọlé sí; kò gba àlejò. Wọlé kí o sì tún gbìyànjú. A kò fi ìbéèrè rẹ ránṣẹ́.", serviceUnavailable: "Hosted AI kò lè ṣàyẹ̀wò àkọọ́lẹ̀ rẹ tàbí kò tíì ṣètò. A kò fi ìbéèrè rẹ ránṣẹ́; tún gbìyànjú nígbà míì.", unavailable: "Hosted AI kò lè dáhùn. A kò yí iṣẹ́ rẹ padà.", failed: "Hosted AI kò dáhùn tó yẹ. A kò yí iṣẹ́ rẹ padà." },
};

labels.pcm = {
  consent: (provider) => `If you agree and send, we go send your question and small project summary to ${provider} make e give learning answer. We go send sign-in token to HEPHZIBAH BEHULAH to check your account. The answer no be engineering or safety approval.`,
  hosted: "Hosted AI answer · review am before you use am",
  accountRequired: "Hosted AI need make you sign in to your account; guest session no work. Sign in and try again. We no send your question.",
  serviceUnavailable: "Hosted AI no fit check your account or e never set up. We no send your question; try again later.",
  unavailable: "Hosted AI no fit bring answer. Your project no change.",
  failed: "Hosted AI no bring usable answer. Your project no change.",
};

export const adigunAiRemoteLabels = (language = "en") => labels[language] || labels.en;
