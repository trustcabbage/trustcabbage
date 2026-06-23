# Trust Cabbage — Final Consolidated Patch
**Replaces:** Patch 03, Patch 04, Patch 05
**Purpose:** B2C integration, business type system, category classification,
migration SQL, and step-by-step build instructions for Claude Code.

---

## PART 1 — CONCEPTS (read this first)

### Three things, clearly defined

| Term | What it means | Where it lives |
|---|---|---|
| **Business Type** | What kind of company it is. 3 options. | `companies.business_type` |
| **Category** | The directory bucket — Payment Gateways, Skincare, Logistics etc. | `categories` table. Filtered by business type. |
| ~~Industry~~ | **Does not exist.** Category IS the industry. Remove this word everywhere. | Deleted |

### The 3 business types

| Value in DB | Label shown to users | Maps to | Review form |
|---|---|---|---|
| `business_services` | Business Services Company | B2B | B2B form |
| `online_b2c` | Online B2C Company | B2C | B2C form |
| `retail_chain` | Retail Chain / Retail Store | B2C | B2C form + in-store fields |

### Business type selector UI rule
- **Nothing pre-selected** — user must consciously pick one
- Cannot proceed without selecting
- Order is always: Business Services Company first, Online B2C second, Retail Chain third
- This order serves both audiences: B2B buyer selects first option immediately,
  B2C buyer immediately knows to skip to option 2 or 3

### Where business type is set
Every entry point into the company database uses the same 3 options
in the same order:

| Entry point | Who sets it | Page |
|---|---|---|
| Company self-registers | Company owner | `/dashboard/companies/new` |
| Reviewer creates stub | Reviewer | `/write-review/new` |
| Admin creates company | Admin | `/admin/companies/new` |
| Company claims stub | Company (correction) | `/company/[slug]/claim` |
| Admin edits company | Admin | `/admin/companies/[id]/edit` |
| Company updates later | Company | `/dashboard/settings` |
| Bulk CSV import | Admin | `business_type` column in CSV |

---

## PART 2 — SCHEMA CHANGES

### 2.1 — companies table

```sql
-- Add business_type
ALTER TABLE companies
ADD COLUMN business_type TEXT
CHECK (business_type IN ('business_services', 'online_b2c', 'retail_chain', 'both'));

-- Migrate existing platform_type → business_type
UPDATE companies SET business_type =
  CASE platform_type
    WHEN 'b2b'  THEN 'business_services'
    WHEN 'b2c'  THEN 'online_b2c'
    WHEN 'both' THEN 'both'
    ELSE 'business_services'
  END
WHERE business_type IS NULL;

-- Make NOT NULL after migration
ALTER TABLE companies
ALTER COLUMN business_type SET NOT NULL;

-- Drop old column
ALTER TABLE companies DROP COLUMN IF EXISTS platform_type;
```

### 2.2 — categories table

```sql
-- Add platform_type to categories (keep b2b/b2c/both — simpler for categories)
ALTER TABLE categories
ADD COLUMN platform_type TEXT NOT NULL DEFAULT 'b2b'
CHECK (platform_type IN ('b2b', 'b2c', 'both'));
```

### 2.3 — reviews table — new columns

```sql
-- Review type (b2b or b2c) — set based on company's business_type at time of review
ALTER TABLE reviews
ADD COLUMN review_type TEXT NOT NULL DEFAULT 'b2b'
CHECK (review_type IN ('b2b', 'b2c'));

-- B2C rating columns
ALTER TABLE reviews
ADD COLUMN rating_product_accuracy  INTEGER CHECK (rating_product_accuracy BETWEEN 1 AND 5),
ADD COLUMN rating_packaging         INTEGER CHECK (rating_packaging BETWEEN 1 AND 5),
ADD COLUMN rating_delivery_speed    INTEGER CHECK (rating_delivery_speed BETWEEN 1 AND 5),
ADD COLUMN rating_return_refund     INTEGER CHECK (rating_return_refund BETWEEN 1 AND 5),
ADD COLUMN rating_value_for_money   INTEGER CHECK (rating_value_for_money BETWEEN 1 AND 5),
ADD COLUMN rating_customer_support  INTEGER CHECK (rating_customer_support BETWEEN 1 AND 5),

-- B2C purchase context
ADD COLUMN purchase_type            TEXT CHECK (purchase_type IN ('first_time','repeat','gifting')),
ADD COLUMN order_value_range        TEXT CHECK (order_value_range IN ('under_500','500_2000','2000_5000','above_5000')),
ADD COLUMN discovery_channel        TEXT CHECK (discovery_channel IN ('instagram','google','friend','youtube','other')),
ADD COLUMN would_buy_again          TEXT CHECK (would_buy_again IN ('yes','no','maybe')),
ADD COLUMN product_photo_url        TEXT,

-- Retail-specific columns
ADD COLUMN purchase_channel         TEXT CHECK (purchase_channel IN ('online','in_store','both')),
ADD COLUMN rating_store_experience  INTEGER CHECK (rating_store_experience BETWEEN 1 AND 5),
ADD COLUMN rating_staff_in_store    INTEGER CHECK (rating_staff_in_store BETWEEN 1 AND 5);

-- Note: Existing B2B columns stay untouched:
-- rating_staff, rating_quality, rating_communication,
-- rating_billing, rating_after_sales, rating_delivery
-- B2C reviews leave B2B columns NULL and vice versa.
-- review_type tells the app which set to read.
```

