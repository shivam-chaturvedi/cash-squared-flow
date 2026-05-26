create table if not exists public.personal_friend_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references public.personal_friends(id) on delete cascade,
  direction text not null check (direction in ('they_owe_me','i_owe_them')),
  amount numeric not null,
  note text,
  entry_on date not null default (now()::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_friend_entries_user_id_idx on public.personal_friend_entries(user_id);
create index if not exists personal_friend_entries_friend_id_idx on public.personal_friend_entries(friend_id);

alter table public.personal_friend_entries enable row level security;

create policy allow_select_personal_friend_entries on public.personal_friend_entries for select using (true);
create policy allow_insert_personal_friend_entries on public.personal_friend_entries for insert with check (true);
create policy allow_update_personal_friend_entries on public.personal_friend_entries for update using (true) with check (true);
create policy allow_delete_personal_friend_entries on public.personal_friend_entries for delete using (true);

