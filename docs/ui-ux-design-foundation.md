# HeatPulse UI/UX Design System & Screen Flow Specification
**Phase F0 — Design Foundation & Interface Architecture**
*Impact-Based Extreme Heat Early-Warning Platform for Greater Chennai Corporation (GCC)*

---

## 1. Executive Design Direction & Philosophy

### 1.1 Positioning: What HeatPulse Is and Is Not
- **What it IS:** A high-precision **public-health intelligence platform + GIS analytical command dashboard + calibrated thermal-stress early-warning system**. It is engineered for municipal officers, public health epidemiologists, emergency response teams, and city planners.
- **What it is NOT:** It is **not** a generic consumer weather app with cartoon sun icons, generic 3-day weather widgets, or arbitrary temperature gauges.

### 1.2 Guiding Design Tenets
1. **Impact Over Raw Temperature:** Pure dry-bulb temperature fails in humid maritime climates like Chennai. The interface gives primary prominence to **Human Heat Risk** and physiological stress (**HTSI**, **UTCI**, **WBGT**) over simple ambient air temperature ($T_{2m}$).
2. **Scientific Rigor & Absolute Explainability:** Every metric must link directly to its formula, input sources (ERA5-Land, WorldPop R2025A, GCC HWC PDF), and validation confidence. Zero black boxes.
3. **Strict Color Severity Consistency:** The 5-level risk hierarchy (`Normal`, `Moderate`, `High`, `Very High`, `Extreme`) is universal across maps, badges, graphs, and alert tables. Colors are never re-purposed for decoration.
4. **Spatial Precision (200 GCC Wards):** Visual hierarchy prioritizes Chennai's 200 administrative wards grouped by their 15 Zones, mapped relationally to the 5 calibrated ERA5-Land grid cells.
5. **Accessibility & High-Density Ergonomics (WCAG 2.1 AA/AAA):** High contrast, dark-slate background biased for command center operations with full high-contrast light mode, tabular numeric alignment (`tabular-nums`), and explicit focus rings.

---

## 2. Visual Identity & Brand System

### 2.1 Logo Treatment
- **Logomark:** The **Thermal Pulse**: An abstract geometric fusion of an isotherm contour line with an EKG/pulse wave that transitions through a subtle thermal spectrum gradient (Amber `#F59E0B` to Crimson `#EF4444` to Purple `#7C3AED`).
- **Wordmark:** **Heat** in Medium/SemiBold weight (`Inter / Outfit`), **Pulse** in Bold weight with an elevated dot on the 'i' representing a spatial coordinate node.
- **Tagline:** `Impact-Based Heat Early Warning Platform — Greater Chennai Corporation`
- **Variations:**
  - *Primary Full:* Logomark + "HeatPulse" Wordmark + GCC Official Affiliation subtitle.
  - *Compact / Nav:* Logomark (32x32px) + "HeatPulse" Wordmark (16px font).
  - *App Icon / Favicon:* 32x32 rounded-square (radius 8px) with obsidian background `#090D16` and the luminous pulse mark.
  - *Monochrome:* Solid white on dark chrome, solid slate-900 on light print/PDF exports.

---

## 3. Design Tokens & Core Foundations

### 3.1 Strict 5-Tier Severity Risk Palette
These colors are project-wide invariants. They adhere to WCAG AA/AAA contrast ratios against both dark (`#090D16` / `#0F172A`) and light (`#FFFFFF` / `#F8FAFC`) surfaces.

| Level | Semantic Label | Dark Hex | Light Hex | Border / Ring | Text On Dark | Text On Light | Climatological Anchor / Criteria |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Level 1** | **Normal** | `#10B981` (Emerald 500) | `#059669` (Emerald 600) | `#064E3B` / `#A7F3D0` | `#ECFDF5` | `#064E3B` | HTSI < P50, UTCI < 26°C |
| **Level 2** | **Moderate** | `#F59E0B` (Amber 500) | `#D97706` (Amber 600) | `#78350F` / `#FDE68A` | `#FFFBEB` | `#78350F` | HTSI P50–P75, UTCI 26–32°C |
| **Level 3** | **High** | `#F97316` (Orange 500) | `#EA580C` (Orange 600) | `#7C2D12` / `#FED7AA` | `#FFF7ED` | `#7C2D12` | HTSI P75–P90, UTCI 32–38°C |
| **Level 4** | **Very High** | `#EF4444` (Red 500) | `#DC2626` (Red 600) | `#7F1D1D` / `#FECACA` | `#FEF2F2` | `#7F1D1D` | HTSI P90–P97.5, UTCI 38–46°C |
| **Level 5** | **Extreme** | `#7C3AED` (Purple 600) | `#6D28D9` (Purple 700) | `#4C1D95` / `#DDD6FE` | `#F5F3FF` | `#4C1D95` | HTSI > P97.5 or UTCI ≥ 46°C |

