CREATE TABLE public.subscription_pricing (
 plan_id text PRIMARY KEY CHECK (plan_id IN ('sub3','sub5','sub30','subInf')),
 base_price_kzt integer NOT NULL CHECK (base_price_kzt > 0),
 discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 99),
 promotion_enabled boolean NOT NULL DEFAULT false,
 promotion_start date,
 promotion_end date,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (promotion_start IS NULL OR promotion_end IS NULL OR promotion_end >= promotion_start)
);
GRANT SELECT ON public.subscription_pricing TO anon;
GRANT SELECT, INSERT, UPDATE ON public.subscription_pricing TO authenticated;
GRANT ALL ON public.subscription_pricing TO service_role;
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY pricing_public_read ON public.subscription_pricing FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pricing_admin_insert ON public.subscription_pricing FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY pricing_admin_update ON public.subscription_pricing FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));