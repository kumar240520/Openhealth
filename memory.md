# OpenHealth — Development Memory

## Current Project Status

- Full Supabase PostgreSQL schema deployed (33 core tables with RLS, triggers, functions, and seed data).
- Real Supabase Authentication integrated with Google SMTP for pure numeric 6-digit OTP delivery (no external magic links).
- Complete Role-Based Access Control (RBAC) implemented across database, auth triggers, client routing, and operational dashboards.
- Dynamic Mobile Number and Hospital/Organization anti-similarity fuzzy matching validation active.
- Document 3 (Complete Web App Frontend Blueprint) analyzed and ready for page-by-page implementation and backend connectivity.

## Current Phase

Phase 2 — Role-Based Application Pages & Backend API Connectivity

## Completed Milestones

### 1. Database & Security Infrastructure (Phase 1)
- 33 PostgreSQL tables created across 15 migrations with 100% RLS coverage and deterministic security helper functions.
- Auto-provisioning trigger `handle_new_user` updated to create `public.profiles` (`role`), `public.patient_profiles`, `public.hospitals` + `hospital_memberships`, or `public.insurance_providers` + `insurance_memberships` upon OTP confirmation.
- Defense-in-depth trigger `prevent_client_role_change` updated to protect roles while permitting database administrator changes.
- Automated anti-similarity fuzzy matching engine `check_org_name_conflict` deployed using `pg_trgm` to block duplicate or conflicting hospital and organization registrations.
- Mobile number validation and identifier lookup RPCs (`check_phone_exists`, `get_email_by_identifier`) deployed.

### 2. Authentication & RBAC System (Phase 1 / Phase 2)
- Supabase Auth connected with persistent session management in `frontend/src/lib/supabaseClient.js` and `frontend/src/context/AuthContext.jsx`.
- Google SMTP configured on Port 587 (STARTTLS) with dark-mode responsive pure numeric 6-digit OTP template.
- Dual authentication methods supported on `/login`: Password Login and 6-Digit Pure Numeric OTP Login with Email or 10-Digit Mobile Number identifier.
- Role-based Protected Route component `ProtectedRoute.jsx` guarding all role-specific operational dashboards.
- Automatic role routing upon login and signup verification (`patient` -> `/dashboard/patient`, `hospital_admin` -> `/dashboard/hospital`, `insurance_user` -> `/dashboard/provider`, `platform_admin` -> `/dashboard/admin`).

### 3. Frontend Experience & Real Database Pipelining (Phase 1 / Phase 2)
- Interactive Landing Page (`LandingPage.jsx`) with 6 interactive chapters, smooth snap scrolling, glassmorphism, and 1-tap Emergency trigger.
- High-contrast Auth UI (`Login.jsx`, `SignUp.jsx`, `ForgotPassword.jsx`) with sliding account-type selectors and OTP input boxes.
- **Rule 25 (Zero Mock Data Principle)** integrated into `rules.md`: All dashboard cards, metrics, telemetry charts, and history feeds must be 100% live-pipelined from Supabase PostgreSQL queries and RPCs without any hardcoded mock numbers.
- **Rule 26 (Dynamic Database Schema Extension & Field Management Rule)** integrated into `rules.md`:
  - When new form fields or entity attributes are required, database schemas must be immediately extended with clean relational integrity across `profiles`, `patient_profiles`, and operational tables.
  - Strict one-time lifecycle gating: If a user logs out without completing onboarding, subsequent logins force them back to the wizard until finished. Once finished (`onboarding_completed: true`), the wizard never reloads and fast-forwards straight to the dashboard.
- **Rule 27 (Sequential Feature Workflow: Frontend & Database First, Backend Upon Approval)** integrated into `rules.md`:
  - Build frontend UI components and pipeline them with Supabase PostgreSQL tables & RPCs first.
  - Test, review, and iterate on all UI layout, spacing, and data connections with the USER until 100% satisfaction.
  - Build the corresponding Express.js routes, controllers, and backend services only after the USER explicitly approves the frontend.
### 5. Master Fixed Navigation & Light Expandable Hover Sidebar (`AppSidebar.jsx` & `AppNavbar.jsx`)
- **Single Master Top Navbar (`AppNavbar.jsx`)**:
  - Pinned fixed at the top across the entire website (`fixed top-0 left-0 lg:left-[72px] right-0 h-16 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs`).
  - Does not scroll with content.
- **Light-Colored Expandable Hover Sidebar (`AppSidebar.jsx`)**:
  - Pinned on the left (`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-slate-200/90 shadow-[4px_0_24px_rgba(0,0,0,0.06)]`).
  - **Expand on Hover Interaction** (inspired by `ScrollProgress.jsx` rail):
    - Idle state: Slim 72px rail showing clean centered icon boxes, brand icon, and avatar.
    - Hover state (`onMouseEnter`): Expands smoothly via `framer-motion` spring to 260px wide, revealing full text, section headers, and user info.
    - Mouse leave (`onMouseLeave`): Smoothly collapses back to 72px.
  - **Pixel-Perfect Items from User Reference Image**:
    - **PRIMARY NAVIGATION**:
      - ⊞ **Dashboard** (`/dashboard/patient`) - Solid royal blue box selection (`bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25`)
      - 🏢 **Hospitals** (`/app/hospitals`)
      - 🩺 **Doctors** (`/app/doctors`)
      - 🔔 **Emergency** (`/app/emergency` - red alert text & icon)
      - 📄 **Documents** (`/app/documents`)
      - 🛡️ **Costs & Coverage** (`/app/schemes`)
      - 💵 **Bills** (`/app/bills`)
      - 📅 **Bookings** (`/app/bookings`)
      - 🔖 **Saved** (`/app/saved`)
    - **BOTTOM NAVIGATION**:
      - ⚙️ **Settings** (`/app/settings`)
      - 👤 **Profile** (`/app/profile`)
      - 🚪 **Logout** (`signOut` - red alert text & icon)
    - **User Profile Card**:
      - Circular blue avatar with `H` initial
      - Name: **Hitesh Kumar**
      - Subtitle: `Patient Account`
  - **PatientDashboard Unified**: Removed legacy black/navy inline sidebar completely from `PatientDashboard.jsx` and wrapped it in `AppLayout`. Now the patient dashboard, hospitals marketplace, and hospital details pages all share the identical light-colored expandable hover sidebar and fixed top navbar.
  - **Rule 28 Added to `rules.md`**: Strict rule established that all newly created application pages and views MUST always use `AppLayout` with the new light-colored expandable hover `AppSidebar` and fixed `AppNavbar`. Legacy black sidebars are strictly forbidden.
  - **Responsive Global Navbar (`AppNavbar.jsx`)**:
    - **Framer Motion Spring Synchronization**: `AppNavbar` is now a `motion.header` that receives `isSidebarHovered` from `AppLayout`. It animates its `left` position (`left: isSidebarHovered ? 260 : 72`) using the exact same spring physics (`type: 'spring', stiffness: 350, damping: 30`) as `AppSidebar`.
    - **Content Container Spring Sync**: `AppLayout` animates its content padding (`paddingLeft: sidebarHovered ? 260 : 72`) with identical spring physics, ensuring sidebar, top navbar, and content container move in 100% lockstep without lag or jitter.
    - **Omni Search Bar Centered in Middle of the Page**: Shifted search box completely out of the left corner into the true geometric center of the page (`absolute left-1/2 -translate-x-1/2 w-full max-w-sm sm:max-w-md lg:max-w-xl`).
    - **Balanced Navbar Layout**: Left side displays the mobile menu toggle and brand context; right side displays the location pill (`📍 Indore, MP`), `+ Find Care` CTA, notifications center with live unread badge, and patient profile avatar menu.
  - **Pill Capsule Quick Jump Bar (`HospitalDetails.jsx`)**:
    - Transformed quick jump section navigation into the exact pill capsule design from the reference image (`rounded-full` container, solid blue active pill, soft counter badges).
