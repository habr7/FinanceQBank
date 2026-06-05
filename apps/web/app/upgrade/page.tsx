import Link from "next/link";
import { redirect } from "next/navigation";
import { APP_NAME, LEGAL_DISCLAIMER } from "@charterbank/shared";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/supabase/server";
import { isBillingConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    plan: "monthly",
    name: "Monthly",
    blurb: "Unlimited practice, full mocks, smart review, bookmarks, and notes. Cancel anytime.",
  },
  {
    plan: "annual",
    name: "Annual",
    blurb: "Everything in Monthly at a discount for committed candidates.",
  },
] as const;

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { checkout } = await searchParams;
  const billingConfigured = isBillingConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Upgrade {APP_NAME}</h1>
        <p className="text-sm text-muted">
          Unlock unlimited questions and full mock exams. No pass guarantees — just more practice
          and clearer review.
        </p>
      </header>

      {checkout === "cancel" ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted">
          Checkout was cancelled. You can upgrade whenever you&apos;re ready.
        </p>
      ) : null}

      {!billingConfigured ? (
        <p className="rounded-md border border-border p-4 text-sm text-muted">
          Billing is not configured in this environment.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => (
          <article key={p.plan} className="flex flex-col gap-3 rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="flex-1 text-sm text-muted">{p.blurb}</p>
            <form action="/api/stripe/checkout" method="post">
              <input type="hidden" name="plan" value={p.plan} />
              <Button type="submit" disabled={!billingConfigured}>
                Choose {p.name}
              </Button>
            </form>
          </article>
        ))}
      </section>

      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          Back to dashboard
        </Link>
      </p>

      <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted">
        {LEGAL_DISCLAIMER}
      </footer>
    </main>
  );
}
