"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  learningExample,
  findLearnedPrecedent,
  type DemoLearningState,
  type LearningApproval,
  type LearningCase,
  type LearnedPrecedent,
} from "@/lib/demo-learning";
import { DecisionFeedback } from "@/components/decision-feedback";
import {
  findMeaningMatch,
  meaningRuntimeStatus,
} from "@/lib/meaning-match-client";
import { tokens } from "@/lib/domain";
import {
  SearchDiagnostic,
  printSearchDiagnostic,
  type SearchDiagnosticData,
} from "@/components/search-diagnostic";
import { ConditionSelector } from "@/components/condition-selector";
import { isFragrancePrecedent } from "@/lib/fragrance-conditions";
import { captureEvent, capturePrecedentRejected } from "@/lib/analytics";

type DemoLibraryEntry = {
  id: string;
  title: string;
  situation: string;
  decision: string;
  reasoning: string;
  exception: string;
  status: "Active" | "Superseded";
};
function findLibraryWordMatch(entries: DemoLibraryEntry[], query: string) {
  const words = tokens(query);
  return (
    entries
      .map((entry) => ({
        entry,
        score:
          words.filter((word) => tokens(entry.situation).includes(word))
            .length / Math.max(words.length, 1),
      }))
      .sort((a, b) => b.score - a.score)
      .find((result) => result.score >= 0.66) || null
  );
}

function SingleConditionSelector({
  condition,
  decision,
  onApply,
  onReject,
  precedentId,
  matchScore,
}: {
  condition: string;
  decision: string;
  onApply: () => void;
  onReject: () => void;
  precedentId: string;
  matchScore: number;
}) {
  const [selected, setSelected] = useState(false);
  return (
    <>
      <div
        className="condition-list"
        role="radiogroup"
        aria-label="Choose the condition that matches"
      >
        <button
          type="button"
          role="radio"
          aria-checked={selected}
          className={`condition-row condition-choice ${selected ? "selected" : ""}`}
          onClick={() => {
            setSelected(true);
            captureEvent("condition_row_selected", "demo");
          }}
        >
          <span>{condition || "No additional conditions recorded."}</span>
          <strong>{decision}</strong>
        </button>
      </div>
      <div className="match-actions">
        <Button disabled={!selected} onClick={() => { captureEvent("decision_applied", "demo"); onApply(); }}>
          Apply selected decision
        </Button>
        <Button variant="outline" onClick={() => { capturePrecedentRejected("demo",precedentId,matchScore); onReject(); }}>
          This is not my situation, ask the founder
        </Button>
      </div>
    </>
  );
}

