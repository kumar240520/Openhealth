-- ============================================================================
-- 019_reports_and_timeline_schema.sql
-- OpenHealth Database Architecture - Reports, Health Timeline & Test Bookings
-- ============================================================================

-- 1. Extend medical_documents with report titles and category tags
ALTER TABLE public.medical_documents
    ADD COLUMN IF NOT EXISTS report_title TEXT,
    ADD COLUMN IF NOT EXISTS category_tag TEXT DEFAULT 'Pathology',
    ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'uploaded';

-- 2. Create patient_test_reports table for booking-originated lab & radiology tests
CREATE TABLE IF NOT EXISTS public.patient_test_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pathology',
    booked_on DATE NOT NULL DEFAULT CURRENT_DATE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'completed',
    report_url TEXT,
    file_size BIGINT DEFAULT 1800000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create patient_health_timeline table for chronological health event tracking
CREATE TABLE IF NOT EXISTS public.patient_health_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    doctor_name TEXT,
    event_title TEXT NOT NULL,
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    event_type TEXT NOT NULL DEFAULT 'diagnostic',
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.patient_test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_health_timeline ENABLE ROW LEVEL SECURITY;

-- 5. Revoke from anon, grant to authenticated
REVOKE ALL ON TABLE public.patient_test_reports FROM anon;
REVOKE ALL ON TABLE public.patient_health_timeline FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patient_test_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patient_health_timeline TO authenticated;

-- 6. RLS Policies for patient_test_reports
DROP POLICY IF EXISTS "patient_test_reports_select" ON public.patient_test_reports;
CREATE POLICY "patient_test_reports_select" ON public.patient_test_reports
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "patient_test_reports_insert" ON public.patient_test_reports;
CREATE POLICY "patient_test_reports_insert" ON public.patient_test_reports
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

-- 7. RLS Policies for patient_health_timeline
DROP POLICY IF EXISTS "patient_health_timeline_select" ON public.patient_health_timeline;
CREATE POLICY "patient_health_timeline_select" ON public.patient_health_timeline
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "patient_health_timeline_insert" ON public.patient_health_timeline;
CREATE POLICY "patient_health_timeline_insert" ON public.patient_health_timeline
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );
