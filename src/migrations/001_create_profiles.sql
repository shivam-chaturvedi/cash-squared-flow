create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  age integer,
  account_types text[] not null default array[]::text[],
  is_business boolean not null default false,
  business_name text,
  owner_name text,
  roles text[] not null default array[]::text[],
  invites text[] not null default array[]::text[],
  accepted_terms boolean not null default false,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_user_id_idx on public.profiles (user_id);

alter table public.profiles enable row level security;

create policy allow_select_profiles on public.profiles
  for select
  using (true);

create policy allow_insert_profiles on public.profiles
  for insert
  with check (true);

create policy allow_update_profiles on public.profiles
  for update
  using (true)
  with check (true);

create policy allow_delete_profiles on public.profiles
  for delete
  using (true);

create or replace function public.set_updated_at_column() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at_column();
