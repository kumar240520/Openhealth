# OpenHealth — Architecture

## 1. Architecture Overview
OpenHealth is built around a central healthcare decision loop:
```text
DISCOVER -> UNDERSTAND -> COMPARE -> VERIFY -> CHECK AVAILABILITY -> ESTIMATE COST -> CHECK COVERAGE -> RESERVE / DECIDE -> TREATMENT -> ANALYZE BILL -> LEARN
```

In parallel, Emergency Mode operates as an active **Emergency Assistance & Ambulance Orchestration Engine**:
```text
USER CLICKS "EMERGENCY MODE"
        ↓
GET CURRENT LOCATION (GPS)
        ↓
AUTOMATICALLY SEARCH NEARBY HOSPITALS
        ↓
FILTER FOR EMERGENCY CAPABILITY & ICU BEDS
        ↓
RANK SUITABLE HOSPITALS
        ↓
AUTOMATICALLY REQUEST & ARRANGE AMBULANCE
        ↓
MATCH AMBULANCE + HOSPITAL
        ↓
SHOW LIVE EMERGENCY STATUS & REALTIME TRACKING
        ↓
USER CONFIRMS & TRACKS EN ROUTE
```

High-Level Component Architecture:
```text
[ REACT FRONTEND + TAILWIND CSS ]
               |
        REST API / JWT
               v
[ NODE.JS + EXPRESS API GATEWAY ]
   |           |           |           |
   v           v           v           v
[SERVICES] [AI LAYER]  [EMERGENCY] [INTEGRATIONS]
   |           |        Orchestration  Maps / Payments
   v      FastAPI/OCR   Ambulance Sync
[ SUPABASE POSTGRESQL + AUTH + STORAGE + RLS ]
```

## 2. Approved Technology Stack
- **Frontend**: React, Vite, JavaScript (JS/JSX), Tailwind CSS, React Router, Lucide React, Recharts, React Hook Form, TanStack Query.
- **Backend API**: Node.js, Express.js, JavaScript, REST APIs, JWT authentication.
- **AI Microservice**: Python 3.11+, FastAPI, Tesseract OCR / PyPDF2 / pdfplumber, LLM APIs, ML libraries.
- **Database & BaaS**: Supabase (PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security, PostGIS geospatial capabilities).
- **Integrations**: Google Maps API (distance & routing), Razorpay / UPI (booking deposits & reservation holds), Location Geolocation API.
- **Strict Rule**: TypeScript is explicitly forbidden across all modules (`.js` and `.jsx` files only).

## 3. Frontend Architecture
The React application owns:
- Page rendering, routing, client forms, and user interactions.
- Visual charts (Recharts), search interfaces, comparison matrices, and live map tracking.
- Dedicated Emergency Orchestration Screen: `frontend/src/pages/patient/Emergency.jsx`.
- Modular Emergency Components:
  `frontend/src/components/emergency/`
  - `EmergencyActionCard.jsx`
  - `EmergencyStatus.jsx`
  - `NearbyHospital.jsx`
  - `AmbulanceStatus.jsx`
  - `EmergencyMap.jsx`
- UX State Management: Loading, Empty, Processing, Error, Success, and Sensitive Processing states.

## 4. Backend Architecture
The Express API acts as the central business orchestrator structured in layered modules:
- `controllers/`: Handles HTTP request/response validation and status codes:
  - `patientController.js`: Profile, onboarding, KYC verification, and public/provider patient UID EHR scan engine (`GET /api/v1/patient/scan/:uid`).
  - `notificationController.js`: Real-time notification retrieval, single read, and bulk mark-all-read.
  - `bookingController.js`: Bed holds, doctor consultations, and cancellation lifecycles.
  - `billController.js`: Bill uploads, 3-way comparative benchmark analysis, and shock detection.
  - `aiController.js`: Multi-modal symptom, report, and bill interpretation.
