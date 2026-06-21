-- Unique invite token per company for trackable review links
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS invite_token uuid DEFAULT gen_random_uuid();

-- Backfill existing rows that got NULL (if DEFAULT didn't apply)
UPDATE public.companies SET invite_token = gen_random_uuid() WHERE invite_token IS NULL;

-- Track which reviews came via an invite link
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS ref_token uuid;

-- Block company admins from reviewing their own company at DB level
DROP POLICY IF EXISTS "Authenticated insert reviews" ON public.reviews;
CREATE POLICY "Authenticated insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND company_id = reviews.company_id
    )
  );
