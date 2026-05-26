create table if not exists public.app_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('personal','business')),
  type text not null,
  title text not null,
  description text,
  actor text,
  actor_role text,
  created_at timestamptz not null default now()
);

create index if not exists app_notifications_user_id_idx on public.app_notifications(user_id);
create index if not exists app_notifications_created_at_idx on public.app_notifications(created_at);

alter table public.app_notifications enable row level security;

create policy allow_select_app_notifications on public.app_notifications for select using (true);
create policy allow_insert_app_notifications on public.app_notifications for insert with check (true);
create policy allow_update_app_notifications on public.app_notifications for update using (true) with check (true);
create policy allow_delete_app_notifications on public.app_notifications for delete using (true);

