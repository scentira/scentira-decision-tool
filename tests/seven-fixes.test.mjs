import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {customerTypeMatches} from '../lib/customer-type.ts';
import {demoEntries} from '../lib/public-demo.ts';
import {mondayLeaveConditions,mondayLeaveDecision} from '../lib/monday-leave.ts';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');

test('untagged precedents default to direct and reseller searches reject them after matching',()=>{
 assert.equal(customerTypeMatches({},'direct'),true);
 assert.equal(customerTypeMatches({},'reseller'),false);
 const discount=demoEntries.find(entry=>entry.id==='fictional-policy-01');
 assert.equal(discount.customerType,'direct');
 assert.equal(customerTypeMatches(discount,'reseller'),false);
});

test('condition confirmation requires every Yes and offers founder escalation',async()=>{
 const source=await read('../components/condition-selector.tsx');
 assert.match(source,/Yes.*No.*Not sure/s);
 assert.match(source,/checks\.every\(\(_,index\)=>answers\[index\]==='yes'\)/);
 assert.match(source,/disabled=\{!allYes\|\|busy\}/);
 assert.match(source,/>Send to founder</);
});

test('Monday leave presents one concrete checklist without the contradictory action',()=>{
 assert.equal(mondayLeaveConditions.length,4);
 assert.match(mondayLeaveConditions.join(' '),/Days covered.*Lookback window.*Verification.*Emergency exception/);
 assert.doesNotMatch(mondayLeaveDecision,/Normally do not approve/i);
 const entry=demoEntries.find(item=>item.id==='fictional-policy-11');
 assert.equal(entry.decision,mondayLeaveDecision);
});

test('privacy, navigation, public steps and honest notification copy are present',async()=>{
 const [header,app,demo,queue]=await Promise.all([read('../components/demo-header.tsx'),read('../components/precedent-app.tsx'),read('../components/demo-learning.tsx'),read('../components/decision-queue.tsx')]);
 assert.match(header,/Your company data/);assert.match(header,/stored in Convex/);assert.match(header,/titles and summaries/);assert.match(header,/In-app deletion is not available/);
 assert.match(demo,/Handle a new case|demo-steps/);assert.match(app,/Search precedents/);assert.match(queue,/Founder queue/);
 assert.match(demo,/Search an approved precedent/);assert.match(demo,/Gazal/);assert.match(demo,/gazal@scentira\.in/);
 assert.match(app,/No response time is guaranteed\. Email delivery is not connected/);
 assert.match(demo,/No response time is guaranteed; this demo does not send notifications/);
});

test('matching implementation and ONNX setup retain their existing paths',async()=>{
 const [meaning,semantic,domain]=await Promise.all([read('../lib/meaning-match-client.ts'),read('../lib/semantic-match.ts'),read('../lib/domain.ts')]);
 assert.match(meaning,/findConceptMatch\(query,precedents\)/);
 assert.match(meaning,/wasmPaths=RUNTIME_SOURCE/);
 assert.doesNotMatch(meaning,/customerTypeMatches/);
 assert.doesNotMatch(semantic,/customerTypeMatches|customerType/);
 assert.doesNotMatch(domain,/customerTypeMatches/);
});
