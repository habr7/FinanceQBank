# CharterBank — Implementation Plan (by phase)

Derived from [`PROJECT_BRIEF.md`](./PROJECT_BRIEF.md) §13. Build strictly in order.
**Do not skip phases. Do not skip tests.** After each phase, run `pnpm lint`,
`pnpm typecheck`, `pnpm test`, and `pnpm build` (where applicable) and fix all failures.

Legend: ✅ done · 🚧 in progress · ⬜ not started

---

## Phase 0 — Bootstrap & documentation 🚧

**Goal:** monorepo scaffold, tooling, docs, CLAUDE.md, subagents/commands. No DB, no product features.

Scope:

- pnpm + Turborepo monorepo: `apps/web`, `packages/shared`, stubs for `packages/db` & `packages/ai-content`.
- Next.js App Router + TypeScript (strict) + Tailwind v4 + shadcn-style UI primitives.
- ESLint 9 (flat) + Prettier + shared `tsconfig.base.json`.
- `packages/shared`: topics/weights, exam rules, pricing, constants + **unit tests**.
- Initial `docs/` (PRODUCT_SPEC, CONTENT_POLICY, AI_PIPELINE, DB_SCHEMA, QA_CHECKLIST, DEPLOYMENT).
- `.env.example`, `CLAUDE.md`, `.claude/agents`, `.claude/commands`, `.claude/settings.example.json`.

**Acceptance criteria**

- [ ] `pnpm install` works.
- [ ] `pnpm dev` serves a basic homepage with the legal disclaimer.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` pass.
- [ ] `pnpm test` passes (shared-domain unit tests).
- [ ] Initial `docs/` created.

---

## Phase 1 — Database, Auth & RLS ⬜

**Goal:** Supabase migrations, RLS, auth in the app, topic seed.

Scope: migrations for `profiles`, `curriculum_versions`, `topics`, `learning_objectives`,
`source_documents/chunks`, `questions`, `question_options`, `question_source_chunks`,
`question_audits`, `practice_sessions`, `attempts`, `bookmarks`, `user_question_notes`,
`question_reports`, `spaced_repetition_cards`, `content_jobs`. RLS policies + `is_admin()`
helper. Supabase auth (Google + magic link) wired into Next.js. Seed of 10 Level I topics.

**Acceptance:** migrations run from zero; RLS blocks cross-user reads & draft questions;
user logs in and a profile is created; seed creates 10 topics. RLS tests pass.
Review with `database-rls-architect` before finalizing.

---

## Phase 2 — Study UI MVP ⬜

**Goal:** dashboard, practice mode, question card, answer submission, post-answer explanation,
bookmarks, notes, report issue.

**Acceptance:** user answers a published question; attempt saved; dashboard shows per-topic
accuracy; user reports an issue; basic tests pass. Use `frontend-ux-engineer` + `qa-test-engineer`.

---

## Phase 3 — Stripe & entitlements ⬜

**Goal:** monthly/annual checkout, customer portal, signed webhook, free-vs-paid gating
(free = 20 questions; active = unlimited).

**Acceptance:** webhook verifies signature; free user blocked after 20 questions; active user
gets full access; no secrets in client bundle. Review with `security-billing-engineer`.

---

## Phase 4 — AI content pipeline MVP ⬜

**Goal:** `packages/ai-content` — Zod schemas, versioned prompts, runner CLI, agents
(blueprint, generator, independent solver, validator, adversarial reviewer, IP checker),
publish gate, jobs/audits tables. Dummy author-owned source documents only.

**Acceptance:** `content:generate` creates drafts; `content:audit` writes audits;
`content:publish` publishes only passing questions; failures → quarantine; invalid outputs
rejected by Zod. Review with `ai-content-pipeline-engineer` + `cfa-domain-reviewer`.

---

## Phase 5 — Admin Content Studio ⬜

**Goal:** admin/reviewer-only UI to list questions by status, view audits/reports, publish,
quarantine, retire, re-run audit. Secure server actions + RLS.

**Acceptance:** students can't access admin; admin sees drafts/audits; admin can publish/quarantine;
reports appear and can be triaged.

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
