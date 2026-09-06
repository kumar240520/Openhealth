-- ============================================================================
-- 010_security_helper_functions.sql
-- OpenHealth Database Architecture - Private Security Definer Helper Functions
-- ============================================================================

-- Function 1: is_platform_admin
CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'platform_admin'
          AND p.is_active = true
    );
$$;

-- Function 2: is_patient
CREATE OR REPLACE FUNCTION private.is_patient(p_patient_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.patient_profiles pp
        WHERE pp.id = p_patient_id
          AND pp.user_id = (SELECT auth.uid())
    );
$$;

-- Function 3: is_hospital_member
CREATE OR REPLACE FUNCTION private.is_hospital_member(p_hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.hospital_memberships hm
        WHERE hm.user_id = (SELECT auth.uid())
          AND hm.hospital_id = p_hospital_id
          AND hm.is_active = true
    );
$$;

-- Function 4: is_hospital_admin
CREATE OR REPLACE FUNCTION private.is_hospital_admin(p_hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.hospital_memberships hm
        WHERE hm.user_id = (SELECT auth.uid())
          AND hm.hospital_id = p_hospital_id
          AND hm.role = 'hospital_admin'
          AND hm.is_active = true
    );
$$;

-- Function 5: is_hospital_staff
CREATE OR REPLACE FUNCTION private.is_hospital_staff(p_hospital_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.hospital_memberships hm
        WHERE hm.user_id = (SELECT auth.uid())
          AND hm.hospital_id = p_hospital_id
          AND hm.role = 'hospital_staff'
          AND hm.is_active = true
    );
$$;

-- Function 6: is_insurance_member
CREATE OR REPLACE FUNCTION private.is_insurance_member(p_provider_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.insurance_memberships im
        WHERE im.user_id = (SELECT auth.uid())
          AND im.provider_id = p_provider_id
          AND im.is_active = true
    );
$$;

-- Function 7: has_patient_hospital_consent
CREATE OR REPLACE FUNCTION private.has_patient_hospital_consent(
    p_patient_id UUID,
    p_hospital_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.patient_hospital_consents c
        WHERE c.patient_id = p_patient_id
          AND c.hospital_id = p_hospital_id
          AND c.status = 'active'
          AND (c.expires_at IS NULL OR c.expires_at > now())
    );
$$;

-- Revoke direct execution permissions from untrusted callers
REVOKE ALL ON FUNCTION private.is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_patient(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_hospital_member(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_hospital_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_hospital_staff(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_insurance_member(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.has_patient_hospital_consent(UUID, UUID) FROM PUBLIC, anon, authenticated;
