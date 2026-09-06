-- Migration: 023_seed_diverse_bills.sql
-- Description: Adds realistic diverse bills (Knee Replacement, Angioplasty, Gallbladder)
-- with dynamic package linking, itemized line items, and shock records.

DO $$
DECLARE
    p_rec RECORD;
    shalby_hosp_id UUID;
    chl_hosp_id UUID;
    apollo_hosp_id UUID;
    knee_pkg_id UUID;
    angio_pkg_id UUID;
    b1_id UUID;
    b2_id UUID;
BEGIN
    -- Resolve Indore hospitals
    SELECT id INTO shalby_hosp_id FROM public.hospitals WHERE name ILIKE '%Shalby%' AND city = 'Indore' LIMIT 1;
    SELECT id INTO chl_hosp_id FROM public.hospitals WHERE name ILIKE '%CHL%' AND city = 'Indore' LIMIT 1;
    SELECT id INTO apollo_hosp_id FROM public.hospitals WHERE name ILIKE '%Apollo%' AND city = 'Indore' LIMIT 1;

    -- Resolve packages
    SELECT id INTO knee_pkg_id FROM public.treatment_packages WHERE name ILIKE '%Knee Replacement%' AND hospital_id = shalby_hosp_id LIMIT 1;
    IF knee_pkg_id IS NULL THEN
        SELECT id INTO knee_pkg_id FROM public.treatment_packages WHERE name ILIKE '%Knee Replacement%' LIMIT 1;
    END IF;

    SELECT id INTO angio_pkg_id FROM public.treatment_packages WHERE name ILIKE '%Angioplasty%' AND hospital_id = chl_hosp_id LIMIT 1;
    IF angio_pkg_id IS NULL THEN
        SELECT id INTO angio_pkg_id FROM public.treatment_packages WHERE name ILIKE '%Angioplasty%' LIMIT 1;
    END IF;

    -- Iterate across each patient in public.patient_profiles
    FOR p_rec IN SELECT id FROM public.patient_profiles LOOP

        -- 1. Insert Total Knee Replacement Bill at Shalby Hospital
        IF NOT EXISTS (SELECT 1 FROM public.bills WHERE patient_id = p_rec.id AND treatment_name ILIKE '%Knee%') THEN
            INSERT INTO public.bills (
                id, patient_id, hospital_id, package_id, bill_number, bill_date,
                treatment_name, estimated_amount, final_amount, patient_payable,
                insurance_amount, status, bill_match_status, reason_summary
            ) VALUES (
                gen_random_uuid(), p_rec.id, shalby_hosp_id, knee_pkg_id,
                'SH-KNEE-' || SUBSTRING(p_rec.id::text, 1, 4) || '-06',
                '2025-06-15', 'Total Knee Replacement (Single Knee)',
                185000, 188500, 188500, 0, 'analyzed', 'minor_difference',
                'Minor extra charges (+₹3,500) detected for post-op mobility brace and cryotherapy pack.'
            ) RETURNING id INTO b1_id;

            -- Line items for Knee Replacement
            INSERT INTO public.bill_line_items (
                bill_id, category, description, quantity, unit_price, amount,
                package_amount, difference_amount, difference_reason, item_order, anomaly_flag
            ) VALUES
                (b1_id, 'Orthopedic Surgeon Fee', 'Lead Joint Replacement Surgeon Fee', 1, 74000, 74000, 74000, 0, 'As per package', 1, false),
                (b1_id, 'Modular OT & Anesthesia', 'Laminar airflow OT and spinal anesthesia', 1, 35000, 35000, 35000, 0, 'As per package', 2, false),
                (b1_id, 'Implant (Titanium Alloy)', 'FDA-approved high-flex single knee implant', 1, 45000, 45000, 45000, 0, 'As per package', 3, false),
                (b1_id, 'Room & Nursing Care (4 Days)', 'Special Ortho recovery room stay', 1, 20000, 20000, 20000, 0, 'As per package', 4, false),
                (b1_id, 'Medications & Consumables', 'Antibiotics, analgesics, cryotherapy kit & brace', 1, 10500, 10500, 7000, 3500, 'Rehabilitation brace and cryo compression not included in package baseline', 5, false),
                (b1_id, 'Physiotherapy & Diagnostics', 'Inpatient gait training and post-op digital X-rays', 1, 4000, 4000, 4000, 0, 'As per package', 6, false);
        END IF;

        -- 2. Insert Coronary Angioplasty Bill at CHL Hospital (Exact match)
        IF NOT EXISTS (SELECT 1 FROM public.bills WHERE patient_id = p_rec.id AND treatment_name ILIKE '%Angioplasty%') THEN
            INSERT INTO public.bills (
                id, patient_id, hospital_id, package_id, bill_number, bill_date,
                treatment_name, estimated_amount, final_amount, patient_payable,
                insurance_amount, status, bill_match_status, reason_summary
            ) VALUES (
                gen_random_uuid(), p_rec.id, chl_hosp_id, angio_pkg_id,
                'CHL-ANGIO-' || SUBSTRING(p_rec.id::text, 1, 4) || '-07',
                '2025-07-22', 'Coronary Angioplasty (1 Drug-Eluting Stent)',
                145000, 145000, 145000, 0, 'analyzed', 'matched',
                'Your bill is an exact match to the agreed CHL hospital package.'
            ) RETURNING id INTO b2_id;

            -- Line items for Angioplasty
            INSERT INTO public.bill_line_items (
                bill_id, category, description, quantity, unit_price, amount,
                package_amount, difference_amount, difference_reason, item_order, anomaly_flag
            ) VALUES
                (b2_id, 'Interventional Cardiologist', 'Procedure charges by Senior Interventional Cardiologist', 1, 58000, 58000, 58000, 0, 'As per package', 1, false),
                (b2_id, 'Cath Lab Charges', 'Advanced Cath lab facility & digital angiography', 1, 32000, 32000, 32000, 0, 'As per package', 2, false),
                (b2_id, 'Drug-Eluting Stent (DES)', 'Premium bio-resorbable polymer drug-eluting stent', 1, 30000, 30000, 30000, 0, 'As per package', 3, false),
                (b2_id, 'Cardiac ICU (24 Hours)', 'Step-down cardiac observation unit', 1, 15000, 15000, 15000, 0, 'As per package', 4, false),
                (b2_id, 'Pharmacy & Contrast Dye', 'Low-osmolar non-ionic contrast and anti-platelets', 1, 7000, 7000, 7000, 0, 'As per package', 5, false),
                (b2_id, 'ECG & Echo Diagnostics', 'Serial 12-lead ECGs and pre/post procedural 2D Echo', 1, 3000, 3000, 3000, 0, 'As per package', 6, false);
        END IF;

    END LOOP;
END $$;
