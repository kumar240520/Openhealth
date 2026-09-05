# OpenHealth — Design System

## 1. Design Philosophy
OpenHealth adopts a modern, high-trust, human-centered healthcare design philosophy. It balances high data density (costs, bed telemetry, metrics) with radical visual clarity, subtle glassmorphism, precise contrast hierarchy, and micro-animations to eliminate patient anxiety during high-stress medical decisions.

## 2. Brand Identity
- **Tone**: Empathetic, Authoritative, Transparent, Precise, Calm.
- **Brand Colors**: Deep Teal / Slate Navy paired with Vibrant Emerald Health Accents and Alert Crimson for emergency indicators.
- **Visual Personality**: Premium medical interface meets intuitive modern consumer app.

## 3. Color System
- **Primary / Health Teal**: `hsl(187, 85%, 28%)` / `#096979` (Deep, medical trust)
- **Primary Hover / Light**: `hsl(187, 75%, 38%)` / `#1192a6`
- **Secondary / Slate Navy**: `hsl(215, 32%, 17%)` / `#1d2a3a`
- **Accent / Emerald Success**: `hsl(158, 64%, 42%)` / `#24b47e` (Available beds, high score)
- **Warning / Amber Caution**: `hsl(38, 92%, 50%)` / `#f59e0b` (Limited beds, moderate risk)
- **Emergency / Crimson Alert**: `hsl(350, 84%, 48%)` / `#dc2626` (Emergency Mode, 0 beds left)
- **Background Light**: `#f8fafc` (Slate 50)
- **Background Dark / Card**: `#0f172a` (Slate 900) / `#1e293b` (Slate 800)
- **Text Primary**: `#0f172a` (Light Mode) / `#f8fafc` (Dark Mode)
- **Text Secondary**: `#64748b` (Slate 500)

## 4. Typography
- **Primary Font**: `Inter`, sans-serif (Google Fonts) for UI controls, body text, and tables.
- **Display Font**: `Outfit` or `Plus Jakarta Sans` for titles, hero headers, and key numerical metrics.
- **Scale**:
  - Display XL: `2.5rem` / `3.5rem` (Weight: 700)
  - Heading 1: `2rem` / `2.5rem` (Weight: 700)
  - Heading 2: `1.5rem` / `2rem` (Weight: 600)
  - Subheading: `1.125rem` / `1.5rem` (Weight: 600)
  - Body: `1rem` / `1.5rem` (Weight: 400)
  - Small / Caption: `0.875rem` / `1.25rem` (Weight: 500)

## 5. Spacing
Strict 4px/8px grid scale:
- `xs`: `0.25rem` (4px)
- `sm`: `0.5rem` (8px)
- `md`: `1rem` (16px)
- `lg`: `1.5rem` (24px)
- `xl`: `2rem` (32px)
- `2xl`: `3rem` (48px)

## 6. Border Radius
- `radius-sm`: `0.375rem` (6px) — Inputs, small badges
- `radius-md`: `0.5rem` (8px) — Buttons, table rows
- `radius-lg`: `0.75rem` (12px) — Standard cards, modals
- `radius-xl`: `1rem` (16px) — Hero containers, emergency panel
- `radius-full`: `9999px` — Avatars, status pills

## 7. Shadows
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `shadow-md`: `0 4px 6px -1px rgba(15, 23, 42, 0.08)`
- `shadow-lg`: `0 10px 15px -3px rgba(15, 23, 42, 0.12)`
- `shadow-emergency`: `0 0 25px rgba(220, 38, 38, 0.4)` (Pulsing emergency glow)

## 8. Buttons
- **Primary Button**: Teal fill (`#096979`), white text, font-weight 600, rounded-md, active scale 0.98.
- **Secondary Button**: Slate border, subtle hover background, font-weight 500.
- **Emergency Button**: Crimson background (`#dc2626`), high contrast white text, bold font, pulsing outer shadow ring. Actuators trigger active orchestration.
- **Ghost Button**: Transparent fill, teal text hover effect.

