-- 0010_mock_mini_mode.sql
-- Allow the mini-mock session mode.

alter table public.practice_sessions drop constraint practice_sessions_mode_check;
alter table public.practice_sessions
  add constraint practice_sessions_mode_check
  check (mode in ('practice', 'review_errors', 'mock_half', 'mock_full', 'mock_mini', 'adaptive'));
