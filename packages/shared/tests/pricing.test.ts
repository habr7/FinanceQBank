import { describe, expect, it } from "vitest";
import {
  FREE_QUESTION_LIMIT,
  PLANS,
  isPaidStatus,
  isWithinFreeLimit,
  remainingFreeQuestions,
} from "../src/pricing";
import { findForbiddenMatch, FORBIDDEN_OPTION_PATTERNS } from "../src/constants";

describe("free-tier gating", () => {
  it("limits free users at 20 questions", () => {
    expect(FREE_QUESTION_LIMIT).toBe(20);
    expect(isWithinFreeLimit(0)).toBe(true);
    expect(isWithinFreeLimit(19)).toBe(true);
    expect(isWithinFreeLimit(20)).toBe(false);
    expect(isWithinFreeLimit(21)).toBe(false);
  });

  it("reports remaining free questions without going negative", () => {
    expect(remainingFreeQuestions(0)).toBe(20);
    expect(remainingFreeQuestions(20)).toBe(0);
    expect(remainingFreeQuestions(25)).toBe(0);
  });

  it("free plan is limited; paid plans are unlimited", () => {
    expect(PLANS.free.questionLimit).toBe(FREE_QUESTION_LIMIT);
    expect(PLANS.monthly.questionLimit).toBeNull();
    expect(PLANS.annual.questionLimit).toBeNull();
  });

  it("recognizes paid subscription statuses", () => {
    expect(isPaidStatus("active")).toBe(true);
    expect(isPaidStatus("trial")).toBe(true);
    expect(isPaidStatus("free")).toBe(false);
    expect(isPaidStatus("canceled")).toBe(false);
  });
});

describe("forbidden option text", () => {
  it("flags banned option phrasing", () => {
    expect(findForbiddenMatch("All of the above", FORBIDDEN_OPTION_PATTERNS)).not.toBeNull();
    expect(findForbiddenMatch("B and C only", FORBIDDEN_OPTION_PATTERNS)).not.toBeNull();
    expect(findForbiddenMatch("USD 1,250.00", FORBIDDEN_OPTION_PATTERNS)).toBeNull();
  });
});
