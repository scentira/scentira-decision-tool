'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { applyAction, queue, type State } from '@/lib/domain';

const start = 1000;
function sample(founderOnly: boolean): State {
  return applyAction({ entries: [], cases: [], notices: [] }, {
    kind: 'escalate', id: 'isolated-routing-demo', submitter: 'Neha', priority: 'High',
    situation: founderOnly
      ? 'DEMO ONLY: A customer threatens to escalate publicly.'
      : 'DEMO ONLY: A dispatch deadline needs a decision before pickup.',
  }, 'team', start);
}

export function RoutingDemo() {
  const [state, setState] = useState(() => sample(false));
  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState('');
  const item = state.cases[0];
  function reset(founderOnly: boolean) { setState(sample(founderOnly)); setMinutes(0); setError(''); }
  function advance(next: number) {
    try {
      setState(applyAction(state, { kind: 'route', id: `demo-clock-${next}` }, 'founder', start + next * 60000));
      setMinutes(next); setError('');
    } catch { setError('The demo could not advance. Reset the demo and try again.'); }
  }
  function answer(role: 'founder' | 'cos') {
    try {
      setState(applyAction(state, { kind: 'answer', id: `demo-answer-${role}`, caseId: item.id,
        decision: 'DEMO ONLY: Pause dispatch until the details are confirmed.',
        reasoning: 'DEMO ONLY: Avoid acting on incomplete information.', savePrecedent: false,
      }, role, start + minutes * 60000));
      setError('');
    } catch { setError('The demo answer could not be saved. Reset the demo and try again.'); }
  }
  return <details className="edit-panel">
    <summary><strong>Try the one-hour handoff demo</strong></summary>
    <p className="notice">SIMULATION ONLY — no emails are sent, no saved cases change, and no real timer runs. Reloading the page clears this demo.</p>
    <div className="filters">
      <Button variant="outline" onClick={() => reset(false)}>Reset: ordinary High case</Button>
      <Button variant="outline" onClick={() => reset(true)}>Reset: founder-only case</Button>
    </div>
    <h3>{item.situation}</h3>
    <p><strong>Simulated time: {minutes} minutes after submission</strong></p>
    <div className="filters">
      <Button variant="outline" disabled={minutes >= 59} onClick={() => advance(59)}>Advance to 59 minutes</Button>
      <Button variant="outline" disabled={minutes >= 60} onClick={() => advance(60)}>Advance to 1 hour</Button>
      <Button variant="outline" disabled={minutes >= 360} onClick={() => advance(360)}>Advance to 6 hours</Button>
    </div>
    <div className="rule-box" role="status">
      <h4>WHAT THE TEAM WOULD SEE</h4>
      <p>{item.answer ? `Answered by ${item.answer.role === 'cos' ? 'CoS' : 'Founder'} — one-off, not a precedent.` : item.founderOnly ? 'Waiting for Lovish. Founder-only: no timed CoS fallback, even after six hours.' : item.routedAt ? 'Assigned to Gazal (CoS) after one unanswered hour. Her decision can be acted on immediately.' : 'Waiting for Lovish. If unanswered at one hour, this High-priority case becomes available to Gazal (CoS).'}</p>
      {item.answer && <p>{item.answer.decision}</p>}
    </div>
    <p>Simulated CoS queue: {queue(state.cases, 'cos').length} pending case(s).</p>
    {item.answer?.role === 'cos' && <p className="notice">Founder review is now at the top of Lovish’s queue. The CoS answer remains a one-off until founder review; no precedent has been published.</p>}
    <div className="filters">
      <Button disabled={!!item.answer} onClick={() => answer('founder')}>Simulate founder answer</Button>
      <Button disabled={!!item.answer || !item.routedAt || item.founderOnly} onClick={() => answer('cos')}>Simulate CoS answer</Button>
    </div>
    {error && <p className="error" role="alert">{error}</p>}
    <h3>Alert previews — NOT SENT</h3>
    <p>These show intended recipients and messages, not proof of email delivery.</p>
    {state.notices.map(notice => <article className="precedent-card" key={notice.id}>
      <strong>{notice.kind === 'fallback' ? 'Immediate attention required — CoS backup' : notice.kind === 'high' ? 'High-priority situation — founder decision needed' : notice.kind === 'answer' ? 'Your situation has been answered' : 'This situation has already been decided'}</strong>
      <p>To: {notice.to} · {Math.floor((notice.createdAt - start) / 60000)} minutes after submission · NOT SENT</p>
      <p>{notice.kind === 'fallback' ? 'Lovish has not answered within one hour. Gazal, please open the decision queue and respond.' : notice.kind === 'high' ? 'Lovish, a High-priority situation is waiting for your decision.' : 'Open Submitted situations to read the saved decision. Do not make a second decision for this case.'}</p>
    </article>)}
  </details>;
}