- `routes/`: Endpoint routing definitions under `/api/v1/` with role guards, optional authentication (`optionalAuth`), and public exceptions (`/patient/scan/:uid`).
- `services/`: Encapsulates business logic across domain modules:
  - `search/`, `hospital/`, `beds/`, `bookings/`, `documents/`, `bills/`, `reports/`, `costs/`, `insurance/`, `schemes/`, `transparency/`
  - **`services/ai/`**: Multi-Modal Clinical Triage & Report Analysis Domain:
    - `aiRecommendationService.js`: Multi-model Google Gemini integration (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-flash-latest`) analyzing symptom text or speech transcripts, mapping dynamically across 15+ specialties without hardcoded bias, and executing relational database queries for matching doctors and hospitals with live bed counts.
  - **`services/emergency/`**: Dedicated Emergency & Ambulance Domain:
    - `emergencyService.js` (Session orchestration & state machine)
    - `hospitalMatchingService.js` (Proximity, ICU availability, capability ranking)
    - `ambulanceService.js` (Vehicle allocation, driver assignment, ETA)
    - `emergencyTrackingService.js` (Realtime telemetry & status updates)
  - **Automated Lifecycle Notifications**: Integrated into `bedService.js`, `bookingService.js`, and `billService.js` to dispatch verified records to `public.notifications`.
  - **Automated Expiry Sweeper**: `bookingService.js` batch updates expired bed reservations (`expires_at <= now` and status `'held'`) to `'cancelled'` in PostgreSQL.
- `middleware/`: Auth verification (`requireAuth`), optional authentication (`optionalAuth`), role authorization (`requireRole`), validation, rate limiting, error handling.

## 5. Storage Architecture
Supabase Storage object store organized into private and semi-private buckets:
- `medical-documents/`: Private bucket for patient lab reports & clinical files (Restricted RLS).
- `bills/`: Private bucket for uploaded itemized hospital invoices (Restricted RLS).
- `reports/`: Private bucket for generated PDF/JSON analysis summaries (Restricted RLS).
- `hospital-documents/`: Semi-private bucket for registration certificates.
- `avatars/`: Public bucket for user and doctor profile images.
- `temp/`: Processing bucket for temporary OCR uploads (auto-cleaned).

## 6. Database Architecture
PostgreSQL hosted on Supabase serves as the relational datastore comprising **33 core tables**:

### Core User & Profile Tables
1. **`profiles`**: Primary user table linked to `auth.users` (`id`, `full_name`, `email`, `phone`, `role`, `avatar_url`, `created_at`, `updated_at`).
2. **`patient_profiles`**: Patient-specific data (`id`, `user_id`, `date_of_birth`, `gender`, `city`, `emergency_contact`, `preferred_language`, `created_at`).

### Hospital & Clinical Infrastructure Tables
3. **`hospitals`**: Healthcare institutions (`id`, `name`, `type`, `description`, `address`, `city`, `state`, `latitude`, `longitude`, `phone`, `website`, `verification_status`, `transparency_score`, `created_at`, `updated_at`).
4. **`hospital_users`**: Staff-to-hospital mapping (`id`, `hospital_id`, `user_id`, `role`, `created_at`).
5. **`departments`**: Clinical departments (`id`, `hospital_id`, `name`, `description`, `emergency_available`, `created_at`).
6. **`doctors`**: Healthcare professionals (`id`, `hospital_id`, `department_id`, `name`, `specialization`, `qualification`, `experience_years`, `registration_number`, `consultation_fee`, `verification_status`, `created_at`).
7. **`treatments`**: Standard procedures/services (`id`, `name`, `category`, `department_id`, `description`, `created_at`).
8. **`hospital_treatments`**: Hospital-treatment mapping (`id`, `hospital_id`, `treatment_id`, `available`, `estimated_min_cost`, `estimated_max_cost`, `created_at`).
9. **`treatment_packages`**: Fixed/semi-fixed surgery packages (`id`, `hospital_id`, `treatment_id`, `name`, `price`, `duration_days`, `room_category`, `included_services` JSONB, `excluded_services` JSONB, `package_lock_available`, `emi_available`, `active`, `created_at`, `updated_at`).

### Bed Inventory & Reservation Tables
10. **`bed_types`**: Bed categories (`id`, `name`, `description`) — *General, ICU, NICU, PICU, HDU, Isolation*.
11. **`hospital_beds`**: Bed inventory counters (`id`, `hospital_id`, `bed_type_id`, `total_beds`, `occupied_beds`, `reserved_beds`, `available_beds`, `last_updated_at`).
12. **`bed_reservations`**: Resource holds (`id`, `patient_id`, `hospital_id`, `bed_type_id`, `status` ['pending', 'held', 'confirmed', 'expired', 'cancelled', 'completed'], `deposit_amount`, `payment_status`, `reserved_at`, `expires_at`, `confirmed_at`).
13. **`bookings`**: General appointment/surgery bookings (`id`, `patient_id`, `hospital_id`, `treatment_id`, `package_id`, `booking_type`, `status`, `amount`, `payment_status`, `created_at`).

### Emergency & Ambulance Management Tables (New Domain)
14. **`ambulance_providers`**: Ambulance fleet operating companies (`id`, `name`, `phone`, `coverage_area`, `active`, `created_at`).
15. **`ambulances`**: Individual vehicle inventory (`id`, `provider_id`, `vehicle_number`, `type` ['basic', 'icu', 'cardiac'], `driver_name`, `driver_phone`, `latitude`, `longitude`, `status` ['available', 'assigned', 'en_route', 'maintenance'], `updated_at`).
16. **`ambulance_requests`**: Ambulance dispatch records (`id`, `session_id`, `patient_id`, `ambulance_id`, `pickup_latitude`, `pickup_longitude`, `status`, `eta_minutes`, `created_at`, `updated_at`).
17. **`emergency_sessions`**: Active patient emergency sessions (`id`, `patient_id`, `latitude`, `longitude`, `status` ['searching', 'matched', 'in_progress', 'completed', 'cancelled'], `created_at`, `updated_at`).
18. **`emergency_hospital_matches`**: Proximity & capability ranked hospital matches (`id`, `session_id`, `hospital_id`, `rank`, `distance_km`, `icu_available`, `hospital_status` ['contacted', 'confirmed', 'rejected'], `confirmed_at`).

### Medical Document & AI Analytics Tables
19. **`medical_documents`**: Document metadata (`id`, `patient_id`, `document_type` ['medical_report', 'prescription', 'discharge_summary', 'medical_bill', 'other'], `file_url`, `original_filename`, `mime_type`, `masked`, `processing_status`, `uploaded_at`).
20. **`report_analyses`**: Lab report AI outputs (`id`, `document_id`, `summary`, `extracted_data` JSONB, `detected_conditions` JSONB, `detected_specialties` JSONB, `ai_explanation`, `model_version`, `created_at`).
21. **`bills`**: Uploaded invoice records (`id`, `patient_id`, `hospital_id`, `document_id`, `bill_number`, `bill_date`, `estimated_amount`, `final_amount`, `insurance_amount`, `patient_payable`, `created_at`).
22. **`bill_line_items`**: Extracted line items (`id`, `bill_id`, `category`, `description`, `quantity`, `unit_price`, `amount`, `extracted_confidence`, `anomaly_flag`).
23. **`bill_analyses`**: Bill AI summary (`id`, `bill_id`, `total_detected`, `categorized_total`, `suspicious_amount`, `anomaly_count`, `analysis_summary`, `model_version`, `created_at`).
24. **`bill_shock_records`**: Estimate vs actual bill auditing (`id`, `hospital_id`, `bill_id`, `estimated_amount`, `final_amount`, `variance_amount`, `variance_percent`, `shock_level` ['low', 'moderate', 'high'], `created_at`).

### Financial, Insurance & Transparency Tables
25. **`cost_predictions`**: Treatment cost model estimates (`id`, `patient_id`, `hospital_id`, `treatment_id`, `min_cost`, `max_cost`, `confidence`, `inputs` JSONB, `model_version`, `created_at`).
26. **`insurance_providers`**: TPA & Insurance carriers (`id`, `name`, `description`, `contact`, `active`).
27. **`insurance_policies`**: Patient policies (`id`, `patient_id`, `provider_id`, `policy_number`, `plan_name`, `status`, `start_date`, `end_date`).
28. **`government_schemes`**: Public health schemes like PM-JAY (`id`, `name`, `description`, `eligibility_rules` JSONB, `covered_treatments` JSONB, `active`).
29. **`eligibility_checks`**: Coverage evaluation logs (`id`, `patient_id`, `hospital_id`, `treatment_id`, `insurance_provider_id`, `scheme_id`, `eligible`, `coverage_amount`, `copay_amount`, `explanation`, `created_at`).
30. **`transparency_scores`**: Hospital transparency metrics (`id`, `hospital_id`, `price_clarity_score`, `package_clarity_score`, `information_score`, `data_freshness_score`, `billing_consistency_score`, `verification_score`, `overall_score`, `scoring_version`, `calculated_at`).

### Platform Metrics & Audit Tables
31. **`hospital_metrics`**: Aggregated analytics (`id`, `hospital_id`, `period_start`, `period_end`, `searches`, `profile_views`, `booking_count`, `package_views`, `bed_queries`, `created_at`).
32. **`notifications`**: User alerts (`id`, `user_id`, `type`, `title`, `message`, `read`, `created_at`).
33. **`audit_logs`**: System security logs (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata` JSONB, `ip_address`, `created_at`).

