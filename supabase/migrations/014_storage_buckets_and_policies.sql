-- ============================================================================
-- 014_storage_buckets_and_policies.sql
-- OpenHealth Database Architecture - Storage Buckets & Storage RLS Policies
-- ============================================================================

-- Create private storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('medical-documents', 'medical-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
    ('hospital-documents', 'hospital-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('bills', 'bills', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('reports', 'reports', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE 
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- Storage Policies: avatars
DROP POLICY IF EXISTS "avatars_patient_read_own" ON storage.objects;
CREATE POLICY "avatars_patient_read_own" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "avatars_patient_upload_own" ON storage.objects;
CREATE POLICY "avatars_patient_upload_own" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- Storage Policies: medical-documents
DROP POLICY IF EXISTS "medical_documents_storage_select" ON storage.objects;
CREATE POLICY "medical_documents_storage_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'medical-documents'
        AND (
            (storage.foldername(name))[1] = (SELECT auth.uid())::text
            OR EXISTS (
                SELECT 1 FROM public.patient_profiles pp
                WHERE pp.id::text = (storage.foldername(name))[1]
                  AND pp.user_id = (SELECT auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "medical_documents_storage_insert" ON storage.objects;
CREATE POLICY "medical_documents_storage_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'medical-documents'
        AND (
            (storage.foldername(name))[1] = (SELECT auth.uid())::text
            OR EXISTS (
                SELECT 1 FROM public.patient_profiles pp
                WHERE pp.id::text = (storage.foldername(name))[1]
                  AND pp.user_id = (SELECT auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "medical_documents_storage_update" ON storage.objects;
CREATE POLICY "medical_documents_storage_update" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'medical-documents'
        AND owner_id = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "medical_documents_storage_delete" ON storage.objects;
CREATE POLICY "medical_documents_storage_delete" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'medical-documents'
        AND owner_id = (SELECT auth.uid())::text
    );

-- Storage Policies: bills
DROP POLICY IF EXISTS "bills_storage_select" ON storage.objects;
CREATE POLICY "bills_storage_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'bills'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "bills_storage_insert" ON storage.objects;
CREATE POLICY "bills_storage_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'bills'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- Storage Policies: reports
DROP POLICY IF EXISTS "reports_storage_select" ON storage.objects;
CREATE POLICY "reports_storage_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'reports'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

DROP POLICY IF EXISTS "reports_storage_insert" ON storage.objects;
CREATE POLICY "reports_storage_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'reports'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- Storage Policies: hospital-documents
DROP POLICY IF EXISTS "hospital_documents_storage_select" ON storage.objects;
CREATE POLICY "hospital_documents_storage_select" ON storage.objects
    FOR SELECT TO authenticated USING (
        bucket_id = 'hospital-documents'
        AND EXISTS (
            SELECT 1 FROM public.hospital_memberships hm
            WHERE hm.hospital_id::text = (storage.foldername(name))[1]
              AND hm.user_id = (SELECT auth.uid())
              AND hm.is_active = true
        )
    );

DROP POLICY IF EXISTS "hospital_documents_storage_insert" ON storage.objects;
CREATE POLICY "hospital_documents_storage_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'hospital-documents'
        AND EXISTS (
            SELECT 1 FROM public.hospital_memberships hm
            WHERE hm.hospital_id::text = (storage.foldername(name))[1]
              AND hm.user_id = (SELECT auth.uid())
              AND hm.is_active = true
        )
    );
