-- ============================================================================
-- 006_medical_documents_and_ai_tables.sql
-- OpenHealth Database Architecture - Medical Documents, AI Extraction, and Billing
-- ============================================================================

-- Table 15: medical_documents
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    document_type public.document_type NOT NULL DEFAULT 'medical_report',
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    pii_masked BOOLEAN DEFAULT false,
    processing_status public.processing_status NOT NULL DEFAULT 'uploaded',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 21: patient_hospital_consents
CREATE TABLE IF NOT EXISTS public.patient_hospital_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL DEFAULT 'clinical_evaluation',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    status public.consent_status NOT NULL DEFAULT 'active'
);

-- Table 16: report_analyses
CREATE TABLE IF NOT EXISTS public.report_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.medical_documents(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    summary TEXT,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    detected_conditions JSONB DEFAULT '[]'::jsonb,
    detected_specialties JSONB DEFAULT '[]'::jsonb,
    important_terms JSONB DEFAULT '[]'::jsonb,
    ai_explanation TEXT,
    confidence NUMERIC CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    model_version TEXT DEFAULT 'report-analyzer-v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 17: bills
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    bill_number TEXT,
    bill_date DATE,
    estimated_amount NUMERIC CHECK (estimated_amount IS NULL OR estimated_amount >= 0),
    final_amount NUMERIC CHECK (final_amount IS NULL OR final_amount >= 0),
    insurance_amount NUMERIC DEFAULT 0 CHECK (insurance_amount >= 0),
    patient_payable NUMERIC CHECK (patient_payable IS NULL OR patient_payable >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 18: bill_line_items
CREATE TABLE IF NOT EXISTS public.bill_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    extraction_confidence NUMERIC CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1)),
    anomaly_flag BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 19: bill_analyses
CREATE TABLE IF NOT EXISTS public.bill_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    total_detected NUMERIC CHECK (total_detected IS NULL OR total_detected >= 0),
    categorized_total NUMERIC CHECK (categorized_total IS NULL OR categorized_total >= 0),
    suspicious_amount NUMERIC DEFAULT 0 CHECK (suspicious_amount >= 0),
    anomaly_count INTEGER DEFAULT 0 CHECK (anomaly_count >= 0),
    analysis_summary TEXT,
    model_version TEXT DEFAULT 'bill-analyzer-v1',
    confidence NUMERIC CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 20: bill_shock_records
CREATE TABLE IF NOT EXISTS public.bill_shock_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    estimated_amount NUMERIC NOT NULL CHECK (estimated_amount >= 0),
    final_amount NUMERIC NOT NULL CHECK (final_amount >= 0),
    variance_amount NUMERIC NOT NULL,
    variance_percent NUMERIC NOT NULL,
    shock_level public.shock_level NOT NULL DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