> **Critical Rule:** In the event of an `extreme_thermal_event` (UTCI ≥ 46°C), the UI triggers an animated pulsing beacon on Level 5 tokens with a high-visibility hazard warning icon.

### 3.2 Neutral Palette (Command Intelligence Theme)
- **Dark Surface (Primary Default):**
  - App Background: `#090D16` (Obsidian Navy)
  - Sidebar & Top Navigation: `#0B1120` (Midnight Slate)
  - Card / Panel Surface: `#131D31` (Elevated Navy)
  - Card Hover / Highlight: `#1A2744`
  - Border Subtle: `#1E293B` (Slate 800)
  - Border Prominent: `#334155` (Slate 700)
  - Text Primary: `#F8FAFC` (Slate 50)
  - Text Secondary: `#94A3B8` (Slate 400)
  - Text Muted: `#64748B` (Slate 500)
- **Light Surface (High-Contrast Day Mode):**
  - App Background: `#F8FAFC` (Slate 50)
  - Card Surface: `#FFFFFF`
  - Border Subtle: `#E2E8F0` (Slate 200)
  - Border Prominent: `#CBD5E1` (Slate 300)
  - Text Primary: `#0F172A` (Slate 900)
  - Text Secondary: `#475569` (Slate 600)

### 3.3 Typography
- **Primary Body & Display Font:** `Inter`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Monospace & Data Metric Font:** `JetBrains Mono`, `ui-monospace, SFMono-Regular, "Courier New", monospace`
- **Typographic Rules:**
  - All numerical readouts (HTSI scores, temperatures, coordinates, population counts, p-values) **MUST** use `tabular-nums font-mono`.
  - Leading capitalization for headers; all-caps with `tracking-wider` only for metadata badges, table headers, and category tags.

| Style Token | Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 32px (2.0rem) | 38px | 700 | -0.02em | Hero values, primary city HTSI score |
| `heading-1` | 24px (1.5rem) | 30px | 600 | -0.015em | Screen titles, primary module headers |
| `heading-2` | 18px (1.125rem) | 24px | 600 | -0.01em | Card headers, modal titles, section dividers |
| `heading-3` | 14px (0.875rem) | 20px | 600 | 0 | Subsection headers, table group titles |
| `body-md` | 14px (0.875rem) | 20px | 400 / 500 | 0 | Default text, descriptions, table cells |
| `body-sm` | 12px (0.75rem) | 16px | 400 / 500 | +0.005em | Supporting text, metadata, tooltips |
| `mono-data` | 13px–20px | 1.2 | 500 / 600 | -0.02em | Coordinates, temperatures, raw indices |
| `label-caps` | 11px (0.6875rem) | 14px | 600 | +0.05em | Badges, table column headers, tag pills |

### 3.4 Spacing & 8-Point Layout Grid
- Base unit: `4px` / `8px`
- Scale: `2xs: 4px`, `xs: 8px`, `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`, `3xl: 64px`
- Grid Structure:
  - Global App Shell: Fixed Left Nav Sidebar (`256px` expanded / `72px` collapsed), Top Command Header (`64px` height), Dynamic Fluid Workspace (`min-w-0 flex-1`).
  - Screen Padding: `px-6 py-6` desktop (24px), `px-4 py-4` mobile (16px).
  - Component Gap: standard `gap-4` (16px) or `gap-6` (24px).

