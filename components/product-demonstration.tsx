import { LearningCaseCard, LearnedDecisionCard } from '@/components/demo-learning';
import { learningExample, emptyLearningState, submitLearningCase, approveLearningCase } from '@/lib/demo-learning';

// Presentation-only snapshots. Never mutate the interactive session or call an API.
const pending=submitLearningCase(emptyLearningState(),learningExample.situation);
const item=pending.cases[0];
const approved=approveLearningCase(pending,item.id,learningExample).precedents[0];

export function ProductDemonstration() {
  return <section className="product-demonstration" aria-label="Fictional product demonstration">
    <p className="eyebrow">FICTIONAL DEMONSTRATION</p>
    <div className="motion-story" aria-hidden="true">
      <div className="demo-stage stage-1"><h2>1 / Submit an exception</h2><LearningCaseCard item={item} compact/></div>
      <div className="demo-stage stage-2"><h2>2 / Wait for approval</h2><LearningCaseCard item={item} compact/><p className="demo-stage-note">Pending cases cannot become answers.</p></div>
      <div className="demo-stage stage-3"><h2>3 / Save the judgment</h2><LearnedDecisionCard precedent={approved} compact/><p className="demo-stage-note">Decision + reasoning + conditions + source.</p></div>
      <div className="demo-stage stage-4"><h2>4 / Different words. Same need.</h2><article className="precedent-card"><div className="card-meta"><span>{learningExample.futureOrderId} · {learningExample.futureDate}</span></div><h3>{learningExample.paraphrase}</h3><p>Conditions checked: swapped orders, final station, not delivered.</p></article></div>
      <div className="demo-stage stage-5"><h2>5 / Reuse the approved decision</h2><LearnedDecisionCard precedent={approved} compact/><p className="demo-stage-note">The exact saved decision, with its source.</p></div>
    </div>
    <div className="static-story">
      <p className="demo-stage-note">An exception is submitted, kept pending, then approved in the demo.</p>
      <p className="demo-stage-note"><strong>A later case:</strong> {learningExample.paraphrase}</p>
      <LearnedDecisionCard precedent={approved} compact/>
      <p className="demo-stage-note">Once its conditions are confirmed, the approved decision can be reused.</p>
    </div>
    <p className="story-summary">Submit → Pending → Fictional approval → New wording → Decision</p>
  </section>;
}
