-- Adds preference fields to profiles so the app can store settings in Supabase.

alter table public.profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb,
  add column if not exists business_role text not null default 'Owner',
  add column if not exists business_watch_roles text[] not null default array[]::text[],
  add column if not exists business_watch_people text[] not null default array[]::text[];

