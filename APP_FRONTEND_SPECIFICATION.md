# OpenHealth — Master Mobile UI & Frontend Generation Specification
**Complete Page-by-Page Blueprint for UI Generation, Functional Buttons, Modals, & Supabase Backend Wiring**

---

## 1. Executive Project Overview

### 1.1 What is OpenHealth?
**OpenHealth** is an AI-powered healthcare discovery, price transparency, live bed telemetry, and emergency orchestration platform designed to eliminate healthcare opacity in India. It connects patients, empanelled hospitals, doctors, and emergency responders through a single high-trust ecosystem.

### 1.2 Core System Capabilities
1. **Live ICU Bed Telemetry**: Real-time bed occupancy across ICU, NICU, PICU, HDU, and general wards with instant 2-hour digital bed holds.
2. **Transparent Surgery Packages & 3-Way Bill Auditing**: Comparing hospital surgery packages against patient itemized bills and city benchmark medians to eliminate bill shock.
3. **1-Tap Emergency SOS & Ambulance Tracking**: Instant GPS-orchestrated emergency dispatch to the nearest hospital with available ICU beds, live vehicle GPS tracking, and two-way trauma unit sync.
4. **Verified Doctor Marketplace**: Discover specialists, filter by consultation fee and OPD slots, and book in-clinic or video visits.
5. **Universal Digital Health Pass & QR Admission**: Instant paperless check-in at hospital reception desks via scannable QR passes linked to ABHA / Government ID.
6. **Hospital Operations Portal**: Full operational command center for bed management, patient admissions, doctor scheduling, and transparency score audits.

### 1.3 Tech Stack & Runtime Architecture
- **Web App**: React 18 (Vite), TailwindCSS, Framer Motion, Lucide React, Recharts.
- **Backend & Database**: Supabase (PostgreSQL 15), Row Level Security (RLS), Realtime CDC channels, Edge Functions, RPC Stored Procedures.
- **UI Engine / Design Tools**: Stitch MCP, React Native, Flutter, Swift, Kotlin.
- **Storage Buckets**: `medical-documents`, `bills`, `hospital-avatars`, `doctor-photos`, `kyc-documents`.

---

## 2. Global Design System & Visual Tokens

### 2.1 Color Palette
- **Primary Health Teal**: `#096979` (`hsl(187, 85%, 28%)`) — Primary buttons, active states, key headers.
- **Primary Hover / Light**: `#1192a6` (`hsl(187, 75%, 38%)`) — Hover states, focus rings, interactive tabs.
- **Primary Tint / Muted**: `#e6f6f8` (`hsl(187, 60%, 94%)`) — Accent badge backgrounds, active pill highlights.
- **Secondary Slate Navy**: `#1d2a3a` (`hsl(215, 32%, 17%)`) — High-contrast text, dark banners, hero containers.
- **Accent Emerald Success**: `#24b47e` (`hsl(158, 64%, 42%)`) — Available beds, verified badges, confirmed bookings.
- **Warning Amber Caution**: `#f59e0b` (`hsl(38, 92%, 50%)`) — Limited beds, pending reviews, moderate risk.
- **Emergency Crimson Alert**: `#dc2626` (`hsl(350, 84%, 48%)`) — SOS triggers, 0 beds left, critical alerts, cancellations.
- **Background Light (Canvas)**: `#f8fafc` (Slate 50) — Main screen background.
- **Card Surface (Elevated)**: `#ffffff` (Pure White) — Cards, bottom sheets, modals.
- **Border Subtle**: `#e2e8f0` (Slate 200) — 1px dividers and container borders.
- **Text Primary**: `#0f172a` (Slate 900) — Headings, body titles, key metrics.
- **Text Secondary**: `#64748b` (Slate 500) — Helper descriptions, timestamps, distances.

### 2.2 Typography Scale
- **Display Font**: `Outfit` or `Plus Jakarta Sans` (Headings, metric numbers).
- **Body Font**: `Inter` (Labels, buttons, tables, text).
- **Scale**:
  - `Display XL`: `36px` / `44px` (Weight: 800) — Emergency header, hero title
  - `Heading 1`: `28px` / `36px` (Weight: 700) — Screen titles
  - `Heading 2`: `22px` / `28px` (Weight: 700) — Section headers, card titles
  - `Heading 3`: `18px` / `24px` (Weight: 600) — Subsection headers, modal titles
  - `Body Regular`: `15px` / `22px` (Weight: 400) — General text
  - `Body Bold`: `15px` / `22px` (Weight: 600) — Card text, doctor names
  - `Caption`: `12px` / `16px` (Weight: 500) — Metadata, timestamps, distances
  - `Badge / Pill`: `10px` / `14px` (Weight: 700, Uppercase) — Status pills

### 2.3 Mobile Navigation Shell
- **Top App Bar**:
  - Left: User Avatar (tap opens Profile / Menu drawer)
  - Center: OpenHealth Logo or Screen Title
  - Right: City Selector Pill (`Indore, MP`) + Notification Bell (with unread badge counter)
- **Bottom Navigation Bar (5 Primary Tabs)**:
  1. `Tab 1: Home` (`/dashboard/patient`) — Icon: `LayoutDashboard`
  2. `Tab 2: Hospitals` (`/app/hospitals`) — Icon: `Building2`
  3. `Tab 3: Emergency SOS` (`/app/emergency`) — Elevated Red Circular Floating SOS Button with Pulsing Glow Ring
  4. `Tab 4: Bookings` (`/app/bookings`) — Icon: `Calendar`
  5. `Tab 5: Records & Bills` (`/app/reports` & `/app/bills`) — Icon: `FileText`

---

## 3. Page-by-Page Master Generation Blueprint

---

### PAGE 1: Welcome & Care Discovery Landing Screen
- **Route**: `/`
- **Role**: Public
- **Mobile Layout**: Scrollable view with Hero, Omni-Search bar, City Picker, 4 Live Metrics, Feature Banners, and Sticky Action Bar.

#### Component Hierarchy
- `LandingHeader` (Brand logo, `Sign In` text button, `Get Started` button)
- `HeroSection` (Animated headline: "AI-Powered Healthcare Discovery & Price Transparency", rotating keywords)
- `CareSearchBox` (Input for Hospital/Doctor/Treatment, City Selector dropdown, `Find Care Now` button)
- `LiveTelemetryTicker` (Badges: 40+ Empanelled Hospitals, 180+ ICU Beds Live, ₹4.2L+ Overcharges Detected)
- `FeatureCardsCarousel` (Live Bed Telemetry, Surgery Packages, 1-Tap SOS, Instant QR Admission)
- `StickyBottomBar` (`Emergency SOS` crimson button + `Find Hospitals Near Me` teal button)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Sign In** | Ghost Teal | Tap | Navigates to `/login` | Client route |
| **Get Started** | Primary Teal | Tap | Navigates to `/signup` | Client route |
| **Find Care Now** | Primary Teal Solid | Tap | Navigates to `/app/hospitals?q={query}&city={city}` | Filters `/app/hospitals` |
| **City Picker Dropdown** | Slate Pill | Tap | Opens bottom sheet with Indore, Bhopal, Jabalpur, etc. | Sets `selectedCity` |
| **Emergency SOS (Hero/Sticky)** | Crimson Alert Pulsing | Tap | Navigates immediately to `/app/emergency` | Client route |
| **Explore ICU Beds** | Outline with Arrow | Tap | Navigates to `/app/hospitals?filter=icu` | Pre-filtered list |
| **Audit Medical Bill** | Purple Sparkle Solid | Tap | Navigates to `/app/bills` | Client route |

