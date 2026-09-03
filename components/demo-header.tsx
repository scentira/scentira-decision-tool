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
    </div>
  </header>;
}
