import { applyAction } from '../lib/domain-actions.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { currentRule, queue, search } from '../lib/domain.ts';
import { seedEntries } from '../lib/seed.ts';
const fresh=()=>({entries:structuredClone(seedEntries),cases:[],notices:[]});
const report={kind:'reportFeedback',id:'report-1',sourceId:'11',submitter:'Gazal',priority:'Medium',situation:'I used the Monday leave rule for a shift request.',outcome:'We still had a coverage gap.'};
const review={kind:'resolveFeedback',id:'review-1',caseId:'report-1',entryId:'11',choice:'keep',reason:'The rule still applies; confirm coverage first.'};
const reported=()=>applyAction(fresh(),report,'team',1000);
test('report preserves source wording and outcome without changing the rule',()=>{
 const s=reported();assert.deepEqual(s.entries,seedEntries);assert.equal(s.cases[0].feedback.outcome,report.outcome);assert.equal(s.cases[0].feedback.source.decision,seedEntries.find(e=>e.id==='11').decision);assert.equal(queue(s.cases,'founder').length,1);assert.equal(queue(s.cases,'cos').length,0);
});
test('report validates all required fields and its source on the server',()=>{
 for(const extra of [{sourceId:'missing'},{sourceId:'6'},{situation:' '},{outcome:' '},{submitter:'unknown'},{priority:''}])assert.throws(()=>applyAction(fresh(),{...report,...extra},'team'));
});
test('repeat report submissions create only one record',()=>{const s=applyAction(reported(),report,'team',2000);assert.equal(s.cases.length,1);});
test('policy reports never auto-route, including High priority after six hours',()=>{let s=applyAction(fresh(),{...report,priority:'High'},'team',1000);s=applyAction(s,{kind:'route',id:'clock'},'founder',21601000);assert.equal(s.cases[0].routedAt,undefined);assert.equal(s.notices.filter(n=>n.kind==='fallback').length,0);});
test('only founder can review and ordinary answer cannot bypass review',()=>{
 for(const role of ['team','cos'])assert.throws(()=>applyAction(reported(),review,role),/Only the founder/);
 assert.throws(()=>applyAction(reported(),{kind:'answer',id:'a',caseId:'report-1',decision:'bypass',reasoning:'bypass'},'founder'),/rule-review form/);
});
test('keep resolves report but preserves the library and notifies submitter once',()=>{
 const s=applyAction(reported(),review,'founder',2000);assert.deepEqual(s.entries,seedEntries);assert.equal(s.cases[0].feedback.resolution.choice,'keep');assert.equal(queue(s.cases,'founder').length,0);assert.equal(s.notices.filter(n=>n.kind==='answer').length,1);
 assert.deepEqual(applyAction(s,review,'founder',3000),s);assert.throws(()=>applyAction(s,{...review,id:'second'},'founder'),/already been reviewed/);
});
test('clarify and replace publish linked current rules while keeping the report snapshot',()=>{
 for(const choice of ['clarify','replace']){
 const s=applyAction(reported(),{...review,choice,decision:'Confirm shift coverage before approving Monday leave.',reasoning:'Keep the shift covered.',exception:'Emergency leave is considered separately.',category:'Operations'},'founder',2000);
 assert.equal(s.entries.find(e=>e.id==='11').status,'Superseded');assert.equal(currentRule(s.entries,'11').id,'review-1');assert.equal(s.entries.at(-1).situation,seedEntries.find(e=>e.id==='11').situation);assert.equal(s.cases[0].feedback.source.status,'Active');assert.equal(s.cases[0].feedback.outcome,report.outcome);assert.equal(search(s.entries,'employee leave Monday')[0].entry.id,'review-1');
 }
});
test('a stale concurrent review is rejected, not applied to a changed rule',()=>{
 let s=reported();s=applyAction(s,{kind:'replace',id:'new',supersedesId:'11',decision:'New rule',reasoning:'New reason',category:'Operations',changeReason:'Coverage changed'},'founder',2000);
 assert.throws(()=>applyAction(s,review,'founder'),/rule has changed/);
 const next=applyAction(s,{...review,entryId:'new'},'founder');assert.equal(next.cases[0].feedback.resolution.entryId,'new');
});
test('current rule lookup follows multiple replacements and fails closed for loops',()=>{
 let s=applyAction(reported(),{...review,choice:'replace',decision:'First revision',reasoning:'Reason',category:'Operations'},'founder');
 s=applyAction(s,{kind:'replace',id:'newest',supersedesId:'review-1',decision:'Second revision',reasoning:'Reason',category:'Operations',changeReason:'Another review'},'founder');
 assert.equal(currentRule(s.entries,'11').id,'newest');
 const old=s.entries.find(e=>e.id==='11');old.replacementId='11';assert.equal(currentRule(s.entries,'11'),undefined);
});
