-- ============================================================
-- Trust Cabbage — Supabase Schema
-- Run this entire file in Supabase SQL Editor (Dashboard)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends auth.users)
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  email         text not null,
  role          text not null default 'reviewer' check (role in ('reviewer', 'company_admin', 'admin')),
  company_id    uuid,
  reviewer_credibility_score int not null default 0,
  total_reviews_written      int not null default 0,
  created_at    timestamptz not null default now()
);

-- Categories
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references public.categories(id) on delete set null,
  icon        text,
  description text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Companies
create table if not exists public.companies (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  slug           text not null unique,
  description    text,
  logo_url       text,
  cover_url      text,
  website        text,
  founded_year   int,
  employee_count text,
  gst_number     text,
  cin_number     text,
  city           text,
  state          text,
  status         text not null default 'unclaimed' check (status in ('unclaimed', 'pending', 'claimed')),
  claimed_by     uuid references public.users(id) on delete set null,
  created_by     uuid references public.users(id) on delete set null,
  average_rating numeric(3,2) not null default 0,
  total_reviews  int not null default 0,
  is_featured    boolean not null default false,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Company ↔ Category (many-to-many)
create table if not exists public.company_categories (
  company_id  uuid not null references public.companies(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (company_id, category_id)
);

-- Products / Services
create table if not exists public.products_services (
  id          uuid primary key default uuid_generate_v4(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  description text,
  type        text not null check (type in ('product', 'service')),
  price_range text,
  image_url   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Reviews
create table if not exists public.reviews (
  id                   uuid primary key default uuid_generate_v4(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  reviewer_id          uuid not null references public.users(id) on delete cascade,
  product_service_id   uuid references public.products_services(id) on delete set null,
  association_type     text not null check (association_type in ('current_client','past_client','pilot','partner','vendor','evaluator')),
  reviewer_role        text not null check (reviewer_role in ('decision_maker','end_user','evaluator','procurement','other')),
  engagement_phase     text not null check (engagement_phase in ('pre_sales','onboarding','active','post_project','long_term')),
  association_duration text not null check (association_duration in ('lt_3m','3_12m','1_3y','3y_plus')),
  rating_overall       numeric(3,2) not null check (rating_overall between 1 and 5),
  rating_staff         int not null check (rating_staff between 1 and 5),
  rating_quality       int not null check (rating_quality between 1 and 5),
  rating_communication int not null check (rating_communication between 1 and 5),
  rating_billing       int not null check (rating_billing between 1 and 5),
  rating_after_sales   int not null check (rating_after_sales between 1 and 5),
  rating_delivery      int not null check (rating_delivery between 1 and 5),
  what_went_well       text,
  what_to_improve      text,
  would_recommend      text not null check (would_recommend in ('yes','no','conditional')),
  recommend_reason     text,
  additional_notes     text,
  is_verified_buyer    boolean not null default false,
  proof_document_url   text,
  status               text not null default 'published' check (status in ('pending','published','flagged','removed')),
  is_anonymous         boolean not null default false,
  helpful_votes        int not null default 0,
  submitter_ip         inet,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- One review per reviewer per company
  unique (company_id, reviewer_id)
);

-- Review responses (company replies)
create table if not exists public.review_responses (
  id           uuid primary key default uuid_generate_v4(),
  review_id    uuid not null references public.reviews(id) on delete cascade unique,
  company_id   uuid not null references public.companies(id) on delete cascade,
  responder_id uuid not null references public.users(id) on delete cascade,
  content      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Company claims
create table if not exists public.company_claims (
  id                  uuid primary key default uuid_generate_v4(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  claimant_id         uuid not null references public.users(id) on delete cascade,
  proof_type          text not null check (proof_type in ('gst','cin','domain_email','other')),
  proof_document_url  text,
  proof_notes         text,
  status              text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by         uuid references public.users(id) on delete set null,
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now()
);

-- Review flags
create table if not exists public.review_flags (
  id          uuid primary key default uuid_generate_v4(),
  review_id   uuid not null references public.reviews(id) on delete cascade,
  flagged_by  uuid not null references public.users(id) on delete cascade,
  reason      text not null,
  status      text not null default 'open' check (status in ('open','resolved')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_companies_slug on public.companies(slug);
create index if not exists idx_companies_status on public.companies(status);
create index if not exists idx_companies_featured on public.companies(is_featured);
create index if not exists idx_reviews_company on public.reviews(company_id);
create index if not exists idx_reviews_reviewer on public.reviews(reviewer_id);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists idx_categories_parent on public.categories(parent_id);

-- Full-text search on company name and description
create index if not exists idx_companies_fts on public.companies
  using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on public.companies
  for each row execute function update_updated_at();

create trigger reviews_updated_at before update on public.reviews
  for each row execute function update_updated_at();

create trigger review_responses_updated_at before update on public.review_responses
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER — recalculate company average_rating after review insert/update/delete
-- ============================================================

create or replace function recalculate_company_rating()
returns trigger language plpgsql security definer as $$
declare
  v_company_id uuid;
begin
  v_company_id := coalesce(new.company_id, old.company_id);

  update public.companies
  set
    average_rating = coalesce((
      select round(avg(rating_overall)::numeric, 2)
      from public.reviews
      where company_id = v_company_id and status = 'published'
    ), 0),
    total_reviews = (
      select count(*)
      from public.reviews
      where company_id = v_company_id and status = 'published'
    )
  where id = v_company_id;

  return coalesce(new, old);
end;
$$;

create trigger reviews_rating_update
after insert or update or delete on public.reviews
for each row execute function recalculate_company_rating();

-- ============================================================
-- TRIGGER — create public.users row on Supabase auth signup
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.categories enable row level security;
alter table public.company_categories enable row level security;
alter table public.products_services enable row level security;
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.company_claims enable row level security;
alter table public.review_flags enable row level security;

-- users
create policy "Public users read" on public.users for select using (true);
create policy "Users update own" on public.users for update using (auth.uid() = id);

-- categories
create policy "Public categories read" on public.categories for select using (is_active = true);
create policy "Admin manage categories" on public.categories for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- companies
create policy "Public companies read" on public.companies for select using (true);
create policy "Authenticated create company" on public.companies for insert with check (auth.uid() is not null);
create policy "Claimed company admin update" on public.companies for update using (
  claimed_by = auth.uid()
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- company_categories
create policy "Public read company_categories" on public.company_categories for select using (true);
create policy "Company admin manage company_categories" on public.company_categories for all using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.claimed_by = auth.uid()
  )
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- products_services
create policy "Public read products" on public.products_services for select using (is_active = true);
create policy "Company admin manage products" on public.products_services for all using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.claimed_by = auth.uid()
  )
  or exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- reviews
create policy "Public read published reviews" on public.reviews for select using (status = 'published');
create policy "Authenticated create review" on public.reviews for insert with check (
  auth.uid() is not null and reviewer_id = auth.uid()
);
create policy "Reviewer update own review within 24h" on public.reviews for update using (
  reviewer_id = auth.uid()
  and created_at > now() - interval '24 hours'
);
create policy "Admin manage reviews" on public.reviews for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- review_responses
create policy "Public read responses" on public.review_responses for select using (true);
create policy "Company admin create response" on public.review_responses for insert with check (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.claimed_by = auth.uid()
  )
);
create policy "Company admin update own response" on public.review_responses for update using (
  responder_id = auth.uid()
);

-- company_claims
create policy "Claimant read own claims" on public.company_claims for select using (claimant_id = auth.uid());
create policy "Authenticated create claim" on public.company_claims for insert with check (
  auth.uid() is not null and claimant_id = auth.uid()
);
create policy "Admin manage claims" on public.company_claims for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- review_flags
create policy "Authenticated create flag" on public.review_flags for insert with check (auth.uid() is not null);
create policy "Admin manage flags" on public.review_flags for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Run these in the Supabase dashboard Storage section, or via the API:
-- 1. company-logos    — public, 2MB limit, image/*
-- 2. claim-documents  — private, 5MB limit, image/* + application/pdf

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('company-logos',   'company-logos',   true,  2097152, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('claim-documents', 'claim-documents', false, 5242880, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

-- Storage policies
create policy "Public read company logos" on storage.objects for select
  using (bucket_id = 'company-logos');

create policy "Company admin upload logo" on storage.objects for insert
  with check (bucket_id = 'company-logos' and auth.uid() is not null);

create policy "Authenticated upload claim doc" on storage.objects for insert
  with check (bucket_id = 'claim-documents' and auth.uid() is not null);

create policy "Claimant read own claim doc" on storage.objects for select
  using (bucket_id = 'claim-documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED DATA — Categories
-- ============================================================

insert into public.categories (name, slug, icon, description, sort_order) values
  ('Digital Agency', 'digital-agency', '🎨', 'Web design, development, performance marketing, SEO, social media agencies', 1),
  ('SaaS / Software', 'saas-software', '💻', 'B2B SaaS products, enterprise software, cloud tools', 2),
  ('Logistics & Supply Chain', 'logistics-supply-chain', '📦', 'Freight, last-mile delivery, warehousing, 3PL providers', 3),
  ('Consulting', 'consulting', '🧠', 'Management consulting, strategy, IT consulting, business advisory', 4),
  ('Ecommerce Enablers', 'ecommerce-enablers', '🛒', 'Ecommerce platforms, marketplace aggregators, D2C enablement', 5),
  ('HR & Recruitment', 'hr-recruitment', '👥', 'Staffing agencies, HRMS, payroll, background verification', 6),
  ('Finance & Accounting', 'finance-accounting', '📊', 'CFO services, bookkeeping, tax, audit, compliance firms', 7),
  ('Legal Services', 'legal-services', '⚖️', 'Corporate law, IP, contracts, regulatory compliance', 8),
  ('Manufacturing', 'manufacturing', '🏭', 'Contract manufacturing, industrial equipment, raw material suppliers', 9),
  ('Healthcare & Pharma', 'healthcare-pharma', '🏥', 'Pharma distributors, healthcare IT, medical equipment', 10)
on conflict (slug) do nothing;
