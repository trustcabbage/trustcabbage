# Trust Cabbage — Codebase Reference

> Read this alongside `brief.md` (product requirements) before touching any code.
> This file covers **how the code is written** and **how files relate to each other**.

---

## Stack

- **Next.js 16.2.9** — App Router, Turbopack. Breaking API changes vs older Next.js. Read `node_modules/next/dist/docs/` before using any Next.js API.
- **Supabase** — Postgres + Auth + Storage. RLS enabled on all tables.
- **Tailwind CSS** — Utility-first. No CSS modules.
- **shadcn/ui** — Primitives in `src/components/ui/`. Do not edit these directly.
- **Sonner** — Toast notifications via `import { toast } from 'sonner'`.

---

## Directory Structure

```
src/
  app/
    (auth)/login/                    # Auth pages — no nav/footer
      page.tsx                       # Derives context heading from ?next= param
      _components/login-form.tsx     # OTP + magic link. Controlled client component.
    (public)/                        # All public routes — wrapped by public layout
      layout.tsx                     # Server: fetches user → Navbar + Footer
      page.tsx                       # Homepage. Two browse sections: B2B (platform_type b2b/both) + B2C (b2c/both). Splits single category fetch by platform_type post-query.
      company/[slug]/
        page.tsx                     # Company profile
        _components/review-card.tsx
        _actions/reply-to-review.ts
        page.tsx                     # Company profile. Fetches business_type. reviewSelect includes all B2B + B2C rating columns.
        _components/
          rating-breakdown.tsx       # Switches B2B/B2C/retail factor sets based on businessType prop. Skips null values in avg(). Shows both sets for 'both' companies.
          review-card.tsx
        write-review/
          page.tsx                   # Auth-gated. Fetches company.business_type + products.
          _components/
            review-form.tsx          # Dispatcher → B2B form (inline) or B2cReviewForm
            b2c-review-form.tsx      # 6-step B2C form (new)
        claim/
          page.tsx                   # Fetches company.business_type
          _components/claim-form.tsx # 2-step: proof upload → BusinessTypeSelector confirm
      for-businesses/add/
        page.tsx                     # Auth-gated. Fetches companies (search) + categories.
        _actions.ts                  # addCompany → insert companies + company_categories
        _components/add-company-form.tsx  # 2-step: BusinessTypeSelector → details form
      dashboard/
        page.tsx
        edit/page.tsx + _actions.ts
        settings/
          page.tsx                   # Fetches company.business_type
          _components/business-type-settings.tsx  # Updates companies + audit_log
        invites/ widget/ qrcode/
      write-review/
        page.tsx                     # /write-review — search before reviewing
        new/
          page.tsx                   # Auth-gated. Fetches categories with platform_type.
          _components/new-company-review-form.tsx  # 7-step: BusinessType → company → B2B review
      categories/
        page.tsx                     # ?tab=b2b (default) | ?tab=b2c. Filters by platform_type IN (b2b/both) or (b2c/both). Tab toggle in hero.
        [slug]/page.tsx              # Single category listing. ?sort= ?verified=
      search/page.tsx                # ?q= ?tab= ?sort= ?rating= ?state= ?verified= ?type=b2b|b2c. Type filter pills on companies tab.
      tags/ review/[slug]/
    admin/
      layout.tsx                     # Admin auth guard
      companies/
        page.tsx
        new/page.tsx + _components/company-form.tsx   # BusinessTypeSelector + filtered categories
        [id]/edit/page.tsx + _components/
        import/page.tsx + _components/csv-importer.tsx  # BUSINESS_TYPE_MAP, bulk insert
      categories/
        page.tsx                     # platform_type badges + inline edit
        _actions.ts                  # createCategory / updateCategory with platform_type
      claims/ reviews/ business-models/
    auth/callback/route.ts           # exchangeCodeForSession → redirect to ?next=
    api/
      qrcode/[slug]/route.ts
      widget/[slug]/route.ts
  components/
    ui/                              # shadcn/ui — do not edit
    layout/
      navbar.tsx                     # Uses createClient (client) for sign-out
      footer.tsx
      home-search.tsx                # 5-section autocomplete. Uses createClient (client). Subcategory join fetches parent(id,name,slug,icon); parent cats are auto-surfaced from sub results even when parent name doesn't match the search term. Subcategory hrefs use /categories/${sub.slug} — NOT two-segment paths.
    reviews/
      star-rating.tsx                # Props: value, size, interactive, onChange, className
    tags/
      tag-input.tsx                  # Props: value, onChange, label, placeholder, required, hint, showSentimentChips
    business-type-selector.tsx       # Card-style radio. Exports: BusinessTypeSelector, BusinessType
  lib/
    supabase/
      client.ts                      # createClient() — browser. Use in 'use client' components.
      server.ts                      # createClient() async — server. Use in server components + actions.
                                     # Also: createServiceClient() for service-role ops.
    tags.ts                          # TagChip, resolveTags(), resolveTag(), toTagSlug()
    get-categories-by-business-type.ts  # getCategoriesByBusinessType(). Requires CategoryOption with parent_id.
    plan-limits.ts                   # EARLY_ACCESS flag + invite rate limits
  proxy.ts                           # Middleware — Supabase session refresh on every request
supabase/migrations/                 # 001–012. Applied manually via Supabase dashboard.
```

