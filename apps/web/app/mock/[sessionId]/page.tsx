import Link from "next/link";
import { redirect } from "next/navigation";
import { TOPICS } from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMockData } from "@/lib/data/mock";
import { MockRunner } from "@/components/mock/mock-runner";

export const dynamic = "force-dynamic";

const TOPIC_NAME = new Map<string, string>(TOPICS.map((t) => [t.code, t.name]));

export default async function MockSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { sessionId } = await params;
  const data = await getMockData(sessionId);
  if (!data) redirect("/mock");

  if (data.state === "active") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-8">
        <h1 className="text-xl font-bold">Mock exam</h1>
        <MockRunner
          sessionId={data.sessionId}
          mode={data.mode}
          timeLimitSeconds={data.timeLimitSeconds}
          startedAt={data.startedAt}
          questions={data.questions}
        />
      </main>
    );
  }

  const { result } = data;
  const score = result.scorePct === null ? "—" : `${Math.round(result.scorePct)}%`;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Mock results</h1>
        <p className="text-sm text-muted">
          {result.correct} of {result.total} correct · {result.answered} answered
        </p>
      </header>

      <div className="rounded-lg border border-border p-6">
        <p className="text-xs text-muted">Overall score</p>
        <p className="mt-1 text-4xl font-bold">{score}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Breakdown by topic</h2>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {result.byTopic.map((t) => (
            <li key={t.topicCode} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{TOPIC_NAME.get(t.topicCode) ?? t.topicCode}</span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {t.correct}/{t.total}
                </span>
                <span
                  className={cn(
                    "w-10 text-right font-medium",
                    (t.accuracy ?? 0) < 70 && "text-red-600 dark:text-red-400",
                  )}
                >
                  {t.accuracy === null ? "—" : `${Math.round(t.accuracy)}%`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/mock">New mock</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
