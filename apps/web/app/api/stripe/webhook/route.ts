import type { SubscriptionStatusValue } from "@charterbank/shared";

import { createStripeClient } from "@/lib/stripe/server";
import { computeProfilePatchFromEvent, constructStripeEvent } from "@/lib/stripe/webhook";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface ProfileUpdate {
  stripe_customer_id?: string;
  subscription_status?: SubscriptionStatusValue;
  current_period_end?: string | null;
}

/**
 * Stripe webhook. The signature is verified against STRIPE_WEBHOOK_SECRET before
 * any processing; subscription changes are applied with the service-role client
 * (the only path allowed to mutate subscription columns, per the DB guard trigger).
 */
export async function POST(request: Request) {
  const stripe = createStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Billing not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await request.text();
  let event;
  try {
    event = constructStripeEvent(stripe, body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const patch = computeProfilePatchFromEvent(event);
  if (patch) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const update: ProfileUpdate = {};
      if (patch.stripeCustomerId) update.stripe_customer_id = patch.stripeCustomerId;
      if (patch.subscriptionStatus) update.subscription_status = patch.subscriptionStatus;
      if (patch.currentPeriodEnd !== undefined) update.current_period_end = patch.currentPeriodEnd;

      if (Object.keys(update).length > 0) {
        if (patch.userId) {
          await admin.from("profiles").update(update).eq("id", patch.userId);
        } else if (patch.stripeCustomerId) {
          await admin
            .from("profiles")
            .update(update)
            .eq("stripe_customer_id", patch.stripeCustomerId);
        }
      }
    }
  }

  return Response.json({ received: true });
}