---

## File Relationships

### 1. Shared Utilities — High Cascade Impact

If you change these files, every listed consumer is affected.

#### `src/lib/get-categories-by-business-type.ts`
- **Exports:** `getCategoriesByBusinessType(businessType, categories)`, `CategoryOption` interface
- **Critical constraint:** `CategoryOption` requires `parent_id: string | null`. Every file passing categories to this function must include `parent_id` in its local `Category` type and in the Supabase `.select()` call.
- **Imported by:**
  - `src/app/(public)/for-businesses/add/_components/add-company-form.tsx`
  - `src/app/(public)/write-review/new/_components/new-company-review-form.tsx`
  - `src/app/admin/companies/new/_components/company-form.tsx`
- **Pages that feed it (must select `parent_id` from DB):**
  - `src/app/(public)/for-businesses/add/page.tsx`
  - `src/app/(public)/write-review/new/page.tsx`
  - `src/app/admin/companies/new/page.tsx`
  - `src/app/admin/companies/[id]/edit/page.tsx`

#### `src/components/business-type-selector.tsx`
- **Exports:** `BusinessTypeSelector` (React component), `BusinessType` (type: `'business_services' | 'online_b2c' | 'retail_chain'`)
- **Imported by:**
  - `src/app/(public)/for-businesses/add/_components/add-company-form.tsx`
  - `src/app/(public)/write-review/new/_components/new-company-review-form.tsx`
  - `src/app/(public)/company/[slug]/claim/_components/claim-form.tsx`
  - `src/app/(public)/dashboard/settings/_components/business-type-settings.tsx`
  - `src/app/admin/companies/new/_components/company-form.tsx`
  - `src/lib/get-categories-by-business-type.ts` (imports the type only)

#### `src/lib/tags.ts`
- **Exports:** `TagChip`, `resolveTags()`, `resolveTag()`, `toTagSlug()`
- **Imported by:**
  - `src/app/(public)/company/[slug]/write-review/_components/review-form.tsx`
  - `src/app/(public)/company/[slug]/write-review/_components/b2c-review-form.tsx`
  - `src/app/(public)/write-review/new/_components/new-company-review-form.tsx`
  - `src/components/tags/tag-input.tsx` (imports type only)

#### `src/components/tags/tag-input.tsx`
- **Imported by:** `review-form.tsx`, `b2c-review-form.tsx`, `new-company-review-form.tsx`

#### `src/components/reviews/star-rating.tsx`
- **Imported by:** `review-form.tsx`, `b2c-review-form.tsx`, `new-company-review-form.tsx`, `company/[slug]/page.tsx`, `categories/[slug]/page.tsx`, `review/[slug]/page.tsx`, `search/page.tsx`, `tags/[slug]/page.tsx`, `dashboard/page.tsx`, `home-search.tsx`, and more

#### `src/lib/supabase/client.ts`
- **Every client component that talks to Supabase** imports this. See full list in imports section above.

#### `src/lib/supabase/server.ts`
- **Every server component and server action** imports this. Used in ~30+ files.

---

### 2. Page → Component → Action Chains

#### `/for-businesses/add`
```
page.tsx (server, auth-gated)
  ├── queries: companies (search by name), categories (id, name, slug, icon, parent_id, platform_type)
  ├── auth: redirect to /login?next=... if not logged in
  └── renders: AddCompanyForm
        ├── imports: BusinessTypeSelector, getCategoriesByBusinessType
        ├── step 0: BusinessTypeSelector
        └── step 1: details form → useActionState(addCompany)
              └── _actions.ts::addCompany
                    ├── writes: companies, company_categories
                    └── redirects to: /company/[slug]/claim?listed=1
```

