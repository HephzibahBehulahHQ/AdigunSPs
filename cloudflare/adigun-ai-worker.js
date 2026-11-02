const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const MAX_BODY_BYTES = 8_192;

const response = (body, status, origin = "") => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...(origin ? { "access-control-allow-origin": origin, "vary": "Origin" } : {}),
  },
});

function allowedOrigin(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = String(env.ADIGUN_AI_ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : "";
}

export function createAdigunAIWorker({ fetchImpl = fetch } = {}) {
  return {
    async fetch(request, env) {
      const origin = allowedOrigin(request, env);
      if (request.method === "OPTIONS") {
        if (!origin) return new Response(null, { status: 403 });
        return new Response(null, { status: 204, headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "authorization, content-type",
          "access-control-max-age": "600",
          "vary": "Origin",
        } });
      }
      if (request.method !== "POST") return response({ error: "method-not-allowed" }, 405, origin);
      if (!origin) return response({ error: "origin-not-allowed" }, 403);
      if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.AI) return response({ error: "worker-not-configured" }, 503, origin);
      if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return response({ error: "request-too-large" }, 413, origin);

      const authorization = request.headers.get("authorization") || "";
      const token = authorization.match(/^Bearer\s+(\S+)$/i)?.[1];
      if (!token) return response({ error: "authentication-required" }, 401, origin);

      let body;
      try {
        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) return response({ error: "request-too-large" }, 413, origin);
        body = JSON.parse(rawBody);
      } catch { return response({ error: "invalid-json" }, 400, origin); }
      if (body?.consent !== true) return response({ error: "explicit-consent-required" }, 428, origin);
      if (typeof body.question !== "string" || !body.question.trim() || body.question.length > 1_000) return response({ error: "invalid-question" }, 400, origin);
      if (typeof body.projectSummary !== "string" || body.projectSummary.length > 2_000) return response({ error: "invalid-project-summary" }, 400, origin);

      let userResponse;
      try {
        const authUrl = new URL("/auth/v1/user", env.SUPABASE_URL);
        userResponse = await fetchImpl(authUrl, { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: `Bearer ${token}` } });
      } catch {
        return response({ error: "authentication-service-unavailable" }, 503, origin);
      }
      if (!userResponse.ok) return response({ error: "invalid-session" }, 401, origin);
      let user;
      try { user = await userResponse.json(); } catch { return response({ error: "invalid-session" }, 401, origin); }
      if (!user?.id || user.is_anonymous === true) return response({ error: "signed-in-account-required" }, 401, origin);

      try {
        const result = await env.AI.run(MODEL, {
          messages: [
            { role: "system", content: "You are Adigun BOT, an educational PLC programming copilot. Explain only the supplied project summary and question. Do not claim physical validation or safety certification. Give concise, reviewable guidance. Never claim you changed or saved the project." },
            { role: "user", content: `Project summary (counts and diagnostic codes only): ${body.projectSummary}\n\nQuestion: ${body.question}` },
          ],
          max_completion_tokens: 1024,
          chat_template_kwargs: { enable_thinking: false },
          stream: false,
          temperature: 0.2,
        });
        const answer = typeof result === "string" ? result : result?.choices?.[0]?.message?.content ?? result?.response;
        if (typeof answer !== "string" || !answer.trim()) return response({ error: "empty-model-response", diagnostic: result?.choices?.[0]?.finish_reason === "length" ? "output-limit" : result?.choices?.length ? "empty-content" : result?.response !== undefined ? "legacy-content" : result instanceof Response ? "response-object" : result?.result !== undefined ? "wrapped-result" : "unexpected-shape" }, 502, origin);
        return response({ answer: answer.trim(), source: "Cloudflare Workers AI · review before use" }, 200, origin);
      } catch {
        return response({ error: "model-unavailable" }, 503, origin);
      }
    },
  };
}

export default createAdigunAIWorker();
