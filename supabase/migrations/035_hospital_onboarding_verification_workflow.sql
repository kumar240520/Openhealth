-- ============================================================================
-- Migration 035: Hospital Onboarding & Real Platform Admin Verification Workflow
-- ============================================================================

-- 1. Update provision_hospital_account to create hospitals in 'pending' status
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
    v_bed_type_oxygen UUID;
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
            'pending', -- Requires Platform Admin approval!
            true,
            78.00,
            false,
            now(),
            now()
        )
        RETURNING * INTO v_hospital;

        v_hospital_id := v_hospital.id;

        -- Seed initial bed categories for this hospital
        SELECT id INTO v_bed_type_general FROM public.bed_types WHERE name ILIKE '%general%' LIMIT 1;
        SELECT id INTO v_bed_type_icu FROM public.bed_types WHERE name ILIKE '%icu%' LIMIT 1;
        SELECT id INTO v_bed_type_hdu FROM public.bed_types WHERE name ILIKE '%hdu%' LIMIT 1;
        SELECT id INTO v_bed_type_oxygen FROM public.bed_types WHERE name ILIKE '%isolation%' LIMIT 1;

        IF v_bed_type_general IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_general, 30, 0, 0, 30, 1500)
            ON CONFLICT (hospital_id, bed_type_id) DO NOTHING;
        END IF;

        IF v_bed_type_icu IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_icu, 10, 0, 0, 10, 8500)
            ON CONFLICT (hospital_id, bed_type_id) DO NOTHING;
        END IF;

        IF v_bed_type_hdu IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_hdu, 10, 0, 0, 10, 4500)
            ON CONFLICT (hospital_id, bed_type_id) DO NOTHING;
        END IF;

        IF v_bed_type_oxygen IS NOT NULL THEN
            INSERT INTO public.hospital_beds (hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, price_per_day)
            VALUES (v_hospital_id, v_bed_type_oxygen, 10, 0, 0, 10, 2500)
            ON CONFLICT (hospital_id, bed_type_id) DO NOTHING;
        END IF;
    ELSE
        SELECT * INTO v_hospital FROM public.hospitals WHERE id = v_hospital_id;
    END IF;

    -- Create Admin Membership
    INSERT INTO public.hospital_memberships (
        hospital_id,
        user_id,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_hospital_id,
        v_user_id,
        'hospital_admin',
        true,
        now(),
        now()
    )
    ON CONFLICT (hospital_id, user_id) DO UPDATE
    SET is_active = true, updated_at = now();

    -- Ensure profile role is hospital_admin
    UPDATE public.profiles
    SET role = 'hospital_admin', updated_at = now()
    WHERE id = v_user_id;

    RETURN to_jsonb(v_hospital);
END;
$$;


-- 2. Update save_hospital_onboarding: Sets verification_status = 'pending' and creates audit log
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

    -- Verify caller is associated with this hospital or is platform admin
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

    -- Update hospital record: onboarding_completed = true, verification_status = 'pending'
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
        verification_status = 'pending', -- Triggers platform admin approval lock!
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

            IF v_bed.bed_type_id IS NOT NULL AND LENGTH(v_bed.bed_type_id) > 10 THEN
                v_bed_type_id := v_bed.bed_type_id::uuid;
            ELSE
                SELECT id INTO v_bed_type_id
                FROM public.bed_types
                WHERE LOWER(TRIM(name)) = LOWER(v_bed_name)
                LIMIT 1;

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
                0,
                0,
                v_total_beds,
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

    -- Create an audit log record for Platform Admin visibility
    INSERT INTO public.audit_logs (
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        hospital_id,
        metadata,
        ip_address,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'HOSPITAL_ONBOARDING_SUBMITTED',
        'hospital',
        p_hospital_id,
        p_hospital_id,
        jsonb_build_object(
            'hospital_name', v_hospital.name,
            'license_number', p_kyc->>'license_number',
            'city', v_hospital.city,
            'kyc_status', v_kyc_status,
            'verification_status', 'pending'
        ),
        '127.0.0.1',
        now()
    );

    RETURN to_jsonb(v_hospital);
END;
$$;