### 6. Hospital Product Description Page (Amazon-Style Sticky Product Detail Layout) (`/app/hospitals/:id`)
- **True Amazon-Style Sticky Product Detail Architecture** (`HospitalDetails.jsx`):
  - **Two-Column Desktop Grid with `items-start relative`**:
    - **Left Column (`lg:sticky lg:top-20 lg:self-start z-10`)**:
      - Interactive 5-photo thumbnail gallery (Building Exterior, Outpatient Reception/Lobby, ICU Unit, Modular Operation Theater, Deluxe Room) with instant image swap on thumbnail click.
      - Sticky Admission & Action "Buy Box": Real-time bed indicators (`3 ICU & 18 General Vacant`), primary **Instant Bed Hold (30-min Reserve)** button, secondary **Book Doctor Consultation** button, 24/7 trauma emergency hotline pill, and OpenHealth Price Lock Guarantee badge.
      - **Completely Fixed in Viewport**: Stays pinned in the viewport while the right column scrolls, and **stops naturally** at the exact bottom boundary of the parent hospital section without overlapping or jumping.
    - **Right Column (Normal Upward Scrolling Content)**:
      - **Hospital Brand Header**: Hospital Title, Address, Star Rating `★ 4.5 (256 verified reviews)`, Operating Hours (`Open • Closes 10:00 PM`), and NABH/JCI & PM-JAY Badges.
      - **Amazon-Style Offers & Scheme Box**: Highlight banner for PM-JAY (₹5,00,000 Free Hospitalisation) and Instant Cashless TPA Pre-Authorization.
      - **Small Icon-Based Feature Micro-Cards**: 🛏️ 80+ Bed Capacity, 🩺 24/7 ICU Unit, 🛡️ PM-JAY / CGHS Empanelled, 💳 100% Cashless Insurance.
      - **In-Page Jump Pill Bar**: Fast 1-click smooth jump to any section.
      - **Vertical Clinical Sections (One by One Downside)**:
        1. *Overview & Facilities*: Mission bio, established year, and 9-item infrastructure grid.
        2. *Live Bed Inventory & Ward Capacity*: Capacity breakdown across ICU, HDU, General Ward, NICU, PICU, Isolation with vacancy badges and 1-click hold.
        3. *Specialists & Clinical Faculty*: Verified doctor cards with photo, qualifications, experience, consultation fee, and booking action.
        4. *Transparent Treatment Packages*: Fixed all-inclusive surgery packages with duration, room category, explicit inclusions, and Price Lock Guarantee.
        5. *100% Cashless Schemes & TPA Partners*: Government schemes (PM-JAY, CGHS, ESIC, State BPL) and 8+ private TPA insurance partners.
        6. *OpenHealth Transparency Scorecard*: 6-factor weighted scorecard (91%) and verified patient reviews.
  - **Responsive**: Stacks gracefully into single column on mobile/tablet without side overflows.
- Deployed PostgreSQL Database Objects:
  - Table `public.hospital_comparisons` with RLS (`patient_manage_own_comparisons`).
  - Added onboarding & KYC fields to `profiles` and `patient_profiles` (`age`, `blood_group`, `family_members_count`, `height_cm`, `weight_kg`, `aadhaar_number`, `govt_id_type`, `insurance_policy_url`, `abha_id`, `kyc_status`, `onboarding_completed`).
  - Stored Procedure `public.get_patient_dashboard_data(p_period)` calculating real metrics, activity chart, unread notifications, and recent searches for `auth.uid()`.
  - Stored Procedure `public.log_patient_search(p_query, p_location)` recording real searches to `public.search_history`.
  - Stored Procedure `public.save_patient_onboarding(p_step, p_data)` handling full column pipelining across `profiles` and `patient_profiles` (`city`, `state`, `postal_code`, `preferred_language`, `emergency_contact_name`, `emergency_contact_phone`, `govt_id_number`, etc.) with `ON CONFLICT (user_id)` upserts.
### 4. Express.js REST API Backend Architecture (PORT 5000)
- **Core Server & Security Infrastructure**:
  - `backend/package.json`: Node dependencies (`express`, `@supabase/supabase-js`, `cors`, `helmet`, `morgan`, `dotenv`, `express-validator`).
  - `backend/src/server.js`: Server listener on `http://localhost:5000` with graceful SIGTERM/SIGINT teardown.
  - `backend/src/app.js`: Configured with CORS for frontend (`http://localhost:5173`), Helmet security headers, Morgan request logging, 10MB JSON body limit, and `/api/health` health check.
  - `backend/src/config/env.js` & `backend/src/config/supabase.js`: Privileged Supabase Admin client with `SUPABASE_SERVICE_ROLE_KEY` for server-side stored procedure execution and anonymous client for verification.
- **Middleware Layer**:
  - `backend/src/middleware/authMiddleware.js`: Validates Supabase JWT bearer tokens, resolves caller profile, and binds `req.user`, `req.userId`, and `req.userRole`.
  - `backend/src/middleware/roleMiddleware.js`: Enforces strict RBAC role protection (`patient`, `hospital_admin`, `platform_admin`).
  - `backend/src/middleware/errorHandler.js`: Formats standardized JSON error responses with status codes.
- **Controllers & Business Logic**:
  - `authController.js`: Pre-registration availability checks (`checkEmailAvailability`, `checkPhoneAvailability`), organization similarity detection (`checkOrgSimilarity`), and phone-to-email identifier resolution (`resolveIdentifier`).
  - `patientController.js`: Onboarding steps execution (`saveOnboarding` for Step 1, Step 2, and Step 3), complete profile retrieval (`getProfile`), and live location preference updates (`updateLocation`).
  - `dashboardController.js`: Patient dashboard telemetry aggregation (`getPatientDashboard`) pulling live metrics, upcoming bookings, analyzed records, and activity charts.
  - `notificationController.js`: Notification list retrieval (`getNotifications`), single mark-as-read (`markRead`), and bulk mark-all-as-read (`markAllRead`).
  - `searchController.js`: Telemetry query logging (`logSearch`) into `search_history` and recent searches retrieval (`getRecentSearches`).
