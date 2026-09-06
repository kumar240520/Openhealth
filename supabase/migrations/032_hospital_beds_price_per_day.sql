-- ============================================================================
-- 032_hospital_beds_price_per_day.sql
-- Add price_per_day column to public.hospital_beds and seed realistic pricing
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'hospital_beds' AND column_name = 'price_per_day'
    ) THEN
        ALTER TABLE public.hospital_beds ADD COLUMN price_per_day NUMERIC DEFAULT 1500;
    END IF;
END $$;

-- Seed realistic daily bed rates based on bed type classifications
UPDATE public.hospital_beds hb
SET price_per_day = CASE 
    WHEN bt.name ILIKE '%icu%' OR bt.name ILIKE '%intensive%' THEN 8500
    WHEN bt.name ILIKE '%hdu%' OR bt.name ILIKE '%dependency%' THEN 5500
    WHEN bt.name ILIKE '%deluxe%' OR bt.name ILIKE '%private%' THEN 4500
    WHEN bt.name ILIKE '%semi%' THEN 2800
    WHEN bt.name ILIKE '%daycare%' THEN 1800
    ELSE 1500
END
FROM public.bed_types bt
WHERE hb.bed_type_id = bt.id AND (hb.price_per_day IS NULL OR hb.price_per_day = 1500);
