CREATE TABLE public.club_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Astana',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  owner_id uuid,
  club_id text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.club_leads TO anon, authenticated;
GRANT SELECT, UPDATE ON public.club_leads TO authenticated;
GRANT ALL ON public.club_leads TO service_role;

ALTER TABLE public.club_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can submit a club lead"
  ON public.club_leads FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND owner_id IS NULL AND club_id IS NULL);

CREATE POLICY "admins read club leads"
  ON public.club_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update club leads"
  ON public.club_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX club_leads_status_idx ON public.club_leads (status, created_at DESC);