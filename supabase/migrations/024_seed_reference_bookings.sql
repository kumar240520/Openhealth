-- Migration: 024_seed_reference_bookings.sql
-- Description: Seeds the 4 authentic hospital bed reservations reflecting the reference image:
-- 1. CityCare Hospital (ICU, Confirmed, Upcoming)
-- 2. Medilife Hospital (General Ward, Pending, Upcoming)
-- 3. Shalby Hospital (ICU, Completed)
-- 4. Bombay Hospital (General Ward, Cancelled)

DO $$
DECLARE
    p_rec RECORD;
    citycare_id UUID;
    medilife_id UUID;
    shalby_id UUID;
    bombay_id UUID;
    icu_type_id UUID;
    gen_type_id UUID;
BEGIN
    -- 1. Resolve Indore Hospital IDs
    SELECT id INTO citycare_id FROM public.hospitals WHERE name ILIKE '%CityCare%' LIMIT 1;
    SELECT id INTO medilife_id FROM public.hospitals WHERE name ILIKE '%Medilife%' LIMIT 1;
    SELECT id INTO shalby_id FROM public.hospitals WHERE name ILIKE '%Shalby%' LIMIT 1;
    SELECT id INTO bombay_id FROM public.hospitals WHERE name ILIKE '%Bombay%' LIMIT 1;

    -- 2. Resolve Bed Type IDs
    SELECT id INTO icu_type_id FROM public.bed_types WHERE name = 'ICU' LIMIT 1;
    SELECT id INTO gen_type_id FROM public.bed_types WHERE name = 'General Ward' LIMIT 1;

    -- 3. Iterate over each registered patient in public.patient_profiles
    FOR p_rec IN SELECT id FROM public.patient_profiles LOOP

        -- Delete any pre-existing mock/test records for this patient to ensure a pristine 4-item state matching reference image
        DELETE FROM public.bed_reservations WHERE patient_id = p_rec.id;

        -- Booking 1: CityCare Hospital (ICU Reservation, Confirmed, Upcoming)
        INSERT INTO public.bed_reservations (
            id, patient_id, hospital_id, bed_type_id, status, deposit_amount, payment_status,
            reserved_at, expires_at, confirmed_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), p_rec.id, citycare_id, icu_type_id, 'confirmed', 2500, 'pending',
            '2026-08-29 18:15:00+00', '2026-08-29 20:15:00+00', '2026-08-28 16:30:00+00',
            '2026-08-28 16:30:00+00', '2026-08-28 16:30:00+00'
        );

        -- Booking 2: Medilife / General Hospital (General Ward Reservation, Pending, Upcoming)
        INSERT INTO public.bed_reservations (
            id, patient_id, hospital_id, bed_type_id, status, deposit_amount, payment_status,
            reserved_at, expires_at, confirmed_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), p_rec.id, medilife_id, gen_type_id, 'pending', 1000, 'pending',
            '2026-09-02 11:30:00+00', '2026-09-02 13:30:00+00', NULL,
            '2026-09-01 10:00:00+00', '2026-09-01 10:00:00+00'
        );

        -- Booking 3: Shalby / Fortis Hospital (ICU Reservation, Completed)
        INSERT INTO public.bed_reservations (
            id, patient_id, hospital_id, bed_type_id, status, deposit_amount, payment_status,
            reserved_at, expires_at, confirmed_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), p_rec.id, shalby_id, icu_type_id, 'completed', 2500, 'paid',
            '2026-09-05 14:45:00+00', '2026-09-05 16:45:00+00', '2026-09-04 12:00:00+00',
            '2026-09-04 12:00:00+00', '2026-09-05 18:00:00+00'
        );

        -- Booking 4: Bombay / Shekhar Hospital (General Ward Reservation, Cancelled)
        INSERT INTO public.bed_reservations (
            id, patient_id, hospital_id, bed_type_id, status, deposit_amount, payment_status,
            reserved_at, expires_at, confirmed_at, cancelled_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), p_rec.id, bombay_id, gen_type_id, 'cancelled', 1000, 'refunded',
            '2026-08-25 10:00:00+00', '2026-08-25 12:00:00+00', NULL, '2026-08-24 15:00:00+00',
            '2026-08-24 09:30:00+00', '2026-08-24 15:00:00+00'
        );

    END LOOP;
END $$;
