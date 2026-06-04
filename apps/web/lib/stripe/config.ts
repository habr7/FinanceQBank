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