---

### PAGE 2: User Sign Up & OTP Verification Screen
- **Route**: `/signup`
- **Role**: Public
- **Mobile Layout**: Clean auth card with Step 1 (Role selector + registration form), Step 2 (6-digit OTP verification), Step 3 (Success animation).

#### Component Hierarchy
- `AuthHeader` (Back button, OpenHealth logo, "Create Your Account" title)
- `RoleSelectorTabs` (3 Tabs: `Patient`, `Hospital`, `Provider`)
- `Step1Form`:
  - Full Name input
  - Email Address input
  - Phone Number input (+91 prefix)
  - Password input with Eye/EyeOff toggle
  - Hospital/Provider Organization Name input (conditional for non-patient roles)
  - `Send Verification Code` button
- `Step2OtpForm`:
  - Phone badge showing destination number + `Change Phone` button
  - 6 Numeric OTP input boxes with auto-advance
  - 60s Resend Timer + `Resend OTP` button
  - `Verify & Complete Registration` button
- `Step3Success`:
  - Animated green checkmark, provisioning feedback, redirect to onboarding wizard

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Role Tab Switcher** | Segmented Pill | Tap | Updates `accountType` (`patient` / `hospital` / `provider`) | Sets role payload |
| **Password Eye Toggle** | Icon Button | Tap | Toggles `text` vs `password` input type | UI state |
| **Send Verification Code** | Primary Teal Solid | Tap | Validates fields, checks conflicts, triggers SMS OTP | `supabase.auth.signUp()`, `authService.sendOtp()` |
| **Verify & Register** | Emerald Success Solid | Tap | Validates 6-digit OTP, provisions user profile | `supabase.auth.verifyOtp()`, creates `profiles` record |
| **Resend OTP** | Ghost Button | Tap (active at 0s) | Dispatches new SMS code | `authService.sendOtp()` |
| **Already have an account?** | Text Link | Tap | Navigates to `/login` | Client route |

---

### PAGE 3: User Login Screen
- **Route**: `/login`
- **Role**: Public
- **Mobile Layout**: Clean card with method toggle (`Password` vs `Phone OTP`), input fields, quick role switch, and submit button.

#### Component Hierarchy
- `AuthHeader` (OpenHealth logo, "Welcome Back", subtitle)
- `LoginMethodTabs` (`Password Login` / `Phone OTP Login`)
- `LoginForm`:
  - Email or Phone input
  - Password input (or 6-digit OTP input when OTP tab active)
  - `Forgot Password?` link
  - `Sign In` button
- `SocialDivider` ("Or continue with")
- `CreateAccountLink` ("Don't have an account? Sign up")

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Sign In** | Primary Teal Solid | Tap | Authenticates credentials, checks role, redirects | `supabase.auth.signInWithPassword()`, reads role |
| **Send OTP** | Primary Teal Solid | Tap | Sends 6-digit OTP to registered phone | `supabase.auth.signInWithOtp()` |
| **Forgot Password?** | Text Link | Tap | Navigates to `/forgot-password` | Client route |
| **Create Account** | Text Link | Tap | Navigates to `/signup` | Client route |

---

### PAGE 4: Patient 5-Step Onboarding & ABHA KYC Wizard
- **Route**: `/patient/onboarding`
- **Role**: `patient`
- **Mobile Layout**: Multi-step wizard with step indicator bar (1 to 5), form card, bottom action navigation (`Back` and `Continue`).

#### Steps Breakdown & Form Fields
1. **Step 1: Personal Profile**:
   - Full Name, DOB picker, Gender chips (`Male`, `Female`, `Other`), Blood Group chips (`A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-`), Emergency Contact Name & Phone.
2. **Step 2: Address & Location**:
   - State dropdown, City dropdown (Indore, Bhopal, etc.), Postal PIN code, Street Address, `[📍 Fetch GPS Location]` button.
3. **Step 3: Identity & KYC**:
   - Document Type (`Aadhaar`, `Passport`, `Voter ID`), ID Number input, File Upload dropzone (front & back photos).
4. **Step 4: Health Insurance & ABHA**:
   - 14-digit ABHA ID number, Insurance Provider name, Policy/Card number, Policy Document upload.
5. **Step 5: Review & Digital Health Pass Generation**:
   - Verification summary card, Consent checkbox, `[Generate Digital Health Pass]` button.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Continue / Next Step** | Primary Teal Solid | Tap | Validates current step inputs, advances to next step | Local validation |
| **Back / Previous Step** | Slate Ghost | Tap | Steps backward | UI state |
| **Fetch GPS Location** | Blue Outline with MapPin | Tap | Solicits GPS coordinates, reverse geocodes city/PIN | `geolocationService.getCurrentLocation()` |
| **Upload ID Document** | Dashed Dropzone | Tap | Opens camera capture / photo picker | Uploads to Supabase Storage `kyc-documents` |
| **Generate Digital Health Pass** | Emerald Success Solid | Tap | Inserts profile into `patient_profiles`, sets `kyc_status = 'pending_verification'`, sets `onboarding_completed = true` | `supabase.from('patient_profiles').upsert(...)`, redirects to `/dashboard/patient` |

---

### PAGE 5: Patient Master Dashboard Screen
- **Route**: `/dashboard/patient`
- **Role**: `patient`
- **Mobile Layout**: Dynamic dashboard with greeting, KYC alert banner, 4 metric cards, Smart Care chart, Emergency card, Health tip, 4 KPI cards, Upcoming bookings, and Recent searches.

