"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fragranceConditions } from "@/lib/fragrance-conditions";
import { captureEvent, capturePrecedentRejected, type Surface } from "@/lib/analytics";

export function ConditionSummary({
  condition,
  decision,
}: {
  condition: string;
  decision: string;
}) {
  return (
    <div className="condition-list" aria-label="Conditions and decision">
      <div className="condition-row">
        <span>{condition || "No additional conditions recorded."}</span>
        <strong>{decision}</strong>
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
            <span>{item.situation}</span>
            <strong>{item.decision}</strong>
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
