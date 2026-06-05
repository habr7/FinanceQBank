-- 0006_rls.sql
-- Enable Row Level Security and define least-privilege policies.
-- service_role bypasses RLS (it owns the content pipeline + Stripe webhook).

alter table public.profiles enable row level security;
alter table public.curriculum_versions enable row level security;
alter table public.topics enable row level security;
alter table public.learning_objectives enable row level security;
alter table public.source_documents enable row level security;
alter table public.source_chunks enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.question_source_chunks enable row level security;
alter table public.question_audits enable row level security;
alter table public.content_jobs enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_question_notes enable row level security;
alter table public.question_reports enable row level security;
alter table public.spaced_repetition_cards enable row level security;

-- Grants (applied after RLS is enabled). RLS gates rows; grants gate which verbs a
-- role may attempt. Admin writes flow through the is_admin() "for all" policies below.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.topics, public.curriculum_versions to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- Never expose the answer key to students/anon. correct_option is computed into
-- attempts.is_correct server-side (set_attempt_is_correct) and surfaced post-answer
-- only through trusted server code (service_role). A column-level REVOKE does NOT
-- override a table-level SELECT grant, so we drop the table-level SELECT and re-grant
-- SELECT on every column EXCEPT correct_option. (Explanation gating per attempt-state
-- is enforced by the practice API in a later phase.) `select *` now fails for
-- authenticated on questions — select explicit columns instead.
revoke select on public.questions from authenticated;
grant select (
  id, curriculum_version_id, topic_code, learning_objective_id, difficulty, cognitive_level,
  stem, vignette, explanation_md, formula_md, calculator_hint_md, common_trap_md, status,
  quality_score, ai_confidence, ip_similarity_score, generated_by_model, validated_by_model,
  prompt_version, published_at, created_at, updated_at
) on public.questions to authenticated;

-- ---------------------------------------------------------------------------
-- profiles: a user sees/edits only their own row; admins see all. Privileged
-- columns are additionally guarded by the protect_profile_columns trigger.
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Public reference data: topics + curriculum versions are readable by everyone.
-- ---------------------------------------------------------------------------
create policy topics_select on public.topics
  for select to anon, authenticated using (true);

create policy curriculum_versions_select on public.curriculum_versions
  for select to anon, authenticated using (true);

create policy curriculum_versions_admin on public.curriculum_versions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy topics_admin on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Internal learning objectives: readable by authenticated users; admins manage.
-- ---------------------------------------------------------------------------
create policy learning_objectives_select on public.learning_objectives
  for select to authenticated using (status = 'active' or public.is_admin());

create policy learning_objectives_admin on public.learning_objectives
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Source material + audits + jobs: admin/reviewer only.
-- ---------------------------------------------------------------------------
create policy source_documents_admin on public.source_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy source_chunks_admin on public.source_chunks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy question_source_chunks_admin on public.question_source_chunks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy question_audits_admin on public.question_audits
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy content_jobs_admin on public.content_jobs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Questions + options: students read published only; admins read/manage all.
-- ---------------------------------------------------------------------------
create policy questions_select on public.questions
  for select to authenticated
  using (status = 'published' or public.is_admin());

create policy questions_admin_write on public.questions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy question_options_select on public.question_options
  for select to authenticated
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id
        and (q.status = 'published' or public.is_admin())
    )
  );

create policy question_options_admin_write on public.question_options
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Per-user study data: owner has full access; admins may read.
-- ---------------------------------------------------------------------------
create policy practice_sessions_owner on public.practice_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy practice_sessions_admin_read on public.practice_sessions
  for select to authenticated using (public.is_admin());

create policy attempts_owner on public.attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy attempts_admin_read on public.attempts
  for select to authenticated using (public.is_admin());

create policy bookmarks_owner on public.bookmarks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_question_notes_owner on public.user_question_notes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy spaced_repetition_cards_owner on public.spaced_repetition_cards
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Question reports: a user files + reads their own; admins read all + triage.
-- ---------------------------------------------------------------------------
create policy question_reports_insert on public.question_reports
  for insert to authenticated with check (user_id = auth.uid() and auth.uid() is not null);

create policy question_reports_select on public.question_reports
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

create policy question_reports_admin_update on public.question_reports
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
