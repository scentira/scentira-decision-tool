"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  BookOpen,
  Search,
  ShieldCheck,
  ArrowUpRight,
  Inbox,
  Clock,
  ChevronDown,
  LockKeyhole,
  CircleAlert,
  Check,
  Library,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ReportRuleForm, RuleFeedbackCase } from "@/components/rule-feedback";
import { StaffFollowUp } from "@/components/staff-follow-up";
import { founderDemoSnapshot } from "@/lib/founder-demo-data";
import { DemoHeader } from "@/components/demo-header";
import { DiscountDecision } from "@/components/discount-decision";
import { demoDiscount } from "@/lib/demo-discount";
import { Landing } from "@/components/landing";
import { ApprovalForm, LearnedDecisionCard } from "@/components/demo-learning";
import {
  emptyLearningState,
  submitLearningCase,
  approveLearningCase,
  findLearnedPrecedent,
  type DemoLearningState,
  type LearningApproval,
} from "@/lib/demo-learning";
import { DecisionQueue } from "@/components/decision-queue";
import { PublicDemo } from "@/components/public-demo";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  categories,
  currentRule,
  publicRisk,
  queue,
  search,
  type Entry,
  type Role,
  type Situation,
} from "@/lib/domain";
import { captureEvent, capturePageview, capturePrecedentRejected } from "@/lib/analytics";
import { CaseFeedback } from "@/components/case-feedback";
import {
  findMeaningMatch,
  meaningRuntimeStatus,
} from "@/lib/meaning-match-client";
import {
  SearchDiagnostic,
  printSearchDiagnostic,
  type SearchDiagnosticData,
} from "@/components/search-diagnostic";
import {
  ConditionSelector,
  ConditionSummary,
} from "@/components/condition-selector";
import { isFragrancePrecedent } from "@/lib/fragrance-conditions";

type Snapshot = {
  entries: Entry[];
  cases: Situation[];
  role: Role;
  people?: { name: string }[];
  services?: { storage?: string };
};
type View = "search" | "browse" | "submitted" | "queue" | "manage";
type Draft = {
  kind: "answer" | "review" | "promote" | "replace";
  item?: Situation;
  entry?: Entry;
};
const initial: Snapshot = { entries: [], cases: [], role: "team" };
const age = (time: number) => {
  const mins = Math.max(0, Math.floor((Date.now() - time) / 60000));
  return mins < 60
    ? `${mins}m waiting`
    : mins < 1440
      ? `${Math.floor(mins / 60)}h ${mins % 60}m waiting`
      : `${Math.floor(mins / 1440)}d waiting`;
};
const date = (time: number) =>
  new Date(time).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

