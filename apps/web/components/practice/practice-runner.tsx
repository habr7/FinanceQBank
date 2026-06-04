"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EXAM, type OptionLabel } from "@charterbank/shared";
import { Bookmark, Check, Flag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  reportIssueAction,
  saveNoteAction,
  submitAnswerAction,
  toggleBookmarkAction,
} from "@/app/practice/actions";
import type { AnsweredState, PracticeQuestion, SubmitAnswerResult } from "@/lib/data/practice";

const REPORT_TYPES: { value: string; label: string }[] = [
  { value: "wrong_answer", label: "Wrong answer" },
  { value: "ambiguous", label: "Ambiguous" },
  { value: "typo", label: "Typo" },
  { value: "explanation_unclear", label: "Explanation unclear" },
  { value: "outdated", label: "Outdated" },
  { value: "other", label: "Other" },
];

interface RunnerProps {
  sessionId: string;
  questions: PracticeQuestion[];
  answered: Record<string, AnsweredState>;
}

export function PracticeRunner({ sessionId, questions, answered }: RunnerProps) {
  const firstUnanswered = useMemo(() => {
    const idx = questions.findIndex((q) => !answered[q.id]);
    return idx === -1 ? Math.max(questions.length - 1, 0) : idx;
  }, [questions, answered]);

  const [index, setIndex] = useState(firstUnanswered);
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(Object.keys(answered)));

  const question = questions[index];
  const isLast = index >= questions.length - 1;

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, questions.length - 1));
  }, [questions.length]);

  const handleCompleted = useCallback((questionId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });
  }, []);

  if (!question) {
    return <p className="text-sm text-muted">This session has no questions.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>{completed.size} answered</span>
      </div>

      <QuestionCard
        key={question.id}
        sessionId={sessionId}
        question={question}
        previous={answered[question.id] ?? null}
        isLast={isLast}
        onCompleted={() => handleCompleted(question.id)}
        onNext={goNext}
      />
    </div>
  );
}

interface CardProps {
  sessionId: string;
  question: PracticeQuestion;
  previous: AnsweredState | null;
  isLast: boolean;
  onCompleted: () => void;
  onNext: () => void;
}

