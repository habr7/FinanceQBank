import type { z } from "zod";

export interface LlmCompletionMeta {
  model: string;
  promptVersion: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  costEstimateUsd?: number;
}

export interface LlmResult<T> {
  data: T;
  meta: LlmCompletionMeta;
}

export interface LlmRequest {
  /** Logical agent name for routing/tracing, e.g. "generator". */
  agent: string;
  system: string;
  user: string;
  promptVersion: string;
}

/**
 * Minimal LLM abstraction. Implementations MUST validate the model output against
 * `schema` and throw on failure, so invalid structured output never propagates.
 */
export interface LlmClient {
  readonly model: string;
  complete<T>(request: LlmRequest, schema: z.ZodType<T>): Promise<LlmResult<T>>;
}
