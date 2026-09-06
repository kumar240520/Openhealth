-- ============================================================================
-- 030_transparency_score_invariants.sql
-- Ensure unique constraint on transparency_scores(hospital_id) and column on hospitals
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_transparency_scores_hospital_id'
    ) THEN
        ALTER TABLE public.transparency_scores ADD CONSTRAINT uq_transparency_scores_hospital_id UNIQUE (hospital_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'hospitals' AND column_name = 'transparency_score'
    ) THEN
        ALTER TABLE public.hospitals ADD COLUMN transparency_score NUMERIC DEFAULT 88;
    END IF;
END $$;
