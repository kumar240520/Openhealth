# OpenHealth — Complete Frontend UI & Mobile App Specification
**Single Source of Truth for Frontend UI Generation, Interactive Components, & Backend Wiring**

---

## 1. Executive Project Overview

### 1.1 What is OpenHealth?
**OpenHealth** is an AI-powered healthcare transparency, emergency orchestration, and hospital discovery platform. It solves healthcare information asymmetry in India by providing:
1. **Live Bed Telemetry**: Real-time ICU, NICU, PICU, HDU, and general bed availability with instant bed reservation/holds.
2. **Transparent Price Discovery & 3-Way Bill Auditing**: Published hospital surgery packages compared directly against itemized patient bills and city benchmark medians to eliminate bill shock.
3. **Emergency Dispatch & Ambulance Tracking**: 1-tap SOS GPS emergency orchestration routing to the nearest hospital with available ICU beds, live vehicle telemetry, and 2-way dispatch sync.
4. **Clinical Specialist Finder**: Doctor discovery with live OPD slots, teleconsultations, and verified registration credentials.
5. **Universal Digital Health Pass & QR Admission**: Scannable QR identity passes linked to ABHA / Aadhaar with 1-click paperless hospital check-in.
6. **Hospital Operations Portal**: Full-featured administrative suite for bed telemetry management, patient admissions, doctor scheduling, and transparency score audits.

### 1.2 Tech Stack Architecture
- **Web App**: React 18 (Vite), TailwindCSS, Framer Motion, Lucide React, Recharts.
- **Backend & Database**: Supabase (PostgreSQL 15), Row Level Security (RLS), Realtime CDC channels, Edge Functions, RPC Stored Procedures.
- **Storage Buckets**: `medical-documents`, `bills`, `hospital-avatars`, `doctor-photos`, `kyc-documents`.
- **Target App Environments**: React Native / Flutter / Kotlin / Swift / PWA mobile client connecting to the exact same Supabase database and authentication instance.

---

## 2. Design System & Global Visual Tokens

### 2.1 Color Palette
| Token Name | Hex Code | HSL Value | Purpose & Usage |
|---|---|---|---|
| **Primary Health Teal** | `#096979` | `hsl(187, 85%, 28%)` | Primary brand identity, primary buttons, active tabs, focus rings |
| **Primary Hover / Light** | `#1192a6` | `hsl(187, 75%, 38%)` | Hover states, interactive highlights |
| **Primary Muted / Tint** | `#e6f6f8` | `hsl(187, 60%, 94%)` | Badge backgrounds, light card accents |
| **Secondary Slate Navy** | `#1d2a3a` | `hsl(215, 32%, 17%)` | Headers, dark banners, hero accents |
| **Accent Emerald Success** | `#24b47e` | `hsl(158, 64%, 42%)` | Available beds, verified badges, confirmed status, high score (80-100) |
| **Warning Amber Caution** | `#f59e0b` | `hsl(38, 92%, 50%)` | Limited beds, pending reviews, moderate risk, KYC warning |
| **Emergency Crimson Alert** | `#dc2626` | `hsl(350, 84%, 48%)` | Emergency SOS buttons, 0 beds left, critical alerts, cancel actions |
| **Emergency Crimson Dark** | `#b91c1c` | `hsl(350, 72%, 42%)` | Pressed state for SOS triggers |
| **Background Light (Canvas)** | `#f8fafc` | `Slate 50` | Primary app screen background |
| **Surface Card (Elevated)** | `#ffffff` | `White` | Cards, modals, bottom sheets, input fields |
| **Surface Dark (Portal/Card)** | `#0f172a` | `Slate 900` | Dark mode components, tooltips, footer containers |
| **Border Neutral** | `#e2e8f0` | `Slate 200` | Dividers, card borders, inactive inputs |
| **Text Primary** | `#0f172a` | `Slate 900` | High-contrast body, titles, headings |
| **Text Muted / Caption** | `#64748b` | `Slate 500` | Metadata, helper labels, timestamps, distances |

### 2.2 Typography Scale
- **Primary Body Font**: `Inter`, sans-serif (Buttons, inputs, tables, labels).
- **Display & Headings Font**: `Outfit` or `Plus Jakarta Sans`, sans-serif (Hero titles, screen headers, KPI numbers).
- **Scale**:
  - `Display XL`: `36px` / `44px` (Weight: 800) — Emergency header, hero banner
  - `Heading 1`: `28px` / `36px` (Weight: 700) — Screen titles
  - `Heading 2`: `22px` / `28px` (Weight: 700) — Section headers, card titles
  - `Heading 3`: `18px` / `24px` (Weight: 600) — Subsection headers, modal titles
  - `Body Regular`: `15px` / `22px` (Weight: 400) — General descriptions, paragraphs
  - `Body Bold`: `15px` / `22px` (Weight: 600) — Card text, doctor names
  - `Caption / Small`: `12px` / `16px` (Weight: 500) — Badges, distance tags, timestamps
  - `Micro / Badge`: `10px` / `14px` (Weight: 700, Uppercase) — Status pills

### 2.3 Spacing, Radii & Shadows
- **Corner Radii**:
  - `radius-sm`: `6px` — Chips, compact inputs
  - `radius-md`: `10px` — Buttons, dropdown rows, notification cards
  - `radius-lg`: `16px` — Hospital & doctor cards, bottom sheets
  - `radius-xl`: `24px` — Dashboard containers, modals
  - `radius-full`: `9999px` — Badges, avatar circles, SOS pill
- **Elevation Shadows**:
  - `shadow-sm`: `0 1px 3px rgba(0,0,0,0.06)`
  - `shadow-md`: `0 4px 14px rgba(0,0,0,0.08)`
  - `shadow-emergency`: `0 0 24px rgba(220, 38, 38, 0.45)` (Pulsing SOS ring)

---

## 3. Global App Navigation Architecture

### 3.1 Mobile App Navigation Blueprint
On mobile, the web topbar + left sidebar transitions into a **Standard Native App Shell**:
1. **Top App Bar**:
   - Left: Profile Avatar (tap opens Profile / Drawer)
   - Center: OpenHealth Logo / Screen Title
   - Right: Active City Pill (`Indore, MP` with tap to change) + Notification Bell (with unread badge counter)
2. **Bottom Navigation Bar (5 Primary Tabs)**:
   - **Tab 1: Home** (`/dashboard/patient`) — Icon: `LayoutDashboard`
   - **Tab 2: Hospitals** (`/app/hospitals`) — Icon: `Building2`
   - **Tab 3: Emergency SOS (Center Floating Button)** (`/app/emergency`) — Icon: `Siren` (Large elevated red circular button with pulsing ring)
   - **Tab 4: Bookings** (`/app/bookings`) — Icon: `Calendar`
   - **Tab 5: Records & Bills** (`/app/reports` & `/app/bills`) — Icon: `FileText`
3. **App Drawer / Secondary Menu**:
   - AI Health Analyzer (`/app/ai-analyzer`)
   - Find Doctors (`/app/doctors`)
   - Ayushman & Schemes Directory (`/app/schemes`)
   - Saved Hospitals & Doctors (`/app/saved`)
   - Digital Health Pass & KYC (`/app/profile`)
   - App Settings (`/app/settings`)
   - Hospital Staff Portal Switcher (`/hospital/dashboard`)

---

## 4. Complete Screen-by-Screen Frontend Specification

---

### SCREEN 1: Public Landing Page & Healthcare Discovery
- **Route**: `/`
- **File Reference**: `LandingPage.jsx`, `HeroSection.jsx`, `DiscoverySection.jsx`, `AdmissionSection.jsx`, `EmergencySection.jsx`
- **Purpose**: Welcomes users, showcases value proposition, provides global care search and instant role login.

#### UI Structure & Layout
1. **Hero Section**:
   - Headline: *"AI-Powered Healthcare Discovery & Price Transparency"*
   - Dynamic rotating keywords: `Accurate Pricing`, `Live ICU Beds`, `Verified Doctors`, `Zero Bill Shock`.
   - Subtitle: *"Discover hospitals, verify real-time ICU beds, compare surgery costs, and orchestrate emergency care across Indore and India."*
2. **Quick Discovery Action Bar**:
   - Search input for Hospital / Doctor / Treatment.
   - City dropdown selector (Default: `Indore`).
   - "Find Care Now" CTA button.
