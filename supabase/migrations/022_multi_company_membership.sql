-- 022: Multi-company accounts. Claiming a second company, or accepting a
-- team invite to one, no longer blocks or silently reassigns the account,
-- it grants additional access instead.
--
-- company_members is the durable record of every company a user can access.
-- users.company_id stays exactly what it always was: whichever company's
-- dashboard is currently "active" for that user, so every existing dashboard
-- page and server action keeps working completely unchanged. Switching which
-- company is active never touches company_members, so it can never cost a
-- user access to a company they still belong to.
--
-- A company can never lose its last member: the owner (companies.claimed_by)
-- is always a member and the app never allows removing the owner (see
-- dashboard/settings/_actions.ts removeTeamMember). Membership rows are only
-- ever added by claim approval or team-invite acceptance, and only ever
-- removed by an explicit, owner-only removal of a non-owner member.

create table if not exists company_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);

create index if not exists company_members_user_idx on company_members (user_id);
create index if not exists company_members_company_idx on company_members (company_id);

alter table company_members enable row level security;

drop policy if exists "Users read own memberships" on company_members;
create policy "Users read own memberships" on company_members
  for select using (user_id = auth.uid());

-- Backfill: every existing company_admin's current company becomes a
-- membership row, so multi-company support starts from a consistent state
-- instead of every existing admin appearing to have zero memberships.
insert into company_members (user_id, company_id)
select id, company_id from users
where role = 'company_admin' and company_id is not null
on conflict (user_id, company_id) do nothing;
