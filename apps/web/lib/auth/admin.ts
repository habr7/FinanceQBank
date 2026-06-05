import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminContext {
  userId: string;
  role: "admin" | "reviewer";
}

/**
 * Authorize an admin/reviewer for the current request. Redirects students to the
 * dashboard and unauthenticated users to login. Privileged admin data operations
 * use the service-role client only AFTER this check passes.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "reviewer") {
    redirect("/dashboard");
  }

  return { userId: user.id, role: profile.role };
}

/** Non-redirecting variant for server actions: returns null when not an admin. */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "reviewer") return null;
  return { userId: user.id, role: profile.role };
}
