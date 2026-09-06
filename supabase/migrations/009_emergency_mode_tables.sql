-- ============================================================================
-- 009_emergency_mode_tables.sql
-- OpenHealth Database Architecture - Emergency Mode & Ambulance Orchestration
-- ============================================================================

-- Table 32: ambulance_providers
CREATE TABLE IF NOT EXISTS public.ambulance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    service_area JSONB,
    verification_status public.hospital_verification_status NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 33: ambulances
CREATE TABLE IF NOT EXISTS public.ambulances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.ambulance_providers(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    ambulance_type TEXT NOT NULL DEFAULT 'Basic Life Support (BLS)',
    status public.ambulance_status NOT NULL DEFAULT 'available',
    latitude NUMERIC,
    longitude NUMERIC,
    last_location_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 35: emergency_sessions
CREATE TABLE IF NOT EXISTS public.emergency_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    emergency_type TEXT NOT NULL,
    status public.emergency_session_status NOT NULL DEFAULT 'searching',
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    location_accuracy_m NUMERIC CHECK (location_accuracy_m IS NULL OR location_accuracy_m >= 0),
    location_captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    search_radius_m INTEGER NOT NULL DEFAULT 10000 CHECK (search_radius_m > 0),
    selected_hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 36: emergency_hospital_matches
CREATE TABLE IF NOT EXISTS public.emergency_hospital_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_session_id UUID NOT NULL REFERENCES public.emergency_sessions(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    distance_m NUMERIC NOT NULL CHECK (distance_m >= 0),
    eta_minutes INTEGER CHECK (eta_minutes IS NULL OR eta_minutes >= 0),
    emergency_capable BOOLEAN NOT NULL DEFAULT true,
    icu_available_beds INTEGER CHECK (icu_available_beds IS NULL OR icu_available_beds >= 0),
    emergency_available_beds INTEGER CHECK (emergency_available_beds IS NULL OR emergency_available_beds >= 0),
    availability_last_updated_at TIMESTAMPTZ,
    rank_score NUMERIC,
    match_status public.emergency_match_status NOT NULL DEFAULT 'candidate',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_emergency_session_hospital UNIQUE (emergency_session_id, hospital_id)
);

-- Table 34: ambulance_requests
CREATE TABLE IF NOT EXISTS public.ambulance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_session_id UUID NOT NULL REFERENCES public.emergency_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    pickup_latitude NUMERIC NOT NULL,
    pickup_longitude NUMERIC NOT NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.ambulance_providers(id) ON DELETE SET NULL,
    ambulance_id UUID REFERENCES public.ambulances(id) ON DELETE SET NULL,
    status public.ambulance_request_status NOT NULL DEFAULT 'searching',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    eta_minutes INTEGER CHECK (eta_minutes IS NULL OR eta_minutes >= 0),
    arrived_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
