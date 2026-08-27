CREATE TYPE public.app_role AS ENUM ('player', 'club_admin', 'owner', 'admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'Astana',
  club_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.clubs (
  id text PRIMARY KEY DEFAULT ('c' || replace(gen_random_uuid()::text, '-', '')),
  name text NOT NULL,
  city text NOT NULL DEFAULT 'Astana',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  lat double precision NOT NULL DEFAULT 51.1284,
  lng double precision NOT NULL DEFAULT 71.4306,
  rating numeric NOT NULL DEFAULT 0,
  reviews_count integer NOT NULL DEFAULT 0,
  open_from text NOT NULL DEFAULT '10:00',
  open_to text NOT NULL DEFAULT '02:00',
  price_per_hour integer NOT NULL DEFAULT 500,
  total_seats integer NOT NULL DEFAULT 20,
  specs text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cover text NOT NULL DEFAULT 'linear-gradient(135deg, oklch(0.5 0.22 300), oklch(0.55 0.18 220))',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  rejection_reason text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clubs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs TO authenticated;
GRANT ALL ON public.clubs TO service_role;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active clubs" ON public.clubs
  FOR SELECT TO anon, authenticated USING (status = 'active');
CREATE POLICY "Owners read their clubs" ON public.clubs
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Admins read all clubs" ON public.clubs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create their clubs" ON public.clubs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND status = 'pending');
CREATE POLICY "Admins create clubs" ON public.clubs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners update their clubs" ON public.clubs
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins update clubs" ON public.clubs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete clubs" ON public.clubs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.protect_club_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.owner_id := OLD.owner_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER clubs_protect_status
BEFORE UPDATE ON public.clubs
FOR EACH ROW EXECUTE FUNCTION public.protect_club_status();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wanted text;
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'city', 'Astana')
  )
  ON CONFLICT (id) DO NOTHING;

  wanted := COALESCE(NEW.raw_user_meta_data ->> 'role', 'player');
  IF wanted NOT IN ('player', 'owner') THEN
    wanted := 'player';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, wanted::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.clubs (id, name, city, address, phone, lat, lng, rating, reviews_count, open_from, open_to, price_per_hour, total_seats, specs, description, cover, status)
VALUES
('c1','CyberDome Astana','Astana','пр. Мангилик Ел 55','+7 7172 55 01 01',51.0905,71.3982,4.8,412,'10:00','06:00',700,60,'i5-12400F · RTX 4060 · 165Hz','Флагманский киберклуб на левом берегу: 60 машин, турнирная зона и кафе.','linear-gradient(135deg, oklch(0.5 0.22 300), oklch(0.55 0.18 220))','active'),
('c2','NeonBox Esports','Astana','ул. Кабанбай батыра 13','+7 7172 13 13 13',51.1283,71.4306,4.6,288,'00:00','24:00',550,32,'i5-11400F · RTX 3050 · 144Hz','Круглосуточный клуб в центре с быстрым интернетом и стрим-кабиной.','linear-gradient(135deg, oklch(0.52 0.2 200), oklch(0.45 0.2 320))','active'),
('c3','Pixel Arena','Astana','ул. Сыганак 29','+7 7172 29 29 29',51.1235,71.4045,4.4,173,'09:00','03:00',500,24,'Ryzen 5 5600 · RTX 3060 · 144Hz','Уютный зал рядом с Байтереком — низкие цены и тихие утренние часы.','linear-gradient(135deg, oklch(0.5 0.19 160), oklch(0.48 0.2 270))','active'),
('c4','Colizeum Left Bank','Astana','ул. Достык 5','+7 7172 05 05 05',51.1185,71.4668,4.7,502,'00:00','24:00',800,90,'i5-13400F · RTX 4060 Ti · 180Hz','Крупнейший зал сети: 90 мест, киберспортивная сцена и дисконт ночью.','linear-gradient(135deg, oklch(0.48 0.22 350), oklch(0.5 0.2 250))','active');