3. **Live Platform Metric Badges**:
   - `40+` Empanelled Hospitals in Indore
   - `180+` Verified ICU Beds Monitored Live
   - `₹4.2L+` Inpatient Overcharges Detected
   - `< 12 min` Emergency Ambulance Dispatch
4. **Interactive Feature Chapters**:
   - Chapter 1: Live Bed Telemetry Demonstration
   - Chapter 2: Transparent Surgery Packages & Bill Shock Auditor
   - Chapter 3: 1-Tap Emergency Orchestration
   - Chapter 4: Instant QR Hospital Admission

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Sign In"** | Ghost button, teal text | Header Top-Right | Navigates to `/login` | Client route |
| **"Create Account"** | Primary Teal solid (`#096979`) | Header Top-Right | Navigates to `/signup` | Client route |
| **"Find Care Now"** | Primary Teal solid, large | Hero Center Search | Extracts search tokens, navigates to `/app/hospitals?q=...` | Pre-filters `/app/hospitals` |
| **"Emergency SOS"** | Crimson Red (`#dc2626`) with pulsing glow | Hero Secondary / Floating | Navigates immediately to `/app/emergency` | Client route |
| **"Explore Bed Telemetry"** | Secondary Outline with Arrow | Chapter 1 Card | Navigates to `/app/hospitals?filter=icu` | Client route |
| **"Audit Medical Bill"** | Purple Accent Solid with Sparkles | Chapter 2 Card | Navigates to `/app/bills` | Client route |

---

### SCREEN 2: User Sign Up & OTP Verification
- **Route**: `/signup`
- **File Reference**: `SignUp.jsx`
- **Purpose**: Creates patient, hospital admin, or provider accounts with SMS/Email OTP verification.

#### UI Structure & Layout
1. **Role Selector Segmented Bar**:
   - 3 Options: `[Patient]` (Default), `[Hospital]`, `[Provider]`
2. **Step 1: Registration Form**:
   - Patient mode: Full Name, Email, Phone Number, Password.
   - Hospital mode: Admin Name, Official Hospital Name, Email, Phone, Password.
   - Provider mode: Name, Organization Type (Ambulance / Insurance), Email, Phone, Password.
3. **Step 2: 6-Digit OTP Verification Screen**:
   - 6 individual numeric input boxes with auto-focus advancing.
   - 60-second resend countdown timer.
4. **Step 3: Provisioning Success State**:
   - Animated checkmark, provisioning message, automatic redirect to role dashboard or onboarding wizard.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **Role Selector Tabs** | Segmented pill button (`bg-slate-100`, active `bg-teal-600 text-white`) | Top of form | Updates `accountType` state | Sets initial signup role |
| **"Password Visibility Toggle"** | Eye / EyeOff icon | Inside password input | Toggles `type="text"` vs `type="password"` | UI state |
| **"Create Account" (Step 1)** | Primary Teal solid (`w-full py-3.5`) | Bottom of Step 1 form | Validates fields, checks conflicts, triggers OTP dispatch | `supabase.auth.signUp()`, `authService.sendOtp()` |
| **"Verify & Continue" (Step 2)** | Primary Teal solid (`w-full py-3.5`) | Bottom of OTP form | Verifies 6-digit code, activates session | `supabase.auth.verifyOtp()`, creates row in `profiles` & `patient_profiles` |
| **"Resend Code"** | Ghost text button (disabled until timer = 0) | Below OTP boxes | Triggers new SMS OTP to phone | `authService.sendOtp(phone)` |
| **"Change Phone / Back"** | Left Arrow + text | Top-Left of OTP card | Reverts to Step 1 form | UI state |
| **"Already have an account? Log in"**| Text link | Card footer | Navigates to `/login` | Client route |

---

### SCREEN 3: User Login
- **Route**: `/login`
- **File Reference**: `Login.jsx`
- **Purpose**: Multi-role login supporting Email/Password, Phone OTP, and role-based redirect.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Login Method Toggle"** | Tabs (`Email & Password` / `Phone OTP`) | Top of card | Switches login input form | UI state |
| **"Sign In"** | Primary Teal solid (`w-full py-3.5`) | Form bottom | Authenticates credentials, reads role from `profiles.role` | `supabase.auth.signInWithPassword()`, redirects to `/dashboard/{role}` |
| **"Send OTP"** | Primary Teal solid | Form bottom (Phone tab) | Sends 6-digit OTP code | `supabase.auth.signInWithOtp()` |
| **"Forgot Password?"** | Small text link | Above password field | Navigates to `/forgot-password` | Client route |
| **"Sign Up Link"** | Text link | Card footer | Navigates to `/signup` | Client route |

---

### SCREEN 4: Patient Onboarding Wizard (5-Step Digital Pass KYC)
- **Route**: `/patient/onboarding`
- **File Reference**: `PatientOnboardingWizard.jsx`
- **Purpose**: First-time patient profile completion, Indian address selection, Aadhaar/Govt ID KYC, and ABHA Health Pass setup.

#### Steps Breakdown
1. **Step 1: Personal Profile** — Full Name, Date of Birth, Gender (Male, Female, Other), Blood Group (A+, A-, B+, B-, O+, O-, AB+, AB-), Emergency Contact Name & Phone.
2. **Step 2: Address & Location** — State dropdown (Cascading: MP, Maharashtra, Delhi, etc.), City dropdown, Postal PIN code, Street Address.
3. **Step 3: KYC Verification** — Document Type (Aadhaar, Passport, Voter ID, Driving License), ID Number input, File Upload dropzone (front/back photo).
4. **Step 4: Health Insurance & ABHA** — 14-digit ABHA ID number, Insurance Provider name, Policy/TPA card number, Document upload.
5. **Step 5: Review & Digital Health Card Generation** — Summary review, terms checkbox, instant digital health pass generation.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Next Step"** | Primary Teal solid | Bottom-Right | Validates current step inputs and advances step counter | Local validation |
| **"Previous Step"** | Slate Outline / Ghost | Bottom-Left | Returns to previous step | UI state |
| **"Upload ID Proof"** | Dashed dropzone with Camera/Upload icon | Step 3 center | Opens file picker / camera capture | Uploads to Supabase Storage bucket `kyc-documents` |
| **"Fetch Location via GPS"** | Blue Pill with MapPin icon | Step 2 address header | Triggers browser/device GPS reverse geocoding | `geolocationService.getCurrentLocation()` |
| **"Complete Onboarding & Generate Pass"**| Emerald Success solid (`#24b47e`) | Step 5 bottom | Inserts/updates `patient_profiles`, sets `kyc_status = 'pending_verification'`, sets `onboarding_completed = true` | Supabase `patient_profiles` update, navigates to `/dashboard/patient` |

---

### SCREEN 5: Patient Master Dashboard
- **Route**: `/dashboard/patient`
- **File Reference**: `PatientDashboard.jsx`
- **Purpose**: Central command screen for patients displaying active bookings, telemetry graph, quick emergency access, and KYC alerts.

#### UI Structure & Layout
1. **Header**:
   - Greeting: *"Welcome back, {Name} 👋"*
   - Real-time sync loader indicator.
   - City selector dropdown (`Indore, MP`).
2. **KYC Action Banner (Conditional)**:
   - Amber alert card shown if KYC is unverified: *"Complete the KYC Documents to activate your official Digital Health Pass"*.
   - CTA button: `[Complete KYC →]`.
3. **Top 4 Summary Metric Cards**:
   - **Saved Hospitals**: Count + `[View all →]` link (`/app/saved`).
   - **Upcoming Bookings**: Count + `[View all →]` link (`/app/bookings`).
   - **Reports Analyzed**: Count + `[View all →]` link (`/app/reports`).
   - **Bills Analyzed**: Count + `[View all →]` link (`/app/bills`).
4. **Middle Telemetry Section (2-Column Grid)**:
   - **Left (8 cols)**: **Smart Care Overview Interactive Chart** (Area Chart showing activity across days with time filter: `This Week`, `This Month`, `Past 3 Months`).
   - **Right (4 cols)**:
     - **Emergency Access Card**: Bold red gradient card with 3D ambulance graphic and instant `[Go to Emergency →]` button.
     - **Daily Health Tip Card**: Gradient card with glowing shield icon.
5. **Horizontal KPI Row**:
   - 4 Cards: `Searches` (with % trend), `Comparisons` (with % trend), `Reservations` (with % trend), `Bill Savings Est.` (₹ amount saved with trend).
