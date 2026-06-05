import { describe, expect, it } from "vitest";
import {
  DEFAULT_EASE_FACTOR,
  computeStreak,
  nextReview,
  suggestNextSession,
} from "../src/retention";
import { dueReviewEmail, welcomeEmail } from "../src/email";

describe("nextReview (SM-2)", () => {
  it("resets and re-queues immediately on an incorrect answer", () => {
    const result = nextReview({ easeFactor: 2.5, intervalDays: 10, repetitions: 4 }, false);
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.dueInDays).toBe(0);
    expect(result.easeFactor).toBeCloseTo(2.3, 5);
  });

  it("advances intervals on correct answers (1 -> 6 -> ×ease)", () => {
    const first = nextReview(
      { easeFactor: DEFAULT_EASE_FACTOR, intervalDays: 0, repetitions: 0 },
      true,
    );
    expect(first).toMatchObject({ repetitions: 1, intervalDays: 1 });
    const second = nextReview(first, true);
    expect(second).toMatchObject({ repetitions: 2, intervalDays: 6 });
    const third = nextReview(second, true);
    expect(third.repetitions).toBe(3);
    expect(third.intervalDays).toBeGreaterThan(6);
  });

  it("never drops the ease factor below 1.3", () => {
    let card = { easeFactor: 1.3, intervalDays: 1, repetitions: 0 };
    for (let i = 0; i < 5; i += 1) card = nextReview(card, false);
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

describe("computeStreak", () => {
  const today = new Date("2026-06-05T12:00:00Z");

  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-06-05", "2026-06-04", "2026-06-03"], today)).toBe(3);
  });

  it("still counts when today has no activity yet but yesterday did", () => {
    expect(computeStreak(["2026-06-04", "2026-06-03"], today)).toBe(2);
  });

  it("is zero when the most recent activity is older than yesterday", () => {
    expect(computeStreak(["2026-06-01"], today)).toBe(0);
    expect(computeStreak([], today)).toBe(0);
  });

  it("stops at the first gap", () => {
    expect(computeStreak(["2026-06-05", "2026-06-03", "2026-06-02"], today)).toBe(1);
  });
});

describe("suggestNextSession", () => {
  it("prioritizes due reviews", () => {
    const s = suggestNextSession({ dueCount: 3, weakTopics: ["FI"], totalAnswered: 50 });
    expect(s.kind).toBe("review");
    expect(s.href).toBe("/review");
  });

  it("suggests a first session for new users", () => {
    expect(suggestNextSession({ dueCount: 0, weakTopics: [], totalAnswered: 0 }).kind).toBe(
      "start",
    );
  });

  it("recommends the weakest topic when there's nothing due", () => {
    const s = suggestNextSession({ dueCount: 0, weakTopics: ["FI"], totalAnswered: 30 });
    expect(s.kind).toBe("weak_topic");
    expect(s.label).toContain("FI");
  });
});

describe("email templates", () => {
  it("builds a welcome email with the app name and disclaimer", () => {
    const email = welcomeEmail("Sam");
    expect(email.subject).toContain("CharterBank");
    expect(email.text).toContain("Sam");
    expect(email.text).toContain("CFA Institute");
  });

  it("pluralizes the due-review email", () => {
    expect(dueReviewEmail("Sam", 1).subject).toContain("1 question ");
    expect(dueReviewEmail(null, 3).subject).toContain("3 questions");
  });
});
