create table if not exists public.business_employee_invites (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  employee_name text not null,
  employee_email text not null,
  access_pages text[] not null default array[]::text[],
  salary numeric,
  status text not null default 'pending',
  accepted_at timestamptz,
  claimed_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_employee_invites_owner_idx on public.business_employee_invites (owner_user_id);
create index if not exists business_employee_invites_email_idx on public.business_employee_invites (employee_email);

alter table public.business_employee_invites enable row level security;

create policy allow_select_business_employee_invites on public.business_employee_invites for select using (true);
create policy allow_insert_business_employee_invites on public.business_employee_invites for insert with check (true);
create policy allow_update_business_employee_invites on public.business_employee_invites for update using (true) with check (true);
create policy allow_delete_business_employee_invites on public.business_employee_invites for delete using (true);

create trigger business_employee_invites_updated_at before update on public.business_employee_invites
  for each row execute function public.set_updated_at_column();

