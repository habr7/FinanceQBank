import "server-only";

import {
  TOPIC_CODES,
  computeDashboardStats,
  mockQuestionPlan,
  mockSessionMode,
  type AttemptLike,
  type MockType,
  type OptionLabel,
} from "@charterbank/shared";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBilling } from "@/lib/data/billing";

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export type StartMockResult =
  | { ok: true; sessionId: string }
  | { ok: false; reason: "paywall" | "no-questions" | "unavailable" };

/** Create a timed mock weighted by exam topic allocation. Mocks require a paid plan. */
export async function startMock(type: MockType): Promise<StartMockResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, reason: "unavailable" };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unavailable" };

  const billing = await getUserBilling();
  if (!billing?.entitlement.unlimited) return { ok: false, reason: "paywall" };

  const plan = mockQuestionPlan(type);
  const { data: published } = await supabase
    .from("questions")
    .select("id, topic_code")
    .eq("status", "published");

  const byTopic = new Map<string, string[]>();
  for (const q of published ?? []) {
    const list = byTopic.get(q.topic_code) ?? [];
    list.push(q.id);
    byTopic.set(q.topic_code, list);
  }

  const chosen: string[] = [];
  for (const code of TOPIC_CODES) {
    const want = plan.allocation[code];
    chosen.push(...shuffle(byTopic.get(code) ?? []).slice(0, want));
  }
  if (chosen.length === 0) return { ok: false, reason: "no-questions" };

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      user_id: user.id,
      mode: mockSessionMode(type),
      total_questions: chosen.length,
      time_limit_seconds: plan.timeLimitSeconds,
      question_ids: shuffle(chosen),
    })
    .select("id")
    .single();
  if (error || !session) return { ok: false, reason: "unavailable" };
  return { ok: true, sessionId: session.id };
}

export interface MockQuestion {
  id: string;
  topicCode: string;
  difficulty: string;
  stem: string;
  vignette: string | null;
  options: { label: OptionLabel; text: string }[];
}

export interface MockTopicResult {
  topicCode: string;
  total: number;
  correct: number;
  accuracy: number | null;
}

export interface MockResult {
  total: number;
  answered: number;
  correct: number;
  scorePct: number | null;
  byTopic: MockTopicResult[];
}

export type MockData =
  | {
      state: "active";
      sessionId: string;
      mode: string;
      timeLimitSeconds: number;
      startedAt: string;
      questions: MockQuestion[];
    }
  | { state: "completed"; sessionId: string; mode: string; completedAt: string; result: MockResult }
  | null;

const LABEL_ORDER: Record<OptionLabel, number> = { A: 0, B: 1, C: 2 };

export async function getMockData(sessionId: string): Promise<MockData> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, mode, time_limit_seconds, started_at, completed_at, question_ids")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session) return null;

  const ids = session.question_ids;

  if (session.completed_at) {
    const result = await computeResult(supabase, ids, sessionId);
    return {
      state: "completed",
      sessionId,
      mode: session.mode,
      completedAt: session.completed_at,
      result,
    };
  }

  // Mocks are a paid feature; re-check entitlement so a lapsed subscriber can't
  // keep accessing an in-progress mock's questions after cancelling.
  const billing = await getUserBilling();
  if (!billing?.entitlement.unlimited) return null;

  const [{ data: qrows }, { data: orows }] = await Promise.all([
    supabase.from("questions").select("id, topic_code, difficulty, stem, vignette").in("id", ids),
    supabase
      .from("question_options")
      .select("question_id, label, option_text")
      .in("question_id", ids),
  ]);

  const optionsByQuestion = new Map<string, { label: OptionLabel; text: string }[]>();
  for (const o of orows ?? []) {
    const list = optionsByQuestion.get(o.question_id) ?? [];
    list.push({ label: o.label, text: o.option_text });
    optionsByQuestion.set(o.question_id, list);
  }
  for (const list of optionsByQuestion.values()) {
    list.sort((a, b) => LABEL_ORDER[a.label] - LABEL_ORDER[b.label]);
  }

  const byId = new Map((qrows ?? []).map((q) => [q.id, q]));
  const questions: MockQuestion[] = ids.flatMap((id) => {
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

  return {
    state: "active",
    sessionId,
    mode: session.mode,
    timeLimitSeconds: session.time_limit_seconds ?? 0,
    startedAt: session.started_at,
    questions,
  };
}

async function computeResult(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  questionIds: string[],
  sessionId: string,
): Promise<MockResult> {
  const [{ data: attempts }, { data: qrows }] = await Promise.all([
    supabase.from("attempts").select("question_id, is_correct").eq("session_id", sessionId),
    supabase.from("questions").select("id, topic_code").in("id", questionIds),
  ]);

  const correctById = new Map((attempts ?? []).map((a) => [a.question_id, a.is_correct]));
  const topicById = new Map((qrows ?? []).map((q) => [q.id, q.topic_code]));

  const items: AttemptLike[] = questionIds.map((id) => ({
    topicCode: topicById.get(id) ?? "UNKNOWN",
    isCorrect: correctById.get(id) ?? false,
  }));
  const stats = computeDashboardStats(items, TOPIC_CODES);

  return {
    total: questionIds.length,
    answered: attempts?.length ?? 0,
    correct: stats.totalCorrect,
    scorePct: stats.overallAccuracy,
    byTopic: stats.byTopic
      .filter((t) => t.answered > 0)
      .map((t) => ({
        topicCode: t.topicCode,
        total: t.answered,
        correct: t.correct,
        accuracy: t.accuracy,
      })),
  };
}

/** Submit all mock answers at once, grade (DB trigger), and finalize the session. */
export async function submitMock(
  sessionId: string,
  answers: { questionId: string; chosenOption: OptionLabel }[],
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("question_ids, completed_at")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();
  if (!session || session.completed_at) return false;

  const allowed = new Set(session.question_ids);
  const valid = answers.filter(
    (a) => allowed.has(a.questionId) && ["A", "B", "C"].includes(a.chosenOption),
  );
  if (valid.length > 0) {
    await supabase.from("attempts").insert(
      valid.map((a) => ({
        user_id: user.id,
        session_id: sessionId,
        question_id: a.questionId,
        chosen_option: a.chosenOption,
        is_correct: false, // computed by the set_attempt_is_correct trigger
      })),
    );
  }

  const { error } = await supabase
    .from("practice_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);
  return !error;
}
