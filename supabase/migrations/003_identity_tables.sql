-- ============================================================================
-- 003_identity_tables.sql
-- OpenHealth Database Architecture - Core Identity & Patient Profile Tables
-- ============================================================================

-- Table 1: profiles
-- Application-level identity corresponding 1:1 to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role public.app_role NOT NULL DEFAULT 'patient',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: patient_profiles
-- Patient demographic and personal health profile
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    preferred_language TEXT DEFAULT 'en',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
