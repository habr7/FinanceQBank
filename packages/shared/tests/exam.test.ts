import { describe, expect, it } from "vitest";
import { EXAM, MOCK_PRESETS, PRACTICE_DIFFICULTY_MIX } from "../src/exam";

describe("exam structure", () => {
  it("reflects the Level I format", () => {
    expect(EXAM.optionsPerQuestion).toBe(3);
    expect(EXAM.optionLabels).toEqual(["A", "B", "C"]);
    expect(EXAM.totalQuestions).toBe(180);
    expect(EXAM.questionsPerSession * EXAM.sessions).toBe(EXAM.totalQuestions);
    expect(EXAM.wrongAnswerPenalty).toBe(false);
  });

  it("difficulty mix sums to 1", () => {
    const sum =
      PRACTICE_DIFFICULTY_MIX.easy + PRACTICE_DIFFICULTY_MIX.medium + PRACTICE_DIFFICULTY_MIX.hard;
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe("mock presets", () => {
  it("half mock is 90 questions / 135 minutes", () => {
    expect(MOCK_PRESETS.half.questions).toBe(90);
    expect(MOCK_PRESETS.half.timeLimitSeconds).toBe(135 * 60);
  });

  it("full mock is 180 questions / 270 minutes across 2 sessions", () => {
    expect(MOCK_PRESETS.full.questions).toBe(180);
    expect(MOCK_PRESETS.full.timeLimitSeconds).toBe(270 * 60);
    expect(MOCK_PRESETS.full.sessions).toBe(2);
  });

  it("mini mock is 30 questions", () => {
    expect(MOCK_PRESETS.mini.questions).toBe(30);
  });
});
