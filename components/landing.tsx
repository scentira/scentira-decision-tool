'use client';
import { Button } from '@/components/ui/button';
import { DemoHeader } from '@/components/demo-header';
import { ProductDemonstration } from '@/components/product-demonstration';

export function Landing({onDemo,onFounder,onCos,onStaff}:{onDemo:()=>void;onFounder:()=>void;onCos:()=>void;onStaff:()=>void}) {
  return <div className="app-shell landing-shell">
    <DemoHeader onDemo={onDemo} onFounder={onFounder} onCos={onCos} onStaff={onStaff}/>
    <main>
      <section className="landing-hero">
        <div className="landing-intro">
          <p className="eyebrow">SCENTIRA · DECISION PRECEDENT TOOL</p>
          <h1>Find the founder-approved answer for a new exception</h1>
          <p className="landing-support">Describe the situation, check the conditions, apply or escalate.</p>
          <Button className="landing-primary" onClick={onDemo}>Try a demo decision</Button>
        </div>
        <ProductDemonstration/>
      </section>
      <section className="landing-details">
        <h2>A decision becomes useful knowledge only after approval.</h2>
        <div className="landing-detail-grid">
          <div><h3>Submit the exception</h3><p>No reliable precedent? Keep the case pending instead of guessing.</p></div>
          <div><h3>Record the judgment</h3><p>A reviewer adds the decision, reasoning and the conditions for future use.</p></div>
          <div><h3>Reuse with context</h3><p>Find the approved precedent, confirm its conditions and see the source behind the answer.</p></div>
        </div>
        <p className="muted">The interactive demo stays in this browser session. Demo approvals are fictional. Real Founder and CoS views remain PIN protected.</p>
      </section>
    </main>
  </div>;
}
