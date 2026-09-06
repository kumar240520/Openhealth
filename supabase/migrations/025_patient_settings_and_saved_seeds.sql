-- Migration: 025_patient_settings_and_saved_seeds.sql
-- Description: Creates patient_settings table and seeds saved hospitals & doctors across all patients

-- 1. Create patient_settings table
CREATE TABLE IF NOT EXISTS public.patient_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    sms_alerts BOOLEAN DEFAULT true,
    whatsapp_updates BOOLEAN DEFAULT true,
    email_reports BOOLEAN DEFAULT true,
    emergency_broadcast_alerts BOOLEAN DEFAULT true,
    abha_data_sharing BOOLEAN DEFAULT true,
    anonymous_analytics BOOLEAN DEFAULT false,
    preferred_language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT patient_settings_patient_id_key UNIQUE (patient_id)
);

-- Enable RLS
ALTER TABLE public.patient_settings ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policy
CREATE POLICY "Patients manage own settings"
    ON public.patient_settings
    FOR ALL
    USING (patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid()))
    WITH CHECK (patient_id IN (SELECT id FROM public.patient_profiles WHERE user_id = auth.uid()));

-- 2. Seed loop for all patient profiles
DO $$
DECLARE
    p_rec RECORD;
    hosp_citycare UUID;
    hosp_shalby UUID;
    doc_ananya UUID;
    doc_priya UUID;
BEGIN
    -- Resolve Hospital IDs
    SELECT id INTO hosp_citycare FROM public.hospitals WHERE name ILIKE '%CityCare%' LIMIT 1;
    SELECT id INTO hosp_shalby FROM public.hospitals WHERE name ILIKE '%Shalby%' LIMIT 1;

    -- Resolve Doctor IDs
    SELECT id INTO doc_ananya FROM public.doctors WHERE name ILIKE '%Ananya Sharma%' LIMIT 1;
    SELECT id INTO doc_priya FROM public.doctors WHERE name ILIKE '%Priya Mukherjee%' LIMIT 1;

    -- If doc_priya not found, grab any second doctor
    IF doc_priya IS NULL THEN
        SELECT id INTO doc_priya FROM public.doctors WHERE id != doc_ananya LIMIT 1;
    END IF;

    -- Iterate over each patient profile
    FOR p_rec IN SELECT id, user_id FROM public.patient_profiles LOOP
        
        -- A. Seed Settings
        INSERT INTO public.patient_settings (
            patient_id, sms_alerts, whatsapp_updates, email_reports, emergency_broadcast_alerts,
            abha_data_sharing, anonymous_analytics, preferred_language
        ) VALUES (
            p_rec.id, true, true, true, true, true, false, 'en'
        )
        ON CONFLICT (patient_id) DO NOTHING;

        -- B. Seed Saved Hospitals (CityCare & Shalby)
        IF hosp_citycare IS NOT NULL THEN
            INSERT INTO public.saved_hospitals (patient_id, hospital_id)
            VALUES (p_rec.id, hosp_citycare)
            ON CONFLICT DO NOTHING;
        END IF;

        IF hosp_shalby IS NOT NULL THEN
            INSERT INTO public.saved_hospitals (patient_id, hospital_id)
            VALUES (p_rec.id, hosp_shalby)
            ON CONFLICT DO NOTHING;
        END IF;

        -- C. Seed Saved Doctors
        IF doc_ananya IS NOT NULL THEN
            INSERT INTO public.saved_doctors (patient_id, doctor_id)
            VALUES (p_rec.id, doc_ananya)
            ON CONFLICT DO NOTHING;
        END IF;

        IF doc_priya IS NOT NULL THEN
            INSERT INTO public.saved_doctors (patient_id, doctor_id)
            VALUES (p_rec.id, doc_priya)
            ON CONFLICT DO NOTHING;
        END IF;

    END LOOP;
END $$;