- **REST API Routes (`/api/v1`)**:
  - `POST /api/v1/auth/check-email`
  - `POST /api/v1/auth/check-phone`
  - `POST /api/v1/auth/check-org`
  - `POST /api/v1/auth/resolve-identifier`
  - `POST /api/v1/patient/onboarding` (Protected, `patient` role)
  - `GET /api/v1/patient/profile` (Protected, `patient` role)
  - `PATCH /api/v1/patient/location` (Protected, `patient` role)
  - `GET /api/v1/dashboard/patient` (Protected, `patient` role)
  - `GET /api/v1/notifications` (Protected)
  - `PATCH /api/v1/notifications/:id/read` (Protected)
  - `PATCH /api/v1/notifications/mark-all-read` (Protected)
  - `POST /api/v1/search/log` (Protected)
  - `GET /api/v1/search/recent` (Protected)
- **Automated Verification**:
  - Verified with 100% pass rate via `scratch/test_backend_api.js` and `scratch/test_authenticated_flow.js`.
  - Interactive **Smart Care Overview** Spline Chart (Recharts) with clean decoupled `h-60` viewport, period filter (`This Week`, `This Month`, `Past 3 Months`), and real activity telemetry.
  - **Emergency Access Card** and **Health Tip Card** with balanced typography (`text-sm font-extrabold`), comfortable padding, and 3D vector graphics.
  - **Dedicated Full-Width 4-Card Horizontal KPI Row**: Standalone cards (Searches, Comparisons, Reservations, Bill Savings Est.) with generous `px-6 py-5` internal padding, compact font scales (`text-xl font-black`, `text-xs` labels), `w-10 h-10` icons, and dynamic period-over-period trend calculations.
  - **Recent Searches Card**: Displays real `search_history` items with relative timestamps or clean empty state for new users.
- Operational portal dashboards created:
  - `PatientDashboard.jsx` (100% Live DB Pipelined Patient command center)
  - `HospitalDashboard.jsx` (Real-time ICU/General bed inventory manager, ER status toggle)
  - `ProviderDashboard.jsx` (Government scheme claims adjudication, ambulance fleet monitor)
### 8. Phase 2: Hospital Discovery Suite Backend Microservices
- **Services & Allocation Engine**:
  - `hospitalService.js`: Multi-criteria marketplace search, city filtering, transparency scoring, relational joins (`hospital_beds`, `bed_types`, `doctors`, `treatment_packages`, `government_schemes`, `insurance_providers`), and patient hospital bookmarks.
  - `bedService.js`: Implements strict bed invariant checks (Rule 17.1), 30-minute hold lock reservation with expiry timer (`status: 'held'`, Rule 17.3), instant cancellation/release returning beds to public inventory (Rule 17.2), and automated cleanup of expired holds.
- **Validators & Controllers**:
  - `hospitalValidators.js`: Query parameters (score, pagination, sorting) and bed hold body validation.
  - `hospitalController.js`: Full orchestration of discovery, profile, beds, doctors, packages, schemes, bookmarks, and bed holds with standard error formats.
- **REST Endpoints (`/api/v1/hospitals`)**:
  - `GET /api/v1/hospitals`: Public marketplace discovery & filtering
  - `GET /api/v1/hospitals/:id`: Full clinical hospital profile
  - `GET /api/v1/hospitals/:id/beds`: Live bed availability
  - `GET /api/v1/hospitals/:id/doctors`: Verified doctor specialists
  - `GET /api/v1/hospitals/:id/packages`: Treatment packages
  - `GET /api/v1/hospitals/:id/schemes`: Government schemes & cashless insurance TPAs
  - `POST /api/v1/hospitals/:id/save`: Patient hospital bookmark toggle (Protected)
  - `GET /api/v1/hospitals/saved/list`: Patient saved hospital list (Protected)
  - `POST /api/v1/hospitals/:id/hold-bed`: Guaranteed 30-minute bed hold (Protected)
  - `POST /api/v1/hospitals/hold-bed/:holdId/release`: Instant bed hold release (Protected)
- **Verification**:
  - 100% verified via `backend/test_hospital_discovery.js` testing both public clinical queries and authenticated 30-minute bed hold lifecycles.
  - `AdminDashboard.jsx` (Hospital verification approval queue, platform telemetry)

### 9. Frontend Bed Hold Decrement & Omni-Search Synchronization Fixes
- **Backend Service Started**: Express API server active on `http://localhost:5000` (`/api/v1/hospitals`).
- **Live Bed Hold & Real-time Decrement (`CheckBedsModal.jsx`)**:
  - Replaced legacy simulation with live calls to `POST /api/v1/hospitals/:id/hold-bed` (with direct Supabase fallback).
  - Implemented real-time inventory decrement (`available_beds - 1`, `reserved_beds + 1`) in PostgreSQL and component state.
  - Implemented `onBedHoldSuccess` callback notifying parent pages (`HospitalMarketplace.jsx`, `HospitalDetails.jsx`) to decrement available beds immediately on the page.
  - Integrated 30-minute countdown timer and instant "Release Bed" button returning capacity to inventory.
- **Search & Filter Synchronization (`AppNavbar.jsx` & `HospitalMarketplace.jsx`)**:
  - Connected `useSearchParams` across navbar and marketplace.
  - Implemented multi-field text search (hospital name, specialties, description, address, city, and type).
  - Added in-page search input with instant clear and quick specialty filter chips.
  - Robust city and scheme filtering (cleaning trailing `, MP` format and matching Ayushman / CGHS).

### 11. Atomic Database Bed Inventory Decrement & Release Architecture
- **Root Cause of Previous Bed Count Failure**:
  - `hospitalValidators.js` rejected UI bed names like `'ICU Bed'` or `'General Ward'` because it checked strict equality against `'ICU'` / `'General'`, returning HTTP 400.
  - When the frontend fell back to direct client `supabase.from('hospital_beds').update()`, PostgreSQL Row Level Security (RLS) silently rejected updates from regular patients.
  - `bedService.js` referenced non-existent column `hospitals.available_beds` and queried `hospital_beds` by `reservation.bed_type_id` as primary key on release.
- **PostgreSQL Atomic Functions (`hold_bed_atomic` & `release_bed_atomic`)**:
  - Created `public.hold_bed_atomic` with `SECURITY DEFINER` and row-level locking (`FOR UPDATE`).
  - Automatically resolves patient profile and decrements `available_beds` while incrementing `reserved_beds` in `hospital_beds`.
  - Created `public.release_bed_atomic` with row-level locking to cancel reservations and restore beds to inventory.
  - Granted execute permissions to `authenticated`, `anon`, and `service_role`.
