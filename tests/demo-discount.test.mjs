import test from 'node:test';
import assert from 'node:assert/strict';
import {demoDiscount} from '../lib/demo-discount.ts';
import {discountGuidance} from '../lib/discount-guide.ts';

test('fictional discount requires a count, never a search phrase',()=>{
 for(const value of ['', 'discount', 'first purchase', '-1', '1.5', '1e2', 'Infinity', '9007199254740992'])assert.equal(demoDiscount(value),null);
});
test('fictional discount boundaries and reply match the supplied policy',()=>{
 for(const [value,title,reply] of [['0','No additional discount','cannot'],['1','No additional discount','cannot'],['9','No additional discount','cannot'],['10','Additional discount may be offered','may be offered'],['11','Additional discount may be offered','may be offered'],['12','Additional discount may be offered','may be offered']]){
  const result=demoDiscount(value);assert.equal(result.title,title);assert.ok(result.reply.includes(reply));assert.ok(result.basis.includes(`${value} previous orders`));
 }
});
test('unknown count has no customer reply or assumed discount',()=>{
 for(const guide of [demoDiscount,discountGuidance]){assert.equal(guide('unknown').reply,undefined);assert.match(guide('unknown').title,/history/);}
});
test('private reply and explanation use the supplied count and saved boundaries',()=>{
 for(const [count,word] of [['0','5%'],['1','cannot'],['9','cannot'],['10','10%'],['11','10%'],['12','10%']]){const result=discountGuidance(count);assert.ok(result.reply.includes(word));assert.ok(result.basis.includes(`${count} previous orders`));assert.match(result.basis,/not independently verified/);}
});
test('staff wording is Scentira policy, never fictional-demo wording',()=>{
 for(const value of ['0','10','11','unknown']){const result=discountGuidance(value);assert.match(result.message,/Scentira’s rule/);assert.doesNotMatch(JSON.stringify(result),/demo|fictional/i);assert.ok(result.basis);assert.ok(result.branches);}
});
test('demo branches preserve the supplied ten-order boundary without inventing a rate',()=>{
 for(const value of ['0','9','10','12']){assert.match(demoDiscount(value).branches,/10\+/);assert.doesNotMatch(demoDiscount(value).branches,/5%|10% off|escalat/i);}
});
