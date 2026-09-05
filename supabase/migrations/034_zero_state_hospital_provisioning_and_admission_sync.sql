-- ============================================================================
-- Migration 034: Zero-State Hospital Provisioning & Automated Admission Sync
-- 1. Updates provision_hospital_account to guarantee strictly 0 occupied & 0 reserved beds
-- 2. Adds save_hospital_onboarding (SECURITY DEFINER) to support dynamic custom bed types
-- 3. Adds trigger on hospital_admissions to auto-complete reservations upon patient discharge
-- 4. Cleans up Amrita Hospital records so occupied beds and active bookings reset to 0
-- ============================================================================

-- 1. Update provision_hospital_account with STRICT 0 OCCUPANCY
CREATE OR REPLACE FUNCTION public.provision_hospital_account(
    p_hospital_name TEXT,
    p_city TEXT DEFAULT 'Indore',
    p_state TEXT DEFAULT 'Madhya Pradesh',
    p_phone TEXT DEFAULT NULL,
    p_type TEXT DEFAULT 'Multi-Speciality Hospital'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_clean_name TEXT;
    v_hospital_id UUID;
    v_hospital public.hospitals%ROWTYPE;
    v_bed_type_general UUID;
    v_bed_type_icu UUID;
    v_bed_type_hdu UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to provision hospital facility.';
    END IF;

    v_clean_name := TRIM(COALESCE(p_hospital_name, ''));
    IF LENGTH(v_clean_name) < 2 THEN
        RAISE EXCEPTION 'A valid hospital name is required (min 2 characters).';
    END IF;

    -- Check if user already has an active hospital membership
    SELECT hospital_id INTO v_hospital_id
    FROM public.hospital_memberships
    WHERE user_id = v_user_id AND is_active = true
    LIMIT 1;

    IF v_hospital_id IS NOT NULL THEN
        SELECT * INTO v_hospital FROM public.hospitals WHERE id = v_hospital_id;
        RETURN to_jsonb(v_hospital);
    END IF;

    -- Check if hospital with this exact name already exists or create new
    SELECT id INTO v_hospital_id
    FROM public.hospitals
    WHERE LOWER(TRIM(name)) = LOWER(v_clean_name)
    LIMIT 1;

    IF v_hospital_id IS NULL THEN
        INSERT INTO public.hospitals (
            id,
            name,
            type,
            city,
            state,
            country,
            phone,
            emergency_available,
            verification_status,
            is_active,
            transparency_score,
            onboarding_completed,
            kyc_status,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_clean_name,
            COALESCE(p_type, 'Multi-Speciality Hospital'),
            COALESCE(p_city, 'Indore'),
            COALESCE(p_state, 'Madhya Pradesh'),
            'India',
            p_phone,
            true,
            'pending',
            true,
            85.00,
            false,
            'pending',
            now(),
            now()
        )
        RETURNING * INTO v_hospital;

        v_hospital_id := v_hospital.id;

        -- Seed initial clean bed categories for this hospital (STRICTLY 0 OCCUPIED, 0 RESERVED)
        SELECT id INTO v_bed_type_general FROM public.bed_types WHERE name ILIKE '%general%' LIMIT 1;
        SELECT id INTO v_bed_type_icu FROM public.bed_types WHERE name ILIKE '%icu%' AND name NOT ILIKE '%nicu%' AND name NOT ILIKE '%picu%' LIMIT 1;
        SELECT id INTO v_bed_type_hdu FROM public.bed_types WHERE name ILIKE '%hdu%' LIMIT 1;

        IF v_bed_type_general IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_general, 20, 0, 0, 20, 1500)
            ON CONFLICT (hospital_id, bed_type_id) DO UPDATE
            SET occupied_beds = 0, reserved_beds = 0, available_beds = EXCLUDED.total_beds;
        END IF;

        IF v_bed_type_icu IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_icu, 6, 0, 0, 6, 9500)
            ON CONFLICT (hospital_id, bed_type_id) DO UPDATE
            SET occupied_beds = 0, reserved_beds = 0, available_beds = EXCLUDED.total_beds;
        END IF;

        IF v_bed_type_hdu IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_hdu, 4, 0, 0, 4, 4500)
            ON CONFLICT (hospital_id, bed_type_id) DO UPDATE
            SET occupied_beds = 0, reserved_beds = 0, available_beds = EXCLUDED.total_beds;
        END IF;

        -- Seed initial departments
        INSERT INTO public.departments (hospital_id, name, description, emergency_available, is_active)
        VALUES 
            (v_hospital_id, 'General Medicine', 'Primary outpatient and inpatient general internal care', false, true),
            (v_hospital_id, 'Emergency & Trauma', '24/7 acute trauma and resuscitation triage unit', true, true)
        ON CONFLICT DO NOTHING;

        -- Seed initial transparency score
        INSERT INTO public.transparency_scores (
            hospital_id,
            price_clarity_score,
            package_clarity_score,
            information_score,
            data_freshness_score,
            billing_consistency_score,
            verification_score,
            overall_score,
            scoring_version,
            calculated_at
        ) VALUES (
            v_hospital_id,
            95,
            90,
            92,
            100,
            94,
            80,
            91.80,
            'v2.1',
            now()
        )
        ON CONFLICT (hospital_id) DO NOTHING;
    ELSE
        SELECT * INTO v_hospital FROM public.hospitals WHERE id = v_hospital_id;
    END IF;

    -- Ensure admin membership exists
    INSERT INTO public.hospital_memberships (
        user_id,
        hospital_id,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_hospital_id,
        'hospital_admin',
        true,
        now(),
        now()
    )
    ON CONFLICT (user_id, hospital_id) DO UPDATE
    SET is_active = true, role = 'hospital_admin', updated_at = now();

    RETURN to_jsonb(v_hospital);
