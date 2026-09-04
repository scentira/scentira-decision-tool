"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fragranceConditions } from "@/lib/fragrance-conditions";
import { captureEvent, capturePrecedentRejected, type Surface } from "@/lib/analytics";
import {
  conditionItems,
  hasConditionSeparators,
} from "@/lib/condition-display";

export function ConditionColumnsHeader() {
  return (
    <div className="condition-columns-header" aria-hidden="true">
      <strong>Check this</strong>
      <strong>Then do this</strong>
    </div>
  );
}

export function ConditionCell({ text }: { text: string }) {
  const parts = conditionItems(text);
  const separated = hasConditionSeparators(text);
  if (!separated) return <span>{text}</span>;
  return (
    <ul className="condition-items">
      {parts.map((part, index) => (
        <li key={`${index}-${part}`}>{part}</li>
      ))}
    </ul>
  );
}

export function ConditionRowContent({
  condition,
  decision,
}: {
  condition: string;
  decision: string;
}) {
  return (
    <>
      <div className="condition-cell">
        <span className="condition-mobile-label">Check this</span>
        <ConditionCell text={condition || "No additional conditions recorded."} />
      </div>
      <div className="condition-cell condition-action-cell">
        <span className="condition-mobile-label">Then do this</span>
        <strong>{decision}</strong>
      </div>
    </>
  );
}

export function ConditionSummary({
  condition,
  decision,
}: {
  condition: string;
  decision: string;
}) {
  return (
    <div className="condition-list" aria-label="Conditions and decision">
      <ConditionColumnsHeader />
      <div className="condition-row">
        <ConditionRowContent condition={condition} decision={decision} />
      </div>
    </div>
  );
}

export function ConditionSelector({
  onApply,
  surface,
  precedentId,
  matchScore = 1,
  onReject,
}: {
  surface: Surface;
  precedentId?: string;
  matchScore?: number;
  onReject?: () => void;
  onApply: (row: (typeof fragranceConditions)[number]) => void | Promise<void>;
}) {
  const [selected, setSelected] = useState("");
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const row = fragranceConditions.find((item) => item.id === selected);
  return (
    <>
      <div
        className="condition-list"
        role="radiogroup"
        aria-label="Choose the condition that matches"
      >
        <ConditionColumnsHeader />
        {fragranceConditions.map((item) => (
          <button
            type="button"
            role="radio"
            aria-checked={selected === item.id}
            className={`condition-row condition-choice ${selected === item.id ? "selected" : ""}`}
            key={item.id}
            onClick={() => {
              setSelected(item.id);
              setApplied(false);
              captureEvent("condition_row_selected", surface);
            }}
          >
            <ConditionRowContent
              condition={item.situation}
              decision={item.decision}
            />
          </button>
        ))}
      </div>
      <div className="match-actions">
        <Button
          disabled={!row || busy || applied}
          onClick={async () => {
          if (!row) return;
          setBusy(true);
          await onApply(row);
          setApplied(true);
          captureEvent("decision_applied", surface);
          setBusy(false);
          }}
        >
        {applied
          ? "Decision applied"
          : busy
            ? "Saving…"
            : "Apply selected decision"}
        </Button>
        {onReject && precedentId && (
          <Button variant="outline" onClick={() => { capturePrecedentRejected(surface,precedentId,matchScore); onReject(); }}>
            This is not my situation, ask the founder
          </Button>
        )}
      </div>
      {applied && row && (
        <p className="notice" role="status">
          Selected: {row.situation} — {row.decision}
        </p>
      )}
    </>
  );
}
