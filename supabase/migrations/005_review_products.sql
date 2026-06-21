-- Junction table: one review can reference multiple products/services
CREATE TABLE IF NOT EXISTS public.review_product_services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  product_service_id uuid NOT NULL REFERENCES public.products_services(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, product_service_id)
);

ALTER TABLE public.review_product_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read review_product_services" ON public.review_product_services;
CREATE POLICY "Public read review_product_services" ON public.review_product_services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert review_product_services" ON public.review_product_services;
CREATE POLICY "Authenticated insert review_product_services" ON public.review_product_services
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
