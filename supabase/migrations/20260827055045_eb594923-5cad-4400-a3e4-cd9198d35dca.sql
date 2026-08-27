CREATE OR REPLACE FUNCTION public.resubmit_club(_club_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated integer;
BEGIN
  UPDATE public.clubs
  SET status = 'pending', rejection_reason = NULL, applied_at = now()
  WHERE id = _club_id
    AND owner_id = auth.uid()
    AND status = 'rejected';
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.resubmit_club(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resubmit_club(text) TO authenticated;