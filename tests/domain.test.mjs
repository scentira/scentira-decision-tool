import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, search, publicRisk, queue } from '../lib/domain.ts';
import { seedEntries } from '../lib/seed.ts';

const fresh = () => ({entries: structuredClone(seedEntries), cases: [], notices: []});
const escalate = (id='case-1', extra={}) => ({kind:'escalate',id,situation:'A dispatch deadline today needs a new decision',priority:'High',submitter:'Neha',...extra});
const answer = (extra={}) => ({kind:'answer',id:'answer-1',caseId:'case-1',decision:'Hold dispatch',reasoning:'Check the deadline with the customer',exception:'',savePrecedent:false,...extra});

test('seed records have correct statuses and no duplicate IDs',()=>{assert.equal(seedEntries.length,15);assert.equal(new Set(seedEntries.map(e=>e.id)).size,15);assert.equal(seedEntries.filter(e=>e.status==='Active').length,13);});
test('exact situations retrieve current rules, never superseded or no-rule entries',()=>{for(const e of seedEntries.filter(e=>e.status==='Active')){const found=search(seedEntries,e.situation);assert.equal(found[0].entry.id,e.id);assert.equal(found[0].possible,false);assert.ok(found.every(r=>r.entry.status==='Active'));}});
test('swapped orders and unrelated situations have no precedent',()=>{assert.deepEqual(search(seedEntries,'Two orders were swapped'),[]);assert.deepEqual(search(seedEntries,'The office ceiling fan has stopped working'),[]);});
test('blank escalation and missing priority are blocked',()=>{assert.throws(()=>applyAction(fresh(),escalate('x',{situation:'  '}),'team'));assert.throws(()=>applyAction(fresh(),escalate('x',{priority:''}),'team'));});
test('retrying the same escalation creates one case and one alert',()=>{let s=applyAction(fresh(),escalate(),'team',1000);s=applyAction(s,escalate(),'team',2000);assert.equal(s.cases.length,1);assert.equal(s.notices.length,1);});
test('High cases route at one hour, Medium and founder-only cases do not',()=>{let s=applyAction(fresh(),escalate(),'team',1000);s=applyAction(s,escalate('medium',{priority:'Medium'}),'team',1000);s=applyAction(s,escalate('public',{situation:'A customer threatens to escalate publicly',sourceId:'7'}),'team',1000);const early=applyAction(s,{kind:'route',id:'job-1'},'founder',3600999);assert.ok(early.cases.every(c=>!c.routedAt));s=applyAction(s,{kind:'route',id:'job-2'},'founder',3601000);assert.ok(s.cases[0].routedAt);assert.ok(!s.cases[1].routedAt);assert.ok(!s.cases[2].routedAt);});
test('ordinary public marketing language is not automatically founder-only',()=>{assert.equal(publicRisk('Draft a public product launch announcement'),false);assert.equal(publicRisk('Customer posted a negative review'),true);});
test('team and unassigned CoS cannot answer, first saved founder answer wins',()=>{let s=applyAction(fresh(),escalate(),'team');assert.throws(()=>applyAction(s,answer(),'team'));assert.throws(()=>applyAction(s,answer(),'cos'));s=applyAction(s,answer(),'founder');assert.throws(()=>applyAction(s,answer({id:'answer-2'}),'founder'),/already been answered/);assert.equal(applyAction(s,answer(),'founder').cases[0].answer.decision,'Hold dispatch');});
test('CoS one-off stays intact after founder publishes amended precedent',()=>{let s=applyAction(fresh(),escalate(),'team',1000);s=applyAction(s,{kind:'route',id:'job'},'founder',3601000);s=applyAction(s,answer(),'cos',3602000);assert.equal(s.entries.length,15);assert.throws(()=>applyAction(s,{kind:'promote',id:'p',caseId:'case-1'},'founder'),/Review/);s=applyAction(s,{kind:'review',id:'review-1',caseId:'case-1',decision:'Confirm address before dispatch',reasoning:'Reduce delivery errors',exception:'',category:'Operations',savePrecedent:true},'founder');assert.equal(s.cases[0].answer.decision,'Hold dispatch');assert.equal(s.cases[0].review.outcome,'amended');assert.equal(s.entries.at(-1).decision,'Confirm address before dispatch');});
test('founder can keep CoS answer one-off, then promote it later',()=>{let s=applyAction(fresh(),escalate(),'team',1000);s=applyAction(s,{kind:'route',id:'job'},'founder',3601000);s=applyAction(s,answer(),'cos');s=applyAction(s,{kind:'review',id:'r',caseId:'case-1',savePrecedent:false},'founder');assert.equal(s.cases[0].review.outcome,'one-off');s=applyAction(s,{kind:'promote',id:'p',caseId:'case-1',decision:'Hold dispatch',reasoning:'Check deadline',category:'Operations'},'founder');assert.equal(s.cases[0].precedentId,'p');});
test('replacement requires a reason and links both directions',()=>{const action={kind:'replace',id:'new-rule',supersedesId:'11',decision:'New leave rule',reasoning:'New workload',category:'Operations',savePrecedent:true};assert.throws(()=>applyAction(fresh(),action,'founder'));const s=applyAction(fresh(),{...action,changeReason:'Workload changed'},'founder');assert.equal(s.entries.find(e=>e.id==='11').status,'Superseded');assert.equal(s.entries.find(e=>e.id==='11').replacementId,'new-rule');assert.equal(s.entries.at(-1).supersedesId,'11');});
test('CoS review is pinned before undecided High cases',()=>{let s=applyAction(fresh(),escalate(),'team',1000);s=applyAction(s,{kind:'route',id:'job'},'founder',3601000);s=applyAction(s,answer(),'cos');s=applyAction(s,escalate('another'),'team',500);assert.equal(queue(s.cases,'founder')[0].id,'case-1');});

