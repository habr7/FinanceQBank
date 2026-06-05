import Link from "next/link";
import { redirect } from "next/navigation";
import { MOCK_PRESETS, type MockType } from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";
import { getUserBilling } from "@/lib/data/billing";
import { startMockAction } from "./actions";

export const dynamic = "force-dynamic";

const MOCKS: { type: MockType; name: string; blurb: string }[] = [
  { type: "mini", name: "Mini mock", blurb: "30 questions, weighted by topic — a quick check-in." },
  { type: "half", name: "Half mock", blurb: "90 questions, 135 minutes — one exam session." },
  { type: "full", name: "Full mock", blurb: "180 questions, 270 minutes across two sessions." },
];

export default async function MockStartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;
  const billing = await getUserBilling();
  const paid = billing?.entitlement.unlimited ?? false;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Mock exams</h1>
        <p className="text-sm text-muted">
          Timed, exam-weighted practice. No explanations during the mock — results and a per-topic
          breakdown appear at the end.
        </p>
      </header>

      {error === "no-questions" ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted">
          Not enough published questions to build a mock yet. Check back once more content is
          published.
        </p>
      ) : null}

      {!paid ? (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4 text-sm">
          <p className="font-medium">Mock exams are a paid feature.</p>
          <p className="text-muted">Upgrade for unlimited practice and full timed mocks.</p>
          <div>
            <Button asChild size="sm">
              <Link href="/upgrade">Upgrade</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4">
        {MOCKS.map((mock) => {
          const preset = MOCK_PRESETS[mock.type];
          return (
            <article
              key={mock.type}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-5"
            >
              <div>
                <h2 className="font-semibold">{mock.name}</h2>
                <p className="text-sm text-muted">{mock.blurb}</p>
                <p className="mt-1 text-xs text-muted">
                  {preset.questions} questions · {Math.round(preset.timeLimitSeconds / 60)} min
                </p>
              </div>
              <form action={startMockAction}>
                <input type="hidden" name="type" value={mock.type} />
                <Button type="submit" disabled={!paid}>
                  Start
                </Button>
              </form>
            </article>
          );
        })}
      </section>

      <Link href="/dashboard" className="text-sm text-muted underline">
        Back to dashboard
      </Link>
    </main>
  );
}