### 3.5 Border Radius & Shadows
- **Radius Scale:**
  - `rounded-xs`: 2px (tick marks, map indicator bars)
  - `rounded-sm`: 4px (badges, data chips, dropdown items)
  - `rounded-md`: 6px (buttons, form inputs, tooltips)
  - `rounded-lg`: 8px (standard panels, data cards)
  - `rounded-xl`: 12px (modals, primary map container, floating dossiers)
  - `rounded-full`: 9999px (status dots, circular avatars, toggle switches)
- **Shadows (Dark Mode Customized):**
  - `shadow-subtle`: `0 1px 2px 0 rgba(0, 0, 0, 0.4)`
  - `shadow-panel`: `0 4px 16px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)`
  - `shadow-modal`: `0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)`
  - `shadow-extreme-pulse`: `0 0 24px 2px rgba(124, 58, 237, 0.45)`

---

## 4. Reusable UI Components & Primitives

### 4.1 Card Styles
- **Intelligence Metric Card:**
  - Top row: Metric name in `label-caps` (`text-slate-400`), status indicator badge or icon.
  - Middle row: Massive tabular value (`display-lg` or `28px`), unit in `text-slate-400`.
  - Bottom row: Trailing delta vs 24h baseline (`+1.4°C vs yesterday`) and validation confidence badge (`ERA5 ML-Calibrated`).
  - Border: Subtle 1px solid `border-slate-800`, with optional severity-accent top border (2px colored accent bar for Elevated/High/Extreme).
- **Interactive Ward Card:**
  - Header: Ward ID pill (`W114`), Ward Name (`Chintadripet`), Zone (`Zone 08 - Anna Nagar`).
  - Body: 3-column micro-grid: Hazard ($H$), Exposure ($E$), Vulnerability ($V$).
  - Action footer: Quick link to full dossier, pinpoint on GIS map button.

### 4.2 Button Styles
- **Primary Action (Brand / Accent):** Solid indigo/blue (`bg-blue-600 hover:bg-blue-500 text-white shadow-sm rounded-md px-3.5 py-2 font-medium text-sm flex items-center gap-2`).
- **Secondary Action (Neutral):** Slate subtle (`bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md px-3.5 py-2 font-medium text-sm`).
- **Critical / Emergency Action:** Warning crimson (`bg-red-600 hover:bg-red-500 text-white rounded-md px-3.5 py-2 font-medium text-sm`).
- **Ghost / Tool Button:** (`hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 rounded-md p-2`).
- **Focus Rings:** Strict `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`.

### 4.3 Input & Select Styles
- **Search & Quick-Filter Bar:**
  - Dark glass surface (`bg-slate-900/90 border border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-md px-3 py-1.5 text-sm`).
  - Integrated keyboard shortcut hint (`Cmd+K` / `Ctrl+K` chip).
- **Zone Multi-Select Dropdown:**
  - Custom popover listing all 15 GCC Zones with ward counts and max active severity tag.
- **Metric Toggle Group (Segmented Controls):**
  - Pill tabs with active slider indicator (`bg-slate-950 p-1 rounded-lg border border-slate-800 flex gap-1`).
  - Options: `Human Risk (B)` | `HTSI Hazard` | `UTCI (°C)` | `WBGT (°C)` | `Exposure (Pop)` | `HWC Access`.

### 4.4 Navigation & Sidebar Architecture
- **Global Header (Height: 64px):**
  - Left: GCC Logo + HeatPulse Logo + Live System Status pill (`LIVE OPERATIONAL • IST UTC+05:30`).
  - Center: Citywide Alert Ticker (`24 Wards under HIGH risk | Zone 05, 08 requiring hydration advisories`).
  - Right: Quick Search (`Cmd+K`), Data Freshness Timestamp (`Updated 14:00 IST • Model v4.3`), Language switcher (`English / தமிழ்`), Dark/Light mode toggle.
