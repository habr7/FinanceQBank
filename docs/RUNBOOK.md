# Operations Runbook

On-call reference for CharterBank. Keep actions reversible; never expose the service-role key.

## Incident response

1. Check Sentry for the error signature and the platform logs (`[charterbank:error]` entries).
2. Identify blast radius: auth, billing/webhook, content serving, or pipeline.
3. Mitigate (roll back the Vercel deploy if a release regressed), then fix forward.
4. Record a short postmortem for anything user-facing.

## Common procedures

### Quarantine a bad question

- Admin Content Studio → question → **Quarantine** (or `pnpm content:quarantine -- --question=<id> --reason="..."`).
- Quarantined questions are immediately excluded from practice/mocks (only `published` is served).
- Triage the linked user reports; re-run the audit after a fix and re-publish only if it passes the gate.

### Billing: refund / cancellation

- Cancellations: the customer uses the Stripe billing portal (`/api/stripe/portal`); the
  `customer.subscription.updated|deleted` webhook updates `subscription_status`.
- Refunds: issue from the Stripe dashboard. Subscription status is driven solely by Stripe webhooks —
  never edit `profiles.subscription_status` by hand (the DB trigger blocks non-service-role writes anyway).
- If a paid user is stuck on `free`, re-send the Stripe event (dashboard → webhook → resend); the
  idempotency log (`stripe_events`) makes re-delivery safe.

### Webhook failures

- A failed DB update returns 500 so Stripe retries; check logs for `scope: stripe_webhook`.
- Duplicate deliveries are no-ops (unique `stripe_events.id`).

### Database

- Migrations are forward-only; review with `database-rls-architect`, verify with `pnpm db:test`
  (applies from zero), then `supabase db push`.
- Backups: Supabase PITR/scheduled backups. Test restore into a scratch project quarterly.
- RLS is the security boundary — never disable it to "debug"; use the service role server-side instead.

### Support

- Email support; for data-access requests, a user's data is reachable via their RLS-scoped rows.
- Account deletion cascades from `auth.users` (profiles + study data deleted; reports anonymized).

## Escalation

Auth/billing data exposure or a publish-gate bypass is sev-1: take the affected surface offline
(disable the route / revert) before fixing forward.
