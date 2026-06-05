# Deployment

## Targets

- **Web:** Vercel (Next.js App Router).
- **Database/Auth/Storage:** Supabase (PostgreSQL + Auth + RLS).
- **Billing:** Stripe.
- **Content pipeline:** offline batch (`pnpm content:*`); writes to Postgres when `SUPABASE_DB_URL` is set.
- **Observability:** Sentry (errors), PostHog (product analytics).

## CI (`.github/workflows/ci.yml`)

Two jobs run on push/PR:

- **build** — `pnpm install --frozen-lockfile` → `lint` → `typecheck` → `test` → `build`.
- **database** — boots a throwaway PostgreSQL from zero and runs `@charterbank/db` RLS suite +
  `@charterbank/ai-content` PgStore integration (`scripts/with-test-db.sh`).

## Environment

Copy `.env.example` → `.env.local`. Required for production (validated at server startup by
`apps/web/instrumentation.ts`, listed in `@charterbank/shared` `PRODUCTION_REQUIRED_ENV`):

```
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
STRIPE_PRICE_MONTHLY_ID, STRIPE_PRICE_ANNUAL_ID
```

Server-only secrets (`SERVER_ONLY_ENV`) must never be exposed to the client: service role key,
`SUPABASE_DB_URL`, Stripe secret + webhook secret, LLM API keys. Only `NEXT_PUBLIC_*` reaches the browser.

## Supabase setup

1. Create the project; copy URL + anon + service-role keys.
2. Apply migrations: `supabase db push` (or `supabase db reset` for a clean apply of
   `packages/db/supabase/migrations` + `seed`). Verify locally first with `pnpm db:test`.
3. Configure Auth providers (email magic link + Google) and the site URL / redirect allow-list
   (`${NEXT_PUBLIC_APP_URL}/auth/callback`).
4. Enable Point-in-Time Recovery / scheduled backups.

## Stripe production checklist

- [ ] Live-mode products + recurring prices created; set `STRIPE_PRICE_MONTHLY_ID` / `..._ANNUAL_ID`.
- [ ] Webhook endpoint `${NEXT_PUBLIC_APP_URL}/api/stripe/webhook` subscribed to
      `checkout.session.completed`, `customer.subscription.created|updated|deleted`; set `STRIPE_WEBHOOK_SECRET`.
- [ ] Verified a live test purchase flips `subscription_status` to `active` (webhook → service role).
- [ ] Customer portal enabled (cancellation/refund flows).
- [ ] Confirmed no Stripe secret is in the client bundle.

## Sentry / PostHog

- **PostHog:** set `NEXT_PUBLIC_POSTHOG_KEY` (+ host). `components/analytics.tsx` initializes it
  client-side only when the key is present.
- **Sentry:** server errors funnel through `apps/web/lib/observability.ts` (`reportError`). For full
  capture, add `@sentry/nextjs`, set `SENTRY_DSN`, and initialize it in `instrumentation.ts`
  (`register()` already runs at startup) — wrap `reportError` to call `Sentry.captureException`.

## Vercel

1. Import the repo; root is the monorepo (Turborepo). Build command `pnpm build`, output from `apps/web`.
2. Set all production env vars (above) as encrypted project env.
3. Deploy from `main` after CI is green.

## Release checklist

- [ ] CI green (build + database jobs) on the release commit.
- [ ] Supabase migrations applied and verified; backups/PITR on.
- [ ] Stripe production checklist complete; webhook signature verified.
- [ ] Sentry + PostHog receiving events.
- [ ] Legal disclaimer present in footer + onboarding; Terms/Privacy published.
- [ ] `docs/CONTENT_POLICY.md` reflected; first 500 questions human-reviewed before publish.
- [ ] Runbook (`docs/RUNBOOK.md`) reviewed by on-call.
