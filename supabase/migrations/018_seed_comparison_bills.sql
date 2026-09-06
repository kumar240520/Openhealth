-- ============================================================================
-- 018_seed_comparison_bills.sql
-- OpenHealth Database Architecture - Seed Package Comparison Bills & Line Items
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    apollo_id UUID;
    bombay_id UUID;
    shalby_id UUID;
    heart_treatment_id UUID;
    apollo_pkg_id UUID;
    bombay_pkg_id UUID;
    shalby_pkg_id UUID;
    b1_id UUID;
    b2_id UUID;
    b3_id UUID;
BEGIN
    -- 1. Find or create Treatment "Heart Surgery"
    SELECT id INTO heart_treatment_id FROM public.treatments WHERE name ILIKE '%heart%' OR name ILIKE '%cardiac%' OR name ILIKE '%angioplasty%' LIMIT 1;
    IF heart_treatment_id IS NULL THEN
        INSERT INTO public.treatments (id, name, category, description)
        VALUES (gen_random_uuid(), 'Heart Surgery (Cardiac Bypass & Valve Care)', 'Cardiology', 'Comprehensive cardiovascular procedure including bypass and post-op care.')
        RETURNING id INTO heart_treatment_id;
    END IF;

    -- 2. Resolve hospital IDs
    SELECT id INTO apollo_id FROM public.hospitals WHERE name ILIKE '%apollo%' LIMIT 1;
    SELECT id INTO bombay_id FROM public.hospitals WHERE name ILIKE '%bombay%' OR name ILIKE '%fortis%' LIMIT 1;
    SELECT id INTO shalby_id FROM public.hospitals WHERE name ILIKE '%shalby%' OR name ILIKE '%max%' LIMIT 1;

    -- 3. Ensure Heart Surgery Package for Apollo
    SELECT id INTO apollo_pkg_id FROM public.treatment_packages WHERE hospital_id = apollo_id AND name ILIKE '%heart%' LIMIT 1;
    IF apollo_pkg_id IS NULL THEN
        INSERT INTO public.treatment_packages (
            id, hospital_id, treatment_id, name, price, duration_days, room_category,
            included_services, excluded_services, package_lock_available, emi_available, active
        ) VALUES (
            gen_random_uuid(), apollo_id, heart_treatment_id, 'Heart Surgery Package', 150000, 5, 'Deluxe Private',
            '["Surgeon Fee", "OT Charges", "Room (3 Days)", "ICU (2 Days)", "Medicines", "Diagnostics & Tests"]'::jsonb,
            '["Special implants not in list", "Additional non-formulary medications"]'::jsonb,
            true, true, true
        ) RETURNING id INTO apollo_pkg_id;
    END IF;

    -- Ensure Heart Surgery Package for Bombay
    SELECT id INTO bombay_pkg_id FROM public.treatment_packages WHERE hospital_id = bombay_id AND name ILIKE '%heart%' LIMIT 1;
    IF bombay_pkg_id IS NULL THEN
        INSERT INTO public.treatment_packages (
            id, hospital_id, treatment_id, name, price, duration_days, room_category,
            included_services, excluded_services, package_lock_available, emi_available, active
        ) VALUES (
            gen_random_uuid(), bombay_id, heart_treatment_id, 'Heart Surgery Package', 150000, 5, 'Semi-Private',
            '["Surgeon Fee", "OT Charges", "Room (3 Days)", "ICU (2 Days)", "Medicines", "Diagnostics & Tests"]'::jsonb,
            '[]'::jsonb,
            true, true, true
        ) RETURNING id INTO bombay_pkg_id;
    END IF;

    -- Ensure Heart Surgery Package for Shalby
    SELECT id INTO shalby_pkg_id FROM public.treatment_packages WHERE hospital_id = shalby_id AND name ILIKE '%heart%' LIMIT 1;
    IF shalby_pkg_id IS NULL THEN
        INSERT INTO public.treatment_packages (
            id, hospital_id, treatment_id, name, price, duration_days, room_category,
            included_services, excluded_services, package_lock_available, emi_available, active
        ) VALUES (
            gen_random_uuid(), shalby_id, heart_treatment_id, 'Heart Surgery Package', 155000, 5, 'Private Room',
            '["Surgeon Fee", "OT Charges", "Room (3 Days)", "ICU (2 Days)", "Medicines", "Diagnostics & Tests"]'::jsonb,
            '[]'::jsonb,
            true, true, true
        ) RETURNING id INTO shalby_pkg_id;
    END IF;

    -- 4. Seed comparison bills for each patient profile
    FOR rec IN SELECT id FROM public.patient_profiles LOOP
        
        -- Delete any previous test bills for clean matching
        DELETE FROM public.bills WHERE patient_id = rec.id AND treatment_name = 'Heart Surgery';

        -- Bill 1: Apollo Hospitals, Indore (Active Selected Bill)
        INSERT INTO public.bills (
            id, patient_id, hospital_id, package_id, bill_number, bill_date,
            treatment_name, estimated_amount, final_amount, insurance_amount, patient_payable,
            status, bill_match_status, reason_summary
        ) VALUES (
            gen_random_uuid(), rec.id, apollo_id, apollo_pkg_id, 'AP-BILL-2025-0529', '2025-05-29',
            'Heart Surgery', 150000, 152000, 120000, 32000,
            'analyzed', 'minor_difference', 'We found some extra charges in your bill.'
        ) RETURNING id INTO b1_id;

        -- Line items for Bill 1 (Exact 6 items from reference image)
        INSERT INTO public.bill_line_items (bill_id, category, description, quantity, unit_price, amount, package_amount, difference_amount, difference_reason, item_order) VALUES
            (b1_id, 'Surgeon Fee', 'Surgeon Fee', 1, 60000, 60000, 60000, 0, 'As per package', 1),
            (b1_id, 'OT Charges', 'OT Charges', 1, 25000, 25000, 25000, 0, 'As per package', 2),
            (b1_id, 'Room (3 Days)', 'Room (3 Days)', 3, 9000, 27000, 27000, 0, 'As per package', 3),
            (b1_id, 'ICU (2 Days)', 'ICU (2 Days)', 2, 10000, 20000, 20000, 0, 'As per package', 4),
            (b1_id, 'Medications', 'Medications', 1, 14000, 14000, 12000, 2000, 'Extra medicines used not included in package', 5),
            (b1_id, 'Diagnostics & Tests', 'Diagnostics & Tests', 1, 8000, 8000, 8000, 0, 'As per package', 6);

        -- Bill 2: Fortis / Bombay Hospital, Indore
        INSERT INTO public.bills (
            id, patient_id, hospital_id, package_id, bill_number, bill_date,
            treatment_name, estimated_amount, final_amount, insurance_amount, patient_payable,
            status, bill_match_status, reason_summary
        ) VALUES (
            gen_random_uuid(), rec.id, bombay_id, bombay_pkg_id, 'BH-BILL-2025-0414', '2025-04-14',
            'Heart Surgery', 150000, 148500, 120000, 28500,
            'analyzed', 'matched', 'Your bill is well within package limits.'
        ) RETURNING id INTO b2_id;

        INSERT INTO public.bill_line_items (bill_id, category, description, quantity, unit_price, amount, package_amount, difference_amount, difference_reason, item_order) VALUES
            (b2_id, 'Surgeon Fee', 'Surgeon Fee', 1, 60000, 60000, 60000, 0, 'As per package', 1),
            (b2_id, 'OT Charges', 'OT Charges', 1, 25000, 25000, 25000, 0, 'As per package', 2),
            (b2_id, 'Room (3 Days)', 'Room (3 Days)', 3, 9000, 27000, 27000, 0, 'As per package', 3),
            (b2_id, 'ICU (2 Days)', 'ICU (2 Days)', 2, 10000, 20000, 20000, 0, 'As per package', 4),
            (b2_id, 'Medications', 'Medications', 1, 10500, 10500, 12000, -1500, 'Medication savings under package', 5),
            (b2_id, 'Diagnostics & Tests', 'Diagnostics & Tests', 1, 8000, 8000, 8000, 0, 'As per package', 6);

        -- Bill 3: Max / Shalby Hospital, Indore
        INSERT INTO public.bills (
            id, patient_id, hospital_id, package_id, bill_number, bill_date,
            treatment_name, estimated_amount, final_amount, insurance_amount, patient_payable,
            status, bill_match_status, reason_summary
        ) VALUES (
            gen_random_uuid(), rec.id, shalby_id, shalby_pkg_id, 'SH-BILL-2025-0305', '2025-03-05',
            'Heart Surgery', 155000, 160300, 130000, 30300,
            'analyzed', 'minor_difference', 'Minor extra charges detected in surgical consumables.'
        ) RETURNING id INTO b3_id;

        INSERT INTO public.bill_line_items (bill_id, category, description, quantity, unit_price, amount, package_amount, difference_amount, difference_reason, item_order) VALUES
            (b3_id, 'Surgeon Fee', 'Surgeon Fee', 1, 62000, 62000, 62000, 0, 'As per package', 1),
            (b3_id, 'OT Charges', 'OT Charges', 1, 26000, 26000, 26000, 0, 'As per package', 2),
            (b3_id, 'Room (3 Days)', 'Room (3 Days)', 3, 9000, 27000, 27000, 0, 'As per package', 3),
            (b3_id, 'ICU (2 Days)', 'ICU (2 Days)', 2, 11000, 22000, 22000, 0, 'As per package', 4),
            (b3_id, 'Medications', 'Medications', 1, 15300, 15300, 12000, 3300, 'Consumables & extra IV fluids', 5),
            (b3_id, 'Diagnostics & Tests', 'Diagnostics & Tests', 1, 8000, 8000, 8000, 0, 'As per package', 6);

    END LOOP;
END $$;
