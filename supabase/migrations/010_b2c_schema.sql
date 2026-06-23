-- ============================================================
-- Migration 010 — B2C Integration: Schema Changes
-- Part 2 of trust-cabbage-patch-final.md
-- Run BEFORE 011_b2c_categories.sql and 012_category_platform_types.sql
-- ============================================================

-- ─── 2.1: companies.business_type ────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS business_type TEXT
  CHECK (business_type IN ('business_services', 'online_b2c', 'retail_chain', 'both'));

-- Default all existing companies to business_services
-- (platform_type does not exist in this schema — no migration needed)
UPDATE public.companies
  SET business_type = 'business_services'
  WHERE business_type IS NULL;

ALTER TABLE public.companies
  ALTER COLUMN business_type SET NOT NULL;

-- No-op: platform_type never existed, safe to run
ALTER TABLE public.companies DROP COLUMN IF EXISTS platform_type;

-- ─── 2.2: categories.platform_type ───────────────────────────────────────────

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS platform_type TEXT NOT NULL DEFAULT 'b2b'
  CHECK (platform_type IN ('b2b', 'b2c', 'both'));

-- ─── 2.3: reviews — review_type + B2C columns ────────────────────────────────

-- review_type distinguishes which rating set to read
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_type TEXT NOT NULL DEFAULT 'b2b'
  CHECK (review_type IN ('b2b', 'b2c'));

-- B2B-specific fields must become nullable so B2C reviews can leave them NULL.
-- Existing B2B reviews already have values — data is safe.
ALTER TABLE public.reviews
  ALTER COLUMN association_type DROP NOT NULL,
  ALTER COLUMN reviewer_role    DROP NOT NULL,
  ALTER COLUMN engagement_phase DROP NOT NULL,
  ALTER COLUMN association_duration DROP NOT NULL,
  ALTER COLUMN rating_staff         DROP NOT NULL,
  ALTER COLUMN rating_quality       DROP NOT NULL,
  ALTER COLUMN rating_communication DROP NOT NULL,
  ALTER COLUMN rating_billing       DROP NOT NULL,
  ALTER COLUMN rating_after_sales   DROP NOT NULL,
  ALTER COLUMN rating_delivery      DROP NOT NULL;

-- B2C rating dimensions
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS rating_product_accuracy  INTEGER CHECK (rating_product_accuracy  BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_packaging         INTEGER CHECK (rating_packaging          BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_delivery_speed    INTEGER CHECK (rating_delivery_speed     BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_return_refund     INTEGER CHECK (rating_return_refund      BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_value_for_money   INTEGER CHECK (rating_value_for_money    BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_customer_support  INTEGER CHECK (rating_customer_support   BETWEEN 1 AND 5);

-- B2C purchase context
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS purchase_type       TEXT CHECK (purchase_type IN ('first_time','repeat','gifting')),
  ADD COLUMN IF NOT EXISTS order_value_range   TEXT CHECK (order_value_range IN ('under_500','500_2000','2000_5000','above_5000')),
  ADD COLUMN IF NOT EXISTS discovery_channel   TEXT CHECK (discovery_channel IN ('instagram','google','friend','youtube','other')),
  ADD COLUMN IF NOT EXISTS would_buy_again     TEXT CHECK (would_buy_again IN ('yes','no','maybe')),
  ADD COLUMN IF NOT EXISTS product_photo_url   TEXT;

-- Retail-specific
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS purchase_channel       TEXT CHECK (purchase_channel IN ('online','in_store','both')),
  ADD COLUMN IF NOT EXISTS rating_store_experience INTEGER CHECK (rating_store_experience BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_staff_in_store   INTEGER CHECK (rating_staff_in_store  BETWEEN 1 AND 5);

-- ─── 2.4: audit_log table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT        NOT NULL,
  entity_id       UUID        NOT NULL,
  action          TEXT        NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  changed_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_role TEXT        CHECK (changed_by_role IN ('company_admin','admin','system')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit_log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System insert audit_log" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- ─── 2.5: Backward compatibility view ────────────────────────────────────────

CREATE OR REPLACE VIEW public.companies_with_platform AS
SELECT *,
  CASE business_type
    WHEN 'business_services' THEN 'b2b'
    WHEN 'online_b2c'        THEN 'b2c'
    WHEN 'retail_chain'      THEN 'b2c'
    WHEN 'both'              THEN 'both'
  END AS platform_type
FROM public.companies;

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_companies_business_type ON public.companies(business_type);
CREATE INDEX IF NOT EXISTS idx_categories_platform_type ON public.categories(platform_type);
CREATE INDEX IF NOT EXISTS idx_reviews_review_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
