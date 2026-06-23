# Trust Cabbage — Claude Code Project Brief

## What we are building

Trust Cabbage is an Indian B2B review and discovery platform — think Trustpilot but designed specifically for Indian B2B service companies (agencies, SaaS, logistics, consulting, ecommerce enablers, etc.). The core idea: any user can create a company page, reviewers write detailed multi-factor reviews, and businesses can claim their page to manage it. Company pages are SEO-indexed so they appear in Google when someone searches a company name.

---

## Tech stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16.2.9 (App Router) | SSR for SEO on company pages, single codebase |
| Database | Supabase (Postgres) | Auth, RLS, storage, real-time, full-text search |
| Auth | Supabase Auth | OTP/magic link for reviewers |
| Hosting | Vercel | Native Next.js support, edge caching |
| Email | Resend | Review invites, OTP, notifications |
| Payments | Razorpay | Indian market, subscription plans |
| Storage | Supabase Storage | Company logos, proof-of-ownership docs |
| Styling | Tailwind CSS v4 | Utility-first |
| UI Components | shadcn/ui + Base UI | Headless, accessible |

---

## Design system

> Original brand color was `#F06105` (orange). Migrated to violet in Session 4. CODEBASE.md has the canonical token list. Values below reflect actual implementation.

- Font: Pontano Sans (`next/font/google`, variable `--font-sans`)
- Primary purple: `#6d28d9` | Primary hover: `#7c3aed`
- Dark nav/hero bg: `#1e1b4b` | Violet accent: `#a78bfa`
- Page background: `bg-slate-50`
- Navbar: `bg-[#1e1b4b]` (dark plum)
- Headings: `font-black` (900)
- Cards: `bg-white rounded-xl border border-slate-200 shadow-sm p-6`
- Primary button: `rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm`
- Footer: `bg-slate-950`
- Step indicators — active: `bg-[#6d28d9] text-white` | past: `bg-violet-100 text-[#6d28d9]` | future: `bg-slate-100 text-slate-400`

---

## Data architecture (CRITICAL)

**All data must load server-side from the database using URL query parameters. No client-side data fetching, no useState for data, no useEffect for fetching.**

- All list/filter/sort/pagination state lives in URL search params
- Server Components read `searchParams` and query Supabase directly
- Filters and sort chips use `<Link>` tags that update URL — no onClick state
- Pagination uses `<Link>` tags with `?page=N`
- Client Components are ONLY used for: multi-step forms, file uploads, OTP flow, star rating input, live autocomplete
- Client Components receive their data as props from the parent Server Component — they never fetch independently

---

## User roles

### 1. Visitor (unauthenticated)
- Browse categories and company listings
- View company pages and read reviews
- Search companies by name

### 2. Reviewer (authenticated via OTP/email)
- Write reviews for any company (existing or new)
- Create a company stub page when writing first review for an unknown company
- One review per company per reviewer

### 3. Business (company account)
- Claim a company page (admin approval required)
- Manage profile, products, services
- Reply publicly to reviews
- Send review invites via link / widget / CSV bulk
- View analytics dashboard

### 4. Admin (internal Trust Cabbage team)
- Manage categories
- Approve/reject company claim requests
- Moderate flagged reviews

---

## Core data models

### companies
```
id, name, slug, description, logo_url, cover_url, website, founded_year,
employee_count, gst_number, cin_number, city, state,
status (unclaimed | pending | claimed),
business_type (business_services | online_b2c | retail_chain | both) NOT NULL default business_services,
claimed_by (user_id FK), created_by (user_id FK), created_at, updated_at,
average_rating, total_reviews, is_featured, is_verified, plan
```

### categories
```
id, name, slug, parent_id (nullable), icon, description, sort_order,
is_active, is_featured, platform_type (b2b | b2c | both, default b2b), created_at
```

### company_categories (many-to-many)
```
company_id, category_id
```

### products_services
```
id, company_id, name, description, type (product | service), price_range, is_active, created_at
```

