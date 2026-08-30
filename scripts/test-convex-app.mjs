// Creates one labeled Low-priority migration test and answers it as a one-off.
// Never prints PINs, session cookies, the bridge key, or real situation text.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { search } from '../lib/domain.ts';
const origin='http://localhost:3000';
const settings=parseEnv(await readFile('.dev.vars','utf8'));
async function request(path,body,cookie){const response=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};}
const before=await request('/api/state');assert.equal(before.status,200);assert.equal(before.data.services.storage,'convex','App has not switched to Convex yet.');
assert.match(search(before.data.entries,'customer wants additional discount')[0].entry.decision,/1–10 previous orders → no discount/);
assert.equal(search(before.data.entries,'product arrived damaged but has no unboxing video')[0].entry.id,'2');
const id='migration-convex-smoke-20260831';
const escalation={kind:'escalate',id,submitter:'Gazal',priority:'Low',situation:'MIGRATION TEST ONLY — verify the amber rehearsal checklist reaches the shared Convex database. Not a customer issue.'};
const submissions=await Promise.all([request('/api/state',escalation),request('/api/state',escalation)]);for(const r of submissions)assert.equal(r.status,200);
const created=await request('/api/state');assert.equal(created.data.cases.filter(c=>c.id===id).length,1);
const answer={kind:'answer',caseId:id,decision:'MIGRATION TEST ONLY — shared saving verified. No real-world action required.',reasoning:'Technical migration check; this is not company policy.',exception:'',savePrecedent:false};
const denied=await request('/api/state',{...answer,id:`${id}-denied`});assert.equal(denied.status,401);
const login=await request('/api/auth',{role:'founder',pin:settings.FOUNDER_PIN});assert.equal(login.status,200);assert.ok(login.cookie);
const decisions=await Promise.all(['a','b'].map(suffix=>request('/api/state',{...answer,id:`${id}-answer-${suffix}`},login.cookie)));
assert.deepEqual(decisions.map(r=>r.status).sort(),[200,409],'First saved answer must win.');
const freshClient=await request('/api/state');const saved=freshClient.data.cases.find(c=>c.id===id);assert.equal(saved.answer.decision,answer.decision);assert.equal(saved.precedentId,undefined);assert.equal(freshClient.data.entries.length,before.data.entries.length);
const cloud=new ConvexHttpClient(settings.CONVEX_URL,{logger:false});const remote=await cloud.query(makeFunctionReference('precedent:read'),{secret:settings.PRECEDENT_BRIDGE_SECRET});assert.ok(JSON.parse(remote.data).cases.some(c=>c.id===id&&c.answer?.decision===answer.decision));
const stale=await cloud.mutation(makeFunctionReference('precedent:compareAndSwap'),{secret:settings.PRECEDENT_BRIDGE_SECRET,revision:remote.revision-1,data:remote.data});assert.equal(stale.saved,false);
console.log(JSON.stringify({storage:'convex',searchPassed:true,duplicateSubmissionBlocked:true,teamCannotAnswer:true,founderLoginPassed:true,firstAnswerWins:true,secondClientSeesAnswer:true,oneOffNotSearchable:true,cloudPersistenceVerified:true,staleWriteBlocked:true,testCase:id,emailSent:false}));
