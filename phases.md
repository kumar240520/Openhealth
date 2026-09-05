# OpenHealth — Development Phases

## Phase 0 — Repository & Architecture
- **Objective**: Establish the initial repository directory structure and core control files.
- **Dependencies**: None.
- **Tasks**: Create folder hierarchy (`frontend/`, `backend/`, `storage/`, `docs/`), generate core control docs (`prd.md`, `architecture.md`, `rules.md`, `phases.md`, `design.md`, `memory.md`), and initialize `README.md`, `.env`, and `.gitignore`.
- **Files affected**: Root markdown control files, `README.md`, `.env`, `.gitignore`, and folder structure.
- **Database changes**: None.
- **API changes**: None.
- **UI changes**: None.
- **Security considerations**: Ensure baseline security policies are defined in architectural docs.
- **Testing**: Manual verification of directory layout and file existence.
- **Definition of Done**: Folder structure and control markdown documents populated and verified.
- **Status**: Completed.

## Phase 1 — Supabase & Authentication
- **Objective**: Set up Supabase project, database schema initialization, RLS policies, and Auth flows.
- **Dependencies**: Phase 0.
- **Tasks**: Configure Supabase project, create 33 database tables across 15 migrations, implement Auth signup/login triggers and RLS rules for 6 roles (`patient`, `hospital_staff`, `hospital_admin`, `ambulance_driver`, `insurance_user`, `platform_admin`), integrate Google SMTP with pure numeric 6-digit OTP codes, and enforce organization anti-similarity checks.
- **Files affected**: `backend/src/config/supabase.js`, `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/auth/*`, `supabase/migrations/*`.
- **Database changes**: 33 tables created; 100% RLS policies enabled; helper RPC functions deployed.
- **API changes**: Live Supabase Auth + RPCs (`check_email_exists`, `check_phone_exists`, `check_org_name_conflict`, `get_email_by_identifier`, `admin_set_user_role`).
- **UI changes**: Login (Password + OTP), Sign Up (Patient, Hospital, Provider), Forgot Password, ProtectedRoute.
- **Security considerations**: RLS enabled on all tables; pure numeric OTP without exposed tokens; service key restricted to server.
- **Testing**: Automated end-to-end node test scripts for OTP delivery, phone checks, org fuzzy matching, and RBAC matrix.
- **Definition of Done**: Users can register across all 3 account types, confirm via 6-digit email OTP, and log in with automatic RBAC routing.
- **Status**: Completed.

## Phase 2 — Frontend Foundation & Core Pages
- **Objective**: Initialize React + Vite frontend with Tailwind CSS design system and build Document 3 screens.
- **Dependencies**: Phase 0, Phase 1.
- **Tasks**: Build shared Authenticated App Shell (Sidebar, Navbar, Breadcrumbs), Patient Discovery & Search pages, AI Document & Medical Bill Analyzers, Hospital Operations Consoles, and Admin Verification Views.
- **Files affected**: `frontend/src/*`, `frontend/package.json`, `frontend/tailwind.config.js`.
- **Database changes**: Real-time subscriptions and query connectors for beds, bookings, documents, bills.
- **API changes**: REST API endpoints under `/api/v1/` connecting frontend to Express backend and Supabase.
- **UI changes**: 44 core screens across Patient, Hospital, and Admin suites following Document 3 specifications.
- **Security considerations**: Sanitize inputs; protect routes via `ProtectedRoute.jsx`.
- **Testing**: Component rendering tests, responsive layout checks, and live database integration verification.
- **Definition of Done**: Core application pages from Document 3 built, styled with frosted dark mode, and connected to live database.
- **Status**: In Progress.

## Phase 3 — Hospital & Healthcare Data
- **Objective**: Seed and manage core hospital, department, doctor, and treatment package data.
- **Dependencies**: Phase 1, Phase 2.
- **Tasks**: Build hospital schemas (`hospitals`, `departments`, `doctors`, `treatments`, `hospital_treatments`, `treatment_packages`), implement CRUD controllers in Express.
- **Files affected**: `backend/src/controllers/hospitalController.js`, `backend/src/services/hospital/*`, `frontend/src/pages/patient/HospitalDetails.jsx`, `frontend/src/utils/hospitalHours.js`.
- **Database changes**: Created `hospitals`, `departments`, `doctors`, `treatments`, `hospital_treatments`, `treatment_packages` tables with foreign keys and RLS.
- **API changes**: GET `/api/v1/hospitals`, GET `/api/v1/hospitals/:id`, GET `/api/v1/doctors`.
- **UI changes**: Amazon-style sticky hospital description page, dynamic operating hours badges (`Open • Closes [Time]` vs `Closed • Opens 8:00 AM`), department faculty directories.
- **Status**: Completed.

