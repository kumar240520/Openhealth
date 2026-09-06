-- ============================================================================
-- 013_rls_policies_and_grants.sql
-- OpenHealth Database Architecture - Complete RLS Policies & Table Grants
-- ============================================================================

-- Step 1: Enable RLS on all 37 public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_hospital_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_shock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transparency_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_hospital_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;

-- Step 2: Set explicit privileges for anon and authenticated roles
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT unnest(ARRAY[
            'profiles', 'patient_profiles', 'hospital_memberships', 'insurance_memberships',
            'hospitals', 'departments', 'doctors', 'treatments', 'hospital_treatments',
            'treatment_packages', 'bed_types', 'hospital_beds', 'bed_reservations', 'bookings',
            'medical_documents', 'patient_hospital_consents', 'report_analyses', 'bills',
            'bill_line_items', 'bill_analyses', 'bill_shock_records', 'cost_predictions',
            'insurance_providers', 'insurance_policies', 'government_schemes', 'eligibility_checks',
            'transparency_scores', 'hospital_metrics', 'saved_hospitals', 'search_history',
            'notifications', 'audit_logs', 'ambulance_providers', 'ambulances',
            'emergency_sessions', 'emergency_hospital_matches', 'ambulance_requests'
        ])
    LOOP
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', t);
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', t);
    END LOOP;
END $$;

-- Public tables accessible to anonymous users
GRANT SELECT ON TABLE public.hospitals TO anon;
GRANT SELECT ON TABLE public.departments TO anon;
GRANT SELECT ON TABLE public.doctors TO anon;
GRANT SELECT ON TABLE public.treatments TO anon;
GRANT SELECT ON TABLE public.hospital_treatments TO anon;
GRANT SELECT ON TABLE public.treatment_packages TO anon;
GRANT SELECT ON TABLE public.bed_types TO anon;
GRANT SELECT ON TABLE public.hospital_beds TO anon;
GRANT SELECT ON TABLE public.insurance_providers TO anon;
GRANT SELECT ON TABLE public.government_schemes TO anon;
GRANT SELECT ON TABLE public.transparency_scores TO anon;
GRANT SELECT ON TABLE public.ambulance_providers TO anon;

-- ============================================================================
-- Detailed CRUD RLS Policies (with idempotent DROP IF EXISTS)
-- ============================================================================

-- 1. profiles
DROP POLICY IF EXISTS "profiles_select_own_or_platform_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_platform_admin" ON public.profiles
    FOR SELECT TO authenticated USING (
        (SELECT auth.uid()) = id OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT auth.uid()) = id AND role = 'patient'
    );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated USING (
        (SELECT auth.uid()) = id OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT auth.uid()) = id OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "profiles_delete_platform_admin" ON public.profiles;
CREATE POLICY "profiles_delete_platform_admin" ON public.profiles
    FOR DELETE TO authenticated USING ((SELECT private.is_platform_admin()));

-- 2. patient_profiles
DROP POLICY IF EXISTS "patient_profiles_select_own" ON public.patient_profiles;
CREATE POLICY "patient_profiles_select_own" ON public.patient_profiles
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "patient_profiles_insert_own" ON public.patient_profiles;
CREATE POLICY "patient_profiles_insert_own" ON public.patient_profiles
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(id)));

