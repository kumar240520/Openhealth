-- Migration 029: Strict Invariant Rules for Bed Holds & Inpatient Admissions
-- Rule 1: A patient currently admitted (hospital_admissions.status = 'admitted') cannot hold/book another bed in that hospital until discharged.
-- Rule 2: A patient cannot hold more than 1 bed in the same hospital at the same time.
-- Rule 3: A patient can hold at most 2 beds at a time across all hospitals.

CREATE OR REPLACE FUNCTION public.hold_bed_atomic(
    p_user_or_patient_id uuid,
    p_hospital_id uuid,
    p_bed_type_id uuid,
    p_valid_minutes integer DEFAULT 30,
    p_distance_km numeric DEFAULT NULL,
    p_drive_time text DEFAULT NULL,
    p_travel_minutes integer DEFAULT NULL,
    p_location_captured jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_patient_id UUID;
    v_bed_record public.hospital_beds%ROWTYPE;
    v_reservation public.bed_reservations%ROWTYPE;
    v_expires_at TIMESTAMPTZ;
    v_new_available INT;
    v_new_reserved INT;
    v_active_holds_count INT;
    v_admitted_bed_num TEXT;
BEGIN
    -- 1. Resolve patient_profiles.id
    SELECT id INTO v_patient_id
    FROM public.patient_profiles
    WHERE id = p_user_or_patient_id OR user_id = p_user_or_patient_id
    LIMIT 1;

    IF v_patient_id IS NULL THEN
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_or_patient_id) THEN
            INSERT INTO public.patient_profiles (user_id, city)
            VALUES (p_user_or_patient_id, 'Indore')
            ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
            RETURNING id INTO v_patient_id;
        ELSE
            SELECT id INTO v_patient_id FROM public.patient_profiles LIMIT 1;
            IF v_patient_id IS NULL THEN
                INSERT INTO public.patient_profiles (user_id, city)
                SELECT id, 'Indore' FROM public.profiles LIMIT 1
                RETURNING id INTO v_patient_id;
            END IF;
        END IF;
    END IF;

    -- =========================================================================
    -- INVARIANT CHECK 1: Disallow booking if patient is currently admitted to this hospital
    -- =========================================================================
    SELECT bed_number INTO v_admitted_bed_num
    FROM public.hospital_admissions
    WHERE hospital_id = p_hospital_id 
      AND patient_id = v_patient_id 
      AND status = 'admitted'
    LIMIT 1;

    IF v_admitted_bed_num IS NOT NULL THEN
        RAISE EXCEPTION 'You are currently admitted to unit % at this hospital. You cannot hold another bed until you are discharged.', v_admitted_bed_num;
    END IF;

    -- =========================================================================
    -- INVARIANT CHECK 2: Disallow holding 2 beds at the same hospital
    -- =========================================================================
    IF EXISTS (
        SELECT 1 FROM public.bed_reservations
        WHERE hospital_id = p_hospital_id
          AND patient_id = v_patient_id
          AND status IN ('held', 'pending')
          AND expires_at > now()
    ) THEN
        RAISE EXCEPTION 'You already have an active bed reservation at this hospital. Multiple bed holds at the same hospital are not permitted.';
    END IF;

    -- =========================================================================
    -- INVARIANT CHECK 3: Max 2 bed holds across all different hospitals
    -- =========================================================================
    SELECT count(DISTINCT hospital_id) INTO v_active_holds_count
    FROM public.bed_reservations
    WHERE patient_id = v_patient_id
      AND status IN ('held', 'pending')
      AND expires_at > now();

    IF v_active_holds_count >= 2 THEN
        RAISE EXCEPTION 'You have reached the maximum limit of 2 active bed holds across different hospitals. Please cancel an existing hold before reserving another bed.';
    END IF;

    -- 2. Lock bed row for update to prevent concurrent race conditions
    SELECT * INTO v_bed_record
    FROM public.hospital_beds
    WHERE hospital_id = p_hospital_id AND bed_type_id = p_bed_type_id
    FOR UPDATE;

    IF NOT FOUND THEN
        SELECT * INTO v_bed_record
        FROM public.hospital_beds
        WHERE id = p_bed_type_id
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Bed inventory not found for hospital % and bed %', p_hospital_id, p_bed_type_id;
        END IF;
    END IF;

    IF v_bed_record.available_beds <= 0 THEN
        RAISE EXCEPTION 'No available beds remaining in this category';
    END IF;

    v_expires_at := now() + (p_valid_minutes || ' minutes')::INTERVAL;
    v_new_available := GREATEST(0, v_bed_record.available_beds - 1);
    v_new_reserved := v_bed_record.reserved_beds + 1;

    -- 3. Insert reservation record with locked location, distance, drive time, and timer window
    INSERT INTO public.bed_reservations (
        patient_id,
        hospital_id,
        bed_type_id,
        status,
        deposit_amount,
        payment_status,
        reserved_at,
        expires_at,
        distance_km,
        drive_time,
        travel_minutes,
        hold_minutes,
        location_captured
    )
    VALUES (
        v_patient_id,
        v_bed_record.hospital_id,
        v_bed_record.bed_type_id,
        'held'::public.reservation_status,
        0,
        'pending'::public.payment_status,
        now(),
        v_expires_at,
        p_distance_km,
        p_drive_time,
        p_travel_minutes,
        p_valid_minutes,
        p_location_captured
    )
    RETURNING * INTO v_reservation;

    -- 4. Atomically update hospital_beds capacity
    UPDATE public.hospital_beds
    SET 
        available_beds = v_new_available,
        reserved_beds = v_new_reserved,
        last_updated_at = now(),
        updated_at = now()
    WHERE id = v_bed_record.id;

    RETURN jsonb_build_object(
        'success', true,
        'reservation_id', v_reservation.id,
        'hospital_id', v_bed_record.hospital_id,
        'bed_type_id', v_bed_record.bed_type_id,
        'status', v_reservation.status,
        'expires_at', v_expires_at,
        'valid_minutes', p_valid_minutes,
        'available_beds', v_new_available,
        'reserved_beds', v_new_reserved,
        'distance_km', p_distance_km,
        'drive_time', p_drive_time,
        'travel_minutes', p_travel_minutes,
        'location_captured', p_location_captured
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.hold_bed_atomic TO authenticated, anon, service_role;
