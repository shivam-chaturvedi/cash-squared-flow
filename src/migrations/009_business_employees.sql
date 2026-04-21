create table if not exists public.business_employees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text,
  salary numeric,
  last_edit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_employees_user_id_idx on public.business_employees(user_id);

alter table public.business_employees enable row level security;

create policy allow_select_business_employees on public.business_employees for select using (true);
create policy allow_insert_business_employees on public.business_employees for insert with check (true);
create policy allow_update_business_employees on public.business_employees for update using (true) with check (true);
create policy allow_delete_business_employees on public.business_employees for delete using (true);

