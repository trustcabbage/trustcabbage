-- Run after 002_tags.sql

-- ─── Tables ──────────────────────────────────────────────────────────────────

create table if not exists public.features (
  id             uuid primary key default gen_random_uuid(),
  subcategory_id uuid not null references public.categories(id) on delete cascade,
  name           text not null,
  slug           text not null,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  unique(subcategory_id, slug)
);

create table if not exists public.company_features (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(company_id, feature_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.features enable row level security;
alter table public.company_features enable row level security;

create policy "Public read features" on public.features for select using (true);
drop policy if exists "Admin manage features" on public.features;
create policy "Admin manage features" on public.features for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Public read company_features" on public.company_features for select using (true);
drop policy if exists "Admin manage company_features" on public.company_features;
create policy "Admin manage company_features" on public.company_features for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
drop policy if exists "Authenticated add company_features" on public.company_features;
create policy "Authenticated add company_features" on public.company_features for insert with check (auth.uid() is not null);