DROP POLICY IF EXISTS "patient_profiles_update_own" ON public.patient_profiles;
CREATE POLICY "patient_profiles_update_own" ON public.patient_profiles
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_patient(id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_patient(id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "patient_profiles_delete_platform_admin" ON public.patient_profiles;
CREATE POLICY "patient_profiles_delete_platform_admin" ON public.patient_profiles
    FOR DELETE TO authenticated USING ((SELECT private.is_platform_admin()));

-- 3. hospital_memberships
DROP POLICY IF EXISTS "hospital_memberships_select" ON public.hospital_memberships;
CREATE POLICY "hospital_memberships_select" ON public.hospital_memberships
    FOR SELECT TO authenticated USING (
        user_id = (SELECT auth.uid())
        OR (SELECT private.is_hospital_admin(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_memberships_insert" ON public.hospital_memberships;
CREATE POLICY "hospital_memberships_insert" ON public.hospital_memberships
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_memberships_update" ON public.hospital_memberships;
CREATE POLICY "hospital_memberships_update" ON public.hospital_memberships
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_memberships_delete" ON public.hospital_memberships;
CREATE POLICY "hospital_memberships_delete" ON public.hospital_memberships
    FOR DELETE TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

-- 4. insurance_memberships
DROP POLICY IF EXISTS "insurance_memberships_select" ON public.insurance_memberships;
CREATE POLICY "insurance_memberships_select" ON public.insurance_memberships
    FOR SELECT TO authenticated USING (
        user_id = (SELECT auth.uid())
        OR (SELECT private.is_insurance_member(provider_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "insurance_memberships_admin_mutation" ON public.insurance_memberships;
CREATE POLICY "insurance_memberships_admin_mutation" ON public.insurance_memberships
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 5. hospitals
DROP POLICY IF EXISTS "hospitals_select_public_or_member" ON public.hospitals;
CREATE POLICY "hospitals_select_public_or_member" ON public.hospitals
    FOR SELECT TO anon, authenticated USING (
        (is_active = true AND verification_status = 'verified')
        OR (SELECT private.is_hospital_member(id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospitals_insert" ON public.hospitals;
CREATE POLICY "hospitals_insert" ON public.hospitals
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "hospitals_update" ON public.hospitals;
CREATE POLICY "hospitals_update" ON public.hospitals
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_hospital_admin(id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_admin(id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospitals_delete" ON public.hospitals;
CREATE POLICY "hospitals_delete" ON public.hospitals
    FOR DELETE TO authenticated USING ((SELECT private.is_platform_admin()));

-- 6. departments
DROP POLICY IF EXISTS "departments_select" ON public.departments;
CREATE POLICY "departments_select" ON public.departments
    FOR SELECT TO anon, authenticated USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM public.hospitals h WHERE h.id = departments.hospital_id AND h.is_active = true AND h.verification_status = 'verified'
        ))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "departments_admin_mutation" ON public.departments;
CREATE POLICY "departments_admin_mutation" ON public.departments
    FOR ALL TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

-- 7. doctors
DROP POLICY IF EXISTS "doctors_select" ON public.doctors;
CREATE POLICY "doctors_select" ON public.doctors
    FOR SELECT TO anon, authenticated USING (
        (is_active = true AND verification_status = 'verified' AND EXISTS (
            SELECT 1 FROM public.hospitals h WHERE h.id = doctors.hospital_id AND h.is_active = true AND h.verification_status = 'verified'
        ))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "doctors_admin_mutation" ON public.doctors;
CREATE POLICY "doctors_admin_mutation" ON public.doctors
    FOR ALL TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

-- 8. treatments
DROP POLICY IF EXISTS "treatments_select" ON public.treatments;
CREATE POLICY "treatments_select" ON public.treatments
    FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "treatments_admin_mutation" ON public.treatments;
CREATE POLICY "treatments_admin_mutation" ON public.treatments
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 9. hospital_treatments
DROP POLICY IF EXISTS "hospital_treatments_select" ON public.hospital_treatments;
CREATE POLICY "hospital_treatments_select" ON public.hospital_treatments
    FOR SELECT TO anon, authenticated USING (
        (available = true AND EXISTS (
            SELECT 1 FROM public.hospitals h WHERE h.id = hospital_treatments.hospital_id AND h.is_active = true AND h.verification_status = 'verified'
        ))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_treatments_admin_mutation" ON public.hospital_treatments;
CREATE POLICY "hospital_treatments_admin_mutation" ON public.hospital_treatments
    FOR ALL TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

-- 10. treatment_packages
DROP POLICY IF EXISTS "treatment_packages_select" ON public.treatment_packages;
CREATE POLICY "treatment_packages_select" ON public.treatment_packages
    FOR SELECT TO anon, authenticated USING (
        (active = true AND EXISTS (
            SELECT 1 FROM public.hospitals h WHERE h.id = treatment_packages.hospital_id AND h.is_active = true AND h.verification_status = 'verified'
        ))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "treatment_packages_admin_mutation" ON public.treatment_packages;
CREATE POLICY "treatment_packages_admin_mutation" ON public.treatment_packages
    FOR ALL TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

-- 11. bed_types
DROP POLICY IF EXISTS "bed_types_select" ON public.bed_types;
CREATE POLICY "bed_types_select" ON public.bed_types
    FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "bed_types_admin_mutation" ON public.bed_types;
CREATE POLICY "bed_types_admin_mutation" ON public.bed_types
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 12. hospital_beds
DROP POLICY IF EXISTS "hospital_beds_select" ON public.hospital_beds;
CREATE POLICY "hospital_beds_select" ON public.hospital_beds
    FOR SELECT TO anon, authenticated USING (
        (EXISTS (
            SELECT 1 FROM public.hospitals h WHERE h.id = hospital_beds.hospital_id AND h.is_active = true AND h.verification_status = 'verified'
        ))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_beds_staff_update" ON public.hospital_beds;
CREATE POLICY "hospital_beds_staff_update" ON public.hospital_beds
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_hospital_member(hospital_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_hospital_member(hospital_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_beds_admin_write" ON public.hospital_beds;
CREATE POLICY "hospital_beds_admin_write" ON public.hospital_beds
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_beds_admin_delete" ON public.hospital_beds;
CREATE POLICY "hospital_beds_admin_delete" ON public.hospital_beds
    FOR DELETE TO authenticated USING (
        (SELECT private.is_hospital_admin(hospital_id)) OR (SELECT private.is_platform_admin())
    );

-- 13. bed_reservations
DROP POLICY IF EXISTS "bed_reservations_select" ON public.bed_reservations;
CREATE POLICY "bed_reservations_select" ON public.bed_reservations
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "bed_reservations_insert_patient" ON public.bed_reservations;
CREATE POLICY "bed_reservations_insert_patient" ON public.bed_reservations
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "bed_reservations_update" ON public.bed_reservations;
CREATE POLICY "bed_reservations_update" ON public.bed_reservations
    FOR UPDATE TO authenticated USING (
        ((SELECT private.is_patient(patient_id)) AND status = 'cancelled')
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        ((SELECT private.is_patient(patient_id)) AND status = 'cancelled')
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

-- 14. bookings
DROP POLICY IF EXISTS "bookings_select" ON public.bookings;
CREATE POLICY "bookings_select" ON public.bookings
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "bookings_insert_patient" ON public.bookings;
CREATE POLICY "bookings_insert_patient" ON public.bookings
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "bookings_update" ON public.bookings;
CREATE POLICY "bookings_update" ON public.bookings
    FOR UPDATE TO authenticated USING (
        ((SELECT private.is_patient(patient_id)) AND status = 'cancelled')
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        ((SELECT private.is_patient(patient_id)) AND status = 'cancelled')
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

-- 15. medical_documents
DROP POLICY IF EXISTS "medical_documents_select" ON public.medical_documents;
CREATE POLICY "medical_documents_select" ON public.medical_documents
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(hospital_id)) AND (SELECT private.has_patient_hospital_consent(patient_id, hospital_id)))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "medical_documents_insert" ON public.medical_documents;
CREATE POLICY "medical_documents_insert" ON public.medical_documents
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "medical_documents_update" ON public.medical_documents;
CREATE POLICY "medical_documents_update" ON public.medical_documents
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "medical_documents_delete" ON public.medical_documents;
CREATE POLICY "medical_documents_delete" ON public.medical_documents
    FOR DELETE TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

-- 16. patient_hospital_consents
DROP POLICY IF EXISTS "consents_select" ON public.patient_hospital_consents;
CREATE POLICY "consents_select" ON public.patient_hospital_consents
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "consents_insert" ON public.patient_hospital_consents;
CREATE POLICY "consents_insert" ON public.patient_hospital_consents
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "consents_update" ON public.patient_hospital_consents;
CREATE POLICY "consents_update" ON public.patient_hospital_consents
    FOR UPDATE TO authenticated USING ((SELECT private.is_patient(patient_id)))
    WITH CHECK ((SELECT private.is_patient(patient_id)));

-- 17. report_analyses
DROP POLICY IF EXISTS "report_analyses_select" ON public.report_analyses;
CREATE POLICY "report_analyses_select" ON public.report_analyses
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "report_analyses_admin_mutation" ON public.report_analyses;
CREATE POLICY "report_analyses_admin_mutation" ON public.report_analyses
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 18. bills
DROP POLICY IF EXISTS "bills_select" ON public.bills;
CREATE POLICY "bills_select" ON public.bills
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(hospital_id)))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "bills_insert" ON public.bills;
CREATE POLICY "bills_insert" ON public.bills
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "bills_update" ON public.bills;
CREATE POLICY "bills_update" ON public.bills
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

-- 19. bill_line_items
DROP POLICY IF EXISTS "bill_line_items_select" ON public.bill_line_items;
CREATE POLICY "bill_line_items_select" ON public.bill_line_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.bills b
            WHERE b.id = bill_line_items.bill_id
              AND (
                  (SELECT private.is_patient(b.patient_id))
                  OR (b.hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(b.hospital_id)))
                  OR (SELECT private.is_platform_admin())
              )
        )
    );

DROP POLICY IF EXISTS "bill_line_items_mutation" ON public.bill_line_items;
CREATE POLICY "bill_line_items_mutation" ON public.bill_line_items
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 20. bill_analyses
DROP POLICY IF EXISTS "bill_analyses_select" ON public.bill_analyses;
CREATE POLICY "bill_analyses_select" ON public.bill_analyses
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "bill_analyses_mutation" ON public.bill_analyses;
CREATE POLICY "bill_analyses_mutation" ON public.bill_analyses
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 21. bill_shock_records
DROP POLICY IF EXISTS "bill_shock_records_select" ON public.bill_shock_records;
CREATE POLICY "bill_shock_records_select" ON public.bill_shock_records
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(hospital_id)))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "bill_shock_records_mutation" ON public.bill_shock_records;
CREATE POLICY "bill_shock_records_mutation" ON public.bill_shock_records
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 22. cost_predictions
DROP POLICY IF EXISTS "cost_predictions_select" ON public.cost_predictions;
CREATE POLICY "cost_predictions_select" ON public.cost_predictions
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "cost_predictions_insert" ON public.cost_predictions;
CREATE POLICY "cost_predictions_insert" ON public.cost_predictions
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

-- 23. insurance_providers
DROP POLICY IF EXISTS "insurance_providers_select" ON public.insurance_providers;
CREATE POLICY "insurance_providers_select" ON public.insurance_providers
    FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "insurance_providers_mutation" ON public.insurance_providers;
CREATE POLICY "insurance_providers_mutation" ON public.insurance_providers
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 24. insurance_policies
DROP POLICY IF EXISTS "insurance_policies_select" ON public.insurance_policies;
CREATE POLICY "insurance_policies_select" ON public.insurance_policies
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (SELECT private.is_insurance_member(provider_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "insurance_policies_insert" ON public.insurance_policies;
CREATE POLICY "insurance_policies_insert" ON public.insurance_policies
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "insurance_policies_update" ON public.insurance_policies;
CREATE POLICY "insurance_policies_update" ON public.insurance_policies
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "insurance_policies_delete" ON public.insurance_policies;
CREATE POLICY "insurance_policies_delete" ON public.insurance_policies
    FOR DELETE TO authenticated USING ((SELECT private.is_patient(patient_id)));

-- 25. government_schemes
DROP POLICY IF EXISTS "government_schemes_select" ON public.government_schemes;
CREATE POLICY "government_schemes_select" ON public.government_schemes
    FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "government_schemes_mutation" ON public.government_schemes;
CREATE POLICY "government_schemes_mutation" ON public.government_schemes
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 26. eligibility_checks
DROP POLICY IF EXISTS "eligibility_checks_select" ON public.eligibility_checks;
CREATE POLICY "eligibility_checks_select" ON public.eligibility_checks
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (insurance_provider_id IS NOT NULL AND (SELECT private.is_insurance_member(insurance_provider_id)))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "eligibility_checks_insert" ON public.eligibility_checks;
CREATE POLICY "eligibility_checks_insert" ON public.eligibility_checks
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

-- 27. transparency_scores
DROP POLICY IF EXISTS "transparency_scores_select" ON public.transparency_scores;
CREATE POLICY "transparency_scores_select" ON public.transparency_scores
    FOR SELECT TO anon, authenticated USING (
        (EXISTS (
            SELECT 1 FROM public.hospitals h WHERE h.id = transparency_scores.hospital_id AND h.is_active = true AND h.verification_status = 'verified'
        ))
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "transparency_scores_mutation" ON public.transparency_scores;
CREATE POLICY "transparency_scores_mutation" ON public.transparency_scores
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 28. hospital_metrics
DROP POLICY IF EXISTS "hospital_metrics_select" ON public.hospital_metrics;
CREATE POLICY "hospital_metrics_select" ON public.hospital_metrics
    FOR SELECT TO authenticated USING (
        (SELECT private.is_hospital_member(hospital_id)) OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "hospital_metrics_mutation" ON public.hospital_metrics;
CREATE POLICY "hospital_metrics_mutation" ON public.hospital_metrics
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 29. saved_hospitals
DROP POLICY IF EXISTS "saved_hospitals_select" ON public.saved_hospitals;
CREATE POLICY "saved_hospitals_select" ON public.saved_hospitals
    FOR SELECT TO authenticated USING ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "saved_hospitals_insert" ON public.saved_hospitals;
CREATE POLICY "saved_hospitals_insert" ON public.saved_hospitals
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "saved_hospitals_delete" ON public.saved_hospitals;
CREATE POLICY "saved_hospitals_delete" ON public.saved_hospitals
    FOR DELETE TO authenticated USING ((SELECT private.is_patient(patient_id)));

-- 30. search_history
DROP POLICY IF EXISTS "search_history_select" ON public.search_history;
CREATE POLICY "search_history_select" ON public.search_history
    FOR SELECT TO authenticated USING ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "search_history_insert" ON public.search_history;
CREATE POLICY "search_history_insert" ON public.search_history
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "search_history_delete" ON public.search_history;
CREATE POLICY "search_history_delete" ON public.search_history
    FOR DELETE TO authenticated USING ((SELECT private.is_patient(patient_id)));

-- 31. notifications
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
    FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
    FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete" ON public.notifications
    FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 32. audit_logs
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
    FOR SELECT TO authenticated USING ((SELECT private.is_platform_admin()));

-- 33. ambulance_providers
DROP POLICY IF EXISTS "ambulance_providers_select" ON public.ambulance_providers;
CREATE POLICY "ambulance_providers_select" ON public.ambulance_providers
    FOR SELECT TO anon, authenticated USING (is_active = true OR (SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "ambulance_providers_mutation" ON public.ambulance_providers;
CREATE POLICY "ambulance_providers_mutation" ON public.ambulance_providers
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 34. ambulances
DROP POLICY IF EXISTS "ambulances_select" ON public.ambulances;
CREATE POLICY "ambulances_select" ON public.ambulances
    FOR SELECT TO authenticated USING (is_active = true OR (SELECT private.is_platform_admin()));

DROP POLICY IF EXISTS "ambulances_mutation" ON public.ambulances;
CREATE POLICY "ambulances_mutation" ON public.ambulances
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 35. emergency_sessions
DROP POLICY IF EXISTS "emergency_sessions_select" ON public.emergency_sessions;
CREATE POLICY "emergency_sessions_select" ON public.emergency_sessions
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (selected_hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(selected_hospital_id)))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "emergency_sessions_insert" ON public.emergency_sessions;
CREATE POLICY "emergency_sessions_insert" ON public.emergency_sessions
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "emergency_sessions_update" ON public.emergency_sessions;
CREATE POLICY "emergency_sessions_update" ON public.emergency_sessions
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_patient(patient_id)) OR (SELECT private.is_platform_admin())
    );

-- 36. emergency_hospital_matches
DROP POLICY IF EXISTS "emergency_hospital_matches_select" ON public.emergency_hospital_matches;
CREATE POLICY "emergency_hospital_matches_select" ON public.emergency_hospital_matches
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.emergency_sessions s
            WHERE s.id = emergency_hospital_matches.emergency_session_id
              AND (SELECT private.is_patient(s.patient_id))
        )
        OR (SELECT private.is_hospital_member(hospital_id))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "emergency_hospital_matches_mutation" ON public.emergency_hospital_matches;
CREATE POLICY "emergency_hospital_matches_mutation" ON public.emergency_hospital_matches
    FOR ALL TO authenticated USING ((SELECT private.is_platform_admin()))
    WITH CHECK ((SELECT private.is_platform_admin()));

-- 37. ambulance_requests
DROP POLICY IF EXISTS "ambulance_requests_select" ON public.ambulance_requests;
CREATE POLICY "ambulance_requests_select" ON public.ambulance_requests
    FOR SELECT TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(hospital_id)))
        OR (SELECT private.is_platform_admin())
    );

DROP POLICY IF EXISTS "ambulance_requests_insert" ON public.ambulance_requests;
CREATE POLICY "ambulance_requests_insert" ON public.ambulance_requests
    FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_patient(patient_id)));

DROP POLICY IF EXISTS "ambulance_requests_update" ON public.ambulance_requests;
CREATE POLICY "ambulance_requests_update" ON public.ambulance_requests
    FOR UPDATE TO authenticated USING (
        (SELECT private.is_patient(patient_id))
        OR (hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(hospital_id)))
        OR (SELECT private.is_platform_admin())
    ) WITH CHECK (
        (SELECT private.is_patient(patient_id))
        OR (hospital_id IS NOT NULL AND (SELECT private.is_hospital_member(hospital_id)))
        OR (SELECT private.is_platform_admin())
    );
