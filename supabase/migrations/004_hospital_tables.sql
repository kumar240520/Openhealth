-- ============================================================================
-- 004_hospital_tables.sql
-- OpenHealth Database Architecture - Hospital Domain & Bed Inventory Tables
-- ============================================================================

-- Table 5: hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    phone TEXT,
    website TEXT,
    emergency_available BOOLEAN DEFAULT false,
    verification_status public.hospital_verification_status DEFAULT 'pending',
    verification_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 3: hospital_memberships
CREATE TABLE IF NOT EXISTS public.hospital_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    role public.membership_role NOT NULL DEFAULT 'hospital_staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hospital_memberships UNIQUE (user_id, hospital_id)
);

-- Table 6: departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    emergency_available BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 7: doctors
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    qualification TEXT,
    registration_number TEXT,
    experience_years INTEGER CHECK (experience_years >= 0),
    consultation_fee NUMERIC CHECK (consultation_fee >= 0),
    verification_status public.hospital_verification_status DEFAULT 'pending',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 8: treatments (Global Reference Catalog)
CREATE TABLE IF NOT EXISTS public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 9: hospital_treatments
CREATE TABLE IF NOT EXISTS public.hospital_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE RESTRICT,
    available BOOLEAN DEFAULT true,
    estimated_min_cost NUMERIC CHECK (estimated_min_cost >= 0),
    estimated_max_cost NUMERIC CHECK (estimated_max_cost >= estimated_min_cost),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hospital_treatment UNIQUE (hospital_id, treatment_id)
);

-- Table 10: treatment_packages
CREATE TABLE IF NOT EXISTS public.treatment_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    duration_days INTEGER CHECK (duration_days >= 0),
    room_category TEXT,
    included_services JSONB DEFAULT '[]'::jsonb,
    excluded_services JSONB DEFAULT '[]'::jsonb,
    package_lock_available BOOLEAN DEFAULT false,
    emi_available BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 11: bed_types (Global Reference Catalog)
CREATE TABLE IF NOT EXISTS public.bed_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Table 12: hospital_beds
CREATE TABLE IF NOT EXISTS public.hospital_beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    bed_type_id UUID NOT NULL REFERENCES public.bed_types(id) ON DELETE RESTRICT,
    total_beds INTEGER NOT NULL DEFAULT 0 CHECK (total_beds >= 0),
    occupied_beds INTEGER NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
    reserved_beds INTEGER NOT NULL DEFAULT 0 CHECK (reserved_beds >= 0),
    available_beds INTEGER NOT NULL DEFAULT 0 CHECK (available_beds >= 0),
    last_updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hospital_bed_type UNIQUE (hospital_id, bed_type_id),
    CONSTRAINT chk_bed_capacity CHECK (occupied_beds + reserved_beds + available_beds <= total_beds)
);
