# QA Checklist

## Unit tests (required)

- [ ] Topic allocation sums to the requested count.
- [ ] Free gating limits at 20 questions.
- [ ] Mock generator returns exact totals (90 / 180).
- [ ] Question schema rejects 2 or 4 options.
- [ ] Forbidden option text is rejected.
- [ ] Publish gate rejects a failed audit.
- [ ] Publish gate rejects high IP risk.

## Integration tests (required)

- [ ] Auth creates a profile.
- [ ] Student answers a question; attempt updates dashboard.
- [ ] Bookmark works; report works.
- [ ] Admin quarantines a question.
- [ ] Stripe webhook updates subscription.

## E2E (Playwright)

- [ ] Signup / login.
- [ ] Complete 5 practice questions and see explanations.
- [ ] Hit paywall after free limit.
- [ ] Admin reviews a question.

## Phase 0 status

- [x] `packages/shared` unit tests: topic weights, target allocation, mock allocation, free limit.
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` green.

## Phase 1 status

- [x] Migrations apply from zero; seed creates 10 topics (`pnpm db:test`).
- [x] RLS suite (16 cases): cross-user isolation, draft hiding, privileged-column protection,
      answer-key column protection, server-computed `is_correct`, admin + service_role paths.

## Phase 4 status

- [x] `ai-content` 29 tests: Zod (rejects 2/4 options), deterministic validators, publish gate
      (rejects failed audit + high IP risk), n-gram IP, and the offline e2e pipeline.
- [x] CLI verified end-to-end offline: plan → generate (drafts) → audit (audits) →
      publish (only passing) / quarantine (flawed).

## Phase 2 status

- [x] `shared` practice logic: difficulty allocation, selection, dashboard-stats aggregation.
- [x] Answer submission graded server-side; `correct_option`/explanation never sent pre-submit.
- [x] Dashboard per-topic accuracy + weak-topic flagging; bookmark / note / report wired.

> Run after every phase: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
