import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {founderDemoSnapshot} from '../lib/founder-demo-data.ts';
import {applyAction} from '../lib/domain-actions.ts';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
test('analytics initializes once from environment and skips localhost by default',()=>{
 const source=read('../instrumentation-client.ts');
 assert.match(source,/NEXT_PUBLIC_POSTHOG_KEY/);assert.match(source,/NEXT_PUBLIC_POSTHOG_HOST/);
 assert.match(source,/localhost\|127/);assert.match(source,/NEXT_PUBLIC_POSTHOG_ALLOW_LOCALHOST==='true'/);
 assert.match(source,/autocapture:false/);assert.match(source,/disable_session_recording:true/);
 assert.doesNotMatch(source,/phc_[A-Za-z0-9]/);
});
test('capture helper accepts only the four approved event shapes',()=>{
 const source=read('../lib/analytics.ts');
 for(const event of ['case_submitted','decision_approved','precedent_matched','feedback_given'])assert.match(source,new RegExp(event));
 for(const forbidden of ['caseId','customer','orderId','situation','reasoning','note'])assert.doesNotMatch(source,new RegExp(forbidden,'i'));
 assert.match(source,/captureEvent\(event:AnalyticsEvent\)/);assert.doesNotMatch(source,/captureEvent\([^)]*,/);
 assert.match(source,/\{feedback:value\}/);
});
test('case feedback is saved once against an answered case',()=>{
 const state={...founderDemoSnapshot(),notices:[]};const item=state.cases.find(c=>c.answer);
 const saved=applyAction(state,{kind:'caseFeedback',id:'feedback-1',caseId:item.id,value:'not_sure',note:'Needs a clearer condition.'},'founder',123);
 assert.deepEqual(saved.cases.find(c=>c.id===item.id).callFeedback,{value:'not_sure',note:'Needs a clearer condition.',at:123});
 assert.throws(()=>applyAction(saved,{kind:'caseFeedback',id:'feedback-2',caseId:item.id,value:'yes',note:''},'founder',124),/already recorded/);
});
