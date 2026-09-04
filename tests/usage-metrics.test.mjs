import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAction} from '../lib/domain-actions.ts';
import {realUsageCounts} from '../lib/usage-metrics.ts';

const answered=(id,value)=>({id,situation:'Ordinary real case',submitter:'Gazal',priority:'Medium',founderOnly:false,createdAt:1,actionIds:[],answer:{decision:'Private',reasoning:'Private',exception:'',role:'founder',at:2},precedentId:id==='case-1'?'entry-1':undefined,callFeedback:value?{value,note:'Private',at:3}:undefined});
test('public metrics contain counts only and exclude marked demo/test records',()=>{const state={entries:[],notices:[],cases:[answered('case-1','yes'),answered('case-2','no'),{...answered('case-3','not_sure'),situation:'DEMO TEST ONLY'}],usage:{precedentMatches:4,matchActionIds:['opaque']}};assert.deepEqual(realUsageCounts(state),{casesSubmitted:2,decisionsApproved:1,precedentsMatched:4,feedback:{yes:1,no:1,not_sure:0}});assert.doesNotMatch(JSON.stringify(realUsageCounts(state)),/Private|Gazal|case-|entry-/);});
test('real match counter accepts team workspace usage and stays idempotent',()=>{const state={entries:[],cases:[],notices:[]};const once=applyAction(state,{kind:'recordMatch',id:'match-1'},'team');assert.equal(once.usage.precedentMatches,1);assert.equal(applyAction(once,{kind:'recordMatch',id:'match-1'},'team').usage.precedentMatches,1);});
test('demo match path stops before any database request',()=>{const source=new URL('../components/precedent-app.tsx',import.meta.url);return import('node:fs/promises').then(({readFile})=>readFile(source,'utf8')).then(text=>assert.match(text,/recordRealMatch\(\)\s*\{[\s\S]*?if \(demo\) return;[\s\S]*?request\("\/api\/state"/));});