- **Collapsible Primary Navigation Sidebar (Width: 256px / 72px):**
  - Navigation Items (with dedicated Lucide/GIS icons):
    1. **Dashboard** (`/`) — Citywide executive summary & early warning triage.
    2. **Heat Map** (`/map`) — High-precision 200-ward GIS choropleth and 5-grid overlay.
    3. **5-Day Forecast** (`/forecast`) — XGBoost calibrated temporal predictions & diurnal curves.
    4. **Ward Details** (`/wards`) — Individual ward drilldown dossier and formula decomposition.
    5. **Alerts & Advisories** (`/alerts`) — Stakeholder action matrices, vulnerable group protocols.
    6. **Methodology** (`/methodology`) — Open-science documentation, formula derivations, limitations.
  - Bottom Sidebar Shelf:
    - Data Provenance indicator (`WorldPop 2020 + GCC 140 HWC + ERA5`).
    - API / Export Report link (`CSV / GeoJSON`).

### 4.5 Badges & Status Indicators
- **Severity Badge:** Pill shape with dot indicator.
  - `Normal`: Green dot `#10B981`, Green tinted background `rgba(16, 185, 129, 0.1)`, Text `#10B981`.
  - `Moderate`: Amber dot `#F59E0B`, Amber background `rgba(245, 158, 11, 0.1)`, Text `#F59E0B`.
  - `High`: Orange dot `#F97316`, Orange background `rgba(249, 115, 22, 0.1)`, Text `#F97316`.
  - `Very High`: Red dot `#EF4444`, Red background `rgba(239, 68, 68, 0.1)`, Text `#EF4444`.
  - `Extreme`: Purple pulse dot `#7C3AED`, Purple background `rgba(124, 58, 237, 0.1)`, Text `#A855F7`.
- **Data Provenance Tag:**
  - `MODELED GRID-SCALE`: Slate badge indicating reanalysis origin.
  - `DERIVED POPULATION`: Indicates WorldPop R2025A 2020 derived aggregation.
  - `PROXY ADAPTIVE CAPACITY`: Indicates GCC 140-facility HWC/UPHC ratio.
  - `LIMITATION APPLIED`: Stating explicit omission (e.g. green space / slum data).

### 4.6 GIS Map Legend
- Positioned floating at the bottom-right of the map screen.
- Stepped gradient bar with 5 discrete buckets (`Normal: <0.20`, `Moderate: 0.20–0.35`, `High: 0.35–0.50`, `Very High: 0.50–0.70`, `Extreme: ≥0.70`).
- Interactive hover: Hovering a legend bucket highlights all matching wards on the canvas while dimming others.
- Unit indicator and active layer switch toggle directly in the legend header.

### 4.7 Chart Styles & Visualization Guidelines
- Clean, uncluttered SVG/Canvas charts using `recharts` or custom SVG paths.
- Background grid lines: very subtle dashed slate `rgba(255, 255, 255, 0.05)`.
- Critical reference threshold bands:
  - 26°C / 32°C / 38°C / 46°C for UTCI.
  - P50, P75, P90, P97.5 for HTSI.
- Diurnal Night Shading: Darker blue-indigo shaded background band across 22:00–06:00 IST hours denoting Nighttime Thermal Burden ($N$).

### 4.8 Tooltip Styles
- High-density micro-dossier popover (`bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-xl rounded-lg p-3 text-xs`).
- Ward hover tooltip displays:
  - Ward Number & Name, Zone.
  - Primary Risk Score with colored severity badge.
  - HTSI score, UTCI, WBGT.
  - Derived Population & Density.
  - HWC count within ward boundary.

### 4.9 System States: Loading, Empty, and Error
- **Loading State:** Content-aware Skeleton shimmer mimicking exact table/map/metric layouts (`animate-pulse bg-slate-800/60 rounded-md`). Map displays a discreet spinner: "Aggregating 200 Ward Polygons...".
- **Empty State:** Filter produces no wards: Clean slate illustration, "No wards match selected filters", with a "Reset Filters" action button.
- **Error State:** Network / Model fault: Clear diagnostic banner specifying the failure mode (e.g., "ERA5-Land Grid Service Unavailable; showing cached snapshot from 2026-09-10 14:00 IST"). Never fail silently.

---

## 5. Screen Flow & Detailed Page Specifications

### Screen 1: Home Dashboard (Command Center & Executive View)
**Purpose:** Provide GCC commissioners, public health directors, and disaster coordinators with immediate situational awareness of Chennai's heat risk posture.