function QuestionCard({ sessionId, question, previous, isLast, onCompleted, onNext }: CardProps) {
  const [selected, setSelected] = useState<OptionLabel | null>(previous?.chosenOption ?? null);
  const [result, setResult] = useState<SubmitAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [panel, setPanel] = useState<"none" | "note" | "report">("none");
  const startedAt = useRef<number>(Date.now());

  const answered = result !== null || previous !== null;

  const submit = useCallback(async () => {
    if (!selected || answered || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const responseTimeSeconds = Math.round((Date.now() - startedAt.current) / 1000);
      const res = await submitAnswerAction({
        sessionId,
        questionId: question.id,
        chosenOption: selected,
        responseTimeSeconds,
      });
      if (!res) {
        setError("Could not submit your answer. Please try again.");
        return;
      }
      setResult(res);
      onCompleted();
    } finally {
      setSubmitting(false);
    }
  }, [selected, answered, submitting, sessionId, question.id, onCompleted]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) {
        return;
      }
      const key = event.key.toUpperCase();
      if ((["A", "B", "C"] as const).includes(key as OptionLabel) && !answered) {
        setSelected(key as OptionLabel);
      } else if (event.key === "Enter") {
        if (answered) onNext();
        else void submit();
      } else if (key === "N" && answered) {
        onNext();
      } else if (key === "M") {
        void onToggleBookmark();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, submit, onNext]);

  async function onToggleBookmark() {
    setBookmarked(await toggleBookmarkAction(question.id));
  }

  const correctOption = result?.correctOption ?? null;

  return (
    <article className="flex flex-col gap-5 rounded-lg border border-border p-6">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="rounded-full border border-border px-2 py-0.5">{question.topicCode}</span>
        <span className="rounded-full border border-border px-2 py-0.5 capitalize">
          {question.difficulty}
        </span>
      </div>

      {question.vignette ? (
        <p className="whitespace-pre-wrap text-sm text-muted">{question.vignette}</p>
      ) : null}
      <h2 className="text-lg font-medium">{question.stem}</h2>

      <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Answer options">
        {question.options.map((option) => {
          const isSelected = selected === option.label;
          const isCorrect = answered && correctOption === option.label;
          const isWrongChoice = answered && isSelected && correctOption !== option.label;
          return (
            <li key={option.label}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={answered}
                onClick={() => setSelected(option.label)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border border-border p-3 text-left text-sm transition-colors",
                  !answered && "hover:bg-neutral-100 dark:hover:bg-neutral-900",
                  isSelected && !answered && "border-neutral-900 dark:border-neutral-100",
                  isCorrect && "border-green-600 bg-green-50 dark:bg-green-950",
                  isWrongChoice && "border-red-600 bg-red-50 dark:bg-red-950",
                )}
              >
                <span className="font-semibold">{option.label}</span>
                <span className="flex-1">{option.text}</span>
                {isCorrect ? (
                  <Check className="h-4 w-4 shrink-0" aria-label="Correct answer" />
                ) : null}
                {isWrongChoice ? <X className="h-4 w-4 shrink-0" aria-label="Your answer" /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {!answered ? (
        <div className="flex items-center gap-3">
          <Button onClick={() => void submit()} disabled={!selected || submitting}>
            {submitting ? "Checking…" : "Submit answer"}
          </Button>
          <span className="text-xs text-muted">
            Keys: A/B/C to choose, Enter to submit ({EXAM.secondsPerQuestion}s target)
          </span>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {result ? (
        <div className="flex flex-col gap-3 rounded-md bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          <p className="font-medium">
            {result.isCorrect ? "Correct." : "Not quite."} The best answer is {result.correctOption}
            .
          </p>
          <div className="whitespace-pre-wrap">{result.explanationMd}</div>
          <ul className="flex flex-col gap-1 text-muted">
            {result.rationales.map((r) =>
              r.rationaleMd ? (
                <li key={r.label}>
                  <span className="font-semibold">{r.label}.</span> {r.rationaleMd}
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ) : previous ? (
        <p className="text-sm text-muted">
          You already answered this question ({previous.isCorrect ? "correct" : "incorrect"}).
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => void onToggleBookmark()}>
          <Bookmark className={cn("h-4 w-4", bookmarked && "fill-current")} />
          {bookmarked ? "Bookmarked" : "Bookmark"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPanel((p) => (p === "note" ? "none" : "note"))}
        >
          Add note
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPanel((p) => (p === "report" ? "none" : "report"))}
        >
          <Flag className="h-4 w-4" />
          Report issue
        </Button>
        {answered ? (
          <Button className="ml-auto" size="sm" onClick={onNext} disabled={isLast}>
            {isLast ? "Last question" : "Next (N)"}
          </Button>
        ) : null}
      </div>

      {panel === "note" ? <NotePanel questionId={question.id} /> : null}
      {panel === "report" ? <ReportPanel questionId={question.id} /> : null}
    </article>
  );
}

function NotePanel({ questionId }: { questionId: string }) {
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await saveNoteAction(questionId, note);
        setStatus(ok ? "Note saved." : "Could not save note.");
      }}
    >
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Your private note about this question…"
        className="min-h-20 rounded-md border border-border bg-transparent p-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!note.trim()}>
          Save note
        </Button>
        {status ? <span className="text-xs text-muted">{status}</span> : null}
      </div>
    </form>
  );
}

function ReportPanel({ questionId }: { questionId: string }) {
  const [type, setType] = useState(REPORT_TYPES[0]!.value);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await reportIssueAction(questionId, type, message);
        setStatus(ok ? "Thanks — report submitted." : "Could not submit report.");
        if (ok) setMessage("");
      }}
    >
      <select
        value={type}
        onChange={(event) => setType(event.target.value)}
        className="h-9 rounded-md border border-border bg-transparent px-2 text-sm"
        aria-label="Issue type"
      >
        {REPORT_TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Optional: describe the issue…"
        className="min-h-16 rounded-md border border-border bg-transparent p-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" variant="outline">
          Submit report
        </Button>
        {status ? <span className="text-xs text-muted">{status}</span> : null}
      </div>
    </form>
  );
}
