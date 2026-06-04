import { FREE_QUESTION_LIMIT, isPaidStatus, remainingFreeQuestions } from "./pricing";

/** Subscription status stored on a profile (mirrors the DB check constraint). */
export type SubscriptionStatusValue = "free" | "trial" | "active" | "past_due" | "canceled";

/**
 * Map a Stripe subscription status to our internal subscription status.
 * Unknown/incomplete states fall back to "free" so access is never granted
 * before payment is confirmed.
 */
export function mapStripeSubscriptionStatus(stripeStatus: string): SubscriptionStatusValue {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trial";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      // incomplete, paused, or anything unexpected -> no paid access.
      return "free";
  }
}

export interface Entitlement {
  unlimited: boolean;
  /** Distinct-question cap for the plan, or null when unlimited. */
  limit: number | null;
  /** Remaining free questions, or null when unlimited. */
  remaining: number | null;
  /** Whether the user may answer another (distinct) question right now. */
  canAnswer: boolean;
}

/**
 * Resolve a user's entitlement from their subscription status and how many
 * distinct questions they have already answered. Paid statuses are unlimited;
 * free users are capped at FREE_QUESTION_LIMIT distinct questions.
 */
export function getEntitlement(subscriptionStatus: string, answeredCount: number): Entitlement {
  if (isPaidStatus(subscriptionStatus)) {
    return { unlimited: true, limit: null, remaining: null, canAnswer: true };
  }
  const remaining = remainingFreeQuestions(answeredCount);
  return { unlimited: false, limit: FREE_QUESTION_LIMIT, remaining, canAnswer: remaining > 0 };
}
