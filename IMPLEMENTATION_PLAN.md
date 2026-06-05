# CharterBank — Implementation Plan (by phase)

Derived from [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md) §13. Build strictly in order.
**Do not skip phases. Do not skip tests.** After each phase, run `pnpm lint`,
`pnpm typecheck`, `pnpm test`, and `pnpm build` (where applicable) and fix all failures.

Legend: ✅ done · 🚧 in progress · ⬜ not started

---

## Phase 0 — Bootstrap & documentation ✅

**Goal:** monorepo scaffold, tooling, docs, CLAUDE.md, subagents/commands. No DB, no product features.

Scope:

- pnpm + Turborepo monorepo: `apps/web`, `packages/shared`, stubs for `packages/db` & `packages/ai-content`.
- Next.js App Router + TypeScript (strict) + Tailwind v4 + shadcn-style UI primitives.
- ESLint 9 (flat) + Prettier + shared `tsconfig.base.json`.
- `packages/shared`: topics/weights, exam rules, pricing, constants + **unit tests**.
- Initial `docs/` (PRODUCT_SPEC, CONTENT_POLICY, AI_PIPELINE, DB_SCHEMA, QA_CHECKLIST, DEPLOYMENT).
- `.env.example`, `CLAUDE.md`, `.claude/agents`, `.claude/commands`, `.claude/settings.example.json`.

**Acceptance criteria**

