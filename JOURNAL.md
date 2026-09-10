# Development Journal

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
