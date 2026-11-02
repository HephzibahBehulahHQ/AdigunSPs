import { runInNewContext } from "node:vm";
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
const aiEnv={...env,AI:{run:async(model,options)=>{modelCalls++;selectedModel=model;assert.equal(options.messages.length,2);assert.equal(options.max_completion_tokens,1024);assert.deepEqual(options.chat_template_kwargs,{enable_thinking:false});assert.equal(options.stream,false);return {response:"Reviewed PLC explanation."};}}};

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
const guardedAnswer=await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"access-token"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>Response.json({answer:"Cloudflare Workers AI uses Gemma and Llama 3.1 8B. Supabase endpoint: https://demo.supabase.co"})});
assert.doesNotMatch(guardedAnswer.answer,/Cloudflare|Workers AI|Gemma|Llama|Supabase|endpoint|workers\.dev|supabase\.co/i,"hosted response cannot disclose backend provider or API details in chat");
const rejected=await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"access-token"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>Response.json({error:"signed-in-account-required"},{status:401})});
assert.equal(rejected.error,"signed-in-account-required","Worker authentication reason is preserved for useful guidance");
assert.equal((await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:null},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>{throw new Error("must not call");}})).error,"authenticated-session-required");
assert.equal((await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"x"}},error:null})}},question:"help",project:{},consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>{throw new Error("offline");}})).error,"hosted-ai-unavailable","network failure preserves local fallback");
assert.deepEqual(Object.keys(adigunAiRemoteLabels("en")).sort(),["accountRequired","cancel","cancelled","consent","failed","hosted","pending","serviceUnavailable","timeout","unavailable"]);
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
assert.deepEqual((await loadAdigunRuntimeConfig(process.cwd())).ai,{enabled:false,workerUrl:"",providerLabel:"Cloudflare Workers AI"});
process.env.ADIGUN_AI_ENABLED="true";process.env.ADIGUN_AI_WORKER_URL="https://adigunsps-ai.example.workers.dev";
const enabled=await loadAdigunRuntimeConfig(process.cwd());assert.equal(enabled.ai.enabled,true);assert.equal(enabled.ai.workerUrl,process.env.ADIGUN_AI_WORKER_URL);
assert.equal(serializeAdigunRuntimeConfig(enabled).includes("SUPABASE_PUBLISHABLE_KEY"),false);
process.env.ADIGUN_AI_WORKER_URL="http://insecure.example";assert.equal((await loadAdigunRuntimeConfig(process.cwd())).ai.enabled,false,"non-HTTPS endpoint cannot enable hosted AI");
if(priorEnabled===undefined)delete process.env.ADIGUN_AI_ENABLED;else process.env.ADIGUN_AI_ENABLED=priorEnabled;
if(priorUrl===undefined)delete process.env.ADIGUN_AI_WORKER_URL;else process.env.ADIGUN_AI_WORKER_URL=priorUrl;

const wrangler=readFileSync("wrangler.toml","utf8"),workflow=readFileSync(".github/workflows/deploy-pages.yml","utf8");
assert.match(wrangler,/\[ai\]\s+binding\s*=\s*"AI"/);assert.match(wrangler,/fqcbfnktdvqojyezxeis/);assert.match(workflow,/ADIGUN_AI_ENABLED:\s*\$\{\{ vars\.ADIGUN_AI_ENABLED\s*\|\|\s*'true' \}\}/);assert.match(workflow,/ADIGUN_AI_WORKER_URL:\s*\$\{\{ vars\.ADIGUN_AI_WORKER_URL\s*\|\|\s*'https:\/\/adigunsps-ai\.hephzibah-behulah\.workers\.dev' \}\}/);
console.log("Adigun AI Cloudflare Worker auth, consent, pinned model, minimized context, CORS, fallback, runtime config, and Wrangler binding passed.");