#### `/company/[slug]/write-review`
```
page.tsx (server, auth-gated)
  ├── queries: companies (id, name, slug, status, business_type, products_services)
  ├── queries: users (role, company_id) — to block company admins
  ├── queries: reviews (existing check — one review per user per company)
  └── renders: ReviewForm (businessType prop drives dispatch)
        ├── businessType === 'both' → type selector UI → sets reviewType state
        ├── reviewType === 'b2c' → renders B2cReviewForm
        │     ├── imports: createClient(client), TagInput, resolveTags, StarRating
        │     ├── step 0: purchase context (purchase_channel for retail)
        │     ├── step 1: product selection
        │     ├── step 2: B2C ratings (+ retail in-store if applicable)
        │     ├── step 3: written review + would_buy_again
        │     ├── step 4: photo + proof upload → review-proofs bucket
        │     ├── step 5: summary + submit
        │     └── writes: reviews(review_type:'b2c'), review_product_services,
        │                  review_tags, company_tags
        └── reviewType === 'b2b' (default) → inline B2B form
              ├── imports: createClient(client), TagInput, resolveTags, StarRating
              ├── 6 steps: relationship → products → ratings → written → proof → submit
              └── writes: reviews(review_type:'b2b'), review_product_services,
                           review_tags, company_tags
        Both paths: embed postMessage, refToken, reviewSource, router.push
```

#### `/write-review/new`
```
page.tsx (server, auth-gated)
  ├── queries: categories (id, name, slug, icon, parent_id, platform_type)
  └── renders: NewCompanyReviewForm
        ├── imports: BusinessTypeSelector, getCategoriesByBusinessType,
        │            TagInput, resolveTags, StarRating, createClient(client)
        ├── step 0: BusinessTypeSelector
        ├── step 1: company search + details (creates company)
        ├── steps 2–6: B2B review flow
        └── writes: companies, company_categories, reviews, review_product_services,
                     review_tags, company_tags
```

#### `/company/[slug]/claim`
```
page.tsx (server)
  ├── queries: companies (id, name, slug, status, business_type)
  └── renders: ClaimForm (business_type prop)
        ├── imports: BusinessTypeSelector, createClient(client)
        ├── step 0: proof upload
        ├── step 1: BusinessTypeSelector confirmation
        └── writes: companies (business_type if changed), company_claims
```

#### `/dashboard/settings`
```
page.tsx (server, auth-gated: company_admin only)
  ├── queries: companies (id, name, business_type)
  └── renders: BusinessTypeSettings
        ├── imports: BusinessTypeSelector, createClient(client)
        └── writes: companies (business_type), audit_log
```

#### `/admin/companies/new` and `/admin/companies/[id]/edit`
```
page.tsx (server, admin-only)
  ├── queries: categories (id, name, slug, icon, parent_id, platform_type)
  └── renders: CompanyForm
        ├── imports: BusinessTypeSelector, getCategoriesByBusinessType
        ├── visibleCategories filtered by businessType
        └── writes: companies, company_categories (via server action)
```

#### `/admin/companies/import`
```
page.tsx → renders CsvImporter
  ├── BUSINESS_TYPE_MAP: { b2b→business_services, b2c→online_b2c, ... }
  ├── parses CSV, auto-maps business_type
  └── writes: companies (with business_type), company_categories
```

#### `/` Homepage
```
page.tsx (server)
  ├── queries: categories (id, name, slug, icon, platform_type, limit 30)
  ├── splits: b2bCats (platform_type b2b|both) + b2cCats (platform_type b2c|both)
  ├── Section 1 "B2B Services" → /categories
  └── Section 2 "Online Brands & Stores" → /categories?tab=b2c
```

#### `/categories`
```
page.tsx (server)
  ├── searchParams: { tab?: 'b2b' | 'b2c' } — default b2b
  ├── queries: categories filtered by .in('platform_type', ['b2b','both']) or ['b2c','both']
  └── Tab toggle in hero links to /categories (b2b) and /categories?tab=b2c
```

