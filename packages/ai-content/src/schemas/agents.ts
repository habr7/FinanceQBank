import { z } from "zod";

import { DifficultySchema, OptionLabelSchema, QuestionTypeSchema, TOPIC_CODES } from "./question";

/** Agent 1 — Question Blueprint Planner (PROJECT_BRIEF §10.3). */
export const BlueprintSchema = z.object({
  topic_code: z.enum(TOPIC_CODES),
  objective_code: z.string().min(1),
  difficulty: DifficultySchema,
  question_type: QuestionTypeSchema,
  tested_concept: z.string().min(5),
  common_mistake: z.string().min(5),
  distractor_strategy: z.object({
    A: z.string().min(1),
    B: z.string().min(1),
    C: z.string().min(1),
  }),
  requires_calculation: z.boolean(),
  formula_refs: z.array(z.string()).default([]),
});
export type Blueprint = z.infer<typeof BlueprintSchema>;

/** Agent 3 — Independent Solver (PROJECT_BRIEF §10.5). */
export const SolverOutputSchema = z.object({
  independent_answer: OptionLabelSchema,
  confidence: z.number().min(0).max(1),
  solution_md: z.string().min(1),
  calculation_steps: z.array(z.string()).default([]),
  potential_ambiguities: z.array(z.string()).default([]),
});
export type SolverOutput = z.infer<typeof SolverOutputSchema>;

/** Agent 4 — Validator / Corrector (PROJECT_BRIEF §10.6). */
export const ValidatorOutputSchema = z.object({
  result: z.enum(["pass", "warning", "fail", "corrected"]),
  final_correct_option: OptionLabelSchema,
  confidence: z.number().min(0).max(1),
  findings: z.array(z.string()).default([]),
});
export type ValidatorOutput = z.infer<typeof ValidatorOutputSchema>;

/** Agent 5 — Adversarial Reviewer (PROJECT_BRIEF §10.7). */
export const AdversarialOutputSchema = z.object({
  severity: z.enum(["none", "minor", "major", "critical"]),
  findings: z.array(z.string()).default([]),
});
export type AdversarialOutput = z.infer<typeof AdversarialOutputSchema>;

/** Agent 6 — IP / Copyright Risk Checker (PROJECT_BRIEF §10.8). */
export const IpCheckOutputSchema = z.object({
  risk_score: z.number().min(0).max(1),
  reasons: z.array(z.string()).default([]),
});
export type IpCheckOutput = z.infer<typeof IpCheckOutputSchema>;
