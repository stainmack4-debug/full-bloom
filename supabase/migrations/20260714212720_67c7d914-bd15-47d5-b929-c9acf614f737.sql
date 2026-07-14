
-- Enums
CREATE TYPE public.package_status AS ENUM ('pending','assigned','picked_up','in_transit','out_for_delivery','delivered','cancelled');
CREATE TYPE public.driver_status AS ENUM ('available','busy','offline');
CREATE TYPE public.pickup_option AS ENUM ('customer_dropoff','driver_pickup');

-- Tracking ID generator: NXR + 6 digits
CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  new_id text;
BEGIN
  LOOP
    new_id := 'NXR' || lpad((floor(random()*900000)+100000)::int::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.packages WHERE tracking_id = new_id);
  END LOOP;
  RETURN new_id;
END; $$;

-- Drivers
CREATE TABLE public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  vehicle text,
  plate text,
  status public.driver_status NOT NULL DEFAULT 'available',
  today_earnings_ngn numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO anon, authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers_all_access" ON public.drivers FOR ALL USING (true) WITH CHECK (true);

-- Packages
CREATE TABLE public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text UNIQUE NOT NULL DEFAULT public.generate_tracking_id(),

  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,

  sender_name text NOT NULL,
  sender_phone text NOT NULL,
  sender_address text NOT NULL,

  receiver_name text NOT NULL,
  receiver_phone text NOT NULL,
  receiver_address text NOT NULL,

  package_type text NOT NULL DEFAULT 'Document',
  weight_kg numeric NOT NULL DEFAULT 1,
  description text,

  pickup_option public.pickup_option NOT NULL DEFAULT 'driver_pickup',
  pickup_at timestamptz,
  estimated_delivery timestamptz,

  distance_km numeric NOT NULL DEFAULT 10,
  fee_ngn numeric NOT NULL DEFAULT 2500,

  status public.package_status NOT NULL DEFAULT 'pending',
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX packages_status_idx ON public.packages(status);
CREATE INDEX packages_driver_idx ON public.packages(driver_id);
CREATE INDEX packages_tracking_idx ON public.packages(tracking_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO anon, authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_all_access" ON public.packages FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER packages_touch_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Package events (timeline)
CREATE TABLE public.package_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  status public.package_status NOT NULL,
  note text,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX package_events_pkg_idx ON public.package_events(package_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.package_events TO anon, authenticated;
GRANT ALL ON public.package_events TO service_role;
ALTER TABLE public.package_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "package_events_all_access" ON public.package_events FOR ALL USING (true) WITH CHECK (true);

-- Log initial event on package creation
CREATE OR REPLACE FUNCTION public.log_package_created()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.package_events(package_id, status, note, actor)
  VALUES (NEW.id, NEW.status, 'Package created', 'system');
  RETURN NEW;
END; $$;
CREATE TRIGGER packages_log_created
AFTER INSERT ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.log_package_created();

-- Log status changes
CREATE OR REPLACE FUNCTION public.log_package_status_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.package_events(package_id, status, note, actor)
    VALUES (NEW.id, NEW.status, 'Status updated to ' || NEW.status::text, 'system');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER packages_log_status_change
AFTER UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.log_package_status_change();

-- Proof of delivery
CREATE TABLE public.proof_of_delivery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL UNIQUE REFERENCES public.packages(id) ON DELETE CASCADE,
  photo_url text,
  signature_data_url text,
  receiver_name text NOT NULL,
  delivered_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proof_of_delivery TO anon, authenticated;
GRANT ALL ON public.proof_of_delivery TO service_role;
ALTER TABLE public.proof_of_delivery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pod_all_access" ON public.proof_of_delivery FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.package_events;
