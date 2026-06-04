import type { z } from "zod";

import type { LlmClient, LlmRequest, LlmResult } from "./types";
import { createMockLlmClient } from "./mock-llm";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1]!.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : text.trim();
}

/** Anthropic Messages API adapter. Validates output with the provided schema. */
export function createAnthropicLlmClient(apiKey: string, model: string): LlmClient {
  return {
    model,
    async complete<T>(request: LlmRequest, schema: z.ZodType<T>): Promise<LlmResult<T>> {
      const startedAt = Date.now();
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          system: request.system,
          messages: [{ role: "user", content: `${request.user}\n\nReturn only valid JSON.` }],
        }),
      });
      if (!response.ok) {
        throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
      }
      const payload = (await response.json()) as {
        content?: { text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      const text = payload.content?.[0]?.text ?? "";
      const data = schema.parse(JSON.parse(extractJson(text)));
      return {
        data,
        meta: {
          model,
          promptVersion: request.promptVersion,
          inputTokens: payload.usage?.input_tokens,
          outputTokens: payload.usage?.output_tokens,
          latencyMs: Date.now() - startedAt,
        },
      };
    },
  };
}

/**
 * Choose an LLM client from the environment: the real Anthropic adapter when
 * ANTHROPIC_API_KEY is set, otherwise the deterministic offline mock.
 */
export function createLlmClient(): LlmClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const model = process.env.AI_DEFAULT_GENERATOR_MODEL ?? "claude-sonnet-4-6";
    return createAnthropicLlmClient(apiKey, model);
  }
  return createMockLlmClient();
}
