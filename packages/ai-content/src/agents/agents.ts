import {
  AdversarialOutputSchema,
  BlueprintSchema,
  GeneratedQuestionSchema,
  SolverOutputSchema,
  ValidatorOutputSchema,
  type AdversarialOutput,
  type Blueprint,
  type Difficulty,
  type GeneratedQuestion,
  type IpCheckOutput,
  type SolverOutput,
  type ValidatorOutput,
} from "../schemas";
import { getPrompt } from "../prompts";
import { IP_RISK_THRESHOLD } from "../gates";
import { ipRisk } from "../utils/ngram";
import type { LlmClient, LlmResult } from "./types";

export interface BlueprintInput {
  topic_code: string;
  difficulty: Difficulty;
  objective_code: string;
  question_type?: "conceptual" | "calculation" | "mini_case";
}

export function runBlueprint(llm: LlmClient, input: BlueprintInput): Promise<LlmResult<Blueprint>> {
  const prompt = getPrompt("blueprint");
  return llm.complete(
    {
      agent: "blueprint",
      system: prompt.system,
      user: JSON.stringify(input),
      promptVersion: prompt.version,
    },
    BlueprintSchema,
  );
}

export function runGenerator(
  llm: LlmClient,
  blueprint: Blueprint,
): Promise<LlmResult<GeneratedQuestion>> {
  const prompt = getPrompt("generator");
  return llm.complete(
    {
      agent: "generator",
      system: prompt.system,
      user: JSON.stringify({ blueprint }),
      promptVersion: prompt.version,
    },
    GeneratedQuestionSchema,
  );
}

/** Public view shown to the independent solver — no answer key, no explanation. */
export function toSolverView(question: GeneratedQuestion) {
  return {
    stem: question.stem,
    vignette: question.vignette ?? null,
    options: question.options.map((o) => ({ label: o.label, text: o.text })),
  };
}

export function runSolver(
  llm: LlmClient,
  question: GeneratedQuestion,
): Promise<LlmResult<SolverOutput>> {
  const prompt = getPrompt("solver");
  return llm.complete(
    {
      agent: "solver",
      system: prompt.system,
      user: JSON.stringify(toSolverView(question)),
      promptVersion: prompt.version,
    },
    SolverOutputSchema,
  );
}

export function runValidator(
  llm: LlmClient,
  question: GeneratedQuestion,
  solver: SolverOutput,
): Promise<LlmResult<ValidatorOutput>> {
  const prompt = getPrompt("validator");
  return llm.complete(
    {
      agent: "validator",
      system: prompt.system,
      user: JSON.stringify({ question, solver }),
      promptVersion: prompt.version,
    },
    ValidatorOutputSchema,
  );
}

export function runAdversarial(
  llm: LlmClient,
  question: GeneratedQuestion,
): Promise<LlmResult<AdversarialOutput>> {
  const prompt = getPrompt("adversarial");
  return llm.complete(
    {
      agent: "adversarial",
      system: prompt.system,
      user: JSON.stringify({ question }),
      promptVersion: prompt.version,
    },
    AdversarialOutputSchema,
  );
}

/**
 * Agent 6 — IP / copyright risk. Deterministic n-gram similarity against the
 * permitted/forbidden source corpus (no LLM needed and not subject to hallucination).
 */
export function runIpCheck(question: GeneratedQuestion, corpus: readonly string[]): IpCheckOutput {
  const text = [
    question.stem,
    question.explanation_md,
    ...question.options.map((o) => o.text),
  ].join("\n");
  const score = ipRisk(text, corpus);
  return {
    risk_score: Number(score.toFixed(4)),
    reasons:
      score >= IP_RISK_THRESHOLD ? ["High n-gram overlap with a source/forbidden document."] : [],
  };
}
