import { Pool } from "pg";

import { newId } from "../utils/id";
import type {
  BatchMeta,
  ContentStore,
  QuestionStatus,
  StoredAudit,
  StoredOption,
  StoredQuestion,
} from "./types";

const LEVEL_NUMBER: Record<string, string> = { I: "1", II: "2", III: "3" };

interface QuestionDbRow {
  id: string;
  batch_id: string | null;
  topic_code: string;
  objective_code: string | null;
  difficulty: string;
  cognitive_level: string;
  question_type: string | null;
  stem: string;
  vignette: string | null;
  correct_option: "A" | "B" | "C";
  explanation_md: string;
  formula_md: string | null;
  calculator_hint_md: string | null;
  common_trap_md: string | null;
  status: QuestionStatus;
  quality_score: string | null;
  ai_confidence: string | null;
  ip_similarity_score: string | null;
  generated_by_model: string | null;
  validated_by_model: string | null;
  prompt_version: string | null;
  published_at: string | null;
  created_at: string;
  cv_year: number;
  cv_level: string;
}

function num(value: string | null): number | null {
  return value === null ? null : Number(value);
}

/**
 * Postgres-backed content store. The pipeline is a trusted offline batch process,
 * so it connects directly to the database (SUPABASE_DB_URL) and writes into the
 * Phase 1 content tables that the Admin Content Studio reads. RLS is bypassed by
 * the privileged connection by design (no end-user access path).
 */
export class PgContentStore implements ContentStore {
  private readonly pool: Pool;
  private curriculumVersionId: string | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async activeCurriculumVersionId(): Promise<string> {
    if (this.curriculumVersionId) return this.curriculumVersionId;
    const { rows } = await this.pool.query<{ id: string }>(
      "select id from public.curriculum_versions where is_active order by year desc limit 1",
    );
    const id = rows[0]?.id;
    if (!id) throw new Error("No active curriculum_version found (seed the database first).");
    this.curriculumVersionId = id;
    return id;
  }

  async createBatch(meta: BatchMeta): Promise<string> {
    const id = newId();
    await this.pool.query(
      "insert into public.content_jobs (id, job_type, status, payload, started_at) values ($1, $2, 'running', $3, now())",
      [id, meta.jobType, JSON.stringify(meta.payload ?? {})],
    );
    return id;
  }

