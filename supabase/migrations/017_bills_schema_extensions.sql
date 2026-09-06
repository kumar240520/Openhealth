-- ============================================================================
-- 017_bills_schema_extensions.sql
-- OpenHealth Database Architecture - Bills & Package Comparison Extensions
-- ============================================================================

-- 1. Extend public.bills with package reference and audit metadata
ALTER TABLE public.bills 
    ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES public.treatment_packages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS treatment_name TEXT DEFAULT 'Heart Surgery',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'analyzed',
    ADD COLUMN IF NOT EXISTS bill_match_status TEXT DEFAULT 'matched',
    ADD COLUMN IF NOT EXISTS reason_summary TEXT DEFAULT 'We found some extra charges in your bill.';

-- 2. Extend public.bill_line_items with package amount, variance, and explanations
ALTER TABLE public.bill_line_items
    ADD COLUMN IF NOT EXISTS package_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS difference_amount NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS difference_reason TEXT DEFAULT 'As per package',
    ADD COLUMN IF NOT EXISTS item_order INTEGER DEFAULT 0;

-- 3. Create public.hospital_reviews table for patient feedback
CREATE TABLE IF NOT EXISTS public.hospital_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Enable RLS on hospital_reviews
ALTER TABLE public.hospital_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Revoke from anon and set authenticated privileges
REVOKE ALL ON TABLE public.hospital_reviews FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.hospital_reviews TO authenticated;
GRANT SELECT ON TABLE public.hospital_reviews TO anon;

-- 6. RLS Policies for hospital_reviews
DROP POLICY IF EXISTS "hospital_reviews_select" ON public.hospital_reviews;
CREATE POLICY "hospital_reviews_select" ON public.hospital_reviews
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "hospital_reviews_insert" ON public.hospital_reviews;
CREATE POLICY "hospital_reviews_insert" ON public.hospital_reviews
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT private.is_patient(patient_id))
    );