#### Key Sections:
1. **Executive Heat Risk Banner:**
   - Citywide Alert Level Badge (e.g. `HIGH ALERT • 37 Wards in High/Very High Category`).
   - Peak City Temperature ($T_{2m}$), Max UTCI (°C), Trailing 24h Nighttime Burden Flag.
   - Recommended Municipal Action Summary (e.g., "Activate water misting stations in Royapuram & Thiru-Vi-Ka Nagar; suspend outdoor manual labor 12:00–15:30 IST").
2. **Top-Level KPI Grid (4 Intelligence Cards):**
   - *Card A: Peak Human Heat Risk:* Highest ward score in the city (`0.68 - Very High`, Ward 114).
   - *Card B: Peak Thermal Stress (UTCI):* `41.2°C (Strong Heat Stress)` at coastal grid `13.1°N, 80.2°E`.
   - *Card C: Population at Elevated Risk:* Number of residents in High/Very High wards (e.g., `1,240,500` derived population).
   - *Card D: Nighttime Heat Retention ($N$):* `P92.4 Anomaly` — Indicates inadequate nocturnal physiological recovery.
3. **Interactive 200-Ward Choropleth Quick-Viewer (Center Stage):**
   - 2D SVG/Canvas map of Chennai's 200 wards colored by the selected metric (Formula B Risk, HTSI, UTCI, WBGT).
   - Quick-toggle layer buttons right on top of the map.
   - Click ward to pin summary card on the right panel.
4. **Top 10 Critical Wards Triage Table:**
   - Sortable table of the most critical wards: Ward ID, Ward Name, Zone, Risk Score, HTSI, UTCI, Population Density, HWC facilities.
   - Direct action button: `Inspect Dossier` $\to$ deep-link to Ward Details.
5. **24-Hour Diurnal Progression Chart:**
   - Visualizing hourly calibrated temperature, UTCI, and outdoor WBGT across IST time.
   - Highlighted shaded bands for peak danger hours (11:00–16:00 IST) and nighttime burden (22:00–06:00 IST).

---

### Screen 2: Heat Map (GIS & Ward Spatial Intelligence)
**Purpose:** Deep geospatial exploration of heat hazard, demographic exposure, and healthcare adaptive capacity across the 200 wards and 5 ERA5-Land grid cells.

#### Key Features & Controls:
1. **Full-Bleed GIS Canvas:**
   - Crisp rendering of Chennai's municipal boundary, coastal boundary of Bay of Bengal, Adyar and Cooum rivers, and 200 ward polygon borders.
   - The 5 ERA5-Land 0.1° grid cells rendered as dashed bounding boxes with centroid pins (`12.8°N, 80.2°E` to `13.2°N, 80.2°E`).
2. **Layer Switcher (Floating Top-Left Panel):**
   - *Theme 1: Operational Human Heat Risk:* Formula B `H × E × (0.5 + 0.5V)`.
   - *Theme 2: Thermal Hazard (HTSI):* Continuous operational score 0–100.
   - *Theme 3: Biophysical Stress (UTCI & WBGT):* °C equivalent.
   - *Theme 4: Exposure ($E$):* WorldPop 2020 derived population density.
   - *Theme 5: Adaptive Capacity ($A$):* HWC/UPHC facility density per 10k pop.
   - *Theme 6: Grid Centroids & Mapping Quality:* Distance to assigned ERA5 grid cell (QC metric).
3. **Filter & Search Drawer (Left Side):**
   - Search by Ward Name or ID (auto-suggest 1–200).
   - Filter by Zone (1 to 15: North, Central, South Chennai).
   - Filter by Severity Level (`Normal` to `Extreme`).
4. **Inspector Drawer (Right Floating Slide-Over):**
   - Opens when a ward is clicked.
   - Displays full ward breakdown: radar chart of Hazard vs Exposure vs Vulnerability, assigned grid cell ID, nearest HWC name, and direct "Download Ward PDF Brief" action.

---

### Screen 3: 5-Day Forecast (Pointwise & Calibrated Model Engine)
**Purpose:** Display calibrated predictive heat stress outlook from Lead Day 1 to Lead Day 5, communicating ML uncertainty transparently.

