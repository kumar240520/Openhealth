-- ============================================================================
-- 005_booking_and_reservation_tables.sql
-- OpenHealth Database Architecture - Bookings & Bed Reservations
-- ============================================================================

-- Table 14: bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    treatment_id UUID REFERENCES public.treatments(id) ON DELETE RESTRICT,
    package_id UUID REFERENCES public.treatment_packages(id) ON DELETE RESTRICT,
    booking_type TEXT NOT NULL DEFAULT 'consultation',
    status public.booking_status NOT NULL DEFAULT 'pending',
    amount NUMERIC CHECK (amount IS NULL OR amount >= 0),
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 13: bed_reservations
CREATE TABLE IF NOT EXISTS public.bed_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    bed_type_id UUID NOT NULL REFERENCES public.bed_types(id) ON DELETE RESTRICT,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    status public.reservation_status NOT NULL DEFAULT 'pending',
    deposit_amount NUMERIC DEFAULT 0 CHECK (deposit_amount >= 0),
    payment_status public.payment_status NOT NULL DEFAULT 'pending',
    reserved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
