-- Migration 027: Enable Supabase Realtime CDC publication on hospital tables
-- Ensures live sync across Hospital Admin Portal and Patient Marketplace

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- Enable Realtime events for live data synchronization across shared healthcare entities
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.treatment_packages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_beds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bed_reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_appointments;
