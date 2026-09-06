-- ============================================================================
-- 031_hospital_onboarding_and_kyc.sql
-- Add onboarding and KYC columns to public.hospitals
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE public.hospitals ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'kyc_status') THEN
        ALTER TABLE public.hospitals ADD COLUMN kyc_status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'license_number') THEN
        ALTER TABLE public.hospitals ADD COLUMN license_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'tax_id') THEN
        ALTER TABLE public.hospitals ADD COLUMN tax_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'signatory_name') THEN
        ALTER TABLE public.hospitals ADD COLUMN signatory_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'kyc_document_url') THEN
        ALTER TABLE public.hospitals ADD COLUMN kyc_document_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'email') THEN
        ALTER TABLE public.hospitals ADD COLUMN email TEXT;
    END IF;
END $$;
