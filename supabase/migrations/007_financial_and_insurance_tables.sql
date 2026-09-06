-- ============================================================================
-- 007_financial_and_insurance_tables.sql
-- OpenHealth Database Architecture - Insurance, Government Schemes, and Cost Predictions
-- ============================================================================

-- Table 22: insurance_providers (Global Reference Catalog)
CREATE TABLE IF NOT EXISTS public.insurance_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    phone TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 4: insurance_memberships
CREATE TABLE IF NOT EXISTS public.insurance_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.insurance_providers(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'agent',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_insurance_memberships UNIQUE (user_id, provider_id)
);

-- Table 23: insurance_policies
CREATE TABLE IF NOT EXISTS public.insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.insurance_providers(id) ON DELETE RESTRICT,
    policy_number TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 24: government_schemes (Global Reference Catalog)
CREATE TABLE IF NOT EXISTS public.government_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    eligibility_rules JSONB DEFAULT '{}'::jsonb,
    covered_treatments JSONB DEFAULT '[]'::jsonb,
    required_documents JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 21: cost_predictions
CREATE TABLE IF NOT EXISTS public.cost_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE RESTRICT,
    package_id UUID REFERENCES public.treatment_packages(id) ON DELETE SET NULL,
    min_cost NUMERIC NOT NULL CHECK (min_cost >= 0),
    max_cost NUMERIC NOT NULL CHECK (max_cost >= min_cost),
    confidence NUMERIC CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    input_context JSONB DEFAULT '{}'::jsonb,
    model_version TEXT DEFAULT 'cost-predictor-v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 25: eligibility_checks
CREATE TABLE IF NOT EXISTS public.eligibility_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE RESTRICT,
    insurance_provider_id UUID REFERENCES public.insurance_providers(id) ON DELETE SET NULL,
    scheme_id UUID REFERENCES public.government_schemes(id) ON DELETE SET NULL,
    eligible BOOLEAN NOT NULL,
    coverage_amount NUMERIC CHECK (coverage_amount IS NULL OR coverage_amount >= 0),
    copay_amount NUMERIC CHECK (copay_amount IS NULL OR copay_amount >= 0),
    patient_contribution NUMERIC CHECK (patient_contribution IS NULL OR patient_contribution >= 0),
    explanation TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
