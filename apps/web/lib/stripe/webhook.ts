import type Stripe from "stripe";
import { mapStripeSubscriptionStatus, type SubscriptionStatusValue } from "@charterbank/shared";

/**
 * Pure mapping from a Stripe event to the profile changes it implies. No I/O,
 * no `server-only` import — so it is unit-testable. Returns null for events we
 * do not act on.
 */
export interface ProfileBillingPatch {
  userId?: string;
  stripeCustomerId?: string;
  subscriptionStatus?: SubscriptionStatusValue;
  currentPeriodEnd?: string | null;
}

function customerId(customer: string | { id: string } | null | undefined): string | undefined {
  if (!customer) return undefined;
  return typeof customer === "string" ? customer : customer.id;
}

function epochToIso(seconds: unknown): string | null {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

/** Read the current period end across Stripe API shapes (subscription or item level). */
function periodEnd(subscription: Stripe.Subscription): string | null {
  const top = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (typeof top === "number") return epochToIso(top);
  const item = subscription.items?.data?.[0] as unknown as
    | { current_period_end?: number }
    | undefined;
  return epochToIso(item?.current_period_end);
}

export function computeProfilePatchFromEvent(event: Stripe.Event): ProfileBillingPatch | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.userId ?? undefined;
      // Require a userId anchor — never link a customer to a profile by customer id
      // alone (avoids updating the wrong profile from a crafted/replayed event).
      if (!userId) return null;
      return { userId, stripeCustomerId: customerId(session.customer) };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const status: SubscriptionStatusValue =
        event.type === "customer.subscription.deleted"
          ? "canceled"
          : mapStripeSubscriptionStatus(subscription.status);
      return {
        userId: subscription.metadata?.userId ?? undefined,
        stripeCustomerId: customerId(subscription.customer),
        subscriptionStatus: status,
        currentPeriodEnd: periodEnd(subscription),
      };
    }
    default:
      return null;
  }
}

/** Verify the Stripe signature and parse the event. Throws on an invalid signature. */
export function constructStripeEvent(
  stripe: Stripe,
  body: string,
  signature: string,
  secret: string,
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, secret);
}
