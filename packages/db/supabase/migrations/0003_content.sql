-- 0003_content.sql
-- Question content, options, provenance, audits, and the batch job queue.

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions (id),
  topic_code text not null references public.topics (code),
  learning_objective_id uuid references public.learning_objectives (id),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  cognitive_level text not null default 'application'
    check (cognitive_level in ('recall', 'comprehension', 'application', 'analysis')),
  stem text not null,
  vignette text,
  correct_option text not null check (correct_option in ('A', 'B', 'C')),
  explanation_md text not null,
  formula_md text,
  calculator_hint_md text,
  common_trap_md text,
  status text not null default 'draft'
    check (status in ('draft', 'ai_validated', 'human_review', 'published', 'quarantined', 'retired')),
  quality_score numeric(5, 2),
  ai_confidence numeric(5, 2),
  ip_similarity_score numeric(5, 2),
  generated_by_model text,
  validated_by_model text,
  prompt_version text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  label text not null check (label in ('A', 'B', 'C')),
  option_text text not null,
  rationale_md text,
  unique (question_id, label)
);

create table public.question_source_chunks (
  question_id uuid references public.questions (id) on delete cascade,
  source_chunk_id uuid references public.source_chunks (id) on delete restrict,
  relevance_score numeric(5, 2),
  primary key (question_id, source_chunk_id)
);

create table public.question_audits (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  audit_type text not null
    check (audit_type in ('independent_solver', 'validator', 'adversarial_review', 'math_check', 'ip_check', 'human_review')),
  result text not null check (result in ('pass', 'warning', 'fail', 'corrected')),
  findings jsonb not null default '{}'::jsonb,
  corrected_payload jsonb,
  model text,
  reviewer_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.content_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index questions_status_idx on public.questions (status);
create index questions_topic_idx on public.questions (topic_code);
create index questions_topic_status_idx on public.questions (topic_code, status);
create index question_options_question_idx on public.question_options (question_id);
create index question_source_chunks_chunk_idx on public.question_source_chunks (source_chunk_id);
create index question_audits_question_idx on public.question_audits (question_id);
create index content_jobs_status_idx on public.content_jobs (status);
