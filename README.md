# OpenHealth

> Next-generation open-tier healthcare transparency, discovery, and intelligence platform.

OpenHealth bridges the critical information gap between patients, healthcare providers, and insurance/government schemes by providing real-time visibility into hospital bed availability, procedure costs, billing breakdowns, medical report analysis, and 1-tap emergency assistance with live ambulance dispatch.

The platform is designed around a unified healthcare decision loop:
```text
DISCOVER -> UNDERSTAND -> COMPARE -> VERIFY -> CHECK AVAILABILITY -> ESTIMATE COST -> CHECK COVERAGE -> RESERVE / DECIDE -> TREATMENT -> ANALYZE BILL -> LEARN
```

In parallel, **Emergency Mode** operates as an active **Emergency Assistance & Ambulance Dispatch Engine**:
```text
USER CLICKS "EMERGENCY MODE"
        ↓
GET CURRENT LOCATION (GPS)
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
SHOW LIVE EMERGENCY STATUS & REALTIME TRACKING
        ↓
USER CONFIRMS & TRACKS EN ROUTE TO HOSPITAL
```

---

## 🚀 Key Features

- **Automatic Emergency Assistance & Ambulance Dispatch**: 1-Tap trigger auto-locates device GPS, ranks nearby verified ICU hospitals, requests ambulance (`AMB-104`), notifies casualty desk, and tracks real-time status.
- **Real-Time Bed Intelligence & Auto-Cancellation**: Live telemetry on ICU, NICU, PICU, HDU, Oxygen, and General bed status (`Available = Total - Occupied - Reserved`). Automated batch cancellation releases expired holds back into available inventory.
- **Printable Admission Slip & Scannable QR Identity**: Official hospital admission pass with patient vitals, booking slot, and scannable Patient UID QR code from `patient_profiles` with print-isolated styles (`@media print`).
- **Patient UID EHR Retrieval Engine**: Fast provider API (`GET /api/v1/patient/scan/:uid`) retrieving complete patient clinical telemetry, vitals, ABHA, and active holds for hospital casualty desks.
- **Cross-Module Notification Center**: Automated notifications triggered upon bed holds, doctor bookings, and bill analyses with live polling, category badges (`booking`, `appointment`, `bill_analysis`), and direct routing.
- **Dynamic Facility Operating Hours**: Evaluates real-time opening hours, rendering `Open • Closes [Time]` or `Closed • Opens 8:00 AM` with 24/7 trauma emergency care notes.
- **Transparent Pricing & Bill Shock Index**: Unbundled procedure package estimates, 3-way comparative benchmark engine, and Gemini AI bill shock analysis.
- **AI Medical & Bill Analysis**: Privacy-focused OCR extraction, PII masking, and plain-English explanation of lab reports and itemized hospital bills.
- **Insurance & Scheme Intelligence**: Automated matching against government health schemes (e.g. Ayushman Bharat / PM-JAY) and private policies.
- **Bed & Appointment Reservations**: Hold-request booking workflow with Razorpay / UPI deposit payment integration.
- **Universal Protected Landing Navigation**: Gated public action triggers redirecting unauthenticated visitors to `/login?redirect=[target]` while preserving their destination.

---

## 🛠 Tech Stack

- **Frontend**: React + Vite + JavaScript (JSX) + Tailwind CSS + React Router + Lucide React + Recharts + TanStack Query
- **Backend API**: Node.js + Express.js + JavaScript (Layered Controllers, Services & Emergency Orchestrator)
- **Database & BaaS**: Supabase PostgreSQL (33 Relational Tables) + Supabase Auth + Supabase Storage + Row Level Security (RLS)
- **AI Microservice**: Python 3.11+ + FastAPI + Tesseract OCR / PyPDF2 / pdfplumber + LLM APIs
- **Integrations**: Google Maps API (Distance, Routing & Live GPS Telemetry) + Razorpay / UPI (Deposit Payment Holds) + Geolocation API

*Note: TypeScript is NOT used in this repository by architectural decision (`.js` and `.jsx` files only).*

---

## 📂 Repository Structure

```text
OpenHealth/
├── frontend/             # React + Vite client SPA
│   ├── public/           # Static assets, icons, images
│   └── src/              # Components, pages, hooks, services, context, routes, lib
│       └── components/emergency/  # EmergencyActionCard, EmergencyStatus, NearbyHospital, AmbulanceStatus, EmergencyMap
├── backend/              # Node.js + Express REST API
│   └── src/              # Config, controllers, routes, middleware, validators, services
│       └── services/emergency/    # emergencyService, hospitalMatchingService, ambulanceService, emergencyTrackingService
├── storage/              # Logical Supabase Storage buckets
│   ├── medical-documents/
│   ├── bills/
│   ├── reports/
│   ├── hospital-documents/
│   ├── avatars/
│   └── temp/
├── docs/                 # Extended documentation
├── .env                  # Environment configuration variables
├── README.md             # Project overview & quickstart guide
│
# Source of Truth Project Control Documents:
├── prd.md                # Product Requirements Document
├── architecture.md       # Technical Architecture, DB Schemas (33 Tables), Emergency Services & APIs
├── rules.md              # Engineering, Emergency Safety Invariants & Security Rules
├── phases.md             # Implementation Roadmap (Phases 0 - 21)
├── design.md             # Visual Design System & Live Emergency UI Specification
└── memory.md             # Development Memory & Living Project State
```

---

## 📋 Documentation & Single Source of Truth

The repository relies on six interconnected Markdown control files:

1. [`prd.md`](file:///d:/JAVA%20WEBDEV/Open%20health/prd.md) — Defines **WHAT** OpenHealth builds (functional specs, 6 user roles, automatic emergency assistance journey).
2. [`architecture.md`](file:///d:/JAVA%20WEBDEV/Open%20health/architecture.md) — Defines **HOW** the platform is engineered (stacks, 33 DB schemas, 16 API route domains, emergency orchestration architecture).
3. [`rules.md`](file:///d:/JAVA%20WEBDEV/Open%20health/rules.md) — Defines **CONSTRAINTS** (coding standards, no false guarantee rule, emergency state machine, PII masking).
4. [`phases.md`](file:///d:/JAVA%20WEBDEV/Open%20health/phases.md) — Defines **WHEN** features are built (Phases 0 through 21).
5. [`design.md`](file:///d:/JAVA%20WEBDEV/Open%20health/design.md) — Defines **HOW IT LOOKS** (colors, typography, live ambulance tracking UI, 6 screen UX states, comparison matrix).
6. [`memory.md`](file:///d:/JAVA%20WEBDEV/Open%20health/memory.md) — Defines **CURRENT STATE** (living log of decisions, emergency orchestration status, active risks).

---

## ⚙️ Environment Configuration

Copy `.env` variables and update with your Supabase credentials:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Microservice URL
FASTAPI_AI_URL=http://localhost:8000
```

---

## 📜 License

Private / OpenHealth Hackathon Repository.
