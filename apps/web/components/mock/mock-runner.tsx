"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EXAM, type OptionLabel } from "@charterbank/shared";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitMockAction } from "@/app/mock/actions";
import type { MockQuestion } from "@/lib/data/mock";

interface MockRunnerProps {
  sessionId: string;
  mode: string;
  timeLimitSeconds: number;
  startedAt: string;
  questions: MockQuestion[];
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function MockRunner({
  sessionId,
  mode,
  timeLimitSeconds,
  startedAt,
  questions,
}: MockRunnerProps) {
  const router = useRouter();
  const deadline = useMemo(
    () => new Date(startedAt).getTime() + timeLimitSeconds * 1000,
    [startedAt, timeLimitSeconds],
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionLabel>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [remaining, setRemaining] = useState(() => Math.round((deadline - Date.now()) / 1000));
  const [submitting, setSubmitting] = useState(false);

  const question = questions[index];
  const sessionSize = EXAM.questionsPerSession;
  const showSection = mode === "mock_full";

  const finish = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = Object.entries(answers).map(([questionId, chosenOption]) => ({
      questionId,
      chosenOption,
    }));
    await submitMockAction(sessionId, payload);
    router.refresh();
  }, [answers, sessionId, submitting, router]);

  // Countdown; auto-submit at zero.
  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.round((deadline - Date.now()) / 1000);
      setRemaining(next);
      if (next <= 0) void finish();
    }, 1000);
    return () => clearInterval(id);
  }, [deadline, finish]);

  const toggleFlag = useCallback((id: string) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!question) return;
      const key = event.key.toUpperCase();
      if ((["A", "B", "C"] as const).includes(key as OptionLabel)) {
        setAnswers((prev) => ({ ...prev, [question.id]: key as OptionLabel }));
      } else if (key === "F") {
        toggleFlag(question.id);
      } else if (key === "ARROWRIGHT" || key === "N") {
        setIndex((i) => Math.min(i + 1, questions.length - 1));
      } else if (key === "ARROWLEFT" || key === "P") {
        setIndex((i) => Math.max(i - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, questions.length, toggleFlag]);

  if (!question) return <p className="text-sm text-muted">This mock has no questions.</p>;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">
          Question {index + 1} of {questions.length}
          {showSection ? ` · Section ${index < sessionSize ? 1 : 2} of 2` : ""}
        </span>
        <span
          className={cn(
            "rounded-md border border-border px-3 py-1 font-mono tabular-nums",
            remaining <= 60 && "border-red-600 text-red-600 dark:text-red-400",
          )}
          aria-label="Time remaining"
        >
          {formatTime(remaining)}
        </span>
      </div>

      {showSection && index === sessionSize ? (
        <p className="rounded-md border border-border p-3 text-sm text-muted">
          You have reached Section 2. In the real exam there is an optional break here.
        </p>
      ) : null}

      <article className="flex flex-col gap-4 rounded-lg border border-border p-6">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="rounded-full border border-border px-2 py-0.5">
            {question.topicCode}
          </span>
          <button
            type="button"
            onClick={() => toggleFlag(question.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5",
              flags.has(question.id) && "border-amber-500 text-amber-600 dark:text-amber-400",
            )}
            aria-pressed={flags.has(question.id)}
          >
            <Flag className="h-3 w-3" />
            {flags.has(question.id) ? "Flagged" : "Flag (F)"}
          </button>
        </div>

        {question.vignette ? (
          <p className="whitespace-pre-wrap text-sm text-muted">{question.vignette}</p>
        ) : null}
        <h2 className="text-lg font-medium">{question.stem}</h2>

        <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Answer options">
          {question.options.map((option) => {
            const selected = answers[question.id] === option.label;
            return (
              <li key={option.label}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option.label }))}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border border-border p-3 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900",
                    selected && "border-neutral-900 dark:border-neutral-100",
                  )}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span>{option.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </article>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
        >
          Previous
        </Button>
        <span className="text-xs text-muted">{answeredCount} answered</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIndex((i) => Math.min(i + 1, questions.length - 1))}
          disabled={index === questions.length - 1}
        >
          Next
        </Button>
      </div>

      <nav aria-label="Question navigator" className="flex flex-wrap gap-1">
        {questions.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to question ${i + 1}`}
            className={cn(
              "h-7 w-7 rounded border border-border text-xs",
              answers[q.id] && "bg-neutral-200 dark:bg-neutral-800",
              flags.has(q.id) && "border-amber-500",
              i === index && "ring-2 ring-neutral-400",
            )}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-end border-t border-border pt-4">
        <Button onClick={() => void finish()} disabled={submitting}>
          {submitting ? "Submitting…" : "Finish mock"}
        </Button>
      </div>
    </div>
  );
}
