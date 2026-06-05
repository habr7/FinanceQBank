import { describe, expect, it } from "vitest";
import {
  runDeterministicValidators,
  validateForbiddenOptionText,
  validateNoOfficialClaims,
  validateNumericalOrdering,
  validateMarkdownMath,
  validateSingleCorrectAnswer,
  validateStemPhrasing,
  validateThreeOptions,
  validateTopicWeightDistribution,
  type ValidatableQuestion,
} from "../src/validators";

function q(overrides: Partial<ValidatableQuestion> = {}): ValidatableQuestion {
  return {
    topic_code: "QM",
    difficulty: "medium",
    stem: "Which value is most accurate given the inputs?",
    options: [
      {
        label: "A",
        text: "USD 1,200.00",
        rationale: "Understates by omitting the adjustment term.",
      },
      {
        label: "B",
        text: "USD 1,250.00",
        rationale: "Correctly applies the standard formula here.",
      },
      {
        label: "C",
        text: "USD 1,300.00",
        rationale: "Overstates by double counting the adjustment.",
      },
    ],
    correct_option: "B",
    explanation_md:
      "Option B applies the formula correctly; A omits the adjustment and C double counts it, both common errors that students make.",
    ...overrides,
  };
}

describe("deterministic validators", () => {
  it("passes a clean question", () => {
    expect(runDeterministicValidators(q()).ok).toBe(true);
  });

  it("rejects the wrong number of options", () => {
    expect(validateThreeOptions(q({ options: q().options.slice(0, 2) })).ok).toBe(false);
  });

  it("requires correct_option to match an option", () => {
    expect(validateSingleCorrectAnswer({ ...q(), correct_option: "C" }).ok).toBe(true);
  });

  it("flags forbidden option text", () => {
    const bad = q();
    bad.options[2] = { label: "C", text: "None of the above", rationale: "x".repeat(25) };
    expect(validateForbiddenOptionText(bad).ok).toBe(false);
  });

  it("enforces ascending numerical options", () => {
    const bad = q();
    bad.options = [
      { label: "A", text: "300", rationale: "r".repeat(25) },
      { label: "B", text: "200", rationale: "r".repeat(25) },
      { label: "C", text: "100", rationale: "r".repeat(25) },
    ];
    expect(validateNumericalOrdering(bad).ok).toBe(false);
  });

  it("flags official-sounding claims, including in option rationales", () => {
    expect(validateNoOfficialClaims(q({ stem: "These are real exam questions." })).ok).toBe(false);
    const inRationale = q();
    inRationale.options[0] = {
      label: "A",
      text: "USD 1,200.00",
      rationale: "As seen in the actual exam, this understates the value.",
    };
    expect(validateNoOfficialClaims(inRationale).ok).toBe(false);
  });

  it("flags discouraged stem phrasings (except / NOT / true-false)", () => {
    expect(validateStemPhrasing(q({ stem: "All of the following are true EXCEPT:" })).ok).toBe(
      false,
    );
    expect(validateStemPhrasing(q({ stem: "Which statement is NOT correct?" })).ok).toBe(false);
    expect(validateStemPhrasing(q()).ok).toBe(true);
  });

  it("flags unbalanced math delimiters", () => {
    expect(validateMarkdownMath(q({ explanation_md: `${"a".repeat(100)} $x` })).ok).toBe(false);
  });

  it("flags missing option rationales", () => {
    const bad = q();
    bad.options[0] = { label: "A", text: "USD 1,200.00", rationale: "too short" };
    expect(runDeterministicValidators(bad).ok).toBe(false);
  });
});

describe("validateTopicWeightDistribution", () => {
  it("passes the canonical 180-mock allocation", () => {
    const counts = {
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
    } as const;
    expect(validateTopicWeightDistribution(counts).ok).toBe(true);
  });

  it("flags a badly skewed batch", () => {
    expect(validateTopicWeightDistribution({ ETH: 100 }).ok).toBe(false);
  });
});
