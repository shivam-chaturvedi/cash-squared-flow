-- Job title / role for invited employees (e.g. CEO, Co-Owner).
alter table public.business_employee_invites
  add column if not exists role text not null default 'Employee';

-- Backfill existing invites.
update public.business_employee_invites
set role = 'Employee'
where role is null or trim(role) = '';
