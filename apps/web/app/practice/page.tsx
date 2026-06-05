import Link from "next/link";
import { redirect } from "next/navigation";
import { TOPICS } from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";
import { getUserBilling } from "@/lib/data/billing";
import { startPracticeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PracticeStartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;
  const billing = await getUserBilling();
  const entitlement = billing?.entitlement;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Start a practice session</h1>
        <p className="text-sm text-muted">
          Choose topics (or leave all unchecked for a mixed set) and how many questions to attempt.
        </p>
      </header>

      {error === "no-questions" ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted">
          No published questions match that selection yet. Try a different topic or check back once
          more content is published.
        </p>
      ) : null}

      {error === "no-reviews" ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted">
          Nothing is due for review right now. Answer more questions and they&apos;ll return on a
          spaced schedule.
        </p>
      ) : null}

      {error === "paywall" || entitlement?.canAnswer === false ? (
        <div className="flex flex-col gap-3 rounded-md border border-border p-4 text-sm">
          <p className="font-medium">You&apos;ve used all {entitlement?.limit} free questions.</p>
          <p className="text-muted">
            Unlock unlimited practice, full mocks, and smart review to keep going.
          </p>
          <div>
            <Button asChild size="sm">
              <Link href="/upgrade">Upgrade</Link>
            </Button>
          </div>
        </div>
      ) : entitlement && !entitlement.unlimited ? (
        <p className="text-sm text-muted">
          Free plan: {entitlement.remaining} of {entitlement.limit} questions remaining.
        </p>
      ) : null}

      <form action={startPracticeAction} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Topics</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {TOPICS.map((topic) => (
              <label key={topic.code} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="topics" value={topic.code} className="h-4 w-4" />
                {topic.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="count" className="text-sm font-medium">
            Number of questions
          </label>
          <input
            id="count"
            name="count"
            type="number"
            min={1}
            max={50}
            defaultValue={10}
            className="h-10 w-32 rounded-md border border-border bg-transparent px-3 text-sm"
          />
        </div>

        <div>
          <Button type="submit" size="lg">
            Start practice
          </Button>
        </div>
      </form>
    </main>
  );
}
