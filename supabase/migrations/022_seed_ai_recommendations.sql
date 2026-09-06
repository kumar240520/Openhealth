-- ============================================================================
-- 022_seed_ai_recommendations.sql
-- Seed Initial AI Recommendation Sessions across all patient profiles
-- Enforcing Rule 30 (Per-User Seed Isolation)
-- ============================================================================

DO $$
DECLARE
    rec RECORD;
    cardio_doc_id UUID;
    cardio_pkg_id UUID;
    apollo_id UUID;
BEGIN
    SELECT id INTO apollo_id FROM public.hospitals WHERE name ILIKE '%apollo%' LIMIT 1;
    SELECT id INTO cardio_doc_id FROM public.doctors WHERE specialization ILIKE '%cardio%' LIMIT 1;
    SELECT id INTO cardio_pkg_id FROM public.treatment_packages WHERE name ILIKE '%heart%' LIMIT 1;

    FOR rec IN SELECT id FROM public.patient_profiles LOOP
        DELETE FROM public.ai_recommendation_sessions WHERE patient_id = rec.id;

        INSERT INTO public.ai_recommendation_sessions (
            id, patient_id, session_title, input_symptoms, voice_transcript,
            triage_level, triage_urgency_score,
            suspected_conditions, recommended_specialties,
            recommended_doctor_ids, recommended_package_ids,
            biomarker_findings, bill_audit_insights,
            clinical_summary, plain_explanation,
            actionable_steps, red_flags, confidence
        ) VALUES (
            gen_random_uuid(),
            rec.id,
            'Comprehensive Cardiovascular & Metabolic Evaluation',
            'Occasional chest tightness when climbing stairs, shortness of breath after meals, mild fatigue and morning dizziness.',
            'Doctor, I have been feeling chest tightness when walking fast or taking stairs, and I feel out of breath easily lately.',
            'urgent',
            74,
            '[
                {"condition": "Coronary Artery Disease (CAD) / Stable Angina", "probability": 84, "severity": "High"},
                {"condition": "Mild Exertional Dyspnea", "probability": 72, "severity": "Moderate"},
                {"condition": "Borderline Metabolic Impairment", "probability": 65, "severity": "Low"}
            ]'::jsonb,
            '["Cardiology", "Internal Medicine"]'::jsonb,
            CASE WHEN cardio_doc_id IS NOT NULL THEN jsonb_build_array(cardio_doc_id) ELSE '[]'::jsonb END,
            CASE WHEN cardio_pkg_id IS NOT NULL THEN jsonb_build_array(cardio_pkg_id) ELSE '[]'::jsonb END,
            '[
                {"marker": "Fasting Glucose", "value": "145 mg/dL", "status": "High", "normal_range": "70 - 99 mg/dL"},
                {"marker": "Hemoglobin", "value": "11.4 g/dL", "status": "Low", "normal_range": "13.0 - 17.0 g/dL"},
                {"marker": "Resting ECG", "value": "T-wave inversion in V4-V6", "status": "Abnormal", "normal_range": "Normal sinus rhythm"}
            ]'::jsonb,
            '{
                "bill_shock_risk": "Moderate",
                "variance_detected": 2000,
                "advisory": "Extra non-formulary medications identified (+₹2,000) beyond standard package."
            }'::jsonb,
            'Patient presents with classic exertional angina symptoms accompanied by abnormal ECG repolarization and borderline elevated glycemic markers. Requires formal cardiology consult, treadmill stress testing (TMT), and 2D-Echocardiography.',
            'Your reported symptoms and ECG readings suggest your heart muscle may not be getting enough blood flow during physical exertion. This is not an immediate heart attack, but it is an urgent warning sign that requires an in-person cardiologist evaluation this week.',
            '[
                "Schedule a 12-lead Treadmill Stress Test (TMT) and 2D Echocardiogram.",
                "Avoid heavy weightlifting, intense sprinting, or sudden exertion until cleared by your cardiologist.",
                "Take your current prescription records to your specialist consultation.",
                "Review the extra ₹2,000 medication charges with your hospital billing desk."
            ]'::jsonb,
            '[
                "Crushing chest pressure radiating to left arm, neck, or jaw",
                "Cold sweats, nausea, or sudden loss of consciousness",
                "Extreme shortness of breath at complete rest"
            ]'::jsonb,
            0.94
        );
    END LOOP;
END $$;
