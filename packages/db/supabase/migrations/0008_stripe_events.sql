-- 0008_stripe_events.sql
-- Webhook idempotency log + uniqueness on the Stripe customer link.

-- Processed Stripe event ids, so replayed/duplicate webhooks are no-ops.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

-- service_role only (the webhook). RLS on + no policies => denied for anon/authenticated.
alter table public.stripe_events enable row level security;
grant all on public.stripe_events to service_role;

-- Prevent two profiles from ever sharing a Stripe customer, and close the
-- duplicate-customer race in checkout (the second webhook update fails loudly).
create unique index profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
