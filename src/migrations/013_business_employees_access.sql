alter table public.business_employees
  add column if not exists access_pages text[] not null default array[]::text[];

alter table public.business_employees
  add column if not exists employee_user_id uuid references auth.users(id) on delete set null;

create index if not exists business_employees_email_idx on public.business_employees (email);
create unique index if not exists business_employees_user_id_email_uq on public.business_employees (user_id, email);

