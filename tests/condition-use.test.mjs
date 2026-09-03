import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAction} from '../lib/domain-actions.ts';
import {seedEntries} from '../lib/seed.ts';

test('real condition use stores source and decision without case text',()=>{
 const state={entries:structuredClone(seedEntries),cases:[],notices:[]};
 const saved=applyAction(state,{kind:'conditionApplied',id:'use-1',precedentId:'3',conditionId:'slight-poor-history'},'team',1234);
 assert.deepEqual(saved.conditionUses,[{id:'use-1',precedentId:'3',conditionId:'slight-poor-history',conditionLabel:'Slight use · poor customer history',decision:'Deny the return',source:'real',createdAt:1234}]);
 assert.doesNotMatch(JSON.stringify(saved.conditionUses),/customer says|order id|search/i);
});

test('condition use rejects unknown rows and unrelated precedents',()=>{
 const state={entries:structuredClone(seedEntries),cases:[],notices:[]};
 assert.throws(()=>applyAction(state,{kind:'conditionApplied',id:'bad-1',precedentId:'3',conditionId:'invented'},'team'));
 assert.throws(()=>applyAction(state,{kind:'conditionApplied',id:'bad-2',precedentId:'1',conditionId:'slight-poor-history'},'team'));
});
