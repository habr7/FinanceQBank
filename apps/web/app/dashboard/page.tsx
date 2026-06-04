import { redirect } from "next/navigation";
import { APP_NAME, LEGAL_DISCLAIMER } from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Reads cookies/auth, so it must never be statically prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, subscription_status")
    .eq("id", user.id)
    .single();

  const { data: topics } = await supabase
    .from("topics")
    .select("code, name, exam_weight_min, exam_weight_max")
    .order("display_order", { ascending: true });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{APP_NAME} dashboard</h1>
          <p className="text-sm text-muted">
            Signed in as {profile?.full_name ?? profile?.email ?? user.email}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted">Plan</p>
          <p className="mt-1 font-semibold capitalize">{profile?.subscription_status ?? "free"}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted">Role</p>
          <p className="mt-1 font-semibold capitalize">{profile?.role ?? "student"}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted">Topics available</p>
          <p className="mt-1 font-semibold">{topics?.length ?? 0}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Topics</h2>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {(topics ?? []).map((topic) => (
            <li key={topic.code} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{topic.name}</span>
              <span className="text-muted">
                {topic.exam_weight_min}–{topic.exam_weight_max}%
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          Practice, mocks, and per-topic analytics arrive in the next phases.
        </p>
      </section>

      <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted">
        {LEGAL_DISCLAIMER}
      </footer>
    </main>
  );
}
