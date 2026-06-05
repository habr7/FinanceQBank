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

const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 60_000;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Anthropic Messages API adapter. Validates output with the provided schema and
 * retries (bounded, with backoff) on transient HTTP errors, timeouts, truncation
 * (stop_reason=max_tokens), and JSON/Zod parse failures, so one bad response does
 * not abort a whole batch. The caller can still quarantine an item that never parses.
 */
export function createAnthropicLlmClient(apiKey: string, model: string): LlmClient {
  return {
    model,
    async complete<T>(request: LlmRequest, schema: z.ZodType<T>): Promise<LlmResult<T>> {
      let lastError: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const startedAt = Date.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            signal: controller.signal,
            headers: {
              "content-type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              system: request.system,
              messages: [{ role: "user", content: `${request.user}\n\nReturn only valid JSON.` }],
            }),
          });

          if (response.status === 429 || response.status >= 500) {
            throw new Error(`retryable Anthropic status ${response.status}`);
          }
          if (!response.ok) {
            // Non-retryable (e.g. 400/401) — fail immediately.
            throw Object.assign(new Error(`Anthropic API error ${response.status}`), {
              fatal: true,
            });
          }

          const payload = (await response.json()) as {
            content?: { text?: string }[];
            stop_reason?: string;
            usage?: { input_tokens?: number; output_tokens?: number };
          };
          if (payload.stop_reason === "max_tokens") {
            throw new Error("response truncated (max_tokens)");
          }

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
        } catch (error) {
          lastError = error;
          if ((error as { fatal?: boolean }).fatal || attempt === MAX_ATTEMPTS) break;
          await sleep(2 ** attempt * 500);
        } finally {
          clearTimeout(timer);
        }
      }
      throw lastError instanceof Error ? lastError : new Error("Anthropic request failed");
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
