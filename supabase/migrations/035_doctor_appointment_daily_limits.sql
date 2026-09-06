-- ============================================================================
-- Migration 035: Doctor Appointment Daily Limits & Doctor Uniqueness Invariants
-- 1. Enforces doctor uniqueness per patient per calendar day (different doctors required)
-- 2. Enforces maximum 2 active appointment slots per patient per calendar day
-- 3. Enables slot recycling: completed or cancelled appointments free up a slot
-- 4. Exposes get_patient_daily_appointment_status RPC for instant frontend checks
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_patient_appointment_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_patient_profile_id UUID;
    v_same_doctor_count INT;
    v_active_slots_count INT;
    v_doctor_name TEXT;
BEGIN
    -- Only check for active/relevant statuses
    IF NEW.status IN ('cancelled', 'expired') THEN
        RETURN NEW;
    END IF;

    -- 1. Resolve patient profile and user IDs for bulletproof cross-referencing
    SELECT user_id INTO v_user_id 
    FROM public.patient_profiles 
    WHERE id = NEW.patient_id;

    IF v_user_id IS NULL THEN
        v_user_id := NEW.patient_id;
        SELECT id INTO v_patient_profile_id 
        FROM public.patient_profiles 
        WHERE user_id = v_user_id 
        LIMIT 1;
    ELSE
        v_patient_profile_id := NEW.patient_id;
    END IF;

    -- If neither is resolved, fallback to auth.uid()
    IF v_user_id IS NULL THEN
        v_user_id := auth.uid();
    END IF;

    -- Fetch doctor name for clear, friendly error messages
    SELECT name INTO v_doctor_name 
    FROM public.doctors 
    WHERE id = NEW.doctor_id;
    IF v_doctor_name IS NULL THEN
        v_doctor_name := 'this specialist';
    ELSE
        IF NOT (v_doctor_name ILIKE 'Dr.%') THEN
            v_doctor_name := 'Dr. ' || v_doctor_name;
        END IF;
    END IF;

    -- 2. Invariant 1: Doctor Uniqueness per Day
    -- A patient cannot book the same doctor more than once on the same date (confirmed, pending, scheduled, or completed)
    SELECT COUNT(*) INTO v_same_doctor_count
    FROM public.doctor_appointments
    WHERE (
        patient_id = NEW.patient_id 
        OR (v_user_id IS NOT NULL AND patient_id = v_user_id)
        OR (v_patient_profile_id IS NOT NULL AND patient_id = v_patient_profile_id)
    )
      AND doctor_id = NEW.doctor_id
      AND appointment_date = NEW.appointment_date
      AND status IN ('confirmed', 'pending', 'scheduled', 'completed')
      AND (TG_OP = 'INSERT' OR id != NEW.id);

    IF v_same_doctor_count > 0 THEN
        RAISE EXCEPTION 'You already have an appointment booked with % on %. OpenHealth requires booking different doctors on the same day.', 
            v_doctor_name, NEW.appointment_date;
    END IF;

    -- 3. Invariant 2: Maximum 2 Active Appointment Slots per Calendar Day
    -- Active slots are appointments in 'confirmed', 'pending', or 'scheduled' status
    SELECT COUNT(*) INTO v_active_slots_count
    FROM public.doctor_appointments
    WHERE (
        patient_id = NEW.patient_id 
        OR (v_user_id IS NOT NULL AND patient_id = v_user_id)
        OR (v_patient_profile_id IS NOT NULL AND patient_id = v_patient_profile_id)
    )
      AND appointment_date = NEW.appointment_date
      AND status IN ('confirmed', 'pending', 'scheduled')
      AND (TG_OP = 'INSERT' OR id != NEW.id);

    IF v_active_slots_count >= 2 THEN
        RAISE EXCEPTION 'Daily appointment limit reached (2/2 active slots booked for %). Please complete or cancel an existing appointment to free up a slot.', 
            NEW.appointment_date;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_patient_appointment_limits ON public.doctor_appointments;
CREATE TRIGGER trg_check_patient_appointment_limits
BEFORE INSERT OR UPDATE OF doctor_id, appointment_date, status ON public.doctor_appointments
FOR EACH ROW
EXECUTE FUNCTION public.check_patient_appointment_limits();

-- 4. Helper RPC: Query daily slot status for patient pre-flight UI validation
CREATE OR REPLACE FUNCTION public.get_patient_daily_appointment_status(
    p_date DATE,
    p_doctor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_patient_profile_id UUID;
    v_active_count INT := 0;
    v_same_doctor_booked BOOLEAN := false;
    v_max_slots INT := 2;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'active_slots_count', 0,
            'max_slots', v_max_slots,
            'remaining_slots', v_max_slots,
            'can_book', true,
            'is_same_doctor_booked', false
        );
    END IF;

    SELECT id INTO v_patient_profile_id 
    FROM public.patient_profiles 
    WHERE user_id = v_user_id 
    LIMIT 1;

    -- Count active appointment slots on this date
    SELECT COUNT(*) INTO v_active_count
    FROM public.doctor_appointments
    WHERE (
        patient_id = v_user_id 
        OR (v_patient_profile_id IS NOT NULL AND patient_id = v_patient_profile_id)
    )
      AND appointment_date = p_date
      AND status IN ('confirmed', 'pending', 'scheduled');

    -- Check if specified doctor already booked on this date
    IF p_doctor_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 
            FROM public.doctor_appointments
            WHERE (
                patient_id = v_user_id 
                OR (v_patient_profile_id IS NOT NULL AND patient_id = v_patient_profile_id)
            )
              AND doctor_id = p_doctor_id
              AND appointment_date = p_date
              AND status IN ('confirmed', 'pending', 'scheduled', 'completed')
        ) INTO v_same_doctor_booked;
    END IF;

    RETURN jsonb_build_object(
        'active_slots_count', v_active_count,
        'max_slots', v_max_slots,
        'remaining_slots', GREATEST(0, v_max_slots - v_active_count),
        'can_book', (v_active_count < v_max_slots) AND NOT v_same_doctor_booked,
        'is_same_doctor_booked', v_same_doctor_booked
    );
END;
$$;