END;
$$;

-- 2. Comprehensive save_hospital_onboarding (SECURITY DEFINER)
-- Saves facility profile, creates/configures custom bed types with 0 occupancy, sets departments & KYC
CREATE OR REPLACE FUNCTION public.save_hospital_onboarding(
    p_hospital_id UUID,
    p_profile JSONB,
    p_beds JSONB DEFAULT '[]'::jsonb,
    p_departments JSONB DEFAULT '[]'::jsonb,
    p_kyc JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_hospital public.hospitals%ROWTYPE;
    v_bed RECORD;
    v_dept RECORD;
    v_bed_type_id UUID;
    v_bed_name TEXT;
    v_total_beds INT;
    v_price NUMERIC;
    v_is_kyc_skipped BOOLEAN;
    v_kyc_status TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to save hospital onboarding.';
    END IF;

    -- Verify the caller is associated with this hospital or is platform admin
    IF NOT EXISTS (
        SELECT 1 FROM public.hospital_memberships
        WHERE user_id = v_user_id AND hospital_id = p_hospital_id AND is_active = true
    ) AND NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'platform_admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized to configure this hospital facility.';
    END IF;

    v_is_kyc_skipped := COALESCE((p_kyc->>'is_skipped')::boolean, false);
    v_kyc_status := CASE 
        WHEN v_is_kyc_skipped THEN 'pending'
        WHEN (p_kyc->>'license_number') IS NOT NULL AND LENGTH(TRIM(p_kyc->>'license_number')) > 0 THEN 'submitted'
        ELSE 'pending'
    END;

    -- Update hospital record
    UPDATE public.hospitals
    SET
        name = COALESCE(NULLIF(TRIM(p_profile->>'name'), ''), name),
        type = COALESCE(NULLIF(TRIM(p_profile->>'type'), ''), type),
        phone = COALESCE(NULLIF(TRIM(p_profile->>'phone'), ''), phone),
        email = COALESCE(NULLIF(TRIM(p_profile->>'email'), ''), email),
        website = NULLIF(TRIM(p_profile->>'website'), ''),
        address = COALESCE(NULLIF(TRIM(p_profile->>'address'), ''), address),
        city = COALESCE(NULLIF(TRIM(p_profile->>'city'), ''), city),
        state = COALESCE(NULLIF(TRIM(p_profile->>'state'), ''), state),
        postal_code = NULLIF(TRIM(p_profile->>'postal_code'), ''),
        description = NULLIF(TRIM(p_profile->>'description'), ''),
        emergency_available = COALESCE((p_profile->>'emergency_available')::boolean, true),
        onboarding_completed = true,
        kyc_status = v_kyc_status,
        license_number = NULLIF(TRIM(p_kyc->>'license_number'), ''),
        tax_id = NULLIF(TRIM(p_kyc->>'tax_id'), ''),
        signatory_name = NULLIF(TRIM(p_kyc->>'signatory_name'), ''),
        kyc_document_url = NULLIF(TRIM(p_kyc->>'kyc_document_url'), ''),
        updated_at = now()
    WHERE id = p_hospital_id
    RETURNING * INTO v_hospital;

    -- Mark user profile onboarding_completed
    UPDATE public.profiles
    SET onboarding_completed = true, updated_at = now()
    WHERE id = v_user_id;

    -- Process beds array (strictly 0 occupied, 0 reserved, total = available)
    IF jsonb_array_length(p_beds) > 0 THEN
        FOR v_bed IN SELECT * FROM jsonb_to_recordset(p_beds) AS x(
            name TEXT,
            bed_type_id TEXT,
            total_beds INT,
            price_per_day NUMERIC
        )
        LOOP
            v_bed_name := TRIM(COALESCE(v_bed.name, 'General Ward'));
            v_total_beds := GREATEST(0, COALESCE(v_bed.total_beds, 10));
            v_price := GREATEST(0, COALESCE(v_bed.price_per_day, 1500));

            -- Check if specific bed_type_id was passed or find/create by name
            IF v_bed.bed_type_id IS NOT NULL AND LENGTH(v_bed.bed_type_id) > 10 THEN
                v_bed_type_id := v_bed.bed_type_id::uuid;
            ELSE
                SELECT id INTO v_bed_type_id
                FROM public.bed_types
                WHERE LOWER(TRIM(name)) = LOWER(v_bed_name)
                LIMIT 1;

                -- If not found, dynamically insert new bed category!
                IF v_bed_type_id IS NULL THEN
                    INSERT INTO public.bed_types (id, name, description, is_active)
                    VALUES (
                        gen_random_uuid(),
                        v_bed_name,
                        v_bed_name || ' facility bed unit',
                        true
                    )
                    RETURNING id INTO v_bed_type_id;
                END IF;
            END IF;

            -- Upsert hospital bed with STRICTLY 0 OCCUPIED and 0 RESERVED
            INSERT INTO public.hospital_beds (
                hospital_id,
                bed_type_id,
                total_beds,
                occupied_beds,
                reserved_beds,
                available_beds,
                price_per_day,
                last_updated_at,
                updated_at
            ) VALUES (
                p_hospital_id,
                v_bed_type_id,
                v_total_beds,
                0, -- Strictly 0 occupied
                0, -- Strictly 0 reserved
                v_total_beds, -- Available = Total
                v_price,
                now(),
                now()
            )
            ON CONFLICT (hospital_id, bed_type_id) DO UPDATE
            SET
                total_beds = EXCLUDED.total_beds,
                occupied_beds = 0,
                reserved_beds = 0,
                available_beds = EXCLUDED.total_beds,
                price_per_day = EXCLUDED.price_per_day,
                last_updated_at = now(),
                updated_at = now();
        END LOOP;
    END IF;

    -- Process departments array if provided
    IF jsonb_array_length(p_departments) > 0 THEN
        FOR v_dept IN SELECT * FROM jsonb_to_recordset(p_departments) AS y(name TEXT, description TEXT)
        LOOP
            IF v_dept.name IS NOT NULL AND LENGTH(TRIM(v_dept.name)) > 1 THEN
                INSERT INTO public.departments (hospital_id, name, description, emergency_available, is_active)
                VALUES (
                    p_hospital_id,
                    TRIM(v_dept.name),
                    COALESCE(v_dept.description, TRIM(v_dept.name) || ' clinical department'),
                    (TRIM(v_dept.name) ILIKE '%emergency%' OR TRIM(v_dept.name) ILIKE '%trauma%'),
                    true
                )
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END IF;

    RETURN to_jsonb(v_hospital);
END;
$$;

-- 3. Database Trigger: Auto-complete bed_reservations upon patient discharge
CREATE OR REPLACE FUNCTION public.trg_auto_complete_reservation_on_discharge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When hospital admission is marked discharged, complete any linked reservation
    IF NEW.status = 'discharged' AND (OLD.status IS NULL OR OLD.status != 'discharged') THEN
        IF NEW.reservation_id IS NOT NULL THEN
            UPDATE public.bed_reservations
            SET status = 'completed', updated_at = now()
            WHERE id = NEW.reservation_id AND status != 'completed';
        END IF;

        -- Also complete any active/held reservations for this patient at this hospital
        IF NEW.patient_id IS NOT NULL THEN
            UPDATE public.bed_reservations
            SET status = 'completed', updated_at = now()
            WHERE patient_id = NEW.patient_id
              AND hospital_id = NEW.hospital_id
              AND status IN ('confirmed', 'held', 'pending');
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_discharge_complete_reservation ON public.hospital_admissions;
CREATE TRIGGER trg_discharge_complete_reservation
AFTER UPDATE OF status ON public.hospital_admissions
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_complete_reservation_on_discharge();

-- 4. Cleanup Data for Amrita Hospital ('fb43f7d1-bab4-4b31-998f-379aa3a477e2')
-- Mark lingering reservations as completed
UPDATE public.bed_reservations
SET status = 'completed', updated_at = now()
WHERE hospital_id = 'fb43f7d1-bab4-4b31-998f-379aa3a477e2'
  AND status IN ('confirmed', 'held');

-- Reset all beds to strictly 0 occupied and 0 reserved
UPDATE public.hospital_beds
SET occupied_beds = 0,
    reserved_beds = 0,
    available_beds = total_beds,
    last_updated_at = now(),
    updated_at = now()
WHERE hospital_id = 'fb43f7d1-bab4-4b31-998f-379aa3a477e2';

-- Set Amrita Hospital onboarding_completed = false so the user can test the onboarding wizard immediately
UPDATE public.hospitals
SET onboarding_completed = false,
    kyc_status = 'pending',
    updated_at = now()
WHERE id = 'fb43f7d1-bab4-4b31-998f-379aa3a477e2';

UPDATE public.profiles
SET onboarding_completed = false,
    updated_at = now()
WHERE email = 'hiteshkumarparida24@gmail.com';