#### Component Hierarchy
- `DashboardHeader` (Greeting: "Welcome back, {Name} 👋", live sync spinner, City dropdown)
- `KycAlertBanner` (Shown if KYC incomplete: "Complete the KYC Documents to activate Digital Health Pass" + `Complete KYC` button)
- `SummaryMetricsRow` (4 Cards: Saved Hospitals, Upcoming Bookings, Reports Analyzed, Bills Analyzed — each with count + `View all →`)
- `CareOverviewChartCard` (Interactive area chart of patient activity with Time Filter dropdown: `This Week`, `This Month`, `Past 3 Months`)
- `EmergencyHeroCard` (Bold red gradient card with 3D ambulance illustration and `[Go to Emergency →]` button)
- `DailyHealthTipCard` (Blue gradient card with medical shield icon)
- `KpiMetricsGrid` (4 Cards: Searches, Comparisons, Reservations, Bill Savings Est. with % trends)
- `UpcomingBookingsSection` (List of active bookings with doctor name, hospital, date, time, fee, status badge, and tap to open details)
- `RecentSearchesSection` (Recent query pills with 1-tap re-search)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Complete KYC Banner Button**| Amber Solid (`#f59e0b`) | Tap | Navigates to `/app/profile` | Client route |
| **View all Saved** | Text Link with Arrow | Tap | Navigates to `/app/saved` | Client route |
| **View all Bookings** | Text Link with Arrow | Tap | Navigates to `/app/bookings` | Client route |
| **View all Reports** | Text Link with Arrow | Tap | Navigates to `/app/reports` | Client route |
| **View all Bills** | Text Link with Arrow | Tap | Navigates to `/app/bills` | Client route |
| **Time Filter Selector** | Slate-50 Pill | Tap | Opens dropdown (`This Week`, `This Month`, `Past 3 Months`) | Calls `supabase.rpc('get_patient_dashboard_data')` |
| **Go to Emergency** | Crimson Alert Solid (`#dc2626`) | Tap | Navigates to `/app/emergency` | Client route |
| **Booking Card Tap** | Elevated Card | Tap | Navigates to `/app/bookings` with booking selected | Deep link |
| **Find & Book Doctor** | Primary Teal Solid | Tap | (Empty state CTA) Navigates to `/app/doctors` | Client route |
| **Recent Search Pill** | Slate Pill Card | Tap | Re-executes search for that keyword | Navigates to `/app/search?q={query}` |

---

### PAGE 6: Hospital Discovery & Live Bed Marketplace Screen
- **Route**: `/app/hospitals` or `/app/search`
- **Role**: `patient`
- **Mobile Layout**: Omni-search bar, filter carousel chips, filter drawer button, hospital cards list with live ICU bed pills, and "Check Live Beds" bottom sheet.

#### Component Hierarchy
- `MarketplaceHeader` (Title: "Find Hospitals & Live ICU Beds", location pill)
- `OmniSearchBar` (Search query input, Location icon, `[Near Me / GPS]` button, Distance Radius slider)
- `SpecialtyCarousel` (`All`, `Cardiology`, `Orthopedics`, `Neurology`, `Oncology`, `Pediatrics`, `Maternity`)
- `FilterRow` (Facility Type dropdown, Scheme dropdown, Sort By dropdown, `[Filter]` button with badge)
- `HospitalCardList`:
  - Hospital photo + Verified Accreditation badge (`NABH`, `JCI`)
  - Hospital Name, Address, Geolocation distance (`2.3 km away`)
  - **Live Bed Telemetry Pill**: Available ICU Beds / Total (`🟢 4 ICU Beds Available`)
  - **Transparency Score Ring**: Circular indicator (`94/100`)
  - Star rating + review count
  - Supported schemes chips (`PMJAY`, `Cashless`)
  - Actions: `[Check Live Beds]` and `[View Details & Tariff]`
- `CheckBedsModal / BottomSheet`:
  - Live bed breakdown: ICU, NICU, PICU, HDU, General Ward (Total, Occupied, Available, Price/Day)
  - Visual occupancy percentage bars
  - `[Reserve / Hold Bed (2-Hour Window)]` button

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Near Me / GPS** | Blue Outline with Compass | Tap | Gets device coordinates, sorts hospitals by distance | `geolocationService.getCurrentLocation()` |
| **Save Hospital (Bookmark)** | Heart Icon (Red when active)| Tap | Toggles saved state | Inserts/deletes row in `saved_hospitals` |
| **Check Live Beds** | Teal Outline | Tap | Opens `CheckBedsModal` with real-time bed telemetry | Queries `hospital_beds` for `hospital_id` |
| **Reserve / Hold Bed** | Emerald Success Solid | Tap | Creates 2-hour digital bed hold, generates pass | Inserts into `bed_reservations` (`status = 'held'`) |
| **View Details & Tariff** | Primary Teal Solid | Tap | Navigates to `/app/hospitals/:id` | Client route |
| **Filter Drawer Button** | Slate Outline with Sliders | Tap | Opens advanced filter bottom sheet | UI state |
| **Apply Filters** | Primary Teal Solid | Tap | Applies multi-criteria filters to query | Updates filter state |
| **Reset Filters** | Slate Ghost | Tap | Clears all sliders and checkboxes | Resets filter state |

---

### PAGE 7: Hospital Details & Unbundled Procedure Tariff Screen
- **Route**: `/app/hospitals/:id`
- **Role**: `patient`
- **Mobile Layout**: Full-screen hospital hero photo, quick action bar (`Directions`, `Call`, `Save`, `Hold Bed`), tab bar, and unbundled pricing cards.

#### Component Hierarchy
- `HospitalHeroHeader` (Cover photo gallery, Name, NABH badge, Address, Phone, Operating hours badge)
- `QuickActionBar` (`[Directions]`, `[Call Desk]`, `[Save]`, `[Hold Inpatient Bed]`)
- `HospitalNavTabs` (`Overview`, `Bed Telemetry`, `Specialists`, `Surgery Packages`, `Insurance`, `Reviews`)
- `SurgeryPackagesList`:
  - Procedure title (e.g. `Total Knee Replacement`)
  - All-Inclusive Price: `₹1,85,000` (Price-Lock Guarantee badge)
  - Stay duration: `3 Days / 2 Nights`, Room category: `Semi-Private AC`
  - **Unbundled Cost Accordion**:
    - Room Rent & Nursing: ₹18,000
    - OT & Anesthesia Charges: ₹45,000
    - Surgeon & Doctor Fees: ₹60,000
    - Implants & Consumables: ₹50,000
    - Post-Op Care: ₹12,000
  - Inclusions checklist vs Exclusions checklist
  - `[Lock This Package / Book Surgery]` button
- `DoctorsRosterTab` (List of doctors with OPD timings, fee, and `[Book Appointment]` button)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Get Directions** | Slate Outline with Navigation | Tap | Launches Google Maps navigation | Native map deep link |
| **Call Hospital Desk** | Slate Outline with Phone | Tap | Opens phone dialer | Native phone dialer `tel:{phone}` |
| **Hold Inpatient Bed** | Emerald Success Solid | Tap | Opens instant bed hold dialog | `bookingService.createBedReservation()` |
| **Lock Package / Book** | Primary Teal Solid | Tap | Opens package booking flow | Inserts into `bookings` |
| **Doctor Book Button** | Secondary Teal Outline | Tap | Opens `BookAppointmentModal` for doctor | Queries `doctor_appointments` |
| **Unbundled Cost Toggle** | Accordion Chevron | Tap | Expands/collapses itemized charge breakdown | UI state |

---

### PAGE 8: Doctor Marketplace & Specialist Finder Screen
- **Route**: `/app/doctors`
- **Role**: `patient`
- **Mobile Layout**: Search bar, specialty filter chips, fee slider, doctor cards list, and quick "Book Appointment" bottom sheet trigger.

