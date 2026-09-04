"use client";
import { useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DemoHeader } from "@/components/demo-header";
import { Input } from "@/components/ui/input";
import { categories, tokens } from "@/lib/domain";
import { demoEntries } from "@/lib/public-demo";
import { demoDiscount } from "@/lib/demo-discount";
import {
  DemoLearningEmployee,
  LearnedDecisionCard,
} from "@/components/demo-learning";
import {
  findLearnedPrecedent,
  type DemoLearningState,
} from "@/lib/demo-learning";
import { DiscountDecision } from "@/components/discount-decision";
import { captureEvent, capturePrecedentRejected } from "@/lib/analytics";
import { UsageMetricsPanel } from "@/components/usage-metrics";
import { DecisionFeedback } from "@/components/decision-feedback";
import {
  findMeaningMatch,
  meaningRuntimeStatus,
} from "@/lib/meaning-match-client";
import {
  SearchDiagnostic,
  printSearchDiagnostic,
  type SearchDiagnosticData,
} from "@/components/search-diagnostic";
import { SearchExamples } from "@/components/search-examples";
import { buildSearchExamples } from "@/lib/search-examples";
import { Spinner } from "@/components/ui/spinner";
import {customerTypeMatches,type CustomerType} from "@/lib/customer-type";

export function PublicDemo({
  onLogin,
  onFounder,
  onCos,
  initialStaff = false,
  testSituation,
  learningState,
  onLearningSubmit,
}: {
  testSituation?: string;
  learningState: DemoLearningState;
  onLearningSubmit: (text: string) => void;
  initialStaff?: boolean;
  onFounder: () => void;
  onCos: () => void;
  onLogin: (role: "founder" | "cos", pin: string) => Promise<void>;
}) {
  const [learningMode, setLearningMode] = useState(true);
  const [text, setText] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [customerType,setCustomerType]=useState<CustomerType>('direct');
  const [category, setCategory] = useState("All categories");
  const [browse, setBrowse] = useState(false);
  const [open, setOpen] = useState("fictional-policy-01");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewDone, setPreviewDone] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [meaningMatchId, setMeaningMatchId] = useState<string | null>(null);
  const [meaningMatchScore, setMeaningMatchScore] = useState(1);
  const [rejectedMatch, setRejectedMatch] = useState(false);
  const [searchingMeaning, setSearchingMeaning] = useState(false);
  const [firstMatcherLoad, setFirstMatcherLoad] = useState(false);
  const [diagnostic, setDiagnostic] = useState<SearchDiagnosticData | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [role, setRole] = useState<"founder" | "cos" | null>(
    initialStaff ? "founder" : null,
  );
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const matcherStarted = useRef(false);
  const activeEntries = demoEntries.filter(
    (entry) => entry.status === "Active",
  );
  const searchExamples = buildSearchExamples(activeEntries);
  const words = tokens(query || "");
  const learnedWordMatch = query
    ? findLearnedPrecedent(learningState.precedents, query)
    : null;
  const learnedPrecedent = customerType==='direct' ?
    learnedWordMatch?.precedent ||
    (meaningMatchId
      ? learningState.precedents.find((item) => item.id === meaningMatchId)
      : undefined) : undefined;
  const lexical = activeEntries
    .map((entry) => ({
      entry,
      score:
        words.filter((word) => tokens(entry.situation).includes(word)).length /
        Math.max(words.length, 1),
    }))
    .sort((a, b) => b.score - a.score);
  const confident = lexical[0]?.score >= 0.66;
  const meaningEntry = meaningMatchId
    ? activeEntries.find((entry) => entry.id === meaningMatchId)
    : undefined;
  const results = (
    browse || query === null
      ? lexical
      : learnedPrecedent
        ? []
        : confident
          ? lexical.filter((item) => item.score >= 0.18)
          : meaningEntry
            ? lexical.filter((item) => item.entry.id === meaningEntry.id)
            : []
  ).filter(
    ({entry})=>customerTypeMatches(entry,customerType),
  ).filter(
    ({ entry }) => category === "All categories" || entry.category === category,
  );
  async function runSearch(value = text) {
    const next = value.trim();
    if (!next) {
      setError("Describe the situation first.");
      return;
    }
    captureEvent("precedent_search", "demo");
    const nextWords = tokens(next);
    const nextLearned = findLearnedPrecedent(learningState.precedents, next);
    const nextLexical = activeEntries
      .map((entry) => ({
        entry,
        score:
          nextWords.filter((word) => tokens(entry.situation).includes(word))
            .length / Math.max(nextWords.length, 1),
      }))
      .sort((a, b) => b.score - a.score);
    const candidates = [
      ...learningState.precedents.map((item) => ({
        id: item.id,
        title: item.title,
        summary: item.conditions,
      })),
      ...activeEntries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        summary: `${entry.situation} ${entry.exception}`,
      })),
    ];
    setError("");
    setQuery(next);
    setMeaningMatchId(null);
    setRejectedMatch(false);
    setCategory("All categories");
    setBrowse(false);
    setOpen("");
    setPreview(null);
    setFeedback("");
    setDiscountApplied(false);
    const lexicalMatch=nextLexical[0];
    if ((nextLearned&&customerType==='direct') || (lexicalMatch?.score >= 0.66&&customerTypeMatches(lexicalMatch.entry,customerType))) {
      const report = {
        query: next,
        count: candidates.length,
        ids: candidates.map((item) => item.id),
        aiAttempted: false,
        aiSucceeded: false,
        path: "word-list path" as const,
        rawModelReply: null,
        ...meaningRuntimeStatus(),
      };
      setDiagnostic(report);
      printSearchDiagnostic(report);
      captureEvent("precedent_matched", "demo");
      return;
    }
    setFirstMatcherLoad(!matcherStarted.current);
    matcherStarted.current = true;
    setSearchingMeaning(true);
    const semantic = await findMeaningMatch(next, candidates, (result) => {
      const report = {
        query: next,
        count: candidates.length,
        ids: candidates.map((item) => item.id),
        ...result,
      };
      setDiagnostic(report);
      printSearchDiagnostic(report);
    });
    setMeaningMatchId(semantic?.id ?? null);
    setMeaningMatchScore(semantic?.score ?? 1);
    setSearchingMeaning(false);
    const semanticEntry=activeEntries.find(entry=>entry.id===semantic?.id)||learningState.precedents.find(entry=>entry.id===semantic?.id);
    if (semantic&&customerTypeMatches(semanticEntry||{},customerType)) captureEvent("precedent_matched", "demo");
  }
  async function find(e: FormEvent) {
    e.preventDefault();
    await runSearch();
  }
  function escalate() {
    setPreview(text.trim() || "A fictional situation needing a decision.");
    setPreviewDone(false);
  }
  async function unlock(e: FormEvent) {
    e.preventDefault();
    if (!role || busy) return;
    setBusy(true);
    setLoginError("");
    try {
      await onLogin(role, pin);
      setPin("");
    } catch {
      setLoginError(
        "Could not unlock this view. Check your PIN and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="app-shell public-demo">
      <DemoHeader
        onDemo={() => {
          setLearningMode(true);
          setRole(null);
          setPin("");
          setLoginError("");
        }}
        onFounder={onFounder}
        onCos={onCos}
        onStaff={() => {
          setRole("founder");
          setPin("");
          setLoginError("");
        }}
      />
      <nav className="tabs" aria-label="Main navigation">
        <Button
          aria-current={learningMode ? "page" : undefined}
          onClick={() => setLearningMode(true)}
        >
          Handle a new case
        </Button>
        <Button
          aria-current={!learningMode && !browse ? "page" : undefined}
          onClick={() => {
            setLearningMode(false);
            setBrowse(false);
            setCategory("All categories");
          }}
        >
          Search precedents
        </Button>
        <Button
          aria-current={!learningMode && browse ? "page" : undefined}
          onClick={() => {
            setLearningMode(false);
            setBrowse(true);
            setQuery(null);
          }}
        >
          Browse by category
        </Button>
      </nav>
      <main className="workspace">
        {role && (
          <section className="edit-panel" aria-label="Staff sign-in">
            <div className="section-heading">
              <h2>Unlock {role === "founder" ? "Founder" : "CoS"} view</h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setRole(null);
                  setPin("");
                }}
              >
                Close
              </Button>
            </div>
            <fieldset className="staff-roles" aria-label="Staff role">
              {(["founder", "cos"] as const).map((value) => (
                <Button
                  key={value}
                  variant={role === value ? "default" : "outline"}
                  aria-pressed={role === value}
                  onClick={() => {
                    setRole(value);
                    setPin("");
                    setLoginError("");
                  }}
                >
                  {value === "founder" ? "Founder (real)" : "CoS (real)"}
                </Button>
              ))}
            </fieldset>
            <form className="access-form" onSubmit={unlock}>
              <label>
                Staff PIN
                <Input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={busy}>
                {busy ? "Checking…" : "Unlock"}
              </Button>
            </form>
            {loginError && (
              <p role="alert" className="error">
                {loginError}
              </p>
            )}
          </section>
        )}
        {learningMode ? (
          <DemoLearningEmployee
            testSituation={testSituation}
            state={learningState}
            libraryEntries={demoEntries}
            onSubmit={onLearningSubmit}
            onFounder={onFounder}
            onMatch={() => captureEvent("precedent_matched", "demo")}
          />
        ) : (
          <>
            <h1>What are you stuck on?</h1>
            <p className="intro">Find a past decision. Know your next step.</p>
            <form className="search-panel" onSubmit={find}>
              <label htmlFor="situation">Describe the situation</label>
              <p className="demo-safety">
                Demo data only. Searches are not saved.
              </p>
              <Textarea
                id="situation"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Try: a damaged delivery, an address change, or a paid influencer collaboration"
              />
              <label htmlFor="public-customer-type">Customer type (optional)</label>
              <select id="public-customer-type" value={customerType} onChange={event=>{setCustomerType(event.target.value as CustomerType);setQuery(null);setMeaningMatchId(null);}}><option value="direct">Direct customer</option><option value="reseller">Reseller or channel partner</option></select>
              <SearchExamples
                examples={searchExamples}
                onSelect={(example) => {
                  setText(example.label);
                  void runSearch(example.label);
                }}
              />
              <div className="search-actions">
                <Button type="submit">
                  <Search size={16} />
                  Find a decision
                </Button>
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </form>
            {browse && (
              <div
                className="demo-categories"
                role="group"
                aria-label="Categories"
              >
                {["All categories", ...categories].map((value) => (
                  <Button
                    key={value}
                    variant={category === value ? "default" : "outline"}
                    aria-pressed={category === value}
                    onClick={() => setCategory(value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            )}
            <section className="library-section">
              <SearchDiagnostic data={diagnostic} />
              <div className="section-heading">
                {searchingMeaning ? (
                  <div className="search-loading" role="status">
                    <Spinner />
                    <h2>{firstMatcherLoad ? "Loading the matcher for your first search. This can take up to 10 seconds" : "Checking your situation"}</h2>
                  </div>
                ) : <h2>
                  {!rejectedMatch && (learnedPrecedent || results.length)
                      ? query
                        ? "Closest approved decision"
                        : "Explore decisions"
                      : "This situation is new"}
                </h2>}
                <span>
                  {demoEntries.filter((entry) => entry.status === "Active")
                    .length + learningState.precedents.length}{" "}
                  ACTIVE PRECEDENTS
                </span>
              </div>
              {query && !rejectedMatch && (learnedPrecedent || results[0]) && (
                <div className="match-introduction">
                  <p>Check that this situation matches yours before applying.</p>
                  <p className="situation-copy">{learnedPrecedent?.sourceCase.situation || results[0]?.entry.situation}</p>
                </div>
              )}
              {learnedPrecedent && !rejectedMatch && (
                <>
                  <LearnedDecisionCard precedent={learnedPrecedent} />
                  <DecisionFeedback surface="demo" />
                </>
              )}
              {!rejectedMatch && results.map(({ entry, score }, index) => {
                const expanded = open === entry.id || (!open && index === 0);
                return (
                  <article
                    key={entry.id}
                    className={`precedent-card ${expanded ? "expanded" : ""}`}
                  >
                    <div className="card-meta">
                      <span>{entry.category}</span>
                    </div>
                    <button
                      className="card-toggle"
                      aria-expanded={expanded}
                      onClick={() => setOpen(expanded ? "none" : entry.id)}
                    >
                      <h3>{entry.title}</h3>
                      <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                    </button>
                    {expanded && (
                      <>
                        {entry.id === "fictional-policy-01" ? (
                          <>
                            <DiscountDecision
                              key={`${query}-${text}`}
                              demo
                              onCheck={async (value) => demoDiscount(value)}
                              onChecked={() => setDiscountApplied(true)}
                              onReset={() => setDiscountApplied(false)}
                            />
                            {discountApplied && <DecisionFeedback surface="demo" />}
                          </>
                        ) : (
                          <>
                            <div className="rule-box">
                              <h4>EXAMPLE DECISION</h4>
                              <p>{entry.decision}</p>
                            </div>
                            <DecisionFeedback surface="demo" />
                          </>
                        )}
                        <div className="match-actions">
                          <Button variant="outline" onClick={() => { capturePrecedentRejected("demo",entry.id,meaningMatchId===entry.id?meaningMatchScore:score); setRejectedMatch(true); }}>
                            This is not my situation, ask the founder
                          </Button>
                        </div>
                        <details className="rule-details">
                          <summary>
                            Precedent, reasoning &amp; exception
                          </summary>
                          <p>{entry.decision}</p>
                          <div className="card-columns">
                            <div>
                              <h4>REASONING</h4>
                              <p>{entry.reasoning}</p>
                            </div>
                            <div>
                              <h4>EXCEPTION</h4>
                              <p>{entry.exception}</p>
                            </div>
                          </div>
                        </details>
                        <details className="rule-details">
                          <summary>Escalation &amp; feedback</summary>
                          <div className="card-bottom">
                            <Button variant="outline" onClick={escalate}>
                              Preview escalation
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() =>
                                setFeedback("Feedback preview complete.")
                              }
                            >
                              This decision didn’t work
                            </Button>
                          </div>
                        </details>
                      </>
                    )}
                  </article>
                );
              })}
              {rejectedMatch && (
                <div className="escalation-callout" role="status">
                  <div><p>This situation is new. Send it to the founder to get an answer. Once answered, everyone can use that decision from then on.</p></div>
                  <Button onClick={escalate}>Send fictional request to the founder</Button>
                </div>
              )}
              {!searchingMeaning && !learnedPrecedent && !results.length && (
                <p className="muted">
                  Send it to the founder to get an answer. Once answered,
                  everyone can use that decision from then on.
                </p>
              )}
              {query !== null &&
                !searchingMeaning &&
                !learnedPrecedent &&
                !results.length && (
                  <div className="escalation-callout">
                    <div>
                      <strong>This situation is new</strong>
                      <p>Sending it to the founder is how it gets answered.</p>
                    </div>
                    <Button onClick={escalate}>Preview escalation</Button>
                  </div>
                )}
            </section>
            {feedback && (
              <p className="notice" role="status">
                {feedback}
                <Button variant="ghost" onClick={() => setFeedback("")}>
                  Dismiss
                </Button>
              </p>
            )}
            {preview !== null && (
              <section className="edit-panel" aria-label="Escalation preview">
                <div className="section-heading">
                  <h2>Escalation preview</h2>
                  <Button variant="ghost" onClick={() => setPreview(null)}>
                    Close preview
                  </Button>
                </div>
                <p className="muted">
                  The team flow routes this description to a decision-maker.
                </p>
                <label htmlFor="demo-escalation">Your situation</label>
                <Textarea id="demo-escalation" readOnly value={preview} />
                <Button
                  className="demo-finish"
                  onClick={() => { setPreviewDone(true); captureEvent("escalation_submitted", "demo"); }}
                >
                  Submit fictional request
                </Button>
                {previewDone && (
                  <p className="notice" role="status">
                    Fictional request submitted for founder review.
                  </p>
                )}
              </section>
            )}
          </>
        )}
        <UsageMetricsPanel />
      </main>
    </div>
  );
}
