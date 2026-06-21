-- Tracks every email invite sent by a company via the invite tool.
-- Used to enforce plan-based monthly limits (100/month on Free, unlimited on Growth).
-- During early access limits are not enforced in code, but rows are still written
-- so historical data exists when enforcement is turned on.

CREATE TABLE IF NOT EXISTS public.invite_email_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sent_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient     text NOT NULL,
  status        text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'bounced', 'failed')),
  resend_id     text,          -- Resend message ID for delivery tracking
  sent_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invite_email_logs_company_month
  ON public.invite_email_logs (company_id, sent_at);

-- Helper: count emails sent by a company in the current calendar month
CREATE OR REPLACE FUNCTION public.invite_emails_this_month(p_company_id uuid)
RETURNS integer
LANGUAGE sql STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.invite_email_logs
  WHERE company_id = p_company_id
    AND sent_at >= date_trunc('month', now())
    AND sent_at <  date_trunc('month', now()) + interval '1 month'
    AND status = 'sent';
$$;

-- Add plan column to companies for future enforcement.
-- Default 'free'; set to 'starter' or 'growth' when Razorpay subscription activates.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'growth'));

-- RLS: company admin can read their own logs; insert via service role only
ALTER TABLE public.invite_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admin reads own invite logs"
  ON public.invite_email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND company_id = invite_email_logs.company_id
    )
  );