- [x] `pnpm install` works.
- [x] `pnpm dev` serves a basic homepage with the legal disclaimer.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm build` pass.
- [x] `pnpm test` passes (shared-domain unit tests).
- [x] Initial `docs/` created.

---

## Phase 1 — Database, Auth & RLS ✅

**Goal:** Supabase migrations, RLS, auth in the app, topic seed.

Scope: migrations for `profiles`, `curriculum_versions`, `topics`, `learning_objectives`,
`source_documents/chunks`, `questions`, `question_options`, `question_source_chunks`,
`question_audits`, `practice_sessions`, `attempts`, `bookmarks`, `user_question_notes`,
`question_reports`, `spaced_repetition_cards`, `content_jobs`. RLS policies + `is_admin()`
helper. Supabase auth (Google + magic link) wired into Next.js. Seed of 10 Level I topics.

Delivered:

- `packages/db/supabase/migrations/0001…0006` — extensions, core, content, study tables,
  functions/triggers (`is_admin()`, `handle_new_user`, `protect_profile_columns`, `set_updated_at`),
  and RLS grants + policies.
- `packages/db/supabase/seed/seed.sql` — 10 topics + active 2026 curriculum version.
- `packages/db/src/types.ts` — hand-authored `Database` types for the typed Supabase client.
- RLS suite (`tests/rls.test.ts`) run by `pnpm db:test`, which boots a throwaway Postgres
  cluster, applies the Supabase-compat layer + all migrations + seed from zero, and asserts
  cross-user isolation, draft hiding, privileged-column protection, and admin access.
- Next.js auth: `@supabase/ssr` server/browser clients + middleware session refresh,
  `/login` (magic link + Google), `/auth/callback`, `/auth/signout`, and a protected
  `/dashboard` reading the profile + topics through RLS.

**Acceptance:** migrations run from zero ✅; RLS blocks cross-user reads & draft questions ✅;
profile auto-provisioned on signup (trigger) ✅; seed creates 10 topics ✅; RLS tests pass
(9/9) ✅.

---

## Phase 2 — Study UI MVP ✅

**Goal:** dashboard, practice mode, question card, answer submission, post-answer explanation,
bookmarks, notes, report issue.

Delivered:

- `packages/shared/practice.ts` — pure, tested domain logic: `allocateDifficulty` (30/50/20),
  `selectPracticeQuestions` (difficulty mix + shortfall fill), `computeDashboardStats`
  (overall + per-topic accuracy, avg time, weak-topic flagging).
- `apps/web/lib/data/*` — server-only data layer: dashboard stats, practice session creation +
  runner load, `submitAnswer` (insert under RLS → DB trigger grades; service-role read reveals
  the answer key + explanation only AFTER submit), and engagement (bookmark/note/report).
- Server actions (`app/practice/actions.ts`) + UI: enhanced `/dashboard` (per-topic accuracy,
  weak topics, totals), `/practice` (start form), `/practice/[sessionId]` runner with a
  keyboard-driven question card (A/B/C, Enter, N, M), post-answer explanation + rationales,
  bookmark, note, and report-issue.
- Migration `0007` adds `practice_sessions.question_ids` (resumable, deterministic runner).

**Acceptance:** user answers a published question (graded server-side) ✅; attempt saved with
server-computed `is_correct` ✅; dashboard shows per-topic accuracy ✅; user can report an issue,
bookmark, and note ✅; tests pass — shared 42, db RLS 16/16, lint/typecheck/build green ✅.

> Note: the answer key (`correct_option`) and explanation are never sent to the client before
> submission, consistent with the Phase 1 column-level grant + the security rules in CLAUDE.md.

---

## Phase 3 — Stripe & entitlements ✅

**Goal:** monthly/annual checkout, customer portal, signed webhook, free-vs-paid gating
(free = 20 questions; active = unlimited).

Delivered:

- `shared/billing.ts` (pure, tested): `mapStripeSubscriptionStatus`, `getEntitlement`.
- Server-only Stripe client/config; `/api/stripe/checkout`, `/portal`, `/webhook`.
- Pure webhook module (signature verify + event→profile patch) with a real Stripe-signed test.
- Entitlement enforced in `startPracticeSession` (paywall + free-session cap) **and** re-checked
  in `submitAnswer` (with session-membership check) so the cap can't be bypassed.
- Webhook hardening (post `security-billing-engineer` review): idempotency log
  (`stripe_events`, migration `0008`), DB-error surfacing (Stripe retries), require a userId
  anchor for `checkout.session.completed`, unique `profiles.stripe_customer_id`,
  canonical redirect origin from `NEXT_PUBLIC_APP_URL`.

**Acceptance:** webhook verifies signature ✅; free user blocked after 20 questions (session +
answer-time) ✅; active user unlimited ✅; no secrets in client bundle (server-only) ✅.
Tests: shared 49, web 7, db RLS 19/19; lint/typecheck/build green.

---

## Phase 4 — AI content pipeline MVP ✅

**Goal:** `packages/ai-content` — Zod schemas, versioned prompts, runner CLI, agents
(blueprint, generator, independent solver, validator, adversarial reviewer, IP checker),
publish gate. Dummy author-owned source documents only.

Delivered:

- Zod schemas (`GeneratedQuestionSchema` etc.) — exactly 3 options, one correct, structural mins.
- Deterministic validators (§19): three options, single correct, forbidden options, numeric
  ordering, explanation completeness, official-claim block, markdown math, topic distribution.
- Versioned `.md` prompts (`v1`) + loader; agent chain over an `LlmClient` abstraction with a
  deterministic offline **mock** (default; real Anthropic adapter when `ANTHROPIC_API_KEY` set).
- IP checker via deterministic n-gram (Jaccard) similarity against a dummy author corpus.
- Publish gate (§9): 3 options, one correct, rationale per option, validator agreement,
  no critical adversarial, IP < 0.35, no forbidden text, tagged, quality ≥ 85, confidence ≥ 0.85.
- State machine + `ContentStore` (offline JSON store; Supabase store deferred to Phase 5).
- CLI + `content:{plan,generate,audit,publish,quarantine}` wired end-to-end.
- Dummy founder-authored `source_documents`/`source_chunks` added to the DB seed.

**Acceptance:** `content:generate` creates drafts ✅; `content:audit` writes audits ✅;
`content:publish` publishes only passing (others skipped) ✅; flawed items → quarantine ✅;
invalid outputs rejected by Zod ✅. Tests: ai-content 29; ran the CLI end-to-end offline.
Review with `ai-content-pipeline-engineer` + `cfa-domain-reviewer`.

---

## Phase 5 — Admin Content Studio ✅

**Goal:** admin/reviewer-only UI to list questions by status, view audits/reports, publish,
quarantine, retire, re-run audit. Secure server actions + RLS.

Delivered:

- `requireAdmin()` gate (layout-level) + `getAdminContext()` for server actions; non-admins
  redirect to /dashboard, unauthenticated to /login.
- `/admin` (questions by status filter), `/admin/questions/[id]` (stem/options/answer key,
  explanation, audit history, reports, provenance + actions), `/admin/reports` (triage).
- Server actions: publish / quarantine / retire, re-run deterministic audit (reuses the
  pipeline's `runDeterministicValidators`), triage report — all re-check admin first and use
  the service-role client (admins can read `correct_option`, which is revoked from `authenticated`).
- **Pipeline → Postgres**: `PgContentStore` writes drafts/audits/jobs into the Phase 1 tables
  (migration `0009` adds `questions.batch_id/objective_code/question_type`); the store factory
  uses it when `SUPABASE_DB_URL` is set, else the offline JSON store. Verified end-to-end against
  a real Postgres cluster.

**Acceptance:** students can't access admin (redirect) ✅; admin sees drafts/audits ✅; admin can
publish/quarantine/retire/re-audit ✅; reports appear and can be triaged ✅. Tests: db RLS 21/21
(adds admin status-change + report-triage), ai-content 38 incl. PgStore round-trip; lint/typecheck/test/build green.

---

## Phase 6 — Mock mode & analytics ⬜

**Goal:** half (90q/135m) and full (180q/270m, two sessions) mocks + mini mock (30q, weighted),
timer, navigation, flag-for-review, final-only results, per-topic breakdown.

**Acceptance:** half/full mocks with correct totals and timing; results only at the end;
per-topic breakdown works.

---

## Phase 7 — Retention & adaptive practice ⬜

**Goal:** spaced repetition, suggested next session, weak-topic recommender, streaks,
basic transactional emails. No unnecessary complexity.

**Acceptance:** wrong answers enter review; dashboard recommends next session; due cards appear.

---

## Phase 8 — Production ⬜

**Goal:** CI/CD, Vercel deploy, Supabase production, Stripe production checklist, Sentry/PostHog,
backup & runbook.

**Acceptance:** CI runs lint/typecheck/test/build; deploy docs complete; release checklist exists;
basic monitoring integrated. Use `devops-release-engineer` + `security-billing-engineer`.
