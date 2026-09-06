# OpenHealth — Engineering Rules

## 1. Technology Rules
- **Rule 1.1**: Use ONLY approved technologies: React, Vite, JavaScript (ESNext), JSX, Tailwind CSS, Node.js, Express.js, Supabase (PostgreSQL, Auth, Storage, RLS), Python FastAPI for AI, Google Maps API, and Razorpay/UPI for payments.
- **Rule 1.2**: NO TypeScript under any circumstances. Do not create `.ts`, `.tsx`, `tsconfig.json`, or install TypeScript type packages. Use standard `.js` and `.jsx` files only.
- **Rule 1.3**: Supporting frontend libraries permitted: React Router, Axios/Fetch API, Recharts, Lucide React, React Hook Form, Zod/form validation, TanStack Query. No Redux unless explicitly approved.

## 2. Emergency Mode & Ambulance Rules
- **Rule 2.1**: **Orchestration Trigger Boundary**: The `🚨 Emergency Mode` button is an ACTIVE ORCHESTRATION TRIGGER. It must NEVER behave as a passive search form or navigation link.
- **Rule 2.2**: **No False Guarantee Rule**: The system MUST NEVER falsely claim an ICU bed or ambulance is guaranteed unless confirmed by backend responses (`Hospital Confirmed` & `Ambulance Assigned`).
- **Rule 2.3**: **Emergency State Machine**: Emergency sessions and ambulance dispatch statuses must adhere strictly to allowed state values:
  `Searching`, `Match Found`, `Request Sent`, `Ambulance Assigned`, `Hospital Contacted`, `Hospital Confirmed`, `En Route`, `Arrived`, `Cancelled`, `Failed`.
- **Rule 2.4**: **Geolocation Fallback**: Emergency flow must request device GPS. If denied, it must fall back gracefully to manual location selection without blocking emergency hospital ranking.
- **Rule 2.5**: **Emergency Session Isolation**: Every emergency session (`emergency_sessions`, `ambulance_requests`) is tied to a specific `patient_id` and isolated via database RLS.

## 3. JavaScript Rules
- **Rule 3.1**: Use clean, modern ES6+ syntax (`const`/`let`, arrow functions, async/await, destructuring, modules).
- **Rule 3.2**: Always handle async operations with `try...catch` blocks or explicit promise rejection handlers.
- **Rule 3.3**: Avoid `var` completely. Use immutable `const` by default; use `let` only when reassignment is explicitly required.

## 4. React Rules
- **Rule 4.1**: Write functional components ONLY. No class components.
- **Rule 4.2**: Functional components must be placed inside designated subfolders in `src/components/` or `src/pages/`.
- **Rule 4.3**: Keep UI components modular and reusable. Keep business logic out of React visual components; delegate to `src/services/` or custom hooks in `src/hooks/`.
- **Rule 4.4**: Ensure all interactive elements have accessible attributes and unique `id` / `key` props.

## 5. Tailwind Rules
- **Rule 5.1**: Use utility-first Tailwind classes for all UI styling.
- **Rule 5.2**: Use custom design system tokens defined in `tailwind.config.js` for brand colors, spacing, and typography.
- **Rule 5.3**: Do not write arbitrary inline CSS (`style={{ ... }}`) unless dynamic calculation (e.g. precise map coordinates) is strictly required.

## 6. Backend Rules
- **Rule 6.1**: Express backend must follow layered controller-service architecture.
- **Rule 6.2**: Route definitions must NOT contain database queries or AI prompt templates directly. Controllers invoke services.
- **Rule 6.3**: All route endpoints must be versioned under `/api/v1/`.

## 7. Database Rules
- **Rule 7.1**: All database tables must include standard timestamp columns: `created_at` (default `now()`) and `updated_at`.
- **Rule 7.2**: Foreign keys must be explicitly constrained with cascade or restrict rules.
- **Rule 7.3**: Primary keys must be UUIDs generated via `gen_random_uuid()`.

## 8. Supabase Rules
- **Rule 8.1**: Initialize Supabase client using environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on frontend.
- **Rule 8.2**: NEVER expose the `SUPABASE_SERVICE_ROLE_KEY` to the frontend bundle or git repository.
- **Rule 8.3**: Always use Supabase Auth session tokens to authenticate database and API requests.

