'use client';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DemoHeader({ mode = 'demo', onDemo, onFounder, onCos, onStaff }: {
  mode?: 'demo'|'founder'|'cos'; onDemo: () => void; onFounder: () => void; onCos: () => void; onStaff: () => void;
}) {
  return <header className="topbar">
    <div className="brand"><span className="brand-icon"><BookOpen size={22}/></span><div><strong>SCENTIRA</strong><span>Decision Precedent Tool</span></div></div>
    <div className="access-actions">
      <fieldset className="role-toggle" aria-label="Switch view">
        <Button className={`role-choice${mode==='demo' ? ' is-active' : ''}`} aria-pressed={mode==='demo'} onClick={onDemo}>Demo</Button>
        <Button className={`role-choice${mode==='founder' ? ' is-active' : ''}`} aria-pressed={mode==='founder'} onClick={onFounder}>Founder (demo)</Button>
        <Button className={`role-choice${mode==='cos' ? ' is-active' : ''}`} aria-pressed={mode==='cos'} onClick={onCos}>CoS (demo)</Button>
      </fieldset>
      <Button variant="link" className="staff-sign-in" onClick={onStaff}>Staff sign-in</Button>
      <details className="company-data"><summary>Your company data</summary><p>Real decisions are stored in Convex. Team members in the private work area and PIN-authenticated Founder or CoS views can read them. Meaning matching runs in the browser using precedent titles and summaries, not full case records. In-app deletion is not available; an operator must remove data from Convex.</p></details>
    </div>
    <details className="mobile-access-menu">
      <summary>{mode==='demo'?'Demo':mode==='founder'?'Founder (demo)':'CoS (demo)'}</summary>
      <div className="mobile-access-actions">
        <Button variant="ghost" onClick={onDemo}>Demo</Button>
        <Button variant="ghost" onClick={onFounder}>Founder (demo)</Button>
        <Button variant="ghost" onClick={onCos}>CoS (demo)</Button>
        <Button variant="link" onClick={onStaff}>Staff sign-in</Button>
        <p className="company-data-mobile"><strong>Your company data:</strong> Real decisions are stored in Convex. Team members in the private work area and PIN-authenticated Founder or CoS views can read them. Meaning matching uses precedent titles and summaries in the browser. In-app deletion is not available.</p>
      </div>
    </details>
  </header>;
}
