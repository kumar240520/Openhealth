-- ============================================================================
-- 011_triggers_and_automation.sql
-- OpenHealth Database Architecture - Triggers, Role Protection, & Auto-Calculations
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Role change defense-in-depth trigger function
CREATE OR REPLACE FUNCTION private.prevent_client_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF NOT (SELECT private.is_platform_admin()) THEN
            RAISE EXCEPTION 'Role changes are restricted to platform administrators';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_client_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_client_role_change
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION private.prevent_client_role_change();

-- Bed availability auto-calculation trigger
CREATE OR REPLACE FUNCTION public.recalculate_hospital_bed_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.available_beds = NEW.total_beds - NEW.occupied_beds - NEW.reserved_beds;
    IF NEW.available_beds < 0 THEN
        RAISE EXCEPTION 'Occupied plus reserved beds (%) exceed total bed capacity (%)',
            (NEW.occupied_beds + NEW.reserved_beds), NEW.total_beds;
    END IF;
    NEW.last_updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_hospital_bed_availability ON public.hospital_beds;
CREATE TRIGGER trg_recalculate_hospital_bed_availability
    BEFORE INSERT OR UPDATE OF total_beds, occupied_beds, reserved_beds ON public.hospital_beds
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_hospital_bed_availability();

-- User signup automated provisioning trigger (Only on confirmed/verified user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_role public.app_role;
    v_full_name TEXT;
BEGIN
    -- Only provision application profile when the user's email is confirmed / OTP is verified!
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

    -- 1. Insert application profile
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        v_role,
        NEW.raw_user_meta_data->>'avatar_url',
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;

    -- 2. If patient, create fresh empty patient_profiles record
    IF v_role = 'patient' THEN
        INSERT INTO public.patient_profiles (user_id, created_at, updated_at)
        VALUES (NEW.id, now(), now())
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_or_confirmed ON auth.users;

CREATE TRIGGER on_auth_user_created_or_confirmed
    AFTER INSERT OR UPDATE OF email_confirmed_at, confirmed_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Attach updated_at triggers to all mutable tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'profiles',
            'patient_profiles',
            'hospitals',
            'hospital_memberships',
            'insurance_memberships',
            'departments',
            'doctors',
            'hospital_treatments',
            'treatment_packages',
            'hospital_beds',
            'bed_reservations',
            'bookings',
            'bills',
            'insurance_policies',
            'government_schemes',
            'ambulance_providers',
            'ambulances',
            'emergency_sessions',
            'ambulance_requests'
        ])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;', t);
        EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
    END LOOP;
END $$;
