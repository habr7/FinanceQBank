import { assertTransition } from "../pipeline/state-machine";
import { newId } from "../utils/id";
import type { PipelineContext } from "./context";

export interface PublishOptions {
  requireHumanReview: boolean;
}

export interface PublishResult {
  published: string[];
  queuedForReview: string[];
  skipped: string[];
}

/**
 * Promote `ai_validated` questions in a batch. With requireHumanReview they move
 * to `human_review` (the MVP default for the first 500 items); otherwise they are
 * published. Anything not `ai_validated` (e.g. quarantined) is skipped — this step
 * never re-evaluates or overrides the gate.
 */
export async function publishBatch(
  ctx: PipelineContext,
  batchId: string,
  options: PublishOptions,
): Promise<PublishResult> {
  const questions = await ctx.store.listByBatch(batchId);
  const result: PublishResult = { published: [], queuedForReview: [], skipped: [] };

  for (const q of questions) {
    if (q.status !== "ai_validated") {
      result.skipped.push(q.id);
      continue;
    }

    if (options.requireHumanReview) {
      assertTransition(q.status, "human_review");
      await ctx.store.updateQuestion(q.id, { status: "human_review" });
      result.queuedForReview.push(q.id);
    } else {
      assertTransition(q.status, "published");
      await ctx.store.updateQuestion(q.id, {
        status: "published",
        published_at: new Date().toISOString(),
      });
      result.published.push(q.id);
    }
  }

  return result;
}

export async function quarantineQuestion(
  ctx: PipelineContext,
  questionId: string,
  reason: string,
): Promise<void> {
  const question = await ctx.store.getQuestion(questionId);
  if (!question) throw new Error(`Question ${questionId} not found`);
  assertTransition(question.status, "quarantined");
  await ctx.store.updateQuestion(questionId, { status: "quarantined" });
  await ctx.store.saveAudit({
    id: newId(),
    question_id: questionId,
    audit_type: "human_review",
    result: "fail",
    findings: { reason },
    model: null,
    created_at: new Date().toISOString(),
  });
}
