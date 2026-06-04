import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe/server";
import { getPriceId, isBillingPlan } from "@/lib/stripe/config";

export const runtime = "nodejs";

/** Start a Stripe Checkout session for a subscription and redirect to it. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const stripe = createStripeClient();
  if (!stripe) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });

  const form = await request.formData();
  const plan = String(form.get("plan") ?? "");
  if (!isBillingPlan(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  const priceId = getPriceId(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Plan price is not configured." }, { status: 503 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, stripe_customer_id")
    .eq("id", user.id)
    .single();

  const origin = request.nextUrl.origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : (profile?.email ?? user.email),
    client_reference_id: user.id,
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/upgrade?checkout=cancel`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 502 });
  }
  return NextResponse.redirect(session.url, { status: 303 });
}
