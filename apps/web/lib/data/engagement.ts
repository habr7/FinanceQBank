import "server-only";

import type { ReportType } from "@charterbank/db";

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

/** Toggle a bookmark for the current user; returns the new bookmarked state. */
export async function toggleBookmark(questionId: string): Promise<boolean> {
  const ctx = await requireUser();
  if (!ctx) return false;
  const { supabase, userId } = ctx;

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("question_id")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarks").delete().eq("user_id", userId).eq("question_id", questionId);
    return false;
  }
  await supabase.from("bookmarks").insert({ user_id: userId, question_id: questionId });
  return true;
}

/** Create or update the current user's note on a question. */
export async function saveNote(questionId: string, noteMd: string): Promise<boolean> {
  const ctx = await requireUser();
  if (!ctx) return false;
  const { supabase, userId } = ctx;

  const { error } = await supabase
    .from("user_question_notes")
    .upsert(
      { user_id: userId, question_id: questionId, note_md: noteMd },
      { onConflict: "user_id,question_id" },
    );
  return !error;
}

/** File an issue report against a question. */
export async function reportIssue(
  questionId: string,
  reportType: ReportType,
  message: string,
): Promise<boolean> {
  const ctx = await requireUser();
  if (!ctx) return false;
  const { supabase, userId } = ctx;

  const { error } = await supabase.from("question_reports").insert({
    user_id: userId,
    question_id: questionId,
    report_type: reportType,
    message: message.trim() || null,
  });
  return !error;
}
