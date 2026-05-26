create table if not exists public.business_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('in','out')),
  amount numeric not null,
  description text not null,
  occurred_at timestamptz not null default now(),
  customer_id uuid references public.business_customers(id) on delete set null,
  supplier_id uuid references public.business_suppliers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_transactions_user_id_idx on public.business_transactions(user_id);
create index if not exists business_transactions_occurred_at_idx on public.business_transactions(occurred_at);

alter table public.business_transactions enable row level security;

create policy allow_select_business_transactions on public.business_transactions for select using (true);
create policy allow_insert_business_transactions on public.business_transactions for insert with check (true);
create policy allow_update_business_transactions on public.business_transactions for update using (true) with check (true);
create policy allow_delete_business_transactions on public.business_transactions for delete using (true);

