-- Shared connection between two people tracking shared IOUs.
create table if not exists public.personal_friend_connections (
  id uuid primary key default uuid_generate_v4(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid references auth.users(id) on delete set null,
  invitee_email text not null,
  invitee_name text not null,
  status text not null default 'pending' check (status in ('pending', 'active')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_friend_connections_inviter_idx
  on public.personal_friend_connections (inviter_user_id);
create index if not exists personal_friend_connections_invitee_email_idx
  on public.personal_friend_connections (invitee_email);
create unique index if not exists personal_friend_connections_inviter_email_uq
  on public.personal_friend_connections (inviter_user_id, lower(invitee_email));

create table if not exists public.personal_friend_invites (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references public.personal_friend_connections(id) on delete cascade,
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_name text not null,
  invitee_email text not null,
  status text not null default 'pending',
  claimed_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_friend_invites_connection_idx
  on public.personal_friend_invites (connection_id);

alter table public.personal_friends
  add column if not exists connection_id uuid references public.personal_friend_connections(id) on delete cascade,
  add column if not exists friend_user_id uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'active';

create unique index if not exists personal_friends_user_connection_uq
  on public.personal_friends (user_id, connection_id)
  where connection_id is not null;

alter table public.personal_friend_entries
  add column if not exists connection_id uuid references public.personal_friend_connections(id) on delete cascade,
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.personal_friend_activity_log (
  id uuid primary key default uuid_generate_v4(),
  connection_id uuid not null references public.personal_friend_connections(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists personal_friend_activity_log_connection_idx
  on public.personal_friend_activity_log (connection_id, created_at desc);

alter table public.personal_friend_connections enable row level security;
alter table public.personal_friend_invites enable row level security;
alter table public.personal_friend_activity_log enable row level security;

create policy allow_select_personal_friend_connections on public.personal_friend_connections for select using (true);
create policy allow_insert_personal_friend_connections on public.personal_friend_connections for insert with check (true);
create policy allow_update_personal_friend_connections on public.personal_friend_connections for update using (true) with check (true);

create policy allow_select_personal_friend_invites on public.personal_friend_invites for select using (true);
create policy allow_insert_personal_friend_invites on public.personal_friend_invites for insert with check (true);
create policy allow_update_personal_friend_invites on public.personal_friend_invites for update using (true) with check (true);

create policy allow_select_personal_friend_activity_log on public.personal_friend_activity_log for select using (true);
create policy allow_insert_personal_friend_activity_log on public.personal_friend_activity_log for insert with check (true);

-- Backfill connections for legacy friend rows.
insert into public.personal_friend_connections (inviter_user_id, invitee_email, invitee_name, status, accepted_at)
select pf.user_id, lower(pf.friend_email), pf.friend_name, 'active', pf.created_at
from public.personal_friends pf
where pf.connection_id is null
  and not exists (
    select 1 from public.personal_friend_connections c
    where c.inviter_user_id = pf.user_id
      and lower(c.invitee_email) = lower(pf.friend_email)
  );

update public.personal_friends pf
set connection_id = c.id,
    status = 'active'
from public.personal_friend_connections c
where pf.connection_id is null
  and c.inviter_user_id = pf.user_id
  and lower(c.invitee_email) = lower(pf.friend_email);

update public.personal_friend_entries e
set connection_id = pf.connection_id,
    created_by_user_id = coalesce(e.created_by_user_id, e.user_id)
from public.personal_friends pf
where e.connection_id is null
  and e.friend_id = pf.id;

-- Realtime for live collaboration.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'personal_friend_connections'
  ) then
    alter publication supabase_realtime add table public.personal_friend_connections;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'personal_friend_entries'
  ) then
    alter publication supabase_realtime add table public.personal_friend_entries;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'personal_friend_activity_log'
  ) then
    alter publication supabase_realtime add table public.personal_friend_activity_log;
  end if;
end $$;
