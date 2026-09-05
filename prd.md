# OpenHealth — Product Requirements Document

## 1. Product Overview
OpenHealth is a next-generation, open-tier healthcare transparency, discovery, and intelligence platform. It bridges the critical information gap between patients, healthcare providers, and insurance/government schemes by providing real-time visibility into hospital bed availability, procedure costs, billing breakdowns, medical report analysis, and emergency care navigation.

The platform is designed around a unified healthcare decision loop:
```text
DISCOVER -> UNDERSTAND -> COMPARE -> VERIFY -> CHECK AVAILABILITY -> ESTIMATE COST -> CHECK COVERAGE -> RESERVE / DECIDE -> TREATMENT -> ANALYZE BILL -> LEARN
```

## 2. Product Vision
To empower patients and families with clear, actionable, and transparent healthcare data—eliminating bill shock, simplifying emergency hospital discovery, democratizing cost comparison, providing AI-assisted medical document intelligence, and orchestrating instant 1-tap emergency assistance with live ambulance routing across public and private health networks.

## 3. Problem Statement
Modern healthcare suffers from extreme opacity:
- Patients experience severe "bill shock" due to hidden hospital fees and unbundled procedure charges.
- Emergency bed availability (ICU, Ventilator, Oxygen, General) is unknown prior to physical arrival, leading to critical treatment delays.
- Emergency modes in conventional apps act as passive search directories rather than active triage orchestrators that dispatch ambulances.
- Medical reports and complex bills are filled with dense clinical jargon and cryptic line items that patients cannot audit.
- Accessing government health schemes and private insurance claim eligibility is confusing and fragmented.

## 4. Target Users
- **Patients & Families**: Seeking transparent pricing, emergency bed availability, clear bill breakdowns, easy booking, and automated emergency ambulance dispatch.
- **Hospital Administrators & Staff**: Managing real-time bed inventories, procedure packages, transparency scores, casualty triage, and incoming reservations.
- **Ambulance Operators & Drivers**: Receiving automated emergency dispatch requests and location telemetry.
- **Insurance Users & Claims Officers**: Verifying procedure eligibility and policy co-pay coverage.
- **Platform Administrators**: Supervising platform health, verifying hospital credentials, and ensuring data integrity and security.

## 5. User Roles
- **Patient**: Registered end-user with personal medical record vault, report AI analysis, bill auditing, booking history, scheme eligibility checks, and 1-tap emergency session triggers.
- **Hospital Staff**: Authenticated operational user managing assigned bed inventories, live status toggles, emergency triage alerts, and incoming bookings.
- **Hospital Admin**: Administrator managing hospital profile, doctors, departments, treatment packages, bed counts, and analytics.
- **Ambulance Provider / Driver**: Operational user managing vehicle dispatch status (`AMB-104`) and location updates.
- **Insurance User**: User processing insurance policies and scheme eligibility checks.
- **Platform Admin**: Super-administrator managing platform moderation, hospital verification, system configuration, and audit logs.

## 6. Core Value Proposition
- **Real-Time Bed Intelligence**: Live telemetry on ICU, NICU, PICU, HDU, Oxygen, and General bed status (`Available = Total - Occupied - Reserved`).
- **Automatic Emergency Assistance & Ambulance Dispatch**: 1-Tap trigger auto-locates patient, matches nearest verified ICU hospital, requests ambulance, dispatches driver, and tracks status.
- **Transparent Pricing & Bill Shock Index**: Unbundled procedure package estimates and historical bill auditing against benchmarks.
- **AI Medical & Bill Analysis**: Privacy-focused OCR extraction and plain-English explanation of lab reports and itemized hospital bills with PII masking.
- **Unified Insurance & Scheme Intelligence**: Automated matching against government schemes (e.g. Ayushman Bharat / PM-JAY) and private policies.

