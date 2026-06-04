import { describe, expect, it } from "vitest";
import {
  TOPICS,
  TOPIC_CODES,
  TOTAL_TARGET_QUESTIONS,
  allocateQuestions,
  getTopic,
  isTopicCode,
} from "../src/topics";

describe("topics catalogue", () => {
  it("has the 10 Level I topics in display order", () => {
    expect(TOPICS).toHaveLength(10);
    const orders = TOPICS.map((t) => t.displayOrder);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("target allocation sums to 1,000", () => {
    const sum = TOPICS.reduce((acc, t) => acc + t.targetPer1000, 0);
    expect(sum).toBe(TOTAL_TARGET_QUESTIONS);
  });

  it("planning midpoint is within the official weight range", () => {
    for (const t of TOPICS) {
      expect(t.weight).toBeGreaterThanOrEqual(t.examWeightMin);
      expect(t.weight).toBeLessThanOrEqual(t.examWeightMax);
    }
  });

  it("resolves topics by code and guards unknown codes", () => {
    expect(getTopic("FSA").name).toBe("Financial Statement Analysis");
    expect(isTopicCode("FI")).toBe(true);
    expect(isTopicCode("NOPE")).toBe(false);
  });
});

describe("allocateQuestions", () => {
  it.each([0, 1, 5, 30, 90, 180, 250, 1000, 1234])(
    "always sums to the requested total (%i)",
    (total) => {
      const alloc = allocateQuestions(total);
      const sum = TOPIC_CODES.reduce((acc, code) => acc + alloc[code], 0);
      expect(sum).toBe(total);
      for (const code of TOPIC_CODES) {
        expect(alloc[code]).toBeGreaterThanOrEqual(0);
      }
    },
  );

  it("reproduces the canonical 180-question mock distribution", () => {
    expect(allocateQuestions(180)).toEqual({
      ETH: 31,
      QM: 13,
      ECON: 13,
      FSA: 22,
      CI: 13,
      EQ: 22,
      FI: 22,
      DER: 11,
      AI: 15,
      PM: 18,
    });
  });

  it("matches the per-1,000 target exactly", () => {
    const alloc = allocateQuestions(1000);
    for (const t of TOPICS) {
      expect(alloc[t.code]).toBe(t.targetPer1000);
    }
  });

  it("rejects invalid totals", () => {
    expect(() => allocateQuestions(-1)).toThrow();
    expect(() => allocateQuestions(1.5)).toThrow();
  });
});
