import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { newId } from "../utils/id";
import type { BatchMeta, ContentStore, QuestionStatus, StoredAudit, StoredQuestion } from "./types";

interface StoreData {
  batches: Record<string, BatchMeta & { id: string; created_at: string }>;
  questions: Record<string, StoredQuestion>;
  audits: Record<string, StoredAudit[]>;
}

const EMPTY: StoreData = { batches: {}, questions: {}, audits: {} };

/**
 * Filesystem JSON store — the default offline backend for the content pipeline.
 * Keeps the whole demo runnable and testable without a database.
 */
export class JsonContentStore implements ContentStore {
  constructor(private readonly file: string) {}

  private read(): StoreData {
    if (!existsSync(this.file)) return structuredClone(EMPTY);
    return JSON.parse(readFileSync(this.file, "utf8")) as StoreData;
  }

  private write(data: StoreData): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, `${JSON.stringify(data, null, 2)}\n`);
  }

  async createBatch(meta: BatchMeta): Promise<string> {
    const data = this.read();
    const id = newId();
    data.batches[id] = { id, created_at: new Date().toISOString(), ...meta };
    this.write(data);
    return id;
  }

  async saveDraft(question: StoredQuestion): Promise<void> {
    const data = this.read();
    data.questions[question.id] = question;
    this.write(data);
  }

  async getQuestion(id: string): Promise<StoredQuestion | null> {
    return this.read().questions[id] ?? null;
  }

  async updateQuestion(id: string, patch: Partial<StoredQuestion>): Promise<void> {
    const data = this.read();
    const existing = data.questions[id];
    if (!existing) throw new Error(`Question ${id} not found`);
    data.questions[id] = { ...existing, ...patch };
    this.write(data);
  }

  async listByBatch(batchId: string): Promise<StoredQuestion[]> {
    return Object.values(this.read().questions).filter((q) => q.batch_id === batchId);
  }

  async listByStatus(status: QuestionStatus): Promise<StoredQuestion[]> {
    return Object.values(this.read().questions).filter((q) => q.status === status);
  }

  async saveAudit(audit: StoredAudit): Promise<void> {
    const data = this.read();
    const list = data.audits[audit.question_id] ?? [];
    list.push(audit);
    data.audits[audit.question_id] = list;
    this.write(data);
  }

  async listAudits(questionId: string): Promise<StoredAudit[]> {
    return this.read().audits[questionId] ?? [];
  }
}