## 9. Inputs
- Clean 1px border (`#cbd5e1`), focus ring in Primary Teal (`#096979`), rounded-md.
- Built-in left icon slot (e.g. search magnifying glass, location pin).
- Clear error state: Crimson border with helper error text below.

## 10. Cards
- Elevated white/slate background with subtle 1px slate-200 border.
- Hover lift animation (`transform: translateY(-2px)`) with smooth 200ms transition.
- Header, Body, and Footer layout slots.

## 11. Tables
- Clean, high-density data tables with sticky header support.
- Alternating row hover highlight (`bg-slate-50/50`).
- Direct visual badge support for statuses inside table cells.

## 12. Badges
- Pill shape (`rounded-full`), `px-2.5 py-0.5`, `text-xs font-semibold`.
- Colors: Green for verified/available, Amber for limited/reviewing, Red for critical/full, Blue for info/scheme, Pulsing Red for active emergency dispatch.

## 13. Status Indicators
- Animated pulsing dot indicator for live updates:
  - Green pulse = Live telemetry active (< 5 min ago)
  - Crimson pulse = Active emergency dispatch & ambulance tracking
  - Amber pulse = Telemetry updated within last hour
  - Gray static dot = Manual update (> 2 hours ago)

## 14. Healthcare Visual Language
- Clean vector icons (Lucide React): Stethoscope, Bed, HeartPulse, ShieldCheck, FileText, AlertTriangle, Activity, Ambulance, MapPin, Navigation.
- High-contrast visual gauges for scores and percentage metrics.

## 15. Emergency & Live Ambulance Dispatch UI
Emergency Mode is an **active orchestration screen** (`Emergency.jsx`).
UI Components:
- **`EmergencyActionCard.jsx`**: High-contrast top card showing 1-tap trigger state and current GPS status.
- **`EmergencyStatus.jsx`**: Real-time status header (`🚨 Emergency Assistance Active`).
- **`NearbyHospital.jsx`**: Ranked destination card:
  ```text
  CityCare Hospital
  Distance: 4.2 km | ICU Beds: 3 reported available | ETA: ~12 min
  ```
- **`AmbulanceStatus.jsx`**: Vehicle assignment status pill:
  ```text
  🚑 Ambulance Assigned
  Vehicle: AMB-104 | Driver: Assigned | ETA: 8 min
  Status: En Route
  ```
- **`EmergencyMap.jsx`**: Interactive live tracking map displaying patient GPS pin, assigned ambulance vehicle marker, and destination route line.

## 16. Navigation
- Sticky header bar with blur backdrop (`backdrop-blur-md bg-white/80`).
- Global search bar embedded in top nav for quick access.
- Role-based navigation items (Patient Vault vs Hospital Portal vs Platform Admin).

## 17. Dashboard Layout
- Responsive grid shell: 240px collapsable sidebar + main scrollable content stage.
- Top metrics summary cards row + 2-column detail widget grid.

## 18. Hospital Cards & 3-Tier Comparison Matrix
- Display hospital photo, verified trust badge, distance (km), overall Transparency Score ring, live ICU bed counter pill, and primary action buttons ("Book Bed", "View Tariff").
- **3-Tier Comparison View**: Side-by-side comparison matrix comparing up to 4 hospitals across Cost, Available ICU Beds, Doctor Count, Insurance Acceptance, Scheme Support, Transparency Score, and Geolocation Distance.

## 19. Bed Availability UI
- Grid of bed categories (ICU, NICU, PICU, HDU, Isolation, General) with bold numerical counters.
- Visual progress bar showing occupancy percentage derived from `Available = Total - Occupied - Reserved`.

## 20. Cost UI
- Side-by-side range bar (Low - Expected - High cost, e.g. ₹1.9L – ₹2.3L).
- Unbundled charge accordion expanding room tariff, doctor charges, lab fees, and consumables.