## 7. AI Architecture & Boundaries
The platform integrates a hybrid AI pipeline combining Google Gemini LLMs and Python FastAPI services:
1. **Multi-Modal Gemini Clinical Triage Pipeline (`aiRecommendationService.js`)**:
   - Google Gemini candidate model fallback cascade (`gemini-3.5-flash-lite`, `gemini-3.6-flash`, `gemini-flash-latest`).
   - Analyzes raw clinical symptom text, speech voice dictation transcripts, or extracted medical documents.
   - Dynamically evaluates conditions across 15+ specialties (Neurology, Orthopedics, Pediatrics, Laparoscopic Surgery, Gastroenterology, Dermatology, ENT, Ophthalmology, Pulmonology, Psychiatry, Obstetrics, Nephrology, etc.) with urgency risk assessment (`Emergency`, `Urgent`, `Routine`).
   - Dynamically matches specialist doctors and hospitals from Supabase PostgreSQL based on predicted specialty keywords without hardcoded fallbacks.
2. **Python FastAPI Service (`reportAnalyzer.py`, `billAnalyzer.py`, `ocrService.py`)**:
   - High-throughput document OCR parsing and PII masking.
3. **PII Masking Pipeline**: Uploaded documents are stripped of personal health identifiers before OCR/LLM processing.
4. **AI Boundary Classification**: The platform strictly distinguishes four data tiers:
   - **Extracted Fact**: Information present verbatim in document (e.g. lab value `14.2 g/dL`).
   - **Calculated Result**: Mathematically derived values (`variance_amount = final_amount - estimated_amount`).
   - **AI Interpretation**: Natural language explanation or categorization.
   - **Prediction**: Model-based cost ranges.

