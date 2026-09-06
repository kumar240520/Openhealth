-- ============================================================================
-- 016_seed_medical_documents.sql
-- OpenHealth Database Architecture - Seed Clinical Records & AI Report Analyses
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    apollo_id UUID;
    bombay_id UUID;
    shalby_id UUID;
    citycare_id UUID;
    doc1_id UUID;
    doc2_id UUID;
    doc3_id UUID;
    doc4_id UUID;
BEGIN
    -- Resolve hospital IDs
    SELECT id INTO apollo_id FROM public.hospitals WHERE name ILIKE '%apollo%' LIMIT 1;
    SELECT id INTO bombay_id FROM public.hospitals WHERE name ILIKE '%bombay%' LIMIT 1;
    SELECT id INTO shalby_id FROM public.hospitals WHERE name ILIKE '%shalby%' LIMIT 1;
    SELECT id INTO citycare_id FROM public.hospitals WHERE name ILIKE '%citycare%' LIMIT 1;

    -- Loop through all existing patient profiles to ensure everyone has starter records
    FOR rec IN SELECT id, user_id FROM public.patient_profiles LOOP

        -- Check if documents already exist for this patient
        IF NOT EXISTS (SELECT 1 FROM public.medical_documents WHERE patient_id = rec.id) THEN
            
            -- Document 1: CBC & Metabolic Health Panel (Medical Report)
            INSERT INTO public.medical_documents (
                id,
                patient_id,
                hospital_id,
                document_type,
                file_path,
                original_filename,
                mime_type,
                file_size,
                pii_masked,
                processing_status,
                uploaded_at,
                processed_at
            ) VALUES (
                gen_random_uuid(),
                rec.id,
                apollo_id,
                'medical_report',
                'reports/Apollo_Pathology_CBC_Metabolic_Report.pdf',
                'Apollo_Pathology_CBC_Metabolic_Report.pdf',
                'application/pdf',
                1845200,
                true,
                'processed',
                now() - INTERVAL '2 days',
                now() - INTERVAL '2 days' + INTERVAL '45 seconds'
            ) RETURNING id INTO doc1_id;

            -- AI Analysis for Document 1 (Biomarkers, Ranges, Conditions)
            INSERT INTO public.report_analyses (
                document_id,
                patient_id,
                summary,
                extracted_data,
                detected_conditions,
                detected_specialties,
                important_terms,
                ai_explanation,
                confidence,
                model_version
            ) VALUES (
                doc1_id,
                rec.id,
                'Comprehensive Blood Count (CBC) and Lipid Profile indicates mild microcytic anemia with low Hemoglobin (11.2 g/dL) and slightly elevated Total Cholesterol (218 mg/dL). Renal and Liver parameters are within optimal clinical limits.',
                '{
                    "hemoglobin": {"test_name": "Hemoglobin", "value": 11.2, "unit": "g/dL", "min": 13.0, "max": 17.0, "status": "low"},
                    "wbc_count": {"test_name": "White Blood Cells (WBC)", "value": 7400, "unit": "/mcL", "min": 4500, "max": 11000, "status": "normal"},
                    "platelets": {"test_name": "Platelet Count", "value": 245000, "unit": "/mcL", "min": 150000, "max": 450000, "status": "normal"},
                    "fasting_glucose": {"test_name": "Fasting Blood Glucose", "value": 98, "unit": "mg/dL", "min": 70, "max": 100, "status": "normal"},
                    "cholesterol": {"test_name": "Total Cholesterol", "value": 218, "unit": "mg/dL", "min": 125, "max": 200, "status": "high"},
                    "hdl_cholesterol": {"test_name": "HDL (Good) Cholesterol", "value": 48, "unit": "mg/dL", "min": 40, "max": 60, "status": "normal"},
                    "creatinine": {"test_name": "Serum Creatinine", "value": 0.9, "unit": "mg/dL", "min": 0.6, "max": 1.2, "status": "normal"}
                }'::jsonb,
                '["Mild Microcytic Anemia", "Borderline Hypercholesterolemia"]'::jsonb,
                '["Hematology", "Cardiology", "Internal Medicine"]'::jsonb,
                '[
                    {"term": "Microcytic", "explanation": "Red blood cells smaller than typical, often caused by dietary iron deficiency."},
                    {"term": "Lipid Profile", "explanation": "A panel measuring various blood fats to assess cardiac and arterial health."}
                ]'::jsonb,
                'Your overall blood health is steady, but your iron levels may need evaluation due to slightly low Hemoglobin. Adding iron-rich foods (spinach, legumes, lean protein) or checking ferritin with your doctor is advised. Your cholesterol is marginally above the 200 mg/dL baseline, which can often be improved with brisk aerobic exercise and dietary fiber.',
                0.96,
                'report-analyzer-v1'
            );

            -- Document 2: Cardiology Outpatient Prescription
            INSERT INTO public.medical_documents (
                id,
                patient_id,
                hospital_id,
                document_type,
                file_path,
                original_filename,
                mime_type,
                file_size,
                pii_masked,
                processing_status,
                uploaded_at,
                processed_at
            ) VALUES (
                gen_random_uuid(),
                rec.id,
                bombay_id,
                'prescription',
                'prescriptions/Bombay_Hospital_Cardio_Rx_Dr_Sharma.pdf',
                'Bombay_Hospital_Cardio_Rx_Dr_Sharma.pdf',
                'application/pdf',
                684200,
                true,
                'processed',
                now() - INTERVAL '7 days',
                now() - INTERVAL '7 days' + INTERVAL '30 seconds'
            ) RETURNING id INTO doc2_id;

            -- Document 3: Orthopedic Arthroscopy Discharge Summary
            INSERT INTO public.medical_documents (
                id,
                patient_id,
                hospital_id,
                document_type,
                file_path,
                original_filename,
                mime_type,
                file_size,
                pii_masked,
                processing_status,
                uploaded_at,
                processed_at
            ) VALUES (
                gen_random_uuid(),
                rec.id,
                shalby_id,
                'discharge_summary',
                'summaries/Shalby_Knee_Arthroscopy_Discharge_Summary.pdf',
                'Shalby_Knee_Arthroscopy_Discharge_Summary.pdf',
                'application/pdf',
                2450000,
                true,
                'processed',
                now() - INTERVAL '14 days',
                now() - INTERVAL '14 days' + INTERVAL '50 seconds'
            ) RETURNING id INTO doc3_id;

            -- Document 4: Inpatient Hospitalization Bill
            INSERT INTO public.medical_documents (
                id,
                patient_id,
                hospital_id,
                document_type,
                file_path,
                original_filename,
                mime_type,
                file_size,
                pii_masked,
                processing_status,
                uploaded_at,
                processed_at
            ) VALUES (
                gen_random_uuid(),
                rec.id,
                citycare_id,
                'medical_bill',
                'bills/CityCare_Hospital_IPD_Final_Bill.pdf',
                'CityCare_Hospital_IPD_Final_Bill.pdf',
                'application/pdf',
                1120000,
                true,
                'processed',
                now() - INTERVAL '21 days',
                now() - INTERVAL '21 days' + INTERVAL '20 seconds'
            ) RETURNING id INTO doc4_id;

        END IF;

    END LOOP;
END $$;
