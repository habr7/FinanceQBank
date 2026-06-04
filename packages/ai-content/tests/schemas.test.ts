import { describe, expect, it } from "vitest";
import { GeneratedQuestionSchema } from "../src/schemas";

function validQuestion() {
  return {
    curriculum_version: "2026-L1",
    topic_code: "QM",
    objective_code: "QM-1",
    difficulty: "medium",
    cognitive_level: "application",
    question_type: "calculation",
    stem: "A junior analyst computes the adjusted value of a position. Which value is most accurate?",
    options: [
      {
        label: "A",
        text: "USD 1,200.00",
        rationale: "Understates by omitting the adjustment term.",
      },
      { label: "B", text: "USD 1,250.00", rationale: "Correctly applies the standard formula." },
      {
        label: "C",
        text: "USD 1,300.00",
        rationale: "Overstates by double counting the adjustment.",
      },
    ],
    correct_option: "B",
    explanation_md:
      "The adjusted value is base times one plus the adjustment, so option B is correct while A omits and C double counts the term.",
    quality_self_check: {
      single_best_answer: true,
      no_forbidden_options: true,
      no_official_content_copied: true,
      explanation_covers_all_options: true,
    },
  };
}

describe("GeneratedQuestionSchema", () => {
  it("accepts a well-formed question", () => {
    expect(GeneratedQuestionSchema.safeParse(validQuestion()).success).toBe(true);
  });

  it("rejects 2 options", () => {
    const q = validQuestion();
    q.options = q.options.slice(0, 2);
    expect(GeneratedQuestionSchema.safeParse(q).success).toBe(false);
  });

  it("rejects 4 options", () => {
    const q = validQuestion();
    q.options = [
      ...q.options,
      { label: "C", text: "extra", rationale: "another long-enough rationale here" },
    ];
    expect(GeneratedQuestionSchema.safeParse(q).success).toBe(false);
  });

  it("rejects a too-short stem and explanation", () => {
    expect(
      GeneratedQuestionSchema.safeParse({ ...validQuestion(), stem: "too short" }).success,
    ).toBe(false);
    expect(
      GeneratedQuestionSchema.safeParse({ ...validQuestion(), explanation_md: "short" }).success,
    ).toBe(false);
  });

  it("rejects an unknown topic code", () => {
    expect(
      GeneratedQuestionSchema.safeParse({ ...validQuestion(), topic_code: "NOPE" }).success,
    ).toBe(false);
  });
});