#### `/search`
```
page.tsx (server)
  ├── searchParams: { q, tab, sort, rating, state, verified, type }
  ├── type filter: b2b → .in('business_type', ['business_services','both'])
  │               b2c → .in('business_type', ['online_b2c','retail_chain','both'])
  ├── Filter pills above companies list (All types / B2B / Online Brands)
  └── Applied to both main company query and tag-matched company query
```

#### `/company/[slug]`
```
page.tsx (server)
  ├── queries: companies (includes business_type)
  ├── reviewSelect: all B2B + B2C + retail rating columns + review_type
  └── renders: RatingBreakdown(reviews, businessType)
        ├── business_services → B2B factors only
        ├── online_b2c       → B2C factors only
        ├── retail_chain     → B2C + retail extras (only if avg > 0)
        └── both             → B2B section + B2C section, labelled separately
```

#### `/admin/categories`
```
page.tsx (server)
  ├── queries: categories (all fields including platform_type)
  ├── imports: createCategory, updateCategory, toggleCategory (from _actions.ts)
  ├── PLATFORM_BADGE: { b2b: blue, b2c: rose, both: amber }
  └── _actions.ts: reads platform_type from formData → writes categories
```

#### Auth flow
```
Any auth-gated page
  └── redirect(/login?next=<encoded-path>)
        └── login/page.tsx
              ├── getLoginContext(next) → context-aware heading
              └── renders: LoginForm(next)
                    ├── sendOtp(): signInWithOtp({ emailRedirectTo: /auth/callback?next=... })
                    ├── verifyOtp(): verifyOtp() → router.push(next)  ← OTP code path
                    └── magic link → /auth/callback?next=...
                          └── exchangeCodeForSession → redirect(next)
```

---

### 3. DB Table → File Map

If you change a table's schema, check all files in the relevant row.

| Table | Files that READ | Files that WRITE |
|---|---|---|
| `companies` | `layout.tsx`, `page.tsx` (homepage), `company/[slug]/page.tsx`, `write-review/page.tsx`, `claim/page.tsx`, `dashboard/*/page.tsx`, `for-businesses/add/page.tsx`, `search/page.tsx`, `categories/[slug]/page.tsx`, `sitemap.ts`, `admin/companies/page.tsx`, `api/widget`, `api/qrcode` | `for-businesses/add/_actions.ts`, `claim-form.tsx`, `business-type-settings.tsx`, `new-company-review-form.tsx`, `company-form.tsx`, `csv-importer.tsx`, `dashboard/edit/_actions.ts` |
| `reviews` | `company/[slug]/page.tsx`, `company/[slug]/reviews/page.tsx`, `write-review/page.tsx` (dupe check), `dashboard/page.tsx`, `review/[slug]/page.tsx`, `tags/[slug]/page.tsx`, `categories/[slug]/page.tsx`, `admin/reviews/page.tsx` | `review-form.tsx` (B2B), `b2c-review-form.tsx` (B2C), `new-company-review-form.tsx`, `admin/reviews/_actions.ts` |
| `categories` | `for-businesses/add/page.tsx`, `write-review/new/page.tsx`, `admin/companies/new/page.tsx`, `admin/companies/[id]/edit/page.tsx`, `admin/companies/import/page.tsx`, `categories/page.tsx`, `categories/[slug]/page.tsx`, `search/page.tsx`, `page.tsx` (homepage), `home-search.tsx`, `sitemap.ts` | `admin/categories/_actions.ts` |
| `tags` + `tag_synonyms` | `tags/[slug]/page.tsx`, `home-search.tsx`, `search-input.tsx` | `tags.ts::resolveTag` (called by review-form, b2c-review-form, new-company-review-form) |
| `review_tags` | `review/[slug]/page.tsx`, `company/[slug]/page.tsx` | `review-form.tsx`, `b2c-review-form.tsx`, `new-company-review-form.tsx` |
| `company_tags` | `company/[slug]/page.tsx` | `review-form.tsx`, `b2c-review-form.tsx`, `new-company-review-form.tsx` |
| `review_product_services` | `review/[slug]/page.tsx` | `review-form.tsx`, `b2c-review-form.tsx`, `new-company-review-form.tsx` |
| `products_services` | `company/[slug]/write-review/page.tsx`, `company/[slug]/page.tsx` | `dashboard/edit/_actions.ts` |
| `users` | `layout.tsx`, `write-review/page.tsx`, `dashboard/*/page.tsx`, `admin/layout.tsx`, `admin/categories/_actions.ts`, `admin/reviews/_actions.ts` | Auth callback creates user row via Supabase Auth trigger |
| `company_claims` | `admin/claims/page.tsx` | `claim-form.tsx` |
| `audit_log` | admin only | `business-type-settings.tsx` |
| `invite_email_logs` | `dashboard/invites/page.tsx` | `dashboard/invites/_actions.ts` |
| `review_responses` | `company/[slug]/page.tsx`, `review/[slug]/page.tsx` | `company/[slug]/_actions/reply-to-review.ts` |