## 9. RLS Rules
- **Rule 9.1**: Row Level Security (RLS) MUST be enabled on EVERY table (all 33 tables) created in PostgreSQL (`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`).
- **Rule 9.2**: Tables containing user, hospital, or emergency data must have explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
- **Rule 9.3**: Never create a table without an associated security policy. RLS is enforced at the database layer.

## 10. Authentication Rules
- **Rule 10.1**: Authenticate every non-public endpoint using JWT verification middleware.
- **Rule 10.2**: Auth tokens must be validated before request parameters are processed.
- **Rule 10.3**: Unauthenticated users must be gracefully redirected or returned `401 Unauthorized`.

## 11. Authorization Rules
- **Rule 11.1**: Server-side role checks (`patient`, `hospital_staff`, `hospital_admin`, `ambulance_provider`, `insurance_user`, `platform_admin`) are mandatory.
- **Rule 11.2**: Client-side role checks are for UI visibility ONLY and never constitute a security boundary.
- **Rule 11.3**: Hospital staff operations must verify active membership in `hospital_users` table for the target `hospital_id`.

## 12. Patient Isolation Rules
- **Rule 12.1**: Every patient-owned record must store `patient_id` referencing `auth.uid()`.
- **Rule 12.2**: Cross-patient data queries are strictly forbidden. Users must only query records where `patient_id = auth.uid()`.

## 13. Hospital Isolation Rules
- **Rule 13.1**: Operational records (beds, pricing, local bookings) must be scoped by `hospital_id`.
- **Rule 13.2**: Hospital staff cannot access or mutate operational records of another hospital.

## 14. Storage Security Rules
- **Rule 14.1**: Private buckets (`medical-documents`, `bills`, `reports`) must NEVER be public.
- **Rule 14.2**: Access to private storage objects must use short-lived Supabase Signed URLs or server-authenticated streams.
- **Rule 14.3**: Files uploaded to storage must be validated for file extension, MIME type, and maximum file size (max 10MB per file).

## 15. AI Rules & Boundaries
- **Rule 15.1**: Python FastAPI AI microservice must run isolated from public frontend access. Express acts as the single gateway.
- **Rule 15.2**: PII Masking pipeline MUST run before sending patient medical document text to external LLM services.
- **Rule 15.3**: Every AI output UI component must explicitly distinguish between four data types:
  - *Extracted Fact* (verbatim document text)
  - *Calculated Result* (mathematically derived)
  - *AI Interpretation* (LLM summary/categorization)
  - *Prediction* (ML model estimate)

## 16. Financial & Calculation Rules
- **Rule 16.1**: Keep financial and bill shock calculations strictly deterministic server-side. Do NOT rely on LLM hallucinations for bill variances.
- **Rule 16.2**: Uploading a final bill must NEVER overwrite original treatment package estimates without creating an audited `bill_shock_records` entry.

## 17. Data Consistency Rules
- **Rule 17.1**: Bed availability invariant constraints must be enforced:
  - `available_beds >= 0`
  - `occupied_beds <= total_beds`
  - `reserved_beds <= total_beds`
- **Rule 17.2**: Cancelled bookings must immediately release reserved resources back to inventory.
- **Rule 17.3**: Expired bed reservation holds must be automatically released server-side.
- **Rule 17.4**: Hospital verification status can ONLY be altered by authenticated `platform_admin` roles.

## 18. API Rules
- **Rule 18.1**: API responses must return a standardized JSON structure:
  `{ "success": true, "data": ... }` or `{ "success": false, "message": "...", "errorCode": "..." }`.
- **Rule 18.2**: Never leak internal database stack traces or raw error objects to the client.

## 19. File Upload Rules
- **Rule 19.1**: Uploaded files must be assigned unique storage paths incorporating UUIDs to prevent collision.
- **Rule 19.2**: Temporary files written to `storage/temp/` must be cleaned up after processing completes.

