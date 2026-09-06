-- ============================================================================
-- 020_seed_reports_and_timeline.sql
-- OpenHealth Database Architecture - Seed Reports, Timeline & Test Bookings
-- Strictly adheres to Rule 30 (Per-User Seed Isolation)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    apollo_id UUID;
    bombay_id UUID;
    shalby_id UUID;
BEGIN
    SELECT id INTO apollo_id FROM public.hospitals WHERE name ILIKE '%apollo%' LIMIT 1;
    SELECT id INTO bombay_id FROM public.hospitals WHERE name ILIKE '%bombay%' OR name ILIKE '%fortis%' LIMIT 1;
    SELECT id INTO shalby_id FROM public.hospitals WHERE name ILIKE '%shalby%' OR name ILIKE '%max%' LIMIT 1;

    FOR rec IN SELECT id, user_id FROM public.patient_profiles LOOP
        
        -- Clean up previous seed records for this patient
        DELETE FROM public.patient_test_reports WHERE patient_id = rec.id;
        DELETE FROM public.patient_health_timeline WHERE patient_id = rec.id;
        DELETE FROM public.medical_documents WHERE patient_id = rec.id AND report_title IS NOT NULL;

        -- 1. Seed 4 Recent Uploaded Reports in medical_documents
        INSERT INTO public.medical_documents (
            id, patient_id, hospital_id, document_type, file_path, original_filename,
            report_title, category_tag, source_type, mime_type, file_size, pii_masked,
            processing_status, uploaded_at, processed_at
        ) VALUES
            (gen_random_uuid(), rec.id, apollo_id, 'medical_report', 'reports/MRI_Brain_Report.pdf', 'MRI_Brain_Report.pdf',
             'MRI Brain Report', 'MRI', 'uploaded', 'application/pdf', 2516582, true, 'processed', '2025-05-29 10:30:00+00', '2025-05-29 10:31:00+00'),
            (gen_random_uuid(), rec.id, bombay_id, 'medical_report', 'reports/Blood_Test_Report.pdf', 'Blood_Test_Report.pdf',
             'Blood Test Report', 'Pathology', 'uploaded', 'application/pdf', 1887436, true, 'processed', '2025-05-26 14:15:00+00', '2025-05-26 14:16:00+00'),
            (gen_random_uuid(), rec.id, shalby_id, 'medical_report', 'reports/X_Ray_Chest.pdf', 'X_Ray_Chest.pdf',
             'X-Ray Chest', 'Radiology', 'uploaded', 'application/pdf', 1258291, true, 'processed', '2025-05-20 09:45:00+00', '2025-05-20 09:46:00+00'),
            (gen_random_uuid(), rec.id, apollo_id, 'medical_report', 'reports/ECG_Report.pdf', 'ECG_Report.pdf',
             'ECG Report', 'Cardiology', 'uploaded', 'application/pdf', 921600, true, 'processed', '2025-05-18 16:20:00+00', '2025-05-18 16:21:00+00');

        -- 2. Seed 5 Test Reports (From Bookings)
        INSERT INTO public.patient_test_reports (
            id, patient_id, hospital_id, test_name, category, booked_on, test_date, status, report_url, file_size
        ) VALUES
            (gen_random_uuid(), rec.id, apollo_id, 'Complete Blood Count (CBC)', 'Pathology', '2025-05-29', '2025-05-29', 'completed', 'reports/CBC_Report.pdf', 1845000),
            (gen_random_uuid(), rec.id, apollo_id, 'Lipid Profile', 'Pathology', '2025-05-29', '2025-05-29', 'completed', 'reports/Lipid_Profile.pdf', 1240000),
            (gen_random_uuid(), rec.id, bombay_id, 'Liver Function Test (LFT)', 'Pathology', '2025-05-25', '2025-05-26', 'completed', 'reports/LFT_Report.pdf', 1420000),
            (gen_random_uuid(), rec.id, shalby_id, 'Thyroid Profile (T3, T4, TSH)', 'Pathology', '2025-05-22', '2025-05-23', 'completed', 'reports/Thyroid_Report.pdf', 1180000),
            (gen_random_uuid(), rec.id, apollo_id, 'Vitamin D Test', 'Pathology', '2025-05-20', '2025-05-21', 'processing', null, null);

        -- 3. Seed 5 Health Timeline Entries
        INSERT INTO public.patient_health_timeline (
            id, patient_id, hospital_id, doctor_name, event_title, event_date, event_type, status, notes
        ) VALUES
            (gen_random_uuid(), rec.id, apollo_id, null, 'Blood Test', CURRENT_DATE, 'diagnostic', 'completed', 'Routine preventive blood panel checkup'),
            (gen_random_uuid(), rec.id, apollo_id, null, 'ECG', '2025-05-28', 'cardiology', 'completed', '12-lead standard resting electrocardiogram'),
            (gen_random_uuid(), rec.id, shalby_id, null, 'X-Ray Chest', '2025-05-20', 'radiology', 'completed', 'Chest PA view radiograph'),
            (gen_random_uuid(), rec.id, apollo_id, 'Dr. R. Sharma', 'Consultation', '2025-05-15', 'consultation', 'completed', 'Outpatient cardiology specialist consultation'),
            (gen_random_uuid(), rec.id, apollo_id, null, 'MRI Brain', '2025-05-10', 'mri', 'completed', 'High-resolution neuro-imaging scan');

    END LOOP;
END $$;
