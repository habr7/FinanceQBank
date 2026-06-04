import { runBlueprint, runGenerator } from "../agents";
import type { Difficulty } from "../schemas";
import type { PipelineContext } from "./context";
import { toStoredQuestion } from "./mapping";

export interface GenerateOptions {
  topic: string;
  count: number;
  difficulty: Difficulty;
  curriculum?: string;
  /** Internal/testing only: inject a forbidden-option flaw every Nth item. */
  flawEvery?: number;
}

export interface GenerateResult {
  batchId: string;
  questionIds: string[];
}

/**
 * Blueprint -> generate -> Zod-validate -> save draft. Drafts are never published
 * here; they only enter the pipeline as `draft` for the audit step.
 */
export async function generateBatch(
  ctx: PipelineContext,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const batchId = await ctx.store.createBatch({
    jobType: "generate_question",
    payload: { topic: options.topic, count: options.count, difficulty: options.difficulty },
  });

  const questionIds: string[] = [];
  for (let i = 0; i < options.count; i += 1) {
    const flawed = (options.flawEvery ?? 0) > 0 && i % (options.flawEvery as number) === 0;
    const objectiveCode = `${options.topic}-GEN-${i}${flawed ? "-FLAW" : ""}`;

    const blueprint = await runBlueprint(ctx.llm, {
      topic_code: options.topic,
      difficulty: options.difficulty,
      objective_code: objectiveCode,
    });
    const generated = await runGenerator(ctx.llm, blueprint.data);

    const stored = toStoredQuestion(generated.data, {
      batchId,
      model: ctx.llm.model,
      promptVersion: generated.meta.promptVersion,
    });
    await ctx.store.saveDraft(stored);
    questionIds.push(stored.id);
  }

  return { batchId, questionIds };
}
