import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import worker, { createAdigunAIWorker } from "../cloudflare/adigun-ai-worker.js";
import { adigunAiRemoteErrorLabel, adigunAiRemoteLabels, askAdigunHostedAI, summarizeAdigunProjectForAI } from "../src/adigun-ai-remote.js";
import { adigunAiLabels } from "../src/adigun-ai.js";
import { loadAdigunRuntimeConfig, serializeAdigunRuntimeConfig } from "../scripts/runtime-config.js";

const env = { SUPABASE_URL:"https://fqcbfnktdvqojyezxeis.supabase.co", SUPABASE_PUBLISHABLE_KEY:"sb_publishable_test", ADIGUN_AI_ALLOWED_ORIGINS:"https://hephzibahbehulahhq.github.io,http://localhost:8086", AI:{run:async () => ({response:"Reviewed PLC explanation."})} };
const makeRequest = (body, { token="signed-in-token", origin="https://hephzibahbehulahhq.github.io", method="POST" }={}) => new Request("https://adigunsps-ai.example.workers.dev", {
  method, headers:{ ...(token ? {authorization:`Bearer ${token}`} : {}), ...(origin ? {origin} : {}), "content-type":"application/json" }, body:method === "POST" ? JSON.stringify(body) : undefined,
});
const payload = {consent:true,question:"Explain TON",projectSummary:'{"editor":"LD","issueCodes":[]}'};
let authCalls=0,modelCalls=0,selectedModel="";
const testWorker=createAdigunAIWorker({fetchImpl:async(url,options)=>{
  authCalls++;assert.equal(String(url),`${env.SUPABASE_URL}/auth/v1/user`);assert.equal(options.headers.apikey,env.SUPABASE_PUBLISHABLE_KEY);
  if(options.headers.authorization!=="Bearer signed-in-token")return Response.json({message:"Invalid token"},{status:401});
  return Response.json({id:"user-1",is_anonymous:false});
}});
const aiEnv={...env,AI:{run:async(model,options)=>{modelCalls++;selectedModel=model;assert.equal(options.messages.length,2);return {response:"Reviewed PLC explanation."};}}};

assert.equal((await testWorker.fetch(makeRequest(payload,{token:null}),aiEnv)).status,401,"missing Supabase session is rejected");
assert.equal((await testWorker.fetch(makeRequest(payload,{token:"bad-token"}),aiEnv)).status,401,"invalid Supabase JWT is rejected");
const authsBefore=authCalls;
assert.equal((await testWorker.fetch(makeRequest(payload,{origin:"https://attacker.example"}),aiEnv)).status,403,"unexpected origins are rejected");
assert.equal((await testWorker.fetch(makeRequest({...payload,consent:false}),aiEnv)).status,428,"consent is required");
assert.equal(authCalls,authsBefore,"origin and consent rejection happen before auth and inference");
const anonymousWorker=createAdigunAIWorker({fetchImpl:async()=>Response.json({id:"guest-1",is_anonymous:true})});
assert.equal((await anonymousWorker.fetch(makeRequest(payload),aiEnv)).status,401,"anonymous Supabase guest session cannot access hosted AI");
assert.equal(modelCalls,0,"rejected requests never reach Workers AI");

const accepted=await testWorker.fetch(makeRequest({...payload,model:"@cf/moonshotai/kimi-k2.6"}),aiEnv);
assert.equal(accepted.status,200);assert.equal(accepted.headers.get("access-control-allow-origin"),"https://hephzibahbehulahhq.github.io");
assert.equal((await accepted.json()).answer,"Reviewed PLC explanation.");
assert.equal(selectedModel,"@cf/google/gemma-4-26b-a4b-it","Worker pins the free-plan-compatible model, not a browser-supplied ID");
assert.equal(modelCalls,1);
assert.equal((await testWorker.fetch(makeRequest(payload,{method:"GET"}),aiEnv)).status,405);
assert.equal((await worker.fetch(makeRequest(payload),{...aiEnv,AI:null})).status,503,"missing AI binding fails closed");
const failingWorker=createAdigunAIWorker({fetchImpl:async()=>Response.json({id:"user-1"})});
assert.equal((await failingWorker.fetch(makeRequest(payload),{...aiEnv,AI:{run:async()=>{throw new Error("model unavailable");}}})).status,503);

const sourceProject={editorType:"LD",tags:[{name:"private-tag",type:"BOOL"}],io:{inputs:["private-tag"],outputs:[]},rungs:[{contacts:[{tag:"secret-rung-logic"}]}]};
const summary=summarizeAdigunProjectForAI(sourceProject,[{code:"missing-input",message:"private diagnostic"}]);
assert.equal(summary.includes("private-tag"),false);assert.equal(summary.includes("secret-rung-logic"),false);assert.equal(summary.includes("private diagnostic"),false);
let invoked=false;
assert.equal((await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"token"}}})}},question:"help",project:{},consent:false,workerUrl:"https://worker.example",fetchImpl:async()=>{invoked=true;}})).error,"explicit-consent-required");
assert.equal(invoked,false,"consent remains opt-in before network request");
let sentRequest;
const call=await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"access-token"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async(url,options)=>{sentRequest={url,options};return Response.json({answer:"offline-safe result"});}});
assert.equal(call.answer,"offline-safe result");assert.equal(sentRequest.options.headers.authorization,"Bearer access-token");
const guardedAnswer=await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"access-token"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>Response.json({answer:"Cloudflare Workers AI uses Gemma. Supabase endpoint: https://demo.supabase.co"})});
assert.doesNotMatch(guardedAnswer.answer,/Cloudflare|Workers AI|Gemma|Supabase|endpoint|workers\.dev|supabase\.co/i,"hosted response cannot disclose backend provider or API details in chat");
const rejected=await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"access-token"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>Response.json({error:"signed-in-account-required"},{status:401})});
assert.equal(rejected.error,"signed-in-account-required","Worker authentication reason is preserved for useful guidance");
assert.equal((await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:null},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>{throw new Error("must not call");}})).error,"authenticated-session-required");
assert.equal((await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"x"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>{throw new Error("offline");}})).error,"hosted-ai-unavailable","network failure preserves local fallback");
assert.deepEqual(Object.keys(adigunAiRemoteLabels("en")).sort(),["accountRequired","consent","failed","hosted","serviceUnavailable","unavailable"]);
assert.equal(adigunAiRemoteErrorLabel("signed-in-account-required"),"accountRequired");
assert.equal(adigunAiRemoteErrorLabel("invalid-session"),"accountRequired");
assert.equal(adigunAiRemoteErrorLabel("worker-not-configured"),"serviceUnavailable");
assert.equal(adigunAiRemoteErrorLabel("model-unavailable"),"unavailable");
assert.equal(adigunAiRemoteErrorLabel("unexpected"),"failed");
for(const locale of ["en","de","yo","pcm"]){const copy=adigunAiRemoteLabels(locale);assert.ok(copy.accountRequired);assert.ok(copy.serviceUnavailable);}
for(const locale of ["en","de","yo","pcm"])assert.match(adigunAiRemoteLabels(locale).consent("Cloudflare Workers AI"),/Cloudflare Workers AI/);

