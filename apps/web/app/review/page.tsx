import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/server";
import { startReviewSession } from "@/lib/data/practice";

export const dynamic = "force-dynamic";

/** Builds a due-cards review session and sends the user into the practice runner. */
export default async function ReviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const result = await startReviewSession();
  if (result.ok) redirect(`/practice/${result.sessionId}`);
  redirect("/practice?error=no-reviews");
}
