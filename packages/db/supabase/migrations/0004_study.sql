-- 0004_study.sql
-- Per-user study data: sessions, attempts, bookmarks, notes, reports, SR cards.

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('practice', 'review_errors', 'mock_half', 'mock_full', 'adaptive')),
  topic_filter text[],
  difficulty_filter text[],
  total_questions int not null,
  time_limit_seconds int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id uuid references public.practice_sessions (id) on delete set null,
  question_id uuid not null references public.questions (id) on delete restrict,
  chosen_option text check (chosen_option in ('A', 'B', 'C')),
  is_correct boolean not null,
  response_time_seconds int,
  confidence_rating int check (confidence_rating between 1 and 5),
  answered_at timestamptz not null default now()
);

create table public.bookmarks (
  user_id uuid references public.profiles (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.user_question_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  note_md text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  question_id uuid not null references public.questions (id) on delete cascade,
  report_type text not null
    check (report_type in ('wrong_answer', 'ambiguous', 'typo', 'outdated', 'explanation_unclear', 'other')),
  message text,
  status text not null default 'open' check (status in ('open', 'triaged', 'fixed', 'wont_fix')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spaced_repetition_cards (
  user_id uuid references public.profiles (id) on delete cascade,
  question_id uuid references public.questions (id) on delete cascade,
  ease_factor numeric(5, 2) not null default 2.50,
  interval_days int not null default 1,
  repetitions int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, question_id)
);

create index attempts_user_idx on public.attempts (user_id);
create index attempts_user_question_idx on public.attempts (user_id, question_id);
create index attempts_session_idx on public.attempts (session_id);
create index practice_sessions_user_idx on public.practice_sessions (user_id);
create index question_reports_status_idx on public.question_reports (status);
create index question_reports_question_idx on public.question_reports (question_id);
create index spaced_repetition_due_idx on public.spaced_repetition_cards (user_id, due_at);