const mainBot = readFileSync("src/adigun-ai.js", "utf8");
const appSource = readFileSync("src/app.js", "utf8");
const helpGuide = readFileSync("docs/HELP.md", "utf8");
for (const locale of ["en", "de", "yo", "pcm"]) {
  const labels = adigunAiLabels(locale);
  assert.doesNotMatch(labels.privacy, /Cloudflare|Workers AI|Supabase|Gemma|provider|endpoint/i, `${locale} main Bot privacy line stays provider-neutral`);
  assert.equal(labels.privacy.split(/[.!?。]/).filter(Boolean).length, 1, `${locale} main Bot uses one privacy sentence`);
  const remoteLabels = adigunAiRemoteLabels(locale);
  const consent = remoteLabels.consent("Cloudflare Workers AI");
  assert.match(consent, /Cloudflare Workers AI/);
  assert.match(consent, /question|Frage|ìbéèrè/i);
  assert.match(consent, /summary|Projektübersicht|àkótán/i);
  assert.match(consent, /educational|Lernantwort|ẹ̀kọ́|learning/i);
  assert.match(consent, /engineering|safety|sicherheitstechnische|ààbò/i);
  assert.match(consent, /token|àmì ìwọlé/i);
  assert.doesNotMatch(remoteLabels.hosted, /Cloudflare|Workers AI|Supabase|Gemma/i, `${locale} hosted answer label stays neutral in the chat`);
}
assert.match(appSource, /remoteCopy\.consent\(hostedAI\.providerLabel\)/, "provider details are rendered at the consent gate");
assert.match(appSource, /remoteCopy\.hosted/, "hosted answers use the neutral chat label");
assert.match(helpGuide, /Cloudflare Workers AI[\s\S]*?educational reply[\s\S]*?not engineering or safety approval/i, "Help privacy guide discloses provider, purpose, and limits");

const priorEnabled=process.env.ADIGUN_AI_ENABLED,priorUrl=process.env.ADIGUN_AI_WORKER_URL;
delete process.env.ADIGUN_AI_ENABLED;delete process.env.ADIGUN_AI_WORKER_URL;
assert.deepEqual((await loadAdigunRuntimeConfig(process.cwd())).ai,{enabled:false,workerUrl:"",providerLabel:"Cloudflare Workers AI · Gemma 4 26B A4B"});
process.env.ADIGUN_AI_ENABLED="true";process.env.ADIGUN_AI_WORKER_URL="https://adigunsps-ai.example.workers.dev";
const enabled=await loadAdigunRuntimeConfig(process.cwd());assert.equal(enabled.ai.enabled,true);assert.equal(enabled.ai.workerUrl,process.env.ADIGUN_AI_WORKER_URL);
assert.equal(serializeAdigunRuntimeConfig(enabled).includes("SUPABASE_PUBLISHABLE_KEY"),false);
process.env.ADIGUN_AI_WORKER_URL="http://insecure.example";assert.equal((await loadAdigunRuntimeConfig(process.cwd())).ai.enabled,false,"non-HTTPS endpoint cannot enable hosted AI");
if(priorEnabled===undefined)delete process.env.ADIGUN_AI_ENABLED;else process.env.ADIGUN_AI_ENABLED=priorEnabled;
if(priorUrl===undefined)delete process.env.ADIGUN_AI_WORKER_URL;else process.env.ADIGUN_AI_WORKER_URL=priorUrl;

const wrangler=readFileSync("wrangler.toml","utf8"),workflow=readFileSync(".github/workflows/deploy-pages.yml","utf8");
assert.match(wrangler,/\[ai\]\s+binding\s*=\s*"AI"/);assert.match(wrangler,/fqcbfnktdvqojyezxeis/);assert.match(workflow,/ADIGUN_AI_ENABLED:\s*\$\{\{ vars\.ADIGUN_AI_ENABLED\s*\|\|\s*'true' \}\}/);assert.match(workflow,/ADIGUN_AI_WORKER_URL:\s*\$\{\{ vars\.ADIGUN_AI_WORKER_URL\s*\|\|\s*'https:\/\/adigunsps-ai\.hephzibah-behulah\.workers\.dev' \}\}/);
console.log("Adigun AI Cloudflare Worker auth, consent, pinned model, minimized context, CORS, fallback, runtime config, and Wrangler binding passed.");
