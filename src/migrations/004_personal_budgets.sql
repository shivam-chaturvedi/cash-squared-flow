create table if not exists public.personal_budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, category)
);

create index if not exists personal_budgets_user_id_idx on public.personal_budgets(user_id);

alter table public.personal_budgets enable row level security;

create policy allow_select_personal_budgets on public.personal_budgets for select using (true);
create policy allow_insert_personal_budgets on public.personal_budgets for insert with check (true);
create policy allow_update_personal_budgets on public.personal_budgets for update using (true) with check (true);
create policy allow_delete_personal_budgets on public.personal_budgets for delete using (true);

