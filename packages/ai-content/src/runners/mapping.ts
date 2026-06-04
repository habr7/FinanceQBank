import type { GeneratedQuestion } from "../schemas";
import type { StoredOption, StoredQuestion } from "../store/types";
import { newId } from "../utils/id";

export function toStoredQuestion(
  generated: GeneratedQuestion,
  meta: { batchId: string; model: string; promptVersion: string },
): StoredQuestion {
  const options: StoredOption[] = generated.options.map((o) => ({
    label: o.label,
    text: o.text,
    rationale: o.rationale,
  }));
  return {
    id: newId(),
    batch_id: meta.batchId,
    curriculum_version: generated.curriculum_version,
    topic_code: generated.topic_code,
    objective_code: generated.objective_code,
    difficulty: generated.difficulty,
    cognitive_level: generated.cognitive_level,
    question_type: generated.question_type,
    stem: generated.stem,
    vignette: generated.vignette ?? null,
    options,
    correct_option: generated.correct_option,
    explanation_md: generated.explanation_md,
    formula_md: generated.formula_md ?? null,
    calculator_hint_md: generated.calculator_hint_md ?? null,
    common_trap_md: generated.common_trap_md ?? null,
    status: "draft",
    quality_score: null,
    ai_confidence: null,
    ip_similarity_score: null,
    generated_by_model: meta.model,
    validated_by_model: null,
    prompt_version: meta.promptVersion,
    published_at: null,
    created_at: new Date().toISOString(),
  };
}

/** Reconstruct the agent/validator view of a stored question. */
export function toGeneratedQuestion(q: StoredQuestion): GeneratedQuestion {
  return {
    curriculum_version: q.curriculum_version,
    topic_code: q.topic_code as GeneratedQuestion["topic_code"],
    objective_code: q.objective_code,
    difficulty: q.difficulty as GeneratedQuestion["difficulty"],
    cognitive_level: q.cognitive_level as GeneratedQuestion["cognitive_level"],
    question_type: q.question_type as GeneratedQuestion["question_type"],
    stem: q.stem,
    vignette: q.vignette,
    options: q.options.map((o) => ({ label: o.label, text: o.text, rationale: o.rationale ?? "" })),
    correct_option: q.correct_option,
    explanation_md: q.explanation_md,
    formula_md: q.formula_md,
    calculator_hint_md: q.calculator_hint_md,
    common_trap_md: q.common_trap_md,
    quality_self_check: {
      single_best_answer: true,
      no_forbidden_options: true,
      no_official_content_copied: true,
      explanation_covers_all_options: true,
    },
  };
}
