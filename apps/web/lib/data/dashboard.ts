import "server-only";

import { computeDashboardStats, type AttemptLike, type DashboardStats } from "@charterbank/shared";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Per-user dashboard stats. Attempts and the questions they reference are read
 * through the user's RLS context, then joined + aggregated in memory (no embedded
 * join, to stay compatible with the hand-written DB types). Returns null when
 * Supabase is unconfigured or there is no signed-in user.
 */
export async function getDashboardStats(topicOrder: string[]): Promise<DashboardStats | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: attempts } = await supabase
    .from("attempts")
    .select("question_id, is_correct, response_time_seconds")
    .eq("user_id", user.id);

  const rows = attempts ?? [];
  const questionIds = [...new Set(rows.map((r) => r.question_id))];

  const topicByQuestion = new Map<string, string>();
  if (questionIds.length > 0) {
    const { data: questions } = await supabase
      .from("questions")
      .select("id, topic_code")
      .in("id", questionIds);
    for (const q of questions ?? []) topicByQuestion.set(q.id, q.topic_code);
  }

  const attemptLikes: AttemptLike[] = rows.map((row) => ({
    topicCode: topicByQuestion.get(row.question_id) ?? "UNKNOWN",
    isCorrect: row.is_correct,
    responseTimeSeconds: row.response_time_seconds,
  }));

  return computeDashboardStats(attemptLikes, topicOrder);
}
