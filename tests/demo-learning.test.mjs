import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { emptyLearningState, submitLearningCase, approveLearningCase, findLearnedPrecedent, learningExample } from '../lib/demo-learning.ts';
const approval={title:learningExample.title,decision:learningExample.decision,reasoning:learningExample.reasoning,conditions:learningExample.conditions};
test('learning is isolated from staff data, network and persistent browser storage',()=>{
  for(const file of ['../lib/demo-learning.ts','../components/demo-learning.tsx','../components/product-demonstration.tsx']){
    const source=readFileSync(new URL(file,import.meta.url),'utf8');
    assert.doesNotMatch(source,/from.*(?:store|seed|auth|domain-actions|discount-policy)|fetch\(|localStorage|sessionStorage/);
  }
  assert.equal(emptyLearningState().precedents.length,0);
});
test('animation and landing have accessible static fallbacks without media downloads',()=>{
  const landing=readFileSync(new URL('../components/landing.tsx',import.meta.url),'utf8');
  const animation=readFileSync(new URL('../components/product-demonstration.tsx',import.meta.url),'utf8');
  const css=readFileSync(new URL('../app/product.css',import.meta.url),'utf8');
  assert.match(landing,/Turn one founder decision into a rule your whole team can reuse\./);
  assert.match(landing,/onClick=\{onDemo\}>Try a demo decision/);
  assert.match(animation,/FICTIONAL DEMONSTRATION/);
  assert.match(animation,/className="static-story"/);
  assert.match(css,/animation:scentira-demo-stage 10s linear infinite/);
  assert.match(css,/min-width:761px.*prefers-reduced-motion:no-preference/);
  assert.doesNotMatch(animation,/<audio|<video|<img|<iframe/);
});
test('a cold public open starts on the swapped-orders learning loop',()=>{
  const app=readFileSync(new URL('../components/precedent-app.tsx',import.meta.url),'utf8');
  assert.match(app,/const \[showLanding,\s*setShowLanding\]\s*=\s*useState\(false\)/);
  assert.match(learningExample.situation,/orders were swapped/i);
});
test('complete loop: unmatched → pending → approval → differently worded decision with source',()=>{
  let state=emptyLearningState();
  assert.equal(findLearnedPrecedent(state.precedents,learningExample.situation),null);
  state=submitLearningCase(state,learningExample.situation);
  assert.equal(state.cases[0].status,'Pending founder approval');
  assert.equal(findLearnedPrecedent(state.precedents,learningExample.paraphrase),null);
  state=approveLearningCase(state,state.cases[0].id,approval);
  const result=findLearnedPrecedent(state.precedents,learningExample.paraphrase);
  assert.equal(result.precedent.decision,approval.decision);
  assert.equal(result.precedent.sourceCase.id,state.cases[0].id);
  assert.equal(result.precedent.status,'Approved');
  assert.equal(result.precedent.approvedBy,'Fictional demo approval');
  assert.equal(result.precedent.approvalDate,'1 September 2026');
});
test('approval does not train or hardcode the decision returned',()=>{
  let state=submitLearningCase(emptyLearningState(),learningExample.situation);
  state=approveLearningCase(state,state.cases[0].id,{...approval,decision:'Ask the customer to choose the two gift labels first.'});
  assert.equal(findLearnedPrecedent(state.precedents,learningExample.paraphrase).precedent.decision,'Ask the customer to choose the two gift labels first.');
});
test('a short rewording finds a newly approved influencer precedent',()=>{
  let state=submitLearningCase(emptyLearningState(),'How much do we charge for influencer collab?');
  state=approveLearningCase(state,state.cases[0].id,{title:'Paid influencer collaboration',decision:'Ask for the creator rate card.',reasoning:'Confirm the commercial request first.',conditions:'An influencer collaboration where the creator asks for payment.'});
  assert.equal(findLearnedPrecedent(state.precedents,'Are we doing influencer collaboration?')?.precedent.id,'demo-precedent-1');
});
test('pending, unrelated, ambiguous and contradictory cases are not applied',()=>{
  let state=submitLearningCase(emptyLearningState(),learningExample.situation);
  assert.throws(()=>approveLearningCase(state,state.cases[0].id,{...approval,conditions:''}));
  state=approveLearningCase(state,state.cases[0].id,approval);
  const precedent=state.precedents[0];
  assert.equal(findLearnedPrecedent([{...precedent,status:'Pending founder approval'}],learningExample.paraphrase),null);
  assert.equal(findLearnedPrecedent(state.precedents,'Please split the gift parcels after packing. It is already packed.'),null);
  assert.equal(findLearnedPrecedent(state.precedents,'The customer wants a refund for a leaking bottle.'),null);
  assert.equal(findLearnedPrecedent([precedent,{...precedent,id:'demo-precedent-2'}],learningExample.paraphrase),null);
  assert.throws(()=>approveLearningCase(state,state.cases[0].id,approval));
});
