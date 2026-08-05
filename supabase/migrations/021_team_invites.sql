-- 021: Company team invites. A company can already have multiple
-- company_admin users sharing one company_id, nothing in the schema limited
-- that to one person, only the UI to invite additional teammates was missing.
--
-- The original claimant (companies.claimed_by) is treated as the account
-- owner: only they can invite or remove teammates. Everyone with
-- role='company_admin' and this company_id has equal dashboard access
-- otherwise.

create table if not exists company_team_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists company_team_invites_company_idx
  on company_team_invites (company_id, status);

-- One live pending invite per (company, email); re-inviting replaces it
-- rather than erroring (handled in the server action, which deletes any
-- existing pending row for that email first).
create unique index if not exists company_team_invites_pending_idx
  on company_team_invites (company_id, email) where status = 'pending';

alter table company_team_invites enable row level security;

-- Read-only for the team to see: writes (create/revoke/accept) all go through
-- server actions using the admin client after an explicit ownership or
-- identity check in application code, the same pattern used for claim
-- approval and Service Desk cases, so no insert/update policy is needed here.
drop policy if exists "Company admins read own team invites" on company_team_invites;
create policy "Company admins read own team invites" on company_team_invites
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role = 'company_admin'
        and u.company_id = company_team_invites.company_id
    )
  );
