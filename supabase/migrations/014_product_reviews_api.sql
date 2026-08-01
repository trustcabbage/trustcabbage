-- 014: Product Reviews API foundation
-- API keys on companies, external product auto-registration, API invite logs,
-- denormalized product rating aggregates.

-- ── 1. API keys on companies ────────────────────────────────────────────────
-- Plaintext key is shown once at generation; only the SHA-256 hash is stored.
alter table companies add column if not exists api_key_hash text;
alter table companies add column if not exists api_key_prefix text;
alter table companies add column if not exists api_key_created_at timestamptz;

create unique index if not exists companies_api_key_hash_idx
  on companies (api_key_hash) where api_key_hash is not null;

-- ── 2. External product auto-registration ───────────────────────────────────
-- Companies pass their own SKU/product-id in the widget/API; we auto-create
-- a products_services row on first sight, keyed by (company_id, external_id).
alter table products_services add column if not exists external_id text;
alter table products_services add column if not exists auto_created boolean not null default false;
alter table products_services add column if not exists rating_avg numeric not null default 0;
alter table products_services add column if not exists review_count integer not null default 0;

create unique index if not exists products_services_company_external_idx
  on products_services (company_id, external_id) where external_id is not null;

-- ── 3. API invite logs ──────────────────────────────────────────────────────
create table if not exists api_invite_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_service_id uuid references products_services(id) on delete set null,
  customer_email text not null,
  order_id text,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  resend_id text,
  sent_at timestamptz not null default now()
);

create index if not exists api_invite_logs_company_idx on api_invite_logs (company_id, sent_at desc);
-- Dedup: one successful invite per (company, order, email)
create unique index if not exists api_invite_logs_dedup_idx
  on api_invite_logs (company_id, order_id, customer_email)
  where order_id is not null and status = 'sent';

alter table api_invite_logs enable row level security;

-- Company admins can read their own logs (writes happen via service role only)
drop policy if exists "Company admins read own api invite logs" on api_invite_logs;
create policy "Company admins read own api invite logs" on api_invite_logs
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid()
        and u.role = 'company_admin'
        and u.company_id = api_invite_logs.company_id
    )
  );

-- ── 4. Keep product aggregates fresh ────────────────────────────────────────
-- Trigger: on review insert/update/delete with product_service_id, recompute
-- that product's rating_avg + review_count from published reviews.
create or replace function refresh_product_rating() returns trigger as $$
declare
  pid uuid;
begin
  pid := coalesce(new.product_service_id, old.product_service_id);
  if pid is null then
    return coalesce(new, old);
  end if;

  update products_services ps set
    rating_avg = coalesce((
      select round(avg(r.rating_overall)::numeric, 2)
      from reviews r
      where r.product_service_id = pid and r.status = 'published'
    ), 0),
    review_count = (
      select count(*)
      from reviews r
      where r.product_service_id = pid and r.status = 'published'
    )
  where ps.id = pid;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists trg_refresh_product_rating on reviews;
create trigger trg_refresh_product_rating
  after insert or update of status, rating_overall, product_service_id or delete
  on reviews
  for each row execute function refresh_product_rating();