## 20. Naming Conventions
- **Files & Folders**: `kebab-case` for directories and utility/service JS files (e.g. `emergency-service.js`).
- **React Components**: `PascalCase` for JSX files (e.g. `AmbulanceStatus.jsx`).
- **Database Tables & Columns**: `snake_case` (e.g. `ambulance_requests`, `session_id`).
- **Variables & Functions**: `camelCase` (e.g. `matchAmbulance`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `MAX_FILE_SIZE_BYTES`).

## 21. Folder Organization
- Strictly respect the modular folder structure established in `frontend/`, `backend/`, `storage/`, and `docs/`.

## 22. Security Rules
- Sanitize all rendered user inputs against XSS. Use parameterized queries via Supabase client to prevent SQL injection. Enforce CORS.

## 23. Performance Rules
- Implement pagination or infinite scroll for search results (default: 20 items). Debounce high-frequency search inputs (300ms).

## 24. Forbidden Patterns
- FORBIDDEN: Writing TypeScript code (`.ts`, `.tsx`).
- FORBIDDEN: Treating Emergency Mode as a passive search form.
- FORBIDDEN: Claiming an unconfirmed ICU bed or ambulance is guaranteed.
- FORBIDDEN: Hardcoding API keys or DB connection strings in source code.
- FORBIDDEN: Disabling RLS on any database table.
- FORBIDDEN: Hardcoding mock/static numbers or placeholder datasets on any production dashboard.

## 25. Real Database Pipelining & No Mock Data Rule
- **Rule 25.1**: **Zero Mock Data Principle**: Dashboards across all roles (`patient`, `hospital_staff`, `hospital_admin`, `ambulance_provider`, `insurance_user`, `platform_admin`) must NEVER render hardcoded mock numbers, fake statistics, or dummy datasets.
- **Rule 25.2**: **Live Database Pipelining**: Every card, metric, chart point, search history item, and badge MUST be dynamically fetched from live Supabase PostgreSQL queries, RPC aggregations, or Express `/api/v1/` services scoped to the authenticated entity (`auth.uid()`).
- **Rule 25.3**: **Schema Completeness**: If any dashboard metric or workflow requires data that lacks a dedicated PostgreSQL column, table, or relation, the database schema MUST be explicitly migrated with RLS policies and indexed before wiring the frontend pipeline.
- **Rule 25.4**: **New User Lifecycle Resilience**: For newly registered accounts with zero historical records, dashboards must accurately calculate and display `0` (or clean empty states) rather than falling back to fictitious placeholder data.

## 26. Dynamic Database Schema Extension & Field Management Rule
- **Rule 26.1**: **Proactive Column & Table Creation**: Whenever a new form field, KYC attribute, user detail, or entity metadata is specified and not yet present in PostgreSQL, you MUST immediately create the column/table in the database schema with proper data types, constraints, and foreign key relationships.
- **Rule 26.2**: **Clean Multi-Table Relational Integrity**: All created fields must be properly categorized and mapped into their normalized tables (e.g. `profiles` for shared identity, `patient_profiles` for clinical & personal health pass details, `hospitals` for operational data) without creating duplicate or unmanaged columns.
- **Rule 26.3**: **One-Time Lifecycle State Gating**: Onboarding and KYC wizards must strictly check the user's database status (`onboarding_completed: true` vs `false`). If a user logs out without completing the wizard, subsequent logins MUST force them back to the wizard until completed. Once completed, the wizard MUST never reload again for that user.

## 27. Sequential Feature Workflow: Frontend & Database First, Backend Upon Approval
- **Rule 27.1**: **Frontend & Live Database First**: For every feature, page, or portal, build the frontend UI components and pipeline them directly with Supabase PostgreSQL tables, real-time channels, and RPC functions first.
- **Rule 27.2**: **Interactive Review & Verification**: Present the UI, review layout, typography, responsive alignment, and data flow with the USER, and implement all requested refinements until the USER is completely satisfied with the frontend experience and database integration.
- **Rule 27.3**: **Backend Microservices Activation**: Only after the USER explicitly approves the frontend and database pipeline, proceed to build the corresponding Express.js routes, controllers, and backend services.

