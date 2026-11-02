import { saveRecipe, captureRecipeInputs } from "../src/hmi.js";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import { createAccountService } from "../src/account.js";

const calls = [], responses = [];
const client = { auth:{}, from(table) {
  const chain = {};
  for (const method of ["insert","select","eq","order","limit"]) chain[method] = (...args) => { calls.push({table,method,args}); return chain; };
  chain.single = async () => responses.shift();
  chain.then = (resolve,reject) => Promise.resolve(responses.shift()).then(resolve,reject);
  return chain;
} };
const service=createAccountService(client), owner={id:"owner"}, admin={id:"reviewer",app_metadata:{role:"admin"}};
await assert.rejects(service.submitRecipeApproval({id:"guest",is_anonymous:true},"Pump",{}), /Sign in/);
await assert.rejects(service.submitRecipeApproval(owner,"Pump",{name:"Bad",version:1,values:{Speed:NaN}}), /typed input/);
responses.push({data:{id:"submission",recipe_version:2}});
const recipe={name:"Pump setpoints",version:2,values:{Start:false,Speed:42.5}};
await service.submitRecipeApproval(owner,"Pump",recipe);
const insert=calls.find(call=>call.table==="adigun_recipe_submissions"&&call.method==="insert").args[0];
assert.deepEqual(insert.recipe_values,recipe.values);
assert.ok(!Object.hasOwn(insert,"user_id")&&!Object.hasOwn(insert,"submitted_at"),"identity/time come from the server");
recipe.values.Speed=7; assert.equal(insert.recipe_values.Speed,42.5,"submitted payload is detached from local edits");
await assert.rejects(service.decideRecipeApproval(owner,"submission","approved"), /Administrator/);
await assert.rejects(service.decideRecipeApproval(admin,"submission","pending"), /approved or rejected/);
responses.push({data:{decision:"approved"}}); await service.decideRecipeApproval(admin,"submission","approved","checked");
const decision=calls.find(call=>call.table==="adigun_recipe_decisions"&&call.method==="insert").args[0];
assert.ok(!Object.hasOwn(decision,"reviewer_id")&&!Object.hasOwn(decision,"decided_at"));
for(const status of [null,{decision:"rejected"}]) {
  responses.push({data:{adigun_recipe_decisions:status}});
  await assert.rejects(service.getApprovedRecipe(owner,"submission"), /not been approved/);
}
for(const relation of [{decision:"approved",reviewer_id:"reviewer",decided_at:"now"},[{decision:"approved",reviewer_id:"reviewer",decided_at:"now"}]]) {
  responses.push({data:{id:"submission",recipe_name:"Pump",recipe_version:2,recipe_values:{Speed:42.5},adigun_recipe_decisions:relation}});
  const approved=await service.getApprovedRecipe(owner,"submission");
  assert.equal(approved.values.Speed,42.5); assert.equal(approved.approval.reviewerId,"reviewer");
}
responses.push({error:new Error("RLS denied")}); await assert.rejects(service.listRecipeApprovals(owner),/RLS denied/);
console.log("PASS: recipe approval client gates, server-issued identity/time, immutable snapshots, and approved-only retrieval");

