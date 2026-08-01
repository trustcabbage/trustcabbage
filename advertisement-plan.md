# Advertisement System — Feature Plan

> Status: PLANNED (not built). Read alongside `brief.md` Phase 3 ("Featured listing / ads system" —
> this plan covers the "ads" half; "Featured listing" is the separate, already-built `is_featured`
> flag/sort/badge system, see PROGRESS.md Session 10).
> Written 1 Aug 2026.

## What this is (and isn't)

A paid promotional card/banner shown on the homepage and/or category pages, displaying a
company's product or service. **Completely disconnected from the review/rating system.**

- Does **not** change category sort order, search ranking, or the `is_featured` flag
- Reviews, ratings, and every organic listing stay exactly as they are today
- Renders in a clearly separate, labeled "Sponsored" slot — never mixed into organic results

This directly resolves a real tension: `about/page.tsx` publicly promises *"Not sponsored
listings. Not paid rankings."* That promise is about the **organic list** — this feature never
touches it. An ad is a distinct unit sitting beside/before the organic content, not a way to buy a
better position within it.

## Core decisions

1. **Ad ≠ Featured.** Two separate mechanisms, both reuse nothing from each other structurally.
   `is_featured` = boolean flag affecting sort order + badge. Ad campaign = a scheduled, paid,
   clearly-labeled promotional card in a fixed slot.
2. **Placement, not targeting.** v1 has exactly two placement types: `homepage` and `category`
   (scoped to one category via `category_id`). No keyword/audience targeting, no bidding.
3. **Can optionally reference a product.** An ad may point at an existing `products_services` row
   (auto-fills name/image) or be fully custom (headline/image/link the company supplies) — a B2B
   company promoting a general offering has no specific SKU to point at.
4. **No self-serve purchase in v1.** Razorpay isn't integrated yet (separate Phase 3 item). Ads are
   admin-created after a company requests one, mirroring how "Get Featured" works today (mailto
   stub → manual admin action). Self-serve checkout is a clean v2 addition once Razorpay exists —
   the data model below doesn't need to change for that, just add a purchase flow that writes the
   same `ad_campaigns` row.
5. **No impression/click tracking in v1.** Logging an event on every homepage/category page view
   conflicts with the caching approach used elsewhere (product widget, company widget) and adds
   real infra cost for a v1 that has no self-serve billing to justify it yet. Add later if/when
   advertisers ask for reporting.

## Data model

```sql
create table ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_service_id uuid references products_services(id) on delete set null, -- optional
  placement text not null check (placement in ('homepage', 'category')),
  category_id uuid references categories(id) on delete cascade, -- required if placement = 'category'
  title text not null,              -- headline shown on the card
  image_url text not null,
  target_url text not null,         -- their TC page, product page, or external site
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','active','rejected','expired')),
  payment_reference text,           -- Razorpay order/payment id, once that exists
  created_by uuid references users(id), -- admin who set it up
  created_at timestamptz not null default now()
);

-- constraint: category_id required when placement='category', null when 'homepage'
alter table ad_campaigns add constraint ad_campaigns_category_check
  check (
    (placement = 'category' and category_id is not null) or
    (placement = 'homepage' and category_id is null)
  );

create index on ad_campaigns (placement, category_id, status, starts_at, ends_at);
```

A campaign is "live" when `status = 'active' and now() between starts_at and ends_at` — computed
at query time, not stored. (`status = 'expired'` is set by a scheduled job or just computed
inline; either is fine, v1 can compute it in the query and skip the job.)

## Placement — exact insertion points (verified against current code, 1 Aug 2026)

### Homepage (`src/app/(public)/page.tsx`)
Insert a new `Sponsored` section **between the two "Browse by category" sections (ends line 241)
and "How it works" (starts line 244)** — or alternatively directly above the existing "Top B2B /
Top B2C Featured" sections (line 287) so paid placement sits above the organic-featured section,
which is the more defensible value proposition for an advertiser ("shown before our top organic
picks"). Recommend the latter.

Query: `ad_campaigns` where `placement='homepage'`, live, limit 3, ordered by `starts_at` (or
random rotation among live campaigns — simpler: just `order by starts_at desc limit 3`, v1 doesn't
need weighted rotation). Render as a small horizontal row of cards, explicitly labeled
`Sponsored` (not `Featured`, not blended with the "Top B2B/B2C" styling — different visual
treatment, e.g. a thin amber/neutral border and a small "Sponsored" tag, so it reads as
advertising, not editorial ranking).

### Category page (`src/app/(public)/categories/[slug]/page.tsx`)
Render as a **sidebar card**, not injected into the results grid — this is the design choice that
most clearly upholds the "not paid rankings" promise, since the organic company list (already
built: sort by rating/reviews/newest, feature/model filters) stays completely untouched. Insert
into the existing left sidebar (`aside`, currently holds "Browse subcategories" + "Filter by
state" boxes), as one more box: "Sponsored" label, product/company image, title, short pitch,
link. One live campaign per category shown at a time (query: `placement='category'`,
`category_id = this category's id`, live, `limit 1`).

## Admin workflow (v1, pre-Razorpay)

1. Company emails/requests an ad slot (reuse the existing "Get Featured" mailto pattern, or a
   short request form later — not required for v1)
2. Admin creates the row: `/admin/ads/new` (new admin page, mirrors `/admin/companies/new` form
   patterns) — picks company, placement, category (if applicable), optionally a product, uploads
   creative, sets date range, sets `status='active'`
3. `/admin/ads` list page (mirrors `/admin/claims` list pattern) — shows all campaigns, lets admin
   edit/deactivate early, filter by status/placement

## Build order (sessions)

| # | Deliverable |
|---|---|
| A | Migration: `ad_campaigns` table + constraint + index |
| B | Admin: `/admin/ads/new` (create) + `/admin/ads` (list/manage) |
| C | Homepage: Sponsored section, query + render, positioned above the Featured sections |
| D | Category page: Sponsored sidebar card, query + render |
| E | Later, not v1: self-serve purchase (Razorpay) once that Phase 3 item is built; impression/click tracking if advertisers request reporting |

## Explicitly out of scope for v1

- Self-serve checkout / payment
- Bidding, keyword targeting, audience targeting
- Impression/click analytics
- Multiple ad sizes/formats (v1 is one card shape per placement)
- Any interaction with `is_featured`, sort order, or search ranking