---

### 4. Storage Buckets

| Bucket | Path pattern | Written by |
|---|---|---|
| `review-proofs` | `proof/{userId}/{companyId}-{ts}.ext` | `review-form.tsx`, `b2c-review-form.tsx`, `new-company-review-form.tsx` |
| `review-proofs` | `photos/{userId}/{companyId}-{ts}.ext` | `b2c-review-form.tsx` (product photo) |
| `review-proofs` | `{userId}/{companyId}-{ts}.ext` | `claim-form.tsx` (proof of ownership) |
| `company-logos` | `{companyId}/{ts}.ext` | `dashboard/edit/_actions.ts` |

---

## Core Rules (non-negotiable)

1. **All data loads server-side via URL query params.** No `useEffect` for data. No client-side fetch for initial page data.
2. **No `useState` for data that comes from the DB.** State is only for UI interactions (step counters, field values, file picks).
3. **`searchParams` and `params` are Promises in Next.js 16.** Always `await` them:
   ```ts
   export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
     const { q } = await searchParams
   ```
4. **Auth guard at the page level, not in the action.** Page checks user → redirect. Actions return `{ error }`, never redirect to login.
5. **`getCategoriesByBusinessType` requires `parent_id`.** Every Category type and every Supabase select feeding this function must include `parent_id: string | null`.

---

## Supabase Patterns

### Server component / server action
```ts
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Client component (multi-step forms, file upload, live validation)
```ts
'use client'
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()  // NOT async
```

### Auth guard in a page
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect(`/login?next=${encodeURIComponent('/some/page')}`)
```

---

## Form Patterns

### Multi-step client form (write-review, claim, dashboard settings, new-company-review)
- `'use client'` + `useState` for step index and all field values
- `createClient()` (browser) for insert/upload on submit
- `canAdvance()` function gates the Continue button per step
- Submit: upload files first → insert to DB → save junction rows → save tags → toast → navigate

### Server action form (for-businesses/add)
- `useActionState(action, undefined)` pattern — NOT `useState` + fetch
- Action lives in `_actions.ts` with `'use server'`
- Returns `{ error: string } | void`; on success calls `redirect(...)` — never returns a value

### Embed mode (review widget)
```ts
if (isEmbed && window.parent !== window) {
  window.parent.postMessage({ type: 'tc-review-submitted', slug: company.slug }, '*')
} else {
  router.push(`/company/${company.slug}`)
  router.refresh()
}
```
Present in `review-form.tsx` and `b2c-review-form.tsx`. `isEmbed` = `embed === '1'` from searchParams.

---

## Design System

| Token | Value |
|---|---|
| Primary purple | `#6d28d9` |
| Primary hover | `#7c3aed` |
| Dark nav/hero bg | `#1e1b4b` |
| Violet accent | `#a78bfa` |
| Font weight headings | `font-black` (900) |
| Border radius cards | `rounded-xl` |
| Card pattern | `bg-white rounded-xl border border-slate-200 shadow-sm p-6` |

**Primary button:** `rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm`
**Ghost button:** `rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50`
**Form label:** `text-xs font-black uppercase tracking-wide text-slate-400`
**Page hero:** `bg-[#1e1b4b] pt-10 pb-12` with `max-w-2xl mx-auto px-4 sm:px-6` content

**Step indicator** (all multi-step forms — must stay consistent):
- Active: `bg-[#6d28d9] text-white`
- Past: `bg-violet-100 text-[#6d28d9]`
- Future: `bg-slate-100 text-slate-400`

**Platform type badges** (used in admin/categories):
- B2B: `bg-blue-100 text-blue-800`
- B2C: `bg-rose-100 text-rose-800`
- Both: `bg-amber-100 text-amber-800`

---

## Business Type System

