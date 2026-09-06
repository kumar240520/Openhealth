-- ============================================================================
-- 012_indexes_and_constraints.sql
-- OpenHealth Database Architecture - Indexes & Relational Performance Optimization
-- ============================================================================

-- Core Identity & Membership Indexes
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user ON public.patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_memberships_user ON public.hospital_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_hospital_memberships_hospital ON public.hospital_memberships(hospital_id);
CREATE INDEX IF NOT EXISTS idx_insurance_memberships_user ON public.insurance_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_memberships_provider ON public.insurance_memberships(provider_id);

-- Hospital Domain Indexes
CREATE INDEX IF NOT EXISTS idx_departments_hospital ON public.departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON public.doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON public.doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_hospital_treatments_hospital ON public.hospital_treatments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_treatments_treatment ON public.hospital_treatments(treatment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_packages_hospital ON public.treatment_packages(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_beds_hospital ON public.hospital_beds(hospital_id);

-- Bookings & Bed Reservations Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_patient ON public.bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hospital ON public.bookings(hospital_id);
CREATE INDEX IF NOT EXISTS idx_bed_reservations_patient ON public.bed_reservations(patient_id);
CREATE INDEX IF NOT EXISTS idx_bed_reservations_hospital ON public.bed_reservations(hospital_id);

-- Medical Documents & Billing Indexes
CREATE INDEX IF NOT EXISTS idx_documents_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_report_analyses_document ON public.report_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_report_analyses_patient ON public.report_analyses(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_patient ON public.patient_hospital_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_hospital ON public.patient_hospital_consents(hospital_id);
CREATE INDEX IF NOT EXISTS idx_bills_patient ON public.bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_hospital ON public.bills(hospital_id);
CREATE INDEX IF NOT EXISTS idx_bill_line_items_bill ON public.bill_line_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_analyses_bill ON public.bill_analyses(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_shock_patient ON public.bill_shock_records(patient_id);

-- Financial & Discovery Indexes
CREATE INDEX IF NOT EXISTS idx_cost_predictions_patient ON public.cost_predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_patient ON public.insurance_policies(patient_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_checks_patient ON public.eligibility_checks(patient_id);
CREATE INDEX IF NOT EXISTS idx_transparency_scores_hospital ON public.transparency_scores(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_metrics_hospital ON public.hospital_metrics(hospital_id);
CREATE INDEX IF NOT EXISTS idx_saved_hospitals_patient ON public.saved_hospitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_search_history_patient ON public.search_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- Emergency Mode Indexes
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_patient ON public.emergency_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_status ON public.emergency_sessions(status);
CREATE INDEX IF NOT EXISTS idx_emergency_sessions_selected_hospital ON public.emergency_sessions(selected_hospital_id);
CREATE INDEX IF NOT EXISTS idx_emergency_hospital_matches_session ON public.emergency_hospital_matches(emergency_session_id);
CREATE INDEX IF NOT EXISTS idx_emergency_hospital_matches_hospital ON public.emergency_hospital_matches(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_session ON public.ambulance_requests(emergency_session_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_patient ON public.ambulance_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_hospital ON public.ambulance_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_requests_status ON public.ambulance_requests(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_provider ON public.ambulances(provider_id);
CREATE INDEX IF NOT EXISTS idx_ambulances_status ON public.ambulances(status);