test('repeated scheduler checks create one CoS alert and preserve the first handoff time',()=>{
 let s=applyAction(fresh(),escalate(),'team',1000);
 s=applyAction(s,{kind:'route',id:'first-check'},'founder',3601000);
 s=applyAction(s,{kind:'route',id:'second-check'},'founder',7201000);
 assert.equal(s.cases[0].routedAt,3601000);
 assert.equal(s.notices.filter(n=>n.kind==='fallback').length,1);
 assert.equal(s.notices.find(n=>n.kind==='fallback').to,'gazal@scentira.in');
});

test('an answer saved before the deadline prevents the handoff',()=>{
 let s=applyAction(fresh(),escalate(),'team',1000);
 s=applyAction(s,answer(),'founder',3600999);
 s=applyAction(s,{kind:'route',id:'deadline-check'},'founder',3601000);
 assert.equal(s.cases[0].routedAt,undefined);
 assert.equal(s.notices.filter(n=>n.kind==='fallback').length,0);
 assert.equal(queue(s.cases,'cos').length,0);
});

test('six-hour check routes only unanswered High cases, never Low or founder-only cases',()=>{
 let s=applyAction(fresh(),escalate(),'team',1000);
 s=applyAction(s,escalate('low',{priority:'Low'}),'team',1000);
 s=applyAction(s,escalate('medium',{priority:'Medium'}),'team',1000);
 s=applyAction(s,escalate('public',{situation:'Customer threatens to escalate publicly'}),'team',1000);
 s=applyAction(s,{kind:'route',id:'late-check'},'founder',21601000);
 assert.deepEqual(queue(s.cases,'cos').map(c=>c.id),['case-1']);
 assert.equal(s.notices.filter(n=>n.kind==='fallback').length,1);
});

test('first answer after handoff wins and queues a notification for the other decision-maker',()=>{
 for(const first of ['founder','cos']){
  let s=applyAction(fresh(),escalate(),'team',1000);
  s=applyAction(s,{kind:'route',id:'handoff'},'founder',3601000);
  s=applyAction(s,answer(),first,3602000);
  const second=first==='founder'?'cos':'founder';
  assert.throws(()=>applyAction(s,answer({id:'late-answer'}),second,3603000),/already been answered/);
  assert.equal(s.cases[0].answer.role,first);
  assert.equal(s.notices.find(n=>n.kind==='decided').to,first==='founder'?'gazal@scentira.in':'lovish@scentira.in');
  assert.equal(s.notices.filter(n=>n.kind==='answer').length,1);
 }
});