## 7. Product Modules
1. Healthcare Discovery & Search Module
2. Hospital Transparency & Rating Module
3. Bed Intelligence & Telemetry Module
4. Emergency Care & Ambulance Orchestration Module
5. Cost Intelligence & Bill Shock Analyzer Module
6. Insurance & Government Scheme Matcher Module
7. Medical Report & Document AI Vault Module
8. Appointment & Bed Reservation Module
9. Patient EHR Telemetry & Scannable QR ID Module
10. Real-Time Cross-Module Notification Center
11. Hospital Management Portal
12. Platform Administration Portal

## 8. Functional Requirements
- **Search & Discovery**: Multi-faceted search by specialty, procedure, location, doctor, and bed type with smart matching and clinical synonym expansion.
- **Facility Operating Hours Evaluation**: Dynamic clock evaluation displaying live open/closed states (`Open • Closes [Time]` vs `Closed • Opens 8:00 AM`) with 24/7 trauma emergency badges.
- **Automatic Emergency Orchestration**: Triggering 🚨 Emergency Mode auto-fetches device coordinates, ranks nearby verified ICU hospitals, creates an `emergency_session`, dispatches an ambulance, and displays live status telemetry.
- **Bed Tracking & Auto-Cancellation**: Live state calculation (`Available = Total - Occupied - Reserved`) for ICU and General beds. Automatic expiry sweeper for held beds with instant inventory restoration.
- **Printable Admission Passes with Scannable Patient UID QR**: Official downloadable and printable hospital admission pass embedding the patient's verified UID QR code, vitals, scheduled slot, and hospital credentials.
- **Patient UID EHR Retrieval Engine**: Public/provider endpoint `GET /api/v1/patient/scan/:uid` allowing empanelled hospitals and triage desks to instantly retrieve a patient's clinical telemetry and ABHA profile.
- **Real-Time Notification System**: Automated event notifications triggered upon bed holds, doctor bookings, and bill analyses with live polling and categorized navigation pills.
- **Protected Route Gating on Public Portals**: Automatic verification on landing page action triggers with intelligent redirection to `/login?redirect=[target]`.
- **Cost Estimation & Bill Auditing**: Low-High range estimates, 3-way comparative benchmark analysis (vs package, vs history, vs city average), and Gemini AI bill shock analysis.

## 9. User Journeys
- **Journey A (Automatic Emergency Assistance & Ambulance Dispatch)**:
  ```text
  USER CLICKS "EMERGENCY MODE"
          ↓
  GET CURRENT LOCATION (Device GPS)
          ↓
  AUTOMATICALLY SEARCH NEARBY HOSPITALS
          ↓
  FILTER FOR EMERGENCY CAPABILITY & ICU BEDS
          ↓
  RANK SUITABLE HOSPITALS (e.g. CityCare Hospital, 4.2km, 3 ICU beds, ETA ~12m)
          ↓
  AUTOMATICALLY REQUEST & ARRANGE AMBULANCE
          ↓
  MATCH AMBULANCE + HOSPITAL (Assigned: AMB-104, Driver assigned, ETA 8 min)
          ↓
  SHOW LIVE EMERGENCY STATUS & REAL-TIME TRACKING
          ↓
  USER CONFIRMS & TRACKS EN ROUTE TO HOSPITAL
  ```
- **Journey B (Elective Surgery)**: Patient searches "Knee Replacement" -> Compares package costs across 3 hospitals -> Reviews Transparency Scores -> Verifies insurance coverage -> Books appointment.
- **Journey C (Bill Auditing)**: Patient uploads post-discharge bill -> AI highlights unexpected consumable charges -> Generates discrepancy report for hospital billing desk.

## 10. Core Workflows
1. **Emergency Assistance Orchestration Lifecycle**:
   - `POST /api/v1/emergency/session`: Creates session -> Geolocates -> Matches top hospital (`emergency_hospital_matches`) -> Dispatches ambulance (`ambulance_requests`) -> Returns live status payload.
2. **Elective Patient Lifecycle**:
   - Search -> Compare (3-Tier Matrix) -> Estimate Cost -> Verify PM-JAY Scheme -> Reserve Bed -> Audit Final Bill.

