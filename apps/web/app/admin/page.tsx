import Link from "next/link";
import type { QuestionStatus } from "@charterbank/db";

import { cn } from "@/lib/utils";
import { listAdminQuestions } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const STATUSES: QuestionStatus[] = [
  "draft",
  "ai_validated",
  "human_review",
  "published",
  "quarantined",
  "retired",
];

function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}`;
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; topic?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUSES.includes(status as QuestionStatus)
    ? (status as QuestionStatus)
    : undefined;
  const items = await listAdminQuestions({ status: activeStatus });

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Questions</h1>

      <nav className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin"
          className={cn(
            "rounded-full border border-border px-3 py-1",
            !activeStatus && "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
          )}
        >
          all
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={cn(
              "rounded-full border border-border px-3 py-1",
              activeStatus === s &&
                "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900",
            )}
          >
            {s}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="text-sm text-muted">
          No questions found. Generate a batch with the content pipeline (
          <code>pnpm content:generate</code>) to populate this list.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr className="border-b border-border">
              <th className="py-2">Topic</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Quality</th>
              <th>IP</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-b border-border">
                <td className="py-2 font-medium">{q.topic_code}</td>
                <td className="capitalize">{q.difficulty}</td>
                <td>{q.status}</td>
                <td>{pct(q.quality_score)}</td>
                <td>{q.ip_similarity_score ?? "—"}</td>
                <td className="text-right">
                  <Link href={`/admin/questions/${q.id}`} className="underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