### reviews
```
id, company_id, reviewer_id, product_service_id (nullable),
review_type (b2b | b2c),
status (pending | published | flagged | removed),
rating_overall, is_anonymous, helpful_votes,
what_went_well, what_to_improve, additional_notes,
would_recommend (yes | conditional | no), recommend_reason,
proof_document_url, ref_token, review_source,
created_at, updated_at,

-- B2B only (nullable since migration 010):
association_type (current_client | past_client | pilot | partner | vendor | evaluator),
reviewer_role (decision_maker | end_user | evaluator | procurement | other),
engagement_phase (pre_sales | onboarding | active | post_project | long_term),
association_duration (lt_3m | 3_12m | 1_3y | 3y_plus),
rating_staff, rating_quality, rating_communication,
rating_billing, rating_after_sales, rating_delivery,

-- B2C only:
purchase_type (first_time | repeat | gifting),
order_value_range (under_500 | 500_2000 | 2000_5000 | above_5000),
discovery_channel (instagram | google | friend | youtube | other),
purchase_channel (online | in_store | both),
would_buy_again (yes | maybe | no),
product_photo_url,
rating_product_accuracy, rating_packaging, rating_delivery_speed,
rating_return_refund, rating_value_for_money, rating_customer_support,

-- Retail in-store (nullable unless purchase_channel includes in_store):
rating_store_experience, rating_staff_in_store
```

### company_claims
```
id, company_id, claimant_id,
proof_type (gst | cin | domain_email | other),
proof_document_url, proof_notes,
status (pending | approved | rejected),
reviewed_by, reviewed_at, created_at
```

### users (extends Supabase auth.users)
```
id, display_name, avatar_url, email,
role (reviewer | company_admin | admin),
company_id (nullable), reviewer_credibility_score, total_reviews_written, created_at
```

---

## Page structure (current)

```
app/
├── (public)/
│   ├── page.tsx                          ← Homepage: search + featured categories
│   ├── search/page.tsx                   ← Search results (?q=)
│   ├── categories/page.tsx               ← All categories
│   ├── categories/[slug]/page.tsx        ← Category listing (?sort=&verified=1)
│   ├── tags/[slug]/page.tsx              ← Tag listing
│   ├── write-review/
│   │   ├── page.tsx                      ← "Who are you reviewing?" — search bar + results
│   │   └── new/page.tsx                  ← 7-step: BusinessType → create company stub → B2B review
│   ├── review/[slug]/page.tsx            ← Single review permalink
│   ├── for-businesses/
│   │   ├── page.tsx                      ← Marketing landing page (7 sections)
│   │   └── add/page.tsx                  ← Auth-gated. Search + Claim OR create company stub
│   ├── dashboard/
│   │   ├── page.tsx                      ← Stats overview
│   │   ├── edit/page.tsx                 ← Profile + products/services editor
│   │   ├── settings/page.tsx             ← Business type settings
│   │   ├── invites/page.tsx              ← Email invite sender
│   │   ├── widget/page.tsx               ← Widget embed code
│   │   └── qrcode/page.tsx               ← QR code download
│   └── company/
│       ├── [slug]/page.tsx               ← Company profile (SSR, SEO critical)
│       ├── [slug]/reviews/page.tsx       ← All reviews paginated (?page=N)
│       ├── [slug]/write-review/page.tsx  ← B2B or B2C review form (branches on business_type)
│       └── [slug]/claim/page.tsx         ← Claim company page (2-step: proof + BusinessTypeSelector)
│
├── (auth)/
│   └── login/page.tsx                    ← Email OTP. Context-aware heading via getLoginContext(?next=)
│
├── auth/callback/route.ts                ← Supabase auth code exchange → redirect(next)
│
└── admin/                                ← Gated to role = 'admin'
    ├── claims/page.tsx
    ├── reviews/page.tsx
    ├── categories/page.tsx               ← Tree view + platform_type badges, create/edit inline
    └── companies/
        ├── page.tsx                      ← List (?q= search, ?status= filter)
        ├── new/page.tsx                  ← Manual create form (BusinessTypeSelector + filtered cats)
        ├── [id]/edit/page.tsx            ← Edit form
        └── import/page.tsx              ← CSV bulk import (BUSINESS_TYPE_MAP auto-mapping)
```

---