#### Key Features & Layout:
1. **5-Day Outlook Carousel / Stepper:**
   - 5 distinct day cards (D+1 to D+5).
   - Each day card shows: Expected Max HTSI level, Peak UTCI, Peak WBGT, Max Air Temp, and ML Confidence rating.
2. **Pointwise vs Cumulative Calibration Transparency Strip:**
   - Notice: "Pointwise variables (Temp, RH, Wind, UTCI, WBGT) calibrated using **XGBoost** (34.2% wind MAE improvement; 24.8% UTCI MAE improvement). Cumulative persistence metrics ($B_{24}, B_{72}$, HTSI) calibrated using **Mean Bias Correction** to preserve multi-day temporal persistence."
3. **Interactive Multi-Parameter Forecast Timeline (24h × 5 Days = 120 Hours):**
   - Synchronized timeline slider.
   - Toggle lines: Temperature ($T_a$), Mean Radiant Temperature ($T_{mrt}$), UTCI, WBGT outdoor, and NOAA Heat Index.
   - Shaded danger zone when UTCI exceeds 38°C (Very Strong Stress) and 46°C (Extreme Stress).
4. **Lead-Time Accuracy Matrix (Scientific Audit Table):**
   - Shows model historical MAE at Day 1 (0.85°C) vs Day 5 (0.95°C) to build institutional trust with decision makers.

---

### Screen 4: Ward Details (Drilldown Ward Dossier)
**Purpose:** Complete analytical dossier for any selected GCC ward (1 to 200), providing municipal ward officers with hyper-local context and mathematical explainability.

#### Key Sections:
1. **Ward Header & Identity Card:**
   - Ward Number (`Ward 114`), Official Name (`Chintadripet`), Zone (`Zone 08 - Anna Nagar`), Region (`Central Chennai`).
   - Assigned Meteorological Grid Cell: `Grid_13.0_80.2` (Centroid distance: 2.1 km).
   - Overall Operational Risk Score: `0.642` (`VERY HIGH`).
2. **Formula Decomposition Breakdown Card (Interactive Math Explainer):**
   - Displays the exact formula: $\text{Risk} = H \times E \times (0.5 + 0.5V)$
   - Step 1: Hazard $H = \text{HTSI}/100 = 68.4 / 100 = \mathbf{0.684}$
   - Step 2: Exposure $E = \text{NormPopDensity} = \mathbf{0.821}$ (Derived Pop: 28,450; Area: 0.72 km²)
   - Step 3: Vulnerability $V = 0.5S + 0.5(1-A) = 0.5(0.821) + 0.5(1 - 0.410) = \mathbf{0.705}$
   - Calculated Result: $0.684 \times 0.821 \times (0.5 + 0.5 \times 0.705) = \mathbf{0.480}$
   - Formula Comparison Toggle: Switch between Formula B (Selected) and Formula A ($H \times E \times V$) with explanation of why Formula B protects against false negatives.
3. **Thermal Environment Metrics Panel:**
   - Current Air Temp ($T_{2m}$), Dew Point, Relative Humidity, Wind Speed ($v_{10}$).
   - Modeled Mean Radiant Temp ($T_{mrt}$): Spencer/Erbs solar balance.
   - UTCI (°C) and WBGT Outdoor (°C).
   - Trailing 24h & 72h Heat Burden ($B_{24}, B_{72}$).
   - Nighttime Thermal Stress ($N$): IST Night temp anomaly.
4. **Healthcare Availability & Demographics Panel:**
   - Total derived population: 28,450 (WorldPop R2025A 2020 modeled).
   - Healthcare Facilities in Ward: 1 Urban Primary Health Centre (UPHC).
   - Facilities per 10k derived population: 0.35.
5. **Data Limitations & Audit Notice:**
   - Highlighting that slum settlement geometry and green cooling capacity are omitted due to lack of current authoritative ward-compatible spatial data.

---

### Screen 5: Alerts & Advisories (Public Health Action Matrix)
**Purpose:** Translate complex meteorological and biophysical indicators into actionable, role-based public health standard operating procedures (SOPs).

#### Key Sections:
1. **Citywide Active Alert Status Board:**
   - Active alert banner with countdown timer to next scheduled model forecast run (every 6 hours).
   - Number of wards in each of the 5 severity tiers.
