-- ============================================================================
-- 015_seed_data.sql
-- OpenHealth Database Architecture - Standard Reference Catalogs & Verified Providers
-- (Using authentic random UUIDs and dynamic relational references)
-- ============================================================================

-- Clean up any previous seed reference data
TRUNCATE TABLE public.ambulances CASCADE;
TRUNCATE TABLE public.ambulance_providers CASCADE;
TRUNCATE TABLE public.transparency_scores CASCADE;
TRUNCATE TABLE public.treatment_packages CASCADE;
TRUNCATE TABLE public.hospital_beds CASCADE;
TRUNCATE TABLE public.doctors CASCADE;
TRUNCATE TABLE public.departments CASCADE;
TRUNCATE TABLE public.hospital_treatments CASCADE;
TRUNCATE TABLE public.hospitals CASCADE;
TRUNCATE TABLE public.government_schemes CASCADE;
TRUNCATE TABLE public.insurance_providers CASCADE;
TRUNCATE TABLE public.treatments CASCADE;
TRUNCATE TABLE public.bed_types CASCADE;

-- 1. Standard Bed Types Catalog
INSERT INTO public.bed_types (id, name, description, is_active)
VALUES 
    (gen_random_uuid(), 'General Ward', 'Multi-bed shared standard recovery ward with 24/7 nursing', true),
    (gen_random_uuid(), 'ICU', 'Intensive Care Unit with continuous critical care monitoring and ventilator support', true),
    (gen_random_uuid(), 'NICU', 'Neonatal Intensive Care Unit for specialized newborn critical care', true),
    (gen_random_uuid(), 'PICU', 'Pediatric Intensive Care Unit for specialized infant and child intensive therapy', true),
    (gen_random_uuid(), 'HDU', 'High Dependency Unit for step-down intermediate post-surgical care', true),
    (gen_random_uuid(), 'Isolation Ward', 'Negative pressure isolation ward for infectious diseases and immunosuppressed care', true);

-- 2. Standard Global Treatments Catalog
INSERT INTO public.treatments (id, name, category, description, is_active)
VALUES
    (gen_random_uuid(), 'General Consultation', 'General Medicine', 'Comprehensive clinical examination, diagnosis, and prescription management', true),
    (gen_random_uuid(), 'Normal Vaginal Delivery', 'Obstetrics & Gynecology', 'Standard maternal labor care, delivery, and post-natal monitoring', true),
    (gen_random_uuid(), 'Caesarean Section (C-Section)', 'Obstetrics & Gynecology', 'Surgical delivery procedure under anesthesia with 3-day recovery package', true),
    (gen_random_uuid(), 'Laparoscopic Appendectomy', 'General Surgery', 'Minimally invasive keyhole surgery for acute appendix removal', true),
    (gen_random_uuid(), 'Total Knee Replacement (Unilateral)', 'Orthopedics', 'Advanced prosthetic joint replacement with post-op physiotherapy', true),
    (gen_random_uuid(), 'Coronary Angiography', 'Cardiology', 'Diagnostic arterial catheterization with fluoroscopic coronary imaging', true),
    (gen_random_uuid(), 'Cataract Surgery (Phaco + Foldable IOL)', 'Ophthalmology', 'Day-care ultrasonic phacoemulsification with intraocular lens implantation', true),
    (gen_random_uuid(), 'Hemodialysis Single Session', 'Nephrology', 'Advanced high-flux dialyzer session with continuous vital monitoring', true),
    (gen_random_uuid(), 'MRI Brain with Contrast', 'Radiology', '3.0 Tesla high-resolution neuroimaging with gadolinium contrast', true),
    (gen_random_uuid(), 'Chemotherapy Daycare Infusion', 'Oncology', 'Targeted intravenous antineoplastic therapy with antiemetic protocol', true);

