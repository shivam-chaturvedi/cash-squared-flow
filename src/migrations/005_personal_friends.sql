create table if not exists public.personal_friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_name text not null,
  friend_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_friends_user_id_idx on public.personal_friends(user_id);

alter table public.personal_friends enable row level security;

create policy allow_select_personal_friends on public.personal_friends for select using (true);
create policy allow_insert_personal_friends on public.personal_friends for insert with check (true);
create policy allow_update_personal_friends on public.personal_friends for update using (true) with check (true);
create policy allow_delete_personal_friends on public.personal_friends for delete using (true);