## Phase 4 — Smart Search
- **Objective**: Implement location-aware, multi-attribute healthcare search engine.
- **Dependencies**: Phase 3.
- **Tasks**: Build query builder for filtering hospitals and doctors by specialty, cost tier, location distance, and bed availability.
- **Files affected**: `frontend/src/utils/searchMatcher.js`, `frontend/src/components/layout/AppNavbar.jsx`, `frontend/src/components/ai/AIFindCareModal.jsx`.
- **Database changes**: Geospatial queries and stem-matched keyword filtering.
- **API changes**: Omni-search with tokenization, clinical synonym expansion (`orthoped` $\leftrightarrow$ `orthopedics`).
- **UI changes**: Centered omni-search in `AppNavbar`, speech-to-text Find Care modal with explicit submit action and transcript deduplication.
- **Status**: Completed.

## Phase 5 — Hospital Discovery & Comparison
- **Objective**: Provide side-by-side comparison of hospital infrastructure, transparency scores, doctor experience, and procedure package costs.
- **Dependencies**: Phase 4.
- **Tasks**: Build hospital marketplace cards, dynamic rating badges, and package transparency matrices.
- **Files affected**: `frontend/src/pages/patient/HospitalMarketplace.jsx`, `frontend/src/components/marketplace/HospitalCard.jsx`.
- **Database changes**: Real-time hospital metrics and bed count synchronization.
- **API changes**: Multi-attribute hospital search with location radius sorting.
- **UI changes**: Rich aesthetic hospital marketplace cards with live bed availability, pricing range, dynamic open/closed badges, and 1-click booking triggers.
- **Status**: Completed.

## Phase 6 — Bed Intelligence
- **Objective**: Build live real-time bed inventory tracking system with timestamped telemetry updates.
- **Dependencies**: Phase 3.
- **Tasks**: Create `bed_types` and `hospital_beds` tables, build state calculation engine (`Available = Total - Occupied - Reserved`), automated hold expiration and notification pipeline.
- **Files affected**: `backend/src/services/beds/*`, `frontend/src/components/beds/*`.
- **Database changes**: Created `bed_types`, `hospital_beds`, and `bed_reservations` tables with RLS and inventory invariant triggers.
- **API changes**: GET/PATCH `/api/v1/beds`, POST `/api/v1/beds/hold`.
- **UI changes**: Live bed availability badges, ICU counter widgets, real-time pulse indicators, and instant reservation modal.
- **Status**: Completed.

## Phase 7 — Emergency & Ambulance Orchestration Engine
- **Objective**: Build active 1-tap emergency assistance engine (auto-geolocation, hospital matching, ambulance dispatch, and live status tracking).
- **Dependencies**: Phase 6.
- **Tasks**: Build dedicated Emergency Orchestration frontend and backend components with Leaflet map rendering.
- **Files affected**: `frontend/src/pages/patient/PatientEmergency.jsx`, `backend/src/services/emergency/*`.
- **Database changes**: Created `ambulance_providers`, `ambulances`, `ambulance_requests`, `emergency_sessions`, `emergency_hospital_matches` tables with RLS.
- **API changes**: `POST /api/v1/emergency/session`, `GET /api/v1/emergency/session/:id`, `POST /api/v1/emergency/session/:id/ambulance`.
- **UI changes**: Overhauled emergency telemetry canvas with interactive map, trauma center pulse pins, GPS vs Profile location priority toggle, and direct navigation links across dashboard and landing navbar.
- **Status**: Completed.

