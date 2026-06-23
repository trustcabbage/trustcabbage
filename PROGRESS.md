# Trust Cabbage — Progress

_Brief: Indian B2B review platform (Trustpilot for India). Next.js 16.2.9 App Router + Supabase + Tailwind v4 + shadcn/ui._

---

## Phase 1 — Core

### ✅ Done

**Database (Supabase) — schema run**
- Tables: `users`, `companies`, `categories`, `company_categories`, `products_services`, `reviews`, `review_responses`, `company_claims`, `review_flags`
- Triggers: auto `updated_at`, auto-recalculate `average_rating`/`total_reviews` on review changes, auto-create `public.users` row on auth signup
- RLS policies on all tables
- Full-text search index on companies (GIN)
- Storage buckets: `company-logos` (public), `claim-documents` (private)
- Seed: 10 categories

**Public pages**
- `/` — Hero search, category grid, featured companies, How it works
- `/categories` — All categories
- `/categories/[slug]` — Companies in category with sort chips
- `/search` — Full-text search results
- `/write-review` — **Entry point for all reviews**: search bar with live autocomplete, server-rendered results, "not found" CTA
- `/write-review/new` — **Create company stub + write first review** (6-step form starting with company details, then relationship → ratings → experience → proof → submit)
- `/company/[slug]` — SSR profile: hero, 6-factor rating breakdown, review list (top 10), sidebar, unclaimed banner, Schema.org JSON-LD, OG meta, canonical
- `/company/[slug]/write-review` — 6-step form for reviewing an existing company
- `/company/[slug]/claim` — Claim form: proof_type select, proof_notes, optional file upload → inserts `company_claims`
- `/company/[slug]/reviews` — Paginated all-reviews page (20/page) with pagination controls
- `/login` — Email OTP (signup + login in one flow)
- `/auth/callback` — Supabase auth code exchange (handles magic link redirect)

**Admin panel** (gated to `role = 'admin'`)
- `/admin/claims` — List all claims, approve (sets company status = claimed + claimed_by) / reject
- `/admin/reviews` — Moderation queue with status filter tabs, publish / remove actions
- `/admin/categories` — Subcategory tree view; create form supports parent_id + is_featured; activate/deactivate toggle
- `/admin/companies` — List with search + status filter; table shows logo, name, slug, city, rating, admin-seeded badge
- `/admin/companies/new` — Manual company creation form: all fields + category multi-select + logo upload + products/services (auto-generates slug)
- `/admin/companies/[id]/edit` — Edit existing company (pre-fills all fields)
- `/admin/companies/import` — CSV bulk import: template download, paste/upload CSV, preview with ✓/⚠/✗ validation, runs import sequentially

**Shared**
- Supabase client + server helpers, createServiceClient
- shadcn/ui components
- `StarRating`, `ReviewCard`, `RatingBreakdown`, `ReviewForm`, `ClaimForm`, `LoginForm`, Navbar, Footer
- `sitemap.ts`, `robots.ts`

**Supabase Storage**
- `claim-documents` — claim proof uploads + review proof uploads
- `review-proofs` — create this bucket in Supabase dashboard (private) for review proof uploads

---

### ❌ Remaining — Phase 1

**Category listing — sort & filter**
- `/categories/[slug]` has sort chips UI but they're not wired to actual query params yet
- Add: filter by city/state, verified-only toggle

---

## Known Gaps vs Brief — identified 22 Jun 2026

> Reference: `trust-cabbage-homepage-content.md` (shared by user). Cross-checked every page against brief.
> Homepage search (HomeSearch component) ✅ fully matches brief. `/search` results page is the gap.

### 🔴 Flow mismatches — wrong links (quick fixes)

- `/for-businesses` hero CTA "Claim your company page — free" → goes to `/search` (buyer page). Should go to `/for-businesses/add`
- `/for-businesses` Step 1 "Search my company" → goes to `/search`. Should go to `/for-businesses/add`
- Homepage For-Businesses band secondary CTA "Search if your company is already listed →" → goes to `/for-businesses`. Should go to `/for-businesses/add`
- `/categories/[slug]` empty state "Add a company" → goes to `/write-review`. Should go to `/for-businesses/add`
- Homepage featured company cards: `average_rating.toFixed(1)` has no null check — crashes if any featured company has no reviews (same bug fixed in `/search` page)

### 🔴 Footer — missing columns

Brief specifies 4 link columns. Currently only 3:
- **For Buyers** missing: "How reviews work" link
- **For Businesses** missing: "For business owners" (→ `/for-businesses`) and "Pricing"
- **Company column entirely missing**: About Trust Cabbage, Our review policy, Anti-fake review commitment, Blog, Contact us, Advertise with us

### 🟡 `/search` results page — structural gaps

Currently: flat company list + tag-matched companies. Brief requires:
- Tabs: Companies / Categories & Subcategories / Products & Services / #Tags
- Left sidebar filters: Rating, City/State, Verified only, Sort
- "Add this company" CTA on zero results (currently shows "Try a different search term")
- 1 sponsored result slot at top (Phase 3)

### 🟡 `/categories/[slug]` — missing card details + filters

- Company card missing: top 2 services, review excerpt (shows description instead), founded year
- Filters missing: City/State filter, Company size filter
- SEO content block at bottom — not built

### 🟡 `/company/[slug]` — missing sections

- Cover image (`cover_url` exists in DB/type but not rendered in hero)
- Tab navigation (Overview / Reviews / Products & Services / About) — currently single scrollable page
- Review sentiment summary (auto-generated from review text) — not built
- "Also consider" competitor sidebar cards — not built (Phase 3 / ad slot)
- Helpful votes on reviews — not built
- Review filter by: association type, service, date — only tag filter exists

### 🟢 Fully matches brief (no gaps)

- Homepage: all sections, search dropdown (5 sections), rotating placeholder, keyboard nav, trust signals, featured companies, recent reviews, stats, for-businesses CTA band
- `/for-businesses`: all 7 sections correct
- `/company/[slug]`: logo, badges, rating breakdown, reviews, tag filter, claim banner, Schema.org, OG meta
- `/write-review` and `/write-review/new`: correct (reviewer flow, not business flow)
- `/for-businesses/add`: search + OR + create form (restored)
- Admin panel: all pages built

---

## Phase 2 — Company tools (not started)
- Company dashboard: profile editing, products/services management, reply to reviews
- Review invite link + landing page (`/review/[slug]?ref=[token]`)
- Embeddable badge widget (pure JS)
- Bulk invite via CSV + Resend email
- WhatsApp share

## Phase 3 — Growth (not started)
- Analytics dashboard
- Razorpay subscription integration
- Featured listing / ads system
- Reviewer profile pages

---

## Environment variables
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY` — needed for Phase 2 (email invites)
- [ ] `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — needed for Phase 3
- [ ] `NEXT_PUBLIC_SITE_URL=https://trustcabbage.in` — set before deploying

## Supabase setup checklist
- [x] Schema run
- [x] `company-logos` bucket (public)
- [x] `claim-documents` bucket (private)
- [ ] `review-proofs` bucket (private) — create in dashboard for review proof uploads
- [ ] Set `role = 'admin'` on your user in `users` table to access `/admin/*`
