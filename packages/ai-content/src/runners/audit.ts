import { runAdversarial, runIpCheck, runSolver, runValidator } from "../agents";
import { evaluatePublishGate, type PublishDecision } from "../gates";
import { runDeterministicValidators, validateMarkdownMath } from "../validators";
import type { AdversarialOutput, ValidatorOutput } from "../schemas";
import type { AuditResult, StoredAudit } from "../store/types";
import { newId } from "../utils/id";
import type { PipelineContext } from "./context";
import { toGeneratedQuestion } from "./mapping";

export interface AuditOutcome {
  questionId: string;
  status: "ai_validated" | "quarantined";
  decision: PublishDecision;
  qualityScore: number;
  aiConfidence: number;
  ipRiskScore: number;
}

function severityToResult(severity: AdversarialOutput["severity"]): AuditResult {
  if (severity === "critical") return "fail";
  if (severity === "major" || severity === "minor") return "warning";
  return "pass";
}

function computeQualityScore(
  deterministicIssues: number,
  adversarial: AdversarialOutput,
  validator: ValidatorOutput,
): number {
  let score = 100;
  score -= deterministicIssues * 20;
  if (adversarial.severity === "major") score -= 20;
  if (adversarial.severity === "critical") score -= 50;
  if (validator.result === "warning") score -= 10;
  if (validator.result === "fail") score -= 50;
  return Math.max(0, Math.min(100, score));
}

/**
 * Run solver -> validator -> adversarial -> IP + deterministic checks on every
 * draft in the batch, persist audits, score the item, and apply the publish gate:
 * passing items become `ai_validated`, failing items are quarantined. Nothing is
 * published here.
 */
export async function auditBatch(ctx: PipelineContext, batchId: string): Promise<AuditOutcome[]> {
  const drafts = await ctx.store.listByBatch(batchId);
  const outcomes: AuditOutcome[] = [];

  for (const stored of drafts) {
    if (stored.status !== "draft") continue;
    const question = toGeneratedQuestion(stored);

    const solver = await runSolver(ctx.llm, question);
    const validator = await runValidator(ctx.llm, question, solver.data);
    const adversarial = await runAdversarial(ctx.llm, question);
    const ip = runIpCheck(question, ctx.corpus);
    const deterministic = runDeterministicValidators(question);
    const math = validateMarkdownMath(question);

    const saveAudit = (
      auditType: StoredAudit["audit_type"],
      result: AuditResult,
      findings: Record<string, unknown>,
    ) =>
      ctx.store.saveAudit({
        id: newId(),
        question_id: stored.id,
        audit_type: auditType,
        result,
        findings,
        model: ctx.llm.model,
        created_at: new Date().toISOString(),
      });

    await saveAudit(
      "independent_solver",
      solver.data.potential_ambiguities.length ? "warning" : "pass",
      {
        answer: solver.data.independent_answer,
        confidence: solver.data.confidence,
        ambiguities: solver.data.potential_ambiguities,
      },
    );
    await saveAudit("validator", validator.data.result, {
      final_correct_option: validator.data.final_correct_option,
      findings: validator.data.findings,
    });
    await saveAudit("adversarial_review", severityToResult(adversarial.data.severity), {
      severity: adversarial.data.severity,
      findings: adversarial.data.findings,
    });
    await saveAudit("ip_check", ip.risk_score >= 0.35 ? "fail" : "pass", {
      risk_score: ip.risk_score,
      reasons: ip.reasons,
    });
    await saveAudit("math_check", math.ok ? "pass" : "fail", { issues: deterministic.issues });

    const qualityScore = computeQualityScore(
      deterministic.issues.length,
      adversarial.data,
      validator.data,
    );
    const aiConfidence = validator.data.confidence;

    const decision = evaluatePublishGate({
      question,
      qualityScore,
      aiConfidence,
      ipRiskScore: ip.risk_score,
      validator: {
        result: validator.data.result,
        finalCorrectOption: validator.data.final_correct_option,
      },
      adversarialSeverity: adversarial.data.severity,
    });

    const status = decision.pass ? "ai_validated" : "quarantined";
    await ctx.store.updateQuestion(stored.id, {
      status,
      quality_score: qualityScore,
      ai_confidence: aiConfidence,
      ip_similarity_score: ip.risk_score,
      validated_by_model: ctx.llm.model,
    });

    outcomes.push({
      questionId: stored.id,
      status,
      decision,
      qualityScore,
      aiConfidence,
      ipRiskScore: ip.risk_score,
    });
  }

  return outcomes;
}
