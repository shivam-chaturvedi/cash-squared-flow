create table if not exists public.business_expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount numeric not null,
  description text,
  spent_on date not null default (now()::date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_expenses_user_id_idx on public.business_expenses(user_id);
create index if not exists business_expenses_spent_on_idx on public.business_expenses(spent_on);

alter table public.business_expenses enable row level security;

create policy allow_select_business_expenses on public.business_expenses for select using (true);
create policy allow_insert_business_expenses on public.business_expenses for insert with check (true);
create policy allow_update_business_expenses on public.business_expenses for update using (true) with check (true);
create policy allow_delete_business_expenses on public.business_expenses for delete using (true);

