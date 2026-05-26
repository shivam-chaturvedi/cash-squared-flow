alter table public.profiles
  add column if not exists employee_of_user_id uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists employee_access_pages text[] not null default array[]::text[];

