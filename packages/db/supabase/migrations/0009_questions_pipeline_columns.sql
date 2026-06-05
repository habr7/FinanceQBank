-- 0009_questions_pipeline_columns.sql
-- Columns the content pipeline needs to round-trip its drafts into the DB:
-- the originating batch (a content_jobs row), the internal objective code, and
-- the question type. All nullable so existing rows and manual inserts are unaffected.

alter table public.questions
  add column batch_id uuid references public.content_jobs (id) on delete set null,
  add column objective_code text,
  add column question_type text
    check (question_type in ('conceptual', 'calculation', 'mini_case'));

create index questions_batch_idx on public.questions (batch_id);