6. **Upcoming Consultations & Bookings List**:
   - Cards showing Doctor / Bed hold, Hospital name, Scheduled Date & Time slot, Status badge (`Confirmed`, `Held`), Consultation fee, and direct tap to open details.
7. **Recent Searches**:
   - Chips/cards of recent queries (`Cardiology`, `ICU Indore`) with timestamp and 1-tap re-search.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Complete KYC"** | Amber solid (`bg-amber-500 text-white`) | KYC banner right | Navigates to `/app/profile` | Client route |
| **"View all Saved"** | Blue text link with arrow | Metric Card 1 | Navigates to `/app/saved` | Client route |
| **"View all Bookings"** | Emerald text link with arrow | Metric Card 2 | Navigates to `/app/bookings` | Client route |
| **"View all Reports"** | Purple text link with arrow | Metric Card 3 | Navigates to `/app/reports` | Client route |
| **"View all Bills"** | Amber text link with arrow | Metric Card 4 | Navigates to `/app/bills` | Client route |
| **"Time Filter Dropdown"** | Slate-50 pill with ChevronDown | Chart header top-right | Opens menu: `This Week`, `This Month`, `Past 3 Months` | Re-runs `supabase.rpc('get_patient_dashboard_data')` with new period |
| **"Go to Emergency"** | Emergency Crimson solid (`#dc2626`) | Emergency Card center | Navigates to `/app/emergency` | Client route |
| **"Booking Card Tap"** | Elevated slate card (hover lift) | Upcoming bookings list | Selects booking and navigates to `/app/bookings` | Passes `bookingId` |
| **"Find & Book Doctor"** | Primary Teal solid | Empty state for bookings | Navigates to `/app/doctors` | Client route |
| **"Recent Search Card"** | Slate pill card | Recent searches list | Re-executes search for that query string | Navigates to `/app/search?q={query}` |

---

### SCREEN 6: Hospital Discovery & Marketplace
- **Route**: `/app/hospitals` or `/app/search`
- **File Reference**: `HospitalMarketplace.jsx`, `HospitalCard.jsx`, `CheckBedsModal.jsx`, `FilterDrawer.jsx`
- **Purpose**: Search, filter, compare, and check live bed telemetry across empanelled hospitals.

#### UI Structure & Layout
1. **Omni-Search Bar**:
   - Keyword search: Hospital name, treatment, specialty (e.g. `Angioplasty`, `Apollo`).
   - Location Pin: City selector dropdown + `[Near Me / GPS]` button.
   - Distance Radius filter (`5 km`, `10 km`, `25 km`, `50 km`, `All`).
2. **Filter & Sort Control Row**:
   - Specialty chips carousel (`All`, `Cardiology`, `Orthopedics`, `Neurology`, `Oncology`, `Pediatrics`).
   - Facility Type selector (`All`, `Multi-Specialty`, `Super-Specialty`, `Govt Empanelled`).
   - Scheme selector (`Ayushman Bharat / PMJAY`, `CGHS`, `Private TPA`).
   - Sort dropdown (`Recommended`, `Distance: Nearest First`, `Transparency Score: High to Low`, `Available ICU Beds: Most First`, `Rating`).
   - View mode switcher: `[Grid View]` vs `[List View]`.
   - `[Filters]` button with active filter counter badge.
3. **Filter Drawer / Bottom Sheet**:
   - Minimum Transparency Score Slider (0 to 100).
   - Minimum Star Rating Slider (1 to 5).
   - Toggles: `ICU Beds Available Only`, `24/7 Emergency Trauma Center Only`, `Cashless Insurance Only`.
   - Scheme checkboxes: `Ayushman Bharat`, `MP State Scheme`, `HDFC Ergo`, `Star Health`, `Care Health`.
   - Reset Filters button & Apply Filters button.
4. **Hospital Cards Grid**:
   - Cover photo + Verified accreditation badge (`NABH`, `JCI`).
   - Hospital Name + Full Address + Geolocation distance (`3.4 km away`).
   - **Live Telemetry Pill**: Available ICU Beds / Total (`🟢 4 ICU Beds Available`).
   - **Transparency Score Ring**: Circular progress indicator (e.g. `94/100`).
   - Star Rating + Total reviews count.
   - Key schemes supported chips (`PMJAY`, `Cashless`).
   - Action buttons: `[Check Live Beds]` and `[View Details & Tariff]`.
5. **Check Live Beds Modal**:
   - Real-time telemetry breakdown by bed category:
     - `ICU (Intensive Care Unit)`: Total, Occupied, Available, Price/Day
     - `NICU (Neonatal ICU)`
     - `PICU (Pediatric ICU)`
     - `HDU (High Dependency Unit)`
     - `General Ward`
     - `Single Private Room`
   - Progress bars showing occupancy %.
   - **Instant Bed Hold CTA**: `[Reserve / Hold Bed (2-Hour Window)]`.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Near Me / Live GPS"** | Blue outline button with Compass icon | Inside search bar | Solicits GPS coordinates, calculates Haversine distances to all hospitals | `geolocationService.getCurrentLocation()`, re-orders list by `distance_km` |
| **"Save / Bookmark"** | Heart icon button (solid red when saved) | Top-right of each hospital card | Toggles saved state for this hospital | Inserts/deletes row in `saved_hospitals` table |
| **"Check Live Beds"** | Teal Outline button (`border-[#096979] text-[#096979]`) | Bottom-left of hospital card | Opens `CheckBedsModal` with live telemetry | Queries `hospital_beds` table for `hospital_id` |
| **"View Details & Tariff"** | Primary Teal solid (`#096979`) | Bottom-right of hospital card | Navigates to `/app/hospitals/:id` | Client route |
| **"Reserve / Hold Bed"** | Emerald Success solid (`#24b47e`) | Inside CheckBedsModal | Creates a 2-hour temporary bed hold, generates booking reference pass | Inserts row into `bed_reservations` with `status = 'held'`, decrements available beds |
| **"Filter Drawer Trigger"** | Slate Outline with Sliders icon | Control row right | Opens advanced Filter Drawer / Bottom Sheet | UI state |
| **"Apply Filters"** | Primary Teal solid | Filter Drawer bottom | Applies multi-criteria filters to query | Updates filter state and resets page to 1 |
| **"Reset Filters"** | Ghost button | Filter Drawer bottom | Clears all sliders and checkboxes | Resets filter state |
| **"Pagination Prev / Next"**| Chevron buttons | Bottom of page | Navigates between result pages | Updates `currentPage` |

---

### SCREEN 7: Hospital Details & Unbundled Tariff
- **Route**: `/app/hospitals/:id`
- **File Reference**: `HospitalDetails.jsx`
- **Purpose**: Deep-dive clinical profile of an individual hospital displaying full unbundled procedure costs, doctor directory, photo gallery, bed status, and reviews.

#### UI Structure & Layout
1. **Hospital Hero Header**:
   - Full-width hero banner with photo gallery modal button (`View All 12 Photos`).
   - Hospital Name, Grade (`NABH Accredited Super-Specialty`), Address, Phone, Website.
   - Operating Hours badge (`🟢 Open 24/7 • Emergency Ready`).
   - Quick Action Bar: `[Directions (Google Maps)]`, `[Call Desk]`, `[Save Hospital]`, `[Book Inpatient Bed]`.
2. **Navigation Tabs**:
   - `[Overview]`, `[Bed Telemetry]`, `[Doctors & Specialists]`, `[Pricing & Tariff Packages]`, `[Insurance & Schemes]`, `[Patient Reviews]`.
3. **Pricing & Tariff Packages Tab**:
   - Search surgery/treatment inside hospital catalog (e.g. `Knee Replacement`, `Normal Delivery`).
   - Package card with:
     - All-Inclusive Price: `₹1,85,000` (Price-Locked guarantee badge).
     - Expected stay duration: `3 Days / 2 Nights`.
     - Room Category included: `Semi-Private AC Room`.
     - **Unbundled Cost Accordion**:
       - `Room Rent & Nursing Charges`: ₹18,000
       - `Operation Theatre & Anesthesia Charges`: ₹45,000
       - `Surgeon & Doctor Fees`: ₹60,000
       - `Implants & Consumables`: ₹50,000
       - `Post-Op Diagnostics & Medication`: ₹12,000
     - Inclusions list (green checkmarks) vs Exclusions list (red X marks).
     - `[Lock This Package / Book Surgery]` button.
4. **Doctors Roster Tab**:
   - Filter by specialty within hospital.
   - List of doctors with OPD timings, consultation fee, and `[Book Appointment]` button.