## 8. Authentication Architecture
- Powered by Supabase Auth with JWT bearer tokens (`Authorization: Bearer <JWT>`).
- Supports 6 Roles: `patient`, `hospital_staff`, `hospital_admin`, `ambulance_provider`, `insurance_user`, `platform_admin`.

## 9. Authorization Architecture
- Middleware validates JWT and matches requested entity against `hospital_users`, `ambulance_requests`, or `patient_id`.
- Public discovery endpoints leverage `optionalAuth` to allow frictionless exploration by guest visitors.
- RLS at database level acts as the ultimate security boundary.

## 10. Multi-Tenant Architecture
- Operational records carry `hospital_id` or `provider_id` foreign keys bound to authorized users.

## 11. Patient Data Isolation
- Patient records carry `patient_id` referencing `auth.uid()`. RLS policy: `USING (auth.uid() = patient_id)`.

## 12. Hospital Data Isolation
- Hospital staff access restricted to matching `hospital_id` in `hospital_users` and `hospital_memberships`.

## 13. Emergency & Ambulance Data Isolation
- `emergency_sessions` and `ambulance_requests` are bound strictly to `patient_id` and assigned driver IDs.

## 14. Platform & Hospital Administration
- **Platform Master Admin (`platform_admin`)**: Held by master account `hiteshkumar240520040@gmail.com`. Unrestricted access to platform telemetry, hospital onboarding verification queue (`AdminVerification.jsx`), credential audit modal (`AuditDetailModal.jsx`), and system audit logs (`audit_logs`).
- **Hospital Admin (`hospital_admin`)**: Scoped to verified facilities (e.g. `livanshukushwah@gmail.com` managing Bansal Hospital Gwalior). Authority over bed inventory toggles, doctor rosters, department management, and incoming reservations.

## 15. API Architecture
Base URL: `/api/v1`

### Endpoint Domains
- **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- **Users**: `GET /api/v1/users/me`, `PATCH /api/v1/users/me`, `GET /api/v1/users/me/profile`
- **AI Triage & Discovery (Dynamic)**:
  - `POST /api/v1/ai/recommend` (Public/Optional Auth — Multi-modal symptom, voice, and report triage with live database doctor matching)
