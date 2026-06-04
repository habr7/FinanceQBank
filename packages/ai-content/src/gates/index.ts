import { runDeterministicValidators, type ValidatableQuestion } from "../validators";

export const IP_RISK_THRESHOLD = 0.35;
export const MIN_QUALITY_SCORE = 85;
export const MIN_AI_CONFIDENCE = 0.85;

export interface GateInput {
  question: ValidatableQuestion;
  qualityScore: number; // 0–100
  aiConfidence: number; // 0–1
  ipRiskScore: number; // 0–1
  validator: {
    result: "pass" | "warning" | "fail" | "corrected";
    finalCorrectOption: "A" | "B" | "C";
  };
  adversarialSeverity: "none" | "minor" | "major" | "critical";
}

export interface PublishDecision {
  pass: boolean;
  reasons: string[];
}

/**
 * The publication gate (PROJECT_BRIEF §9). A question may only be published when
 * EVERY condition holds. Any failure returns a reason and the caller quarantines.
 */
export function evaluatePublishGate(input: GateInput): PublishDecision {
  const reasons: string[] = [];

  const deterministic = runDeterministicValidators(input.question);
  if (!deterministic.ok) {
    reasons.push(...deterministic.issues.map((i) => `deterministic:${i.code}: ${i.message}`));
  }

  if (!input.question.topic_code) reasons.push("missing_topic");
  if (!input.question.difficulty) reasons.push("missing_difficulty");

  if (input.validator.result === "fail") {
    reasons.push("validator_failed");
  }
  if (input.validator.finalCorrectOption !== input.question.correct_option) {
    reasons.push("validator_disagrees_on_answer");
  }

  if (input.adversarialSeverity === "critical") {
    reasons.push("adversarial_critical");
  }

  if (input.ipRiskScore >= IP_RISK_THRESHOLD) {
    reasons.push(`ip_risk_too_high:${input.ipRiskScore.toFixed(2)}`);
  }

  if (input.qualityScore < MIN_QUALITY_SCORE) {
    reasons.push(`quality_below_${MIN_QUALITY_SCORE}:${input.qualityScore}`);
  }
  if (input.aiConfidence < MIN_AI_CONFIDENCE) {
    reasons.push(`confidence_below_${MIN_AI_CONFIDENCE}:${input.aiConfidence}`);
  }

  return { pass: reasons.length === 0, reasons };
}
