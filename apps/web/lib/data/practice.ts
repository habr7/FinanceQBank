import "server-only";

import {
  DEFAULT_EASE_FACTOR,
  getEntitlement,
  nextReview,
  selectPracticeQuestions,
  type Difficulty,
  type OptionLabel,
  type PracticeCandidate,
} from "@charterbank/shared";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

/** Update the spaced-repetition card for a question after it's answered. */
async function recordReview(
  supabase: ServerClient,
  userId: string,
  questionId: string,
  correct: boolean,
): Promise<void> {
  const { data: card } = await supabase
    .from("spaced_repetition_cards")
    .select("ease_factor, interval_days, repetitions")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();

  const schedule = nextReview(
    {
      easeFactor: card?.ease_factor ?? DEFAULT_EASE_FACTOR,
      intervalDays: card?.interval_days ?? 0,
      repetitions: card?.repetitions ?? 0,
    },
    correct,
  );

  await supabase.from("spaced_repetition_cards").upsert(
    {
      user_id: userId,
      question_id: questionId,
      ease_factor: schedule.easeFactor,
      interval_days: schedule.intervalDays,
      repetitions: schedule.repetitions,
      due_at: new Date(Date.now() + schedule.dueInDays * 86_400_000).toISOString(),
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" },
  );
}

export type StartReviewResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "empty" | "unavailable" };

/** Build a review session from spaced-repetition cards that are due now. */
export async function startReviewSession(): Promise<StartReviewResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "unavailable" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unavailable" };

  const { data: due } = await supabase
    .from("spaced_repetition_cards")
    .select("question_id")
    .eq("user_id", user.id)
    .lte("due_at", new Date().toISOString())
    .limit(50);

  const dueIds = (due ?? []).map((c) => c.question_id);
  if (dueIds.length === 0) return { ok: false, reason: "empty" };

  // Only review questions that are still published.
  const { data: published } = await supabase
    .from("questions")
    .select("id")
    .in("id", dueIds)
    .eq("status", "published");
  const ids = (published ?? []).map((q) => q.id);
  if (ids.length === 0) return { ok: false, reason: "empty" };

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      mode: "review_errors",
      total_questions: ids.length,
      question_ids: ids,
    })
    .select("id")
    .single();
  if (error || !session) return { ok: false, reason: "unavailable" };
  return { ok: true, sessionId: session.id };
}

export interface PracticeOption {
  label: OptionLabel;
  text: string;
}

export interface PracticeQuestion {
  id: string;
  topicCode: string;
  difficulty: Difficulty;
  stem: string;
  vignette: string | null;
  options: PracticeOption[];
}

export interface AnsweredState {
  chosenOption: OptionLabel | null;
  isCorrect: boolean;
}

export interface PracticeRunnerData {
  sessionId: string;
  questions: PracticeQuestion[];
  answered: Record<string, AnsweredState>;
}

export interface SubmitAnswerResult {
  isCorrect: boolean;
  correctOption: OptionLabel;
  explanationMd: string;
  rationales: { label: OptionLabel; text: string; rationaleMd: string | null }[];
}

const LABEL_ORDER: Record<OptionLabel, number> = { A: 0, B: 1, C: 2 };

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export type StartPracticeResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "paywall" | "no-questions" | "unavailable" };

/**
 * Create a practice session and persist its ordered question list. Selects from
 * published questions only, prefers questions the user has not answered, applies
 * the standard difficulty mix, and enforces the free-tier entitlement: free users
 * are capped at the remaining free questions and blocked (paywall) once exhausted.
 */
export async function startPracticeSession(input: {
  topics?: string[];
  count: number;
}): Promise<StartPracticeResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unavailable" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  let query = supabase.from("questions").select("id, difficulty").eq("status", "published");
  if (input.topics && input.topics.length > 0) {
    query = query.in("topic_code", input.topics);
  }
  const { data: published } = await query;
  const allCandidates: PracticeCandidate[] = (published ?? []).map((q) => ({
    id: q.id,
    difficulty: q.difficulty,
  }));
  if (allCandidates.length === 0) return { ok: false, reason: "no-questions" };

  const { data: priorAttempts } = await supabase
    .from("attempts")
    .select("question_id")
    .eq("user_id", user.id);
  const answeredIds = new Set((priorAttempts ?? []).map((a) => a.question_id));

  const entitlement = getEntitlement(profile?.subscription_status ?? "free", answeredIds.size);
  if (!entitlement.canAnswer) return { ok: false, reason: "paywall" };

  const cap = entitlement.unlimited
    ? input.count
    : Math.min(input.count, entitlement.remaining ?? 0);

  const fresh = allCandidates.filter((c) => !answeredIds.has(c.id));
  const pool = fresh.length > 0 ? fresh : allCandidates;
  const chosen = selectPracticeQuestions(shuffle(pool), cap);
  if (chosen.length === 0) return { ok: false, reason: "no-questions" };

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      mode: "practice",
      topic_filter: input.topics && input.topics.length > 0 ? input.topics : null,
      total_questions: chosen.length,
      question_ids: chosen,
    })
    .select("id")
    .single();

  if (error || !session) return { ok: false, reason: "unavailable" };
  return { ok: true, sessionId: session.id };
}

