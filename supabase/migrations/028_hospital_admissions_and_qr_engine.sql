-- ============================================================================
-- 028_hospital_admissions_and_qr_engine.sql
-- OpenHealth Database Architecture - Hospital Admissions & Patient QR Intake
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hospital_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    reservation_id UUID REFERENCES public.bed_reservations(id) ON DELETE SET NULL,
    bed_type_id UUID REFERENCES public.bed_types(id) ON DELETE SET NULL,
    bed_number TEXT NOT NULL,
    admission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    discharge_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'admitted', -- 'admitted', 'discharged', 'transferred'
    patient_name TEXT,
    abha_id TEXT,
    blood_group TEXT,
    emergency_contact TEXT,
    admitting_doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    diagnosis TEXT,
    vitals_summary JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hospital_admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read hospital_admissions" ON public.hospital_admissions FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert hospital_admissions" ON public.hospital_admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update hospital_admissions" ON public.hospital_admissions FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete hospital_admissions" ON public.hospital_admissions FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_admissions;
