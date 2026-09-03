import assert from 'node:assert/strict';
const base=process.argv[2]||'http://127.0.0.1:3000';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Local test only');
let checks=0;
{const response=await fetch(base+'/api/metrics');assert.equal(response.status,200);const metrics=await response.json();assert.deepEqual(Object.keys(metrics).sort(),['casesSubmitted','decisionsApproved','feedback','precedentsMatched']);assert.deepEqual(Object.keys(metrics.feedback).sort(),['no','not_sure','yes']);for(const value of [metrics.casesSubmitted,metrics.decisionsApproved,metrics.precedentsMatched,...Object.values(metrics.feedback)])assert.equal(typeof value,'number');checks+=8;}
for(const cookie of ['', 'precedent_session=founder.invalid.fake','precedent_session=cos.9999999999999.'+'0'.repeat(64)]){
 const guide=await fetch(base+'/api/guide',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({entryId:'1'})});assert.equal(guide.status,401);checks++;
 const response=await fetch(base+'/api/state?role=founder',{headers:{cookie}});assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);const state=await response.json();assert.equal(state.mode,'demo');assert.equal(state.entries.length,14);assert.equal(state.entries.filter(e=>e.status==='Active').length,13);assert.deepEqual(state.cases,[]);assert.ok(state.entries.every(e=>e.id.startsWith('fictional-policy-')));checks++;
 for(const kind of ['escalate','reportFeedback','answer','review','promote','replace','route','resolveFeedback']){const r=await fetch(base+'/api/state',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify({kind,id:'public-security-probe',role:'founder',submitter:'forged-team-member'})});assert.equal(r.status,401,kind);checks++;}
}
for(const method of ['PUT','PATCH','DELETE']){assert.equal((await fetch(base+'/api/state',{method})).status,405);checks++;}
assert.equal((await fetch(base+'/api/jobs',{method:'POST'})).status,401);checks++;
console.log(JSON.stringify({checks,passed:checks,failed:0,publicWritesDenied:true,privateRecordsReturned:false}));