### 2.4 — audit_log table (new)

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  action          TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  changed_by      UUID REFERENCES auth.users(id),
  changed_by_role TEXT CHECK (changed_by_role IN ('company_admin','admin','system')),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 2.5 — Backward compatibility view

```sql
-- So existing queries using platform_type still work
CREATE OR REPLACE VIEW companies_with_platform AS
SELECT *,
  CASE business_type
    WHEN 'business_services' THEN 'b2b'
    WHEN 'online_b2c'        THEN 'b2c'
    WHEN 'retail_chain'      THEN 'b2c'
    WHEN 'both'              THEN 'both'
  END AS platform_type
FROM companies;
```

---

## PART 3 — MIGRATION SQL

Run this after all schema changes above. Safe to re-run (idempotent).

```sql
-- ============================================================
-- MIGRATION 001 — Classify all categories by platform_type
-- ============================================================

-- Step 1: Baseline — all categories are B2B
UPDATE categories SET platform_type = 'b2b'
WHERE platform_type IS NULL OR platform_type = 'b2b';

-- Step 2: B2C top-level categories
UPDATE categories SET platform_type = 'b2c' WHERE slug IN (
  'fashion-apparel',
  'beauty-personal-care',
  'home-living',
  'electronics-gadgets',
  'food-beverages',
  'health-wellness',
  'books-hobbies-learning',
  'baby-kids',
  'pets',
  'automotive',
  'sustainable-eco-brands',
  'retail-multi-brand'
);

-- Step 3: B2C subcategories
UPDATE categories SET platform_type = 'b2c' WHERE slug IN (
  'clothing-ethnic-wear','footwear','accessories-jewellery',
  'sportswear-activewear','kids-fashion','innerwear-loungewear',
  'skincare','haircare','makeup-cosmetics','men-grooming',
  'fragrances-perfumes','oral-care',
  'furniture-decor','bedding-bath','kitchen-dining',
  'lighting','home-appliances','home-cleaning',
  'headphones-audio','smartwatches-wearables','mobile-accessories',
  'laptops-peripherals','smart-home-devices',
  'health-nutrition','organic-natural-foods','snacks-packaged-foods',
  'beverages-juices','baby-food-nutrition','gourmet-specialty-foods',
  'fitness-equipment','ayurvedic-herbal','medical-devices',
  'mental-wellness','sexual-wellness',
  'books-stationery','art-craft-supplies','musical-instruments',
  'board-games-toys','edtech-online-courses',
  'baby-care-hygiene','maternity-feeding','toys-early-learning',
  'kids-nutrition',
  'pet-food-treats','pet-accessories','pet-grooming-products',
  'pet-healthcare',
  'car-accessories','bike-accessories','car-care-products',
  'sustainable-fashion','zero-waste-products','organic-living'
);

-- Step 4: Both (serve B2B and B2C)
UPDATE categories SET platform_type = 'both' WHERE slug IN (
  'photography',
  'video-production',
  'edtech-online-courses',
  'mental-wellness',
  'packaging-solutions'
);

-- Step 5: Verify — run this SELECT after migration
SELECT platform_type, COUNT(*) as total
FROM categories
GROUP BY platform_type
ORDER BY platform_type;
-- Expected: b2b ~55, b2c ~50, both ~5
```

---

## PART 4 — BUSINESS TYPE SELECTOR COMPONENT

Build this as a reusable React component `<BusinessTypeSelector />`.
Used identically across all 4 entry points — no variations.

```tsx
// components/BusinessTypeSelector.tsx
// Props: value, onChange, error

const options = [
  {
    value: 'business_services',
    label: 'Business Services Company',
    description: 'I provide services or solutions to other businesses.',
    examples: 'Web agency, CA firm, logistics, SaaS, HR software, IT company',
  },
  {
    value: 'online_b2c',
    label: 'Online B2C Company',
    description: 'I sell products directly to consumers online.',
    examples: 'Skincare brand, fashion store, D2C food brand, electronics store',
  },
  {
    value: 'retail_chain',
    label: 'Retail Chain / Retail Store',
    description: 'I have physical stores selling to consumers.',
    examples: 'Pharmacy chain, supermarket, multi-city fashion store',
  },
]

// Nothing pre-selected. User must pick one.
// On select → parent updates state → category dropdown re-renders
// with filtered categories matching selected business type.
```

