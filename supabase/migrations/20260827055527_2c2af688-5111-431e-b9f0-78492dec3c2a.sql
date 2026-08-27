CREATE OR REPLACE FUNCTION public.protect_club_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() IS NULL means a trusted server-side (service role) call.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.owner_id := OLD.owner_id;
  END IF;
  RETURN NEW;
END;
$$;