/** Plans and free-tier entitlement logic. Stripe wiring lands in Phase 3. */

export const FREE_QUESTION_LIMIT = 20;

export type PlanId = "free" | "monthly" | "annual";

export interface Plan {
  id: PlanId;
  name: string;
  /** Maximum distinct questions a user on this plan may answer, or null for unlimited. */
  questionLimit: number | null;
  fullMocks: boolean;
  smartReview: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    questionLimit: FREE_QUESTION_LIMIT,
    fullMocks: false,
    smartReview: false,
  },
  monthly: {
    id: "monthly",
    name: "Monthly",
    questionLimit: null,
    fullMocks: true,
    smartReview: true,
  },
  annual: { id: "annual", name: "Annual", questionLimit: null, fullMocks: true, smartReview: true },
};

/** Subscription statuses that grant unlimited access. */
export const PAID_STATUSES = ["active", "trial"] as const;
export type PaidStatus = (typeof PAID_STATUSES)[number];

export function isPaidStatus(status: string): status is PaidStatus {
  return (PAID_STATUSES as readonly string[]).includes(status);
}

/** Whether a free user may answer another question given how many they've already answered. */
export function isWithinFreeLimit(answeredCount: number): boolean {
  return answeredCount < FREE_QUESTION_LIMIT;
}

/** Remaining free questions for a free user (never negative). */
export function remainingFreeQuestions(answeredCount: number): number {
  return Math.max(0, FREE_QUESTION_LIMIT - answeredCount);
}
