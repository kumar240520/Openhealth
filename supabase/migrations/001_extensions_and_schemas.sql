-- ============================================================================
-- 001_extensions_and_schemas.sql
-- OpenHealth Database Architecture - Extensions & Private Security Schema
-- ============================================================================

-- Enable required cryptographic and UUID extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create non-exposed private schema for security definer helper functions
CREATE SCHEMA IF NOT EXISTS private;

-- Restrict public access to the private schema
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
