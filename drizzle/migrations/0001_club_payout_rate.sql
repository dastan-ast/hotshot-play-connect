ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS payout_rate_per_hour integer NOT NULL DEFAULT 600;
CREATE OR REPLACE FUNCTION public.protect_club_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.owner_id := OLD.owner_id;
    NEW.payout_rate_per_hour := OLD.payout_rate_per_hour;
  END IF;
  RETURN NEW;
END;
$function$;