## 21. AI UI & Data Boundary Visual Badges
- Sparkle icon indicators for AI-generated insights.
- **Data Type Visual Badges**:
  - `[Fact]` — Gray solid pill for verbatim document text.
  - `[Math]` — Blue outline pill for calculated formulas.
  - `[AI Summary]` — Purple sparkle pill for LLM interpretations.
  - `[Prediction]` — Amber pill for ML cost estimates.

## 22. Document UI
- Drag-and-drop file dropzone with upload progress bar.
- File type icon tags (PDF, JPG, PNG) and encryption lock status badge.

## 23. Bill UI
- Split auditing view highlighting standard baseline vs parsed line item charges.
- Inflated item warning callout banner with discrepancy delta (`+ ₹4,500 over benchmark`).
- `Bill Shock Index` badge (`Low`, `Moderate`, `High`).

## 24. Transparency Score UI
- Circular SVG progress ring displaying score (0-100).
- Color grading: 80-100 (Emerald Green), 50-79 (Amber Yellow), <50 (Slate/Crimson).

## 25. Responsive Design
- Mobile first design: 320px to 1440px+ breakpoint coverage.
- Emergency Mode optimized specifically for 1-handed mobile operation with extra-large touch targets (`min-h-[56px]`).

## 26. Accessibility
- WCAG 2.1 AA compliance: Minimum 4.5:1 contrast ratio for normal text.
- Full keyboard focus ring visibility (`focus-visible:ring-2`).
- Screen reader ARIA labels on dynamic counters and bed badges.

## 27. Animation Rules
- Transitions limited to 150ms-300ms cubic-bezier curves.
- Pulsing red animations for active emergency dispatch.

## 28. Empty States
- Custom illustrated SVG graphics with clear text explanation and single primary call-to-action button.

## 29. Loading States
- Skeleton loaders matching card layouts (`Finding hospitals near you...` / `Connecting nearby ambulance...`).
- Subtle shimmer animation across skeleton shapes.

## 30. Standard Screen UX States
Every important screen must handle 6 standard UX states:
1. **Loading**: `Finding hospitals near you...` / `Connecting ambulance...`
2. **Empty**: `No hospitals matched your current criteria.`
3. **Processing**: `Analyzing your medical bill...` / `Assigning ambulance AMB-104...`
4. **Error**: `We couldn't complete the analysis. Please try again.`
5. **Success**: `Ambulance assigned and hospital notified.`
6. **Sensitive Processing**: `Your location and telemetry are transmitted securely.`

## 31. Scannable QR Code Identity & EHR Cards
- Square QR code thumbnail rendered with crisp black-on-white module contrast and 1px border.
- "Show QR" button triggering high-resolution centered dialog modal (260px $\times$ 260px canvas).
- Clean monospaced patient UID display with 1-click clipboard copy feedback and verified database test trigger.

## 32. Printable Medical Slip & Admission Pass Layout (`@media print`)
- High-contrast monochromatic and dark slate printable slip design.
- Isolated print stylesheet (`@media print`) hiding all surrounding browser navigation, headers, and buttons, projecting exclusively `#printable-booking-slip`.
- Displays official hospital empanelment header, booking reference number, patient vitals, scannable QR code, and check-in instructions.

## 33. Universal Notification Center & Category Badges
- Compact frosted dropdown panel rendered below the navbar bell icon.
- Category-specific iconography and color tokens:
  - `booking`: Emerald green background with `Building2` icon.
  - `appointment`: Royal blue background with `Stethoscope` icon.
  - `bill_analysis`: Amber background with `FileText` icon.
  - `ai_analysis`: Purple background with `Sparkles` icon.
- Pulsing unread counter badge and single-click "Mark all as read" button.

## 34. Live Location & Operating Hours Telemetry Indicators
- **Location Status Popover**: Pill button displaying current city and GPS mode. Click opens popover with live coordinates and manual switch. When GPS is disabled, a persistent bouncing prompt badge (`📍 Turn on live location`) is displayed.
- **Operating Hours Pill**:
  - Open: Green badge (`Open • Closes [Time]`).
  - Closed: Red badge (`Closed • Opens 8:00 AM`) accompanied by a 24/7 Trauma Emergency Care note.