`companies.business_type` — 4 values, NOT NULL, default `business_services`:
- `business_services` → B2B review form (6 B2B rating factors)
- `online_b2c` → B2C review form (6 B2C rating factors)
- `retail_chain` → B2C form + `purchase_channel` step + in-store ratings if applicable
- `both` → pre-step type selector → routes to B2B or B2C

`categories.platform_type`: `b2b` | `b2c` | `both`
`reviews.review_type`: `b2b` | `b2c`

**B2B rating columns (nullable since migration 010):**
`rating_staff`, `rating_quality`, `rating_communication`, `rating_billing`, `rating_after_sales`, `rating_delivery`

**B2C rating columns:**
`rating_product_accuracy`, `rating_packaging`, `rating_delivery_speed`, `rating_return_refund`, `rating_value_for_money`, `rating_customer_support`

**Retail-only (when purchase_channel includes in_store):**
`rating_store_experience`, `rating_staff_in_store`

---

## Key DB Tables — Column Reference

> Column names matter — wrong names cause Supabase schema cache errors at runtime, not build time.

### `companies`
```
id, name, slug, status (unclaimed/claimed/approved),
business_type (business_services/online_b2c/retail_chain/both),
website,          ← NOT website_url — this column is called "website"
logo_url, description, city, state,
founded_year, employee_count, gst_number, cin_number,
plan, created_by (user id), total_reviews (computed/denormalized)
```

### `reviews`
```
id, company_id, reviewer_id,
review_type (b2b/b2c),
status (published/pending/rejected),
rating_overall, is_anonymous,
what_went_well, what_to_improve, additional_notes,
would_recommend (yes/conditional/no),
recommend_reason,
-- B2B only (nullable since migration 010):
association_type, reviewer_role, engagement_phase, association_duration,
rating_staff, rating_quality, rating_communication,
rating_billing, rating_after_sales, rating_delivery,
-- B2C only:
purchase_type (first_time/repeat/gifting),
order_value_range (under_500/500_2000/2000_5000/above_5000),
discovery_channel (instagram/google/friend/youtube/other),
purchase_channel (online/in_store/both),
would_buy_again (yes/maybe/no),
product_photo_url,
rating_product_accuracy, rating_packaging, rating_delivery_speed,
rating_return_refund, rating_value_for_money, rating_customer_support,
-- Retail in-store (nullable unless purchase_channel includes in_store):
rating_store_experience, rating_staff_in_store,
-- Common:
proof_document_url, ref_token, review_source
```

### `categories`
```
id, name, slug, icon (emoji), image_url, description,
is_active, parent_id (null = top-level), sort_order,
is_featured, platform_type (b2b/b2c/both)
```

### `users`
```
id (= Supabase auth uid), email, display_name,
role (admin/company_admin/reviewer),
company_id (FK → companies, set when user claims a company)
```

### `products_services`
```
id, company_id, name, type (product/service)
```

### `company_claims`
```
id, company_id, user_id, status (pending/approved/rejected),
proof_document_url, business_type
```

### `audit_log`
```
id, entity_type, entity_id, action,
old_value (jsonb), new_value (jsonb),
changed_by (user id), changed_by_role, created_at
```
Written by: `business-type-settings.tsx` on business_type change.

### `tags` / `tag_synonyms` / `review_tags` / `company_tags`
See `src/lib/tags.ts` for full usage pattern.

### `invite_email_logs`
```
id, company_id, invited_by, email, sent_at
```

### `review_responses`
```
id, review_id, company_id, responder_id, body, created_at
```

---

## Auth Flow — Per Route

| Route | Auth required | Guard location | Redirect destination |
|---|---|---|---|
| `/for-businesses/add` | Yes | `page.tsx` top | `/login?next=/for-businesses/add` |
| `/company/[slug]/write-review` | Yes | `page.tsx` top | `/login?next=/company/[slug]/write-review` |
| `/company/[slug]/claim` | Yes | `page.tsx` top | `/login?next=...` |
| `/write-review/new` | Yes | `page.tsx` top | `/login?next=/write-review/new` |
| `/dashboard/*` | Yes | each `page.tsx` | `/login` |
| `/admin/*` | Yes | `admin/layout.tsx` | `/login` |