5. **Patient Reviews & Transparency Breakdown Tab**:
   - Overall transparency score: `92/100` (Breakdown: Price Accuracy: 96%, Bed Accuracy: 92%, Doctor Availability: 88%).
   - Verified patient reviews with `Bill Shock Index: Low`.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Get Directions"** | Slate Outline with Navigation icon | Header Action Bar | Opens native Google Maps / Apple Maps navigation to `latitude, longitude` | Deep link `https://maps.google.com/?q={lat},{lng}` |
| **"Call Hospital Desk"** | Slate Outline with Phone icon | Header Action Bar | Triggers phone dialer with hospital contact number | Deep link `tel:{phone}` |
| **"Hold Bed Now"** | Emerald Success solid | Header Action Bar & Bed Tab | Opens instant bed hold dialog for selected category | `bookingService.createBedReservation()` |
| **"Lock Package / Book"** | Primary Teal solid | Package Card footer | Opens Package Booking Dialog with date selector | Inserts row into `bookings` with `treatment_package_id` |
| **"Doctor Card: Book"** | Secondary Teal outline | Doctor row | Opens `BookAppointmentModal` for this doctor at this hospital | Queries `doctor_appointments` |
| **"Unbundled Charges Toggle"**| Accordion Chevron | Price card | Expands/collapses itemized charge breakdown | UI state |

---

### SCREEN 8: Doctor Marketplace & Specialist Finder
- **Route**: `/app/doctors`
- **File Reference**: `DoctorMarketplace.jsx`, `DoctorCard.jsx`, `BookAppointmentModal.jsx`
- **Purpose**: Discover, filter, and schedule appointments with verified doctors and surgeons.

#### UI Structure & Layout
1. **Search & Filter Controls**:
   - Search doctor name or specialty (`Dr. Sharma`, `Cardiologist`).
   - City dropdown (`Indore`, `Bhopal`, `All`).
   - Specialty dropdown (`Cardiology`, `Orthopedics`, `Neurology`, `Dermatology`, `Gynecology`, `Pediatrics`).
   - Experience filter (`5+ yrs`, `10+ yrs`, `15+ yrs`).
   - Availability pill tabs: `[Today]`, `[Tomorrow]`, `[This Week]`.
   - Max Consultation Fee slider (`₹200` to `₹3,000`).
   - Teleconsultation filter toggle: `Video Consult Only`.
2. **Doctor Card Grid**:
   - Doctor portrait with verified badge.
   - Doctor Name + Qualifications (`MBBS, MS, MCh (AIIMS)`).
   - Specialization + Years of experience (`14 yrs exp`).
   - Associated Hospital name & city (`CityCare Hospital, Indore`).
   - Consultation Fee badge (`₹800 In-Clinic` / `₹600 Video`).
   - Next available slot pill (`🟢 Available Today at 4:30 PM`).
   - Action buttons: `[Book Appointment]` and `[View Profile]`.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Book Appointment"** | Primary Teal solid (`#096979`) | Doctor Card bottom-right | Opens `BookAppointmentModal` | Fetches doctor's available slots |
| **"Save Doctor"** | Heart icon button | Doctor Card top-right | Toggles save status | Inserts/deletes row in `saved_doctors` |
| **"View Profile"** | Slate Ghost button | Doctor Card bottom-left | Navigates to `/app/doctors/:id` | Client route |
| **"Availability Filter Tab"**| Segmented pill | Top filter bar | Filters cards by next available date | Client query filter |

---

### SCREEN 9: Book Doctor Appointment Modal / Bottom Sheet
- **Component Reference**: `BookAppointmentModal.jsx`
- **Trigger**: Click "Book Appointment" on any doctor card or hospital doctor list.
- **Purpose**: Step-by-step booking flow for in-clinic or video consultation.

#### UI Structure & Layout
1. **Header**: Doctor summary (Photo, Name, Specialty, Hospital, Fee).
2. **Consultation Mode Selector**:
   - Segmented radio buttons: `[🏥 In-Clinic Visit]` vs `[📹 Video Teleconsultation]`.
3. **Date Selector**:
   - Horizontal date carousel (Today, Tomorrow, +5 upcoming days with day name and date number).
4. **Time Slot Grid**:
   - Categorized by time of day:
     - `Morning Slots` (09:00 AM, 10:00 AM, 11:30 AM)
     - `Afternoon Slots` (02:00 PM, 03:00 PM, 04:30 PM)
     - `Evening Slots` (06:00 PM, 07:15 PM, 08:00 PM)
   - Unavailable slots disabled with strikethrough.
5. **Patient Information Form**:
   - Patient Name, Phone Number, Age, Gender, Chief Complaint / Symptoms text area.
6. **Payment & Confirmation Footer**:
   - Fee summary: Consultation Fee + Taxes = Total Payable.
   - Payment Option: `[Pay at Hospital Desk]` vs `[Pay Online Now]`.
   - Action buttons: `[Cancel]` and `[Confirm Appointment]`.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Consultation Mode"** | Pill buttons | Modal top | Switches between in-person and video | Sets `consultation_type` |
| **"Date Chip Selection"** | Rounded card (active has teal background) | Carousel | Sets selected date, loads available slots | Filters slot query |
| **"Time Slot Chip"** | Small rounded pill | Slot grid | Selects active slot time | Sets `appointment_time` |
| **"Confirm Appointment"** | Primary Teal solid (`w-full py-3`) | Modal footer | Validates inputs, reserves slot, creates booking record | Inserts row in `doctor_appointments`, sends confirmation notification |
| **"Close / Cancel Modal"** | X icon / Slate ghost button | Modal top-right & footer | Dismisses modal without saving | UI state |

---

### SCREEN 10: Emergency Live Dispatch & Ambulance Tracker
- **Route**: `/app/emergency`
- **File Reference**: `PatientEmergency.jsx`, `EmergencyMap.jsx`
- **Purpose**: High-urgency emergency orchestration screen with 1-tap SOS trigger, real-time GPS reverse geocoding, nearest ICU hospital ranking, live ambulance dispatch, and telemetry tracking.

#### Modes Breakdown
The screen operates in two distinct states:
- **Mode A: DISCOVERY**: Shows current GPS location address, ranked nearby hospitals with available ICU beds, estimated travel times, and the big 1-Tap SOS Dispatch button.
- **Mode B: ACTIVE DISPATCH**: Triggered once emergency is requested. Shows live interactive map, assigned ambulance ID, driver phone, real-time vehicle GPS marker moving along the route line, live ETA countdown, and destination hospital trauma unit alert.

#### UI Structure & Layout (Mode A: Discovery)
1. **Emergency Header Banner**:
   - Pulsing red banner: `🚨 Emergency Medical Assistance Active`.
   - Helper text: *"Instant dispatch to nearest hospital with verified available ICU beds."*
2. **Current Location Status Bar**:
   - Reverse geocoded address badge (e.g. `Geeta Bhavan Square, AB Road, Indore, MP`).
   - `[📍 Refresh GPS]` button.
   - GPS mode indicator (`Live High-Accuracy GPS Active`).
3. **Primary Action Hero Card**:
   - Big **1-TAP EMERGENCY DISPATCH** button with pulsing red glow (`min-h-[64px]`).
   - Direct helpline quick dials: `[Call 108 Ambulance]` and `[Call 112 Emergency]`.
4. **Ranked Destination Hospitals List**:
   - Ranked #1, #2, #3 by proximity + ICU bed availability:
     - Hospital Name + Verified Trauma Center badge.
     - Live Distance (`2.1 km away`) + Travel ETA (`~8 mins in current traffic`).
     - **ICU Beds Available**: `🟢 4 ICU Beds Ready`.
     - Direct CTA: `[Dispatch to This Hospital]`.

#### UI Structure & Layout (Mode B: Active Dispatch)
1. **Active Dispatch Status Card**:
   - Status Header: `🚑 Ambulance Assigned & En Route`.
   - Live ETA Counter: `ETA: 6 mins` (updates dynamically).
   - Vehicle Number: `AMB-104 (Advanced Life Support)`.
   - Driver Details: Driver Name + Star Rating + `[Call Driver]` button.
2. **Interactive Live Tracking Map (`EmergencyMap.jsx`)**:
   - Patient GPS pin (Blue pulsating dot).
   - Ambulance vehicle marker (Red vehicle icon updating coordinates).
   - Hospital destination marker (Green cross).
   - Animated SVG route line connecting vehicle to patient.