## Phase 8 — Booking & Reservation
- **Objective**: Enable patients to reserve beds and schedule doctor appointments with deposit hold integration and printable QR passes.
- **Dependencies**: Phase 6, Phase 3.
- **Tasks**: Implement reservation lifecycle logic (`pending`, `held`, `confirmed`, `expired`, `cancelled`, `completed`), server-side auto-cancellation, printable QR pass modal, and notifications.
- **Files affected**: `backend/src/services/bookings/*`, `frontend/src/pages/patient/PatientBookings.jsx`, `frontend/src/services/bookingService.js`.
- **Database changes**: Created `bed_reservations` and `doctor_appointments` tables with automated notification triggers into `public.notifications`.
- **API changes**: GET/POST/PATCH `/api/v1/bookings`, POST `/api/v1/bookings/cancel`.
- **UI changes**: Split-screen booking management view, accurate tab counts (`All`, `Upcoming`, `Completed`, `Cancelled`), official printable admission pass modal with scannable Patient UID QR code.
- **Status**: Completed.

## Phase 9 — Cost Intelligence
- **Objective**: Deliver unbundled procedure cost estimation and package breakdown calculator.
- **Dependencies**: Phase 3.
- **Tasks**: Build package cost aggregation service, estimate doctor fees, room tariffs, and expected incidental ranges.
- **Files affected**: `backend/src/services/costs/*`, `frontend/src/components/costs/*`, `frontend/src/pages/patient/CostPrediction.jsx`.
- **Database changes**: Create `cost_predictions` table.
- **API changes**: POST `/api/cost/predict`, GET `/api/cost/predictions`.
- **UI changes**: Interactive cost slider, unbundled cost breakdown chart, low-high range bar (e.g. ₹1.9L – ₹2.3L).
- **Security considerations**: Validate cost calculation math server-side.
- **Testing**: Pricing aggregation calculation unit tests.
- **Definition of Done**: Clear, itemized cost estimate generated for selected surgical procedures.
- **Status**: Pending.

## Phase 10 — Insurance & Government Schemes
- **Objective**: Match patient procedures against private insurance TPA policies and public schemes (e.g. PM-JAY Ayushman Bharat).
- **Dependencies**: Phase 9.
- **Tasks**: Integrate government scheme eligibility rules engine and private insurance co-pay calculator.
- **Files affected**: `backend/src/services/insurance/*`, `backend/src/services/schemes/*`, `frontend/src/pages/patient/InsuranceChecker.jsx`.
- **Database changes**: Create `insurance_providers`, `insurance_policies`, `government_schemes`, `eligibility_checks` tables.
- **API changes**: GET `/api/insurance/providers`, POST `/api/insurance/check`, POST `/api/schemes/check-eligibility`.
- **UI changes**: Scheme badge indicators, out-of-pocket co-pay estimator, document checklist widget.
- **Security considerations**: Ensure patient policy numbers are encrypted in database.
- **Testing**: Eligibility rule matcher unit tests.
- **Definition of Done**: System correctly identifies scheme coverage (e.g. ₹1.5L covered) and displays net patient liability.
- **Status**: Pending.

## Phase 11 — Document Management
- **Objective**: Secure upload, storage, and retrieval vault for patient medical records and hospital documents.
- **Dependencies**: Phase 1.
- **Tasks**: Configure Supabase Storage buckets, implement signed URL generation service and secure file uploader component with PII masking preparation.
- **Files affected**: `backend/src/services/documents/*`, `frontend/src/components/documents/*`, `storage/*`.
- **Database changes**: Create `medical_documents` metadata table linked to storage paths and `patient_id`.
- **API changes**: POST `/api/documents`, GET `/api/documents`, DELETE `/api/documents/:id`.
- **UI changes**: Drag-and-drop document uploader, document list vault, file preview modal.
- **Security considerations**: Private bucket access ONLY via short-lived signed URLs; strict MIME-type validation.
- **Testing**: File size limit enforcement and unauthorized download block tests.
- **Definition of Done**: Patients can securely upload files to private Supabase Storage buckets.
- **Status**: Pending.