#### Component Hierarchy
- `DoctorSearchHeader` (Search by doctor name or specialty, city picker)
- `SpecialtyFilterChips` (`Cardiology`, `Orthopedics`, `Neurology`, `Dermatology`, `Gynecology`, `Pediatrics`)
- `AvailabilityTabs` (`Today`, `Tomorrow`, `This Week`)
- `DoctorCardList`:
  - Doctor photo with verified credential badge
  - Doctor Name, Qualifications (`MBBS, MS, MCh`)
  - Specialty, Experience (`14 yrs exp`)
  - Hospital name & city (`CityCare Hospital, Indore`)
  - Consultation Fee badge (`₹800 In-Clinic` / `₹600 Video`)
  - Next available slot pill (`🟢 Today at 4:30 PM`)
  - Actions: `[Book Appointment]` and `[View Bio]`

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Book Appointment** | Primary Teal Solid | Tap | Opens `BookAppointmentModal` for this doctor | Fetches doctor's available slots |
| **Save Doctor** | Heart Icon Button | Tap | Toggles save status | Inserts/deletes from `saved_doctors` |
| **View Profile** | Slate Ghost | Tap | Navigates to `/app/doctors/:id` | Client route |
| **Teleconsult Filter** | Switch Toggle | Tap | Filters only doctors offering video visits | Query filter |

---

### PAGE 9: Book Doctor Appointment Modal / Bottom Sheet
- **Component**: `BookAppointmentModal.jsx`
- **Role**: `patient`
- **Mobile Layout**: Sliding bottom sheet with mode toggle, date carousel, time slot grid, patient details, and confirmation footer.

#### Component Hierarchy
- `ModalHeader` (Doctor thumbnail, Name, Hospital, Fee, Close X button)
- `ConsultationModeToggle` (`🏥 In-Clinic Visit` vs `📹 Video Teleconsultation`)
- `DateCarousel` (Horizontal day selector: Today, Tomorrow, +5 upcoming days)
- `TimeSlotGrid` (Morning slots: 9am-12pm, Afternoon: 2pm-4pm, Evening: 6pm-8pm)
- `PatientDetailsForm` (Prefilled Name, Phone, Age, Gender, Symptoms / Chief Complaint textarea)
- `PaymentSummaryCard` (Consultation Fee, GST, Total Payable, Payment Choice: `Pay at Hospital` vs `Pay Online`)
- `ActionFooter` (`[Cancel]` and `[Confirm Appointment]`)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Consultation Mode Switch**| Segmented Radio | Tap | Switches visit type | Sets `consultation_type` |
| **Date Selection Chip** | Rounded Card | Tap | Sets selected date, updates slot availability | Queries available slots |
| **Time Slot Chip** | Pill Button | Tap | Selects slot time | Sets `appointment_time` |
| **Confirm Appointment** | Primary Teal Solid | Tap | Creates booking, triggers confirmation SMS | Inserts row into `doctor_appointments` |
| **Close Modal** | Slate Ghost / X icon | Tap | Dismisses bottom sheet | UI state |

---

### PAGE 10: Emergency Live Dispatch & Ambulance Tracker Screen
- **Route**: `/app/emergency`
- **Role**: `patient`
- **Mobile Layout**: 
  - **Mode A (Discovery)**: GPS address status bar, 1-Tap SOS dispatch button, Helpline dials (108, 112), and ranked nearby hospitals with live ICU beds.
  - **Mode B (Active Dispatch)**: Real-time tracking map, assigned ambulance card, driver contact, ETA countdown, and destination trauma center notification.

#### Component Hierarchy
- `EmergencyStatusBar` (Reverse-geocoded GPS address, `Refresh GPS` button, GPS mode indicator)
- `ModeA_Discovery`:
  - Big **1-TAP EMERGENCY SOS DISPATCH** button (`min-h-[64px]` with pulsing crimson glow)
  - Quick Helpline Dials (`[Call 108 Ambulance]`, `[Call 112 Emergency]`)
  - Ranked Destination Hospitals List (Ranked by proximity + ICU beds; distance in km, travel ETA, live ICU bed count, `[Dispatch to This Hospital]` CTA)
- `ModeB_ActiveDispatch`:
  - Active Dispatch Card (Status: "Ambulance Assigned & En Route", live ETA countdown: "6 mins", Vehicle: `AMB-104 ALS`, Driver Name + `[Call Driver]` button)
  - `EmergencyMap` (Interactive map with patient blue pulsing GPS pin, moving red ambulance marker, green hospital destination icon, and animated route line)
  - Destination Trauma Desk Card ("Trauma Center Notified — ICU Bed Held" + `[Call Trauma Desk]` button)
  - Emergency Cancellation Button (`[Cancel Emergency Request]`)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **1-TAP SOS DISPATCH** | Crimson Alert Solid with Pulsing Glow | Tap | Dispatches emergency session to closest hospital with ICU beds | Inserts into `emergency_sessions` & `emergency_dispatches`, activates Mode B |
| **Dispatch to This Hospital** | Crimson Alert Solid | Tap | Dispatches emergency specifically targeting selected hospital | `emergencyService.triggerEmergency({ hospitalId })` |
| **Refresh GPS** | Slate Outline with RotateCw | Tap | Re-queries device navigator.geolocation, reverse geocodes address | `geolocationService.getCurrentLocation()` |
| **Call 108 Ambulance** | Red Outline with Phone | Tap | Launches phone dialer with 108 | Native dialer `tel:108` |
| **Call 112 Emergency** | Blue Outline with Phone | Tap | Launches phone dialer with 112 | Native dialer `tel:112` |
| **Call Driver** | Emerald Success Solid | Tap | Calls assigned ambulance driver | Native dialer `tel:{driverPhone}` |
| **Call Trauma Desk** | Slate Outline with Building2 | Tap | Calls hospital emergency triage reception | Native dialer `tel:{hospitalPhone}` |
| **Cancel Emergency Request** | Red Ghost Text | Tap | Opens cancellation confirmation modal | Updates `emergency_sessions.status = 'cancelled'` |

---

### PAGE 11: Patient Bookings, Bed Holds & QR Admission Pass Screen
- **Route**: `/app/bookings`
- **Role**: `patient`
- **Mobile Layout**: Status filter tabs (`All`, `Upcoming`, `Completed`, `Cancelled`), active booking spotlight card with live countdown timer and scannable QR pass, and list of past bookings.

#### Component Hierarchy
- `BookingsTabHeader` (`All Bookings`, `Upcoming`, `Completed`, `Cancelled`)
- `ActiveBookingSpotlight`:
  - Status badge (`Confirmed`, `Held - 2h Window`)
  - **Live Countdown Timer**: Real-time countdown to appointment or bed hold expiration
  - Doctor / Bed Category Title + Hospital Name & Address
  - Booking Reference UID + `[Copy ID]` button
  - **Scannable QR Code Identity**: Crisp black-on-white 2D QR pass
  - Action Buttons:
    - `[Show Large QR Pass]` (opens full-screen scanner dialog)
    - `[Print Admission Slip]` (opens printable admission pass)
    - `[Get Directions]` (opens Google Maps)
    - `[Call Hospital]` (phone dialer)
    - `[Cancel Booking]` (opens cancellation modal)