## Key page behaviours

### Company page `/company/[slug]` (SSR — most important)
- Server-side rendered for Google indexing
- Schema.org: `Organization` + `AggregateRating` + up to 10 `Review` items
- If unclaimed: shows "Claim this company" banner
- Shows: rating breakdown (6 factors), top 10 reviews, sidebar with company details

### Write review entry point `/write-review` (CRITICAL GROWTH MECHANIC)
- **Entry point for ALL review writing** — linked from navbar
- Has a search bar: user types company name
- Server-rendered results using `?q=` URL param
- Client-side autocomplete dropdown for live suggestions
- **If company found** → link to `/company/[slug]/write-review`
- **If company NOT found** → CTA: "[Name] isn't on Trust Cabbage yet. Be the first to review them." → `/write-review/new?name=[query]`

### `/write-review/new` — Create company stub + write first review (CRITICAL)
This is how the database of companies grows organically.

**Step 0 — Company details (only in this flow):**
- Company name (pre-filled from `?name=` URL param)
- Company website URL (optional)
- City / state
- Primary category (dropdown from admin-managed categories)
- Note shown: "You're creating this company's page. It will be publicly visible and Google-searchable."

**Steps 1–5 — Normal review steps** (same as existing company review form)

**On submission:**
1. Generate slug from company name (auto, unique — append `-2`, `-3` on collision)
2. Insert `companies` row with `status = 'unclaimed'`, `created_by = user.id`
3. Insert `company_categories` row
4. Insert `reviews` row attached to new company
5. Redirect to `/company/[slug]`

**SEO behaviour:**
- Page is immediately SSR and Google-indexable
- Creates organic SEO pressure motivating the company to claim the page

**What unclaimed stub looks like:**
- Name, city, category from reviewer's input
- No logo (initial avatar placeholder)
- "Unclaimed page" badge (orange)
- "Is this your company? Verify and claim this page →" CTA
- All reviews visible
- No products/services (empty until claimed)

### Write review for existing company `/company/[slug]/write-review`

Branches on `company.business_type`:
- **`both`** → pre-step type selector ("As a business client" / "As an individual consumer") → routes to B2B or B2C
- **B2B** (`business_services`): 6 steps — relationship → products → ratings (6 B2B factors) → written → proof → submit
- **B2C** (`online_b2c` or `retail_chain`): 6 steps — purchase context (+ purchase_channel for retail) → products → ratings (6 B2C factors + 2 retail in-store if applicable) → written review + would_buy_again → photos & proof → submit

Both paths: embed mode postMessage, refToken, reviewSource, product junction, tags, company_tags.

### `/categories` all-categories page
- Tab toggle: B2B Services (`?tab=b2b`, default) / Online Brands & Stores (`?tab=b2c`)
- Filters by `platform_type IN ('b2b','both')` or `('b2c','both')` server-side

### Category listing `/categories/[slug]`
- Sort: highest rated | most reviewed | newest — via `?sort=` URL param
- Filter: verified only — via `?verified=1` URL param
- All filtering is server-side

---

## Review collection tools (Phase 2)
1. Invite link — `/review/{slug}?ref={token}`
2. Embeddable widget — JS badge snippet
3. Bulk invite — CSV upload + Resend email
4. WhatsApp share — pre-composed message

---

## SEO requirements
- All company and category pages: SSR
- Schema.org structured data on every company page
- Auto-generated `sitemap.xml`
- `robots.txt` allows all crawlers
- Canonical URLs on all pages
- Open Graph + Twitter Card meta on every page

---

## Admin company seeding

Admins can seed the company database without waiting for organic user submissions.

### Manual company creation `/admin/companies/new`
- All company fields: name (auto-generates slug), website, description, city, state, founded_year, employee_count, GST, CIN, logo upload
- Category multi-select: parent categories shown as full-width buttons, subcategories as grid
- Products/services: add multiple inline (name, type, description, price_range)
- Sets `created_by_admin = true` on company and products rows
- Slug auto-generated from name; `findUniqueSlug()` appends `-2`, `-3` on collision