- **Express Backend Updates**:
  - Updated `hospitalValidators.validateBedHold` to normalize flexible bed type names (`ICU Bed`, `General Ward`, `Pediatric ICU`, etc.).
  - Updated `bedService.js` to correctly update `hospital_beds` and query by `(hospital_id, bed_type_id)` on release.
- **Frontend Dual-Resilience (`CheckBedsModal.jsx`)**:
  - Invokes `supabase.rpc('hold_bed_atomic')` directly for instant database-level locking and bed decrement.
  - Falls back seamlessly to Express `/api/v1/hospitals/:id/hold-bed`.
  - Restores bed count on release via `supabase.rpc('release_bed_atomic')`.
  - Decrements on-screen bed counts immediately via `onBedHoldSuccess`.

### 12. Unified Single-Command Runner & Enhanced CORS Architecture
- **Dynamic CORS Policy (`backend/src/app.js`)**:
  - Configured dynamic origin validation supporting all development ports (`http://localhost:*`, `http://127.0.0.1:*`, `http://localhost:3000`, `http://localhost:5173`).
  - Added explicit preflight handler (`app.options('*', cors())`) and allowed headers (`Content-Type`, `Authorization`, `X-Requested-With`, `Accept`).
- **Root `package.json` & Concurrently (`package.json`)**:
  - Configured `concurrently` to run both backend (port 5000) and frontend (port 3000) with color-coded log streams (`cyan.bold` for backend, `green.bold` for frontend).
  - Configured scripts: `npm run dev` (concurrently), `npm start` (zero-dependency node runner), `npm run dev:backend`, and `npm run dev:frontend`.
- **Zero-Dependency Runner (`start-dev.js`) & Windows Batch Script (`start.bat`)**:
  - Created `start-dev.js` utilizing native Node `child_process.spawn` for immediate execution without prerequisites.
  - Handles graceful cross-platform process termination on SIGINT / SIGTERM / Ctrl+C.
  - Created `start.bat` enabling 1-click execution on Windows.

### 13. Comprehensive Backend-to-Frontend Wiring Verification (26/26 Passed)
- **Live Test Suite (`scratch/reverify_backend_frontend_wiring.js`)**:
  - Service Health (`/api/health`) & Root API Gateway (`/`) returned 200 OK.
  - CORS Headers from `http://localhost:3000`: `Access-Control-Allow-Origin: http://localhost:3000` & `Access-Control-Allow-Credentials: true` verified.
  - Public Discovery (`/api/v1/hospitals`): Returns all 12 hospitals; query search (`q` / `search`) and city filters verified.
  - Clinical Details & Beds (`/hospitals/:id` and `/beds`): Returns verified facilities, doctors, and packages.
  - Express 30-Min Bed Hold Lifecycle: Atomically decremented PostgreSQL `available_beds`, enforced 30-minute lock, released and restored capacity to initial state.
  - Direct PostgreSQL Atomic RPCs (`hold_bed_atomic` & `release_bed_atomic`): Verified row-level locking with `SECURITY DEFINER` bypassing patient RLS.
  - Patient Bookmarks (`/save` & `/saved/list`): Verified bookmark toggle and list loading.
  - Frontend Component Compilation: `HospitalMarketplace`, `HospitalDetails`, `HospitalCard`, `CheckBedsModal`, `FilterDrawer`, and `AppNavbar` all returning 200 OK.

### 14. Direct Navigation to Hospital Details (Quick View Modal Removed)
- **Direct Redirection on Card Click**:
  - Updated `HospitalCard.jsx` card wrapper `onClick` to navigate directly to `/app/hospitals/${hospital.id}` without showing any pop-up.
  - Updated the "View Details" button to also navigate directly to `/app/hospitals/${hospital.id}`.
- **Removed Quick View Popup from Marketplace**:
  - Removed `HospitalQuickViewModal` import and rendering from `HospitalMarketplace.jsx`.
  - Removed `quickViewHospital` state and `onQuickView` callback.
  - Preserved direct bed reservation access via "Check Beds" CTA opening `<CheckBedsModal>`.

### 15. 30-Minute Bed Hold Expiration & Automatic Vacancy Restoration (Rules 17.1, 17.2, 17.3)
- **PostgreSQL Atomic Expiry Function (`expire_stale_bed_holds`)**:
  - Automatically queries all reservations where `status = 'held' AND expires_at < now()`.
  - Atomically marks reservations as `expired`.
  - Atomically increments `available_beds` (+1) and decrements `reserved_beds` (-1) in `hospital_beds` using row-level locking (`FOR UPDATE SKIP LOCKED`).
- **Background Backend Sweeper (`server.js` & `bedService.js`)**:
  - Added a 60-second recurring background interval in `server.js` executing `cleanupExpiredHolds()`.
  - Ensures beds become vacant automatically even if patient disconnects, closes the browser, or walks away.
- **Frontend Real-time Expiration Handling (`CheckBedsModal.jsx`)**:
  - When the 30-minute countdown reaches `00:00`, triggers `handleHoldExpired()`.
  - Immediately restores vacant bed count in local state and releases reservation in PostgreSQL.
  - Fires `onBedRelease` callback to `HospitalMarketplace.jsx` and `HospitalDetails.jsx` to increase vacant bed count on-screen without page reload.
  - Displays a prominent amber notification banner explaining that the 30-minute window expired and the bed is now vacant for other patients.

### 16. Phase 3: Doctor Marketplace & Doctor Description Page
- **Reference Image Match**:
  - Implemented `DoctorMarketplace.jsx` (`/app/doctors` and `/doctors`) using `AppLayout` with `AppSidebar` ("Doctors" active) and `AppNavbar`.
  - Header: "Doctors in Indore", dynamic doctors count.
  - Controls Toolbar: Location pill (`📍 Indore, MP ▾`), Specialty selector, Experience selector, Availability selector, More Filters drawer, Sort by Relevance, and Grid/List view switcher.
  - Reusable `DoctorCard.jsx`: Doctor photo, heart favorite toggle, name, specialty, hospital badge with link, rating & review count, experience, consultation fee, "Available Today" badge, "Book Appointment" solid blue button, "View Profile →" link.
  - Direct Navigation: Clicking anywhere on card or "View Profile →" navigates to `/app/doctors/:id`.
  - Pagination Bar: "Showing 1 to 8 of 71 doctors", page controls `< 1 2 3 ... >`, "Show 8 per page".
