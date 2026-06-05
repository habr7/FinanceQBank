import Link from "next/link";
import { redirect } from "next/navigation";
import {
  APP_NAME,
  LEGAL_DISCLAIMER,
  TOPICS,
  WEAK_TOPIC_THRESHOLD,
  suggestNextSession,
} from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardStats, getRetentionSummary } from "@/lib/data/dashboard";
import { getUserBilling } from "@/lib/data/billing";

export const dynamic = "force-dynamic";

const TOPIC_NAME = new Map<string, string>(TOPICS.map((t) => [t.code, t.name]));

function formatPct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
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

  const { checkout } = await searchParams;
  const stats = await getDashboardStats(TOPICS.map((t) => t.code));
  const billing = await getUserBilling();
  const retention = await getRetentionSummary();
  const suggestion = suggestNextSession({
    dueCount: retention.dueCount,
    weakTopics: (stats?.weakTopics ?? []).map((c) => TOPIC_NAME.get(c) ?? c),
    totalAnswered: stats?.totalAnswered ?? 0,
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{APP_NAME} dashboard</h1>
          <p className="text-sm text-muted">
            Signed in as {profile?.full_name ?? profile?.email ?? user.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.role === "admin" || profile?.role === "reviewer" ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin">Content Studio</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="outline">
            <Link href="/mock">Mock exam</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/practice">Start practice</Link>
          </Button>
          <form action="/auth/signout" method="post">
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Overall accuracy" value={formatPct(stats?.overallAccuracy ?? null)} />
        <Stat label="Questions answered" value={String(stats?.totalAnswered ?? 0)} />
        <Stat
          label="Avg. time / question"
          value={
            stats?.averageResponseSeconds == null
              ? "—"
              : `${Math.round(stats.averageResponseSeconds)}s`
          }
        />
        <Stat label="Plan" value={profile?.subscription_status ?? "free"} capitalize />
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 text-sm">
        <div className="flex items-center gap-6">
          <span>
            <span className="text-muted">Suggested next:</span>{" "}
            <span className="font-medium">{suggestion.label}</span>
          </span>
          <span className="text-xs text-muted">
            {retention.dueCount} due · {retention.streak}-day streak
          </span>
        </div>
        <div className="flex gap-2">
          {retention.dueCount > 0 ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/review">Review {retention.dueCount} due</Link>
            </Button>
          ) : null}
          <Button asChild size="sm">
            <Link href={suggestion.href}>Go</Link>
          </Button>
        </div>
      </section>

      {checkout === "success" ? (
        <p className="rounded-md border border-border p-4 text-sm">
          Thanks for subscribing — your plan is active. It may take a moment to reflect here.
        </p>
      ) : null}

      {billing ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 text-sm">
          {billing.entitlement.unlimited ? (
            <>
              <span>You have unlimited access. Manage your subscription anytime.</span>
              <form action="/api/stripe/portal" method="post">
                <Button variant="outline" size="sm" type="submit">
                  Manage billing
                </Button>
              </form>
            </>
          ) : (
            <>
              <span>
                Free plan: <strong>{billing.entitlement.remaining}</strong> of{" "}
                {billing.entitlement.limit} questions remaining.
              </span>
              <Button asChild size="sm">
                <Link href="/upgrade">Upgrade for unlimited</Link>
              </Button>
            </>
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Accuracy by topic</h2>
          {stats && stats.weakTopics.length > 0 ? (
            <p className="text-xs text-muted">
              Weak topics (≤ {WEAK_TOPIC_THRESHOLD}%):{" "}
              {stats.weakTopics.map((c) => TOPIC_NAME.get(c) ?? c).join(", ")}
            </p>
          ) : null}
        </div>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {TOPICS.map((topic) => {
            const row = stats?.byTopic.find((t) => t.topicCode === topic.code);
            const weak = stats?.weakTopics.includes(topic.code) ?? false;
            return (
              <li
                key={topic.code}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span>{topic.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted">{row?.answered ?? 0} answered</span>
                  <span
                    className={cn(
                      "w-10 text-right font-medium",
                      weak && "text-red-600 dark:text-red-400",
                    )}
                  >
                    {formatPct(row?.accuracy ?? null)}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        {(stats?.totalAnswered ?? 0) === 0 ? (
          <p className="text-xs text-muted">
            Answer your first questions to see per-topic accuracy here.
          </p>
        ) : null}
      </section>

      <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted">
        {LEGAL_DISCLAIMER}
      </footer>
    </main>
  );
}

function Stat({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 font-semibold", capitalize && "capitalize")}>{value}</p>
    </div>
  );
}