// Production custom-domain requests must survive CORS without permitting other origins.
const deployedOrigins=wrangler.match(/ADIGUN_AI_ALLOWED_ORIGINS\s*=\s*"([^"]+)"/)[1];
assert.ok(deployedOrigins.split(",").includes("https://adigunsps.hephzibahbehulah.com"));
const productionEnv={...aiEnv,ADIGUN_AI_ALLOWED_ORIGINS:deployedOrigins};
const productionOrigin="https://adigunsps.hephzibahbehulah.com";
for(const method of ["OPTIONS","POST"]){
 const result=await testWorker.fetch(makeRequest(payload,{method,origin:productionOrigin}),productionEnv);
 assert.equal(result.status,method==="OPTIONS"?204:200);
 assert.equal(result.headers.get("access-control-allow-origin"),productionOrigin);
}
assert.equal((await testWorker.fetch(makeRequest(payload,{method:"OPTIONS",origin:"https://attacker.example"}),productionEnv)).status,403);
assert.equal((await testWorker.fetch(makeRequest(payload,{token:null,origin:productionOrigin}),productionEnv)).status,401);

const chatCompletion=await testWorker.fetch(makeRequest(payload),{...aiEnv,AI:{run:async()=>({choices:[{message:{role:"assistant",content:"PLC inputs form a consistent scan snapshot."}}]})}});
assert.equal(chatCompletion.status,200);
assert.equal((await chatCompletion.json()).answer,"PLC inputs form a consistent scan snapshot.");
for(const malformed of [{choices:[]},{choices:[{message:{content:null}}]},{choices:[{message:{content:{text:"invalid"}}}]}]){
 const result=await testWorker.fetch(makeRequest(payload),{...aiEnv,AI:{run:async()=>malformed}});
 assert.equal(result.status,502);
 assert.equal((await result.json()).error,"empty-model-response");
}
for(const locale of ["en","de","yo","pcm"]) assert.ok(!/not sent|nicht gesendet|no send/.test(adigunAiRemoteLabels(locale).unavailable),"network/model failure must not claim no transmission");

const warningLines=[];const originalWarn=console.warn;
try {
 console.warn=(...args)=>warningLines.push(args);
 await askAdigunHostedAI({client:{auth:{getSession:async()=>({data:{session:{access_token:"private-token"}}})}},question:"private-question",project:sourceProject,consent:true,workerUrl:"https://worker.example",fetchImpl:async()=>Response.json({error:"private-provider-detail",diagnostic:"private-diagnostic"},{status:502})});
 assert.deepEqual(warningLines,[["Hosted AI request failed",502,"unclassified-error","no-diagnostic"]]);
 assert.ok(!JSON.stringify(warningLines).includes("private-"));
} finally { console.warn=originalWarn; }

for (const [modelResult,diagnostic] of [[{choices:[{finish_reason:"length",message:{content:""}}]},"output-limit"],[{choices:[{message:{content:""}}]},"empty-content"],[{response:null},"legacy-content"],[Response.json({choices:[]}),"response-object"],[{result:{}},"wrapped-result"],[{},"unexpected-shape"]]) {
 const res=await testWorker.fetch(makeRequest(payload),{...aiEnv,AI:{run:async()=>modelResult}});
 assert.equal(res.status,502);const body=await res.json();assert.equal(body.diagnostic,diagnostic);
 assert.deepEqual(Object.keys(body).sort(),["diagnostic","error"]);
}