- **Hospitals**: `GET /api/v1/hospitals`, `GET /api/v1/hospitals/:id`, `POST /api/v1/hospitals`, `PATCH /api/v1/hospitals/:id`
- **Emergency & Ambulance (Active Orchestration)**:
  - `POST /api/v1/emergency/session` (Automatic orchestration: location -> hospital match -> ambulance dispatch)
  - `GET  /api/v1/emergency/session/:id`
  - `GET  /api/v1/emergency/session/:id/hospitals`
  - `POST /api/v1/emergency/session/:id/ambulance`
  - `GET  /api/v1/emergency/session/:id/ambulance`
  - `POST /api/v1/emergency/session/:id/cancel`
  - `GET  /api/v1/emergency/session/:id/status`
- **Search**: `GET /api/v1/search`, `GET /api/v1/search/hospitals`, `POST /api/v1/search/smart-match`
- **Beds**: `GET /api/v1/beds/search`, `GET /api/v1/hospitals/:id/beds`, `PATCH /api/v1/hospitals/:id/beds`, `POST /api/v1/beds/reservations`
- **Bookings**: `GET /api/v1/bookings`, `POST /api/v1/bookings`, `GET /api/v1/bookings/:id`, `POST /api/v1/bookings/:id/cancel`
- **Packages**: `GET /api/v1/packages`, `POST /api/v1/hospitals/:id/packages`
- **Documents & Reports**: `POST /api/v1/documents`, `GET /api/v1/documents`, `POST /api/v1/reports/analyze`, `GET /api/v1/reports/:id`
- **Bills**: `POST /api/v1/bills`, `GET /api/v1/bills/:id`, `POST /api/v1/bills/analyze`, `GET /api/v1/bills/:id/shock-index`
- **Cost**: `POST /api/v1/cost/predict`, `GET /api/v1/cost/predictions`
- **Insurance & Schemes**: `GET /api/v1/insurance/providers`, `POST /api/v1/insurance/check`, `POST /api/v1/schemes/check-eligibility`
- **Transparency**: `GET /api/v1/transparency/hospitals`, `GET /api/v1/transparency/hospitals/:id`
- **Admin**: `GET /api/v1/admin/dashboard`, `GET /api/v1/admin/hospitals/pending`, `POST /api/v1/admin/hospitals/:id/verify`, `PATCH /api/v1/admin/hospitals/:id/verify`


## 16. Request Lifecycle
Client Request -> Express Middleware (Auth/Role/Sanitization) -> Controller -> Emergency / Domain Service -> Database (RLS) / Geolocation Service -> Standardized JSON Response.

## 17. Data Flow & Core Engines
- **Emergency Orchestration State Machine**:
  `Searching` -> `Match Found` -> `Request Sent` -> `Ambulance Assigned` -> `Hospital Contacted` -> `Hospital Confirmed` -> `En Route` -> `Arrived` / (`Cancelled`, `Failed`).
- **Transparency Score Engine Weights**: Price Clarity (20%), Billing Consistency (20%), Package Clarity (15%), Data Freshness (15%), Information Completeness (15%), Verification Status (15%).
- **Bill Shock Calculation Engine**: `variance_amount = final_amount - estimated_amount`, `variance_percent = (variance / estimated) * 100`.
- **Bed Availability Engine**: `Available Beds = Total Beds - Occupied Beds - Reserved Beds`.

## 18. External Integrations
- **Supabase BaaS**: PostgreSQL, Auth, Storage, Realtime.
- **Google Maps API**: Distance calculation, nearby search, emergency route & ambulance live GPS tracking.
- **Razorpay / UPI**: Booking deposits and temporary reservation hold payments.

## 19. Deployment Architecture
- Frontend: React SPA on Vercel / Netlify.
- Backend API: Node.js / Express container on Render / Cloud.
- AI Service: Python FastAPI container on Render / Modal.
- Database: Supabase Cloud PostgreSQL.

## 20. Folder Structure
Strictly divided across `frontend/`, `backend/`, `storage/`, and root `docs/`.

## 21. Database Relationships
```text
patient
   ↓
emergency_sessions
   ├── emergency_hospital_matches ----> hospitals
   └── ambulance_requests ----> ambulances ----> ambulance_providers
```

## 22. Security Architecture
- HTTPS, parameterized queries, RLS on 100% of 33 tables, service key protection.

## 23. Scalability Principles
- Stateless REST controllers, database connection pooling, asynchronous AI and telemetry tracking.
