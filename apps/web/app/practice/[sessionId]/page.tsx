import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";
import { getPracticeRunnerData } from "@/lib/data/practice";
import { PracticeRunner } from "@/components/practice/practice-runner";

export const dynamic = "force-dynamic";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { sessionId } = await params;
  const data = await getPracticeRunnerData(sessionId);
  if (!data) redirect("/practice");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Practice</h1>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Exit to dashboard</Link>
        </Button>
      </header>

      <PracticeRunner
        sessionId={data.sessionId}
        questions={data.questions}
        answered={data.answered}
      />
    </main>
  );
}