const permanentClient={auth:{getSession:async()=>({data:{session:{access_token:"test-token"}}})}};
const requestBase={client:permanentClient,question:"Explain relay contacts",project:{},consent:true,workerUrl:"https://worker.example"};
let stalledSignal;
assert.equal((await askAdigunHostedAI({...requestBase,timeoutMs:10,fetchImpl:(_url,options)=>{stalledSignal=options.signal;return new Promise(()=>{});}})).error,"hosted-ai-timeout");
assert.equal(stalledSignal.aborted,true,"timeout aborts the underlying fetch signal even if transport ignores it");
let authFetches=0;
assert.equal((await askAdigunHostedAI({...requestBase,client:{auth:{getSession:()=>new Promise(()=>{})}},timeoutMs:10,fetchImpl:()=>{authFetches++;}})).error,"hosted-ai-timeout");assert.equal(authFetches,0);
assert.equal((await askAdigunHostedAI({...requestBase,timeoutMs:10,fetchImpl:async()=>({ok:true,json:()=>new Promise(()=>{})})})).error,"hosted-ai-timeout","response-body stalls are also bounded");
const alreadyCancelled=new AbortController();alreadyCancelled.abort();
assert.equal((await askAdigunHostedAI({...requestBase,signal:alreadyCancelled.signal,fetchImpl:()=>{throw Error("must not send");}})).error,"hosted-ai-cancelled");
const cancelPending=new AbortController();
const cancellation=askAdigunHostedAI({...requestBase,signal:cancelPending.signal,fetchImpl:()=>new Promise(()=>{})});cancelPending.abort();assert.equal((await cancellation).error,"hosted-ai-cancelled");
let successSignal;const listenerSet=new Set();const observedSignal={aborted:false,addEventListener:(_type,fn)=>listenerSet.add(fn),removeEventListener:(_type,fn)=>listenerSet.delete(fn)};
assert.equal((await askAdigunHostedAI({...requestBase,signal:observedSignal,timeoutMs:20,fetchImpl:async(_url,options)=>{successSignal=options.signal;return Response.json({answer:"A relay contact follows its coil."});}})).answer,"A relay contact follows its coil.");
await new Promise(resolve=>setTimeout(resolve,30));assert.equal(successSignal.aborted,false,"completed request clears its deadline");assert.equal(listenerSet.size,0,"completed request removes external abort listener");
assert.equal(adigunAiRemoteErrorLabel("hosted-ai-timeout"),"timeout");assert.equal(adigunAiRemoteErrorLabel("hosted-ai-cancelled"),"cancelled");
for(const locale of ["en","de","yo","pcm"])for(const key of ["pending","cancel","timeout","cancelled"]){assert.ok(adigunAiRemoteLabels(locale)[key]);assert.doesNotMatch(adigunAiRemoteLabels(locale)[key],/Cloudflare|Workers AI|Supabase|Gemma|Llama/i);}

const uiApp=readFileSync("src/app.js","utf8");
const askStart=uiApp.indexOf("  const ask = async (question) => {");const askEnd=uiApp.indexOf('  $("#adigunAiCancel").onclick',askStart);
assert.ok(askStart>=0&&askEnd>askStart);
function requestUiFixture(){
 let resolveReply;let calls=0;const renders=[],busy=[];
 const context={AbortController,adigunAiRequest:null,copilotGoalPending:false,project:{id:"p1"},accountUser:{id:"u1"},supabaseClient:{},hostedAI:{workerUrl:"https://worker.example"},document:{querySelector:()=>({checked:true})},validateProject:()=>[],adigunAiMessages:[],remoteCopy:adigunAiRemoteLabels("en"),adigunAiRemoteErrorLabel,updateAdigunAIRequestUi:()=>busy.push(Boolean(context.adigunAiRequest)),askAdigunHostedAI:()=>{calls++;return new Promise(resolve=>{resolveReply=resolve;});},showAdigunAI:options=>renders.push(options)};
 runInNewContext(uiApp.slice(askStart,askEnd)+";this.ask=ask;",context);
 return {context,busy,renders,resolve:result=>resolveReply(result),calls:()=>calls};
}
const requestUi=requestUiFixture();const firstRequest=requestUi.context.ask("Explain relay contacts");await requestUi.context.ask("Explain relay contacts again");assert.equal(requestUi.calls(),1,"rapid submissions send only once");
requestUi.resolve({answer:"Relay explanation"});await firstRequest;assert.equal(requestUi.context.adigunAiRequest,null);assert.deepEqual(requestUi.busy,[true,false]);assert.equal(requestUi.context.adigunAiMessages.length,2);assert.equal(requestUi.renders[0].reveal,false,"completion does not reopen or expand the Bot");
for(const change of ["closed","project","reload","account"]){const fixture=requestUiFixture();const pending=fixture.context.ask("Explain relay contacts");if(change==="closed")fixture.context.adigunAiRequest.closed=true;if(change==="project")fixture.context.project={id:"p2"};if(change==="reload")fixture.context.project={id:"p1"};if(change==="account")fixture.context.accountUser={id:"u2"};fixture.resolve({answer:"Stale reply"});await pending;assert.equal(fixture.context.adigunAiMessages.length,0,`${change} context discards late replies`);assert.equal(fixture.context.adigunAiRequest,null);}
const failedUi=requestUiFixture();const failedRequest=failedUi.context.ask("Explain relay contacts");failedUi.resolve({error:"hosted-ai-timeout"});await failedRequest;assert.equal(failedUi.context.adigunAiMessages[1].text,adigunAiRemoteLabels("en").timeout);assert.equal(failedUi.context.adigunAiRequest,null);