## 11. AI Capabilities & Boundaries
- **OCR & Document Extraction**: Extraction of unstructured text from images and PDFs of medical reports and itemized bills.
- **PII Masking Pipeline**: Personal health identifiers are masked before sending content to AI engines.
- **AI Boundary Classification**: Clear separation between:
  - *Extracted Fact*: Literal values from document.
  - *Calculated Result*: Deterministic math (`variance_amount`).
  - *AI Interpretation*: Plain-English summaries.
  - *Prediction*: Machine learning cost range model.

## 12. Healthcare Discovery
Smart, location-aware search engine indexed by specialty, procedure name, doctor credentials, infrastructure ratings, and distance using Google Maps API.

## 13. Hospital Transparency
Objective 0-100 Transparency Score calculated by server weights: Price Clarity (20%), Billing Consistency (20%), Package Clarity (15%), Data Freshness (15%), Information Completeness (15%), Verification Status (15%).

## 14. Bed Intelligence
Categorized live inventory tracking for ICU, NICU, PICU, HDU, Oxygen, and General beds. Tracks state formula `Available = Total - Occupied - Reserved` with `last_updated_at` timestamps.

## 15. Emergency & Ambulance Orchestration Mode
Emergency Mode is an **active orchestration trigger**, not a passive search form.
Key Features:
- **Instant 1-Tap Geolocation**: Auto-fetches GPS coordinates.
- **Automated Multi-Hospital Ranking**: Ranks nearby hospitals by verified emergency readiness, ICU bed count, distance, and ETA.
- **Automated Ambulance Dispatch**: Initiates `ambulance_requests` for vehicle types (`basic`, `icu`, `cardiac`) with real-time ETA tracking.
- **Non-Guaranteed Status Transparency**: Never falsely claims beds/ambulances are guaranteed until confirmed. Uses explicit statuses: `Searching`, `Match Found`, `Request Sent`, `Ambulance Assigned`, `Hospital Contacted`, `Hospital Confirmed`, `En Route`, `Arrived`, `Cancelled`, `Failed`.

## 16. Cost Intelligence
Detailed procedure pricing breakdown engine showing standard doctor fees, room tariffs, nursing charges, lab test estimates, and common incidental ranges.

## 17. Insurance & Scheme Intelligence
Automated coverage verification for National/State Government Schemes (PM-JAY Ayushman Bharat) and private TPA policies, calculating net patient co-pay liability.

## 18. Medical Report Intelligence
Private AI lab report analyzer converting complex diagnostic values into visual range indicators, plain-English definitions, and recommended doctor consultation topics.

## 19. Bill Intelligence
Comprehensive hospital bill auditing engine: itemized cost categorization, price gouging alerts, and Bill Shock Index (`Low`, `Moderate`, `High`).

## 20. Booking & Reservation
End-to-end workflow for reserving beds and scheduling doctor consultations with server-side reservation expiry handling and Razorpay/UPI deposit integration.

## 21. Hospital Portal
Dashboard for hospital staff and admins: live bed count toggles, package price manager, incoming emergency casualty triage queue, and booking approval.

## 22. Admin Portal
System management suite for platform ops: hospital verification, ambulance provider onboarding, global system telemetry, and audit logs.

## 23. Security Requirements
- Strict Row-Level Security (RLS) policies in PostgreSQL/Supabase across all 33 tables.
- End-to-end encryption for stored medical records and emergency session telemetry.
- Complete isolation between hospital tenants and patient accounts.
- Zero public exposure of backend service keys or admin secret tokens.

## 24. MVP Scope
- Priority 1 Must-Work flows: Login, Automatic Emergency & Ambulance Dispatch, Smart Search, Hospital Profiles & Comparison, Live Bed Telemetry, Cost Estimation, Bill OCR & Report Analysis, Scheme Check, Transparency Score, Bookings.

## 25. Future Scope
- Priority 2 Demo Enhancements & Priority 3 Expansion: Telemedicine, e-pharmacy, claims automation, predictive risk scoring, regional language support, wearable integrations, IoT ambulance-bed sync.

## 26. Non-Goals
- OpenHealth does NOT replace emergency 108/911 call services, but orchestrates platform-integrated private/hospital fleet ambulances.
- OpenHealth does NOT falsely guarantee unconfirmed beds without backend verification.
