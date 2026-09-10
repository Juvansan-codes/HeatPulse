# Phase 3 Step 1C — Current 200-Ward Demographic Data Research

## 1. Research conclusion

**NO CURRENT 200-WARD DEMOGRAPHIC DATA FOUND.** The official current geography is available, but no authoritative source inspected supplies demographic, household, or health records verifiably aligned to all current 200 GCC wards.

## 2. Best authoritative source

The strongest source is GCC's official `EDP_wardBoundary_2025` FeatureServer layer, preserved locally as `data/raw/gis/gcc/EDP_wardBoundary_2025.geojson`. It is directly usable as the current spatial backbone but contains only administrative/geometric fields, not demographics. Its `ward` field—not internal `ward_id`—is the 1–200 current ward number.

## 3. Variable availability

| Variable | 200-ward source? | Source | Vintage | Production usable? |
| --- | --- | --- | --- | --- |
| Population | No | Census PCA-TV (155 wards) | 2011 | No |
| Households | No | Census PCA-TV / OGD City Profile (city-wide) | 2011 / 2019 | No |
| Age 0–6 | No | Census PCA-TV (155 wards) | 2011 | No |
| Elderly | No | None located | — | No |
| Illiteracy | No | Census PCA-TV (155 wards) | 2011 | No |
| Workers | No | Census PCA-TV (155 wards) | 2011 | No |
| Marginal workers | No | Census PCA-TV (155 wards) | 2011 | No |
| Electricity | No | No current-200-ward source located | — | No |
| Water | No | No current-200-ward source located | — | No |
| Housing | No | No current-200-ward source located | — | No |
| Health facilities | Unproven | OGD Health Infrastructure catalogue | catalogue 2019; updated 2025 | No |
| Beds | Unproven | OGD Health Infrastructure catalogue | catalogue 2019; updated 2025 | No |
| Doctors | Unproven | OGD Health Infrastructure catalogue | catalogue 2019; updated 2025 | No |
| Nurses | Unproven | OGD Health Infrastructure catalogue | catalogue 2019; updated 2025 | No |

## 4. Geography compatibility

GCC geometry is exactly current-200-ward compatible: 200 features, unique ward numbers 1–200, geometry, and zone fields. The existing ERA5 mapping has 200 rows and joins to this `ward` field; it remains a relational assignment of grid-scale meteorology, not ward observations.

The Census PCA-TV source remains historical 2011 geography (155 wards), so it is not compatible. The official 2018 Gazette confirms 200 ward boundaries and Census use in delimitation, but contains no ward demographic/household schedule. The GCC `EDPMobile2025` GIS service was inspected: it exposes only roads, zone boundaries, ward boundaries, and no tables—no demographic, health, park, building, or ward-profile layer.

## 5. Health infrastructure

The official OGD catalogue describes ward-wise facility/staffing variables, but its downloadable resource was not available for local schema inspection. Therefore record count, ward ID, duplicate facilities, coverage, and compatibility with the current 200 wards remain unknown. It is not usable until that evidence exists.

## 6. Research gaps

All listed demographic, household, and validated ward-level health-capacity variables remain unavailable for the current 200 wards. Green/built-environment ward aggregates were also not found in the inspected GCC service; only roads and administrative polygons are available.

## 7. Decision

Do not build the 200-ward data foundation. No interpolation, area allocation, synthetic demographics, or 155→200 numeric join is permitted.

## Reproducibility

Run `python scripts/phase3_step1_current_200ward_data_research.py` to regenerate `data/validation/gis/current_200ward_data_inventory.csv`. The inventory records sources assessed, not production input data.

## Single next step

Request from GCC/Chennai Smart City the underlying ward-wise 200-division population/household dataset or an authoritative public resource export with its ward-ID dictionary; validate it against the official `ward` field before any integration.
