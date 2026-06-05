export type BillingPlan = "monthly" | "annual";

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "monthly" || value === "annual";
}

/** Stripe price id for a plan, from the environment. Null when unconfigured. */
export function getPriceId(plan: BillingPlan): string | null {
  const id =
    plan === "monthly" ? process.env.STRIPE_PRICE_MONTHLY_ID : process.env.STRIPE_PRICE_ANNUAL_ID;
  return id && id.length > 0 ? id : null;
}

/**
 * Canonical app origin for Stripe redirect URLs. Prefer the configured public URL
 * over the request host so a forwarded/spoofed Host header can't redirect users
 * to an attacker-controlled domain. Falls back to the request origin in dev.
 */
export function getAppOrigin(fallback: string): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  return configured && configured.length > 0 ? configured.replace(/\/+$/, "") : fallback;
}