3. **Destination Hospital Alert**:
   - Card showing Hospital Trauma Desk notification status: `Trauma Center Notified — ICU Bed Held`.
   - `[Call Hospital Emergency Desk]` button.
4. **Emergency Cancellation Modal**:
   - Reason selector: Accidental trigger, Found alternate ride, Patient stabilized.
   - `[Confirm Cancellation]` vs `[Keep Active]`.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"1-TAP SOS DISPATCH"** | Crimson Red solid (`#dc2626`), pulsing outer glow | Discovery Hero center | Dispatches emergency session to best-ranked hospital | Inserts row in `emergency_sessions` & `emergency_dispatches`, sets `activeMode = 'ACTIVE_DISPATCH'` |
| **"Dispatch to This Hospital"**| Crimson Red solid | Hospital card in ranked list | Dispatches emergency specifically targeting this hospital | `emergencyService.triggerEmergency({ hospitalId, gps })` |
| **"Refresh GPS Location"** | Slate Outline with RotateCw icon | Location status bar | Re-queries device navigator.geolocation, reverse geocodes with Nominatim | `geolocationService.getCurrentLocation()` |
| **"Call 108 Ambulance"** | Red Outline with Phone icon | Top helpline bar | Opens native phone dialer with `tel:108` | Native dialer |
| **"Call 112 Police/Emergency"**| Blue Outline with Phone icon | Top helpline bar | Opens native phone dialer with `tel:112` | Native dialer |
| **"Call Driver"** | Emerald Success solid (`#24b47e`) | Active dispatch card | Triggers phone call to assigned driver | Native dialer `tel:{driverPhone}` |
| **"Call Hospital Trauma Desk"**| Slate Outline with Building2 icon | Destination card | Triggers phone call to hospital emergency triage | Native dialer `tel:{hospitalPhone}` |
| **"Cancel Emergency Request"** | Red Ghost text button | Bottom of active dispatch | Opens Emergency Cancellation confirmation modal | UI state |
| **"Confirm Cancellation"** | Danger Red solid | Cancel Modal | Cancels active dispatch session, frees ambulance | Updates `emergency_sessions` status to `'cancelled'` |

---

### SCREEN 11: Patient Bookings, Bed Holds & Digital Admission Pass QR
- **Route**: `/app/bookings`
- **File Reference**: `PatientBookings.jsx`
- **Purpose**: Track all doctor appointments and bed reservations with a live countdown timer, scannable QR admission pass, printable medical slip, directions, and cancellation flow.

#### UI Structure & Layout
1. **Tab Filter Bar**:
   - `[All Bookings]` | `[Upcoming]` | `[Completed]` | `[Cancelled]`.
2. **2-Panel Master-Detail Layout (Mobile: List with tap to open full-screen sheet)**:
   - **Left Panel (Selected Booking Spotlight)**:
     - Header with Status Badge (`Confirmed`, `Held - 2h Window`, `Completed`).
     - **Live Countdown Timer**: Counts down hours, minutes, seconds to appointment or expiration of bed hold.
     - Doctor / Bed Type Title + Hospital Name + City.
     - Booking Reference ID with `[Copy ID]` button.
     - **Scannable QR Code Identity**: Crisp black-on-white 2D QR code encoding booking UID + patient ABHA ID.
     - Action Buttons:
       - `[Show Large QR Code]` (opens high-res modal for scanning at hospital desk).
       - `[Print Admission Pass]` (opens printable medical slip).
       - `[Get Directions]` (opens Google Maps with hospital coordinates).
       - `[Call Hospital]` (phone dialer).
       - `[Cancel Booking]` (opens cancellation modal).
   - **Right Panel (Scrollable Bookings List)**:
     - Cards showing Doctor name / Bed category, Hospital photo, Date, Time, Fee amount, and selection state.
3. **Modals**:
   - **QR Code Modal**: High-resolution centered QR canvas + instructions for hospital triage scanner.
   - **Printable Medical Slip Modal**: Official hospital admission pass layout (`#printable-booking-slip`) with hospital empanelment logo, patient vitals, barcodes, and print stylesheet trigger (`window.print()`).
   - **Cancel Booking Modal**: Reason selector dropdown + optional text feedback + Confirm Cancel button.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Filter Tabs"** | Segmented pills | Top of list | Filters list by status (`all`, `upcoming`, `completed`, `cancelled`) | Client filter |
| **"Copy Reference ID"** | Icon button (Copy / Check) | Next to booking UID | Copies UID to system clipboard | Clipboard API |
| **"Show Large QR Code"** | Teal Outline with QrCode icon | Left detail panel | Opens full-screen QR Dialog modal | UI state |
| **"Print Admission Pass"** | Slate Outline with Printer icon | Left detail panel | Opens printable preview / triggers print dialog | Browser `@media print` |
| **"Get Directions"** | Slate Outline with Navigation icon | Left detail panel | Launches native map navigation to hospital | Deep link to Google Maps |
| **"Call Hospital Desk"** | Slate Outline with Phone icon | Left detail panel | Dials hospital receptionist number | Native dialer |
| **"Cancel Booking Button"** | Red Ghost button | Left detail panel | Opens cancellation modal | UI state |
| **"Confirm Cancel (Modal)"** | Crimson Red solid | Cancel modal footer | Cancels reservation, frees reserved bed, updates status to `'cancelled'` | `bookingService.cancelBooking(id, reason)` |

---

### SCREEN 12: Smart Medical Bill Auditor & 3-Way Cost Benchmark
- **Route**: `/app/bills`
- **File Reference**: `PatientBills.jsx`, `billService.js`
- **Purpose**: Upload hospital inpatient bills, analyze itemized charges with AI, compare against published hospital packages and city benchmark medians, and highlight overcharged items.

#### UI Structure & Layout
1. **Page Header & Upload Trigger**:
   - Title: *"Medical Bill Transparency & Cost Benchmark"*
   - Subtitle: *"Compare your hospital bill line-by-line against published surgery packages and city benchmark medians."*
   - `[+ Upload New Bill]` primary action button.
2. **Bill Selector Tabs / Carousel**:
   - Horizontal list of patient's uploaded bills (e.g. `Total Knee Replacement - CityCare Hospital`, `Angioplasty - Shalby Hospital`).
3. **3-Way Multi-Dimensional Comparison Card**:
   - **Column 1: Your Hospital Bill**: Total amount charged (e.g. `₹1,95,000`).
   - **Column 2: Hospital Published Package**: Standard listed package rate (e.g. `₹1,85,000` — Delta: `+₹10,000`).
   - **Column 3: Indore City Benchmark Median**: City-wide average for same procedure (e.g. `₹1,75,000` — Delta: `+₹20,000`).
   - **Bill Shock Index Badge**: `Low Risk` (Green) / `Moderate Overcharge` (Amber) / `High Shock` (Red).
4. **Itemized Charges Breakdown Table / Accordion**:
   - Line items: Room Rent, OT Charges, Surgeon Fees, Anesthesia, Pharmacy & Consumables, Lab Investigations.
   - Highlights flagged items exceeding benchmark threshold (with red alert badge: `+35% above city average`).
5. **AI Bill Audit Synthesis Modal**:
   - Executive AI summary of bill findings.
   - Identified unjustified or unbundled consumables.
   - Recommended counter-actions & negotiation letter generator.
6. **Upload Bill Modal**:
   - File dropzone (PDF, JPG, PNG).
   - Procedure / Treatment dropdown (`Knee Replacement`, `Heart Surgery`, `Delivery`, `Gallbladder`, etc.).
   - Hospital selector dropdown.
   - Package selector (optional).
   - Total Billed Amount input.
   - `[Analyze Bill with AI]` action button.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"+ Upload New Bill"** | Primary Teal solid (`#096979`) | Top-Right header | Opens Upload Bill Modal | UI state |
| **"Analyze with AI"** | Purple Sparkles solid (`#7c3aed`) | Top of bill comparison card | Runs deep AI line-item audit on active bill | `billService.auditBillWithAI(billId)` |
| **"Download Audit Report"**| Slate Outline with Download icon | Comparison card actions | Generates and downloads PDF audit summary | File download |
| **"Rate Billing Transparency"**| 5 Interactive Stars | Bottom review card | Allows patient to submit 1-5 star rating and feedback on billing honesty | Inserts row into `hospital_reviews` |
| **"Upload File Dropzone"** | Dashed container with UploadCloud icon | Inside upload modal | Selects bill PDF or photo | Uploads to Supabase Storage bucket `bills` |
| **"Submit Bill & Audit"** | Primary Teal solid | Upload modal footer | Inserts record into `bills`, parses line items | `billService.createBill()` |