export function LearningCaseCard({
  item,
  compact = false,
}: {
  item: LearningCase;
  compact?: boolean;
}) {
  return (
    <article className="precedent-card learning-case">
      <div className="card-meta">
        <span>
          {item.orderId} · {item.date}
        </span>
        <span className="status-pill">{item.status}</span>
      </div>
      <h3>{item.situation}</h3>
      {!compact && (
        <p className="muted">
          {item.customer} · Submitted by {item.employee}
        </p>
      )}
    </article>
  );
}
export function LearnedDecisionCard({
  precedent,
  compact = false,
}: {
  precedent: LearnedPrecedent;
  compact?: boolean;
}) {
  return (
    <article
      className="precedent-card learned-decision"
      aria-label="Decision from approved precedent"
    >
      <div className="card-meta">
        <span>{precedent.approvedBy}</span>
        <span className="status-pill">{precedent.status}</span>
      </div>
      <h3>{precedent.decision}</h3>
      <p>
        <strong>Precedent used:</strong> {precedent.title} · {precedent.id}
      </p>
      {!compact && (
        <>
          <p>
            <strong>Conditions:</strong> {precedent.conditions}
          </p>
          <p>
            <strong>Reasoning:</strong> {precedent.reasoning}
          </p>
          <p className="muted">
            Approved {precedent.approvalDate} · Source{" "}
            {precedent.sourceCase.orderId}
          </p>
          <details className="rule-details">
            <summary>View source case</summary>
            <p className="muted">
              Snapshot when submitted, before the approval above.
            </p>
            <LearningCaseCard item={precedent.sourceCase} />
          </details>
        </>
      )}
    </article>
  );
}
function LibraryDecisionCard({
  entry,
  applied,
  onApply,
  onReject,
  matchScore,
}: {
  entry: DemoLibraryEntry;
  applied: boolean;
  onApply: () => void;
  onReject: () => void;
  matchScore: number;
}) {
  const fragrance = isFragrancePrecedent(entry);
  return (
    <section className="edit-panel" aria-label="Approved library precedent">
      <h2>Closest approved decision</h2>
      <p className="muted">Check that this situation matches yours before applying.</p>
      <h3>{entry.title}</h3>
      <p className="situation-copy">{entry.situation}</p>
      <div className="rule-box">
        <h4>CONDITIONS — CHECK BEFORE APPLYING</h4>
        {fragrance ? (
          <ConditionSelector
            surface="demo"
            precedentId={entry.id}
            matchScore={matchScore}
            onReject={onReject}
            onApply={(row) => {
              const demoUse = {
                precedentId: entry.id,
                conditionId: row.id,
                conditionLabel: row.situation,
                decision: row.decision,
                source: "demo" as const,
              };
              void demoUse;
              onApply();
            }}
          />
        ) : !applied ? (
          <SingleConditionSelector
            condition={entry.exception}
            decision={entry.decision}
            onApply={onApply}
            onReject={onReject}
            precedentId={entry.id}
            matchScore={matchScore}
          />
        ) : null}
      </div>
      {applied && (
        <>
          <div className="rule-box">
            <h4>DECISION</h4>
            <p>{entry.decision}</p>
          </div>
          <p>
            <strong>Reasoning:</strong> {entry.reasoning || "Not recorded"}
          </p>
          <p>
            <strong>Precedent used:</strong> {entry.title} · {entry.id}
          </p>
          <DecisionFeedback />
        </>
      )}
    </section>
  );
}
export function DemoLearningEmployee({
  state,
  libraryEntries,
  onSubmit,
  onFounder,
  onMatch,
  testSituation,
}: {
  testSituation?: string;
  state: DemoLearningState;
  libraryEntries: DemoLibraryEntry[];
  onSubmit: (text: string) => void;
  onFounder: () => void;
  onMatch: () => void;
}) {
  const [text, setText] = useState<string>(
    testSituation
      ? testSituation === learningExample.situation
        ? learningExample.paraphrase
        : testSituation
      : state.precedents.length
        ? learningExample.paraphrase
        : learningExample.situation,
  );
  const [query, setQuery] = useState<string | null>(null);
  const [futureCase, setFutureCase] = useState(state.precedents.length > 0);
  const [applied, setApplied] = useState(false);
  const [meaningMatchId, setMeaningMatchId] = useState<string | null>(null);
  const [meaningMatchScore, setMeaningMatchScore] = useState(1);
  const [rejected, setRejected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState<SearchDiagnosticData | null>(
    null,
  );
  const resultRef = useRef<HTMLDivElement>(null);
  const wordMatch =
    query && query === text
      ? findLearnedPrecedent(state.precedents, query)
      : null;
  const meaningPrecedent =
    query && query === text && meaningMatchId
      ? state.precedents.find((item) => item.id === meaningMatchId)
      : null;
  const match =
    wordMatch ??
    (meaningPrecedent
      ? { precedent: meaningPrecedent, score: meaningMatchScore, shared: [] }
      : null);
  const activeLibrary = libraryEntries.filter(
    (item) => item.status === "Active",
  );
  const libraryWordMatch =
    query && query === text ? findLibraryWordMatch(activeLibrary, query) : null;
  const libraryMeaningMatch =
    query && query === text && meaningMatchId
      ? activeLibrary.find((item) => item.id === meaningMatchId)
      : null;
  const libraryMatch = libraryWordMatch?.entry ?? libraryMeaningMatch;
  const libraryMatchScore = libraryWordMatch?.score ?? meaningMatchScore;
  const pending = state.cases.find(
    (c) => c.situation === query && c.status === "Pending founder approval",
  );
  useEffect(() => {
    if (!query) return;
    const frame = requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [query, match, libraryMatch, pending, applied]);
  async function check() {
    const nextQuery = text.trim();
    if (!nextQuery) {
      setError("Describe a fictional situation first.");
      return;
    }
    captureEvent("precedent_search", "demo");
    setError("");
    setApplied(false);
    setRejected(false);
    setMeaningMatchId(null);
    setQuery(nextQuery);
    setText(nextQuery);
    const candidates = [
      ...state.precedents
        .filter((item) => item.status === "Approved")
        .map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.conditions,
        })),
      ...activeLibrary.map((item) => ({
        id: item.id,
        title: item.title,
        summary: `${item.situation} ${item.exception}`,
      })),
    ];
    if (
      findLearnedPrecedent(state.precedents, nextQuery) ||
      findLibraryWordMatch(activeLibrary, nextQuery)
    ) {
      const next = {
        query: nextQuery,
        count: candidates.length,
        ids: candidates.map((item) => item.id),
        aiAttempted: false,
        aiSucceeded: false,
        path: "word-list path" as const,
        rawModelReply: null,
        ...meaningRuntimeStatus(),
      };
      setDiagnostic(next);
      printSearchDiagnostic(next);
      return;
    }
    setChecking(true);
    const semantic = await findMeaningMatch(nextQuery, candidates, (result) => {
      const next = {
        query: nextQuery,
        count: candidates.length,
        ids: candidates.map((item) => item.id),
        ...result,
      };
      setDiagnostic(next);
      printSearchDiagnostic(next);
    });
    setMeaningMatchId(semantic?.id ?? null);
    setMeaningMatchScore(semantic?.score ?? 1);
    setChecking(false);
  }
  return (
    <section className="learning-flow" aria-label="Fictional learning loop">
      <div className="eyebrow">TRY THE LEARNING LOOP</div>
      <h1>Turn one founder decision into a rule your whole team can reuse.</h1>
      <p className="intro">
        Find an approved answer for a new exception, or send it for review.
      </p>
      <p className="muted">
        Fictional session ·{" "}
        {futureCase ? learningExample.futureCustomer : learningExample.customer}{" "}
        · {futureCase ? learningExample.futureOrderId : learningExample.orderId}{" "}
        · {futureCase ? learningExample.futureDate : learningExample.date}. Demo
        submissions reset when you reload.
      </p>
      <form
        className="search-panel"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <label htmlFor="learning-situation">Describe the situation</label>
        <p className="demo-safety">Demo data only. Searches are not saved.</p>
        <Textarea
          id="learning-situation"
          maxLength={2000}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setQuery(null);
            setApplied(false);
          }}
        />
        <div className="search-actions">
          <Button type="submit">Find an approved decision</Button>
        </div>
      </form>
      <div className="learning-actions">
        <Button
          variant="link"
          onClick={() => {
            setFutureCase(false);
            setText(learningExample.situation);
            setQuery(null);
            setApplied(false);
          }}
        >
          Use the original exception
        </Button>
        <Button
          variant="link"
          onClick={() => {
            setFutureCase(true);
            setText(learningExample.paraphrase);
            setQuery(null);
            setApplied(false);
          }}
        >
          Try different wording
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div ref={resultRef} className="learning-result" aria-live="polite">
        <SearchDiagnostic data={diagnostic} />
        {query && checking && (
          <section className="edit-panel">
            <h2>Checking approved precedents by meaning…</h2>
          </section>
        )}
        {query && !checking && !match && !libraryMatch && (
          <section className="edit-panel">
            <h2>No reliable approved precedent in this demo session</h2>
            <p className="muted">A submitted case is not approved knowledge.</p>
            {pending ? (
              <>
                <LearningCaseCard item={pending} />
                <Button onClick={onFounder}>
                  Open Founder (demo) to review
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  try {
                    onSubmit(query);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Submit fictional exception
              </Button>
            )}
          </section>
        )}
        {match && !applied && !rejected && (
          <section
            className="edit-panel"
            aria-label="Check precedent conditions"
          >
            <h2>Closest approved decision</h2>
            <p className="muted">Check that this situation matches yours before applying.</p>
            <h3>{match.precedent.title}</h3>
            <p className="situation-copy">{match.precedent.sourceCase.situation}</p>
            <div className="rule-box">
              <h4>CONDITIONS — CHECK BEFORE APPLYING</h4>
              <SingleConditionSelector
                condition={match.precedent.conditions}
                decision={match.precedent.decision}
                onApply={() => {
                  onMatch();
                  setApplied(true);
                }}
                onReject={() => setRejected(true)}
                precedentId={match.precedent.id}
                matchScore={match.score}
              />
            </div>
          </section>
        )}
        {match && applied && (
          <>
            <LearnedDecisionCard precedent={match.precedent} />
            <DecisionFeedback />
          </>
        )}
        {libraryMatch && !rejected && (
          <LibraryDecisionCard
            entry={libraryMatch}
            applied={applied}
            onApply={() => {
              onMatch();
              setApplied(true);
            }}
            onReject={() => setRejected(true)}
            matchScore={libraryMatchScore}
          />
        )}
        {rejected && (
          <section className="edit-panel" role="status">
            <p>No approved precedent covers this situation yet. Ask the founder.</p>
          </section>
        )}
      </div>
      <details className="rule-details">
        <summary>How this demo learns</summary>
        <p>
          The approved demo library and approvals from this fictional session
          are searched here. The tool first checks words and synonyms. If that
          is not confident, it compares the query with approved precedent titles
          and condition summaries by meaning. Pending cases are never searched.
          Nothing is sent to the staff database.
        </p>
      </details>
    </section>
  );
}
export function ApprovalForm({
  item,
  onApprove,
}: {
  item: LearningCase;
  onApprove: (id: string, approval: LearningApproval) => void;
}) {
  const [title, setTitle] = useState("");
  const [decision, setDecision] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [conditions, setConditions] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="edit-panel">
      <LearningCaseCard item={item} />
      {item.situation === learningExample.situation && (
        <Button
          variant="outline"
          onClick={() => {
            setTitle(learningExample.title);
            setDecision(learningExample.decision);
            setReasoning(learningExample.reasoning);
            setConditions(learningExample.conditions);
          }}
        >
          Use the suggested demo decision
        </Button>
      )}
      <form
        className="fields"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onApprove(item.id, { title, decision, reasoning, conditions });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      >
        <label htmlFor={item.id + "-title"}>Precedent title</label>
        <Input
          id={item.id + "-title"}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor={item.id + "-decision"}>Decision</label>
        <Textarea
          id={item.id + "-decision"}
          required
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        />
        <label htmlFor={item.id + "-reasoning"}>Reasoning</label>
        <Textarea
          id={item.id + "-reasoning"}
          required
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
        />
        <label htmlFor={item.id + "-conditions"}>
          Conditions under which it applies
        </label>
        <Textarea
          id={item.id + "-conditions"}
          required
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
        />
        <p className="muted">
          Approval label: Fictional demo approval · Approval date: 1 September
          2026
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit">Approve as demo precedent</Button>
      </form>
    </section>
  );
}
export function DemoLearningReview({
  state,
  onApprove,
  onDemo,
}: {
  state: DemoLearningState;
  onApprove: (id: string, approval: LearningApproval) => void;
  onDemo: () => void;
}) {
  return (
    <section className="learning-review" aria-label="Learning loop review">
      <div className="section-heading">
        <h2>Learning loop · Founder review</h2>
        <span>FICTIONAL SESSION</span>
      </div>
      {!state.cases.length && (
        <p className="muted">
          No learning-loop exception submitted yet. Start in Demo.
        </p>
      )}
      {state.cases
        .filter((c) => c.status === "Pending founder approval")
        .map((item) => (
          <ApprovalForm key={item.id} item={item} onApprove={onApprove} />
        ))}
      {state.precedents.map((precedent) => (
        <LearnedDecisionCard key={precedent.id} precedent={precedent} />
      ))}
      <Button variant="outline" onClick={onDemo}>
        {state.precedents.length
          ? "Try the differently worded case"
          : "Return to Demo"}
      </Button>
    </section>
  );
}
