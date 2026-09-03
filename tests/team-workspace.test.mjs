import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyAction} from '../lib/domain-actions.ts';

test('team workspace is unlisted, no-index and explicitly opts into real team API access',()=>{
 const page=readFileSync(new URL('../app/team/page.tsx',import.meta.url),'utf8');
 const app=readFileSync(new URL('../components/precedent-app.tsx',import.meta.url),'utf8');
 const route=readFileSync(new URL('../app/api/state/route.ts',import.meta.url),'utf8');
 const header=readFileSync(new URL('../components/demo-header.tsx',import.meta.url),'utf8');
 assert.match(page,/robots:\{index:false,follow:false\}/);
 assert.match(page,/<PrecedentApp teamWorkspace\/>/);
 assert.match(app,/X-Scentira-Team-Workspace/);
 assert.match(app,/!isStaff\s*&&\s*!teamWorkspace/);
 assert.match(route,/x-scentira-team-workspace/);
 assert.doesNotMatch(header,/team workspace|\/team/i);
});

test('team can record feedback on a real answered case',()=>{
 const state={entries:[],notices:[],cases:[{id:'case-1',situation:'Real case',submitter:'Gazal',priority:'Medium',founderOnly:false,createdAt:1,actionIds:[],answer:{decision:'Decision',reasoning:'Reason',exception:'',role:'founder',at:2}}]};
 const next=applyAction(state,{kind:'caseFeedback',id:'feedback-1',caseId:'case-1',value:'yes',note:''},'team',3);
 assert.equal(next.cases[0].callFeedback.value,'yes');
});