### CSV bulk import `/admin/companies/import`
- Template CSV downloadable from the page
- Columns: `name, website, description, city, state, founded_year, employee_count, category_slugs, gst_number, cin_number`
- `category_slugs`: pipe-separated slugs e.g. `payment-gateways|fintech`
- Preview table: ✓ ready / ⚠ duplicate / ✗ error per row before importing
- Runs import sequentially; shows results summary

### Categories `/admin/categories`
- Tree view: parent categories as headers, subcategories indented below
- Create form supports `parent_id` (to create subcategories) and `is_featured` checkbox
- Activate/deactivate toggle per row

### New DB columns (migration `supabase/migrations/001_admin_features.sql`)
```sql
companies: created_by_admin bool, tags text[], long_description text
categories: cover_image_url text, is_featured bool
products_services: features text[], sort_order int, created_by_admin bool
```

---

## Supabase setup
- `company-logos` bucket — public
- `claim-documents` bucket — private (claim proof uploads)
- `review-proofs` bucket — private (review proof uploads, create in dashboard)
- Auth callback URL: `{site-url}/auth/callback` must be in Supabase redirect URLs
- Set `role = 'admin'` in `users` table to access `/admin/*`

---

## Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=           ← Phase 2
RAZORPAY_KEY_ID=          ← Phase 3
RAZORPAY_KEY_SECRET=      ← Phase 3
NEXT_PUBLIC_SITE_URL=https://trustcabbage.com
```

---

## Build phases

### Phase 1 — Core ✅ COMPLETE
- DB schema, RLS, storage buckets
- Homepage, search, categories, company profile (SSR + Schema.org)
- `/write-review` search page + `/write-review/new` create-company flow (7 steps with BusinessTypeSelector)
- `/company/[slug]/write-review` — B2B + B2C review forms (branches on business_type)
- `/company/[slug]/claim` — 2-step: proof upload + BusinessTypeSelector confirmation
- `/company/[slug]/reviews` — paginated all-reviews
- Email OTP auth + magic link with `/auth/callback`. Context-aware login headings.
- Admin: claims, reviews, categories (platform_type badges), companies (manual create + CSV bulk import with BUSINESS_TYPE_MAP)
- Migrations 001–012: full B2C schema (business_type, platform_type, review_type, 14 B2C columns, audit_log)
- CODEBASE.md: persistent reference file for AI context across sessions

### Phase 2 — Company tools ✅ MOSTLY COMPLETE
- Company dashboard: profile editing, products/services management ✅
- Reply to reviews ✅
- Review invite link + landing page ✅
- WhatsApp share ✅
- Embeddable badge widget (JS snippet + embed mode postMessage) ✅
- Email invites via Resend — tracked in `invite_email_logs` ✅
- QR code — downloadable PNG ✅
- `/for-businesses` dedicated business landing page ✅
- `/for-businesses/add` — auth-gated company self-listing ✅

**B2C patch — ALL 17 STEPS COMPLETE ✅**
- Step 14 ✅ Homepage — two browse sections (B2B Services + Online Brands & Stores)
- Step 15 ✅ `/categories` — tab toggle filters by platform_type server-side
- Step 16 ✅ `/search` — type filter pill (All / B2B / Online Brands); applied to company + tag queries
- Step 17 ✅ `/company/[slug]` — RatingBreakdown switches B2B/B2C/retail factors by business_type

**Early access policy (until Phase 3 pricing launches):**
All Phase 2 features are FREE for all claimed companies during early access.
Plan limits live in `src/lib/plan-limits.ts` (`EARLY_ACCESS = true`) — flip one constant to enforce.
- Email invites: 100/month on Free, unlimited on Starter/Growth (tracked via `invite_email_logs`)
- Bulk CSV email: Starter/Growth only (`companies.plan` column)
- Widget watermark: removed on Starter/Growth
- QR code download: Growth only (gate ready, not enforced)

### Phase 3 — Growth
- Analytics dashboard
- Razorpay subscription integration (Free / Starter ₹1,499 / Growth ₹4,999)
- Featured listing / ads system
- Reviewer profile pages
- Homepage two-section browse (B2B Services + Online Brands & Stores) — Part of B2C patch step 14
