import "server-only";

import {
  runDeterministicValidators,
  type ValidationResult,
} from "@charterbank/ai-content/validators";
import type { QuestionStatus, ReportStatus } from "@charterbank/db";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface AdminQuestionListItem {
  id: string;
  topic_code: string;
  difficulty: string;
  status: string;
  quality_score: number | null;
  ai_confidence: number | null;
  ip_similarity_score: number | null;
  created_at: string;
}

export interface AdminQuestionDetail {
  question: {
    id: string;
    topic_code: string;
    objective_code: string | null;
    difficulty: string;
    question_type: string | null;
    stem: string;
    vignette: string | null;
    correct_option: "A" | "B" | "C";
    explanation_md: string;
    formula_md: string | null;
    common_trap_md: string | null;
    status: string;
    quality_score: number | null;
    ai_confidence: number | null;
    ip_similarity_score: number | null;
    generated_by_model: string | null;
    validated_by_model: string | null;
    prompt_version: string | null;
  };
  options: { label: "A" | "B" | "C"; option_text: string; rationale_md: string | null }[];
  audits: {
    id: string;
    audit_type: string;
    result: string;
    findings: unknown;
    model: string | null;
    created_at: string;
  }[];
  reports: {
    id: string;
    report_type: string;
    message: string | null;
    status: string;
    admin_notes: string | null;
    created_at: string;
  }[];
}

export async function listAdminQuestions(filters: {
  status?: QuestionStatus;
  topic?: string;
}): Promise<AdminQuestionListItem[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];

  let query = admin
    .from("questions")
    .select(
      "id, topic_code, difficulty, status, quality_score, ai_confidence, ip_similarity_score, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.topic) query = query.eq("topic_code", filters.topic);

  const { data } = await query;
  return data ?? [];
}

export async function getAdminQuestion(id: string): Promise<AdminQuestionDetail | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: question } = await admin
    .from("questions")
    .select(
      "id, topic_code, objective_code, difficulty, question_type, stem, vignette, correct_option, explanation_md, formula_md, common_trap_md, status, quality_score, ai_confidence, ip_similarity_score, generated_by_model, validated_by_model, prompt_version",
    )
    .eq("id", id)
    .single();
  if (!question) return null;

  const [{ data: options }, { data: audits }, { data: reports }] = await Promise.all([
    admin
      .from("question_options")
      .select("label, option_text, rationale_md")
      .eq("question_id", id)
      .order("label"),
    admin
      .from("question_audits")
      .select("id, audit_type, result, findings, model, created_at")
      .eq("question_id", id)
      .order("created_at"),
    admin
      .from("question_reports")
      .select("id, report_type, message, status, admin_notes, created_at")
      .eq("question_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    question,
    options: options ?? [],
    audits: audits ?? [],
    reports: reports ?? [],
  };
}

export async function setQuestionStatus(id: string, status: QuestionStatus): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const patch: { status: QuestionStatus; published_at?: string | null } = { status };
  if (status === "published") patch.published_at = new Date().toISOString();
  const { error } = await admin.from("questions").update(patch).eq("id", id);
  return !error;
}

export async function triageReport(
  id: string,
  status: ReportStatus,
  adminNotes: string,
): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (!admin) return false;
  const { error } = await admin
    .from("question_reports")
    .update({ status, admin_notes: adminNotes.trim() || null })
    .eq("id", id);
  return !error;
}

export interface AdminReportItem {
  id: string;
  question_id: string;
  report_type: string;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export async function listAdminReports(status?: ReportStatus): Promise<AdminReportItem[]> {
  const admin = createSupabaseAdminClient();
  if (!admin) return [];
  let query = admin
    .from("question_reports")
    .select("id, question_id, report_type, message, status, admin_notes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return data ?? [];
}

export interface RerunAuditResult {
  ok: boolean;
  issues: string[];
}

/**
 * Re-run the deterministic content checks (the same ones the pipeline gate uses)
 * on a stored question, record a fresh audit, and quarantine it if it now fails.
 */
export async function rerunDeterministicAudit(id: string): Promise<RerunAuditResult | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;
  const detail = await getAdminQuestion(id);
  if (!detail) return null;

  const result: ValidationResult = runDeterministicValidators({
    topic_code: detail.question.topic_code,
    difficulty: detail.question.difficulty,
    stem: detail.question.stem,
    options: detail.options.map((o) => ({
      label: o.label,
      text: o.option_text,
      rationale: o.rationale_md,
    })),
    correct_option: detail.question.correct_option,
    explanation_md: detail.question.explanation_md,
    vignette: detail.question.vignette,
    formula_md: detail.question.formula_md,
    common_trap_md: detail.question.common_trap_md,
    question_type: detail.question.question_type ?? undefined,
  });

  await admin.from("question_audits").insert({
    question_id: id,
    audit_type: "math_check",
    result: result.ok ? "pass" : "fail",
    findings: { issues: result.issues },
    model: "deterministic-rerun",
  });

  if (!result.ok) {
    await setQuestionStatus(id, "quarantined");
  }

  return { ok: result.ok, issues: result.issues.map((i) => `${i.code}: ${i.message}`) };
}
