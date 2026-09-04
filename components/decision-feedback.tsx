"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  captureFeedback,
  type FeedbackValue,
  type Surface,
} from "@/lib/analytics";

const choices = [
  ["yes", "Worked"],
  ["no", "Didn't work"],
  ["not_sure", "Not sure"],
] as const;

export function DecisionFeedback({
  onChoose,
  surface = "demo",
}: {
  surface?: Surface;
  onChoose?: (value: FeedbackValue) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<FeedbackValue | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function choose(value: FeedbackValue) {
    if (selected || busy) return;
    setBusy(true);
    setError("");
    try {
      await onChoose?.(value);
      setSelected(value);
      captureFeedback(value, surface);
    } catch (e) {
      setError((e as Error).message || "Could not save feedback. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="decision-feedback" aria-label="Decision feedback">
      <strong>Did this decision work?</strong>
      <div className="feedback-options">
        {choices.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={selected === value ? "secondary" : "outline"}
            aria-pressed={selected === value}
            disabled={busy || selected !== null}
            onClick={() => void choose(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      {selected && (
        <p className="muted" role="status">
          Feedback recorded:{" "}
          {choices.find(([value]) => value === selected)?.[1]}
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
