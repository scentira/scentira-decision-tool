import test from 'node:test';
import assert from 'node:assert/strict';
import { findConceptMatch } from '../lib/semantic-match.ts';
import { approveLearningCase, emptyLearningState, findLearnedPrecedent, learningExample, submitLearningCase } from '../lib/demo-learning.ts';
import { demoEntries } from '../lib/public-demo.ts';

const precedent = {
  id: 'demo-precedent-1',
  title: 'Swapped orders at the final delivery station',
  summary: 'Confirmed swapped orders; one parcel is at the final delivery station and has not been delivered.',
};
const sameSituation = [
  'Two orders were swapped and one has reached the final delivery station. Should it be returned to origin, or delivered and collected afterward?',
  'A parcel meant for another buyer is waiting at the destination depot. Should we send it back now or finish delivery and retrieve it later?',
  'The labels got mixed between two purchases. One package is already with the last local branch. Do we reverse it or hand it over and pick it up afterward?',
  "Two customers' dispatches were crossed, and one consignment is at the destination center. Is immediate return safer than delivery followed by recovery?",
];

test('proof 1: exact wording uses the existing word matcher', () => {
  let state=submitLearningCase(emptyLearningState(),learningExample.situation);
  state=approveLearningCase(state,state.cases[0].id,{title:learningExample.title,decision:learningExample.decision,reasoning:learningExample.reasoning,conditions:learningExample.conditions});
  assert.equal(findLearnedPrecedent(state.precedents,sameSituation[0]).precedent.id,precedent.id);
});
for (const [index, query] of sameSituation.slice(1).entries()) {
  test(`proof ${index + 2}: free concept fallback finds the approved precedent`, () => {
    assert.equal(findConceptMatch(query,[precedent])?.id,precedent.id);
  });
}
test('proof 5: unrelated situation returns no precedent', () => {
  assert.equal(findConceptMatch('An influencer published the wrong launch discount code. Should the campaign post be corrected?',[precedent]),null);
});
test('weak and ambiguous concept matches are rejected', () => {
  assert.equal(findConceptMatch('The package reached a depot.',[precedent]),null);
  assert.equal(findConceptMatch(sameSituation[1],[precedent,{...precedent,id:'demo-precedent-2'}]),null);
});

const libraryCandidates=demoEntries.filter(entry=>entry.status==='Active').map(entry=>({id:entry.id,title:entry.title,summary:`${entry.situation} ${entry.exception}`}));
const policyRewordings=[
  ['fictional-policy-01','A loyal repeat buyer with more than ten purchases wants an extra discount on top of the current offer.'],
  ['fictional-policy-02','The bottle arrived cracked, but the buyer has no opening recording.'],
  ['fictional-policy-03','The customer sprayed the perfume once and now says the scent is not for them.'],
  ['fictional-policy-04','A walk-in customer at our store is asking for a lower price.'],
  ['fictional-policy-05','A return package came back filled with rocks and the courier team has stopped replying.'],
  ['fictional-policy-07','The buyer threatens to expose the complaint in an Instagram post.'],
  ['fictional-policy-08','The site says the item is available, but there is no physical stock.'],
  ['fictional-policy-09','Only one piece remains; it was bought online while a walk-in customer wants it too.'],
  ['fictional-policy-10','A regular buyer wants a wholesale quantity of equipment we do not normally sell separately.'],
  ['fictional-policy-11','An employee has requested time off on Monday.'],
  ['fictional-policy-12b','The parcel is already sealed and the customer needs to correct the delivery address.'],
  ['fictional-policy-13','A university festival has asked us for event funding and brand support.'],
  ['fictional-policy-14','A content creator is requesting a fee for the partnership and reel.'],
];
for(const [expectedId,query] of policyRewordings){
  test(`different wording finds ${expectedId}`,()=>assert.equal(findConceptMatch(query,libraryCandidates)?.id,expectedId));
}