---

### SCREEN 13: Health Records, Scans & Medical Timeline
- **Route**: `/app/reports`
- **File Reference**: `PatientReports.jsx`, `reportService.js`
- **Purpose**: Secure digital repository of lab tests, prescriptions, radiology scans, and a chronological medical journey timeline.

#### UI Structure & Layout
1. **Header & Upload Action**:
   - Title: *"Medical Records & Diagnostic Reports"*
   - Stats summary: `12 Completed Tests`, `18 Uploaded Documents`.
   - `[+ Upload Medical Record]` button.
2. **Category Tabs**:
   - `[All Records]` | `[Pathology Tests]` | `[Prescriptions]` | `[Scans & X-Rays]` | `[Medical Timeline]`.
3. **Search & View Controls**:
   - Search by report name or hospital.
   - Category filter dropdown.
   - View mode toggle: `[Grid View]` vs `[List View]`.
4. **Document Cards Grid**:
   - File type icon (PDF, Image, Lab).
   - Document Title + Date + Hospital Name.
   - Category Tag pill (`Pathology`, `Radiology`).
   - Actions: `[View / Preview]`, `[Analyze with AI]`, `[Download]`, `[Delete]`.
5. **Medical Timeline View (When Tab = 'Timeline')**:
   - Vertical chronological line with animated nodes.
   - Date markers with linked doctor visits, lab tests, and hospital discharge summaries.
6. **AI Report Analyzer Modal**:
   - Explains medical jargon into plain English.
   - Identifies normal vs abnormal ranges (e.g. `HbA1c: 7.2% — Elevated`).
   - Prescribes follow-up recommendations.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"+ Upload Medical Record"**| Primary Teal solid | Top-Right header | Opens Upload Record Modal | UI state |
| **"Analyze with AI"** | Purple Sparkles solid | On each report card | Opens AI Report Analyzer Modal, generates patient-friendly synthesis | `aiService.analyzeReport(reportId)` |
| **"Preview Document"** | Slate Outline with Eye icon | On each report card | Opens full-screen PDF/Image preview modal | Supabase Storage signed URL |
| **"Download Document"** | Slate Outline with Download icon | On each report card | Downloads original file | File download |
| **"Delete Document"** | Red Ghost icon button | Document card options | Opens delete confirmation dialog | Deletes from `patient_reports` and storage |
| **"Timeline Tab Toggle"** | Segmented tab button | Category tabs | Switches from card grid to interactive chronological timeline | Reads `medical_timeline_events` |

---

### SCREEN 14: AI Symptom & Health Synthesis Engine
- **Route**: `/app/ai-analyzer`
- **File Reference**: `PatientAIAnalyzer.jsx`, `aiService.js`
- **Purpose**: Interactive AI health assistant where patients describe symptoms via voice or text, select previous medical records, and receive instant triage guidance with specialist matching.

#### UI Structure & Layout
1. **Symptom Intake Stage**:
   - Text input area: *"Describe your symptoms, how long you've felt them, and any medications..."*
   - **Voice Input Button (Microphone icon)**: Triggers Web Speech API / native voice-to-text transcription.
2. **Associated Records Selector**:
   - Checkboxes of patient's recently uploaded diagnostic reports and bills to include as context for the AI.
3. **Primary Action**:
   - Big **"Run AI Health Synthesis"** button with glowing sparkle animation.
4. **AI Synthesis Output Results (When Complete)**:
   - **Clinical Summary Card**: Plain English synthesis of condition.
   - **Severity & Risk Level Badge**: `Low Risk` (Green) / `Moderate Attention` (Yellow) / `Immediate Emergency` (Red).
   - **Recommended Medical Specialties**: Badges for specialists (e.g. `Cardiologist`, `Gastroenterologist`).
   - **Instant Booking Action**: Direct `[Book Appointment with Recommended Specialist]` button.
5. **Past AI Health Sessions History**:
   - List of previous synthesis queries with 1-click reload.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Voice Input / Mic"** | Circular button with Mic icon (pulses red while recording) | Right of symptom input | Starts/stops speech recognition, appends words to input | Web Speech API / native mic |
| **"Record Checkbox Toggle"**| Checkbox | Attached records list | Includes/excludes document ID in AI payload | Updates `selectedReportIds` array |
| **"Run AI Health Synthesis"**| Purple Gradient solid with Sparkles | Below symptom box | Sends prompt + context to AI engine, streams structured response | `aiService.synthesizeHealth()`, inserts into `ai_recommendation_sessions` |
| **"Book Specialist Now"** | Primary Teal solid | AI Result card footer | Opens `BookAppointmentModal` pre-filtered to recommended specialty | Pre-selects doctor |
| **"Past Session Chip"** | Slate pill | History sidebar/bottom | Reloads past analysis result | UI state |

---

### SCREEN 15: Saved Hospitals & Doctors
- **Route**: `/app/saved`
- **File Reference**: `PatientSaved.jsx`
- **Purpose**: Quick access to bookmarked hospitals and favorite clinical specialists.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Filter Tabs"** | Segmented pills (`All`, `Hospitals`, `Doctors`) | Top bar | Filters saved items | Client filter |
| **"Book Bed / Visit"** | Primary Teal solid | Hospital card | Navigates to hospital details | Client route |
| **"Book Doctor"** | Primary Teal solid | Doctor card | Opens `BookAppointmentModal` | UI modal |
| **"Remove from Saved"** | Trash icon / Red Ghost | Card top-right | Removes item from bookmarks | Deletes from `saved_hospitals` or `saved_doctors` |

---

### SCREEN 16: Patient Health Profile & Digital ABHA Pass
- **Route**: `/app/profile`
- **File Reference**: `PatientProfile.jsx`
- **Purpose**: Patient personal demographics, ABHA ID card, Digital Health Pass QR code, and KYC identity verification.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Show Digital Pass QR"** | Primary Teal solid with QrCode icon | Health Pass Card | Opens large modal with scannable patient QR code | Encodes patient UID & ABHA ID |
| **"Copy ABHA ID"** | Icon button with Copy icon | Next to ABHA number | Copies 14-digit ABHA number to clipboard | Clipboard API |
| **"Complete / Update KYC"** | Amber solid (`bg-amber-500`) | KYC Status card | Opens KYC Verification Modal (Aadhaar, Govt ID, Insurance upload) | Updates `patient_profiles.kyc_status` |
| **"Save Profile Changes"** | Primary Teal solid (`#096979`) | Bottom-right | Validates and persists personal details | Updates `patient_profiles` |
| **"Upload Profile Photo"** | Camera icon overlay | Avatar circle | Uploads avatar photo | Storage bucket `patient-avatars` |

---

### SCREEN 17: Patient Settings & Privacy Controls
- **Route**: `/app/settings`
- **File Reference**: `PatientSettings.jsx`
- **Purpose**: Notification toggles, ABHA data-sharing privacy consent, language selection, and account security.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"SMS Alerts Toggle"** | Switch toggle (green when on) | Notifications card | Enables/disables SMS appointment reminders | Updates `patient_settings.sms_alerts` |
| **"WhatsApp Updates Toggle"**| Switch toggle | Notifications card | Enables/disables WhatsApp booking passes | Updates `patient_settings.whatsapp_updates` |
| **"Emergency Broadcast Toggle"**| Switch toggle | Notifications card | Enables/disables local emergency alerts | Updates `patient_settings.emergency_broadcast_alerts` |
| **"ABHA Data Sharing Toggle"**| Switch toggle | Privacy card | Toggles consent to share EHR with empanelled hospitals | Updates `patient_settings.abha_data_sharing` |
| **"Save Preferences"** | Primary Teal solid | Bottom-right | Persists settings changes | Updates `patient_settings` |
| **"Log Out"** | Red Ghost button with LogOut icon | Danger zone bottom | Terminates session, clears tokens, redirects to `/login` | `supabase.auth.signOut()` |

---

## 5. Hospital Portal Operations Suite (Admin / Staff)

---

### SCREEN 18: Hospital Operations Command Dashboard
- **Route**: `/hospital/dashboard`
- **File Reference**: `HospitalDashboard.jsx`
- **Access**: `hospital_admin`, `hospital_staff`
- **Purpose**: Operational overview for hospital management showing active bed occupancy, pending bed holds, today's doctor consultations, emergency triage alerts, and quick actions.

