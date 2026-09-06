-- ============================================================================
-- 039_update_real_gwalior_hospital_coordinates.sql
-- Authentic GPS Coordinates (Latitude & Longitude) for Gwalior Hospitals & Fleets
-- Enables high-precision GPS proximity detection, emergency discovery & routing
-- ============================================================================

-- 1. Update authentic GPS coordinates for all Gwalior healthcare facilities
UPDATE public.hospitals
SET latitude = 26.2353, longitude = 78.2187, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000001'; -- BIMR Multi Super Speciality Hospital (Surya Mandir Rd, Morar)

UPDATE public.hospitals
SET latitude = 26.1952, longitude = 78.1540, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000002'; -- Global Speciality Hospital (Kampoo Rd, Lashkar)

UPDATE public.hospitals
SET latitude = 26.1916, longitude = 78.1607, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000003'; -- Jaya Arogya Hospital (JAH) & GRMC Super Speciality (Medical College Campus, Lashkar)

UPDATE public.hospitals
SET latitude = 26.2165, longitude = 78.1727, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000004'; -- Apollo Spectra Hospitals Gwalior (Vikas Nagar)

UPDATE public.hospitals
SET latitude = 26.1836, longitude = 78.1659, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000005'; -- Cancer Hospital & Research Institute (CHRI) (Cancer Hills)

UPDATE public.hospitals
SET latitude = 26.2163, longitude = 78.1725, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000006'; -- Ratan Jyoti Netralaya (RJN Eye Hospital) (Vikas Nagar, Link Rd)

UPDATE public.hospitals
SET latitude = 26.2085, longitude = 78.1865, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000007'; -- Kalyan Memorial Multi Speciality Hospital (Patel Nagar, City Centre)

UPDATE public.hospitals
SET latitude = 26.1999, longitude = 78.1628, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000008'; -- Agrawal Hospital and Research Institute (Sanatan Dharam Mandir Rd, Lashkar)

UPDATE public.hospitals
SET latitude = 26.1925, longitude = 78.1612, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000009'; -- Kamla Raja Hospital (KRH Women & Children) (JAH Campus, Kampoo)

UPDATE public.hospitals
SET latitude = 26.2175, longitude = 78.1825, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000010'; -- Bansal Hospital Gwalior (Station Road, Padav)

UPDATE public.hospitals
SET latitude = 26.2104, longitude = 78.1764, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000011'; -- Navjeevan Multi Speciality Hospital (Jhansi Rd / Gandhi Rd)

UPDATE public.hospitals
SET latitude = 26.2083, longitude = 78.1776, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000012'; -- Sahara Multi Speciality Hospital (Mahalgaon, City Centre)

UPDATE public.hospitals
SET latitude = 26.2160, longitude = 78.1650, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000013'; -- Kusum Memorial Heart & General Hospital (Roshni Ghar Rd, Lashkar)

UPDATE public.hospitals
SET latitude = 26.2264, longitude = 78.2248, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000014'; -- District Hospital Morar (Civil Hospital) (Mall Rd / Morar Cantt)

UPDATE public.hospitals
SET latitude = 26.2168, longitude = 78.1884, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000015'; -- ASG Eye Hospital Gwalior (Opp Central Park, City Centre)

UPDATE public.hospitals
SET latitude = 26.1901, longitude = 78.1453, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000016'; -- Shankar Memorial Trauma & Orthopaedic Centre (Madhoganj, Lashkar)

UPDATE public.hospitals
SET latitude = 26.2104, longitude = 78.2038, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000017'; -- City Hospital & Research Centre (Patel Nagar / Theme Rd)

UPDATE public.hospitals
SET latitude = 26.2325, longitude = 78.1845, updated_at = now()
WHERE id = 'b1380001-0000-4000-8000-000000000018'; -- Gwalior Mansik Arogyashala (Jail Rd, Near Central Jail)

UPDATE public.hospitals
SET latitude = 26.2150, longitude = 78.1800, updated_at = now()
WHERE id = 'fb43f7d1-bab4-4b31-998f-379aa3a477e2'; -- Amrita Hospital (City Centre, Near Railway Station)

-- 2. Seed active emergency ambulances stationed in Gwalior
INSERT INTO public.ambulances (
    id, provider_id, hospital_id, vehicle_number, ambulance_type, status,
    latitude, longitude, driver_name, driver_phone, is_active
)
VALUES
    (
        'e7138001-0000-4000-8000-000000000001'::uuid,
        '64d35813-64a5-4d0b-ad16-b461a94c804d'::uuid,
        'b1380001-0000-4000-8000-000000000001'::uuid,
        'MP 07 GA 1081',
        'Advanced Cardiac Life Support (ACLS)',
        'available',
        26.2353,
        78.2187,
        'Dharmendra Sharma',
        '+91-94251-10801',
        true
    ),
    (
        'e7138001-0000-4000-8000-000000000002'::uuid,
        '64d35813-64a5-4d0b-ad16-b461a94c804d'::uuid,
        'b1380001-0000-4000-8000-000000000003'::uuid,
        'MP 07 GA 1082',
        'Level-1 Trauma ICU Ambulance',
        'available',
        26.1916,
        78.1607,
        'Rajendra Singh Tomar',
        '+91-94251-10802',
        true
    ),
    (
        'e7138001-0000-4000-8000-000000000003'::uuid,
        '64d35813-64a5-4d0b-ad16-b461a94c804d'::uuid,
        'b1380001-0000-4000-8000-000000000004'::uuid,
        'MP 07 GA 1083',
        'Critical Care Transport (ICU)',
        'available',
        26.2165,
        78.1727,
        'Mohan Lal Verma',
        '+91-94251-10803',
        true
    ),
    (
        'e7138001-0000-4000-8000-000000000004'::uuid,
        '64d35813-64a5-4d0b-ad16-b461a94c804d'::uuid,
        'b1380001-0000-4000-8000-000000000007'::uuid,
        'MP 07 GA 1084',
        'Basic Life Support (BLS)',
        'available',
        26.2085,
        78.1865,
        'Vikram Rajput',
        '+91-94251-10804',
        true
    ),
    (
        'e7138001-0000-4000-8000-000000000005'::uuid,
        '64d35813-64a5-4d0b-ad16-b461a94c804d'::uuid,
        'b1380001-0000-4000-8000-000000000014'::uuid,
        'MP 07 GA 1085',
        'Emergency Response Unit (ERU)',
        'available',
        26.2264,
        78.2248,
        'Suresh Kushwah',
        '+91-94251-10805',
        true
    )
ON CONFLICT (id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = now();
