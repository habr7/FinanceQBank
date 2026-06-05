import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import { createMockLlmClient } from "../src/agents";
import { SOURCE_CORPUS } from "../src/fixtures/source-corpus";
import { JsonContentStore } from "../src/store";
import { auditBatch, createPipelineContext, generateBatch, publishBatch } from "../src/runners";

const dir = mkdtempSync(join(tmpdir(), "cb-content-"));
const store = new JsonContentStore(join(dir, "store.json"));
const ctx = createPipelineContext({
  llm: createMockLlmClient(),
  store,
  corpus: SOURCE_CORPUS,
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("content pipeline (offline, mock LLM + JSON store)", () => {
  it("generates drafts, audits them, and publishes only passing questions", async () => {
    const { batchId, questionIds } = await generateBatch(ctx, {
      topic: "QM",
      count: 3,
      difficulty: "medium",
    });
    expect(questionIds).toHaveLength(3);
    expect((await store.listByStatus("draft")).length).toBe(3);

    const outcomes = await auditBatch(ctx, batchId);
    expect(outcomes.every((o) => o.status === "ai_validated")).toBe(true);

    // Each question accrues solver/validator/adversarial/ip/math audits.
    const audits = await store.listAudits(questionIds[0]!);
    expect(audits.length).toBeGreaterThanOrEqual(5);

    const result = await publishBatch(ctx, batchId, { requireHumanReview: false });
    expect(result.published).toHaveLength(3);
    expect((await store.listByStatus("published")).length).toBe(3);
  });

  it("quarantines flawed questions and never publishes them", async () => {
    const { batchId, questionIds } = await generateBatch(ctx, {
      topic: "QM",
      count: 2,
      difficulty: "medium",
      flawEvery: 1,
    });

    const outcomes = await auditBatch(ctx, batchId);
    expect(outcomes.every((o) => o.status === "quarantined")).toBe(true);

    const result = await publishBatch(ctx, batchId, { requireHumanReview: false });
    expect(result.published).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);

    for (const id of questionIds) {
      expect((await store.getQuestion(id))?.status).toBe("quarantined");
    }
  });

  it("queues passing questions for human review when required (MVP default)", async () => {
    const { batchId } = await generateBatch(ctx, { topic: "FI", count: 2, difficulty: "easy" });
    await auditBatch(ctx, batchId);

    const result = await publishBatch(ctx, batchId, { requireHumanReview: true });
    expect(result.queuedForReview).toHaveLength(2);
    expect(result.published).toHaveLength(0);
  });
});
