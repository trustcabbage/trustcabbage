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

- Font: Pontano Sans (`next/font/google`, variable `--font-sans`)
- Brand color: `#F06105` (RGB 240, 97, 5) — use Tailwind arbitrary values `bg-[#F06105]`, never `@theme`
- Dark hero sections: `bg-slate-950`
- Page background: `bg-slate-50`
- Navbar: white/90 frosted `bg-white/90 backdrop-blur`, `border-b-2 border-[#F06105]/60`
- Headings: `font-black`
- Cards: `bg-white rounded-xl border border-slate-200 shadow-sm`
- Primary button: `bg-[#F06105] hover:bg-[#C95204] text-white font-black rounded-xl`
- Hover accent: `border-[#F06105]`, `text-[#F06105]`
- Footer: `bg-slate-950`

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
claimed_by (user_id FK), created_by (user_id FK), created_at, updated_at,
average_rating, total_reviews, is_featured, is_verified
```

### categories
```
id, name, slug, parent_id (nullable), icon, description, sort_order, is_active, created_at
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
association_type (current_client | past_client | pilot | partner | vendor | evaluator),
reviewer_role (decision_maker | end_user | evaluator | procurement | other),
engagement_phase (pre_sales | onboarding | active | post_project | long_term),
association_duration (lt_3m | 3_12m | 1_3y | 3y_plus),
rating_overall, rating_staff, rating_quality, rating_communication,
rating_billing, rating_after_sales, rating_delivery (all 1–5),
what_went_well, what_to_improve,
would_recommend (yes | no | conditional), recommend_reason,
additional_notes, is_verified_buyer, proof_document_url,
status (pending | published | flagged | removed),
is_anonymous, helpful_votes, created_at, updated_at
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
│   ├── write-review/
│   │   ├── page.tsx                      ← "Who are you reviewing?" — search bar + results
│   │   └── new/page.tsx                  ← Create company stub + write first review
│   └── company/
│       ├── [slug]/page.tsx               ← Company profile (SSR, SEO critical)
│       ├── [slug]/reviews/page.tsx       ← All reviews paginated (?page=N)
│       ├── [slug]/write-review/page.tsx  ← Review form for existing companies (6 steps)
│       └── [slug]/claim/page.tsx         ← Claim company page
│
├── (auth)/
│   └── login/page.tsx                    ← Email OTP
│
├── auth/callback/route.ts                ← Supabase auth code exchange
│
└── admin/                                ← Gated to role = 'admin'
    ├── claims/page.tsx
    ├── reviews/page.tsx
    ├── categories/page.tsx               ← Tree view (parent + indented children), create with parent_id + is_featured
    └── companies/
        ├── page.tsx                      ← List (?q= search, ?status= filter)
        ├── new/page.tsx                  ← Manual create form
        ├── [id]/edit/page.tsx            ← Edit form
        └── import/page.tsx              ← CSV bulk import
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

### Write review for existing company `/company/[slug]/write-review` (6 steps)
1. Your relationship (association type, role, engagement phase, duration)
2. Product / service (optional)
3. Star ratings (6 factors)
4. Written experience (what went well, what to improve, recommend)
5. Proof upload (optional file → `review-proofs` bucket)
6. Review summary + anonymous toggle + submit

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
- Homepage, search, categories, company profile
- `/write-review` search page + `/write-review/new` create-company flow
- `/company/[slug]/write-review` — review form for existing companies (6 steps)
- `/company/[slug]/claim` — claim flow
- `/company/[slug]/reviews` — paginated all-reviews
- Email OTP auth with `/auth/callback`
- Admin: claims, reviews, categories (with subcategory tree), companies (manual create + CSV bulk import)

### Phase 2 — Company tools (next)
- Company dashboard: profile editing, products/services management
- Reply to reviews
- Review invite link + landing page ✅ DONE
- WhatsApp share ✅ DONE
- Embeddable badge widget (pure JS snippet, auto-updates)
- Email invites — send branded invites via Resend; track per company per month in `invite_email_logs`
- QR code — downloadable PNG for proposals, invoice footers, office reception
- `/for-businesses` dedicated business landing page ✅ DONE

**Early access policy (until Phase 3 pricing launches):**
All Phase 2 features are FREE for all claimed companies during early access.
Code must still provision plan-based limits so enforcement can be switched on later:
- Email invites: 100/month on Free plan, unlimited on Starter/Growth (track via `invite_email_logs`)
- Bulk CSV email: Starter/Growth only (gate via `companies.plan` column)
- Widget watermark: removed on Starter/Growth
- QR code download: Growth only (gate ready, not enforced yet)
Plan limits live in `src/lib/plan-limits.ts` — change one constant to enforce.

### Phase 3 — Growth
- Analytics dashboard
- Razorpay subscription integration (Free / Starter ₹1,499 / Growth ₹4,999)
- Featured listing / ads system
- Reviewer profile pages
