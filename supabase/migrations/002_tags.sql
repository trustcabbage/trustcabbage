-- Run in Supabase SQL editor after 001_admin_features.sql

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.tags (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  canonical_id    uuid references public.tags(id) on delete set null,
  type            text not null default 'general' check (type in ('service', 'sentiment', 'technology', 'general')),
  usage_count     int not null default 0,
  is_admin_verified boolean not null default false,
  created_at      timestamptz not null default now()
);

create table if not exists public.tag_synonyms (
  id                  uuid primary key default gen_random_uuid(),
  canonical_tag_id    uuid not null references public.tags(id) on delete cascade,
  alias_name          text not null unique,
  created_by_admin_id uuid references public.users(id),
  created_at          timestamptz not null default now()
);

create table if not exists public.company_tags (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  tag_id           uuid not null references public.tags(id) on delete cascade,
  added_by         text not null default 'reviewer' check (added_by in ('admin', 'company', 'reviewer')),
  added_by_user_id uuid references public.users(id),
  created_at       timestamptz not null default now(),
  unique(company_id, tag_id)
);

create table if not exists public.review_tags (
  id          uuid primary key default gen_random_uuid(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  tag_context text not null default 'general' check (tag_context in ('service', 'sentiment', 'general')),
  created_at  timestamptz not null default now(),
  unique(review_id, tag_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.tags enable row level security;
alter table public.tag_synonyms enable row level security;
alter table public.company_tags enable row level security;
alter table public.review_tags enable row level security;

-- tags
create policy "Public read tags" on public.tags for select using (true);
drop policy if exists "Authenticated create tags" on public.tags;
create policy "Authenticated create tags" on public.tags for insert with check (auth.uid() is not null);
drop policy if exists "Admin manage tags" on public.tags;
create policy "Admin manage tags" on public.tags for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- tag_synonyms
create policy "Public read tag_synonyms" on public.tag_synonyms for select using (true);
drop policy if exists "Admin manage tag_synonyms" on public.tag_synonyms;
create policy "Admin manage tag_synonyms" on public.tag_synonyms for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- company_tags
create policy "Public read company_tags" on public.company_tags for select using (true);
drop policy if exists "Authenticated add company_tags" on public.company_tags;
create policy "Authenticated add company_tags" on public.company_tags for insert with check (auth.uid() is not null);
drop policy if exists "Admin manage company_tags" on public.company_tags;
create policy "Admin manage company_tags" on public.company_tags for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- review_tags
create policy "Public read review_tags" on public.review_tags for select using (true);
drop policy if exists "Authenticated add review_tags" on public.review_tags;
create policy "Authenticated add review_tags" on public.review_tags for insert with check (auth.uid() is not null);
drop policy if exists "Admin manage review_tags" on public.review_tags;
create policy "Admin manage review_tags" on public.review_tags for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ─── Seed: Service tags ───────────────────────────────────────────────────────

insert into public.tags (name, slug, type, is_admin_verified) values
  ('Payment Gateway',       'payment-gateway',       'service', true),
  ('UPI',                   'upi',                   'service', true),
  ('Payment Links',         'payment-links',         'service', true),
  ('POS Machine',           'pos-machine',           'service', true),
  ('Payout',                'payout',                'service', true),
  ('Web Development',       'web-development',       'service', true),
  ('Ecommerce Development', 'ecommerce-development', 'service', true),
  ('Mobile App',            'mobile-app',            'service', true),
  ('SEO',                   'seo',                   'service', true),
  ('Performance Marketing', 'performance-marketing', 'service', true),
  ('Social Media',          'social-media',          'service', true),
  ('Content Marketing',     'content-marketing',     'service', true),
  ('Accounting',            'accounting',            'service', true),
  ('GST Filing',            'gst-filing',            'service', true),
  ('Logistics',             'logistics',             'service', true),
  ('Last Mile Delivery',    'last-mile-delivery',    'service', true),
  ('Freight',               'freight',               'service', true),
  ('Warehousing',           'warehousing',           'service', true),
  ('HRMS',                  'hrms',                  'service', true),
  ('Payroll',               'payroll',               'service', true),
  ('Recruitment',           'recruitment',           'service', true),
  ('Cloud Hosting',         'cloud-hosting',         'service', true),
  ('Cybersecurity',         'cybersecurity',         'service', true),
  ('ERP',                   'erp',                   'service', true),
  ('Logo Design',           'logo-design',           'service', true),
  ('Video Production',      'video-production',      'service', true),
  ('Legal Compliance',      'legal-compliance',      'service', true),
  ('Company Registration',  'company-registration',  'service', true),
  ('Trademark',             'trademark',             'service', true)
on conflict (slug) do nothing;

-- ─── Seed: Sentiment tags ─────────────────────────────────────────────────────

insert into public.tags (name, slug, type, is_admin_verified) values
  ('Satisfied',                  'satisfied',                   'sentiment', true),
  ('Recommended',                'recommended',                 'sentiment', true),
  ('Good Value',                 'good-value',                  'sentiment', true),
  ('Great Support',              'great-support',               'sentiment', true),
  ('Fast Delivery',              'fast-delivery',               'sentiment', true),
  ('Professional',               'professional',                'sentiment', true),
  ('Transparent',                'transparent',                 'sentiment', true),
  ('Reliable',                   'reliable',                    'sentiment', true),
  ('Disappointed',               'disappointed',                'sentiment', true),
  ('Poor Support',               'poor-support',                'sentiment', true),
  ('Overpriced',                 'overpriced',                  'sentiment', true),
  ('Slow Delivery',              'slow-delivery',               'sentiment', true),
  ('Pathetic',                   'pathetic',                    'sentiment', true),
  ('Unprofessional',             'unprofessional',              'sentiment', true),
  ('Misleading',                 'misleading',                  'sentiment', true),
  ('Not Recommended',            'not-recommended',             'sentiment', true),
  ('Average Experience',         'average-experience',          'sentiment', true),
  ('Good Product Poor Support',  'good-product-poor-support',   'sentiment', true),
  ('Satisfied with Product',     'satisfied-with-product',      'sentiment', true),
  ('Ongoing Issue',              'ongoing-issue',               'sentiment', true)
on conflict (slug) do nothing;

-- ─── Seed: Technology tags ────────────────────────────────────────────────────

insert into public.tags (name, slug, type, is_admin_verified) values
  ('React JS',      'react-js',      'technology', true),
  ('Node JS',       'node-js',       'technology', true),
  ('PHP',           'php',           'technology', true),
  ('WordPress',     'wordpress',     'technology', true),
  ('Shopify',       'shopify',       'technology', true),
  ('WooCommerce',   'woocommerce',   'technology', true),
  ('AWS',           'aws',           'technology', true),
  ('Google Cloud',  'google-cloud',  'technology', true),
  ('Python',        'python',        'technology', true),
  ('Flutter',       'flutter',       'technology', true),
  ('React Native',  'react-native',  'technology', true)
on conflict (slug) do nothing;

-- ─── Seed: Synonyms ───────────────────────────────────────────────────────────

insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'payment-gateways'   from public.tags where slug = 'payment-gateway'   on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'online-payment'     from public.tags where slug = 'payment-gateway'   on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'checkout-solution'  from public.tags where slug = 'payment-gateway'   on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'upi-integration'    from public.tags where slug = 'upi'               on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'upi-payments'       from public.tags where slug = 'upi'               on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'reactjs'            from public.tags where slug = 'react-js'          on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'react'              from public.tags where slug = 'react-js'          on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'ecommerce-website'  from public.tags where slug = 'ecommerce-development' on conflict (alias_name) do nothing;
insert into public.tag_synonyms (canonical_tag_id, alias_name)
select id, 'mobile-application' from public.tags where slug = 'mobile-app'        on conflict (alias_name) do nothing;
