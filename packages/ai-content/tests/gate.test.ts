import { describe, expect, it } from "vitest";
import { evaluatePublishGate, type GateInput } from "../src/gates";
import type { ValidatableQuestion } from "../src/validators";

function question(): ValidatableQuestion {
  return {
    topic_code: "QM",
    difficulty: "medium",
    stem: "Which value is most accurate given the inputs provided to the analyst?",
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
      "Option B applies the formula correctly; A omits the adjustment and C double counts it, both common candidate errors.",
  };
}

function input(overrides: Partial<GateInput> = {}): GateInput {
  return {
    question: question(),
    qualityScore: 92,
    aiConfidence: 0.95,
    ipRiskScore: 0.05,
    validator: { result: "pass", finalCorrectOption: "B" },
    solver: { answer: "B", ambiguities: 0 },
    adversarialSeverity: "none",
    ...overrides,
  };
}

describe("evaluatePublishGate", () => {
  it("passes a clean, high-confidence item", () => {
    expect(evaluatePublishGate(input())).toEqual({ pass: true, reasons: [] });
  });

  it("rejects a failed validator", () => {
    const decision = evaluatePublishGate(
      input({ validator: { result: "fail", finalCorrectOption: "B" } }),
    );
    expect(decision.pass).toBe(false);
    expect(decision.reasons).toContain("validator_failed");
  });

  it("rejects validator disagreement on the answer", () => {
    const decision = evaluatePublishGate(
      input({ validator: { result: "pass", finalCorrectOption: "A" } }),
    );
    expect(decision.pass).toBe(false);
    expect(decision.reasons).toContain("validator_disagrees_on_answer");
  });

  it("rejects a 'corrected' validator result (correction not auto-applied)", () => {
    const decision = evaluatePublishGate(
      input({ validator: { result: "corrected", finalCorrectOption: "B" } }),
    );
    expect(decision.pass).toBe(false);
    expect(decision.reasons).toContain("validator_corrected_needs_human");
  });

  it("rejects when the independent solver disagrees with the key", () => {
    const decision = evaluatePublishGate(input({ solver: { answer: "A", ambiguities: 0 } }));
    expect(decision.pass).toBe(false);
    expect(decision.reasons).toContain("solver_disagrees_on_answer");
  });

  it("rejects when the solver flags ambiguity", () => {
    const decision = evaluatePublishGate(input({ solver: { answer: "B", ambiguities: 1 } }));
    expect(decision.pass).toBe(false);
    expect(decision.reasons).toContain("solver_flagged_ambiguity");
  });

  it("fails closed on a missing IP score", () => {
    expect(evaluatePublishGate(input({ ipRiskScore: Number.NaN })).pass).toBe(false);
  });

  it("rejects a critical adversarial finding", () => {
    expect(evaluatePublishGate(input({ adversarialSeverity: "critical" })).pass).toBe(false);
  });

  it("rejects high IP risk", () => {
    const decision = evaluatePublishGate(input({ ipRiskScore: 0.5 }));
    expect(decision.pass).toBe(false);
    expect(decision.reasons.some((r) => r.startsWith("ip_risk_too_high"))).toBe(true);
  });

  it("rejects low quality and low confidence", () => {
    expect(evaluatePublishGate(input({ qualityScore: 70 })).pass).toBe(false);
    expect(evaluatePublishGate(input({ aiConfidence: 0.5 })).pass).toBe(false);
  });

  it("rejects forbidden option text via deterministic checks", () => {
    const q = question();
    q.options[2] = { label: "C", text: "None of the above", rationale: "x".repeat(25) };
    const decision = evaluatePublishGate(input({ question: q }));
    expect(decision.pass).toBe(false);
    expect(decision.reasons.some((r) => r.includes("forbidden_option"))).toBe(true);
  });
});
