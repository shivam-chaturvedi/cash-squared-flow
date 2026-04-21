create table if not exists public.business_customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_customers_user_id_idx on public.business_customers(user_id);

alter table public.business_customers enable row level security;

create policy allow_select_business_customers on public.business_customers for select using (true);
create policy allow_insert_business_customers on public.business_customers for insert with check (true);
create policy allow_update_business_customers on public.business_customers for update using (true) with check (true);
create policy allow_delete_business_customers on public.business_customers for delete using (true);

