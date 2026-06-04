import "server-only";

import Stripe from "stripe";

/**
 * Server-only Stripe client. Reads the secret key from the environment and
 * returns null when unconfigured so the app still builds/runs without billing.
 */
export function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

/** Whether billing is configured, without exposing the secret to callers. */
export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
