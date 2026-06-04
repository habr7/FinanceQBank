import { z } from "zod";

export const TOPIC_CODES = [
  "ETH",
  "QM",
  "ECON",
  "FSA",
  "CI",
  "EQ",
  "FI",
  "DER",
  "AI",
  "PM",
] as const;

export const OptionLabelSchema = z.enum(["A", "B", "C"]);
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
export const CognitiveLevelSchema = z.enum(["recall", "comprehension", "application", "analysis"]);
export const QuestionTypeSchema = z.enum(["conceptual", "calculation", "mini_case"]);

export const GeneratedOptionSchema = z.object({
  label: OptionLabelSchema,
  text: z.string().min(1),
  rationale: z.string().min(20),
});

/**
 * Contract for a generated question (PROJECT_BRIEF §10.4). Enforces exactly 3
 * options and the structural invariants before anything reaches a draft.
 */
export const GeneratedQuestionSchema = z.object({
  curriculum_version: z.string().min(1),
  topic_code: z.enum(TOPIC_CODES),
  objective_code: z.string().min(1),
  difficulty: DifficultySchema,
  cognitive_level: CognitiveLevelSchema,
  question_type: QuestionTypeSchema,
  stem: z.string().min(40),
  vignette: z.string().optional().nullable(),
  options: z
    .array(GeneratedOptionSchema)
    .length(3)
    .refine((opts) => new Set(opts.map((o) => o.label)).size === 3, {
      message: "Options must have distinct labels A, B, and C.",
    }),
  correct_option: OptionLabelSchema,
  explanation_md: z.string().min(100),
  formula_md: z.string().optional().nullable(),
  calculator_hint_md: z.string().optional().nullable(),
  common_trap_md: z.string().optional().nullable(),
  source_chunk_ids: z.array(z.string()).optional(),
  quality_self_check: z.object({
    single_best_answer: z.boolean(),
    no_forbidden_options: z.boolean(),
    no_official_content_copied: z.boolean(),
    numerical_options_ordered: z.boolean().optional(),
    explanation_covers_all_options: z.boolean(),
  }),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
export type GeneratedOption = z.infer<typeof GeneratedOptionSchema>;
export type OptionLabel = z.infer<typeof OptionLabelSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
