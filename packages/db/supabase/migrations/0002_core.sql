-- 0002_core.sql
-- Core reference + identity tables: profiles, curriculum versions, topics,
-- internal learning objectives, and permitted source documents/chunks.

-- Profiles mirror auth.users 1:1. Role + subscription columns are protected
-- (see 0005 trigger + 0006 RLS): users may never escalate them client-side.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin', 'reviewer')),
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'trial', 'active', 'past_due', 'canceled')),
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  level text not null default 'I',
  is_active boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (year, level)
);

create table public.topics (
  code text primary key,
  name text not null,
  exam_weight_min numeric(5, 2) not null,
  exam_weight_max numeric(5, 2) not null,
  display_order int not null
);

-- Internal, paraphrased objectives. NEVER store official LOS text (see CONTENT_POLICY).
create table public.learning_objectives (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid not null references public.curriculum_versions (id) on delete cascade,
  topic_code text not null references public.topics (code),
  module_name text not null,
  objective_code text not null,
  internal_objective text not null,
  source_policy text not null default 'internal_paraphrase',
  status text not null default 'active' check (status in ('draft', 'active', 'retired')),
  created_at timestamptz not null default now(),
  unique (curriculum_version_id, objective_code)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_type text not null
    check (source_type in ('founder_notes', 'licensed_material', 'public_outline', 'internal_summary')),
  source_license text not null,
  storage_path text,
  checksum text,
  curriculum_version_id uuid references public.curriculum_versions (id),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Embedding column deferred (pgvector). Add `embedding vector(1536)` in a later phase.
create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_document_id uuid not null references public.source_documents (id) on delete cascade,
  topic_code text references public.topics (code),
  learning_objective_id uuid references public.learning_objectives (id),
  chunk_text text not null,
  chunk_hash text not null,
  created_at timestamptz not null default now()
);

create index learning_objectives_topic_idx on public.learning_objectives (topic_code);
create index learning_objectives_version_idx on public.learning_objectives (curriculum_version_id);
create index source_chunks_document_idx on public.source_chunks (source_document_id);
create index source_chunks_learning_objective_idx on public.source_chunks (learning_objective_id);
