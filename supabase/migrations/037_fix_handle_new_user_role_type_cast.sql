-- Migration 037: Fix role type cast in handle_new_user trigger function
-- Problem: auth.users trigger failed on confirmation with:
--   ERROR: column "role" is of type membership_role but expression is of type app_role (SQLSTATE 42804)
-- Solution: Cast v_role::text::public.membership_role when inserting into hospital_memberships.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_role public.app_role;
    v_full_name TEXT;
    v_phone TEXT;
    v_hospital_name TEXT;
    v_hospital_id UUID;
    v_bed_type_general UUID;
    v_bed_type_icu UUID;
    v_bed_type_hdu UUID;
BEGIN
    IF NEW.email_confirmed_at IS NULL AND NEW.confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    v_role := COALESCE(
        (NEW.raw_user_meta_data->>'role')::public.app_role,
        'patient'::public.app_role
    );
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_phone := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone'
    );
    v_hospital_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'hospital_name'), '');

    -- 1. Insert application profile
    INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        v_phone,
        v_role,
        NEW.raw_user_meta_data->>'avatar_url',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        role = EXCLUDED.role;

    -- 2. If patient, create fresh patient_profiles record
    IF v_role = 'patient' THEN
        INSERT INTO public.patient_profiles (id, user_id, created_at, updated_at)
        VALUES (NEW.id, NEW.id, now(), now())
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 3. If hospital_admin or hospital_staff, provision isolated hospital facility
    IF v_role IN ('hospital_admin', 'hospital_staff') AND v_hospital_name IS NOT NULL THEN
        SELECT id INTO v_hospital_id
        FROM public.hospitals
        WHERE LOWER(TRIM(name)) = LOWER(v_hospital_name)
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
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_hospital_name,
                'Multi-Speciality Hospital',
                COALESCE(NEW.raw_user_meta_data->>'city', 'Indore'),
                'Madhya Pradesh',
                'India',
                v_phone,
                true,
                'verified',
                true,
                78.00,
                false,
                now(),
                now()
            )
            RETURNING id INTO v_hospital_id;

            -- Seed basic bed categories
            SELECT id INTO v_bed_type_general FROM public.bed_types WHERE name ILIKE '%general%' LIMIT 1;
            SELECT id INTO v_bed_type_icu FROM public.bed_types WHERE name ILIKE '%icu%' LIMIT 1;
            SELECT id INTO v_bed_type_hdu FROM public.bed_types WHERE name ILIKE '%hdu%' LIMIT 1;

            IF v_bed_type_general IS NOT NULL THEN
                INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
                VALUES (v_hospital_id, v_bed_type_general, 20, 5, 2, 13, 1500)
                ON CONFLICT DO NOTHING;
            END IF;

            IF v_bed_type_icu IS NOT NULL THEN
                INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
                VALUES (v_hospital_id, v_bed_type_icu, 6, 2, 1, 3, 9500)
                ON CONFLICT DO NOTHING;
            END IF;

            IF v_bed_type_hdu IS NOT NULL THEN
                INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
                VALUES (v_hospital_id, v_bed_type_hdu, 8, 3, 0, 5, 4500)
                ON CONFLICT DO NOTHING;
            END IF;

            -- Seed basic departments
            INSERT INTO public.departments (hospital_id, name, description, emergency_available, is_active)
            VALUES 
                (v_hospital_id, 'General Medicine', 'Primary outpatient and inpatient general internal care', false, true),
                (v_hospital_id, 'Emergency & Trauma', '24/7 acute trauma and resuscitation triage unit', true, true)
            ON CONFLICT DO NOTHING;

            -- Seed transparency score
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
                80.00,
                75.00,
                82.00,
                90.00,
                78.00,
                85.00,
                78.00,
                'v2.1',
                now()
            )
            ON CONFLICT DO NOTHING;
        END IF;

        -- Bind membership with explicit enum cast to public.membership_role
        INSERT INTO public.hospital_memberships (
            user_id,
            hospital_id,
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_hospital_id,
            v_role::text::public.membership_role,
            true,
            now(),
            now()
        )
        ON CONFLICT (user_id, hospital_id) DO UPDATE
        SET is_active = true, role = EXCLUDED.role, updated_at = now();
    END IF;

    RETURN NEW;
END;
$function$;