#### UI Structure & Layout
1. **Top Metrics Row (4 Cards)**:
   - **Total Bed Occupancy**: `84%` (`142 / 170 Beds Occupied`).
   - **Available ICU Beds**: `🟢 6 ICU Beds Ready`.
   - **Pending Admissions & Holds**: `8 Incoming Holds`.
   - **Today's Doctor OPD Queue**: `34 Scheduled Consultations`.
2. **Real-time Emergency Triage Callout Banner (Conditional)**:
   - Red flashing card when an incoming ambulance or emergency patient is dispatched: *"🚨 Incoming Ambulance AMB-104 (ETA: 6 mins) — Prepare Trauma Bed 03"*.
   - Action buttons: `[Acknowledge & Hold Trauma Bed]` and `[Call Driver]`.
3. **Quick Action Bar**:
   - `[+ Update Bed Counts]`, `[Scan Patient QR Pass]`, `[+ Add Doctor]`, `[+ Publish Tariff Package]`.
4. **Live Inpatient Holds & Admissions Table**:
   - Patient Name, Bed Category, Hold Expiration Countdown, Status, and Action buttons (`[Admit]`, `[Reject]`).

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Scan Patient QR Pass"** | Emerald Success solid with QrCode icon | Quick actions bar | Opens camera QR scanner modal to instantly check in incoming patients | Scans booking UID, calls `hospitalPortalService.admitPatient()` |
| **"Quick Update Beds"** | Primary Teal solid with Plus icon | Quick actions bar | Navigates to `/hospital/beds` | Client route |
| **"Acknowledge Emergency"** | Crimson Red solid | Emergency alert banner | Acknowledges dispatch, alerts trauma ICU unit | Updates `emergency_dispatches.status = 'acknowledged'` |
| **"Admit Patient"** | Emerald Success solid | Inpatient table row | Converts pending hold into active admission, assigns bed number | Updates `bed_reservations.status = 'confirmed'`, inserts into `hospital_admissions` |
| **"Reject Hold"** | Red Outline button | Inpatient table row | Rejects booking with reason, restores bed count | Updates `bed_reservations.status = 'cancelled'` |

---

### SCREEN 19: Live Bed Inventory & Telemetry Management
- **Route**: `/hospital/beds`
- **File Reference**: `HospitalBeds.jsx`, `hospitalPortalService.js`
- **Access**: `hospital_admin`, `hospital_staff`
- **Purpose**: Manage live bed capacity across all wards with instant steppers and real-time database synchronization.

#### UI Structure & Layout
1. **Bed Summary Metrics Bar**:
   - Total Beds, Occupied Beds, Available Beds, Reserved Beds, Average Occupancy %.
2. **Bed Category Cards / Table**:
   - Rows for `ICU`, `NICU`, `PICU`, `HDU`, `General Ward`, `Single AC Room`, `Deluxe Suite`.
   - Columns:
     - Category Name & Icon
     - Total Beds counter
     - Occupied Beds stepper (`[-]` Count `[+]`)
     - Reserved Beds stepper (`[-]` Count `[+]`)
     - **Calculated Available Beds**: Automatically computed as `Total - Occupied - Reserved`
     - Price per Day (₹)
     - Status Badge (`🟢 Available`, `🟡 Limited`, `🔴 Full`)
     - Actions: `[Edit Details]`, `[Delete Category]`
3. **Add Bed Category Modal**:
   - Dropdown of standard bed types from `bed_types` catalog.
   - Total beds input.
   - Price per day input.
   - Initial occupied/reserved counts.
   - `[Save Category]` CTA.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"+ Add Bed Category"** | Primary Teal solid | Top-right header | Opens Add Bed Category Modal | UI state |
| **"Occupied Stepper (+ / -)"**| Small circular buttons with + / - | Inside table row | Increments/decrements occupied beds count live | Updates `hospital_beds.occupied_beds`, auto-recalculates available |
| **"Reserved Stepper (+ / -)"**| Small circular buttons with + / - | Inside table row | Increments/decrements reserved beds count live | Updates `hospital_beds.reserved_beds` |
| **"Save Bed Changes"** | Emerald Success solid | Floating bar (when changes made) | Commits modified counts to PostgreSQL | `supabase.from('hospital_beds').update(...)` |
| **"Export Telemetry Report"**| Slate Outline with Download icon | Top header actions | Generates CSV export of bed occupancy | File download |

---

### SCREEN 20: Inpatient Holds, Admissions & QR Verification
- **Route**: `/hospital/bookings`
- **File Reference**: `HospitalBookings.jsx`, `PatientQrAdmissionModal.jsx`
- **Purpose**: Review incoming bed reservations, scan patient QR admission passes at hospital reception, assign physical bed numbers, and process patient discharge.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"View Mode Switcher"** | Tabs: `Reservations & Holds` vs `Active Admitted Inpatients` | Top bar | Toggles between pre-admission holds and current inpatients | Client filter |
| **"Scan QR Admission Pass"**| Emerald Success solid with QrCode icon | Top-right header | Opens camera scanner dialog to scan patient's digital pass | Scans QR, pre-populates patient details |
| **"Confirm & Admit Patient"**| Emerald Success solid | Reservation row | Assigns Ward & Bed Number (e.g. `ICU-04`), admits patient | `hospitalPortalService.admitPatient(reservationId, bedNumber)` |
| **"Discharge Patient"** | Blue Outline with LogOut icon | Admitted inpatient row | Opens discharge dialog, records discharge date/time, automatically frees up occupied bed | `hospitalPortalService.dischargePatient(admissionId)` |
| **"Print Admission Slip"** | Slate Outline with Printer icon | Table actions | Prints official admission receipt | `@media print` |

---

### SCREEN 21: Doctor Consultations & OPD Token Queue
- **Route**: `/hospital/appointments`
- **File Reference**: `HospitalAppointments.jsx`, `DoctorAppointmentQrModal.jsx`
- **Purpose**: Manage daily doctor consultation queues, check in arriving patients via QR or token number, and mark appointments completed.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Status Filter Tabs"** | Tabs: `Scheduled (Today)`, `Confirmed`, `Completed`, `All` | Top bar | Filters consultation queue | Client filter |
| **"Doctor Selector Dropdown"**| Dropdown | Top filter bar | Filters queue by specific doctor | Query filter |
| **"Check-in Patient (QR/Token)"**| Emerald Success solid | Row action | Opens `DoctorAppointmentQrModal` to scan patient appointment QR | Updates status to `'checked_in'` |
| **"Complete Consultation"** | Primary Teal solid with Check icon | Row action | Marks visit completed, enables digital prescription upload | Updates status to `'completed'` in `doctor_appointments` |
| **"Cancel / Reschedule"** | Red Ghost icon button | Row options menu | Cancels or reschedules appointment slot | Updates status |

---

### SCREEN 22: Clinical Faculty & Doctor Management
- **Route**: `/hospital/doctors`
- **File Reference**: `HospitalDoctors.jsx`
- **Purpose**: Add, edit, schedule, and activate/deactivate clinical faculty and specialists.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"+ Add New Doctor"** | Primary Teal solid | Top-right header | Opens Add Doctor Modal | UI state |
| **"Doctor Active/Inactive Toggle"**| Switch toggle | Doctor card/row | Toggles public visibility of doctor | Updates `doctors.is_active` |
| **"Edit Doctor Profile"** | Slate Outline with Edit3 icon | Doctor card | Opens Edit Doctor Modal (Fees, Timings, Bio) | Updates `doctors` table |
| **"Delete Doctor"** | Red Ghost icon button | Doctor card | Confirmation modal to remove doctor from hospital | Soft deletes from `doctors` |

---

### SCREEN 23: Surgery Packages & Transparent Tariff Catalog
- **Route**: `/hospital/packages`
- **File Reference**: `HospitalPackages.jsx`
- **Purpose**: Create and publish transparent, all-inclusive surgery and treatment packages that protect patients against hidden charges and elevate the hospital's Transparency Score.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"+ Create New Package"** | Primary Teal solid | Top-right header | Opens Create Package Modal | UI state |
| **"Price-Lock Guarantee Toggle"**| Switch toggle (green) | Inside package form | Guarantees no unexpected out-of-pocket charges | Sets `package_lock_available = true` |
| **"EMI Available Toggle"** | Switch toggle | Inside package form | Indicates 0% interest EMI options | Sets `emi_available = true` |
| **"Edit Package"** | Slate Outline with Edit3 icon | Package card | Opens Edit Package Modal | Updates `treatment_packages` |
| **"Delete Package"** | Red Ghost icon button | Package card | Deletes or archives package | Deletes from `treatment_packages` |