**Login page context headings** — `getLoginContext(next)` in `login/page.tsx`:
- `next` starts with `/for-businesses/add` → *"Verify to list your company"*
- `next` contains `/write-review` → *"Verify to write your review"*
- `next` contains `/claim` → *"Verify to claim your page"*
- `next` starts with `/dashboard` → *"Sign in to your dashboard"*
- default → *"Sign in"*

**OTP vs magic link:** Both paths redirect to `next` after auth. OTP via `router.push(next)` in client. Magic link via `/auth/callback?next=...` → `exchangeCodeForSession` → `redirect(next)`.

---

## Known Column Pitfalls

| What you might assume | Actual column name |
|---|---|
| `website_url` on companies | `website` |
| `logo` on companies | `logo_url` |
| `user_id` on reviews | `reviewer_id` |
| `recommend` on reviews | `would_recommend` |

---

## Known Routing Pitfalls

| Wrong | Correct | Why |
|---|---|---|
| `/categories/${parent.slug}/${sub.slug}` | `/categories/${sub.slug}` | No `/categories/[parent]/[child]` route exists. The single-segment `/categories/[slug]` handles both parent and subcategory slugs; subcategory pages resolve their parent via `parent_id`. |

---

## Migration Log

| File | What it adds |
|---|---|
| 001 | Admin role + RLS |
| 002 | Tags system: `tags`, `tag_synonyms`, `review_tags`, `company_tags` |
| 003 | Features: `features`, `company_features` |
| 004 | Business models |
| 005 | `products_services`, `review_product_services` |
| 006 | Invite tokens |
| 007 | `invite_email_logs`, `companies.plan` |
| 008 | `review_responses` (reply to reviews) |
| 009 | `reviews.review_source` column |
| 010 | B2C schema: `companies.business_type`, `categories.platform_type`, `reviews.review_type` + 14 B2C columns, `audit_log`, B2B rating columns made nullable |
| 011 | B2C categories seeded (~12 parent + ~50 subcategories) |
| 012 | All categories classified by `platform_type` |

---

## Crawler & Traffic Safeguards

Six-layer defence. All layers are live. Request flow:

```
Incoming request
  ├─ L2: Known scraper bot?         → 403  (no DB, no function)
  ├─ L3: Country ≠ IN?              → 403  (except Googlebot/Bingbot/DuckDuckBot)
  ├─ Next-Router-Prefetch header?   → pass (skip rate limit)
  ├─ L4: > 120 req/min (same IP)?   → 429
  └─ Page function runs
       ├─ L6: Data in cache?        → served, no DB query
       └─ Cache miss                → Supabase queried, cached for next N seconds
```

| Layer | File | What it does |
|---|---|---|
| L1 Region | `vercel.json` | Serverless functions run in Mumbai (`bom1`) — close to Supabase India region |
| L2 Bot block | `src/middleware.ts` | Hard 403 on User-Agent match — no function invoked, no DB hit |
| L3 Geo-block | `src/middleware.ts` | Non-IN requests blocked; search engine bots always pass (they crawl from US) |
| L4 Rate limit | `src/middleware.ts` | 120 req/min per IP via Upstash Redis sliding window; prefetches exempt |
| L5 robots.txt | `src/app/robots.ts` | Advisory disallow for audit bots + 10s crawl delay; L2 enforces this hard |
| L6 Cache | `src/app/sitemap.ts` + data files | `unstable_cache` wraps expensive DB fetches; revalidate every 60–3600s |

**Required env vars** (add to Vercel project settings):
```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
Middleware fails open if these are absent — site remains functional, rate limiting is skipped.

**Blocked bots (L2):** serpstatbot, ahrefsbot, semrushbot, mj12bot, dotbot, blexbot, petalbot, baiduspider, yandexbot, majestic, rogerbot, exabot, uptimerobot, pingdom, statuscake

**Never block (search engines only):** googlebot, google-inspectiontool, googlebot-image, googlebot-news, adsbot-google, mediapartners-google, apis-google, feedfetcher-google, bingbot, duckduckbot, slurp. Note: Google Search Console's URL Inspection Tool sends `Google-InspectionTool` (not `googlebot`) — must be in the exemption list or GSC reports 403.

**Applying L6 to a new expensive query:**
```ts
import { unstable_cache } from 'next/cache'

export const getExpensiveData = unstable_cache(
  async () => { /* Supabase queries */ },
  ['unique-cache-key'],
  { revalidate: 60 }
)
```
Invalidate on mutation: call `revalidatePath('/affected-route')` inside the relevant server action.
