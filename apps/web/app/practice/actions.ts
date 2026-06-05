"use server";

import { redirect } from "next/navigation";
import { isTopicCode, type OptionLabel } from "@charterbank/shared";
import type { ReportType } from "@charterbank/db";

import {
  startPracticeSession,
  startReviewSession,
  submitAnswer,
  type SubmitAnswerResult,
} from "@/lib/data/practice";
import { reportIssue, saveNote, toggleBookmark } from "@/lib/data/engagement";

const VALID_REPORT_TYPES: ReportType[] = [
  "wrong_answer",
  "ambiguous",
  "typo",
  "outdated",
  "explanation_unclear",
  "other",
];

/** Form action: start a practice session and redirect into the runner. */
export async function startPracticeAction(formData: FormData): Promise<void> {
  const rawCount = Number(formData.get("count"));
  const count = Number.isFinite(rawCount) ? Math.min(Math.max(Math.trunc(rawCount), 1), 50) : 10;
  const topics = formData
    .getAll("topics")
    .map(String)
    .filter((value) => isTopicCode(value));

  const result = await startPracticeSession({ topics, count });
  if (result.ok) redirect(`/practice/${result.sessionId}`);
  if (result.reason === "unavailable") redirect("/login");
  redirect(`/practice?error=${result.reason}`);
}

/** Form action: start a spaced-repetition review session and redirect into it. */
export async function startReviewAction(): Promise<void> {
  const result = await startReviewSession();
  if (result.ok) redirect(`/practice/${result.sessionId}`);
  if (result.reason === "unavailable") redirect("/login");
  redirect("/practice?error=no-reviews");
}

export async function submitAnswerAction(input: {
  sessionId: string;
  questionId: string;
  chosenOption: OptionLabel;
  responseTimeSeconds?: number;
}): Promise<SubmitAnswerResult | null> {
  return submitAnswer(input);
}

export async function toggleBookmarkAction(questionId: string): Promise<boolean> {
  return toggleBookmark(questionId);
}

export async function saveNoteAction(questionId: string, noteMd: string): Promise<boolean> {
  return saveNote(questionId, noteMd);
}

export async function reportIssueAction(
  questionId: string,
  reportType: string,
  message: string,
): Promise<boolean> {
  const type = (VALID_REPORT_TYPES as string[]).includes(reportType)
    ? (reportType as ReportType)
    : "other";
  return reportIssue(questionId, type, message);
}