- **Doctor Description Page (`DoctorDetails.jsx`) - 100% Documented Specification Parity**:
  - Route: `/app/doctors/:id` and `/doctors/:id`.
  - **Removed Unneeded Hospital Sections** (per user screenshot directive):
    - Removed `Hospital OPD Timings & Chamber Schedule` (was redundant with booking widget).
    - Removed `Department Specialists & Clinical Faculty` (was redundant with doctor marketplace).
    - Removed hospital-level packages and hospital insurance schemes.
  - **Clean 4-Section Right Column Aligned with Document 3 (Section 47 "Doctor Detail")**:
    - **Main Header Card**: Specialization badge, Medical Council verification, live availability, Doctor Name, hospital affiliation, rating, reviews, and 4 small highlight metric cards (Experience, Satisfaction, Consultations, Medical Registration).
    - **1. Doctor Overview & Clinical Philosophy**: Comprehensive clinical bio, 4 metadata items (Specialization, Experience, Languages, Associated Hospital), and Specialization / clinical focus tags.
    - **2. Qualifications, Education & Medical Accreditations**: Degrees, Medical Council Registration (`MP-MC-2012`), and awards/fellowships.
    - **3. Book Doctor Appointment**: Prominent, in-page interactive booking engine (In-Clinic OPD vs Video Consult, Date picker, Morning/Afternoon/Evening slot grid, Patient visit reason, Instant Confirmation receipt with Booking ID).
    - **4. Verified Patient Reviews & Rating Breakdown**: Star rating breakdown and authentic patient testimonials.
  - **Fixed Left Column (Desktop `lg:overflow-hidden`)**:
    - Doctor showcase photo gallery with verified badge, score pill, caption strip, and 5-photo clickable thumbnail strip.
    - Clinical Consultation Desk card with In-Clinic vs Video fee boxes, solid blue "Instant Appointment Booking" button, "View Hospital Profile" link, and contact hotline.
    - Subtle slate borders with zero black dividing lines.
- **Image Loading & Broken URL Resolution**:
  - Identified root cause: `https://images.unsplash.com/photo-1594824813571-638f02610d4f` had become a 404 dead link on Unsplash and was assigned to 26 doctors in Supabase as well as hardcoded as fallback in `DoctorDetails.jsx`, `HospitalDetails.jsx`, `DoctorCard.jsx`, and `BookAppointmentModal.jsx`.
  - Also identified 4 hospital records having null `image_url` in Supabase.
  - Successfully updated all 26 affected doctors and 4 hospitals in Supabase with verified HTTP 200 high-res image URLs.
  - Replaced all frontend fallbacks with verified working URLs and added `e.currentTarget.onerror = null` safeguards across all image components to prevent infinite error loops.
- **Rule 29 Enforced**: Added strict prohibition on git/GitHub commands in `rules.md`. Autonomous local development authority preserved.

### 4. Specification Analysis (Document 3)
- Analyzed 61-page Document 3 (Complete Web App Frontend Blueprint).
- Identified 44 major screens across Public, Patient, Hospital, and Admin suites to build and connect with backend services.

## Technology Stack & Architectural Constraints

- **Frontend**: React (JSX) + Vite + Tailwind CSS + Lucide React + Framer Motion (NO TypeScript).
- **Backend API**: Node.js + Express.js + Layered Controllers & Services under `/api/v1/`.
- **Database & Auth**: Supabase PostgreSQL + Auth + Storage with RLS on all tables.
- **AI Microservice**: Python FastAPI for OCR, PII Masking, and LLM medical document & bill analysis.
- **Design Language**: Dark mode, frosted glassmorphism, high-contrast action buttons, and progressive disclosure.

### 17. Phase 11 & 12: Medical Records, Health Locker & AI Diagnostic Report Analyzer (`/app/documents`)
- **Delivered Production Page (`PatientDocuments.jsx`)**:
  - Replaced temporary placeholder `PatientFeaturePage type="documents"` with full-featured clinical vault.
  - Wrapped inside `AppLayout` with expandable hover sidebar (`AppSidebar` with "Documents" active in royal blue) and fixed top navbar.
  - ABDM / ABHA Health Locker bar with 1-click ABHA ID copy.
  - Real-time KPI tiles for total records, diagnostic reports, AI analyzed files, and 256-bit encryption.
  - Category filtering tabs (`All`, `Lab Reports`, `Prescriptions`, `Discharge Summaries`, `Medical Bills`).
  - Omni-search across filename, hospital, condition, and summary; sort selector (newest, oldest, size); 1-click Card Grid vs Table view toggle.
  - Interactive **AI Lab Report Diagnostic Explainer Modal**: Color-coded biomarker progress range bars (Normal, Low, High) for Hemoglobin, WBC, Platelets, Glucose, Cholesterol, Creatinine with plain-English health interpretations and consultation suggestions.
  - Interactive **Drag & Drop Upload Modal**: Real Supabase Storage upload (`medical-documents` bucket) and instant database record creation.
- **Database Seeding (`016_seed_medical_documents.sql`)**:
  - Populated realistic initial records across Apollo Hospitals, Bombay Hospital, Shalby Hospital, and CityCare Hospital with full JSONB biomarker telemetry.
- **Production Build Verified**:
  - `npm run build` compiled cleanly with 0 errors in 25.16s.

### 18. Phase 13 & 15: My Bills & Hospital Package Comparison Page (`/app/bills`)
- **Pixel-Perfect Implementation from User Screenshot (`PatientBills.jsx`)**:
  - Replaced temporary placeholder `PatientFeaturePage type="bills"` with complete production page.
  - Wrapped inside `AppLayout` with master expandable hover sidebar (`AppSidebar` with "My Bills" active) and fixed top navbar.
  - **Your Uploaded Bills Card**: List of bills (Apollo, Fortis, Max) with interactive 1-click selection updating all metrics on the page.
  - **Selected Treatment Package Card**: Heart Surgery Package at ₹1,50,000 with 6 included services and active validity pill.
  - **Bill Analysis Summary**: 4-column breakdown (Estimate, Final Bill, Difference, Status).
  - **Bill Comparison Table**: 5-column breakdown with exact variances (+₹2,000 on Medications) and amber alert banner.
  - **Why Extra Amount? Box**: Explanatory card with Total Extra Amount callout and "Contact Hospital" modal.
  - **Bill Match Status**: Large green `MATCHED` checkmark card.
  - **Rate Your Experience**: Interactive 5-star rating widget with feedback submission to `public.hospital_reviews`.
  - **Need Help?**: Customer support card with "Talk to Support" hotline modal.
  - **Footer**: OpenHealth transparency guarantee.
