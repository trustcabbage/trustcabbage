-- Tracks which channel a review came from (invite link, whatsapp, email, qr, organic).
-- Populated via the src= URL param passed through the invite URL chain.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS review_source text
    CHECK (review_source IN ('link', 'whatsapp', 'email', 'qr', 'widget', 'organic'));
