CREATE TABLE public.club_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

-- helper: is user staff or owner of a club
CREATE OR REPLACE FUNCTION public.is_club_member(_user_id uuid, _club_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = _club_id AND c.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.club_staff s WHERE s.club_id = _club_id AND s.user_id = _user_id)
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_staff TO authenticated;
GRANT ALL ON public.club_staff TO service_role;
ALTER TABLE public.club_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read own or club owner" ON public.club_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner manages staff insert" ON public.club_staff FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "owner manages staff delete" ON public.club_staff FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clubs c WHERE c.id = club_id AND c.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.player_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  hours_total integer,
  hours_left integer,
  started_at date NOT NULL DEFAULT current_date,
  valid_until date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_subscriptions TO authenticated;
GRANT ALL ON public.player_subscriptions TO service_role;
ALTER TABLE public.player_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs read own" ON public.player_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "subs insert own" ON public.player_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "subs update own" ON public.player_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  player_name text NOT NULL DEFAULT '',
  player_phone text NOT NULL DEFAULT '',
  booking_date date NOT NULL,
  start_time text NOT NULL,
  hours integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_club_date_idx ON public.bookings (club_id, booking_date);
CREATE INDEX bookings_user_idx ON public.bookings (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read own or club" ON public.bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_club_member(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings update own or club" ON public.bookings FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_club_member(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.is_club_member(auth.uid(), club_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id text NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews insert own" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews update own" ON public.reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews delete own" ON public.reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'subscription',
  label text NOT NULL DEFAULT '',
  amount_kzt integer NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'succeeded',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read own" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "payments insert own" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- keep club rating in sync with reviews
CREATE OR REPLACE FUNCTION public.sync_club_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target text := COALESCE(NEW.club_id, OLD.club_id);
BEGIN
  UPDATE public.clubs c
  SET rating = COALESCE((SELECT round(avg(r.rating)::numeric, 1) FROM public.reviews r WHERE r.club_id = target), 0),
      reviews_count = (SELECT count(*) FROM public.reviews r WHERE r.club_id = target)
  WHERE c.id = target;
  RETURN NULL;
END;
$$;
CREATE TRIGGER reviews_sync_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_club_rating();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE ALL ON FUNCTION public.sync_club_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_club_member(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_club_member(uuid, text) TO authenticated;