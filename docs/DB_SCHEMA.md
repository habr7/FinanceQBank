# Database Schema (overview)

> Full SQL lands in `packages/db/supabase/migrations` in Phase 1. This is the planned model.
> The schema supports curriculum versioning, auditing, attempts, review, reports, and subscriptions.

## Entities

- **profiles** — user profile, role (`student`/`admin`/`reviewer`), `subscription_status`,
  Stripe customer id, current period end.
- **curriculum_versions** — `(year, level)`, `is_active`.
- **topics** — code PK, name, weight min/max, display order (10 Level I topics).
- **learning_objectives** — internal, paraphrased objectives per curriculum version (never official LOS text).
- **source_documents / source_chunks** — permitted sources with `source_type`/`source_license`;
  chunks optionally embedded (pgvector deferred).
- **questions** — versioned, topic + objective, difficulty, cognitive level, stem, vignette,
  `correct_option`, explanation, status (`draft`→`published`/`quarantined`/`retired`), quality/AI/IP scores, model + prompt provenance.
- **question_options** — A/B/C with text + rationale; unique `(question_id, label)`.
- **question_source_chunks** — provenance link question ↔ source chunk.
- **question_audits** — one row per audit (`independent_solver`, `validator`, `adversarial_review`,
  `math_check`, `ip_check`, `human_review`) with `pass/warning/fail/corrected`.
- **practice_sessions / attempts** — study sessions and per-question attempts (correctness, time, confidence).
- **bookmarks / user_question_notes / question_reports** — personal study artifacts and user-reported issues.
- **spaced_repetition_cards** — SM-2-style review scheduling.
- **content_jobs** — batch pipeline job queue + results.

## RLS principles

1. Users read/write only their own profile, attempts, bookmarks, notes, sessions, SR cards.
2. Users read only `status = 'published'` questions.
3. Admin/reviewer read drafts, audits, reports and can publish/unpublish.
4. Service role runs the content pipeline.
5. Subscription status changes only via the signed Stripe webhook (server-side).

Helper: `is_admin()` (security definer) checks `role in ('admin','reviewer')`.

## Required RLS tests

Student A cannot see student B's attempts; students cannot read draft questions; free users
cannot unlock more than 20 questions; admin sees reports/drafts; users cannot change their own
`subscription_status`.