## Phase 12 — Medical Report AI
- **Objective**: Python FastAPI integration for OCR and plain-English explanation of lab reports with clear AI data boundaries.
- **Dependencies**: Phase 11.
- **Tasks**: Build Python FastAPI service using OCR and LLM summarizer; execute PII masking; create Express proxy client.
- **Files affected**: `backend/src/services/reports/*`, `frontend/src/pages/patient/ReportAnalysis.jsx`.
- **Database changes**: Create `report_analyses` table storing extracted key-value metrics and explanations.
- **API changes**: POST `/api/reports/analyze`, GET `/api/reports/:id`.
- **UI changes**: Simplified lab report card, flag indicators for abnormal blood values, plain-English summary.
- **Security considerations**: Strip personally identifiable info (PII) before sending payload to AI processing queue.
- **Testing**: OCR parsing accuracy tests against sample lab PDF documents.
- **Definition of Done**: Uploaded blood test report returns structured JSON summary and visual range bars.
- **Status**: Pending.

## Phase 13 — Bill AI
- **Objective**: Automatic hospital bill line-item parsing, consumable extraction, and tariff auditing.
- **Dependencies**: Phase 12.
- **Tasks**: Build bill OCR model in Python FastAPI to parse itemized charges, room rent rates, and doctor visitation fees.
- **Files affected**: `backend/src/services/bills/*`, `frontend/src/pages/patient/BillAnalysis.jsx`.
- **Database changes**: Create `bills`, `bill_line_items`, `bill_analyses` tables.
- **API changes**: POST `/api/bills`, POST `/api/bills/:id/analyze`, GET `/api/bills/:id/line-items`.
- **UI changes**: Itemized bill audit table, highlighted inflated charges badge, downloadable audit summary.
- **Security considerations**: Ensure user bills are isolated by `patient_id`.
- **Testing**: Parsing verification against varied hospital bill layouts.
- **Definition of Done**: Uploaded bill PDF produces complete itemized charge audit.
- **Status**: Pending.

## Phase 14 — Transparency Score
- **Objective**: Calculate and publish objective 0-100 Transparency Scores for registered hospitals.
- **Dependencies**: Phase 3, Phase 6, Phase 9.
- **Tasks**: Implement transparency scoring weighted algorithm (Price 20%, Package 15%, Freshness 15%, Info 15%, Consistency 20%, Verification 15%).
- **Files affected**: `backend/src/services/transparency/*`, `frontend/src/components/hospitals/HospitalTransparency.jsx`.
- **Database changes**: Create `transparency_scores` table.
- **API changes**: GET `/api/transparency/hospitals`, GET `/api/transparency/hospitals/:id`.
- **UI changes**: Transparency score gauge (0-100), breakdown category progress bars, verified trust badge.
- **Security considerations**: Read-only public access; write access restricted to system calculation engine.
- **Testing**: Transparency score formula calculation unit tests.
- **Definition of Done**: Dynamic score calculated and displayed on hospital profile pages.
- **Status**: Pending.

## Phase 15 — Bill Shock Index
- **Objective**: Risk rating metric predicting likelihood of unexpected hospital charges.
- **Dependencies**: Phase 13, Phase 14.
- **Tasks**: Build Bill Shock Index evaluator using deterministic formulas (`variance_amount`, `variance_percent`).
- **Files affected**: `backend/src/services/bills/billShockService.js`, `frontend/src/components/bills/BillShockIndex.jsx`.
- **Database changes**: Create `bill_shock_records` table.
- **API changes**: GET `/api/bills/:id/shock-index`.
- **UI changes**: Low/Moderate/High Bill Shock Risk pill badge with tooltip explanation.
- **Security considerations**: Aggregated metric calculation without exposing individual patient bills.
- **Testing**: Risk index weighting formula tests.
- **Definition of Done**: Bill Shock Index badge rendered on treatment cost breakdown views.
- **Status**: Pending.

## Phase 16 — Hospital Portal
- **Objective**: Operational dashboard for hospital staff and administrators.
- **Dependencies**: Phase 1, Phase 6, Phase 8.
- **Tasks**: Build hospital staff management interface, bed telemetry controller, package pricing manager, casualty emergency response queue, reservation processing queue.
- **Files affected**: `frontend/src/pages/hospital/*`, `backend/src/controllers/hospitalController.js`.
- **Database changes**: None.
- **API changes**: GET/PATCH endpoints scoped to authenticated staff's `hospital_id`.
- **UI changes**: Hospital portal layout, bed inventory toggles, patient reservation approval table, casualty emergency alert queue.
- **Security considerations**: Enforce `hospital_users` role checks on every portal request.
- **Testing**: Portal authentication and tenant isolation tests.
- **Definition of Done**: Staff can manage bed counts, update prices, respond to emergency alerts, and approve bed bookings.
- **Status**: Pending.

