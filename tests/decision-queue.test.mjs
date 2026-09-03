import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
test('queue uses a separate detail panel and mobile return action',()=>{
 const source=read('../components/decision-queue.tsx');
 assert.match(source,/queue-list/);assert.match(source,/queue-detail/);
 assert.match(source,/Back to queue/);assert.match(source,/is-selected/);
 assert.match(source,/\['Pending','Answered'\]/);
 assert.doesNotMatch(source,/aria-expanded/);
 const css=read('../app/product.css');
 assert.match(css,/35fr.*65fr/);assert.match(css,/has-selection \.queue-list\{display:none/);
});
test('founder uses one queue, keeps approval payoff and exposes library controls',()=>{
 const source=read('../components/precedent-app.tsx');
 assert.doesNotMatch(source,/>Submitted situations</);
 assert.match(source,/Precedent created/);assert.match(source,/Test this decision/);
 assert.match(source,/Last updated/);assert.match(source,/All statuses/);assert.match(source,/Show 20 more/);
 assert.match(source,/view\s*!==\s*["']queue["']\s*&&\s*view\s*!==\s*["']submitted["'][\s\S]*?<DecisionForm/);
});
