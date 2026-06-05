import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createStripeClient } from "@/lib/stripe/server";
import { getAppOrigin } from "@/lib/stripe/config";

export const runtime = "nodejs";

/** Open the Stripe billing portal for the current customer. */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const stripe = createStripeClient();
  if (!stripe) return NextResponse.json({ error: "Billing is not configured." }, { status: 503 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/upgrade", request.url), { status: 303 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${getAppOrigin(request.nextUrl.origin)}/dashboard`,
  });

  return NextResponse.redirect(session.url, { status: 303 });
}
