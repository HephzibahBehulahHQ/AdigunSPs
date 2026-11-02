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
    .replace(/\bLlama(?:\s+\d+(?:\.\d+)?(?:\s+\d+B)?)?\b/gi, "the configured model")
    .replace(/\bGemma(?:\s+\d+(?:\s+\d+B)?(?:\s+A\d+B)?)?\b/gi, "the configured model")
    .replace(/\bSupabase\b/gi, "account service")
    .replace(/\bservice[_ -]?role\b/gi, "privileged credential")
    .replace(/\bedge function\b/gi, "hosted service")
    .replace(/\bendpoint\b/gi, "service address")
    .replace(/https?:\/\/[^\s<>]*(?:workers\.dev|supabase\.co)[^\s<>]*/gi, "hosted service");
}

export async function askAdigunHostedAI({ client, question, project, diagnostics, consent = false, workerUrl = "", fetchImpl = fetch, signal, timeoutMs = 45_000 }) {
  if (consent !== true) return { error: "explicit-consent-required" };
  if (!client?.auth?.getSession || !workerUrl) return { error: "account-service-unavailable" };
  if (typeof question !== "string" || !question.trim() || question.length > 1_000) return { error: "invalid-question" };
  if (signal?.aborted) return { error:"hosted-ai-cancelled" };
  const controller = new AbortController(); let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once:true });
  const duration = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Math.min(timeoutMs,45_000) : 45_000;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, duration);
  const aborted = new Promise((_,reject) => controller.signal.addEventListener("abort", () => reject(new Error("request-aborted")), { once:true }));
  const waitFor = (operation) => Promise.race([operation,aborted]);
  try {
    const { data:sessionData, error:sessionError } = await waitFor(client.auth.getSession());
    const accessToken = sessionData?.session?.access_token;
    if (sessionError || !accessToken) return { error:"authenticated-session-required" };
    const response = await waitFor(fetchImpl(workerUrl, {
      signal: controller.signal,
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ question: question.trim(), projectSummary: summarizeAdigunProjectForAI(project, diagnostics), consent: true }),
    }));
    if (!response.ok) {
      const failure = await waitFor(response.json().catch(() => null));
      const knownErrors = new Set(["authentication-required", "invalid-session", "signed-in-account-required", "worker-not-configured", "authentication-service-unavailable", "model-unavailable", "empty-model-response", "model-token-limit", "invalid-question", "invalid-project-summary", "explicit-consent-required"]);
      const knownDiagnostics = new Set(["output-limit", "empty-content", "legacy-content", "response-object", "wrapped-result", "unexpected-shape"]);
      console.warn("Hosted AI request failed", response.status, knownErrors.has(failure?.error) ? failure.error : "unclassified-error", knownDiagnostics.has(failure?.diagnostic) ? failure.diagnostic : "no-diagnostic");
      return { error: typeof failure?.error === "string" ? failure.error : "hosted-ai-unavailable" };
    }
    const data = await waitFor(response.json());
    if (typeof data?.answer !== "string" || !data.answer.trim()) return { error: "hosted-ai-invalid-response" };
    return { answer: sanitizeHostedAnswer(data.answer.trim()), source: "Hosted AI response · review before use" };
  } catch {
    return { error: timedOut ? "hosted-ai-timeout" : controller.signal.aborted ? "hosted-ai-cancelled" : "hosted-ai-unavailable" };
  } finally {
    clearTimeout(timer); signal?.removeEventListener("abort", cancel);
  }
}

export function adigunAiRemoteErrorLabel(error) {
  if (error === "hosted-ai-timeout") return "timeout";
  if (error === "hosted-ai-cancelled") return "cancelled";
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

const requestCopy = {
 en:{pending:"Waiting for a reply…",cancel:"Cancel request",timeout:"The reply timed out. It may already have been processed; your project was not changed.",cancelled:"Request cancelled. It may already have been processed; your project was not changed."},
 de:{pending:"Antwort wird abgewartet…",cancel:"Anfrage abbrechen",timeout:"Die Antwort hat zu lange gedauert. Die Anfrage wurde möglicherweise bereits verarbeitet; dein Projekt wurde nicht geändert.",cancelled:"Anfrage abgebrochen. Sie wurde möglicherweise bereits verarbeitet; dein Projekt wurde nicht geändert."},
 yo:{pending:"A ń dúró de ìdáhùn…",cancel:"Fagilé ìbèèrè",timeout:"Ìdáhùn ti pẹ́ jù. A lè ti ṣe ìbèèrè náà; a kò yí iṣẹ́ rẹ padà.",cancelled:"A ti fagilé ìbèèrè. A lè ti ṣe ìbèèrè náà; a kò yí iṣẹ́ rẹ padà."},
 pcm:{pending:"Dey wait for reply…",cancel:"Cancel request",timeout:"Reply take too long. Dem fit don process the request; your project no change.",cancelled:"Request don cancel. Dem fit don process am already; your project no change."}
};
for (const [locale,copy] of Object.entries(requestCopy)) Object.assign(labels[locale],copy);