- **Database Schema Extensions ([017_bills_schema_extensions.sql](file:///d:/JAVA%20WEBDEV/Open%20health/supabase/migrations/017_bills_schema_extensions.sql))**:
  - Extended `public.bills` (`package_id`, `treatment_name`, `status`, `bill_match_status`, `reason_summary`).
  - Extended `public.bill_line_items` (`package_amount`, `difference_amount`, `difference_reason`, `item_order`).
  - Created `public.hospital_reviews` table for storing star ratings and feedback with RLS.
  - Seeded comparison bills & line items via `018_seed_comparison_bills.sql`.
- **Backend API & Service**: Implemented Express `/api/v1/bills` endpoints with dual-resilient `billService.js`.
- **Bill Card Layout & Package DB Auto-Wiring Fix**:
  - Left card strictly limited to top 3 newest bills (`bills.slice(0, 3)`), preventing card height expansion.
  - Added interactive "View All Bills" modal with live search across all patient bills.
  - Right package card is 100% data-driven from `treatment_packages` (hospital name, package price, duration, and dynamic `included_services` checklist).
  - Added PostgreSQL triggers `trg_auto_link_bill_package` and `trg_auto_create_bill_line_items` to automatically link new uploads with treatment packages and generate itemized comparison lines.
- **Production Build Verified**:
  - `npm run build` compiled cleanly with 0 errors in 13.38s (and subsequent build in 25.01s).

### 19. Medical Reports, Health Timeline & Test Bookings Page (`/app/reports`)
- **Pixel-Perfect Implementation from User Screenshot (`PatientReports.jsx`)**:
  - Built production page mounted at `/app/reports` wrapped inside `AppLayout`.
  - Added `Reports` (`FileCheck` icon) to `AppSidebar.jsx` directly following `My Bills` and preceding `Documents`.
  - **Top Sub-Tabs**: `All Reports`, `Uploaded History`, `My Test Reports`, `Health History` with red underline indicator.
  - **Top 4 Highlight Cards**: `Upload Reports` (soft green), `My Test Reports` (12 Completed), `Uploaded History` (18 Reports), `Health Timeline` (soft orange).
  - **Middle 3-Column Section**:
    - **Upload Drop Zone**: Drag & drop dashed zone with `Choose Files` button, 20MB limit note, and `🔒 Your reports are secure and private`.
    - **Recent Uploaded Reports**: 4 PDF items (MRI Brain 2.4MB, Blood Test 1.8MB, X-Ray Chest 1.2MB, ECG Report 900KB) with category badges (MRI, Pathology, Radiology, Cardiology) and `⋮` menus.
    - **Health Timeline**: Vertical timeline track with green line and circular nodes (Today Blood Test, 28 May ECG, 20 May X-Ray, 15 May Consultation with Dr. R. Sharma, 10 May MRI Brain).
  - **Bottom Section**:
    - **My Test Reports Table**: CBC, Lipid Profile, LFT, Thyroid Profile, Vitamin D Test with `Completed`/`Processing` pills and `📥 Download` actions.
    - **Important Information**: Card with 3 bullet tips covering health history completion, 100% encryption, and automatic hospital sync.
  - **Footer**: Privacy guarantee and `Need Help? Contact Support` link.
- **Database Schema Extensions ([019_reports_and_timeline_schema.sql](file:///d:/JAVA%20WEBDEV/Open%20health/supabase/migrations/019_reports_and_timeline_schema.sql))**:
  - Extended `public.medical_documents` with `report_title`, `category_tag`, `source_type`.
  - Created `public.patient_test_reports` table with RLS for booking-originated tests.
  - Created `public.patient_health_timeline` table with RLS for chronological medical events.
  - Seeded per-user isolated records via `020_seed_reports_and_timeline.sql` enforcing **Rule 30**.
- **Backend API & Service Layer (`/api/v1/reports`)**:
  - `reportService.js`: Aggregates uploaded reports, booking tests, and timeline events; handles uploads.
  - `reportController.js` and `report.routes.js` mounted in `backend/src/routes/index.js`.
  - Dual-resilient frontend wiring in `frontend/src/services/reportService.js`.
- **Verification**:
  - Backend integration test passed 4/4 with strict patient isolation (`test_reports_backend.js`).
  - Vite production build (`npm run build`) succeeded in 28.77s with 0 errors.

### 20. Pop-Up AI Care & Diagnostic Modal (`AIFindCareModal.jsx`)
- **Exact 4-Option Intake & Filtered Page Redirection**:
  - Removed "Upload Your Hospital Bill" from Find Care popup (kept on the Bills & Cost Analysis page).
  - Modal strictly features the 4 options matching Image 2:
    - 1. Search Your Department: 1-click selection immediately redirects to `/app/hospitals?specialty=${dept}`.
    - 2. Enter Your Symptoms: Opens clean "Describe Your Symptoms" box.
    - 3. Tell Your Symptoms Through Voice: Activates Web Speech API voice intake.
    - 4. Upload Your Previous Report: Analyzes medical documents with Gemini 3.6 Flash.
  - "Describe Your Symptoms" box shows speech mic and textarea; once analysis finishes, the green card **"Based on your symptoms, you should consult: [Department]"** appears directly underneath.
  - Clicking the green card redirects to `/app/hospitals?specialty=${primarySpecialty}&city=Indore` with the filter applied.

### 21. Unified Reports & Medical Records Page (`PatientReports.jsx`)
- **Combined Reports & Documents Vault**:
  - Removed `Documents` from sidebar navigation (`AppSidebar.jsx`).
  - Merged reports, prescriptions, discharge summaries, imaging scans, and pathology tests into `PatientReports.jsx`.
  - Added prominent **"✨ AI Report Analyzer"** button at the top header of the Reports page.
  - Inside the AI Report Analyzer modal:
    - Added dedicated **"Analyze My Report"** button below the report selector dropdown.
    - Analysis only begins when the user clicks the button.
    - Full loading state displayed while analyzing; renders complete results (department + biomarker matrix) simultaneously once all data is ready.
  - **Responsive, Keyword-Flexible Search & Filters**:
    - Created `searchMatcher.js` utility with tokenization, stem matching (`orthoped` $\leftrightarrow$ `orthopedic`/`orthopedics`), and clinical synonym expansion (`knee`/`joint`/`bone` $\leftrightarrow$ `ortho`).
    - Upgraded `HospitalMarketplace.jsx` and `DoctorMarketplace.jsx` to return matching results if **any keyword** matches name, specialty, description, or facility attributes.
    - Updated backend `aiRecommendationService.js` to use root keywords (`Ortho`, `Cardio`, `Neuro`, etc.) for doctor and hospital matching.
  - Supports unified search, category tabs (All, Tests, Prescriptions, Scans, Timeline), grid/list views, and upload modal.
  - Production build verified with 0 errors (13.96s).

- **Precision My Bills Page & 3-Way Comparative Benchmark Engine**:
  - Completely data-driven from `bills`, `bill_line_items`, `treatment_packages`, and `hospitals` tables (zero hardcoded package values).
  - **3-Way Comparative Benchmark Engine**:
    1. **vs Hospital Treatment Package**: Evaluates actual bill against hospital package baseline price, inclusions, duration, and room category.
    2. **vs Your Previous Bills**: Analyzes historical spending trends across patient visits for the same or previous procedures.
    3. **vs Indore City Average Benchmark**: Dynamically calculates city-wide average, minimum, and maximum procedure prices sampled from Indore hospitals.
  - **AI Bill Analyzer & Shock Detector**: Added prominent `✨ AI Bill Analyzer` button at top header. Powered by Google Gemini (`gemini-3.5-flash-lite`), calculating bill shock risk (`Low`, `Moderate`, `High`), package compliance score, line-item markups, and actionable negotiation checklists for the hospital accounts desk.
  - **Dynamic Smart Upload Modal**: Fetches available packages directly from `public.treatment_packages` for the selected hospital and procedure. Automatically populates package baseline and generates itemized line items upon upload.
  - Added migration `023_seed_diverse_bills.sql` with real Indore bills for Total Knee Replacement (Shalby Hospital) and Coronary Angioplasty (CHL Hospital).
  - Passed all 5 backend integration tests (`node test_bill_backend.js`) and verified frontend build (`npm run build` in 21.67s).

- **Precision My Bookings Page (Fixed Left Details & Scrollable Right Split Screen)**:
  - Rebuilt `PatientBookings.jsx` following the split layout pattern of `HospitalDetails.jsx` and `DoctorDetails.jsx`:
    - **Split Screen Body (`lg:h-[calc(100vh-4rem)] overflow-hidden`)**:
      - **Left Column (`w-full lg:w-[480px] xl:w-[520px] lg:h-full overflow-y-auto`)**: 100% fixed, anchored Booking Details panel showing the latest booking upon page open, print action, status banner, copyable booking ID, 2-column info grid, ID notice, and cancellation options.
      - **Right Column (`flex-1 lg:h-full lg:overflow-y-auto custom-scrollbar`)**: Independently scrollable right pane containing breadcrumbs, page header, category tabs (`All Bookings`, `Upcoming`, `Completed`, `Cancelled` with live counts), and full list of booking cards.
    - Clicking any card on the right updates the fixed left panel in real-time and highlights the card.
    - Live database cancellation: cancelling updates `public.bed_reservations` (`status = 'cancelled'`) and refreshes counts in real-time.
  - Added migration `024_seed_reference_bookings.sql` seeding 4 authentic Indore hospital bed reservations (CityCare, Medilife, Shalby, Bombay Hospital) per patient profile (Rule 30 isolation).
  - Backend integration test passed (`node test_bookings_backend.js`) and production build verified (`npm run build` in 16.25s).

- **Patient Profile, Saved Items, and Settings Suite (Complete Integration)**:
  - **Patient Profile (`/app/profile` -> `PatientProfile.jsx`)**:
    - Includes Ayushman Bharat ABHA digital pass with copyable ABHA ID and QR graphic.
    - Strict server-side and UI locking of immutable verified fields: Full Name, Email, Phone, Aadhaar (masked), ABHA ID, Date of Birth, Gender (🔒).
    - Editable clinical vitals: Blood Group, Height, Weight, Live BMI calculator (category badges), emergency contacts, and localization preferences.
  - **Saved Hospitals & Doctors (`/app/saved` -> `PatientSaved.jsx`)**:
    - Tabs: All Saved, Hospitals, Doctors with live counts.
    - Search bar, 1-click unsave with toast notification, direct booking and details navigation.
  - **Account & Privacy Settings (`/app/settings` -> `PatientSettings.jsx`)**:
    - Notification preferences (SMS, WhatsApp, Email, Emergency Broadcasts).
    - ABHA data sharing consent and anonymous regional analytics toggles.
    - One-click health locker export (downloads JSON archive).
  - **Database Migration `025_patient_settings_and_saved_seeds.sql`**:
    - Created `public.patient_settings` with RLS.
    - Seeded saved hospitals (CityCare, Shalby) and saved doctors (Dr. Ananya Sharma, Dr. Priya Mukherjee) across all patient profiles.
  - **KYC Verification, Full Horizontal Profile Box & Small Dashboard Card**:
    - Removed any mock Aadhaar / ABHA fallbacks. Strictly displays actual database state (`Not Linked / Incomplete` if null).
    - Full Horizontal Banner on Profile page when KYC is incomplete (`kyc_status !== 'verified'`).
    - Small KYC Box on Patient Dashboard below Greeting Header with action to complete KYC documents.
    - Interactive KYC Documentation Modal (`POST /api/v1/patient/kyc`) saving real Aadhaar to `public.patient_profiles` and setting `kyc_status = 'verified'`.
    - Appeal to Change Credentials / Contact Support workflow (`POST /api/v1/patient/appeal`) for locked fields.
  - Backend integration tests passed (`node test_patient_suite.js` - 7/7 passed) and production build verified (`npm run build` in 24.48s).

### 7. Emergency Map & Telemetry Tab Layout Overhaul (`PatientEmergency.jsx`)
- Re-architected `PatientEmergency.jsx` tabbed views to eliminate cutoffs, overlapping containers, and layout regressions:
  - Full-height interactive Leaflet map canvas with custom trauma center / ICU pulse pins and patient live coordinate beacon.
  - Clean floating control overlay with map layer switchers (Standard, Satellite, Traffic).
  - Synchronized location telemetry priority (`Live GPS Active` badge vs `Profile Database Location` fallback with 1-tap browser GPS re-request).

### 8. Platform Refactoring, UID Retrieval Engine & System Hardening Suite
- **Navbar Live GPS Popover & Persistent Activation Prompt**:
  - Implemented location popover in `AppNavbar.jsx` with real-time latitude/longitude coordinates and GPS on/off toggle.
  - When GPS is off, renders persistent bouncing alert badge (`📍 Turn on live location`) directly below the location button.
- **Dashboard Emergency Navigation & Live Consultations**:
  - Linked Emergency nav and card actions in `PatientDashboard.jsx` directly to `/app/emergency`.
  - Integrated `bookingService.getPatientBookings()` into dashboard pipeline, dynamically displaying real bed reservations and doctor appointments with live hospital distance and drive times.
- **Find Care Voice Deduplication & Manual Submit**:
  - Fixed speech recognition loop in `AIFindCareModal.jsx` to prevent repeated words during voice dictation.
  - Added explicit "Find Right Care →" button and Enter key submit trigger.
- **Dynamic Hospital Operating Hours Engine (`hospitalHours.js`)**:
  - Created utility evaluating `opening_hours` against current system clock.
  - Integrated into `HospitalCard.jsx` and `HospitalDetails.jsx` to display green "Open • Closes [Time]" or red "Closed • Opens 8:00 AM" with emergency trauma notes when closed.
- **Printable Admission Pass with Patient UID QR Code**:
  - Built official printable hospital admission pass modal in `PatientBookings.jsx` using `qrcode`.
  - Embeds hospital credentials, patient vitals, booking slot, and scannable Patient UID QR code from `patient_profiles`.
  - Includes `@media print` CSS isolating the pass for crisp PDF generation.
- **Profile Page QR & Patient UID Retrieval Engine**:
  - In `PatientProfile.jsx`, shifted blood group, age/gender, and location to the left column under the patient name and ABHA details.
  - Positioned square QR thumbnail on the right with a "Show QR" button opening a high-resolution modal.
  - Built backend retrieval engine `GET /api/v1/patient/scan/:uid` in `patientController.js` and `patient.routes.js`, enabling instant retrieval of patient clinical records, vitals, ABHA, KYC, document counts, and active holds by hospital triage desks.
- **Universal Landing Page Protected Route Redirection**:
  - In `LandingPage.jsx`, implemented `handleProtectedNavigate` checking authentication state (`useAuth`).
  - Directly routes authenticated users to target pages (`/app/hospitals`, `/app/emergency`, `/app/bookings`, `/app/bills`, `/app/schemes`, `/app/ai-analyzer`) or redirects unauthenticated visitors to `/login?redirect=[target]`.
  - Applied across all 6 landing chapter components and `Navbar.jsx`.
- **Navbar Real-Time Notifications Center**:
  - Wired automated backend notification triggers in `bedService.js` (bed holds), `bookingService.js` (doctor appointments), and `billService.js` (bill analyses).
  - Seeded initial historical notifications across all registered patient profiles in `public.notifications`.
  - Updated `AppNavbar.jsx` with 12-second live polling, category-specific icons (`Building2`, `Stethoscope`, `FileText`, `Sparkles`), unread badges, "Mark all as read", and instant navigation on click.
- **Auto-Cancellation for Expired Holds & Precision Tab Filtering**:
  - Backend `bookingService.js` automatically batch-updates expired bed reservations (`expires_at <= now` and status `'held'`) to `'cancelled'` in Supabase.
  - Frontend `PatientBookings.jsx` tab filters (`isBookingActiveUpcoming`, `isBookingCancelled`) and counts updated to accurately categorize and render all 4 tabs (`All`, `Upcoming`, `Completed`, `Cancelled`).

### 22. Bed Hold Location Capture & Immutable Booking Lock Architecture
- **Location Snapshot at Hold Initiation (`CheckBedsModal.jsx`)**:
  - When a bed hold is triggered, the system inspects the user's live location state (`userLocation.lat`, `userLocation.lng`, and `source !== 'off'`).
  - **Location ON**: Automatically calculates proximity to hospital (`hospitalDistance`), estimated drive time (`travelInfo`), and sets dynamic timer (`travelMinutes + 20`, minimum 30 min) with locked `expires_at`.
  - **Location OFF**: Creates a standard 30-minute reservation without distance telemetry.
- **PostgreSQL Database Schema Extension & Atomic Function (`026_bed_reservations_location_lock.sql`)**:
  - Extended `public.bed_reservations` with `distance_km NUMERIC(6,2)`, `drive_time TEXT`, `travel_minutes INTEGER`, `hold_minutes INTEGER`, `location_captured JSONB`, and `patient_notes TEXT`.
  - Updated `public.hold_bed_atomic` RPC to accept `p_distance_km`, `p_drive_time`, `p_travel_minutes`, `p_location_captured`, atomically decrementing bed inventory and storing the immutable snapshot directly into the reservation row.
- **Immutable Booking Guarantee (Post-Creation Lock)**:
  - **CheckBedsModal Screen**: Once created, active hold details are permanently frozen (`isLocked: true`). Subsequent location toggles (turning GPS on/off in the navbar, moving, or changing cities) do not alter the displayed distance, drive time, or countdown timer.
  - **My Bookings (`PatientBookings.jsx`)**: `getBookingProximity` and `getCountdown` prioritize locked database attributes (`b.distanceKm`, `b.driveTime`, `b.expiresAt`) over dynamic `userLocation`. Renders green `🔒 LOCKED` badge on booking cards and `🔒 Locked at Booking` indicator in details panel.
  - **Patient Dashboard (`PatientDashboard.jsx`)**: Displays locked distance (`booking.distanceKm`) for recent bed reservations without recalculating from active GPS.
  - **Dual-Resilient Services**: Updated backend `bedService.reserveBedHold`, `hospitalController.reserveBedHold`, and `bookingService.getPatientBookings` alongside frontend `bookingService.js` to select, map, and return locked fields.
- **Automated Verification**:
  - Verified 100% pass rate in both Location ON (3.3 km, 9 mins, 30 min window, GPS snapshot) and Location OFF (null distance, 30 min window) states via `scratch/test_bed_hold_location_lock.js`.
  - Vite production build (`npm run build`) succeeded with 0 errors in 20.61s.

## Next Steps (Building Order from Document 3)

1. **Costs & Coverage (PM-JAY & Insurance)** (`/app/schemes`): Replace placeholder with Ayushman Bharat eligibility checker and cashless TPA insurance pre-auth calculator.
2. **Help & Support** (`/app/help`): Connect with ticketing / live chat helpline.

## Important Decisions Log

- **2026-08-30**: Initialized architecture and 33-table schema.
- **2026-09-02**: Configured real Google SMTP for pure numeric OTP delivery; removed all magic link URLs from email templates.
- **2026-09-02**: Deployed database anti-duplicate & fuzzy similarity checking (`check_org_name_conflict`) and 10-digit resilient mobile lookup (`get_email_by_identifier`).
- **2026-09-02**: Deployed full RBAC system with automatic entity provisioning (`handle_new_user`), `ProtectedRoute` role guards, and role dashboards.
- **2026-09-02**: Analyzed Document 3 (Frontend Blueprint) and established page-by-page roadmap.
- **2026-09-03**: Enforced **Rule 30 (Multi-User Seed Data Isolation & Per-User Ownership Rule)** in `rules.md`: All seeded starter records (medical documents, lab reports, bills, bookings) must be generated as independent copies for every registered patient profile. Deleting or editing data by one user never affects another, guaranteeing 100% data confidentiality and zero cross-user leakage.
- **2026-09-03**: Enforced **Rule 31 (Protected Route & Authentication Gating for Public Portals)**: All public landing page CTAs and feature triggers must enforce authentication checks, redirecting unauthenticated users to `/login?redirect=[targetRoute]`.
- **2026-09-03**: Enforced **Rule 32 (Real-Time Telemetry & Notification Synchronization)**: Critical patient operations (bed reservations, consultations, bill audits) must commit persistent records to `public.notifications` and stream updates to client navigation headers.
- **2026-09-03**: Enforced **Rule 33 (Automated Resource Expiry & Life Cycle Garbage Collection)**: Time-limited reservation commitments must resolve to `'cancelled'` upon expiration, releasing bed inventory and maintaining accurate filter counts.
