ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS plan_id text,
  ADD COLUMN IF NOT EXISTS receipt_number text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE public.payments ALTER COLUMN status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "payments insert own" ON public.payments;
CREATE POLICY "payments insert own" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "payments admin update" ON public.payments;
CREATE POLICY "payments admin update" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;