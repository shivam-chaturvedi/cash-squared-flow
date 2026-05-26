-- Create feedback table for in-app widget submissions.

create extension if not exists pgcrypto;

create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int2 not null check (rating >= 1 and rating <= 5),
  message text null,
  page_path text null,
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_user_id_idx on public.user_feedback (user_id);
create index if not exists user_feedback_created_at_idx on public.user_feedback (created_at desc);

alter table public.user_feedback enable row level security;

-- Users can submit feedback as themselves.
create policy "user_feedback_insert_own"
on public.user_feedback
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can read their own feedback submissions.
create policy "user_feedback_select_own"
on public.user_feedback
for select
to authenticated
using (auth.uid() = user_id);

