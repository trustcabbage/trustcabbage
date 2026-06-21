-- Run this in Supabase SQL editor after the initial schema.sql

-- Categories: add cover image, featured flag
alter table public.categories add column if not exists cover_image_url text;
alter table public.categories add column if not exists is_featured boolean not null default false;
alter table public.categories add column if not exists updated_at timestamptz not null default now();

-- Products/services: add features array, sort_order, admin flag
alter table public.products_services add column if not exists features text[] not null default '{}';
alter table public.products_services add column if not exists sort_order int not null default 0;
alter table public.products_services add column if not exists created_by_admin boolean not null default false;
alter table public.products_services add column if not exists updated_at timestamptz not null default now();

-- Companies: admin-seeded flag, tags
alter table public.companies add column if not exists created_by_admin boolean not null default false;
alter table public.companies add column if not exists tags text[] not null default '{}';
alter table public.companies add column if not exists long_description text;

-- RLS: allow admin to manage products on any company
drop policy if exists "Admin manage all products" on public.products_services;
create policy "Admin manage all products" on public.products_services for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- RLS: allow admin to manage reviews status
drop policy if exists "Admin manage reviews" on public.reviews;
create policy "Admin manage reviews" on public.reviews for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
