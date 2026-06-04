import { describe, expect, it } from "vitest";
import {
  WEAK_TOPIC_THRESHOLD,
  allocateDifficulty,
  computeDashboardStats,
  selectPracticeQuestions,
  type AttemptLike,
  type PracticeCandidate,
} from "../src/practice";

describe("selectPracticeQuestions", () => {
  const make = (n: number, difficulty: PracticeCandidate["difficulty"]): PracticeCandidate[] =>
    Array.from({ length: n }, (_, i) => ({ id: `${difficulty}-${i}`, difficulty }));

  const pool = [...make(5, "easy"), ...make(5, "medium"), ...make(5, "hard")];

  it("returns exactly the requested count when supply is sufficient", () => {
    const picked = selectPracticeQuestions(pool, 10);
    expect(picked).toHaveLength(10);
    expect(new Set(picked).size).toBe(10);
  });

  it("honours the difficulty mix when possible", () => {
    const picked = new Set(selectPracticeQuestions(pool, 10));
    const count = (prefix: string) => [...picked].filter((id) => id.startsWith(prefix)).length;
    expect(count("easy")).toBe(3);
    expect(count("medium")).toBe(5);
    expect(count("hard")).toBe(2);
  });

  it("fills the shortfall from other difficulties when one runs dry", () => {
    const scarce = [...make(1, "easy"), ...make(10, "medium")];
    const picked = selectPracticeQuestions(scarce, 6);
    expect(picked).toHaveLength(6);
    expect(new Set(picked).size).toBe(6);
  });

  it("never returns more than the available pool", () => {
    const picked = selectPracticeQuestions(make(3, "easy"), 20);
    expect(picked).toHaveLength(3);
  });
});

describe("allocateDifficulty", () => {
  it.each([0, 1, 5, 10, 17, 20, 99])("sums to the requested total (%i)", (total) => {
    const mix = allocateDifficulty(total);
    expect(mix.easy + mix.medium + mix.hard).toBe(total);
    expect(mix.easy).toBeGreaterThanOrEqual(0);
    expect(mix.medium).toBeGreaterThanOrEqual(0);
    expect(mix.hard).toBeGreaterThanOrEqual(0);
  });

  it("applies the 30/50/20 mix on a round number", () => {
    expect(allocateDifficulty(10)).toEqual({ easy: 3, medium: 5, hard: 2 });
  });

  it("rejects invalid totals", () => {
    expect(() => allocateDifficulty(-1)).toThrow();
    expect(() => allocateDifficulty(2.5)).toThrow();
  });
});

describe("computeDashboardStats", () => {
  const topics = ["ETH", "QM", "FI"];

  it("returns empty stats with all topics present when there are no attempts", () => {
    const stats = computeDashboardStats([], topics);
    expect(stats.totalAnswered).toBe(0);
    expect(stats.overallAccuracy).toBeNull();
    expect(stats.averageResponseSeconds).toBeNull();
    expect(stats.byTopic.map((t) => t.topicCode)).toEqual(topics);
    expect(stats.byTopic.every((t) => t.accuracy === null)).toBe(true);
    expect(stats.weakTopics).toEqual([]);
  });

  it("computes overall and per-topic accuracy and average time", () => {
    const attempts: AttemptLike[] = [
      { topicCode: "ETH", isCorrect: true, responseTimeSeconds: 30 },
      { topicCode: "ETH", isCorrect: false, responseTimeSeconds: 50 },
      { topicCode: "QM", isCorrect: true, responseTimeSeconds: 40 },
    ];
    const stats = computeDashboardStats(attempts, topics);

    expect(stats.totalAnswered).toBe(3);
    expect(stats.totalCorrect).toBe(2);
    expect(stats.overallAccuracy).toBeCloseTo((2 / 3) * 100, 6);
    expect(stats.averageResponseSeconds).toBeCloseTo(40, 6);

    const eth = stats.byTopic.find((t) => t.topicCode === "ETH")!;
    expect(eth).toMatchObject({ answered: 2, correct: 1, accuracy: 50 });
    const fi = stats.byTopic.find((t) => t.topicCode === "FI")!;
    expect(fi.accuracy).toBeNull();
  });

  it("flags weak topics at or below the threshold once there is enough data", () => {
    const attempts: AttemptLike[] = [
      // 1/3 correct on FI -> weak; only 1 attempt on QM -> not enough data.
      { topicCode: "FI", isCorrect: true },
      { topicCode: "FI", isCorrect: false },
      { topicCode: "FI", isCorrect: false },
      { topicCode: "QM", isCorrect: false },
    ];
    const stats = computeDashboardStats(attempts, topics);
    expect(stats.weakTopics).toEqual(["FI"]);
    expect(WEAK_TOPIC_THRESHOLD).toBe(70);
  });
});
