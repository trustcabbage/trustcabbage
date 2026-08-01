# Analytics Dashboard — Feature Plan

> Status: v1 BUILT and live at `/dashboard/analytics` (31 Jul 2026). This doc covers what
> shipped, plus a planned expansion — none of the expansion items below are built yet.
> Written 1 Aug 2026. brief.md Phase 3 only had a one-line placeholder ("Analytics dashboard"),
> no spec existed before this — v1 below was built from scratch, not against a prior spec.

## What's live today (v1)

All computed from `reviews` scoped to the logged-in company admin's `company_id`,
`status = 'published'` only:

- **4 stat tiles** — total reviews, average rating, would-recommend %, total helpful votes
- **Reviews per month** — 12-month bar chart (pure CSS, no chart library)
- **Rating distribution** — 5★→1★ breakdown
- **Would recommend split** — Yes / Conditional / No
- **Review source breakdown** — Direct / Invite link / Widget / WhatsApp / Email — this is the
  main "which channel actually works" insight
- **Reviewer relationship** (B2B companies only) — Current client / Past client / Partner /
  Vendor / Evaluator breakdown

No chart library, no caching layer — computed inline per request. Fine at current volume; revisit
if a company's review count grows large enough that this becomes slow (denormalize into stat
columns updated by trigger, same pattern as `products_services.rating_avg`/`review_count`).

## Planned expansion (not built)

### 1. Sentiment/tag trends over time
**Why:** v1 shows what's true right now. A company can't see whether "slow delivery" complaints
are increasing or fading after they fixed something.

**Data already exists:** `review_tags` (review_id, tag_context, tag_id) + `tags` (name, slug,
type). The company page's `topSentimentTags` logic (`company/[slug]/page.tsx`) already computes a
single aggregate count per tag — this extends that into a **time series**: same tag, bucketed by
month, comparing e.g. last 3 months vs the 3 before that, to show trending up/down.

**Rendering:** small trend arrows next to each top tag ("fast-delivery ↑ 40%", "billing-issues ↓").

### 2. Competitor benchmarking
**Why:** a 4.2 rating means little without knowing whether that's good or bad for the category.

**Data already exists:** `company_categories`, `companies.average_rating`/`total_reviews`. The
company page's "Also Consider" competitor fetch (same-category companies, `total_reviews > 0`,
ordered by rating) already does 90% of this query.

**Design decision:** show the company's **percentile within their category** and the **category
average**, not a named leaderboard. Naming specific competitors by rating risks encouraging
companies to monitor/target rivals rather than improve their own service — an anonymized
"You rank in the top 20% of Payment Gateway companies (category avg: 3.8, you: 4.4)" gives the
same actionable signal without that downside.

### 3. Response rate tracking
**Why:** replying to reviews is a known trust signal, but there's currently no way for a company
to see how many reviews they've left unanswered.

**Data already exists:** `review_responses` (review_id, content, created_at). New stat:
`% of reviews with a reply`, plus a direct list of unanswered reviews (link straight to each,
reusing the existing `ReplyForm` component already on the company page).

### 4. Product-level analytics
**Why:** the Product Reviews API (see `product-reviews-plan.md`, Sessions A–E, built 31 Jul–1 Aug
2026) introduced per-product ratings and Q&A that the current company-wide analytics page doesn't
surface at all.

**Data already exists:** `products_services.rating_avg`/`review_count` (denormalized, migration
014), `product_questions`/`product_answers` (migration 017).

**New section on the existing analytics page:** a per-product table — rating, review count,
unanswered question count per product, sorted by review count. Doubles as a more useful version of
today's dashboard "N unanswered questions" alert (that alert has no dedicated list view, it just
links to the Products tab, see product-reviews-plan.md's Q&A status).

### 5. Product page-view tracking (scoped version of "company website analytics")

**Context — decided 1 Aug 2026:** user asked about tracking visitors on a company's *own* website
(pageviews, which pages, which products viewed). Full general-purpose site analytics (all pages,
traffic sources, funnels) was explicitly **rejected** as its own project — it duplicates mature
free tools (Google Analytics, Plausible, PostHog), needs a write-per-pageview ingestion pipeline
at a scale nothing else in this app operates at, and opens real privacy/consent questions since
it'd track visitors on a third-party domain, not trustcabbage.com. **User chose the scoped
version:** view counts for product pages only, reusing the product widget already built.

**Why this is cheap where general analytics isn't:** it doesn't need a new script, a new
integration step from the company, or a new consent surface. It rides entirely on the **existing**
`/api/widget/product/[slug].js` display-mode widget (`product-reviews-plan.md` Session E) — any
company that has already embedded that widget for reviews gets view tracking for free, with zero
extra setup.

**Schema (new migration, e.g. 018):**
```sql
alter table products_services add column if not exists view_count integer not null default 0;
```
(Same denormalization pattern as `rating_avg`/`review_count` from migration 014 — a plain counter,
not an events table. No per-visitor row, no timestamp log in v1 — see "accuracy tradeoff" below.)

**How a view gets counted — the one real design decision:**
The widget's `product-data` GET endpoint is `Cache-Control: public, s-maxage=3600` (deliberately,
to keep cost near zero — see the Infrastructure cost model in `product-reviews-plan.md`). That
means repeat visits within the same cache window never re-hit the origin function, so counting
inside that route would **undercount** real traffic (only the first visitor per cache period per
edge location triggers it).

Fix: the widget script's `display` mode already runs in every visitor's browser regardless of
whether the *data* fetch was a cache hit. Add one extra call there —
`navigator.sendBeacon('/api/widget/product-view-ping', { product_id })` — a separate, tiny,
uncached, fire-and-forget endpoint whose entire job is
`update products_services set view_count = view_count + 1 where ...`. No new row, no logging
table, no auth (view counts aren't sensitive). This is still "a write per pageview," but scoped
only to pages where the company already chose to embed the widget — not site-wide — which is what
keeps it bounded and cheap rather than repeating the general-analytics cost problem.

**Surfacing it:** add "Views" next to "Reviews" in the item-4 per-product table above —
`1,240 views · 12 reviews · 0.97% conversion`. That conversion number is the actual payoff: not
raw traffic, but "how many people who saw this product were convinced enough to review it,"
which is a metric no generic analytics tool packages for this specific context.

**v1.5, later, only if asked:** a monthly-bucketed `product_view_monthly (product_id, year_month,
count)` table (upsert-increment per ping) to drive a views trend chart, reusing the exact 12-month
bar chart component already built for "Reviews per month." Not in v1 — a lifetime counter is
enough to prove the feature out before adding a time dimension.

## Build order (sessions, not started)

| # | Deliverable |
|---|---|
| A | Sentiment/tag trend time-series section |
| B | Competitor percentile/category-average section |
| C | Response rate stat + unanswered-reviews list |
| D | Product-level analytics table (ties into Product Reviews API) |
| E | Product page-view tracking — migration 018, widget ping endpoint, view/conversion column |

## Explicitly out of scope

- Exportable reports (CSV/PDF) — not requested, add if asked
- Cross-company/admin-level analytics (this doc is company-facing only)
- Real-time/live updates — page already recomputes on every load, no need for websockets etc.
- **Full general-purpose site analytics** (all pages, traffic sources, funnels, click tracking) —
  explicitly considered and rejected 1 Aug 2026. Would need a write-per-pageview ingestion
  pipeline at a scale nothing else here operates at, a time-series-suited storage engine (not
  general Postgres), real privacy/consent work (tracking visitors on a third-party domain), and it
  duplicates mature free tools (Google Analytics, Plausible, PostHog). Item 5 above is the scoped
  version that was approved instead.
