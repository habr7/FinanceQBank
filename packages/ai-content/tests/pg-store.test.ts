import { afterAll, describe, expect, it } from "vitest";

import { createMockLlmClient } from "../src/agents";
import { SOURCE_CORPUS } from "../src/fixtures/source-corpus";
import { PgContentStore } from "../src/store";
import { auditBatch, createPipelineContext, generateBatch, publishBatch } from "../src/runners";

const url = process.env.TEST_DATABASE_URL;

// Requires a real Postgres cluster with the db migrations + seed applied. The
// `pnpm --filter @charterbank/ai-content test:db` script boots one. Skipped otherwise.
const describeDb = url ? describe : describe.skip;

describeDb("PgContentStore (pipeline -> Postgres)", () => {
  const store = new PgContentStore(url as string);
  const ctx = createPipelineContext({ llm: createMockLlmClient(), store, corpus: SOURCE_CORPUS });

  afterAll(async () => {
    await store.close();
  });

  it("rounds-trips generate -> audit -> publish into the content tables", async () => {
    const { batchId, questionIds } = await generateBatch(ctx, {
      topic: "QM",
      count: 2,
      difficulty: "medium",
    });
    expect(questionIds).toHaveLength(2);

    const drafts = await store.listByBatch(batchId);
    expect(drafts.length).toBe(2);
    expect(drafts.every((q) => q.status === "draft")).toBe(true);
    expect(drafts[0]?.options).toHaveLength(3);

    const outcomes = await auditBatch(ctx, batchId);
    expect(outcomes.every((o) => o.status === "ai_validated")).toBe(true);
    expect((await store.listAudits(questionIds[0] as string)).length).toBeGreaterThanOrEqual(5);

    const result = await publishBatch(ctx, batchId, { requireHumanReview: false });
    expect(result.published).toHaveLength(2);

    const published = await store.getQuestion(questionIds[0] as string);
    expect(published?.status).toBe("published");
    expect(published?.published_at).not.toBeNull();
    expect(published?.correct_option).toBe("B");
  });

  it("quarantines flawed questions and never publishes them", async () => {
    const { batchId, questionIds } = await generateBatch(ctx, {
      topic: "FI",
      count: 1,
      difficulty: "easy",
      flawEvery: 1,
    });
    await auditBatch(ctx, batchId);
    expect((await store.getQuestion(questionIds[0] as string))?.status).toBe("quarantined");

    const result = await publishBatch(ctx, batchId, { requireHumanReview: false });
    expect(result.published).toHaveLength(0);
  });
});
