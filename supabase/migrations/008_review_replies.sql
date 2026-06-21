-- Public company replies to individual reviews.
-- One reply per review (UNIQUE on review_id).
-- Visible to all visitors on the company profile page.

CREATE TABLE IF NOT EXISTS public.review_responses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 10 AND 2000),
  replied_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_responses_review ON public.review_responses (review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_company ON public.review_responses (company_id);

ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can read responses (public page)
CREATE POLICY "Public can read review responses"
  ON public.review_responses FOR SELECT
  USING (true);

-- Company admin can insert/update replies for their own company
CREATE POLICY "Company admin can reply"
  ON public.review_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'company_admin'
        AND company_id = review_responses.company_id
    )
  );

CREATE POLICY "Company admin can update own reply"
  ON public.review_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'company_admin'
        AND company_id = review_responses.company_id
    )
  );
