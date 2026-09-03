import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { founderDemoSnapshot } from '../lib/founder-demo-data.ts';
import { queue } from '../lib/domain.ts';
import { search } from '../lib/domain.ts';

test('demo marketing policies are sponsorship and paid influencer collaboration',()=>{
  const data=founderDemoSnapshot();
  assert.equal(data.entries.length,14);
  assert.deepEqual(data.entries.filter(e=>e.category==='Marketing').map(e=>e.id),['fictional-policy-13','fictional-policy-14']);
  assert.equal(search(data.entries,'paid influencer collaboration')[0].entry.id,'fictional-policy-14');
  assert.ok(!data.entries.some(e=>e.id==='fictional-launch'));
});

test('policy-mapped fictional library has thirteen active rules and one superseded history record',()=>{
  const data=founderDemoSnapshot();
  assert.deepEqual(['Customer Service','Operations','Marketing'].map(category=>data.entries.filter(e=>e.category===category).length),[9,3,2]);
  assert.equal(new Set(data.entries.map(e=>e.id)).size,14);
  for(const entry of data.entries.filter(e=>e.status==='Active'))assert.equal(search(data.entries,entry.situation)[0].entry.id,entry.id);
  assert.equal(data.entries.find(e=>e.id==='fictional-policy-12a').replacementId,'fictional-policy-12b');
});

test('founder fixture has three invented requests and supports the real queue',()=>{
  const data=founderDemoSnapshot();
  assert.equal(data.role,'founder');
  assert.equal(data.cases.length,3);
  assert.deepEqual(data.cases.map(c=>c.submitter),['Mira Lantern','Arin Meadow','Tara Cloudwell']);
  assert.ok(data.cases.every(c=>c.id.startsWith('demo-request-')&&new Date(c.createdAt).getUTCFullYear()===2026));
  assert.match(data.cases[0].situation,/address.*packed/i);
  assert.match(data.cases[1].situation,/damaged.*public/i);
  assert.match(data.cases[2].situation,/creator.*₹3,800/i);
  assert.deepEqual(queue(data.cases,'founder').map(c=>c.id),['demo-request-cloud','demo-request-meadow','demo-request-lantern']);
  data.cases[0].situation='Changed local copy';
  assert.notEqual(founderDemoSnapshot().cases[0].situation,data.cases[0].situation);
});
test('Founder and CoS demo use cloned fictional data with their real role screens',()=>{const founder=founderDemoSnapshot('founder'),cos=founderDemoSnapshot('cos');assert.equal(founder.role,'founder');assert.equal(cos.role,'cos');assert.notEqual(founder.cases,cos.cases);assert.deepEqual(queue(cos.cases,'cos').map(c=>c.id),['demo-request-lantern']);assert.ok(cos.cases.every(c=>c.id.startsWith('demo-request-')));});
test('fixture imports no private policies, seeds, store or team directory',()=>{
  const source=readFileSync(new URL('../lib/founder-demo-data.ts',import.meta.url),'utf8');
  assert.doesNotMatch(source,/from.*(?:store|seed|auth|domain-actions|discount-policy)|fetch\(/);
});
test('founder demo shares founder UI and has independent read and write guards',()=>{
  const source=readFileSync(new URL('../components/precedent-app.tsx',import.meta.url),'utf8');
  assert.match(source,/<PrecedentApp[\s\S]*?key=\{demoPreviewRole\}[\s\S]*?demo/);
  assert.match(source,/const refresh\s*=\s*useCallback\([\s\S]*?if \(demo\) return/);
  for(const fn of ['saveReport','saveDecision'])assert.match(source,new RegExp(`async function ${fn}\\([\\s\\S]*?if \\(demo\\) throw`));
  assert.match(source,/<fieldset disabled=\{readOnly\}/);
  assert.match(source,/e\.preventDefault\(\);\s*if \(readOnly\) return/);
  assert.match(source,/view === "manage" &&[\s\S]*?!demo &&[\s\S]*?data\.role === "founder"[\s\S]*?Add precedent/);
});