async function apiRequest<T>(
  path: string,
  body?: unknown,
  method = "POST",
  teamWorkspace = false,
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(teamWorkspace ? { "X-Scentira-Team-Workspace": "1" } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw new Error(data.error || "Could not save. Please retry.");
  return data;
}

function PrecedentCard({
  entry,
  entries,
  expanded = false,
  possible = false,
  onEscalate,
  onReplace,
  onReport,
  followUp,
}: {
  entry: Entry;
  followUp?: ReactNode;
  entries: Entry[];
  expanded?: boolean;
  possible?: boolean;
  onEscalate?: (entry: Entry) => void;
  onReplace?: (entry: Entry) => void;
  onReport?: (entry: Entry) => void;
}) {
  const [open, setOpen] = useState(expanded);
  const old = entries.find((e) => e.id === entry.supersedesId);
  return (
    <article
      className={`precedent-card ${open ? "expanded" : ""}`}
      id={`precedent-${entry.id}`}
    >
      <div className="card-meta">
        <span>
          {entry.category}
          {entry.seed ? " · Seed" : ""}
        </span>
        <span className={possible ? "status-pill amber" : "status-pill"}>
          {possible ? "Possible match" : entry.status}
        </span>
      </div>
      <button
        className="card-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <h3>{entry.title}</h3>
        <ChevronDown className={open ? "turned" : ""} size={19} />
      </button>
      {!open && <p className="situation-copy">{entry.situation}</p>}
      {entry.founderOnly && (
        <p className="notice amber">
          <CircleAlert size={15} />
          Founder decision required · High priority, no timed CoS fallback
        </p>
      )}
      {open && (
        <>
          {followUp}
          {!followUp && (
            <div className="rule-box">
              <h4>REFERENCE RULE — CHECK CONDITIONS BEFORE APPLYING</h4>
              <p>{entry.decision}</p>
            </div>
          )}
          <details className="rule-details">
            <summary>Precedent, reasoning, exceptions &amp; history</summary>
            {followUp && <p>{entry.decision}</p>}
            <p className="situation-copy">{entry.situation}</p>
            <div className="card-columns">
              <div>
                <h4>WHY THIS EXISTS</h4>
                <p>{entry.reasoning || "Not recorded"}</p>
              </div>
              <div>
                <h4>THE EXCEPTION</h4>
                <p>{entry.exception || "None recorded"}</p>
              </div>
            </div>
            {old && (
              <details className="old-rule">
                <summary>Previously: {old.title} · Superseded</summary>
                <p>{old.decision}</p>
                <p>
                  <strong>Why it changed:</strong>{" "}
                  {entry.changeReason || "Not recorded"}
                </p>
                <p>
                  Replaced by the Active rule above. Do not use this old rule.
                </p>
              </details>
            )}
          </details>
          <details className="rule-details">
            <summary>Escalation &amp; feedback</summary>
            <div className="card-bottom">
              {onEscalate && (
                <Button
                  className="escalate-action"
                  variant="ghost"
                  onClick={() => onEscalate(entry)}
                >
                  {entry.founderOnly
                    ? "Ask founder"
                    : "This doesn’t apply—ask founder"}
                  <ArrowUpRight size={14} />
                </Button>
              )}
              {onReport && entry.status === "Active" && (
                <Button
                  className="report-action"
                  variant="outline"
                  onClick={() => onReport(entry)}
                >
                  This decision didn’t work
                </Button>
              )}
              {onReplace && (
                <Button variant="outline" onClick={() => onReplace(entry)}>
                  Replace this rule
                </Button>
              )}
            </div>
          </details>
        </>
      )}
    </article>
  );
}

function DecisionForm({
  draft,
  role,
  entries,
  onSave,
  onClose,
  readOnly = false,
}: {
  readOnly?: boolean;
  draft: Draft;
  role: Role;
  entries: Entry[];
  onSave: (action: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const original = draft.item?.answer || draft.entry;
  const [decision, setDecision] = useState(original?.decision || "");
  const [reasoning, setReasoning] = useState(original?.reasoning || "");
  const [exception, setException] = useState(original?.exception || "");
  const [publish, setPublish] = useState(
    draft.kind === "replace" || draft.kind === "promote" ? "yes" : "",
  );
  const [category, setCategory] = useState(draft.entry?.category || "");
  const [oldId, setOldId] = useState(draft.entry?.id || "");
  const [changeReason, setChangeReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const actionId = useRef(crypto.randomUUID());
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave({
        kind: draft.kind,
        id: actionId.current,
        caseId: draft.item?.id,
        decision,
        reasoning,
        exception,
        savePrecedent: role === "founder" && publish === "yes",
        category,
        supersedesId: publish === "yes" ? oldId : undefined,
        changeReason,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="edit-panel">
      <div className="section-heading">
        <h2>
          {draft.kind === "review"
            ? "Review the CoS decision"
            : draft.kind === "replace"
              ? "Replace an existing rule"
              : draft.kind === "promote"
                ? "Make this a precedent"
                : "Record a decision"}
        </h2>
        <Button variant="ghost" disabled={busy} onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="context-text">
        {draft.item?.situation || draft.entry?.situation}
      </p>
      {draft.kind === "review" && (
        <p className="notice">
          The team can already act on the CoS answer. It remains recorded as a
          one-off; your approved wording governs future cases.
        </p>
      )}
      {draft.kind === "replace" && (
        <p className="notice">
          The old rule will remain attached to its replacement. A reason for the
          change is required.
        </p>
      )}
      <form onSubmit={submit} className="fields">
        <fieldset disabled={readOnly} className="fields demo-fields">
          <label>
            Decision
            <Textarea
              required
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            />
          </label>
          <label>
            Reasoning
            <Textarea
              required
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
          </label>
          <label>
            Exception <small>(optional)</small>
            <Textarea
              value={exception}
              onChange={(e) => setException(e.target.value)}
            />
          </label>
          {role === "founder" && (
            <label>
              Future use
              <NativeSelect
                required
                value={publish}
                onChange={(e) => setPublish(e.target.value)}
                disabled={draft.kind === "replace" || draft.kind === "promote"}
              >
                <NativeSelectOption value="">Choose one</NativeSelectOption>
                <NativeSelectOption value="yes">
                  Save as precedent for future search
                </NativeSelectOption>
                <NativeSelectOption value="no">One-off only</NativeSelectOption>
              </NativeSelect>
            </label>
          )}
          {role === "cos" && (
            <p className="notice">
              This will be an immediately actionable one-off, awaiting founder
              review.
            </p>
          )}
          {publish === "yes" && role === "founder" && (
            <>
              <label>
                Category
                <NativeSelect
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <NativeSelectOption value="">
                    Choose category
                  </NativeSelectOption>
                  {categories.map((c) => (
                    <NativeSelectOption key={c}>{c}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label>
                Replace an existing rule <small>(optional)</small>
                <NativeSelect
                  value={oldId}
                  onChange={(e) => setOldId(e.target.value)}
                  disabled={draft.kind === "replace"}
                >
                  <NativeSelectOption value="">
                    Do not replace a rule
                  </NativeSelectOption>
                  {entries
                    .filter((e) => e.status === "Active")
                    .map((e) => (
                      <NativeSelectOption key={e.id} value={e.id}>
                        {e.title}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </label>
              {oldId && (
                <label>
                  Why is the rule changing?
                  <Textarea
                    required
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                  />
                </label>
              )}
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : error
                ? "Retry"
                : draft.kind === "review"
                  ? publish === "yes"
                    ? "Approve for future use"
                    : "Keep as one-off"
                  : "Save decision"}
          </Button>
        </fieldset>
      </form>
    </section>
  );
}

function CreatePrecedentForm({
  onSave,
  onClose,
}: {
  onSave: (action: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [situation, setSituation] = useState("");
  const [category, setCategory] = useState("");
  const [decision, setDecision] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [conditions, setConditions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const actionId = useRef(crypto.randomUUID());
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await onSave({
        kind: "createPrecedent",
        id: actionId.current,
        title,
        situation,
        category,
        decision,
        reasoning,
        exception: conditions,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="edit-panel" aria-label="Add a precedent">
      <div className="section-heading">
        <div>
          <h2>Add precedent</h2>
          <p className="muted">Real library · PIN-protected</p>
        </div>
        <Button variant="ghost" disabled={busy} onClick={onClose}>
          Close
        </Button>
      </div>
      <p className="context-text">
        Record a decision the founder actually made, using their own words.
      </p>
      <form onSubmit={submit} className="fields">
        <fieldset disabled={busy} className="fields demo-fields">
          <label>
            Short title
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="For example, Influencer collaboration budget"
            />
          </label>
          <label>
            Situation
            <Textarea
              required
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="What happened, in the founder’s words?"
            />
          </label>
          <label>
            Category
            <NativeSelect
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <NativeSelectOption value="">Choose category</NativeSelectOption>
              {categories.map((c) => (
                <NativeSelectOption key={c}>{c}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label>
            Decision
            <Textarea
              required
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            />
          </label>
          <label>
            Reasoning
            <Textarea
              required
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
          </label>
          <label>
            Conditions <small>(optional)</small>
            <Textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="When should the team apply this decision?"
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Adding…" : error ? "Retry" : "Add to real library"}
          </Button>
        </fieldset>
      </form>
    </section>
  );
}

export default function PrecedentApp({
  demo = false,
  teamWorkspace = false,
  demoRole = "founder",
  onDemo,
  onDemoRole,
  onStaff,
  demoLearning,
  onLearningApprove,
}: {
  demo?: boolean;
  teamWorkspace?: boolean;
  demoRole?: "founder" | "cos";
  onDemo?: (source?: string) => void;
  onDemoRole?: (role: "founder" | "cos") => void;
  onStaff?: () => void;
  demoLearning?: DemoLearningState;
  onLearningApprove?: (id: string, approval: LearningApproval) => void;
} = {}) {
  const [sessionLearning, setSessionLearning] =
    useState<DemoLearningState>(emptyLearningState);
  const [learningTest, setLearningTest] = useState<string | undefined>(
    undefined,
  );
  const [showLanding, setShowLanding] = useState(false);
  const [demoPreviewRole, setDemoPreviewRole] = useState<
    "founder" | "cos" | null
  >(null);
  const [showStaff, setShowStaff] = useState(false);
  const [guidedSituation, setGuidedSituation] = useState("");
  const [report, setReport] = useState<Entry | null>(null);
  const [data, setData] = useState<Snapshot>(() =>
    demo ? founderDemoSnapshot(demoRole) : initial,
  );
  const [loading, setLoading] = useState(!demo);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>(demo ? "submitted" : "search");
  const [text, setText] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [queryError, setQueryError] = useState("");
  const [category, setCategory] = useState("All categories");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryStatus, setLibraryStatus] = useState("All statuses");
  const [libraryLimit, setLibraryLimit] = useState(20);
  const [createdTest, setCreatedTest] = useState("");
  const [meaningEntryId, setMeaningEntryId] = useState<string | null>(null);
  const [meaningEntryScore, setMeaningEntryScore] = useState(1);
  const [rejectedMatch, setRejectedMatch] = useState(false);
  const [searchingMeaning, setSearchingMeaning] = useState(false);
  const [searchDiagnostic, setSearchDiagnostic] =
    useState<SearchDiagnosticData | null>(null);
  const [access, setAccess] = useState(false);
  const [accessRole, setAccessRole] = useState("founder");
  const [pin, setPin] = useState("");
  const [accessError, setAccessError] = useState("");
  const [accessBusy, setAccessBusy] = useState(false);
  const [escalation, setEscalation] = useState<{
    text: string;
    sourceId?: string;
    id: string;
  } | null>(null);
  const [submitter, setSubmitter] = useState("");
  const [priority, setPriority] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [creatingPrecedent, setCreatingPrecedent] = useState(false);
  const authVersion = useRef(0);
  const lastPageviewSurface = useRef<string | null>(null);
  const request = useCallback(
    <T,>(path: string, body?: unknown, method = "POST") =>
      apiRequest<T>(path, body, method, teamWorkspace),
    [teamWorkspace],
  );
  const refresh = useCallback(async () => {
    if (demo) return;
    const version = authVersion.current;
    try {
      const result = await request<Snapshot>("/api/state", undefined, "GET");
      if (version !== authVersion.current) return;
      setData(result);
      if (result.role === "team") {
        setDraft(null);
        setReport(null);
        setEscalation(null);
      }
      setLoadError("");
    } catch {
      if (version === authVersion.current) {
        setData(initial);
        setDraft(null);
        setReport(null);
        setEscalation(null);
      }
      if (version === authVersion.current)
        setLoadError("Couldn't load precedents — try again");
    } finally {
      setLoading(false);
    }
  }, [demo, request]);
  useEffect(() => {
    if (demo) return;
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [refresh, demo]);
  function go(next: View) {
    setView(next);
    setDraft(null);
    setCreatingPrecedent(false);
    setNotice("");
  }
  async function recordRealMatch() {
    captureEvent("precedent_matched", demo ? "demo" : "real");
    if (demo) return;
    try {
      await request("/api/state", {
        kind: "recordMatch",
        id: crypto.randomUUID(),
      });
    } catch {
      /* Search still works if usage counting is temporarily unavailable. */
    }
  }
  function escalate(entry?: Entry) {
    if (demo) return;
    const situation = text.trim() || entry?.situation || "";
    const source = entry || matches[0]?.entry;
    const useGuide =
      query === text.trim() && source?.id === matches[0]?.entry.id;
    setEscalation({
      text: useGuide && guidedSituation ? guidedSituation : situation,
      sourceId: source?.id,
      id: crypto.randomUUID(),
    });
    setSubmitter("");
    setPriority("");
    setSubmitError("");
  }
  async function saveEscalation(e: FormEvent) {
    e.preventDefault();
    if (demo) return;
    if (!escalation || submitLock.current) return;
    submitLock.current = true;
    setSaving(true);
    setSubmitError("");
    try {
      const response = await request<{ case?: Situation; warning?: string }>(
        "/api/state",
        {
          kind: "escalate",
          id: escalation.id,
          situation: escalation.text,
          sourceId: escalation.sourceId,
          submitter,
          priority,
        },
      );
      captureEvent("case_submitted", "real");
      captureEvent("escalation_submitted", "real");
      setEscalation(null);
      setView("submitted");
      setExpandedCase(response.case?.id || null);
      setNotice(response.warning || "Saved.");
      await refresh();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }
  async function saveReport(action: Record<string, unknown>) {
    if (demo) throw new Error("Demo is read-only.");
    try {
      const response = await request<{ warning?: string }>(
        "/api/state",
        action,
      );
      setReport(null);
      setView("submitted");
      setNotice(response.warning || "Report saved for founder review.");
      await refresh();
    } catch (e) {
      await refresh();
      throw e;
    }
  }
  async function saveDecision(action: Record<string, unknown>) {
    if (demo) throw new Error("Demo is read-only.");
    try {
      const response = await request<{ warning?: string }>(
        "/api/state",
        action,
      );
      const created =
        action.savePrecedent === true ||
        action.kind === "promote" ||
        action.kind === "replace" ||
        action.kind === "createPrecedent";
      if (created) captureEvent("decision_approved", "real");
      if (action.kind === "createPrecedent")
        captureEvent("precedent_added", "real");
      setNotice(response.warning || (created ? "Precedent created" : "Saved."));
      setCreatedTest(
        created
          ? typeof action.situation === "string"
            ? action.situation
            : draft?.item?.situation || draft?.entry?.situation || ""
          : "",
      );
      setDraft(null);
      setCreatingPrecedent(false);
      await refresh();
    } catch (e) {
      await refresh();
      throw e;
    }
  }
  async function unlock(e: FormEvent) {
    e.preventDefault();
    if (demo) return;
    if (accessBusy) return;
    setAccessBusy(true);
    setAccessError("");
    try {
      const result = await request<{ role: Role }>("/api/auth", {
        role: accessRole,
        pin,
      });
      authVersion.current += 1;
      setData((previous) => ({ ...previous, role: result.role }));
      setPin("");
      setAccess(false);
      setView("queue");
      await refresh();
    } catch (e) {
      setAccessError((e as Error).message);
    } finally {
      setAccessBusy(false);
    }
  }
  async function backToTeam() {
    if (demo) return;
    if (accessBusy) return;
    if (
      draft &&
      !window.confirm(
        "Return to team view? Any unsaved decision changes will be discarded.",
      )
    )
      return;
    setAccessBusy(true);
    setAccessError("");
    try {
      await request<{ role: Role }>("/api/auth", undefined, "DELETE");
      authVersion.current += 1;
      setData(initial);
      setReport(null);
      setEscalation(null);
      setQuery(null);
      setText("");
      setView("search");
      setDraft(null);
      setAccess(false);
      setPin("");
      setNotice(
        "You’re back in team view. Founder and CoS actions are locked.",
      );
      await refresh();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setAccessBusy(false);
    }
  }
  function switchRole(role: Role) {
    if (demo) return;
    if (accessBusy) return;
    if (role === "team") {
      if (data.role !== "team") {
        void backToTeam();
        return;
      }
      setAccess(false);
      setPin("");
      setAccessError("");
      return;
    }
    if (role === data.role) {
      setAccess(false);
      setPin("");
      return;
    }
    if (
      draft &&
      !window.confirm(
        "Switch views? Any unsaved decision changes will be discarded.",
      )
    )
      return;
    setDraft(null);
    setAccessRole(role);
    setPin("");
    setAccessError("");
    setAccess(true);
  }
  async function runSearch() {
    const nextQuery = text.trim();
    if (!nextQuery) {
      setQueryError("Describe the situation first.");
      return;
    }
    captureEvent("precedent_search", demo ? "demo" : "real");
    setQueryError("");
    setGuidedSituation("");
    setMeaningEntryId(null);
    setRejectedMatch(false);
    setQuery(nextQuery);
    const confident = search(data.entries, nextQuery).find(
      (result) => !result.possible,
    );
    const learnedConfident = findLearnedPrecedent(
      demoLearning?.precedents || [],
      nextQuery,
    );
    const candidates = [
      ...(demoLearning?.precedents || [])
        .filter((item) => item.status === "Approved")
        .map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.conditions,
        })),
      ...data.entries
        .filter((entry) => entry.status === "Active")
        .map((entry) => ({
          id: entry.id,
          title: entry.title,
          summary: entry.exception || `Category: ${entry.category}`,
        })),
    ];
    if (confident || learnedConfident) {
      const report = {
        query: nextQuery,
        count: candidates.length,
        ids: candidates.map((item) => item.id),
        aiAttempted: false,
        aiSucceeded: false,
        path: "word-list path" as const,
        rawModelReply: null,
        ...meaningRuntimeStatus(),
      };
      setSearchDiagnostic(report);
      printSearchDiagnostic(report);
      void recordRealMatch();
      return;
    }
    setSearchingMeaning(true);
    const semantic = await findMeaningMatch(nextQuery, candidates, (result) => {
      const report = {
        query: nextQuery,
        count: candidates.length,
        ids: candidates.map((item) => item.id),
        ...result,
      };
      setSearchDiagnostic(report);
      printSearchDiagnostic(report);
    });
    setMeaningEntryId(semantic?.id ?? null);
    setMeaningEntryScore(semantic?.score ?? 1);
    setSearchingMeaning(false);
    if (semantic) void recordRealMatch();
  }
  const wordMatches = query
    ? search(data.entries, query).filter((result) => !result.possible)
    : [];
  const learnedSearchMatch = query
    ? findLearnedPrecedent(demoLearning?.precedents || [], query)?.precedent ||
      (meaningEntryId
        ? (demoLearning?.precedents || []).find(
            (item) => item.id === meaningEntryId,
          )
        : undefined)
    : undefined;
  const meaningEntry = meaningEntryId
    ? data.entries.find(
        (entry) => entry.id === meaningEntryId && entry.status === "Active",
      )
    : undefined;
  const matches = wordMatches.length
    ? wordMatches
    : meaningEntry
      ? [{ entry: meaningEntry, score: meaningEntryScore, possible: false }]
      : [];
  const active = data.entries.filter((e) => e.status === "Active");
  const founderOnly =
    !!escalation &&
    (publicRisk(escalation.text) ||
      !!data.entries.find((e) => e.id === escalation.sourceId)?.founderOnly);
  const updatedAt = (entry: Entry) =>
    Math.max(
      entry.createdAt,
      ...data.entries
        .filter((e) => e.supersedesId === entry.id)
        .map((e) => e.createdAt),
      ...data.cases
        .filter((c) => c.feedback?.resolution?.entryId === entry.id)
        .map((c) => c.feedback!.resolution!.at),
    );
  const learnedLibrary = (demoLearning?.precedents || []).filter(
    (p) =>
      (category === "All categories" || category === "Not recorded") &&
      (libraryStatus === "All statuses" || libraryStatus === "Approved") &&
      `${p.title} ${p.decision} ${p.conditions}`
        .toLowerCase()
        .includes(libraryQuery.toLowerCase()),
  );
  const library = (view === "manage" ? data.entries : active)
    .filter(
      (e) =>
        (category === "All categories" || e.category === category) &&
        (libraryStatus === "All statuses" || e.status === libraryStatus) &&
        (!libraryQuery ||
          `${e.title} ${e.situation} ${e.decision} ${e.reasoning}`
            .toLowerCase()
            .includes(libraryQuery.toLowerCase())),
    )
    .sort((a, b) => updatedAt(b) - updatedAt(a));

  const people = data.people || [];
  const queued = queue(data.cases, data.role);
  const isStaff = data.role !== "team";
  const analyticsSurface =
    demo || (!isStaff && !teamWorkspace) ? "demo" : "real";
  useEffect(() => {
    if (lastPageviewSurface.current === analyticsSurface) return;
    lastPageviewSurface.current = analyticsSurface;
    capturePageview(analyticsSurface);
  }, [analyticsSurface]);
  if (!demo && !isStaff && demoPreviewRole)
    return (
      <PrecedentApp
        key={demoPreviewRole}
        demo
        demoRole={demoPreviewRole}
        demoLearning={
          demoPreviewRole === "founder" ? sessionLearning : undefined
        }
        onLearningApprove={
          demoPreviewRole === "founder"
            ? (id, approval) => {
                setSessionLearning(
                  approveLearningCase(sessionLearning, id, approval),
                );
                captureEvent("decision_approved", "demo");
              }
            : undefined
        }
        onDemo={(source) => {
          setLearningTest(source);
          setDemoPreviewRole(null);
        }}
        onDemoRole={setDemoPreviewRole}
        onStaff={() => {
          setDemoPreviewRole(null);
          setShowStaff(true);
        }}
      />
    );
  if (!demo && !isStaff && showLanding && !showStaff)
    return (
      <Landing
        onDemo={() => setShowLanding(false)}
        onFounder={() => {
          setShowLanding(false);
          setDemoPreviewRole("founder");
        }}
        onCos={() => {
          setShowLanding(false);
          setDemoPreviewRole("cos");
        }}
        onStaff={() => {
          setShowLanding(false);
          setShowStaff(true);
        }}
      />
    );
  if (!isStaff && !teamWorkspace)
    return (
      <PublicDemo
        testSituation={learningTest}
        learningState={sessionLearning}
        onLearningSubmit={(text) => {
          setSessionLearning(submitLearningCase(sessionLearning, text));
          captureEvent("case_submitted", "demo");
        }}
        initialStaff={showStaff}
        onFounder={() => {
          setShowStaff(false);
          setDemoPreviewRole("founder");
        }}
        onCos={() => {
          setShowStaff(false);
          setDemoPreviewRole("cos");
        }}
        onLogin={async (role, pin) => {
          await request("/api/auth", { role, pin });
          authVersion.current += 1;
          setView("queue");
          await refresh();
        }}
      />
    );
  return (
    <div className={`app-shell ${demo ? "founder-demo" : ""}`}>
      {demo ? (
        <DemoHeader
          mode={demoRole}
          onDemo={() => onDemo?.()}
          onFounder={() => onDemoRole?.("founder")}
          onCos={() => onDemoRole?.("cos")}
          onStaff={() => onStaff?.()}
        />
      ) : (
        <header className="topbar">
          <div className="brand">
            <span className="brand-icon">
              <BookOpen size={22} />
            </span>
            <div>
              <strong>SCENTIRA</strong>
              <span>Decision Precedent Tool</span>
            </div>
          </div>
          <div className="access-actions">
            <span className="role-description">View as</span>
            <div className="role-toggle" role="group" aria-label="Switch view">
              {(["team", "founder", "cos"] as const).map((role) => (
                <Button
                  key={role}
                  variant="ghost"
                  className={`role-choice${data.role === role ? " is-active" : ""}`}
                  aria-pressed={data.role === role}
                  aria-label={
                    role === "cos" ? "Chief of staff view" : `${role} view`
                  }
                  disabled={accessBusy || loading}
                  onClick={() => switchRole(role)}
                >
                  {role === "team"
                    ? "Team"
                    : role === "founder"
                      ? "Founder"
                      : "CoS"}
                </Button>
              ))}
            </div>
          </div>
        </header>
      )}
      <nav className="tabs" aria-label="Main navigation">
        <Button
          aria-current={view === "search" ? "page" : undefined}
          variant={view === "search" ? "secondary" : "ghost"}
          onClick={() => go("search")}
        >
          <Search size={15} />
          Find a precedent
        </Button>
        <Button
          aria-current={
            view === "queue" || view === "submitted" ? "page" : undefined
          }
          variant={
            view === "queue" || view === "submitted" ? "secondary" : "ghost"
          }
          onClick={() => go("queue")}
        >
          <Inbox size={15} />
          Decision queue{" "}
          <span className="count">
            {data.cases.length + (demoLearning?.cases.length || 0)}
          </span>
        </Button>
        {data.role === "founder" && (
          <Button
            aria-current={view === "manage" ? "page" : undefined}
            variant={view === "manage" ? "secondary" : "ghost"}
            onClick={() => go("manage")}
          >
            <Library size={15} />
            Manage precedents
          </Button>
        )}
      </nav>
      <main className="workspace">
        {access && (
          <section className="edit-panel">
            <div className="section-heading">
              <h2>
                Unlock {accessRole === "founder" ? "founder" : "chief of staff"}{" "}
                view
              </h2>
              <Button
                variant="ghost"
                disabled={accessBusy}
                onClick={() => {
                  setAccess(false);
                  setPin("");
                }}
              >
                Close
              </Button>
            </div>
            <p className="muted">
              Enter this role’s PIN to switch views. Your current view stays
              active until it’s accepted.
            </p>
            <form className="access-form" onSubmit={unlock}>
              <label>
                Shared PIN
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={accessBusy}>
                {accessBusy ? "Checking…" : "Unlock"}
              </Button>
            </form>
            {accessError && (
              <p className="error" role="alert">
                {accessError}
              </p>
            )}
          </section>
        )}
        {notice && (
          <p className="notice" role="status">
            {notice}
            {createdTest && (
              <Button
                onClick={() => {
                  go("search");
                  setText(createdTest);
                  setQuery(createdTest);
                  setCreatedTest("");
                }}
              >
                Test this decision
              </Button>
            )}
            <Button variant="ghost" onClick={() => setNotice("")}>
              Dismiss
            </Button>
          </p>
        )}
        {loadError && (
          <div className="error" role="alert">
            {loadError}
            <Button variant="outline" onClick={refresh}>
              Retry
            </Button>
            <p>
              Any previous results may be out of date. Your entered text is
              preserved.
            </p>
          </div>
        )}
        {view === "search" && (
          <>
            <h1>What are you stuck on?</h1>
            <p className="intro">Find a past decision. Know your next step.</p>
            {demo && <SearchDiagnostic data={searchDiagnostic} />}
            <form
              className="search-panel"
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch();
              }}
            >
              <label htmlFor="situation">Describe the situation</label>
              {demo && (
                <p className="demo-safety">
                  Demo data only. Searches are not saved.
                </p>
              )}
              <Textarea
                id="situation"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setGuidedSituation("");
                  setMeaningEntryId(null);
                }}
                placeholder="For example, a customer received a damaged perfume but has no unboxing video…"
              />
              <div className="search-actions">
                {!demo && (
                  <small>
                    Founder’s words, not AI advice. Search isn’t saved.
                  </small>
                )}
                <Button
                  type="submit"
                  disabled={loading || !!loadError || searchingMeaning}
                >
                  <Search size={16} />
                  {searchingMeaning ? "Checking meaning…" : "Find a decision"}
                </Button>
              </div>
              {queryError && (
                <p className="error" role="alert">
                  {queryError}
                </p>
              )}
            </form>
            <Button
              variant="link"
              className="browse-link"
              onClick={() => go("browse")}
            >
              <Library size={14} />
              Browse by category
              <ArrowUpRight size={14} />
            </Button>
            {!loadError && (
              <section className="library-section">
                <div className="section-heading">
                  <h2>
                    {query === null
                      ? "From your precedent library"
                      : searchingMeaning
                        ? "Checking approved precedents by meaning…"
                        : learnedSearchMatch || matches.length
                          ? "Closest approved decision"
                          : "Nothing like this has come up before"}
                  </h2>
                  <span>
                    {active.length + (demoLearning?.precedents.length || 0)}{" "}
                    ACTIVE RULES · 3 CATEGORIES
                  </span>
                </div>
                {loading ? (
                  <p className="muted" role="status">
                    Loading the shared library…
                  </p>
                ) : query === null ? (
                  active
                    .slice(0, 3)
                    .map((entry, i) => (
                      <PrecedentCard
                        key={`initial-${entry.id}`}
                        entry={entry}
                        entries={data.entries}
                        expanded={i === 0}
                        onEscalate={demo ? undefined : escalate}
                        onReport={demo ? undefined : setReport}
                      />
                    ))
                ) : (
                  !searchingMeaning && (
                    <>
                      {(learnedSearchMatch || matches[0]) && !rejectedMatch && (
                        <div className="match-introduction">
                          <p>Check that this situation matches yours before applying.</p>
                          <p className="situation-copy">
                            {learnedSearchMatch?.sourceCase.situation || matches[0]?.entry.situation}
                          </p>
                        </div>
                      )}
                      {learnedSearchMatch && (
                        <LearnedDecisionCard precedent={learnedSearchMatch} />
                      )}{" "}
                      {!rejectedMatch && matches.map(({ entry, possible, score }, i) => (
                        <PrecedentCard
                          key={`${query}-${entry.id}`}
                          followUp={
                            i === 0 && query === text.trim() ? (
                              isFragrancePrecedent(entry) ? (
                                <ConditionSelector
                                  surface={demo ? "demo" : "real"}
                                  precedentId={entry.id}
                                  matchScore={score}
                                  onReject={() => setRejectedMatch(true)}
                                  onApply={async (row) => {
                                    if (demo) return;
                                    await request("/api/state", {
                                      kind: "conditionApplied",
                                      id: crypto.randomUUID(),
                                      precedentId: entry.id,
                                      conditionId: row.id,
                                    });
                                  }}
                                />
                              ) : demo ? (
                                entry.id === "fictional-discount" ? (
                                  <DiscountDecision
                                    demo
                                    onCheck={async (value) =>
                                      demoDiscount(value)
                                    }
                                  />
                                ) : (
                                  <div className="rule-box">
                                    <h4>CONDITIONS — CHECK BEFORE APPLYING</h4>
                                    <ConditionSummary
                                      condition={entry.exception}
                                      decision={entry.decision}
                                    />
                                    <Button variant="outline" onClick={() => { capturePrecedentRejected(analyticsSurface,entry.id,score); setRejectedMatch(true); }}>
                                      This is not my situation, ask the founder
                                    </Button>
                                  </div>
                                )
                              ) : (
                                <>
                                  <div className="rule-box">
                                    <h4>CONDITIONS — CHECK BEFORE APPLYING</h4>
                                    <ConditionSummary
                                      condition={entry.exception}
                                      decision={entry.decision}
                                    />
                                    <Button variant="outline" onClick={() => { capturePrecedentRejected(analyticsSurface,entry.id,score); setRejectedMatch(true); }}>
                                      This is not my situation, ask the founder
                                    </Button>
                                  </div>
                                  <StaffFollowUp
                                    entryId={entry.id}
                                    situation={text}
                                    onContext={setGuidedSituation}
                                  />
                                </>
                              )
                            ) : undefined
                          }
                          entry={entry}
                          entries={data.entries}
                          expanded={i === 0}
                          possible={possible}
                          onEscalate={demo ? undefined : escalate}
                          onReport={demo ? undefined : setReport}
                        />
                      ))}
                      {rejectedMatch && (
                        <div className="escalation-callout" role="status">
                          <div>
                            <p>No approved precedent covers this situation yet. Ask the founder.</p>
                          </div>
                          <Button onClick={() => escalate(matches[0]?.entry)}>
                            Send to the founder
                          </Button>
                        </div>
                      )}
                    </>
                  )
                )}
                {!demo && query !== null && !searchingMeaning && (
                  <div className="escalation-callout">
                    <div>
                      <strong>
                        {matches.length
                          ? "Not the right fit?"
                          : "New situation. Human judgment."}
                      </strong>
                      <p>
                        Carry your description forward and ask for a decision.
                      </p>
                    </div>
                    <Button
                      variant={matches.length ? "outline" : "default"}
                      onClick={() => escalate()}
                      disabled={loading}
                    >
                      Escalate
                      <ArrowUpRight size={14} />
                    </Button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
        {(view === "browse" || view === "manage") && (
          <>
            <div className="eyebrow">THE SHARED LIBRARY</div>
            <div className="section-heading">
              <div>
                <h1>
                  {view === "manage"
                    ? "Manage precedents"
                    : "Browse by category"}
                </h1>
                <p className="intro">
                  Current rules first. Previous rules stay attached so changes
                  make sense.
                </p>
              </div>
              {view === "manage" &&
                !demo &&
                data.role === "founder" &&
                !creatingPrecedent && (
                  <Button onClick={() => setCreatingPrecedent(true)}>
                    Add precedent
                  </Button>
                )}
            </div>
            {view === "manage" && creatingPrecedent && (
              <CreatePrecedentForm
                onSave={saveDecision}
                onClose={() => setCreatingPrecedent(false)}
              />
            )}
            <div className="filters">
              <label>
                Category
                <NativeSelect
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <NativeSelectOption>All categories</NativeSelectOption>
                  {demo && (
                    <NativeSelectOption>Not recorded</NativeSelectOption>
                  )}
                  {categories.map((c) => (
                    <NativeSelectOption key={c}>{c}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label>
                Status
                <NativeSelect
                  value={libraryStatus}
                  onChange={(e) => {
                    setLibraryStatus(e.target.value);
                    setLibraryLimit(20);
                  }}
                >
                  {[
                    "All statuses",
                    "Active",
                    "Superseded",
                    "No rule",
                    ...(demo ? ["Approved"] : []),
                  ].map((status) => (
                    <NativeSelectOption key={status}>
                      {status}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              <label>
                Find in library
                <Input
                  value={libraryQuery}
                  onChange={(e) => {
                    setLibraryQuery(e.target.value);
                    setLibraryLimit(20);
                  }}
                  placeholder="Title or situation…"
                />
              </label>
            </div>
            <p className="muted">
              {library.length + learnedLibrary.length} matching precedents ·
              Most recently updated first
            </p>
            {view === "manage" &&
              learnedLibrary.slice(0, libraryLimit).map((p) => (
                <div key={p.id}>
                  <p className="muted">
                    Category: Not recorded · Last updated {p.approvalDate}
                  </p>
                  <LearnedDecisionCard precedent={p} />
                  <Button
                    variant="outline"
                    onClick={() => onDemo?.(p.sourceCase.situation)}
                  >
                    Test this decision
                  </Button>
                </div>
              ))}
            {!loadError &&
              library.slice(0, libraryLimit).map((entry) => (
                <div key={entry.id}>
                  <p className="muted">Last updated {date(updatedAt(entry))}</p>
                  <PrecedentCard
                    key={entry.id}
                    entry={entry}
                    entries={data.entries}
                    onEscalate={demo ? undefined : escalate}
                    onReport={demo ? undefined : setReport}
                    onReplace={
                      view === "manage" && data.role === "founder"
                        ? (entry) => setDraft({ kind: "replace", entry })
                        : undefined
                    }
                  />
                </div>
              ))}
            {Math.max(library.length, learnedLibrary.length) > libraryLimit && (
              <Button
                variant="outline"
                onClick={() => setLibraryLimit((n) => n + 20)}
              >
                Show 20 more
              </Button>
            )}
            {!loading &&
              !loadError &&
              !library.length &&
              !learnedLibrary.length && (
                <p className="empty">No precedents in this selection.</p>
              )}
          </>
        )}
        {(view === "submitted" || view === "queue") && (
          <DecisionQueue
            items={[
              ...(demoLearning?.cases || []).map((item) => ({
                id: item.id,
                title: item.situation,
                summary: `${item.customer} · ${item.orderId} · ${item.date}`,
                pending: item.status === "Pending founder approval",
                label: item.status,
                action:
                  item.status === "Approved in demo"
                    ? "View decision"
                    : "Review demo exception",
              })),
              ...[...data.cases]
                .sort((a, b) =>
                  (queued.includes(a) ? queued.indexOf(a) : -1) === -1
                    ? queued.includes(b)
                      ? 1
                      : a.createdAt - b.createdAt
                    : queued.includes(b)
                      ? queued.indexOf(a) - queued.indexOf(b)
                      : -1,
                )
                .map((item) => ({
                  id: item.id,
                  title: item.situation,
                  summary: `${item.submitter} · ${date(item.createdAt)}`,
                  pending: item.feedback
                    ? !item.feedback.resolution
                    : !item.answer ||
                      (item.answer.role === "cos" && !item.review),
                  label:
                    item.answer?.role === "cos" && !item.review
                      ? "CoS answered · Founder review pending"
                      : item.answer
                        ? "Answered"
                        : "Pending",
                  action:
                    item.answer?.role === "cos" &&
                    !item.review &&
                    data.role === "founder"
                      ? "Review CoS decision"
                      : item.answer
                        ? "View decision"
                        : "Open request",
                })),
            ]}
            onSelect={(id) => {
              setExpandedCase(id);
              const item = data.cases.find((c) => c.id === id);
              setDraft(
                item && !item.feedback
                  ? data.role === "founder" &&
                    item.answer?.role === "cos" &&
                    !item.review
                    ? { kind: "review", item }
                    : !item.answer && queued.includes(item)
                      ? { kind: "answer", item }
                      : null
                  : null,
              );
            }}
            renderDetail={(id) => {
              const learning = demoLearning?.cases.find((c) => c.id === id);
              if (learning && demoLearning && onLearningApprove) {
                const precedent = demoLearning.precedents.find(
                  (p) => p.sourceCase.id === id,
                );
                return precedent ? (
                  <>
                    <div className="approval-success" role="status">
                      <h2>Precedent created</h2>
                      <p>
                        Fictional demo approval. Test how this decision handles
                        different wording.
                      </p>
                      <Button
                        onClick={() => onDemo?.(precedent.sourceCase.situation)}
                      >
                        Test this decision
                      </Button>
                    </div>
                    <LearnedDecisionCard precedent={precedent} />
                  </>
                ) : (
                  <ApprovalForm
                    key={id}
                    item={learning}
                    onApprove={onLearningApprove}
                  />
                );
              }
              const item = data.cases.find((c) => c.id === id);
              if (!item) return null;
              if (item.feedback)
                return (
                  <RuleFeedbackCase
                    key={id}
                    item={item}
                    entries={data.entries}
                    role={data.role}
                    onSave={saveDecision}
                  />
                );
              const precedent = data.entries.find(
                (e) => e.id === item.precedentId,
              );
              return (
                <>
                  {draft?.item?.id !== id && (
                    <>
                      <h2>{item.situation}</h2>
                      <p className="muted">
                        {item.submitter} · {date(item.createdAt)}
                      </p>
                      {item.founderOnly && (
                        <p className="notice">
                          Founder-only · No timed CoS fallback
                        </p>
                      )}
                      {item.answer && (
                        <>
                          <div className="rule-box">
                            <h4>
                              {precedent
                                ? "RECORDED DECISION"
                                : "ONE-OFF — NOT A PRECEDENT"}
                            </h4>
                            <p>{item.answer.decision}</p>
                          </div>
                          <p>
                            <strong>Reasoning:</strong> {item.answer.reasoning}
                          </p>
                          <p>
                            <strong>Exception:</strong>{" "}
                            {item.answer.exception || "None recorded"}
                          </p>
                        </>
                      )}
                      {item.answer && (
                        <CaseFeedback
                          item={item}
                          readOnly={demo}
                          onSave={saveDecision}
                        />
                      )}{" "}
                      {precedent && (
                        <>
                          <Button
                            onClick={() => {
                              go("search");
                              setText(item.situation);
                              setQuery(item.situation);
                            }}
                          >
                            Test this decision
                          </Button>
                          <PrecedentCard
                            entry={precedent}
                            entries={data.entries}
                          />
                        </>
                      )}
                    </>
                  )}
                  {draft?.item?.id === id ? (
                    <DecisionForm
                      readOnly={demo}
                      key={`${draft.kind}-${id}`}
                      draft={draft}
                      role={data.role}
                      entries={data.entries}
                      onSave={saveDecision}
                      onClose={() => setDraft(null)}
                    />
                  ) : (
                    data.role === "founder" &&
                    item.answer &&
                    !precedent && (
                      <Button
                        onClick={() =>
                          setDraft({
                            kind:
                              item.answer?.role === "cos" && !item.review
                                ? "review"
                                : "promote",
                            item,
                          })
                        }
                      >
                        {item.answer.role === "cos" && !item.review
                          ? "Review CoS decision"
                          : "Make this a precedent"}
                      </Button>
                    )
                  )}
                </>
              );
            }}
          />
        )}

        {!demo && report && (
          <ReportRuleForm
            people={people}
            key={report.id}
            entry={report}
            onSave={saveReport}
            onClose={() => setReport(null)}
          />
        )}
        {!demo && escalation && (
          <section className="edit-panel" aria-label="Escalate situation">
            <div className="section-heading">
              <h2>Ask for a decision</h2>
              <Button
                disabled={saving}
                variant="ghost"
                onClick={() => setEscalation(null)}
              >
                Close
              </Button>
            </div>
            <form className="fields" onSubmit={saveEscalation}>
              <label>
                Situation
                <Textarea
                  required
                  value={escalation.text}
                  onChange={(e) => {
                    setEscalation({ ...escalation, text: e.target.value });
                    setPriority("");
                  }}
                />
              </label>
              <label>
                Submitted by
                <NativeSelect
                  required
                  value={submitter}
                  onChange={(e) => setSubmitter(e.target.value)}
                >
                  <NativeSelectOption value="">
                    Choose your name
                  </NativeSelectOption>
                  {people.map((p) => (
                    <NativeSelectOption key={p.name}>
                      {p.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              {founderOnly && (
                <p className="notice amber">
                  This public-escalation policy requires High priority and a
                  founder decision, without timed CoS backup.
                </p>
              )}
              <label>
                Priority <small>(you must choose)</small>
                <NativeSelect
                  required
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <NativeSelectOption value="">
                    Choose High, Medium or Low
                  </NativeSelectOption>
                  {["High", "Medium", "Low"].map((p) => (
                    <NativeSelectOption
                      key={p}
                      disabled={founderOnly && p !== "High"}
                    >
                      {p}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </label>
              {submitError && (
                <p role="alert" className="error">
                  {submitError}
                </p>
              )}
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : submitError
                    ? "Retry"
                    : priority
                      ? `Submit as ${priority} priority`
                      : "Choose a priority to submit"}
              </Button>
            </form>
          </section>
        )}
        {draft && view !== "queue" && view !== "submitted" && (
          <DecisionForm
            readOnly={demo}
            key={`${draft.kind}-${draft.item?.id || draft.entry?.id}`}
            draft={draft}
            role={data.role}
            entries={data.entries}
            onSave={saveDecision}
            onClose={() => setDraft(null)}
          />
        )}

        {!demo && (
          <footer>
            <ShieldCheck size={15} />
            Shared decisions. Human judgment.
            <span>
              {loading ? (
                "Connecting…"
              ) : loadError ? (
                "Connection interrupted"
              ) : (
                <>
                  <Check size={13} />
                  {data.services?.storage === "convex"
                    ? "Convex connected"
                    : "Local database connected"}
                </>
              )}
            </span>
          </footer>
        )}
      </main>
    </div>
  );
}
