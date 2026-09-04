import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');

test('first-screen copy states the outcome plainly',async()=>{
 const [learning,landing]=await Promise.all([read('../components/demo-learning.tsx'),read('../components/landing.tsx')]);
 for(const source of [learning,landing]){
  assert.match(source,/Find the founder-approved answer for a new exception/);
  assert.match(source,/Describe the situation, check the conditions, apply or escalate\./);
 }
});

test('meaning search explains the first model load and later checks',async()=>{
 const [app,learning,demo]=await Promise.all([read('../components/precedent-app.tsx'),read('../components/demo-learning.tsx'),read('../components/public-demo.tsx')]);
 for(const source of [app,learning,demo]){
  assert.match(source,/Loading the matcher for your first search\. This can take up to 10 seconds/);
  assert.match(source,/Checking your situation/);
  assert.match(source,/matcherStarted/);
  assert.match(source,/<Spinner/);
 }
});

test('zero real usage is hidden and the panel follows the demo',async()=>{
 const [metrics,demo]=await Promise.all([read('../components/usage-metrics.tsx'),read('../components/public-demo.tsx')]);
 assert.match(metrics,/total===0\)return null/);
 assert.ok(demo.lastIndexOf('<UsageMetricsPanel')>demo.indexOf('<DemoLearningEmployee'));
});

test('applied demo decisions use local one-tap feedback',async()=>{
 const [feedback,learning,demo]=await Promise.all([read('../components/decision-feedback.tsx'),read('../components/demo-learning.tsx'),read('../components/public-demo.tsx')]);
 for(const label of ['Worked',"Didn't work",'Not sure'])assert.ok(feedback.includes(label));
 assert.match(feedback,/if \(selected \|\| busy\) return/);
 assert.match(learning,/LearnedDecisionCard[\s\S]*DecisionFeedback/);
 assert.match(demo,/EXAMPLE DECISION[\s\S]*DecisionFeedback/);
 assert.doesNotMatch(feedback,/fetch\(|\/api\//);
});

test('learning search moves its result into view',async()=>{
 const learning=await read('../components/demo-learning.tsx');
 assert.match(learning,/resultRef\.current\?\.scrollIntoView/);
 assert.match(learning,/aria-live="polite"/);
});

test('every ordinary matched precedent shows conditions and its decision immediately',async()=>{
 const [app,selector]=await Promise.all([read('../components/precedent-app.tsx'),read('../components/condition-selector.tsx')]);
 assert.match(app,/ConditionSummary/);
 assert.match(selector,/Conditions and decision/);
 assert.match(selector,/condition-row/);
});

test('matched decisions show comparison context and can be rejected safely',async()=>{
 const [app,learning,demo,selector]=await Promise.all([read('../components/precedent-app.tsx'),read('../components/demo-learning.tsx'),read('../components/public-demo.tsx'),read('../components/condition-selector.tsx')]);
 for(const source of [app,learning,demo]){
  assert.match(source,/Closest approved decision/);
  assert.match(source,/Check that this situation matches yours before applying\./);
  assert.match(source,/This situation is new\. Send it to the founder to get an answer\. Once answered, everyone/);
 }
 for(const source of [learning,demo,selector])assert.match(source,/This is not my situation, ask the founder/);
 assert.match(app,/onEscalate/);
});

test('a rejected match continues into the existing real and fictional escalation flows',async()=>{
 const [app,learning,demo]=await Promise.all([read('../components/precedent-app.tsx'),read('../components/demo-learning.tsx'),read('../components/public-demo.tsx')]);
 assert.match(app,/Send to the founder/);
 assert.match(app,/onClick=\{\(\) => escalate\(matches\[0\]\?\.entry\)\}/);
 assert.match(learning,/Send fictional request to the founder/);
 assert.match(demo,/Submit fictional request/);
 for(const source of [app,learning,demo])assert.match(source,/escalation_submitted/);
 assert.match(learning,/options\.length===1\?options\[0\]\.id/);
});

test('applied view keeps the selected condition and never leaves an empty conditions panel',async()=>{
 const learning=await read('../components/demo-learning.tsx');
 assert.match(learning,/aria-label="Applied condition"/);
 assert.match(learning,/\(!applied \|\| appliedCondition\?\.situation\)/);
 assert.doesNotMatch(learning,/\{applied \? null : null\}/);
 assert.match(learning,/<h4>DECISION<\/h4>[\s\S]*appliedCondition\?\.decision/);
 assert.match(learning,/<strong>General rule<\/strong>[\s\S]*entry\.decision/);
});

test('phone demo compacts access, copy, input and secondary actions without changing desktop',async()=>{
 const [header,learning,css]=await Promise.all([read('../components/demo-header.tsx'),read('../components/demo-learning.tsx'),read('../app/product.css')]);
 assert.match(header,/mobile-access-menu/);assert.match(header,/Founder \(demo\)/);assert.match(header,/CoS \(demo\)/);assert.match(header,/Staff sign-in/);
 assert.match(learning,/mobile-demo-promise/);assert.match(css,/@media\(max-width:640px\)/);assert.match(css,/min-height:68px;height:68px/);assert.match(css,/learning-actions\{flex-wrap:nowrap/);
 assert.match(css,/condition-mobile-label\{[^}]*color:var\(--foreground\)/);
 assert.match(css,/condition-choice\.selected \.condition-mobile-label\{color:var\(--foreground\)\}/);
});

test('Founder and CoS demo queues explain their different jobs',async()=>{
 const app=await read('../components/precedent-app.tsx');
 assert.match(app,/Review CoS answers and create precedents\./);
 assert.match(app,/Resolve exceptions and escalate uncertain calls\./);
});
