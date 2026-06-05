import { createLlmClient } from "../agents";
import { createContentStore, type ContentStore } from "../store";
import { SOURCE_CORPUS } from "../fixtures/source-corpus";
import type { LlmClient } from "../agents";

export interface PipelineContext {
  llm: LlmClient;
  store: ContentStore;
  corpus: readonly string[];
}

export function createPipelineContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    llm: overrides.llm ?? createLlmClient(),
    store: overrides.store ?? createContentStore(),
    corpus: overrides.corpus ?? SOURCE_CORPUS,
  };
}