/** Load a session and its questions (no answer key / explanation pre-submit). */
export async function getPracticeRunnerData(sessionId: string): Promise<PracticeRunnerData | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS already restricts to the owner; the explicit user_id filter is defense-in-depth.
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, question_ids")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) return null;

  const ids = session.question_ids;
  const [{ data: questionRows }, { data: optionRows }, { data: attemptRows }] = await Promise.all([
    supabase.from("questions").select("id, topic_code, difficulty, stem, vignette").in("id", ids),
    supabase
      .from("question_options")
      .select("question_id, label, option_text")
      .in("question_id", ids),
    supabase
      .from("attempts")
      .select("question_id, chosen_option, is_correct")
      .eq("session_id", sessionId),
  ]);

  const optionsByQuestion = new Map<string, PracticeOption[]>();
  for (const opt of optionRows ?? []) {
    const list = optionsByQuestion.get(opt.question_id) ?? [];
    list.push({ label: opt.label, text: opt.option_text });
    optionsByQuestion.set(opt.question_id, list);
  }
  for (const list of optionsByQuestion.values()) {
    list.sort((a, b) => LABEL_ORDER[a.label] - LABEL_ORDER[b.label]);
  }

  const byId = new Map((questionRows ?? []).map((q) => [q.id, q]));
  const questions: PracticeQuestion[] = ids.flatMap((id) => {
    const q = byId.get(id);
    if (!q) return [];
    return [
      {
        id: q.id,
        topicCode: q.topic_code,
        difficulty: q.difficulty,
        stem: q.stem,
        vignette: q.vignette,
        options: optionsByQuestion.get(id) ?? [],
      },
    ];
  });

  const answered: Record<string, AnsweredState> = {};
  for (const a of attemptRows ?? []) {
    answered[a.question_id] = { chosenOption: a.chosen_option, isCorrect: a.is_correct };
  }

  return { sessionId, questions, answered };
}

/**
 * Record an answer and reveal the result. The attempt is inserted under the
 * user's RLS context (a DB trigger computes is_correct from the answer key the
 * client cannot see); the answer key + explanation are read back via the
 * service-role client only AFTER submission.
 */
export async function submitAnswer(input: {
  sessionId: string;
  questionId: string;
  chosenOption: OptionLabel;
  responseTimeSeconds?: number;
}): Promise<SubmitAnswerResult | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // The question must belong to a session owned by this user (RLS-scoped read).
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("question_ids")
    .eq("id", input.sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session || !session.question_ids.includes(input.questionId)) return null;

  // Re-check entitlement at answer time so the per-session cap can't be bypassed
  // (e.g. by replaying an old session id after exhausting the free allowance).
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();
  const { data: prior } = await supabase
    .from("attempts")
    .select("question_id")
    .eq("user_id", user.id);
  const answeredIds = new Set((prior ?? []).map((a) => a.question_id));
  const entitlement = getEntitlement(profile?.subscription_status ?? "free", answeredIds.size);
  if (!entitlement.canAnswer && !answeredIds.has(input.questionId)) return null;

  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      session_id: input.sessionId,
      question_id: input.questionId,
      chosen_option: input.chosenOption,
      is_correct: false, // overridden server-side by set_attempt_is_correct
      response_time_seconds: input.responseTimeSeconds ?? null,
    })
    .select("is_correct")
    .single();
  if (error || !attempt) return null;

  // Update spaced repetition: wrong answers re-enter the review queue immediately.
  await recordReview(supabase, user.id, input.questionId, attempt.is_correct);

  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data: question } = await admin
    .from("questions")
    .select("correct_option, explanation_md")
    .eq("id", input.questionId)
    .eq("status", "published")
    .single();
  if (!question) return null;

  const { data: options } = await admin
    .from("question_options")
    .select("label, option_text, rationale_md")
    .eq("question_id", input.questionId);

  const rationales = (options ?? [])
    .map((o) => ({ label: o.label, text: o.option_text, rationaleMd: o.rationale_md }))
    .sort((a, b) => LABEL_ORDER[a.label] - LABEL_ORDER[b.label]);

  return {
    isCorrect: attempt.is_correct,
    correctOption: question.correct_option,
    explanationMd: question.explanation_md,
    rationales,
  };
}
