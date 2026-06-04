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

> Run after every phase: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