- `BookingsList` (Cards of all appointments and bed reservations with date, time, fee, and selection tap)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Filter Tabs Switcher** | Segmented Pills | Tap | Filters bookings by status | Client query filter |
| **Copy Booking UID** | Icon Button (Copy/Check) | Tap | Copies booking UID to clipboard | Clipboard API |
| **Show Large QR Pass** | Teal Outline with QrCode | Tap | Opens full-screen QR Dialog for hospital reception scan | Encodes booking UID |
| **Print Admission Slip** | Slate Outline with Printer | Tap | Triggers print stylesheet / printable modal | `@media print` |
| **Get Directions** | Slate Outline with Navigation | Tap | Launches native Google Maps to hospital coordinates | Deep link |
| **Call Hospital Desk** | Slate Outline with Phone | Tap | Launches phone dialer | Native phone dialer |
| **Cancel Booking** | Red Ghost Button | Tap | Opens cancellation modal with reason selector | `bookingService.cancelBooking(id, reason)` |

---

### PAGE 12: Smart Medical Bill Auditor & 3-Way Cost Benchmark Screen
- **Route**: `/app/bills`
- **Role**: `patient`
- **Mobile Layout**: Bill selector tabs, 3-way multi-dimensional comparison card, Bill Shock Index badge, itemized charge accordion, AI audit synthesis modal, and Bill Upload modal.

