-- 0005_functions_triggers.sql
-- Helper functions + triggers: admin check, updated_at maintenance,
-- profile auto-provisioning on signup, and protection of privileged columns.

-- True when the current user is an admin/reviewer. SECURITY DEFINER so the lookup
-- itself is not blocked by RLS on profiles. search_path pinned to avoid hijacking.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'reviewer')
  );
$$;

-- Generic updated_at maintenance.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create trigger user_question_notes_set_updated_at
  before update on public.user_question_notes
  for each row execute function public.set_updated_at();

create trigger question_reports_set_updated_at
  before update on public.question_reports
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
-- SECURITY DEFINER so the insert bypasses RLS on profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins (and non-service_role) from changing privileged columns on
-- their own profile (role, subscription/billing). Subscriptions move only through
-- the signed Stripe webhook running as service_role (which bypasses RLS).
-- SECURITY INVOKER (the default) is required so current_user reflects the caller's
-- effective role; a SECURITY DEFINER function would always see the owner instead.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.subscription_status is distinct from old.subscription_status
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.current_period_end is distinct from old.current_period_end then
    raise exception 'Not allowed to modify privileged profile columns';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();