-- 3. Standard Insurance Providers Catalog
INSERT INTO public.insurance_providers (id, name, description, phone, website, is_active)
VALUES
    (gen_random_uuid(), 'Star Health & Allied Insurance', 'Leading standalone health insurer with extensive cashless hospital network', '+91-44-2828-8800', 'https://www.starhealth.in', true),
    (gen_random_uuid(), 'HDFC ERGO General Insurance', 'Comprehensive private healthcare policies with seamless cashless claims', '+91-22-6234-6234', 'https://www.hdfcergo.com', true),
    (gen_random_uuid(), 'ICICI Lombard Health Care', 'Digital health protection with instant pre-authorization', '+91-22-6196-1960', 'https://www.icicilombard.com', true),
    (gen_random_uuid(), 'Care Health Insurance', 'Specialized critical illness and hospital cashless indemnity provider', '+91-1800-102-4477', 'https://www.careinsurance.com', true),
    (gen_random_uuid(), 'Niva Bupa Health Insurance', 'Family floater and super top-up medical coverage', '+91-1800-309-3333', 'https://www.nivabupa.com', true);

-- 4. Government Healthcare Schemes Catalog
INSERT INTO public.government_schemes (id, name, description, eligibility_rules, covered_treatments, required_documents, is_active)
VALUES
    (
        gen_random_uuid(),
        'Ayushman Bharat PM-JAY',
        'National public health insurance fund providing up to ₹5,00,000 cashless coverage per family per year for secondary and tertiary care',
        '{"income_bracket": "SECC 2011", "ration_card_types": ["BPL", "Antyodaya"], "max_family_coverage_inr": 500000}'::jsonb,
        '["C-Section", "Appendectomy", "Knee Replacement", "Coronary Angioplasty", "Dialysis", "Chemotherapy"]'::jsonb,
        '["Aadhaar Card", "Ration Card / PM-JAY Card", "Hospital Doctor Referral"]'::jsonb,
        true
    ),
    (
        gen_random_uuid(),
        'Central Government Health Scheme (CGHS)',
        'Comprehensive healthcare coverage for central government employees, pensioners, and their recognized dependents',
        '{"employee_status": ["serving", "pensioner"], "government_tier": "Central Government"}'::jsonb,
        '["All Outpatient Consultations", "Inpatient Surgeries", "Prescription Drugs", "Radiology & Pathology"]'::jsonb,
        '["CGHS Plastic Card", "Official ID Proof", "Prescription from CGHS Wellness Centre"]'::jsonb,
        true
    ),
    (
        gen_random_uuid(),
        'Rashtriya Arogya Nidhi (RAN)',
        'Financial assistance to patients living below the poverty line suffering from major life-threatening diseases',
        '{"income_status": "Below Poverty Line (BPL)", "hospital_type": "Super Specialty Government Hospital"}'::jsonb,
        '["Oncology", "Cardiology Surgery", "Nephrology Transplants", "Neuro-trauma"]'::jsonb,
        '["Income Certificate from Revenue Authority", "BPL Card", "Treatment Estimate from Medical Superintendent"]'::jsonb,
        true
    );

-- 5. Verified Premier Reference Hospitals
INSERT INTO public.hospitals (
    id, name, type, description, address, city, state, country, postal_code,
    latitude, longitude, phone, website, emergency_available, verification_status, is_active
)
VALUES
    (
        gen_random_uuid(),
        'Apollo Super Speciality Hospital',
        'Multi-Speciality Tertiary Care',
        'JCI and NABH accredited premier tertiary healthcare institution with 24/7 Level-1 Emergency & Trauma Care.',
        'Plot No. 13, Off Dr. E Moses Road, Worli',
        'Mumbai',
        'Maharashtra',
        'India',
        '400018',
        18.9986,
        72.8174,
        '+91-22-2490-5000',
        'https://www.apollohospitals.com',
        true,
        'verified',
        true
    ),
    (
        gen_random_uuid(),
        'Fortis Memorial Research Institute',
        'Multi-Speciality Tertiary Care',
        'Next-generation super speciality hospital offering internationally benchmarked organ transplants, oncology, and neurosurgery.',
        'Sector 44, Opposite HUDA City Centre',
        'Gurugram',
        'Haryana',
        'India',
        '122002',
        28.4595,
        77.0726,
        '+91-124-496-2200',
        'https://www.fortishealthcare.com',
        true,
        'verified',
        true
    ),
    (
        gen_random_uuid(),
        'Manipal Hospital Whitefield',
        'Tertiary Care & Trauma Centre',
        'Comprehensive clinical excellence center with 24/7 cardiac catheterization and robotic surgery suites.',
        'No. 143, 212-215, EPIP Zone, Whitefield',
        'Bengaluru',
        'Karnataka',
        'India',
        '560066',
        12.9784,
        77.7289,
        '+91-80-6199-0000',
        'https://www.manipalhospitals.com',
        true,
        'verified',
        true
    );