2. **Role-Based Action Protocol Matrix:**
   - Tabs for 4 critical target user cohorts:
     - **Tab A: GCC Municipal Administration & Zonal Officers** (Water tanker dispatch, parks opening for night cooling, shelter activations).
     - **Tab B: Primary Healthcare Centres (UPHC/HWC)** (ORS packet stockpiling, IV fluid readiness, heat exhaustion triage bed allocation).
     - **Tab C: Outdoor Workers, Labor Contractors & Traffic Police** (Mandatory rest breaks 12:00–15:00, shading provision, electrolyte distribution).
     - **Tab D: General Public & Vulnerable Citizens** (Elderly hydration reminders, pet safety, avoidance of direct sun exposure).
3. **Automated Advisory Generator & Export:**
   - Ready-to-broadcast municipal press release / SMS advisory in English and Tamil.
   - One-click copy for WhatsApp broadcast channels and emergency public address systems.
4. **Emergency Escalation Triggers Table:**
   - Defined criteria for triggering Yellow, Orange, and Red alert stages aligned with GCC and NDMA protocols.

---

### Screen 6: Methodology & Scientific Explainability
**Purpose:** Establish complete scientific integrity and academic transparency for researchers, evaluators, SIH judges, and government stakeholders.

#### Key Sections:
1. **End-to-End Scientific Architecture Diagram:**
   - Flow diagram tracing raw data ingestion (ERA5-Land, WorldPop, GCC HWC PDF) $\to$ Thermal Engine $\to$ ML Calibration $\to$ Risk Fusion $\to$ Dashboard.
2. **Thermal Metric Formulations:**
   - Detailed mathematical definitions of UTCI (6th-order polynomial, ISO 7730), WBGT (Liljegren non-linear mass transfer), Tmrt (two-hemisphere radiation balance), and NOAA Heat Index.
3. **HTSI Detailed Formulation:**
   - `HTSI = 0.64U + 0.16W + 0.10B24 + 0.06B72 + 0.04N`
   - Explicit definitions of the piecewise anchors for UTCI continuous scoring ($U$), local climatological WBGT percentile anomaly ($W$), rolling trailing burdens ($B_{24}, B_{72}$), and IST nighttime anomaly ($N$).
4. **Machine Learning Calibration Validation (Phase 4 Step 3):**
   - Side-by-side performance audit table comparing Raw ECMWF vs Mean Bias vs XGBoost.
   - Documented finding: XGBoost provides superior pointwise thermal metrics, while Mean Bias preserves temporal persistence in cumulative metrics.
5. **Transparency & Limitations Register:**
   - Comprehensive inventory of project design choices, including why green cooling was omitted (2016 park PDF artifact) and why Census 2011 was not used for current 200-ward population counts.

---

## 6. Responsive Breakpoints & Multi-Device Adaptation

| Breakpoint | Target Devices | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop XL (≥ 1440px)** | Primary Command Centers, Large Monitors | Fixed 256px sidebar, 12-column grid, map with persistent side inspector dossier. |
| **Desktop Standard (1280px–1439px)** | Laptops & Standard Displays | Collapsible sidebar (icons-only 72px mode), 8-column layout, slide-over inspector. |
| **Tablet Landscape (1024px–1279px)** | Field Tablets, Emergency Vehicles | Collapsed icon navigation, stacked 2-column KPI cards, map overlay toggle. |
| **Tablet Portrait / Mobile (< 1024px)** | On-ground Health Workers, Supervisors | Bottom navigation bar, vertical stacked cards, modal sheet for ward dossiers. |

---

## 7. Implementation Roadmap & Next Steps
- **Phase F0 (Completed Here):** Design Foundation, Design Tokens, Severity Color System, UI Components Specification, and Complete Screen Flow Architecture.
- **Phase F1 (Screen Prototyping):** Implement the high-fidelity Next.js + Tailwind + shadcn/ui screens with interactive state management, simulated 200-ward dataset, and GIS map view.
- **Phase F2 (Backend Integration):** Connect Next.js frontend to FastAPI backend endpoints (`/api/v1/risk`, `/api/v1/forecast`, `/api/v1/wards`).
