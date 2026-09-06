-- ============================================================================
-- 002_enums.sql
-- OpenHealth Database Architecture - Standard Application ENUM Types
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM (
        'patient',
        'hospital_staff',
        'hospital_admin',
        'insurance_user',
        'platform_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.hospital_verification_status AS ENUM (
        'pending',
        'verified',
        'rejected',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.bed_status AS ENUM (
        'available',
        'limited',
        'full',
        'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM (
        'pending',
        'confirmed',
        'cancelled',
        'completed',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.reservation_status AS ENUM (
        'pending',
        'held',
        'confirmed',
        'expired',
        'cancelled',
        'completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM (
        'pending',
        'paid',
        'failed',
        'refunded',
        'not_required'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.document_type AS ENUM (
        'medical_report',
        'prescription',
        'discharge_summary',
        'medical_bill',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.processing_status AS ENUM (
        'uploaded',
        'processing',
        'processed',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shock_level AS ENUM (
        'low',
        'moderate',
        'high'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.membership_role AS ENUM (
        'hospital_staff',
        'hospital_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.access_level AS ENUM (
        'view',
        'analysis'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.consent_status AS ENUM (
        'active',
        'revoked',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.emergency_session_status AS ENUM (
        'searching',
        'match_found',
        'request_sent',
        'ambulance_assigned',
        'hospital_contacted',
        'hospital_confirmed',
        'en_route',
        'arrived',
        'cancelled',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.emergency_match_status AS ENUM (
        'candidate',
        'ranked',
        'selected',
        'rejected',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ambulance_status AS ENUM (
        'available',
        'assigned',
        'en_route',
        'at_scene',
        'transporting',
        'unavailable',
        'offline'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ambulance_request_status AS ENUM (
        'searching',
        'request_sent',
        'assigned',
        'accepted',
        'en_route',
        'at_scene',
        'transporting',
        'completed',
        'cancelled',
        'failed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