---

### SCREEN 24: Hospital Transparency Score & Quality Compliance
- **Route**: `/hospital/transparency`
- **File Reference**: `HospitalTransparency.jsx`
- **Purpose**: Displays the hospital's public Transparency Score (0-100), audit factors, and prescriptive steps to achieve higher empanelment ranking.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Recalculate Score Now"** | Primary Teal solid with RefreshCw icon | Top-right header | Triggers instant server-side scoring RPC | `supabase.rpc('calculate_hospital_transparency_score')` |
| **"Publish Missing Tariff"**| Emerald Success solid | Score Improvement card | Navigates directly to `/hospital/packages` to add procedures | Client route |
| **"Update Bed Telemetry"** | Amber solid | Score Improvement card | Navigates directly to `/hospital/beds` | Client route |

---

### SCREEN 25: Hospital Settings & API Configuration
- **Route**: `/hospital/settings`
- **File Reference**: `HospitalSettings.jsx`
- **Purpose**: Configure emergency auto-acceptance rules, consultation slot durations, notification chimes, and API integration keys.

#### Functional Buttons & Interactive Components
| Button / Control | Visual Style | Position | Action / Trigger | Backend Wiring |
|---|---|---|---|---|
| **"Auto-Accept Emergency Toggle"**| Switch toggle | General tab | Enables instant auto-hold of trauma beds upon SOS dispatch | Updates hospital settings |
| **"Triage Audio Chime Toggle"**| Switch toggle | Notifications tab | Plays loud audible chime on reception tablets during SOS dispatch | Local browser audio setting |
| **"Copy API Secret Key"** | Icon button with Copy icon | API tab | Copies hospital integration API key | Clipboard API |
| **"Save Settings Changes"** | Primary Teal solid | Bottom-right | Persists configuration settings | Saves to `hospital_settings` / `hospitals` |

---

## 6. Backend Data Contracts & Supabase Wiring Dictionary

### 6.1 Database Schema & Core Tables
| Table Name | Primary Purpose | Key Fields | Realtime Enabled? |
|---|---|---|---|
| `profiles` | Auth user identity & role mapping | `id`, `email`, `role`, `full_name`, `phone`, `created_at` | No |
| `patient_profiles` | Patient medical demographics & KYC | `id`, `user_id`, `abha_id`, `blood_group`, `emergency_contact_phone`, `kyc_status`, `aadhaar_number` | No |
| `hospitals` | Master hospital directory & accreditation | `id`, `name`, `city`, `state`, `address`, `latitude`, `longitude`, `transparency_score`, `emergency_available`, `rating` | Yes |
| `hospital_beds` | Live bed capacity & telemetry counts | `id`, `hospital_id`, `bed_type_id`, `total_beds`, `occupied_beds`, `reserved_beds`, `available_beds`, `price_per_day` | **Yes (Crucial)** |
| `bed_types` | Bed catalog (ICU, NICU, PICU, HDU, General)| `id`, `name`, `code`, `description`, `is_critical_care` | No |
| `bed_reservations`| Temporary 2-hour bed holds & admissions | `id`, `patient_id`, `hospital_id`, `bed_type_id`, `status`, `reservation_code`, `expires_at` | **Yes (Crucial)** |
| `hospital_admissions`| Active admitted inpatients | `id`, `reservation_id`, `hospital_id`, `patient_id`, `bed_number`, `admitted_at`, `discharged_at`, `status` | Yes |
| `doctors` | Clinical specialists roster | `id`, `hospital_id`, `name`, `specialization`, `qualification`, `experience_years`, `consultation_fee`, `is_active` | No |
| `doctor_appointments`| Outpatient consultations | `id`, `patient_id`, `doctor_id`, `hospital_id`, `appointment_date`, `appointment_time`, `consultation_type`, `status` | Yes |
| `treatment_packages`| Published all-inclusive surgery rates | `id`, `hospital_id`, `name`, `price`, `duration_days`, `room_category`, `included_services`, `package_lock_available`| No |
| `bills` | Uploaded medical bills for audit | `id`, `patient_id`, `hospital_id`, `total_amount`, `bill_shock_index`, `benchmark_delta`, `status` | No |
| `bill_line_items` | Itemized charges parsed from bills | `id`, `bill_id`, `category`, `description`, `amount`, `benchmark_amount`, `is_flagged` | No |
| `emergency_sessions`| Active 1-tap SOS emergency orchestrations| `id`, `patient_id`, `status`, `patient_latitude`, `patient_longitude`, `patient_address` | **Yes (Crucial)** |
| `emergency_dispatches`| Ambulance dispatch linkage | `id`, `session_id`, `hospital_id`, `ambulance_id`, `status`, `eta_minutes`, `vehicle_latitude`, `vehicle_longitude`| **Yes (Crucial)** |
| `saved_hospitals` | Patient bookmarks | `id`, `patient_id`, `hospital_id`, `created_at` | No |
| `saved_doctors` | Patient favorite specialists | `id`, `patient_id`, `doctor_id`, `created_at` | No |
| `notifications` | In-app notification messages | `id`, `user_id`, `title`, `body`, `category`, `read_at`, `created_at` | Yes |

### 6.2 Supabase Realtime Channels to Wire in App
1. **Bed Telemetry Channel**:
   ```javascript
   supabase
     .channel('public:hospital_beds')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_beds' }, (payload) => {
       // Update live bed badge & telemetry chart immediately
     })
     .subscribe();
   ```
2. **Emergency Dispatch Tracking Channel**:
   ```javascript
   supabase
     .channel(`emergency_dispatch_${sessionId}`)
     .on('postgres_changes', { 
       event: 'UPDATE', 
       schema: 'public', 
       table: 'emergency_dispatches', 
       filter: `session_id=eq.${sessionId}` 
     }, (payload) => {
       // Update ambulance live marker coordinate on map and ETA countdown
     })
     .subscribe();
   ```
3. **Bed Reservation Admission Sync**:
   ```javascript
   supabase
     .channel(`hospital_reservations_${hospitalId}`)
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'bed_reservations', 
       filter: `hospital_id=eq.${hospitalId}` 
     }, (payload) => {
       // Play chime & add incoming hold card to receptionist table
     })
     .subscribe();
   ```

### 6.3 Supabase Storage Buckets
| Bucket ID | Access Rule | Content Types | Max Size |
|---|---|---|---|
| `medical-documents` | Private (Owner RLS) | PDF, PNG, JPG (Diagnostic reports, prescriptions) | 25 MB |
| `bills` | Private (Owner RLS) | PDF, PNG, JPG (Hospital inpatient bills) | 25 MB |
| `kyc-documents` | Private (Owner + Admin) | PDF, PNG, JPG (Aadhaar, Govt ID, NABH certificate)| 10 MB |
| `hospital-avatars` | Public Read | PNG, JPG, WebP (Hospital facility photos) | 5 MB |
| `doctor-photos` | Public Read | PNG, JPG, WebP (Doctor faculty headshots) | 5 MB |

---

## 7. Mobile UI Generation Prompt Blueprint

To generate any screen from this specification in a mobile framework (React Native, Flutter, Kotlin, Swift, or HTML/Tailwind), use this prompt template:

> **System Prompt for Mobile Screen Generation**:
> "You are an expert mobile UI engineer. Generate a clean, pixel-perfect, production-ready screen in **[React Native / Flutter / Swift / Kotlin]** matching the OpenHealth specification for **[Screen Name, e.g. Screen 10: Emergency Live Dispatch]**.
> - Use the OpenHealth Design System: Primary Teal (`#096979`), Emergency Crimson (`#dc2626`), Emerald Success (`#24b47e`), Slate 50 background (`#f8fafc`).
> - Include all interactive buttons, state transitions (Loading, Empty, Success, Error), touch targets (`min-h-[48px]`), and modal bottom sheets defined in the specification.
> - Structure code so every button callback (`onPress` / `onTap`) maps directly to the corresponding service function (e.g. `bookingService.createBedReservation`)."

---
*Document Version: 1.0.0 — Generated for OpenHealth Multi-Platform Sync.*