## 28. Mandatory Master AppLayout & Expandable AppSidebar Rule
- **Rule 28.1**: **Unified Light-Colored Expandable Sidebar**: The light-colored `AppSidebar` (with smooth expand-on-hover interaction, solid royal blue active box selection, primary navigation, bottom navigation, and user profile card) MUST be used as the standard sidebar across ALL patient application pages.
- **Rule 28.2**: **No Legacy Black/Dark Sidebars**: Any legacy hardcoded dark/black sidebars (such as the old navy sidebar in the dashboard) are strictly deprecated and MUST NEVER be used on application pages.
- **Rule 28.3**: **Always Wrap New Pages in `AppLayout`**: Whenever a new application page, portal view, or patient feature module is created, it MUST ALWAYS be wrapped in the master `AppLayout` component (`frontend/src/components/layout/AppLayout.jsx`). This guarantees that every page automatically gets the single fixed top navbar (`AppNavbar`) and the fixed expandable left sidebar (`AppSidebar`).

## 29. Git & GitHub Command Restrictions
- **Rule 29.1**: **Strict Prohibition on Git / GitHub Commands**: You MUST NEVER execute any `git` or `gh` commands (including `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git merge`, `git reset`, etc.) without the user's explicit prior written permission.
- **Rule 29.2**: **Autonomous Local Development Authority**: You have full permission to autonomously execute any other local development, build, test, database, and process management commands on the PC without prompting for permission.