  async saveDraft(q: StoredQuestion): Promise<void> {
    const curriculumVersionId = await this.activeCurriculumVersionId();
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      await client.query(
        `insert into public.questions
           (id, batch_id, curriculum_version_id, topic_code, objective_code, difficulty,
            cognitive_level, question_type, stem, vignette, correct_option, explanation_md,
            formula_md, calculator_hint_md, common_trap_md, status, quality_score, ai_confidence,
            ip_similarity_score, generated_by_model, validated_by_model, prompt_version)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [
          q.id,
          q.batch_id,
          curriculumVersionId,
          q.topic_code,
          q.objective_code,
          q.difficulty,
          q.cognitive_level,
          q.question_type,
          q.stem,
          q.vignette,
          q.correct_option,
          q.explanation_md,
          q.formula_md,
          q.calculator_hint_md,
          q.common_trap_md,
          q.status,
          q.quality_score,
          q.ai_confidence,
          q.ip_similarity_score,
          q.generated_by_model,
          q.validated_by_model,
          q.prompt_version,
        ],
      );
      for (const option of q.options) {
        await client.query(
          "insert into public.question_options (question_id, label, option_text, rationale_md) values ($1,$2,$3,$4)",
          [q.id, option.label, option.text, option.rationale],
        );
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadOptions(questionIds: string[]): Promise<Map<string, StoredOption[]>> {
    const byQuestion = new Map<string, StoredOption[]>();
    if (questionIds.length === 0) return byQuestion;
    const { rows } = await this.pool.query<{
      question_id: string;
      label: "A" | "B" | "C";
      option_text: string;
      rationale_md: string | null;
    }>(
      "select question_id, label, option_text, rationale_md from public.question_options where question_id = any($1::uuid[]) order by label",
      [questionIds],
    );
    for (const r of rows) {
      const list = byQuestion.get(r.question_id) ?? [];
      list.push({ label: r.label, text: r.option_text, rationale: r.rationale_md });
      byQuestion.set(r.question_id, list);
    }
    return byQuestion;
  }

  private toStored(row: QuestionDbRow, options: StoredOption[]): StoredQuestion {
    return {
      id: row.id,
      batch_id: row.batch_id ?? "",
      curriculum_version: `${row.cv_year}-L${LEVEL_NUMBER[row.cv_level] ?? row.cv_level}`,
      topic_code: row.topic_code,
      objective_code: row.objective_code ?? "",
      difficulty: row.difficulty,
      cognitive_level: row.cognitive_level,
      question_type: row.question_type ?? "conceptual",
      stem: row.stem,
      vignette: row.vignette,
      options,
      correct_option: row.correct_option,
      explanation_md: row.explanation_md,
      formula_md: row.formula_md,
      calculator_hint_md: row.calculator_hint_md,
      common_trap_md: row.common_trap_md,
      status: row.status,
      quality_score: num(row.quality_score),
      ai_confidence: num(row.ai_confidence),
      ip_similarity_score: num(row.ip_similarity_score),
      generated_by_model: row.generated_by_model,
      validated_by_model: row.validated_by_model,
      prompt_version: row.prompt_version,
      published_at: row.published_at,
      created_at: row.created_at,
    };
  }

  private readonly SELECT = `
    select q.*, cv.year as cv_year, cv.level as cv_level
    from public.questions q
    join public.curriculum_versions cv on cv.id = q.curriculum_version_id`;

  private async hydrate(rows: QuestionDbRow[]): Promise<StoredQuestion[]> {
    const options = await this.loadOptions(rows.map((r) => r.id));
    return rows.map((r) => this.toStored(r, options.get(r.id) ?? []));
  }

  async getQuestion(id: string): Promise<StoredQuestion | null> {
    const { rows } = await this.pool.query<QuestionDbRow>(`${this.SELECT} where q.id = $1`, [id]);
    if (rows.length === 0) return null;
    return (await this.hydrate(rows))[0] ?? null;
  }

  async updateQuestion(id: string, patch: Partial<StoredQuestion>): Promise<void> {
    const columns: Record<string, unknown> = {};
    const allowed: (keyof StoredQuestion)[] = [
      "status",
      "quality_score",
      "ai_confidence",
      "ip_similarity_score",
      "validated_by_model",
      "published_at",
    ];
    for (const key of allowed) {
      if (key in patch) columns[key] = patch[key];
    }
    const keys = Object.keys(columns);
    if (keys.length === 0) return;
    const set = keys.map((k, i) => `${k} = $${i + 2}`).join(", ");
    await this.pool.query(`update public.questions set ${set}, updated_at = now() where id = $1`, [
      id,
      ...keys.map((k) => columns[k]),
    ]);
  }

  async listByBatch(batchId: string): Promise<StoredQuestion[]> {
    const { rows } = await this.pool.query<QuestionDbRow>(`${this.SELECT} where q.batch_id = $1`, [
      batchId,
    ]);
    return this.hydrate(rows);
  }

  async listByStatus(status: QuestionStatus): Promise<StoredQuestion[]> {
    const { rows } = await this.pool.query<QuestionDbRow>(`${this.SELECT} where q.status = $1`, [
      status,
    ]);
    return this.hydrate(rows);
  }

  async saveAudit(audit: StoredAudit): Promise<void> {
    await this.pool.query(
      "insert into public.question_audits (id, question_id, audit_type, result, findings, model) values ($1,$2,$3,$4,$5,$6)",
      [
        audit.id,
        audit.question_id,
        audit.audit_type,
        audit.result,
        JSON.stringify(audit.findings),
        audit.model,
      ],
    );
  }

  async listAudits(questionId: string): Promise<StoredAudit[]> {
    const { rows } = await this.pool.query<{
      id: string;
      question_id: string;
      audit_type: StoredAudit["audit_type"];
      result: StoredAudit["result"];
      findings: Record<string, unknown>;
      model: string | null;
      created_at: string;
    }>(
      "select id, question_id, audit_type, result, findings, model, created_at from public.question_audits where question_id = $1 order by created_at",
      [questionId],
    );
    return rows.map((r) => ({
      id: r.id,
      question_id: r.question_id,
      audit_type: r.audit_type,
      result: r.result,
      findings: r.findings,
      model: r.model,
      created_at: r.created_at,
    }));
  }
}
