import type { z } from "zod";
import { FORBIDDEN_OPTION_PATTERNS } from "@charterbank/shared";

import type { LlmClient, LlmRequest, LlmResult } from "./types";

interface BlueprintInput {
  topic_code: string;
  difficulty: string;
  objective_code: string;
  question_type?: string;
}

/**
 * Deterministic, offline LLM stand-in. It produces schema-valid payloads for each
 * agent so the whole pipeline can run and be tested without a network/API key.
 * If an objective code contains "FLAW" it injects a forbidden option so the
 * audit + gate path (quarantine) is exercised too.
 */
export function createMockLlmClient(): LlmClient {
  return {
    model: "mock-deterministic-1",
    async complete<T>(request: LlmRequest, schema: z.ZodType<T>): Promise<LlmResult<T>> {
      const raw = build(request);
      const data = schema.parse(raw);
      return {
        data,
        meta: { model: "mock-deterministic-1", promptVersion: request.promptVersion },
      };
    },
  };
}

function parse(user: string): Record<string, unknown> {
  try {
    return JSON.parse(user) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function build(request: LlmRequest): unknown {
  switch (request.agent) {
    case "blueprint":
      return buildBlueprint(parse(request.user) as unknown as BlueprintInput);
    case "generator":
      return buildQuestion((parse(request.user).blueprint ?? {}) as BlueprintInput);
    case "solver":
      return {
        independent_answer: "B",
        confidence: 0.9,
        solution_md: "Apply the standard formula and select the closest value.",
        calculation_steps: ["Identify inputs", "Apply formula", "Compare to options"],
        potential_ambiguities: [],
      };
    case "validator": {
      const question = (parse(request.user).question ?? {}) as { correct_option?: string };
      return {
        result: "pass",
        final_correct_option: question.correct_option ?? "B",
        confidence: 0.95,
        findings: [],
      };
    }
    case "adversarial": {
      const question = (parse(request.user).question ?? {}) as {
        options?: { text?: string }[];
      };
      const hasForbidden = (question.options ?? []).some((o) =>
        FORBIDDEN_OPTION_PATTERNS.some((p) => p.test(o.text ?? "")),
      );
      return hasForbidden
        ? { severity: "critical", findings: ["Option uses forbidden wording."] }
        : { severity: "none", findings: [] };
    }
    default:
      return {};
  }
}

function buildBlueprint(input: BlueprintInput): unknown {
  return {
    topic_code: input.topic_code,
    objective_code: input.objective_code,
    difficulty: input.difficulty,
    question_type: input.question_type ?? "calculation",
    tested_concept: "Application of a core valuation relationship.",
    common_mistake: "Misapplying the adjustment term or its sign.",
    distractor_strategy: {
      A: "Understates by omitting the adjustment.",
      B: "Correct application.",
      C: "Overstates by double counting.",
    },
    requires_calculation: true,
    formula_refs: ["value = base × (1 + adjustment)"],
  };
}

function buildQuestion(blueprint: BlueprintInput): unknown {
  const flawed = (blueprint.objective_code ?? "").includes("FLAW");
  const optionC = flawed
    ? {
        label: "C",
        text: "None of the above",
        rationale: "Forbidden wording injected to exercise the audit gate.",
      }
    : {
        label: "C",
        text: "USD 1,562.50",
        rationale:
          "Applies the 25% adjustment twice (1,000 x 1.25 x 1.25), a double-counting error.",
      };

  return {
    curriculum_version: "2026-L1",
    topic_code: blueprint.topic_code ?? "QM",
    objective_code: blueprint.objective_code ?? "QM-GEN-0",
    difficulty: blueprint.difficulty ?? "medium",
    cognitive_level: "application",
    question_type: blueprint.question_type ?? "calculation",
    stem: "A position has a base value of USD 1,000 and a one-time 25% upward adjustment. Using value = base times one plus the adjustment, which adjusted value is most accurate?",
    vignette: null,
    options: [
      {
        label: "A",
        text: "USD 1,000.00",
        rationale: "Omits the 25% adjustment, leaving the unadjusted base value.",
      },
      {
        label: "B",
        text: "USD 1,250.00",
        rationale: "Applies the 25% adjustment once: 1,000 x 1.25 = 1,250, the correct value.",
      },
      optionC,
    ],
    correct_option: "B",
    explanation_md:
      "Applying value = base times one plus the adjustment gives 1,000 x 1.25 = 1,250, so option B is correct. " +
      "Option A of 1,000 omits the adjustment entirely, while option C of 1,562.50 applies the 25% twice " +
      "(1,000 x 1.25 x 1.25), a common double-counting error.",
    formula_md: "value = base \\times (1 + adjustment)",
    calculator_hint_md: null,
    common_trap_md: "Apply the adjustment exactly once; do not compound it.",
    quality_self_check: {
      single_best_answer: true,
      no_forbidden_options: !flawed,
      no_official_content_copied: true,
      numerical_options_ordered: true,
      explanation_covers_all_options: true,
    },
  };
}
