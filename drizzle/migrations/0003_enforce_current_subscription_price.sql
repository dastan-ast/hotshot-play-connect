CREATE OR REPLACE FUNCTION public.validate_subscription_payment_price() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base integer; discount integer := 0; current_day date := (now() AT TIME ZONE 'Asia/Almaty')::date; expected integer;
BEGIN
 IF NEW.kind = 'subscription' THEN
  SELECT base_price_kzt, CASE WHEN promotion_enabled AND (promotion_start IS NULL OR promotion_start <= current_day) AND (promotion_end IS NULL OR promotion_end >= current_day) THEN discount_percent ELSE 0 END INTO base, discount FROM public.subscription_pricing WHERE plan_id = NEW.plan_id;
  IF base IS NULL THEN
   base := CASE NEW.plan_id WHEN 'sub3' THEN 7990 WHEN 'sub5' THEN 13990 WHEN 'sub30' THEN 18990 WHEN 'subInf' THEN 39999 ELSE NULL END;
   discount := 0;
  END IF;
  IF base IS NULL THEN RAISE EXCEPTION 'Unknown subscription plan'; END IF;
  expected := greatest(1, round(base::numeric * (100 - discount) / 100)::integer);
  IF NEW.amount_kzt IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Subscription price changed. Refresh prices before submitting.'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_subscription_payment_price BEFORE INSERT ON public.payments FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_payment_price();