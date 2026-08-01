-- 016: Product slugs for public product pages (/company/[slug]/product/[slug]).
-- Unique per company (not globally), matching the category/company slug pattern.

alter table products_services add column if not exists slug text;

-- Backfill existing rows: slugify the name, de-dupe within each company by
-- appending row number where names collide.
with numbered as (
  select
    id,
    company_id,
    regexp_replace(regexp_replace(lower(trim(name)), '[^a-z0-9\s-]', '', 'g'), '\s+', '-', 'g') as base_slug,
    row_number() over (
      partition by company_id, regexp_replace(regexp_replace(lower(trim(name)), '[^a-z0-9\s-]', '', 'g'), '\s+', '-', 'g')
      order by created_at
    ) as rn
  from products_services
  where slug is null
)
update products_services ps
set slug = case when numbered.rn = 1 then numbered.base_slug else numbered.base_slug || '-' || numbered.rn end
from numbered
where ps.id = numbered.id;

create unique index if not exists products_services_company_slug_idx
  on products_services (company_id, slug) where slug is not null;