-- 6. Departments for Reference Hospitals
INSERT INTO public.departments (id, hospital_id, name, description, emergency_available, is_active)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        'Emergency & Trauma Care',
        '24/7 Resuscitation and Acute Cardiac/Neuro Response',
        true,
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        'Cardiology & Cardiac Surgery',
        'Interventional cardiology, bypass surgery, and electrophysiology',
        true,
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        'Obstetrics & Gynecology',
        'High-risk pregnancy management, birthing suites, and robotic gynecology',
        true,
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        'Orthopedics & Joint Replacement',
        'Robotic navigation joint replacement and sports medicine',
        false,
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Fortis Memorial Research Institute'),
        'Critical Care & Pulmonology',
        'High-dependency ICU, ECMO facility, and ventilator management',
        true,
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Manipal Hospital Whitefield'),
        'General & Laparoscopic Surgery',
        'Advanced minimally invasive GI and oncological procedures',
        true,
        true
    );

-- 7. Doctors for Reference Hospitals
INSERT INTO public.doctors (
    id, hospital_id, department_id, name, specialization, qualification, registration_number,
    experience_years, consultation_fee, verification_status, is_active
)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.departments WHERE name = 'Cardiology & Cardiac Surgery' AND hospital_id = (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital')),
        'Dr. Rajeshwar Sharma',
        'Chief Interventional Cardiologist',
        'MD, DM (Cardiology), FACC (USA)',
        'MCI-18492-2004',
        22,
        1800,
        'verified',
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.departments WHERE name = 'Obstetrics & Gynecology' AND hospital_id = (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital')),
        'Dr. Ananya Mukherjee',
        'Senior Consultant Obstetrician & Gynecologist',
        'MS (OBG), DNB, Fellowship in Fetal Medicine (UK)',
        'MMC-2009-08-3341',
        16,
        1500,
        'verified',
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.departments WHERE name = 'Orthopedics & Joint Replacement' AND hospital_id = (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital')),
        'Dr. Vikramaditya Rathore',
        'Robotic Joint Replacement Surgeon',
        'MS (Ortho), MCh (Ortho - UK), Fellowship in Arthroplasty',
        'DMC-14902-2008',
        18,
        1600,
        'verified',
        true
    );

-- 8. Hospital Beds Inventory (with auto-calculated available_beds trigger)
INSERT INTO public.hospital_beds (
    id, hospital_id, bed_type_id, total_beds, occupied_beds, reserved_beds, available_beds, last_updated_at
)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.bed_types WHERE name = 'General Ward'),
        120, 85, 10, 25, now()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.bed_types WHERE name = 'ICU'),
        30, 22, 2, 6, now()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.bed_types WHERE name = 'HDU'),
        20, 14, 1, 5, now()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Fortis Memorial Research Institute'),
        (SELECT id FROM public.bed_types WHERE name = 'General Ward'),
        150, 110, 12, 28, now()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Fortis Memorial Research Institute'),
        (SELECT id FROM public.bed_types WHERE name = 'ICU'),
        40, 28, 4, 8, now()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Manipal Hospital Whitefield'),
        (SELECT id FROM public.bed_types WHERE name = 'General Ward'),
        100, 70, 8, 22, now()
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Manipal Hospital Whitefield'),
        (SELECT id FROM public.bed_types WHERE name = 'ICU'),
        25, 18, 2, 5, now()
    );

