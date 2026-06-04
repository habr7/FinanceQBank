import "server-only";

import { getEntitlement, type Entitlement } from "@charterbank/shared";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface UserBilling {
  userId: string;
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  answeredCount: number;
  entitlement: Entitlement;
}

/** Current user's subscription status, distinct-answered count, and entitlement. */
export async function getUserBilling(): Promise<UserBilling | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const { data: attempts } = await supabase
    .from("attempts")
    .select("question_id")
    .eq("user_id", user.id);

  const subscriptionStatus = profile?.subscription_status ?? "free";
  const answeredCount = new Set((attempts ?? []).map((a) => a.question_id)).size;

  return {
    userId: user.id,
    subscriptionStatus,
    stripeCustomerId: profile?.stripe_customer_id ?? null,
    answeredCount,
    entitlement: getEntitlement(subscriptionStatus, answeredCount),
  };
}
