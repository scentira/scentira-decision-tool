"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { captureEvent, type Surface } from "@/lib/analytics";

export type CheckedDiscount = {
  title: string;
  message: string;
  basis: string;
  branches: string;
  reply?: string;
  context?: string;
};
export function DiscountDecision({
  demo = false,
  surface = demo ? "demo" : "real",
  onCheck,
  onReset,
  onChecked,
}: {
  demo?: boolean;
  surface?: Surface;
  onCheck: (value: string) => Promise<CheckedDiscount | null>;
  onReset?: () => void;
  onChecked?: (result: CheckedDiscount) => void;
}) {
  const id = useId();
  const sequence = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyVersion = useRef(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  function resetCopy() {
    copyVersion.current++;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    setCopied(false);
    setCopyError("");
  }
  async function copyReply() {
    if (reply === null) return;
    resetCopy();
    const version = copyVersion.current;
    try {
      await navigator.clipboard.writeText(reply);
      if (version !== copyVersion.current) return;
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      if (version === copyVersion.current)
        setCopyError(
          "Could not copy. Select the draft text and copy it manually.",
        );
    }
  }
  const [value, setValue] = useState("");
  const [result, setResult] = useState<CheckedDiscount | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  useEffect(
    () => () => {
      sequence.current++;
      copyVersion.current++;
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );
  function reset() {
    resetCopy();
    sequence.current++;
    setBusy(false);
    setResult(null);
    setReply(null);
    setError("");
    onReset?.();
  }
  async function check(input: string) {
    reset();
    if (
      input !== "unknown" &&
      (!/^\d+$/.test(input) || !Number.isSafeInteger(Number(input)))
    ) {
      setError("Enter a whole number of previous orders, 0 or more.");
      return;
    }
    const request = ++sequence.current;
    setBusy(true);
    try {
      const answer = await onCheck(input);
      if (request === sequence.current) {
        setResult(answer);
        if (answer) {
          onChecked?.(answer);
          captureEvent("decision_applied", surface);
        } else setError("The rule could not be checked. Try again.");
      }
    } catch {
      if (request === sequence.current)
        setError(
          "Could not check the rule. No decision has been made. Try again.",
        );
    } finally {
      if (request === sequence.current) setBusy(false);
    }
  }
  return (
    <section
      className={`discount-decision ${result ? "has-decision" : ""}`}
      aria-label="Discount check"
    >
      {!result ? (
        <>
          <h4>CHECK BEFORE DECIDING</h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void check(value);
            }}
          >
            <label htmlFor={id}>
              How many previous orders has this customer placed?
            </label>
            <p className="muted">
              Check order history. Count previous orders, not the current
              purchase.
            </p>
            <div className="discount-answer">
              <Input
                id={id}
                inputMode="numeric"
                placeholder="For example, 0 or 12"
                value={value}
                onChange={(e) => {
                  reset();
                  setValue(e.target.value);
                }}
              />
              <Button type="submit" disabled={busy}>
                {busy ? "Checking…" : "Check decision"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void check("unknown")}
              >
                I don’t know yet
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          <div className="decision-eyebrow">
            {demo ? "DECISION" : "SCENTIRA’S RULE"}
          </div>
          <p className="decision-basis">{result.basis}</p>
          <h2 className="decision-title">{result.title}</h2>
          {result.reply ? (
            <Button
              className="decision-action"
              onClick={() => setReply(result.reply!)}
            >
              Prepare customer reply
            </Button>
          ) : (
            <Button className="decision-action" onClick={reset}>
              Enter verified order count
            </Button>
          )}
          {!demo && (
            <p className="decision-honesty">
              Draft only — nothing is sent or saved here.
            </p>
          )}
          {reply !== null && (
            <div className="reply-draft">
              <label htmlFor={`${id}-reply`}>
                Customer reply — editable draft
              </label>
              <Textarea
                id={`${id}-reply`}
                value={reply}
                onChange={(e) => {
                  resetCopy();
                  setReply(e.target.value);
                }}
              />
              <p>
                Review this draft before replying through your usual customer
                channel.
              </p>
              <div className="reply-actions">
                <Button onClick={() => void copyReply()} aria-live="polite">
                  {copied ? "Copied" : "Copy reply"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetCopy();
                    setReply(null);
                  }}
                >
                  Close draft
                </Button>
              </div>
              {copyError && (
                <p className="error" role="alert">
                  {copyError}
                </p>
              )}
            </div>
          )}
          <div className="decision-why">
            <h4>WHY THIS DECISION</h4>
            <p>{result.message}</p>
            <p className="decision-branches">
              <strong>What changes the answer:</strong> {result.branches}
            </p>
          </div>
          <Button variant="ghost" onClick={reset}>
            Change order count
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
