export type QuestionStatus =
  | "draft"
  | "ai_validated"
  | "human_review"
  | "published"
  | "quarantined"
  | "retired";

export type AuditType =
  | "independent_solver"
  | "validator"
  | "adversarial_review"
  | "math_check"
  | "ip_check"
  | "human_review";

export type AuditResult = "pass" | "warning" | "fail" | "corrected";

export interface StoredOption {
  label: "A" | "B" | "C";
  text: string;
  rationale: string | null;
}

export interface StoredQuestion {
  id: string;
  batch_id: string;
  curriculum_version: string;
  topic_code: string;
  objective_code: string;
  difficulty: string;
  cognitive_level: string;
  question_type: string;
  stem: string;
  vignette: string | null;
  options: StoredOption[];
  correct_option: "A" | "B" | "C";
  explanation_md: string;
  formula_md: string | null;
  calculator_hint_md: string | null;
  common_trap_md: string | null;
  status: QuestionStatus;
  quality_score: number | null;
  ai_confidence: number | null;
  ip_similarity_score: number | null;
  generated_by_model: string | null;
  validated_by_model: string | null;
  prompt_version: string | null;
  published_at: string | null;
  created_at: string;
}

export interface StoredAudit {
  id: string;
  question_id: string;
  audit_type: AuditType;
  result: AuditResult;
  findings: Record<string, unknown>;
  model: string | null;
  created_at: string;
}

export interface BatchMeta {
  jobType: string;
  payload?: Record<string, unknown>;
}

/** Persistence boundary for the content pipeline. Implemented offline (JSON). */
export interface ContentStore {
  createBatch(meta: BatchMeta): Promise<string>;
  saveDraft(question: StoredQuestion): Promise<void>;
  getQuestion(id: string): Promise<StoredQuestion | null>;
  updateQuestion(id: string, patch: Partial<StoredQuestion>): Promise<void>;
  listByBatch(batchId: string): Promise<StoredQuestion[]>;
  listByStatus(status: QuestionStatus): Promise<StoredQuestion[]>;
  saveAudit(audit: StoredAudit): Promise<void>;
  listAudits(questionId: string): Promise<StoredAudit[]>;
}
