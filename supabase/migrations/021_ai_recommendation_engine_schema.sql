-- ============================================================================
-- 021_ai_recommendation_engine_schema.sql
-- OpenHealth Database Architecture - AI Analyzer & Multi-Modal Recommendation Engine
-- ============================================================================

-- 1. Create table for storing patient AI recommendation sessions
CREATE TABLE IF NOT EXISTS public.ai_recommendation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    session_title TEXT NOT NULL DEFAULT 'Health & Triage Assessment',
    input_symptoms TEXT NOT NULL,
    voice_transcript TEXT,
    selected_report_ids JSONB DEFAULT '[]'::jsonb,
    selected_bill_ids JSONB DEFAULT '[]'::jsonb,
    triage_level TEXT NOT NULL DEFAULT 'routine', -- 'emergency', 'urgent', 'routine', 'monitoring'
    triage_urgency_score INTEGER DEFAULT 45 CHECK (triage_urgency_score >= 0 AND triage_urgency_score <= 100),
    suspected_conditions JSONB DEFAULT '[]'::jsonb,
    recommended_specialties JSONB DEFAULT '[]'::jsonb,
    recommended_doctor_ids JSONB DEFAULT '[]'::jsonb,
    recommended_package_ids JSONB DEFAULT '[]'::jsonb,
    biomarker_findings JSONB DEFAULT '[]'::jsonb,
    bill_audit_insights JSONB DEFAULT '{}'::jsonb,
    clinical_summary TEXT,
    plain_explanation TEXT,
    actionable_steps JSONB DEFAULT '[]'::jsonb,
    red_flags JSONB DEFAULT '[]'::jsonb,
    model_name TEXT DEFAULT 'openhealth-medgemma-v1',
    confidence NUMERIC DEFAULT 0.94,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.ai_recommendation_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Permissions and Grants
REVOKE ALL ON TABLE public.ai_recommendation_sessions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_recommendation_sessions TO authenticated;

-- 4. RLS Policies enforcing strict patient data isolation (Rule 30)
DROP POLICY IF EXISTS "ai_sessions_select" ON public.ai_recommendation_sessions;
CREATE POLICY "ai_sessions_select" ON public.ai_recommendation_sessions
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "ai_sessions_insert" ON public.ai_recommendation_sessions;
CREATE POLICY "ai_sessions_insert" ON public.ai_recommendation_sessions
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "ai_sessions_delete" ON public.ai_recommendation_sessions;
CREATE POLICY "ai_sessions_delete" ON public.ai_recommendation_sessions
    FOR DELETE TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );
