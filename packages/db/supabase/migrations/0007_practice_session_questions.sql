-- 0007_practice_session_questions.sql
-- Persist the ordered question list chosen for a practice session so the runner
-- is deterministic and resumable. Covered by the existing owner RLS policy.

alter table public.practice_sessions
  add column question_ids uuid[] not null default '{}'::uuid[];