const formFields=[{id:"send"},{id:"adigunAiQuestion"},{id:"adigunAiCancel"}];const progress={},cancelButton={},consentField={},formAttributes={};
const uiFields={"#adigunAiForm":{setAttribute:(key,value)=>formAttributes[key]=value,querySelectorAll:()=>formFields},"#adigunAiProgress":progress,"#adigunAiCancel":cancelButton,"#adigunRemoteConsent":consentField};
const busyContext={$:id=>uiFields[id],adigunAiRequest:{},language:"en",adigunAiRemoteLabels};runInNewContext(uiApp.slice(uiApp.indexOf("function updateAdigunAIRequestUi("),uiApp.indexOf("function showAdigunAI(")),busyContext);busyContext.updateAdigunAIRequestUi();assert.equal(formAttributes["aria-busy"],"true");assert.equal(progress.hidden,false);assert.equal(cancelButton.hidden,false);assert.equal(consentField.disabled,true);assert.deepEqual(formFields.map(f=>f.disabled),[true,true,false]);busyContext.adigunAiRequest=null;busyContext.updateAdigunAIRequestUi();assert.equal(progress.hidden,true);assert.equal(cancelButton.hidden,true);assert.equal(consentField.disabled,false);assert.deepEqual(formFields.map(f=>f.disabled),[false,false,false]);


let windowOpens=0;const contentSlot={},titleSlot={};const panelMock={querySelector:()=>contentSlot};const modalContext={$:id=>id==="#adigunBotWindow"?panelMock:titleSlot,adigunAiLabels:()=>({title:"Bot"}),language:"en",adigunBotWindow:{open:()=>windowOpens++}};
const modalStart=uiApp.indexOf("function modal(title, content, options");runInNewContext(uiApp.slice(modalStart,uiApp.indexOf("\n",modalStart)),modalContext);
modalContext.modal("Bot","reply",{reveal:false});assert.equal(windowOpens,0);assert.equal(contentSlot.innerHTML,"reply");modalContext.modal("Bot","opened");assert.equal(windowOpens,1);
let windowOptions;const closingController=new AbortController();const closeContext={$:()=>({}),key:"bot",showAdigunAI:()=>{},adigunAiRequest:{closed:false,controller:closingController},createFloatingWindow:options=>{windowOptions=options;return {};}};
const wireStart=uiApp.indexOf("  adigunBotWindow = createFloatingWindow(");runInNewContext(uiApp.slice(wireStart,uiApp.indexOf("\n",wireStart)),closeContext);windowOptions.onClose();assert.equal(closeContext.adigunAiRequest.closed,true);assert.equal(closingController.signal.aborted,true,"closing the actual Bot window wiring aborts the request");

console.log("PASS: bounded auth/fetch/body deadlines, cancellation, cleanup, single-flight UI, progress controls, and stale-reply suppression");