## 30. Multi-User Seed Data Isolation & Per-User Ownership Rule
- **Rule 30.1**: **Per-User Isolated Seed Copies**: When seeding any initial demonstration, starter, or test records (e.g. medical documents, lab reports, bills, bookings, or prescriptions) into PostgreSQL or Supabase Storage, you MUST ALWAYS seed independent, dedicated copies for EVERY user/patient account. NEVER attach a single shared record across multiple users or leave records belonging to only one user.
- **Rule 30.2**: **Independent Mutation & Deletion Authority**: Each user MUST strictly own their distinct rows (`patient_id = auth.uid()` or the patient's own `patient_profiles.id`). If User A edits, analyzes, or deletes their document/bill, it must mutate ONLY their own row. User B's copy must remain completely unaffected and intact in their own health locker.
- **Rule 30.3**: **Automated Seeding Loop Across All Registered Profiles**: All database migration and seeding scripts (e.g., `016_seed_medical_documents.sql`, `018_seed_comparison_bills.sql`) MUST iterate through all existing user/patient accounts using a `FOR rec IN SELECT id, user_id FROM public.patient_profiles LOOP` pattern (or auto-provision on new registration). This guarantees that every registered profile receives its own independent dataset upon migration or signup.
- **Rule 30.4**: **Zero Cross-User Data Leaks & Protected Route Integrity**: A user must NEVER see, query, or delete another user's files, bills, or clinical records. This eliminates cross-account data leakage, enforces strict Row Level Security (RLS), and preserves the security integrity of protected routes and multi-tenant patient accounts.

## 31. Protected Route & Authentication Gating for Public Portals
- **Rule 31.1**: **Mandatory Authentication Gating on Public Action Triggers**: All CTA buttons, booking links, search cards, and feature shortcuts displayed on public pages (such as `LandingPage.jsx` and its chapter sections) MUST enforce authentication verification before granting access to application features.
- **Rule 31.2**: **Target Preservation on Redirect**: If an unauthenticated visitor clicks an action trigger (e.g. "Find Care", "Emergency Bed Search", "Analyze Bill"), the router MUST immediately redirect them to `/login?redirect=${encodeURIComponent(targetRoute)}` or `/signup`. Once authenticated, the user must be redirected directly to their intended feature without requiring them to search or click again.

## 32. Real-Time Telemetry & Notification Synchronization
- **Rule 32.1**: **Persistent Notification Commitment**: Whenever a patient books an appointment, reserves a bed, uploads or analyzes a hospital bill, or receives an AI clinical insight, an audited row MUST be immediately inserted into `public.notifications` linked to `user_id`.
- **Rule 32.2**: **Visual Notification Categorization**: Notifications displayed in client navigation bars (`AppNavbar.jsx`) MUST render distinct visual iconography and color-coded category badges (`booking` $\rightarrow$ Green Building, `appointment` $\rightarrow$ Blue Stethoscope, `bill_analysis` $\rightarrow$ Amber FileText, `ai_analysis` $\rightarrow$ Purple Sparkles).
- **Rule 32.3**: **Real-Time Polling / Subscription**: The application navbar must keep notification badges fresh and accurate via real-time Supabase channels or high-frequency polling intervals ($\le 15$ seconds) with 1-tap "Mark all as read" and direct module routing.

## 33. Automated Resource Expiry & Life Cycle Garbage Collection
- **Rule 33.1**: **Deterministic Expiration for Temporary Bed Holds**: Emergency bed holds with countdown durations (e.g. 15-minute or 30-minute holds) must strictly enforce expiration. If the patient does not check in before `expires_at`, the reservation status MUST resolve to `'cancelled'` in both backend state evaluation and database batch updates.
- **Rule 33.2**: **Inventory Recirculation**: When a bed reservation expires or is cancelled by the patient, the corresponding reserved bed inventory in `hospital_beds` must be immediately decremented and restored to `available_beds`.
- **Rule 33.3**: **Accurate Tab Categorization**: Status filters across booking views (`PatientBookings.jsx`) must evaluate expiration against the client and server clocks, strictly segregating active upcoming holds from cancelled/expired records.

## 34. Dynamic Clinical Triage & Zero Hardcoded Specialties Principle
- **Rule 34.1**: **Absolute Prohibition on Static Clinical Specialties**: The AI Clinical Triage engine, recommendation services (`aiRecommendationService.js`), routes (`ai.routes.js`), and frontend modals (`AIFindCareModal.jsx`) must NEVER default or hardcode a static department (such as cardiology or heart surgery) when user symptoms describe other conditions (e.g. headache, fracture, fever, rash, abdominal pain).
- **Rule 34.2**: **Pure Dynamic LLM Extraction & Multi-Specialty Mapping**: All symptom submissions (text or voice transcripts) must be evaluated dynamically by Google Gemini LLM with structured JSON parsing across 15+ medical disciplines (Neurology, Orthopedics, Pediatrics, Laparoscopic Surgery, Gastroenterology, Dermatology, ENT, Ophthalmology, Pulmonology, Psychiatry, Obstetrics, Nephrology, etc.).
- **Rule 34.3**: **Live Database Matching**: Specialist doctors and hospital departments presented in AI triage cards must be dynamically queried from Supabase PostgreSQL (`public.doctors`, `public.departments`, `public.hospitals`) matching the predicted medical department and patient's city.

## 35. Unblocked Guest Discovery & Optional Authentication Principle
- **Rule 35.1**: **Frictionless Public AI Care Discovery**: Public care discovery features, including the `AIFindCareModal`, public marketplace filters, and `/api/v1/ai/recommend`, MUST support unauthenticated guest visitors.
- **Rule 35.2**: **Optional Authentication Middleware (`optionalAuth`)**: Endpoints serving public discovery must utilize `optionalAuth` rather than strict `requireAuth`. If a valid JWT is provided, the user context is populated; if no token or an invalid token is provided, the request must succeed in guest mode without returning `401 Unauthorized` or `403 Forbidden`.
- **Rule 35.3**: **Graceful Gating at Commitment Point**: Guest users may explore AI symptom triage, view matching doctors, and browse bed counts freely; authentication gating is enforced only when the user commits to a booking, reservation, or saved item.

## 36. Hospital Administrative Governance & RBAC Synchronization
- **Rule 36.1**: **Multi-Store Role Synchronization**: Whenever an administrative role is provisioned (`hospital_admin`, `platform_admin`), updates must be applied synchronously across all identity layers: `public.profiles` (`role`), `auth.users` (`raw_user_meta_data->role`), and operational membership tables (`hospital_users`, `hospital_memberships`).
- **Rule 36.2**: **Deterministic Facility Linkage**: Hospital admins must be explicitly linked to their verified `hospital_id` with `is_primary = true` and `status = 'active'`. Platform admins possess global administrative privileges over all facilities and audit queues.


