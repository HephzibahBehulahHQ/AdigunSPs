# Adigun BOT · Cloudflare Workers AI setup

The local Adigun BOT remains the default and works offline. Hosted answers use Cloudflare Workers AI only after the user checks the per-request consent box. The browser sends a short question and a minimized project summary; the Worker verifies a Supabase access token, rejects anonymous guest sessions, then calls a pinned Cloudflare model. Hosted answers cannot edit or save a project.

## Current deployment status

The production Worker `https://adigunsps-ai.hephzibah-behulah.workers.dev` is deployed with the `AI` binding and AdigunSPs Supabase settings; `SUPABASE_PUBLISHABLE_KEY` is configured as a Worker secret. Recorded route checks returned `405 method-not-allowed` for GET, `401 authentication-required` for a POST without a bearer token, and `401 invalid-session` for an invalid token. These checks verify the method and authentication guards, not model inference. The published Pages build includes the consent-gated hosted-AI client and default Worker URL. Signed-in inference, Neuron usage, retention, and request-limit behavior remain unverified.

## Deploy the Worker

1. Install Node.js 22 or later, then open a terminal in the repository root.
2. Authenticate Wrangler with the Cloudflare account that owns the Workers AI service:

   ```powershell
   npx wrangler@4 login --device
   npx wrangler@4 whoami
   ```

   If device flow is unavailable in your environment, create a short-lived token from Cloudflare's **Edit Cloudflare Workers** template, scope it to the intended account, and set it only in the current PowerShell process:

   ```powershell
   $secureToken = Read-Host "Cloudflare API token" -AsSecureString
   $env:CLOUDFLARE_API_TOKEN = [System.Net.NetworkCredential]::new("", $secureToken).Password
   $env:CLOUDFLARE_ACCOUNT_ID = "<your Cloudflare account ID>"
   ```

   Do not echo, commit, or put the token in a tracked file. Clear both variables after deployment.

3. Confirm [wrangler.toml](../wrangler.toml) contains the `AI` binding and the AdigunSPs Supabase URL. The Worker pins `@cf/google/gemma-4-26b-a4b-it` in source; the browser cannot select a model.
4. Add the Supabase **publishable key** as a Worker secret. This is the project API key, not a Supabase service-role key or user token:

   ```powershell
   npx wrangler@4 secret put SUPABASE_PUBLISHABLE_KEY
   ```

   Paste the publishable key when prompted. Do not put a service-role/secret key in the Worker or browser.
5. Deploy:

   ```powershell
   npx wrangler@4 deploy
   ```

   Wrangler prints the `workers.dev` URL, for example `https://adigunsps-ai.<your-subdomain>.workers.dev`.
6. Test the Worker URL and review the Cloudflare dashboard’s Workers AI usage page before relying on hosted answers. GET should return `405 method-not-allowed`; an unauthenticated POST should return `401 authentication-required`. Because the Worker checks configuration first, that 401 also confirms required bindings/secrets passed the guard; `503 worker-not-configured` means one is missing. A valid authenticated POST is required to verify inference.

## Bindings and free-plan model guard

The repository's Wrangler config declares:

```toml
[ai]
binding = "AI"
```

That binding is available as `env.AI`. The Worker hardcodes `@cf/google/gemma-4-26b-a4b-it` and never accepts a model from the request. The current [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) does not classify it as paid-only. Workers Free includes 10,000 Neurons per day; requests beyond that limit fail on Free. Workers Paid charges $0.011 per 1,000 Neurons above the daily free allocation. Some other models require paid billing regardless of remaining free Neurons; check the live list before changing the pinned model.

To verify plan and usage:

1. Open **Cloudflare Dashboard → Workers & Pages → Workers AI → Usage** for the account used by Wrangler.
2. Confirm inference appears against the `adigunsps-ai` Worker and the Neuron usage stays within the free daily allocation.
3. Check the pinned model in the [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/) and [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) before changing it. A model requiring Paid will fail on Free even if free Neurons remain; it will not silently switch models.
4. The code's model constant is the guard against accidentally calling a paid-only model. Do not add a client-controlled model selector or model ID to Worker variables.

## Enable hosted AI on GitHub Pages

The current GitHub Pages build includes the hosted client and verified default Worker URL. No GitHub Actions variable is required; repository variables can override the endpoint or set `ADIGUN_AI_ENABLED=false`. A signed-in user must opt in for each hosted request. The local development build remains disabled unless its environment variables are set.

To redeploy after changing the Pages client or runtime configuration, run **Actions → Deploy AdigunSPs to GitHub Pages → Run workflow**. The workflow builds the static runtime configuration from its defaults or the optional repository variables. If hosted AI is disabled or its URL is not HTTPS, the hosted option stays hidden and the local offline assistant remains available.

## Verification and limits

`npm run test:ai` checks the consent gate, authenticated-user verification, anonymous-session rejection, allowed origins, context minimization, fixed model selection, and client fallback. `npm run build` syntax-checks browser JavaScript. These local tests do not call Cloudflare or Supabase. After deployment, verify one signed-in request, one guest rejection, the consent-off case, and usage in the Cloudflare dashboard. The Worker does not persist prompts; account-level Cloudflare retention and data processing terms still apply.

## Production-origin configuration

`ADIGUN_AI_ALLOWED_ORIGINS` must include the exact browser origin `https://adigunsps.hephzibahbehulah.com` (no path or trailing slash). Preserve the old Pages origin while it is supported. A custom-domain preflight returning 403 blocks the browser before account verification or model inference. Keep the checked-in Wrangler value and deployed variable synchronized. Origin permission does not bypass the token, permanent-user, or per-request consent gates.

The Worker accepts both chat-completion text at `choices[0].message.content` and the legacy `response` shape. See [the model response schema](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/). Reject missing/non-text answers rather than showing a fabricated success.

## Current inference diagnostics

After successful account verification, Gemma returned `empty-model-response`, including a one-word test after adding chat-completion parsing. A live Llama 3.1 8B trial returned `model-unavailable`; it was not accepted as a working replacement. Gemma remains pinned while bounded diagnostics identify its returned format. The client console records only status, a known error code, and a fixed format category: no question, token, project data, answer, or arbitrary upstream message. The consent label names the provider rather than hardcoding a model name. No account billing plan was changed; usage and successful inference remain unverified.

## Output-budget configuration

Live fixed-enum diagnostics identified `output-limit`: the 512-token budget ended before a visible answer. The Worker requests non-streaming replies, a bounded `max_completion_tokens: 1024`, and `chat_template_kwargs: { enable_thinking: false }`. The completion parameter is documented in the [Cloudflare model schema](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/); the template flag follows [Google thinking-mode guidance](https://ai.google.dev/gemma/docs/capabilities/thinking). These settings require live verification with the deployed provider. No automatic retry or unlimited token budget is enabled.

## Verified live recovery - 2026-11-02

Worker version `661bc66c` returned READY and a two-sentence explanation of consistent PLC input snapshots through the deployed client using an existing permanent-user session. Consent was explicitly checked for each request; afterward the consent-off scan-cycle helper returned its local explanation. A direct custom-origin POST without a bearer token still returned 401 `authentication-required`. These checks verify two bounded inferences and the selected guards, not general answer quality or actual daily Neuron consumption. No billing-plan change was made.

## Client request lifecycle

The hosted client caps waiting at 45 seconds across session lookup, fetch, and JSON response reading. AbortSignal cancellation stops client waiting and aborts fetch; it cannot undo inference already received by the service. The Bot serializes sends, shows a localized status and cancel control, discards replies after close/project/account changes, and updates minimized content without reopening the window. No automatic retry is enabled.
