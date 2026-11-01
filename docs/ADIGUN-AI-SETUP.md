# Adigun BOT · Cloudflare Workers AI setup

The local Adigun BOT remains the default and works offline. Hosted answers use Cloudflare Workers AI only after the user checks the per-request consent box. The browser sends a short question and a minimized project summary; the Worker verifies a Supabase access token, rejects anonymous guest sessions, then calls a pinned Cloudflare model. Hosted answers cannot edit or save a project.

## Current deployment status

The production Worker `https://adigunsps-ai.hephzibah-behulah.workers.dev` was deployed on 2026-11-01 from the local audit branch. Wrangler reported `env.AI` and the AdigunSPs Supabase URL/origin bindings; `SUPABASE_PUBLISHABLE_KEY` is configured as a Worker secret. GET returns the expected `405 method-not-allowed`; no-token POST returns `401 authentication-required`, and a consented invalid token returns `401 invalid-session`, all without invoking the model. Live authenticated inference and Neuron usage remain unverified. GitHub Pages still serves published `main` (`bcee0065`); publish this local hosted-AI client and workflow change before it is available on the site. The Pages build supplies the Worker URL by default; repository variables are optional overrides.

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

That binding is available as `env.AI`. The Worker hardcodes `@cf/google/gemma-4-26b-a4b-it` and never accepts a model from the request. Cloudflare's [Gemma 4 model page](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/) lists it for Workers AI, and the current [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) does not classify it as paid-only. Workers Free includes 10,000 Neurons per day; requests beyond that limit fail on Free. Workers Paid charges $0.011 per 1,000 Neurons above the daily free allocation. Some other models require paid billing regardless of remaining free Neurons; check the live list before changing the pinned model.

To verify plan and usage:

1. Open **Cloudflare Dashboard → Workers & Pages → Workers AI → Usage** for the account used by Wrangler.
2. Confirm inference appears against the `adigunsps-ai` Worker and the Neuron usage stays within the free daily allocation.
3. Check the pinned model in the [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/) and [pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) before changing it. A model requiring Paid will fail on Free even if free Neurons remain; it will not silently switch models.
4. The code's model constant is the guard against accidentally calling a paid-only model. Do not add a client-controlled model selector or model ID to Worker variables.

## Enable hosted AI on GitHub Pages

The GitHub Pages build uses the verified Worker URL and enables the hosted option by default after these source changes are published. No GitHub Actions variable is required; repository variables can override the endpoint or set `ADIGUN_AI_ENABLED=false`. In the app, a signed-in user must still opt in for each hosted request. The local development build remains disabled unless its environment variables are set.

Publish the local hosted-AI client changes, then run **Actions → Deploy AdigunSPs to GitHub Pages → Run workflow**. The deploy workflow builds the static runtime configuration from its defaults or the optional repository variables. If hosted AI is disabled or its URL is not HTTPS, the hosted option stays hidden and the local offline assistant remains available.

## Verification and limits

`npm run test:ai` checks the consent gate, authenticated-user verification, anonymous-session rejection, allowed origins, context minimization, fixed model selection, and client fallback. `npm run build` syntax-checks browser JavaScript. These local tests do not call Cloudflare or Supabase. After deployment, verify one signed-in request, one guest rejection, the consent-off case, and usage in the Cloudflare dashboard. The Worker does not persist prompts; account-level Cloudflare retention and data processing terms still apply.