-- 9. Transparent Packages
INSERT INTO public.treatment_packages (
    id, hospital_id, treatment_id, name, price, duration_days, room_category,
    included_services, excluded_services, package_lock_available, emi_available, active
)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.treatments WHERE name = 'Caesarean Section (C-Section)'),
        'All-Inclusive C-Section Maternity Package',
        75000,
        3,
        'Single Deluxe AC Room',
        '["3 Days Inpatient Stay", "OT Charges & Surgeon Fee", "Pediatrician Neonatal Checkup", "Baby Vaccination Kit", "Post-op Medications"]'::jsonb,
        '["NICU Stay if complications arise", "Blood Transfusions", "Specialist Neonatal Consultations"]'::jsonb,
        true,
        true,
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        (SELECT id FROM public.treatments WHERE name = 'Total Knee Replacement (Unilateral)'),
        'Robotic Total Knee Replacement Package',
        195000,
        4,
        'Private Room',
        '["FDA Approved High-Flex Implant", "Robotic Navigation Suite Charges", "Physiotherapy for 4 days", "Post-op X-rays & Blood tests"]'::jsonb,
        '["Pre-admission Cross-consultations", "Extended Stay beyond 4 days"]'::jsonb,
        true,
        true,
        true
    );

-- 10. Transparency Scores
INSERT INTO public.transparency_scores (
    id, hospital_id, price_clarity_score, package_clarity_score, information_score,
    data_freshness_score, billing_consistency_score, verification_score, overall_score, scoring_version
)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Apollo Super Speciality Hospital'),
        94.5,
        96.0,
        92.0,
        98.0,
        95.0,
        100.0,
        95.9,
        'transparency-v1'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Fortis Memorial Research Institute'),
        91.0,
        93.5,
        95.0,
        92.0,
        90.5,
        100.0,
        93.6,
        'transparency-v1'
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.hospitals WHERE name = 'Manipal Hospital Whitefield'),
        89.0,
        90.0,
        91.5,
        94.0,
        88.0,
        100.0,
        92.0,
        'transparency-v1'
    );

-- 11. Emergency Ambulance Providers & Live Ambulance Fleet
INSERT INTO public.ambulance_providers (
    id, name, phone, service_area, verification_status, is_active
)
VALUES
    (
        gen_random_uuid(),
        'National Emergency Ambulance Service (108 Network)',
        '+91-108',
        '{"city": "Mumbai", "zones": ["South Mumbai", "Central", "Western Suburbs"]}'::jsonb,
        'verified',
        true
    ),
    (
        gen_random_uuid(),
        'Apollo 24x7 Critical Care Ambulance Fleet',
        '+91-1066',
        '{"city": "Mumbai", "zones": ["Worli", "Bandra", "Andheri"]}'::jsonb,
        'verified',
        true
    );

INSERT INTO public.ambulances (
    id, provider_id, vehicle_number, ambulance_type, status, latitude, longitude, last_location_at, is_active
)
VALUES
    (
        gen_random_uuid(),
        (SELECT id FROM public.ambulance_providers WHERE name = 'National Emergency Ambulance Service (108 Network)'),
        'MH-01-EA-1081',
        'Advanced Cardiac Life Support (ACLS)',
        'available',
        18.9950,
        72.8200,
        now(),
        true
    ),
    (
        gen_random_uuid(),
        (SELECT id FROM public.ambulance_providers WHERE name = 'Apollo 24x7 Critical Care Ambulance Fleet'),
        'MH-02-AP-9902',
        'Advanced Life Support (ALS) with Ventilator',
        'available',
        19.0010,
        72.8150,
        now(),
        true
    );
