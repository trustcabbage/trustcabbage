-- 018: Service Desk — company-initiated post-sales feedback & complaint
-- resolution, publicly visible. See feedback-resolution-plan.md.
--
-- Visibility model: complaints get publish_at = created_at + 72h (grace
-- window); public reads filter on publish_at <= now(), so publication flips
-- live with no cron. Feedback publishes immediately. Customer-side writes go
-- through token-validated server actions using the service role; there are
-- deliberately NO insert/update policies on cases/events for normal clients.

-- ── 1. service_requests ─────────────────────────────────────────────────────
create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_service_id uuid references products_services(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  purchase_date date,
  order_ref text,
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  status text not null default 'invited'
    check (status in ('invited', 'failed', 'opened', 'submitted', 'expired')),
  sent_by uuid references users(id) on delete set null,
  resend_id text,
  created_at timestamptz not null default now()
);

create index if not exists service_requests_company_idx
  on service_requests (company_id, created_at desc);

-- One request per (company, order, customer); omit order_ref to re-send.
create unique index if not exists service_requests_dedup_idx
  on service_requests (company_id, order_ref, customer_email)
  where order_ref is not null;

-- ── 2. service_cases ────────────────────────────────────────────────────────
create table if not exists service_cases (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references service_requests(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  product_service_id uuid references products_services(id) on delete set null,
  type text not null check (type in ('feedback', 'complaint')),
  category text,
  satisfaction int check (satisfaction between 1 and 5),
  title text not null,
  body text not null,
  expected_resolution text,
  status text not null default 'open'
    check (status in ('open', 'resolution_offered', 'resolved', 'unresolved')),
  resolution_summary text,
  customer_display text not null,
  publish_at timestamptz not null,
  created_at timestamptz not null default now(),
  first_company_reply_at timestamptz,
  resolution_offered_at timestamptz,
  resolved_at timestamptz
);

create index if not exists service_cases_company_idx
  on service_cases (company_id, created_at desc);
create index if not exists service_cases_product_idx
  on service_cases (product_service_id) where product_service_id is not null;

-- ── 3. service_case_events ──────────────────────────────────────────────────
create table if not exists service_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references service_cases(id) on delete cascade,
  author text not null check (author in ('company', 'customer')),
  kind text not null check (kind in ('reply', 'resolution_offer', 'customer_confirm', 'customer_decline')),
  body text,
  created_at timestamptz not null default now()
);

create index if not exists service_case_events_case_idx
  on service_case_events (case_id, created_at asc);

-- ── 4. RLS ──────────────────────────────────────────────────────────────────
alter table service_requests enable row level security;
alter table service_cases enable row level security;
alter table service_case_events enable row level security;

-- Requests contain raw customer PII: owning company admins only.
drop policy if exists "Company admins read own service requests" on service_requests;
create policy "Company admins read own service requests" on service_requests
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role = 'company_admin'
        and u.company_id = service_requests.company_id
    )
  );

drop policy if exists "Company admins create service requests" on service_requests;
create policy "Company admins create service requests" on service_requests
  for insert to authenticated with check (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role = 'company_admin'
        and u.company_id = service_requests.company_id
    )
  );

-- Delivery bookkeeping (status/resend_id) is written back by the same
-- dashboard action that created the row.
drop policy if exists "Company admins update own service requests" on service_requests;
create policy "Company admins update own service requests" on service_requests
  for update using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role = 'company_admin'
        and u.company_id = service_requests.company_id
    )
  );

-- Cases: public once publish_at passes; the owning company sees them always.
drop policy if exists "Public read published service cases" on service_cases;
create policy "Public read published service cases" on service_cases
  for select using (publish_at <= now());

drop policy if exists "Company admins read own service cases" on service_cases;
create policy "Company admins read own service cases" on service_cases
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role = 'company_admin'
        and u.company_id = service_cases.company_id
    )
  );

drop policy if exists "Public read events of published cases" on service_case_events;
create policy "Public read events of published cases" on service_case_events
  for select using (
    exists (
      select 1 from service_cases c
      where c.id = service_case_events.case_id
        and c.publish_at <= now()
    )
  );

drop policy if exists "Company admins read own case events" on service_case_events;
create policy "Company admins read own case events" on service_case_events
  for select using (
    exists (
      select 1 from service_cases c
      join users u on u.company_id = c.company_id
      where c.id = service_case_events.case_id
        and u.id = auth.uid()
        and u.role = 'company_admin'
    )
  );

-- ── 5. Company service stats (denormalized, complaints only) ────────────────
alter table companies add column if not exists service_complaints_total integer not null default 0;
alter table companies add column if not exists service_resolved_total integer not null default 0;
alter table companies add column if not exists service_avg_resolution_hours numeric;
alter table companies add column if not exists service_avg_first_reply_hours numeric;

create or replace function refresh_company_service_stats() returns trigger as $$
declare
  cid uuid;
begin
  cid := coalesce(new.company_id, old.company_id);

  update companies co set
    service_complaints_total = (
      select count(*) from service_cases c
      where c.company_id = cid and c.type = 'complaint'
    ),
    service_resolved_total = (
      select count(*) from service_cases c
      where c.company_id = cid and c.type = 'complaint' and c.status = 'resolved'
    ),
    service_avg_resolution_hours = (
      select round(avg(extract(epoch from (c.resolved_at - c.created_at)) / 3600)::numeric, 1)
      from service_cases c
      where c.company_id = cid and c.type = 'complaint' and c.resolved_at is not null
    ),
    service_avg_first_reply_hours = (
      select round(avg(extract(epoch from (c.first_company_reply_at - c.created_at)) / 3600)::numeric, 1)
      from service_cases c
      where c.company_id = cid and c.type = 'complaint' and c.first_company_reply_at is not null
    )
  where co.id = cid;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_refresh_company_service_stats on service_cases;
create trigger trg_refresh_company_service_stats
  after insert or update of status, resolved_at, first_company_reply_at or delete
  on service_cases
  for each row execute function refresh_company_service_stats();

-- ── 6. Allow 'service' as a review source ───────────────────────────────────
alter table reviews drop constraint if exists reviews_review_source_check;
alter table reviews add constraint reviews_review_source_check
  check (review_source in ('link', 'whatsapp', 'email', 'qr', 'widget', 'organic', 'service'));
