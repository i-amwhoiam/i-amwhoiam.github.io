create table if not exists public.study_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.study_states enable row level security;

drop policy if exists "study_states_select_own" on public.study_states;
create policy "study_states_select_own"
  on public.study_states for select
  using (auth.uid() = user_id);

drop policy if exists "study_states_insert_own" on public.study_states;
create policy "study_states_insert_own"
  on public.study_states for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_states_update_own" on public.study_states;
create policy "study_states_update_own"
  on public.study_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.study_states to authenticated;
