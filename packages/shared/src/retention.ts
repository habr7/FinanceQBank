/** Retention helpers: SM-2 spaced repetition, streaks, and next-session suggestions. */

export interface SrCardState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
}

export interface SrSchedule extends SrCardState {
  /** Days until the card is next due (0 = due immediately). */
  dueInDays: number;
}

export const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

/**
 * Simplified SM-2. A correct answer advances the interval (1 → 6 → interval×ease);
 * an incorrect answer resets the card so it re-enters review immediately, which is
 * how wrong answers "enter the review queue".
 */
export function nextReview(card: SrCardState, correct: boolean): SrSchedule {
  if (!correct) {
    return {
      easeFactor: Math.max(MIN_EASE_FACTOR, Number((card.easeFactor - 0.2).toFixed(2))),
      intervalDays: 1,
      repetitions: 0,
      dueInDays: 0,
    };
  }

  const repetitions = card.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.max(1, Math.round(card.intervalDays * card.easeFactor));

  const easeFactor = Math.max(MIN_EASE_FACTOR, Number((card.easeFactor + 0.1).toFixed(2)));
  return { easeFactor, intervalDays, repetitions, dueInDays: intervalDays };
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

/**
 * Consecutive-day streak ending today (or yesterday if there's no activity today
 * yet, so a streak isn't lost until a full day is missed). `activityDays` are
 * UTC YYYY-MM-DD strings.
 */
export function computeStreak(activityDays: readonly string[], today: Date): number {
  const set = new Set(activityDays);
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  let cursor = start;
  if (!set.has(isoDay(cursor))) {
    cursor = addUtcDays(cursor, -1);
    if (!set.has(isoDay(cursor))) return 0;
  }

  let streak = 0;
  while (set.has(isoDay(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export interface NextSuggestion {
  kind: "review" | "weak_topic" | "practice" | "start";
  label: string;
  href: string;
}

/** Recommend the highest-value next study action. */
export function suggestNextSession(input: {
  dueCount: number;
  weakTopics: readonly string[];
  totalAnswered: number;
}): NextSuggestion {
  if (input.dueCount > 0) {
    return {
      kind: "review",
      label: `Review ${input.dueCount} due question${input.dueCount === 1 ? "" : "s"}`,
      href: "/review",
    };
  }
  if (input.totalAnswered === 0) {
    return { kind: "start", label: "Start your first practice session", href: "/practice" };
  }
  if (input.weakTopics.length > 0) {
    return {
      kind: "weak_topic",
      label: `Strengthen your weakest topic: ${input.weakTopics[0]}`,
      href: "/practice",
    };
  }
  return { kind: "practice", label: "Practice a fresh set of questions", href: "/practice" };
}
