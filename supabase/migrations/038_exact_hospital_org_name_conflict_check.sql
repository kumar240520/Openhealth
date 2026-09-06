-- Migration 038: Update check_org_name_conflict to enforce exact matching only
-- Problem: Overly aggressive trigram similarity (0.55) and substring matches blocked valid hospital names
-- Solution: Enforce exact case-insensitive, trimmed matching only (p_name exact equal to existing record).

CREATE OR REPLACE FUNCTION public.check_org_name_conflict(p_type text, p_name text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_clean_input TEXT;
    v_found_name TEXT;
    v_found_type TEXT;
BEGIN
    v_clean_input := lower(trim(COALESCE(p_name, '')));

    IF length(v_clean_input) < 2 THEN
        RETURN jsonb_build_object('exists', false, 'conflict_name', null, 'conflict_type', null);
    END IF;

    -- 1. Check in public.hospitals (Exact match only)
    IF p_type IS NULL OR p_type = 'hospital' THEN
        SELECT h.name, 'hospital'
        INTO v_found_name, v_found_type
        FROM public.hospitals h
        WHERE lower(trim(h.name)) = v_clean_input
        LIMIT 1;

        IF v_found_name IS NOT NULL THEN
            RETURN jsonb_build_object(
                'exists', true,
                'conflict_name', v_found_name,
                'conflict_type', v_found_type
            );
        END IF;
    END IF;

    -- 2. Check in public.insurance_providers (Exact match only)
    IF p_type IS NULL OR p_type = 'provider' THEN
        SELECT ip.name, 'insurance provider'
        INTO v_found_name, v_found_type
        FROM public.insurance_providers ip
        WHERE lower(trim(ip.name)) = v_clean_input
        LIMIT 1;

        IF v_found_name IS NOT NULL THEN
            RETURN jsonb_build_object(
                'exists', true,
                'conflict_name', v_found_name,
                'conflict_type', v_found_type
            );
        END IF;

        -- 3. Check in public.ambulance_providers (Exact match only)
        SELECT ap.name, 'ambulance provider'
        INTO v_found_name, v_found_type
        FROM public.ambulance_providers ap
        WHERE lower(trim(ap.name)) = v_clean_input
        LIMIT 1;

        IF v_found_name IS NOT NULL THEN
            RETURN jsonb_build_object(
                'exists', true,
                'conflict_name', v_found_name,
                'conflict_type', v_found_type
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('exists', false, 'conflict_name', null, 'conflict_type', null);
END;
$function$;