---

## PART 5 — CATEGORY DROPDOWN FILTERING LOGIC

After business type is selected, the category dropdown filters accordingly.

```ts
// lib/getCategoriesByBusinessType.ts

export function getCategoriesByBusinessType(
  businessType: 'business_services' | 'online_b2c' | 'retail_chain' | 'both',
  allCategories: Category[]
) {
  if (businessType === 'both') return allCategories

  const platformType = businessType === 'business_services' ? 'b2b' : 'b2c'

  return allCategories.filter(
    cat => cat.platform_type === platformType || cat.platform_type === 'both'
  )
}
```

---

## PART 6 — REVIEW FORM LOGIC

The review form at `/company/[slug]/write-review` checks
`company.business_type` and renders the correct flow.

```
business_services → B2B review form (existing steps 1–5)

online_b2c        → B2C review form:
                    Step 1: purchase_type, order_value_range, discovery_channel
                    Step 2: product/service selection or hashtag
                    Step 3: B2C ratings (product accuracy, packaging,
                            delivery, returns, value, support)
                    Step 4: B2C written questions
                    Step 5: photo upload + proof

retail_chain      → B2C review form + retail additions:
                    Pre-step: purchase_channel (online / in_store / both)
                    Step 1–4: same as online_b2c
                    Step 3 additions (if in_store or both):
                      + rating_store_experience
                      + rating_staff_in_store
                    Step 4 addition: "Describe your in-store experience"

both              → Show pre-step before Step 1:
                    "Are you reviewing them as a business client
                     or as an individual consumer?"
                    → As a business client → load B2B form
                    → As an individual consumer → load B2C form
                    Sets reviews.review_type accordingly
```

---

## PART 7 — ALL PAGES THAT CHANGE

| Page | What changes |
|---|---|
| `/` Homepage | Two browse sections: "B2B Services" + "Online Brands & Stores" |
| `/categories` | Tab toggle: B2B Services / Online Brands & Stores |
| `/categories/[slug]` | Small type badge on company cards |
| `/company/[slug]` | Rating bars change based on business_type |
| `/company/[slug]/write-review` | Form flow switches based on business_type |
| `/write-review` | No change |
| `/write-review/new` | BusinessTypeSelector → filtered categories → review |
| `/search` | Filter pill: All / B2B / Online Brands |
| `/dashboard/companies/new` | BusinessTypeSelector first, then filtered categories |
| `/company/[slug]/claim` | Correction step for business_type after proof upload |
| `/dashboard/settings` | Allow company to update business_type post-claim |
| `/admin/companies/new` | BusinessTypeSelector + filtered categories |
| `/admin/companies/[id]/edit` | business_type editable by admin anytime |
| `/admin/companies/import` | CSV column: `business_type` |
| `/admin/categories` | platform_type column visible, filterable |

---

## PART 8 — HOMEPAGE SECTION LOGIC

```
business_type = 'business_services' → B2B Services section only
business_type = 'online_b2c'        → Online Brands & Stores section only
business_type = 'retail_chain'      → Online Brands & Stores section
                                       + small "🏪 Has physical stores" badge
business_type = 'both'              → Appears in BOTH sections
                                       + small "✦ B2B + B2C" badge
```

---

## PART 9 — CSV IMPORT UPDATE

Updated CSV template columns:
```
name, website, description, city, state, founded_year, employee_count,
gst_number, cin_number, category_slugs, tags, business_type
```

Valid `business_type` values: `business_services`, `online_b2c`, `retail_chain`, `both`

Backward compatibility — auto-map old values if found:
- `b2b` → `business_services`
- `b2c` → `online_b2c`

Default if column is empty: `business_services`

---

## PART 10 — STEP BY STEP BUILD INSTRUCTIONS FOR CLAUDE CODE

Follow this exact order. Do not skip steps or build out of sequence.

### STEP 1 — Run schema changes
Run all SQL from Part 2 in order.

### STEP 2 — Run category seed SQL (from Patch 03)
Run the full INSERT INTO categories seed SQL.
Uses ON CONFLICT (slug) DO NOTHING — safe to re-run.

### STEP 3 — Run migration SQL (Part 3 above)
Run the 4-step category platform_type classification.

### STEP 4 — Build BusinessTypeSelector component
### STEP 5 — Build getCategoriesByBusinessType utility
### STEP 6 — Update /write-review/new
### STEP 7 — Update /dashboard/companies/new
### STEP 8 — Update /company/[slug]/claim
### STEP 9 — Update /dashboard/settings
### STEP 10 — Update /admin/companies/new and edit
### STEP 11 — Update /admin/companies/import
### STEP 12 — Update /admin/categories
### STEP 13 — Update review form /company/[slug]/write-review
### STEP 14 — Update homepage /
### STEP 15 — Update /categories page
### STEP 16 — Update /search page
### STEP 17 — Update /company/[slug] profile page
