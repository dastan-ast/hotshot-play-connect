-- Only server-side (service_role) can create subscriptions, i.e. after admin approval
DROP POLICY IF EXISTS "subs insert own" ON public.player_subscriptions;

-- Prevent players from inflating their own hours or reviving expired passes
CREATE OR REPLACE FUNCTION public.guard_subscription_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF NEW.hours_total IS DISTINCT FROM OLD.hours_total
     OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
     OR NEW.valid_until IS DISTINCT FROM OLD.valid_until
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Subscription details cannot be changed';
  END IF;
  IF NEW.hours_left IS NOT NULL AND OLD.hours_left IS NOT NULL
     AND NEW.hours_left > COALESCE(OLD.hours_total, OLD.hours_left) THEN
    RAISE EXCEPTION 'Hours cannot exceed the purchased amount';
  END IF;
  IF OLD.status <> 'active' AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Subscription cannot be re-activated';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_subscription_update ON public.player_subscriptions;
CREATE TRIGGER guard_subscription_update
BEFORE UPDATE ON public.player_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.guard_subscription_update();