## Phase 17 — Admin Portal
- **Objective**: Super-admin platform moderation, hospital verification, ambulance fleet onboarding, and system telemetry suite.
- **Dependencies**: Phase 1, Phase 3, Phase 14.
- **Tasks**: Build platform admin dashboard, hospital credential verification queue, ambulance provider onboarding, system audit log viewer.
- **Files affected**: `frontend/src/pages/admin/*`, `backend/src/controllers/adminController.js`.
- **Database changes**: Create `audit_logs` and `hospital_metrics` tables.
- **API changes**: GET/POST/PATCH `/api/admin/*`.
- **UI changes**: Admin control panel, verification document reviewer, global platform metrics cards.
- **Security considerations**: Multi-factor auth requirement and strict `platform_admin` role verification.
- **Testing**: Admin role privilege boundary tests.
- **Definition of Done**: Super-admins can verify newly onboarded hospitals, manage ambulance fleets, and audit platform activity.
- **Status**: Pending.

## Phase 18 — Security Hardening
- **Objective**: End-to-end security review, RLS policy audit across all 33 tables, rate limiting, and vulnerability scan.
- **Dependencies**: All prior phases.
- **Tasks**: Run security static analysis, verify CORS settings, audit Supabase RLS rules, test payload size limits.
- **Files affected**: All backend middleware, Supabase migration policies, Express security headers.
- **Database changes**: Final RLS policy check across 100% of tables.
- **API changes**: Express rate limiters applied to all endpoints.
- **UI changes**: Input sanitization wrappers applied to form controls.
- **Security considerations**: Zero data leaks between patient/hospital tenants.
- **Testing**: Penetration simulation tests, RLS bypass query attempts, rate limit trigger checks.
- **Definition of Done**: Zero high-severity vulnerabilities and 100% RLS coverage verified.
- **Status**: Pending.

## Phase 19 — Testing
- **Objective**: Execute end-to-end integration tests, unit test suite, and performance load testing.
- **Dependencies**: Phase 18.
- **Tasks**: Write frontend component tests, Express API integration tests, and database query bench testing.
- **Files affected**: `backend/tests/*`, `frontend/src/__tests__/*`.
- **Database changes**: None.
- **API changes**: None.
- **UI changes**: None.
- **Security considerations**: Verify automated tests run in isolated test environment without touching production DB.
- **Testing**: Run complete automated test suite (`npm test`).
- **Definition of Done**: All test suites pass cleanly with 0 failing assertions.
- **Status**: Pending.

## Phase 20 — Deployment
- **Objective**: Deploy production builds of frontend, API gateway, AI microservice, and database configurations.
- **Dependencies**: Phase 19.
- **Tasks**: Build Vite frontend production bundle, deploy Express API container, configure domain SSL, connect Supabase production instance.
- **Files affected**: Build configuration files, environment variables.
- **Database changes**: Apply migrations to production Supabase PostgreSQL DB.
- **API changes**: Environment API base URL pointing to production endpoints.
- **UI changes**: Production CDN deployment verification.
- **Security considerations**: Verify production environment variables and SSL enforcement.
- **Testing**: Post-deployment smoke testing on live URLs.
- **Definition of Done**: Production URLs live, responsive, and connected securely to production backend.
- **Status**: Pending.

## Phase 21 — Final Hackathon Demo
- **Objective**: Execute the core end-to-end patient story presentation ("My mother needs knee replacement" & 1-Tap Emergency Ambulance Dispatch).
- **Dependencies**: Phase 20.
- **Tasks**: Seed database with realistic demo hospitals and ambulance fleets (`AMB-104`), populate bed telemetry scenarios, verify pitch presentation flow.
- **Files affected**: Seed data scripts (`database/seed.sql`) and presentation collateral.
- **Database changes**: Insert verified hackathon demo datasets.
- **API changes**: None.
- **UI changes**: Demo showcase banner toggle.
- **Security considerations**: Ensure demo data uses simulated entity names and zero real patient PHI.
- **Testing**: Full manual walkthrough of user journeys A, B, and C.
- **Definition of Done**: End-to-end hackathon demo executed flawlessly without runtime errors.
- **Status**: Pending.
