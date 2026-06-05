/**
 * Hand-authored database types mirroring supabase/migrations.
 *
 * Shaped like Supabase's generated types (a `Database` interface with
 * Row/Insert/Update per table) so it can be passed to
 * `createServerClient<Database>(...)`. In a later phase this can be replaced by
 * `supabase gen types typescript`.
 *
 * NOTE: row shapes are `type` aliases (not `interface`) on purpose — only type
 * aliases are assignable to `Record<string, unknown>`, which postgrest-js's
 * `GenericSchema` constraint requires. Using `interface` here makes the schema
 * silently resolve query results to `never`.
 */

export type Role = "student" | "admin" | "reviewer";
export type SubscriptionStatus = "free" | "trial" | "active" | "past_due" | "canceled";
export type Difficulty = "easy" | "medium" | "hard";
export type CognitiveLevel = "recall" | "comprehension" | "application" | "analysis";
export type OptionLabel = "A" | "B" | "C";
export type QuestionStatus =
  | "draft"
  | "ai_validated"
  | "human_review"
  | "published"
  | "quarantined"
  | "retired";
export type SessionMode = "practice" | "review_errors" | "mock_half" | "mock_full" | "adaptive";
export type ReportType =
  | "wrong_answer"
  | "ambiguous"
  | "typo"
  | "outdated"
  | "explanation_unclear"
  | "other";
export type ReportStatus = "open" | "triaged" | "fixed" | "wont_fix";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type CurriculumVersionRow = {
  id: string;
  year: number;
  level: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

export type TopicRow = {
  code: string;
  name: string;
  exam_weight_min: number;
  exam_weight_max: number;
  display_order: number;
};

export type QuestionRow = {
  id: string;
  curriculum_version_id: string;
  topic_code: string;
  learning_objective_id: string | null;
  difficulty: Difficulty;
  cognitive_level: CognitiveLevel;
  stem: string;
  vignette: string | null;
  correct_option: OptionLabel;
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
  batch_id: string | null;
  objective_code: string | null;
  question_type: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionAuditRow = {
  id: string;
  question_id: string;
  audit_type:
    | "independent_solver"
    | "validator"
    | "adversarial_review"
    | "math_check"
    | "ip_check"
    | "human_review";
  result: "pass" | "warning" | "fail" | "corrected";
  findings: unknown;
  corrected_payload: unknown;
  model: string | null;
  reviewer_id: string | null;
  created_at: string;
};

export type ContentJobRow = {
  id: string;
  job_type: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  payload: unknown;
  result: unknown;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type QuestionOptionRow = {
  id: string;
  question_id: string;
  label: OptionLabel;
  option_text: string;
  rationale_md: string | null;
};

export type AttemptRow = {
  id: string;
  user_id: string;
  session_id: string | null;
  question_id: string;
  chosen_option: OptionLabel | null;
  is_correct: boolean;
  response_time_seconds: number | null;
  confidence_rating: number | null;
  answered_at: string;
};

export type PracticeSessionRow = {
  id: string;
  user_id: string;
  mode: SessionMode;
  topic_filter: string[] | null;
  difficulty_filter: string[] | null;
  total_questions: number;
  time_limit_seconds: number | null;
  question_ids: string[];
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

export type BookmarkRow = {
  user_id: string;
  question_id: string;
  created_at: string;
};

export type UserQuestionNoteRow = {
  id: string;
  user_id: string;
  question_id: string;
  note_md: string;
  created_at: string;
  updated_at: string;
};

export type StripeEventRow = {
  id: string;
  type: string;
  received_at: string;
};

export type QuestionReportRow = {
  id: string;
  user_id: string | null;
  question_id: string;
  report_type: ReportType;
  message: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type TableShape<Row extends Record<string, unknown>, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required>>;
  Update: Partial<Row>;
  Relationships: [];
};

type EmptyMap = Record<string, never>;

export type Database = {
  // Marker consumed by @supabase/postgrest-js to select its query parser behavior.
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: TableShape<ProfileRow, "id" | "email">;
      curriculum_versions: TableShape<CurriculumVersionRow, "year">;
      topics: TableShape<
        TopicRow,
        "code" | "name" | "exam_weight_min" | "exam_weight_max" | "display_order"
      >;
      questions: TableShape<
        QuestionRow,
        | "curriculum_version_id"
        | "topic_code"
        | "difficulty"
        | "stem"
        | "correct_option"
        | "explanation_md"
      >;
      question_options: TableShape<QuestionOptionRow, "question_id" | "label" | "option_text">;
      attempts: TableShape<AttemptRow, "user_id" | "question_id" | "is_correct">;
      practice_sessions: TableShape<PracticeSessionRow, "user_id" | "mode" | "total_questions">;
      bookmarks: TableShape<BookmarkRow, "user_id" | "question_id">;
      user_question_notes: TableShape<UserQuestionNoteRow, "user_id" | "question_id" | "note_md">;
      question_reports: TableShape<QuestionReportRow, "question_id" | "report_type">;
      question_audits: TableShape<QuestionAuditRow, "question_id" | "audit_type" | "result">;
      content_jobs: TableShape<ContentJobRow, "job_type">;
      stripe_events: TableShape<StripeEventRow, "id" | "type">;
    };
    Views: EmptyMap;
    Functions: EmptyMap;
    Enums: EmptyMap;
    CompositeTypes: EmptyMap;
  };
};
