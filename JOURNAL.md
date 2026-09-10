# Development Journal

## 2026-09-10 (Phase 3: WorldPop exposure)
**Status:** IMPLEMENTED AND VALIDATED
- Generated `data/processed/gis/ward_exposure_200.csv`: 200 derived WorldPop R2025A 2020, 100 m population estimates directly aggregated to the official current GCC 2025 ward polygons.
- The derived total is 4,356,504.51 people. Every record is marked `population_is_derived=True` with `MEDIUM` confidence; it is not an official Census/2026 population count.
- Added an API retry, small-concurrency, per-ward persistent-cache/resume implementation after the original all-or-nothing 12-thread request batch failed before writing output.
- Added the integrity test and method documentation. No Census crosswalk, household/child estimate, vulnerability, or human-risk work was performed.

## 2026-09-10 (Phase 3: ward healthcare, vulnerability, and human heat risk)
**Status:** IMPLEMENTED WITH LIMITATIONS
- Added `scripts/phase3_step2_healthcare.py`, which parses the local GCC 140 HWC PDF and verifies all 140 Zone/Division pairs against current GCC 2025 zone/ward identifiers. It produces a 200-ward HWC/UPHC availability proxy and facilities per 10,000 derived WorldPop population.
- Added `scripts/phase3_step3_green_capacity.py`. Green/cooling was intentionally omitted because the available park PDF is a 2016 historical artifact and no current ward-compatible green geometry or vegetation product was available.
- Added `scripts/phase3_step4_vulnerability.py`. The reduced model is `V = 0.5*S + 0.5*(1-A)`, using normalized population density for structural sensitivity and normalized HWC/UPHC availability for adaptive capacity.
- Added `scripts/phase3_step5_human_heat_risk.py`. It creates a 200-ward latest HTSI snapshot without duplicating the full thermal history. Selected formula: `Risk = H x E x (0.5 + 0.5V)` where `H=HTSI/100` and `E` is normalized population density.
- Intentionally omitted current ward-compatible slum/informal-settlement, elderly, disability, chronic-disease, mortality, hospitalization, and other observed-health variables because authoritative compatible sources were not established. No existing HTSI or thermal output was modified.

## 2026-09-10 (Phase 2 Step 6: HTSI)
**Status:** IMPLEMENTED
- Added a separate 2014–2023 grid-level HTSI fact table derived read-only from Step 4; validated Tmrt, WBGT, and UTCI outputs were not changed.
- HTSI uses finalized operational weights: UTCI score, local WBGT percentile anomaly, trailing 24/72-hour UTCI burden, and IST nighttime local-temperature anomaly. Heat Index is retained only as a supporting output.
- Added reproducible validation, sensitivity, and descriptive-report generation. The index is explicitly project-specific, modeled, grid-level thermal hazard—not a medical or mortality prediction.

## 2026-09-10 (ARCO Pipeline Migration)
**Phase 1D: Full Historical ARCO Acquisition (2014-2023)**
- **Status:** COMPLETED
- **What changed:** Migrated the legacy ERA5-Land monthly CDS download script to a highly-optimized, cloud-native ARCO Zarr pipeline. Extracted the entire decade (2014-2023) using lazy Dask chunking in 13.35 seconds, resulting in a 16MB canonical Parquet file with zero drift compared to legacy NetCDF data.
- **Notes:** 
  - **Memory Safety:** Leveraged `xarray.open_zarr` with `chunks='auto'` and `dask` to slice the temporal/spatial coordinates prior to `.compute()`, keeping peak memory under 300MB.
  - **Grid-cell verification:** The bounding box slice strictly extracted exactly 10 raw grid cells, of which exactly 5 were land cells (having non-NaN data). We explicitly filtered out the 5 ocean cells and retained the 5 accurate land cells to avoid polluting the dataset with NaNs.
  - **SSRD Validation:** Programmatic attribute inspection confirmed that ARCO `ssrd` is accumulated (`GRIB_stepType: accum`, `GRIB_stepUnits: 1`). As a result, the script correctly applies a flat `/3600` conversion across the hourly time series to yield $W/m^2$ average flux over the preceding hour.

## 2026-09-09 (Investigation Review)
**Phase 1: Data Acquisition & Investigations**
- **Status:** BLOCKED BY CREDENTIALS (ERA5)
- **Verified Facts:** 
  - **201 Geometries:** The GCC boundary GeoJSON contains exactly 200 regular wards (IDs 1-200) and 1 non-ward administrative polygon (ID `0`, St. Thomas Mount Cantonment Board). The 200 regular wards represent the actual ward layer.
  - **Census Crosswalk:** The 2011 Census uses a 155-ward spatial geography. Spatial crosswalking IS possible via geometric intersection. The intersection matrix identified 9 `1:1` matches, 48 `1:many` splits, and 98 `many:1` merges. An area-weighted distribution is mathematically possible, though limited by uniform density assumptions.
  - **ERA5-Land Access:** The `cdsapi` is correctly installed (v0.7.7) and compatible with the new Copernicus Beta API (`https://cds.climate.copernicus.eu/api`). The feasibility script successfully extracted from the returned API `.zip` archives.
  - **ERA5 Feasibility Test:** SUCCESS. Downloaded 7 days of ERA5-Land data, derived Relative Humidity and Wind Speed, mapped variables to Canonical Schema, and wrote the final DataFrame to `chennai_sample_canonical.parquet` successfully.

## 2026-09-09
**Phase 0: Foundation**
- **Status:** IMPLEMENTED AND VERIFIED
- **What changed:** Initialized git repository, created root structure, empty module stubs, and documentation placeholders. Scaffolded backend environment and Next.js frontend.
- **Notes:** 
  - Scaffolded Next.js frontend with Tailwind and TypeScript.
  - Created FastAPI backend architecture stubs (`thermal`, `ml`, `risk`, `services`, `models`, `api`, `db`, `utils`).
  - Created minimal PostGIS SQL schema.
  - Created basic IoT skeleton and mobile API contract documentation.
  - NO scientific, ML, GIS, IoT, or prediction functionality exists yet. This phase is purely structural foundation.
- **Verification Results:**
  - `git init` successful.
  - Next.js (frontend) successfully builds and uses Next 15 + TypeScript + Tailwind.
  - FastAPI (backend) virtual environment created, dependencies installed, and `pytest` passed for `/api/v1/health`.
  - No forbidden technologies (LightGBM, PyTorch, SQLAlchemy, etc.) introduced.
  - All scientific/prediction modules are completely empty stubs.

## 2026-09-10 (Phase 4: ML Calibration)
**Status:** IMPLEMENTED AND VALIDATED
- **Dataset**: orecast_hindcast_raw_2024_2025.parquet vs ERA5 Truth.
- **Train/Val/Test Split**: Train (Jan-Sep 2024), Val (Oct-Dec 2024), Test (2025 unseen).
- **Features**: Raw forecast, lead_day, lead_hours, cyclical temporal vars, spatial vars.
- **Output generated**: orecast_calibrated_2024_2025.parquet and model artifacts under models/phase4_step3/.
- **Results**: XGBoost corrected Temp, RH, Wind (34.2% imprv) and downstream pointwise indices (UTCI 24.8% imprv). Mean Bias corrected Radiation and HTSI better due to preservation of temporal persistence behavior.
- **Limitations**: Retained Mean Bias for HTSI due to smoothing conflicts in cumulative derivation from point predictions.