#### Component Hierarchy
- `BillsHeader` (Title: "Medical Bill Transparency & Cost Benchmark", `[+ Upload New Bill]` CTA)
- `BillSelectorCarousel` (Patient's uploaded bills with hospital name & procedure)
- `ThreeWayComparisonCard`:
  - Column 1: Your Hospital Bill (e.g. `₹1,95,000`)
  - Column 2: Hospital Published Package (e.g. `₹1,85,000` — Delta: `+₹10,000`)
  - Column 3: City Benchmark Median (e.g. `₹1,75,000` — Delta: `+₹20,000`)
  - **Bill Shock Index Badge**: `Low Risk` (Green) / `Moderate Overcharge` (Amber) / `High Shock` (Red)
- `ItemizedChargesList` (Room rent, OT charges, surgeon fees, pharmacy, lab tests — highlights items exceeding benchmark threshold)
- `AiBillAuditModal` (Plain-English summary of overcharges, unbundled consumables, and negotiation letter)
- `UploadBillModal` (File dropzone, Procedure selector, Hospital dropdown, Billed amount input, `[Analyze Bill with AI]` button)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **+ Upload New Bill** | Primary Teal Solid | Tap | Opens Upload Bill Modal | UI state |
| **Analyze with AI** | Purple Sparkles Solid | Tap | Runs deep AI line-item audit on selected bill | `billService.auditBillWithAI(billId)` |
| **Download Audit PDF** | Slate Outline with Download | Tap | Generates and downloads PDF audit summary | File download |
| **Rate Billing Honesty** | 5 Interactive Stars | Tap | Submits 1-5 star review on hospital billing accuracy | Inserts row into `hospital_reviews` |
| **Submit Bill for Audit** | Primary Teal Solid | Tap | Inserts bill record, parses line items | `billService.createBill()` |

---

### PAGE 13: Health Records, Scans & Medical Timeline Screen
- **Route**: `/app/reports`
- **Role**: `patient`
- **Mobile Layout**: Record category tabs (`All`, `Tests`, `Prescriptions`, `Scans`, `Timeline`), search bar, document cards grid, AI report interpretation modal, and Upload Record modal.

#### Component Hierarchy
- `ReportsHeader` (Title: "Medical Records & Diagnostic Reports", stats: `12 Tests`, `18 Uploaded`, `[+ Upload Record]` CTA)
- `CategoryTabs` (`All Records`, `Pathology Tests`, `Prescriptions`, `Scans & X-Rays`, `Medical Timeline`)
- `DocumentCardsGrid`:
  - File type icon (PDF, Lab, Radiology)
  - Document title, date, issuing hospital
  - Category tag pill (`Pathology`, `Radiology`)
  - Actions: `[View / Preview]`, `[Analyze with AI]`, `[Download]`, `[Delete]`
- `MedicalTimelineView` (Chronological timeline of doctor visits, lab tests, and hospital discharge summaries)
- `AiReportAnalyzerModal` (Translates medical jargon into plain English, normal vs abnormal values, doctor follow-up advice)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **+ Upload Record** | Primary Teal Solid | Tap | Opens Upload Medical Record Modal | UI state |
| **Analyze with AI** | Purple Sparkles Solid | Tap | Opens AI Report Analyzer Modal | `aiService.analyzeReport(reportId)` |
| **Preview Document** | Slate Outline with Eye | Tap | Opens full-screen PDF/Image preview | Supabase Storage signed URL |
| **Download Document** | Slate Outline with Download | Tap | Downloads original file | File download |
| **Delete Document** | Red Ghost Icon | Tap | Opens delete confirmation dialog | Deletes from `patient_reports` and storage |
| **Timeline Tab Switch** | Segmented Tab | Tap | Switches from cards grid to vertical timeline | Reads `medical_timeline_events` |

---

### PAGE 14: AI Symptom & Health Synthesis Engine Screen
- **Route**: `/app/ai-analyzer`
- **Role**: `patient`
- **Mobile Layout**: Symptom intake textarea with Web Speech microphone button, attached previous records checkboxes, "Run AI Synthesis" CTA, and clinical output card with recommended specialist booking.

#### Component Hierarchy
- `AiIntakeHeader` (Title: "AI Smart Health Synthesis", subtitle)
- `SymptomInputCard`:
  - Symptom description textarea
  - **Voice Input Button**: Microphone icon with pulsing red recording animation
- `AttachedRecordsCard` (Checkboxes of uploaded reports and bills to provide context to AI)
- `RunAiSynthesisButton` (Big purple gradient button with glowing sparkles)
- `AiOutputResultsCard` (Rendered on completion):
  - Clinical Summary card
  - Severity & Risk Level Badge (`Low Risk` / `Moderate Attention` / `Emergency`)
  - Recommended Medical Specialties tags (`Cardiologist`, `Orthopedic Surgeon`)
  - `[Book Appointment with Specialist]` button
- `PastSessionsHistory` (List of previous AI queries with 1-tap reload)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Voice Input / Mic** | Circular Button with Mic (Red pulse) | Tap | Starts/stops speech-to-text recording | Web Speech API / native mic |
| **Record Checkbox Toggle**| Checkbox | Tap | Includes/excludes report ID in AI payload | Updates `selectedReportIds` array |
| **Run AI Health Synthesis**| Purple Gradient Solid | Tap | Sends symptoms + records to AI synthesis engine | `aiService.synthesizeHealth()`, inserts into `ai_recommendation_sessions` |
| **Book Specialist Now** | Primary Teal Solid | Tap | Opens `BookAppointmentModal` pre-filtered to specialist | Pre-selects doctor |
| **Past Session Chip** | Slate Pill | Tap | Reloads past analysis result | UI state |

---

### PAGE 15: Saved Hospitals & Doctors Screen
- **Route**: `/app/saved`
- **Role**: `patient`
- **Mobile Layout**: Tabs (`All`, `Hospitals`, `Doctors`), search filter, saved cards with quick booking CTAs, and delete bookmark button.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Filter Tabs** | Segmented Pills | Tap | Filters saved items | Client filter |
| **Book Bed / Hospital** | Primary Teal Solid | Tap | Navigates to hospital details | Client route |
| **Book Doctor** | Primary Teal Solid | Tap | Opens `BookAppointmentModal` | UI modal |
| **Remove Bookmark** | Trash Icon / Red Ghost | Tap | Removes item from saved list | Deletes from `saved_hospitals` or `saved_doctors` |

---

### PAGE 16: Patient Health Profile & Digital ABHA Pass Screen
- **Route**: `/app/profile`
- **Role**: `patient`
- **Mobile Layout**: Profile avatar, ABHA Health ID card, Digital Pass QR modal trigger, KYC verification card, personal medical details form, and Save button.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Show Digital Pass QR** | Primary Teal Solid with QrCode | Tap | Opens large modal with scannable patient QR pass | Encodes patient UID & ABHA ID |
| **Copy ABHA ID** | Icon Button with Copy icon | Tap | Copies 14-digit ABHA number to clipboard | Clipboard API |
| **Complete / Update KYC**| Amber Solid (`#f59e0b`) | Tap | Opens KYC Verification Modal (Aadhaar, Govt ID, Insurance) | Updates `patient_profiles.kyc_status` |
| **Save Profile Changes** | Primary Teal Solid (`#096979`)| Tap | Validates and persists personal details | Updates `patient_profiles` |
| **Upload Avatar** | Camera Icon Overlay | Tap | Uploads avatar photo | Storage bucket `patient-avatars` |

---

### PAGE 17: Patient Settings & Privacy Controls Screen
- **Route**: `/app/settings`
- **Role**: `patient`
- **Mobile Layout**: Notification switches, ABHA data-sharing privacy consent, language selector, security settings, and Log Out button.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **SMS Alerts Switch** | Toggle Switch | Tap | Enables/disables SMS appointment reminders | Updates `patient_settings.sms_alerts` |
| **WhatsApp Updates Switch**| Toggle Switch | Tap | Enables/disables WhatsApp booking passes | Updates `patient_settings.whatsapp_updates` |
| **Emergency Alerts Switch**| Toggle Switch | Tap | Enables/disables local emergency alerts | Updates `patient_settings.emergency_broadcast_alerts` |
| **ABHA Sharing Switch** | Toggle Switch | Tap | Toggles consent to share EHR with hospitals | Updates `patient_settings.abha_data_sharing` |
| **Save Preferences** | Primary Teal Solid | Tap | Persists configuration settings | Updates `patient_settings` |
| **Log Out** | Red Ghost with LogOut icon | Tap | Clears tokens, signs out, redirects to `/login` | `supabase.auth.signOut()` |

---

### PAGE 18: Government Healthcare Schemes Directory Screen
- **Route**: `/app/schemes`
- **Role**: `patient`
- **Mobile Layout**: Schemes search, eligibility checker card, scheme cards (Ayushman Bharat / PMJAY, CGHS, State Schemes) with coverage amount and empanelled hospital finder button.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Check Eligibility** | Emerald Success Solid | Tap | Opens 3-question eligibility questionnaire | Interactive flow |
| **Find Empanelled Hospitals**| Primary Teal Solid | Tap | Navigates to `/app/hospitals?scheme={schemeName}` | Pre-filters `/app/hospitals` |
| **Download Scheme Brochure**| Slate Outline with Download | Tap | Downloads official government scheme guideline PDF | File download |

---

### PAGE 19: Hospital Operations Command Dashboard Screen
- **Route**: `/hospital/dashboard`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: Bed occupancy KPI row, incoming ambulance callout banner, quick action bar (`Update Beds`, `Scan QR Pass`, `Add Doctor`), and live inpatient holds table.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Scan Patient QR Pass** | Emerald Success Solid with QrCode | Tap | Opens camera QR scanner modal to check in incoming patients | Scans booking UID, calls `hospitalPortalService.admitPatient()` |
| **Quick Update Beds** | Primary Teal Solid with Plus icon | Tap | Navigates to `/hospital/beds` | Client route |
| **Acknowledge Emergency** | Crimson Red Solid | Tap | Acknowledges dispatch, alerts trauma ICU unit | Updates `emergency_dispatches.status = 'acknowledged'` |
| **Admit Patient** | Emerald Success Solid | Tap | Converts pending hold into active admission, assigns bed number | Updates `bed_reservations.status = 'confirmed'`, inserts into `hospital_admissions` |
| **Reject Hold** | Red Outline Button | Tap | Rejects booking with reason, restores bed count | Updates `bed_reservations.status = 'cancelled'` |

---

### PAGE 20: Live Bed Inventory & Telemetry Management Screen
- **Route**: `/hospital/beds`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: Bed occupancy metrics bar, bed category cards (ICU, NICU, PICU, HDU, General) with live `[+]` and `[-]` steppers for occupied and reserved beds, and Add Bed Category modal.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **+ Add Bed Category** | Primary Teal Solid | Tap | Opens Add Bed Category Modal | UI state |
| **Occupied Stepper (+ / -)**| Circular Stepper Buttons | Tap | Increments/decrements occupied beds count live | Updates `hospital_beds.occupied_beds`, auto-computes available |
| **Reserved Stepper (+ / -)**| Circular Stepper Buttons | Tap | Increments/decrements reserved beds count live | Updates `hospital_beds.reserved_beds` |
| **Save Bed Changes** | Emerald Success Solid | Tap | Commits modified counts to PostgreSQL | `supabase.from('hospital_beds').update(...)` |
| **Export Telemetry Report**| Slate Outline with Download | Tap | Generates CSV export of bed occupancy | File download |

---

### PAGE 21: Inpatient Holds, Admissions & QR Verification Screen
- **Route**: `/hospital/bookings`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: View mode switch (`Reservations & Holds` vs `Active Inpatients`), patient cards with hold timers, QR camera scanner modal, admit button, and discharge button.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **View Mode Switcher** | Segmented Tabs | Tap | Toggles between pre-admission holds and current inpatients | Client filter |
| **Scan QR Admission Pass**| Emerald Success Solid with QrCode | Tap | Opens camera scanner dialog to scan patient's digital pass | Scans QR, pre-populates patient details |
| **Confirm & Admit Patient**| Emerald Success Solid | Tap | Assigns Ward & Bed Number (e.g. `ICU-04`), admits patient | `hospitalPortalService.admitPatient(reservationId, bedNumber)` |
| **Discharge Patient** | Blue Outline with LogOut | Tap | Opens discharge dialog, records discharge date/time, frees occupied bed | `hospitalPortalService.dischargePatient(admissionId)` |
| **Print Admission Slip** | Slate Outline with Printer | Tap | Prints official admission receipt | `@media print` |

---

### PAGE 22: Doctor Consultations & OPD Token Queue Screen
- **Route**: `/hospital/appointments`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: Status filter tabs (`Scheduled`, `Confirmed`, `Completed`, `All`), doctor dropdown, patient consultation queue cards, check-in button, and consultation completion CTA.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Status Filter Tabs** | Tabs (`Scheduled`, `Confirmed`, `Completed`) | Tap | Filters consultation queue | Client filter |
| **Doctor Dropdown** | Dropdown | Tap | Filters queue by specific doctor | Query filter |
| **Check-in Patient** | Emerald Success Solid | Tap | Scans patient appointment QR pass or verifies token | Updates status to `'checked_in'` |
| **Complete Visit** | Primary Teal Solid with Check | Tap | Marks consultation completed, enables digital prescription upload | Updates status to `'completed'` in `doctor_appointments` |
| **Cancel / Reschedule** | Red Ghost Icon Button | Tap | Cancels or reschedules appointment slot | Updates status |

---

### PAGE 23: Clinical Faculty & Doctor Management Screen
- **Route**: `/hospital/doctors`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: Doctor cards with photo, qualifications, OPD timings, consultation fee, Active/Inactive visibility toggle, Edit modal, and Add Doctor CTA.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **+ Add New Doctor** | Primary Teal Solid | Tap | Opens Add Doctor Modal (Name, Specialty, Fee, OPD Timings, Photo) | Inserts into `doctors` |
| **Doctor Active Toggle** | Switch Toggle | Tap | Toggles public visibility of doctor in search | Updates `doctors.is_active` |
| **Edit Doctor Profile** | Slate Outline with Edit3 | Tap | Opens Edit Doctor Modal | Updates `doctors` table |
| **Delete Doctor** | Red Ghost Icon Button | Tap | Confirmation modal to soft-delete doctor | Updates `doctors.is_active = false` |

---

### PAGE 24: Surgery Packages & Transparent Tariff Catalog Screen
- **Route**: `/hospital/packages`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: Package cards with all-inclusive price, stay duration, room category, price-lock guarantee badge, EMI badge, and Add Package modal.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **+ Create New Package** | Primary Teal Solid | Tap | Opens Create Package Modal | UI state |
| **Price-Lock Guarantee Toggle**| Switch Toggle | Tap | Guarantees no unexpected out-of-pocket charges | Sets `package_lock_available = true` |
| **EMI Available Toggle** | Switch Toggle | Tap | Enables 0% interest EMI options | Sets `emi_available = true` |
| **Edit Package** | Slate Outline with Edit3 | Tap | Opens Edit Package Modal | Updates `treatment_packages` |
| **Delete Package** | Red Ghost Icon Button | Tap | Deletes or archives package | Deletes from `treatment_packages` |

---

### PAGE 25: Hospital Transparency Score & Quality Compliance Screen
- **Route**: `/hospital/transparency`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: Overall Transparency Score ring (0-100), audit factor breakdown (Price accuracy, bed telemetry freshness, doctor verification), Recalculate Score button, and improvement action cards.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Recalculate Score Now** | Primary Teal Solid with RefreshCw | Tap | Triggers instant server-side scoring audit | `supabase.rpc('calculate_hospital_transparency_score')` |
| **Publish Missing Tariff**| Emerald Success Solid | Tap | Navigates directly to `/hospital/packages` to add procedures | Client route |
| **Update Bed Telemetry** | Amber Solid | Tap | Navigates directly to `/hospital/beds` | Client route |

---

### PAGE 26: Hospital Settings & API Configuration Screen
- **Route**: `/hospital/settings`
- **Role**: `hospital_admin`, `hospital_staff`
- **Mobile Layout**: General settings tab (Auto-accept emergency toggle, slot duration), Notifications tab (SMS, triage audio chime), API tab (secret key, copy button), and Save Changes CTA.

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Auto-Accept Emergency Switch**| Switch Toggle | Tap | Enables auto-hold of trauma beds on incoming SOS | Updates hospital settings |
| **Triage Audio Chime Switch**| Switch Toggle | Tap | Enables audible alert on reception devices during SOS dispatch | Local device audio setting |
| **Copy API Secret Key** | Icon Button with Copy | Tap | Copies hospital integration API key | Clipboard API |
| **Save Settings Changes** | Primary Teal Solid | Tap | Persists configuration settings | Saves to `hospital_settings` |

---

### PAGE 27: Dynamic Multi-Modal AI Clinical Triage Modal
- **Component**: `AIFindCareModal.jsx`
- **Route / Trigger**: Accessible from `AppNavbar.jsx` (`+ Find Care`), `HospitalMarketplace.jsx`, and `LandingPage.jsx`
- **Role**: Public / Guest & Patient (`optionalAuth` supported)
- **Modal Layout**: Multi-tab clinical intake modal featuring 4 distinct modes, dynamic Gemini AI triage processing, urgency scoring, doctor consultation cards, and pre-filtered marketplace redirection.

#### Component Hierarchy
- `ModalHeader` (Sparkle badge, "Find the Right Healthcare", dismiss button)
- `IntakeModeTabs`:
  1. `Search Department`: 1-click grid of 12+ specialties (Cardiology, Orthopedics, Neurology, Pediatrics, etc.)
  2. `Enter Symptoms`: Clean textarea for descriptive patient health complaints + `[Analyze Symptoms →]` button
  3. `Voice Symptoms`: Web Speech API audio intake with live visualizer, transcript deduplication, and `[Find Right Care →]` trigger
  4. `Upload Report`: Drag-and-drop clinical lab report dropzone for Gemini document parsing
- `DynamicAiResultsContainer` (Shown once analysis completes):
  - `HeroRecommendationCard`:
    - Department name with dynamic Lucide icon (`Brain` for Neuro, `Activity` for Ortho, `Heart` for Cardio, `Eye` for Ophthal, `Baby` for Pediatrics, `Stethoscope` for Medicine)
    - Triage Urgency Badge (`Emergency` [Crimson], `Urgent` [Amber], `Routine` [Emerald])
    - Plain-English clinical reasoning and key symptom tags
    - Action CTA: `[Browse {Department} Hospitals in {City} →]`
  - `MatchedSpecialistsSection`:
    - Renders top verified doctor cards queried live from `public.doctors` matching predicted specialty
    - Displays doctor portrait, experience, qualification, hospital affiliation, and consultation fee (₹)
    - `[Book Appointment]` button opening appointment reservation modal

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Analyze Symptoms** | Primary Blue Solid | Tap | Submits narrative to Gemini triage engine | `POST /api/v1/ai/recommend` |
| **Start Voice Dictation** | Red/Blue Mic Pulse | Tap | Activates Web Speech API listening loop | Browser SpeechRecognition API |
| **Browse Department Hospitals** | Emerald Solid | Tap | Redirects to `/app/hospitals?specialty={dept}&city={city}` | Client route with query params |
| **Doctor Book Consultation**| Royal Blue Solid | Tap | Opens `BookAppointmentModal` for matched doctor | `POST /api/v1/bookings` |

---

### PAGE 28: Platform Master Admin Verification & Credential Audit Portal
- **Component**: `AdminVerification.jsx` & `AuditDetailModal.jsx`
- **Route**: `/admin/verification` (also mounted inside `AdminDashboard.jsx`)
- **Role**: `platform_admin` (Master Admin: `hiteshkumar240520040@gmail.com`)
- **Layout**: Moderation console with summary KPI counters, 3-tab review table (`Pending Verification`, `Verified Institutions`, `Rejected Applications`), and side-by-side document inspection modal.

#### Component Hierarchy
- `AdminHeader` (Super-Admin status badge, platform telemetry summary)
- `VerificationKpiRow` (Pending Verifications, Active Facilities, Rejections, Average Verification SLA)
- `ModerationTabs` (`Pending [N]`, `Verified [N]`, `Rejected [N]`)
- `HospitalVerificationTable`:
  - Hospital Name, License / Registration Number, Facility Type, City/State, Application Date
  - Accreditations Pill (`NABH`, `JCI`, `Govt Certified`)
  - Action CTA: `[Inspect Credentials & Audit]`
- `AuditDetailModal` (Side-by-side inspection):
  - Left pane: PDF/Image viewer for medical establishment license and council registration
  - Right pane: Metadata checklist (Bed capacity declaration, trauma unit, doctor count, address)
  - Audit Notes textarea
  - Footer Action: `[Approve & Verify Facility]` (Green) vs `[Reject Application]` (Red)

#### Functional Buttons & Interactive Controls
| Button / Control | Variant | Trigger / Handler | Target Navigation / Action | Backend Wiring |
|---|---|---|---|---|
| **Inspect Credentials** | Slate Outline | Tap | Opens `AuditDetailModal` with full documents | Reads `hospital_documents` & `hospitals` |
| **Approve & Verify Facility** | Emerald Success Solid | Tap | Updates hospital status to `verified`, logs audit | `POST /api/v1/admin/hospitals/:id/verify` |
| **Reject Application** | Crimson Alert Solid | Tap | Updates hospital status to `rejected` with notes | `POST /api/v1/admin/hospitals/:id/reject` |

---

## 4. Supabase Database Wiring & Realtime CDC Channels


### 4.1 Core Tables & Field Mappings
| Table Name | Entity | Critical Columns for Mobile App Binding |
|---|---|---|
| `profiles` | Auth User | `id`, `email`, `role`, `full_name`, `phone` |
| `patient_profiles` | Patient Demographics | `user_id`, `abha_id`, `blood_group`, `emergency_contact_phone`, `kyc_status`, `aadhaar_number` |
| `hospitals` | Hospital Registry | `id`, `name`, `city`, `address`, `latitude`, `longitude`, `transparency_score`, `emergency_available`, `rating` |
| `hospital_beds` | Live Bed Inventory | `hospital_id`, `bed_type_id`, `total_beds`, `occupied_beds`, `reserved_beds`, `available_beds`, `price_per_day` |
| `bed_reservations` | Digital Bed Holds | `patient_id`, `hospital_id`, `bed_type_id`, `status`, `reservation_code`, `expires_at` |
| `hospital_admissions`| Admitted Patients | `reservation_id`, `hospital_id`, `patient_id`, `bed_number`, `admitted_at`, `discharged_at`, `status` |
| `doctors` | Clinical Specialists | `hospital_id`, `name`, `specialization`, `qualification`, `experience_years`, `consultation_fee`, `is_active` |
| `doctor_appointments`| OPD Consultations | `patient_id`, `doctor_id`, `hospital_id`, `appointment_date`, `appointment_time`, `consultation_type`, `status` |
| `treatment_packages`| Published Surgery Rates| `hospital_id`, `name`, `price`, `duration_days`, `room_category`, `included_services`, `package_lock_available` |
| `bills` | Uploaded Medical Bills | `patient_id`, `hospital_id`, `total_amount`, `bill_shock_index`, `benchmark_delta`, `status` |
| `emergency_sessions` | 1-Tap SOS Sessions | `patient_id`, `status`, `patient_latitude`, `patient_longitude`, `patient_address` |
| `emergency_dispatches`| Ambulance Linkage | `session_id`, `hospital_id`, `ambulance_id`, `status`, `eta_minutes`, `vehicle_latitude`, `vehicle_longitude` |

### 4.2 Realtime CDC Subscriptions
1. **Live Bed Telemetry Channel**:
   ```javascript
   supabase
     .channel('realtime_beds')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'hospital_beds' }, (payload) => {
       updateBedCounters(payload.new);
     })
     .subscribe();
   ```
2. **Emergency Ambulance Live GPS Tracking Channel**:
   ```javascript
   supabase
     .channel(`emergency_dispatch_${sessionId}`)
     .on('postgres_changes', { 
       event: 'UPDATE', 
       schema: 'public', 
       table: 'emergency_dispatches', 
       filter: `session_id=eq.${sessionId}` 
     }, (payload) => {
       updateAmbulanceMarker(payload.new.vehicle_latitude, payload.new.vehicle_longitude, payload.new.eta_minutes);
     })
     .subscribe();
   ```
3. **Incoming Bed Reservation Triage Channel**:
   ```javascript
   supabase
     .channel(`hospital_triage_${hospitalId}`)
     .on('postgres_changes', { 
       event: '*', 
       schema: 'public', 
       table: 'bed_reservations', 
       filter: `hospital_id=eq.${hospitalId}` 
     }, (payload) => {
       playTriageChime();
       refreshInpatientQueue();
     })
     .subscribe();
   ```

---

## 5. Stitch MCP Integration & Direct Mobile Generation Guide

### 5.1 Stitch MCP Status & Active Projects
Stitch MCP is **already connected, authenticated, and active** in this environment!
Existing accessible projects include:
- `projects/15820155749744885577` — **OpenHealth Decision Platform** (Device Type: `MOBILE`, Theme: Clinical Precision)
- `projects/7924477696204233891` — **App UI Studio** (Device Type: `MOBILE`)
- `projects/8824250515519246087` — **OpenHealth Cinematic Experience** (Device Type: `DESKTOP`, Theme: Cinematic Health)

### 5.2 How to Generate Any Screen Directly via Stitch MCP
We can trigger screen generation using the tool `call_mcp_tool` with:
- **ServerName**: `"StitchMCP"`
- **ToolName**: `"generate_screen_from_text"`
- **Arguments**:
  ```json
  {
    "projectId": "15820155749744885577",
    "deviceType": "MOBILE",
    "prompt": "Generate [Page Name] matching the OpenHealth specification..."
  }
  ```

---
*Document Version: 2.0.0 — Definitive Page-by-Page Specification for OpenHealth Mobile Generation.*