const app=readFileSync("src/app.js","utf8");
const copySource=app.slice(app.indexOf("function recipeApprovalCopy("),app.indexOf("function recipeSnapshotTable("));
const english=runInNewContext(copySource+"recipeApprovalCopy();",{language:"en"});
for(const locale of ["en","de","yo","pcm"]) {const copy=runInNewContext(copySource+"recipeApprovalCopy();",{language:locale}); for(const key of Object.keys(english))assert.ok(copy[key]?.trim(),`${locale} approval text ${key}`);}
const listSource=app.slice(app.indexOf("async function showRecipeApprovals("),app.indexOf("function showRecipeDecision("));
const uiRoot={dataset:{},open:true}; let uiHtml="",accountOpened=0,listCalls=0;
const uiRows=[{id:"own",user_id:"owner",project_name:"Own",recipe_name:"Own pending",recipe_version:1,recipe_values:{Speed:3},submitted_at:"now",adigun_recipe_decisions:null},{id:"other",user_id:"other",project_name:"Other",recipe_name:"Other pending",recipe_version:1,recipe_values:{Speed:4},submitted_at:"now",adigun_recipe_decisions:null},{id:"approved",user_id:"owner",project_name:"Own",recipe_name:"Approved",recipe_version:1,recipe_values:{Speed:5},submitted_at:"now",adigun_recipe_decisions:{decision:"approved"}}];
const uiContext={accountAccess:"member",accountUser:{id:"owner"},language:"en",accountService:{listRecipeApprovals:async()=>{listCalls++;return uiRows;},isAdministrator:()=>true},recipeApprovalCopy:()=>english,recipeSnapshotTable:()=>"snapshot",formatLocaleDateTime:String,escapeHtml:String,escapeAttr:String,modal:(_title,html)=>{uiHtml=html;uiRoot.open=true;uiRoot.dataset.view="";},$:()=>uiRoot,document:{querySelectorAll:()=>[]},showAccount:()=>accountOpened++};
await runInNewContext(listSource+"showRecipeApprovals();",uiContext);
assert.ok(uiHtml.includes('data-submission="other"')); assert.ok(!uiHtml.includes('data-submission="own"'),"self review controls are absent"); assert.ok(uiHtml.includes('data-recipe-import="approved"'));
uiContext.accountService.isAdministrator=()=>false; await runInNewContext(listSource+"showRecipeApprovals();",uiContext); assert.ok(!uiHtml.includes("data-recipe-decision"),"ordinary users get no decision controls");
uiContext.accountAccess="guest"; const beforeCalls=listCalls; await runInNewContext(listSource+"showRecipeApprovals();",uiContext); assert.equal(listCalls,beforeCalls); assert.equal(accountOpened,1);
uiContext.accountAccess="member"; let finishList; uiContext.accountService.listRecipeApprovals=()=>new Promise(resolve=>{finishList=resolve;}); const pending=runInNewContext(listSource+"showRecipeApprovals();",uiContext); uiContext.accountUser={id:"changed-session"}; finishList(uiRows); await pending; assert.ok(!uiHtml.includes("Other pending"),"session change prevents stale results rendering");
uiContext.accountUser={id:"owner"}; const closed=runInNewContext(listSource+"showRecipeApprovals();",uiContext); uiRoot.open=false; finishList(uiRows); await closed; assert.equal(uiRoot.open,false,"closed reviews do not reopen when requests finish");
console.log("PASS: localized recipe review UI, self-review controls, guest gate, and stale session/panel protection");

const importButton={dataset:{recipeImport:"approved"},disabled:false}; let importedSaves=0;
uiContext.project={tags:[{name:"Speed",type:"REAL",role:"input"}],hmi:{recipes:[]}};
Object.assign(uiContext,{hmiModel:()=>uiContext.project.hmi,inferTags:()=>({inputs:["Speed"]}),captureRecipeInputs,saveRecipe,pushHistory:()=>{},persist:()=>importedSaves++,toast:()=>{},showRecipes:()=>{}});
uiContext.document.querySelectorAll=selector=>selector==="[data-recipe-import]"?[importButton]:[];
uiContext.accountService.listRecipeApprovals=async()=>uiRows;
uiContext.accountService.getApprovedRecipe=async()=>({id:"approved",name:"Server snapshot",version:2,values:{Speed:42.5},approval:{reviewerId:"reviewer",decidedAt:"now"}});
await runInNewContext(listSource+"showRecipeApprovals();",uiContext); await importButton.onclick();
assert.equal(uiContext.project.hmi.recipes[0].values.Speed,42.5,"approved import uses immutable server values");
assert.equal(uiContext.project.hmi.recipes[0].sourceApproval.submissionId,"approved"); assert.equal(importedSaves,1);
console.log("PASS: approved snapshot imports as a local copy without applying inputs");
