# Phase 3 Step 1B — Census EB to Current GCC Ward Crosswalk Research

## Research result: CROSSWALK NOT PROVEN

The available evidence does not establish an authoritative 2011 Census Enumeration Block (EB) to current GCC 200-ward relationship. No crosswalk, reconstructed population field, or 200-ward demographic master dataset has been created.

## Evidence inspected

| Source | What it establishes | Production use |
| --- | --- | --- |
| Official GCC `EDP_wardBoundary_2025` FeatureServer layer | 200 current ward polygons and current administrative attributes | Yes, as the current spatial backbone |
| Tamil Nadu Government Gazette, 2018 delimitation No. 408 | Delimitation used published 2011 Census figures and supplies 200 ward boundary schedules | Boundary evidence only; not an EB crosswalk |
| Census of India PCA-TV `PC11_PCA-TV-3302` / DCHB Chennai 2011 | Census 2011 demographic tables and Census EB context | Historical Census source only |
| OGD `Health Infrastructure : Chennai` catalogue | Intended ward-wise facility/staffing fields and a historical catalogue source | Not yet: export and ward schema absent locally |

The Gazette has no match for `Enumeration Block`. Its apparent `EB` phrases are local Electricity Board references (for example, EB Road/EB Office), not Census EB identifiers. It does not provide an EB-to-ward schedule, EB number range, or population schedule that can reconstruct the required mapping.

## Census EB extract structure

`data/raw/demographics/census/chennai_census_2011.csv` has 8,802 rows and fields: `Location Code`, `Name of Town`, `Ward Number`, `Enumberation Block`, `Total Population`, `SC Population`, and `ST Population`. It contains 155 historical ward IDs. `Enumberation Block` values include EB and sub-EB labels (for example, `EB No.-0043 SUB-EB No.01`). The `(Ward Number, Enumberation Block)` pair is unique, but labels are not globally unique: there are 2,108 distinct labels across 8,802 records. There are no coordinate, boundary, or geometry fields. Accordingly, the rows can be identified as EB/sub-EB enumeration records within the 2011 historical ward geography, but cannot be spatially assigned to current wards from this file.

The local extract has only population/SC/ST values; it does not contain households, sex, age 0–6, literacy, or worker fields. The official PCA-TV catalogue lists these broader ward-level fields, but they have not been downloaded or joined.

## Current GCC 200-ward geometry

The official GCC geometry has been preserved as `data/raw/gis/gcc/EDP_wardBoundary_2025.geojson`, downloaded directly from the GCC FeatureServer. It has 200 Polygon features, 200 unique non-null values of `ward` (the 1–200 ward number), and 200 unique `ward_id` values. `ward_id` is an internal GIS feature identifier, not the ward number. The saved layer is EPSG:4326, has no duplicate geometries in inspection, and has `Shape__Area` values of 0.403–10.198 km².

The existing 200-row ERA5 mapping joins completely to the official layer's `ward` field, not to the GIS internal `ward_id`. ERA5 remains grid-level meteorology assigned relationally to wards.

## Population and health validation

No GCC published 200-ward population table was found in the inspected final Gazette; it contains boundary schedules rather than a population schedule. No reconstructed population exists, so no comparison is possible.

The OGD health catalogue states it covers facility name/type/level, beds, doctors, physicians, nurses, and midwives. However, no resource export was available locally, so record count, publication/vintage field, duplicate facilities, and ward-ID compatibility are untested. It must not be joined by assumed ward number.

## Decision and single next action

Do **not** build the demographic master yet. The single next action is to obtain an authoritative, machine-readable Census EB-to-2018/current-GCC-ward assignment (or official EB polygons with an approved allocation basis); only then can reconstruction and validation against an authoritative 200-ward population schedule begin.

Run `python scripts/phase3_step1_eb_crosswalk_research.py` to regenerate `data/validation/gis/eb_crosswalk_research.csv` and `eb_crosswalk_qc.json`. These are evidence records, not a crosswalk.
