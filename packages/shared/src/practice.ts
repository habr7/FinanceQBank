import { MOCK_PRESETS, PRACTICE_DIFFICULTY_MIX, type Difficulty, type MockType } from "./exam";
import { allocateQuestions, type TopicCode } from "./topics";

const DIFFICULTY_ORDER: readonly Difficulty[] = ["easy", "medium", "hard"];

export interface MockPlan {
  type: MockType;
  questions: number;
  timeLimitSeconds: number;
  sessions: number;
  /** Per-topic question counts, weighted by exam allocation (sums to `questions`). */
  allocation: Record<TopicCode, number>;
}

/** Resolve a mock type into its size, time limit, session count, and topic allocation. */
export function mockQuestionPlan(type: MockType): MockPlan {
  const preset = MOCK_PRESETS[type];
  return {
    type,
    questions: preset.questions,
    timeLimitSeconds: preset.timeLimitSeconds,
    sessions: preset.sessions,
    allocation: allocateQuestions(preset.questions),
  };
}

/** Map a mock type to the practice_sessions.mode value. */
export function mockSessionMode(type: MockType): "mock_mini" | "mock_half" | "mock_full" {
  return type === "mini" ? "mock_mini" : type === "half" ? "mock_half" : "mock_full";
}

/**
 * Split `total` practice questions across difficulties using the default mix
 * (30% easy / 50% medium / 20% hard), largest-remainder rounded so the parts
 * always sum to exactly `total`.
 */
export function allocateDifficulty(total: number): Record<Difficulty, number> {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error(`allocateDifficulty expects a non-negative integer, received ${total}`);
  }

  const parts = DIFFICULTY_ORDER.map((difficulty) => {
    const exact = PRACTICE_DIFFICULTY_MIX[difficulty] * total;
    const base = Math.floor(exact);
    return { difficulty, base, frac: exact - base };
  });

  const result: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const part of parts) result[part.difficulty] = part.base;

  let remaining = total - parts.reduce((sum, part) => sum + part.base, 0);
  const ranked = [...parts].sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < ranked.length && remaining > 0; i += 1) {
    result[ranked[i]!.difficulty] += 1;
    remaining -= 1;
  }

  return result;
}

export interface PracticeCandidate {
  id: string;
  difficulty: Difficulty;
}

/**
 * Choose up to `count` question ids from `candidates`, honouring the difficulty
 * mix where supply allows and filling any shortfall from the remaining pool.
 * Pure and deterministic — the caller is responsible for shuffling candidates
 * beforehand if randomised ordering is desired.
 */
export function selectPracticeQuestions(
  candidates: readonly PracticeCandidate[],
  count: number,
): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`selectPracticeQuestions expects a non-negative integer, received ${count}`);
  }
  const target = allocateDifficulty(Math.min(count, candidates.length));

  const buckets: Record<Difficulty, PracticeCandidate[]> = { easy: [], medium: [], hard: [] };
  for (const candidate of candidates) buckets[candidate.difficulty].push(candidate);

  const chosen: string[] = [];
  const used = new Set<string>();

  for (const difficulty of DIFFICULTY_ORDER) {
    for (const candidate of buckets[difficulty].slice(0, target[difficulty])) {
      chosen.push(candidate.id);
      used.add(candidate.id);
    }
  }

  // Fill any shortfall (a difficulty ran dry) from whatever remains, in order.
  if (chosen.length < count) {
    for (const candidate of candidates) {
      if (chosen.length >= count) break;
      if (!used.has(candidate.id)) {
        chosen.push(candidate.id);
        used.add(candidate.id);
      }
    }
  }

  return chosen;
}

export interface TopicAccuracy {
  topicCode: string;
  answered: number;
  correct: number;
  /** 0–100, or null when nothing has been answered for the topic. */
  accuracy: number | null;
}

export interface DashboardStats {
  totalAnswered: number;
  totalCorrect: number;
  overallAccuracy: number | null;
  averageResponseSeconds: number | null;
  byTopic: TopicAccuracy[];
  weakTopics: string[];
}

export interface AttemptLike {
  topicCode: string;
  isCorrect: boolean;
  responseTimeSeconds?: number | null;
}

/** A topic at or below this accuracy (with enough data) is flagged "weak". */
export const WEAK_TOPIC_THRESHOLD = 70;
const MIN_ATTEMPTS_FOR_WEAK = 3;

/**
 * Aggregate attempts into overall + per-topic accuracy. `topicOrder` keeps the
 * output stable and ensures every known topic appears, even with zero attempts.
 */
export function computeDashboardStats(
  attempts: readonly AttemptLike[],
  topicOrder: readonly string[],
): DashboardStats {
  const tally = new Map<string, { answered: number; correct: number }>();
  for (const code of topicOrder) tally.set(code, { answered: 0, correct: 0 });

  let totalAnswered = 0;
  let totalCorrect = 0;
  let timeSum = 0;
  let timeCount = 0;

  for (const attempt of attempts) {
    const row = tally.get(attempt.topicCode) ?? { answered: 0, correct: 0 };
    row.answered += 1;
    if (attempt.isCorrect) row.correct += 1;
    tally.set(attempt.topicCode, row);

    totalAnswered += 1;
    if (attempt.isCorrect) totalCorrect += 1;
    if (typeof attempt.responseTimeSeconds === "number") {
      timeSum += attempt.responseTimeSeconds;
      timeCount += 1;
    }
  }

  const codes = topicOrder.length > 0 ? topicOrder : [...tally.keys()];
  const byTopic: TopicAccuracy[] = codes.map((topicCode) => {
    const row = tally.get(topicCode) ?? { answered: 0, correct: 0 };
    return {
      topicCode,
      answered: row.answered,
      correct: row.correct,
      accuracy: row.answered === 0 ? null : (row.correct / row.answered) * 100,
    };
  });

  const weakTopics = byTopic
    .filter(
      (t) => t.answered >= MIN_ATTEMPTS_FOR_WEAK && (t.accuracy ?? 100) <= WEAK_TOPIC_THRESHOLD,
    )
    .map((t) => t.topicCode);

  return {
    totalAnswered,
    totalCorrect,
    overallAccuracy: totalAnswered === 0 ? null : (totalCorrect / totalAnswered) * 100,
    averageResponseSeconds: timeCount === 0 ? null : timeSum / timeCount,
    byTopic,
    weakTopics,
  };
}
