-- Run after 003_features.sql

-- ─── Table ───────────────────────────────────────────────────────────────────

create table if not exists public.business_models (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Add FK on companies (one model per company, nullable)
alter table public.companies
  add column if not exists business_model_id uuid references public.business_models(id) on delete set null;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.business_models enable row level security;

create policy "Public read business_models" on public.business_models for select using (true);
drop policy if exists "Admin manage business_models" on public.business_models;
create policy "Admin manage business_models" on public.business_models for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ─── Seed: Common B2B business models ────────────────────────────────────────

insert into public.business_models (name, slug, description, sort_order) values
  ('SaaS Platform',        'saas-platform',        'Software delivered as a subscription service over the internet', 1),
  ('Payment Aggregator',   'payment-aggregator',   'Aggregates multiple payment methods under one integration', 2),
  ('Account Aggregator',   'account-aggregator',   'Fetches and consolidates financial data from multiple institutions', 3),
  ('Marketplace',          'marketplace',          'Multi-sided platform connecting buyers and sellers', 4),
  ('Agency',               'agency',               'Service-based firm delivering work on behalf of clients', 5),
  ('Consultancy',          'consultancy',          'Advisory firm providing expert guidance and strategy', 6),
  ('Bank',                 'bank',                 'Licensed banking institution', 7),
  ('NBFC',                 'nbfc',                 'Non-Banking Financial Company regulated by RBI', 8),
  ('3PL Provider',         '3pl-provider',         'Third-party logistics and fulfillment provider', 9),
  ('Neobank',              'neobank',              'Digital-only bank operating without physical branches', 10),
  ('Infrastructure Provider', 'infrastructure-provider', 'Provides underlying technical or financial infrastructure', 11),
  ('Managed Service Provider', 'managed-service-provider', 'Remotely manages IT infrastructure and services', 12),
  ('Reseller / Distributor', 'reseller-distributor', 'Resells or distributes products from other vendors', 13),
  ('Manufacturer',         'manufacturer',         'Produces physical goods or hardware', 14),
  ('Freelancer / Solo',    'freelancer-solo',      'Individual professional offering services independently', 15)
on conflict (slug) do nothing;
