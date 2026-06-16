-- Remove unique (inviter, invitee email) constraint that blocks duplicate legacy rows.
drop index if exists public.personal_friend_connections_inviter_email_uq;
