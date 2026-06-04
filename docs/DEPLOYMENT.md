# Deployment (placeholder — finalized in Phase 8)

## Targets

- **Web:** Vercel (Next.js App Router).
- **Database/Auth/Storage:** Supabase.
- **Billing:** Stripe (live mode checklist in Phase 8).
- **Jobs:** Trigger.dev / Inngest for the content pipeline.
- **Observability:** Sentry (errors), PostHog (product analytics), Langfuse (LLM tracing/cost).

## Environment

Copy `.env.example` → `.env.local` (local) and configure provider dashboards for staging/production.
Never commit real secrets. The service role key is server-only.

## CI (Phase 8)

Pipeline runs: `pnpm install` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`
(plus `pnpm test:e2e` once Playwright is wired). Migrations applied via Supabase CLI with a
forward-only, reviewed flow.

## Release checklist (Phase 8)

- [ ] CI green on the release commit.
- [ ] Supabase migrations applied and verified.
- [ ] Stripe webhooks configured and signature-verified.
- [ ] Sentry + PostHog receiving events.
- [ ] Backups configured; rollback/runbook documented.
- [ ] Terms, privacy, and legal disclaimer published.
