-- ============================================================================
-- 008_transparency_and_discovery_tables.sql
-- OpenHealth Database Architecture - Transparency Scores, Analytics, and Platform
-- ============================================================================

-- Table 26: transparency_scores
CREATE TABLE IF NOT EXISTS public.transparency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    price_clarity_score NUMERIC CHECK (price_clarity_score IS NULL OR (price_clarity_score >= 0 AND price_clarity_score <= 100)),
    package_clarity_score NUMERIC CHECK (package_clarity_score IS NULL OR (package_clarity_score >= 0 AND package_clarity_score <= 100)),
    information_score NUMERIC CHECK (information_score IS NULL OR (information_score >= 0 AND information_score <= 100)),
    data_freshness_score NUMERIC CHECK (data_freshness_score IS NULL OR (data_freshness_score >= 0 AND data_freshness_score <= 100)),
    billing_consistency_score NUMERIC CHECK (billing_consistency_score IS NULL OR (billing_consistency_score >= 0 AND billing_consistency_score <= 100)),
    verification_score NUMERIC CHECK (verification_score IS NULL OR (verification_score >= 0 AND verification_score <= 100)),
    overall_score NUMERIC NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    scoring_version TEXT DEFAULT 'transparency-v1',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 27: hospital_metrics
CREATE TABLE IF NOT EXISTS public.hospital_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    searches INTEGER DEFAULT 0 CHECK (searches >= 0),
    profile_views INTEGER DEFAULT 0 CHECK (profile_views >= 0),
    booking_count INTEGER DEFAULT 0 CHECK (booking_count >= 0),
    bed_queries INTEGER DEFAULT 0 CHECK (bed_queries >= 0),
    package_views INTEGER DEFAULT 0 CHECK (package_views >= 0),
    emergency_requests INTEGER DEFAULT 0 CHECK (emergency_requests >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 28: saved_hospitals
CREATE TABLE IF NOT EXISTS public.saved_hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_patient_saved_hospital UNIQUE (patient_id, hospital_id)
);

-- Table 29: search_history
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_type TEXT DEFAULT 'general',
    latitude NUMERIC,
    longitude NUMERIC,
    filters JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 30: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 31: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
