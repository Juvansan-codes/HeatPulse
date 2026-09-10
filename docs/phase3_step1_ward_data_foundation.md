# Phase 3 Step 1 — Ward Data Foundation Preflight

## Status: blocked safely

No 200-row ward master dataset has been created. This is intentional: the required data foundation cannot be assembled without inventing a Census-to-current-ward relationship and health-data assignment.

## Sources located

- GCC's official `EDP_wardBoundary_2025` service is available at `GCCDepts/EDPMobile2025/FeatureServer/2`; its published schema includes `ward_id`, `ward`, `zone_id`, `zone`, `region`, `ac_name`, `ac_no`, and geometry/area fields.
- The official Census of India PCA-TV catalogue is `PC11_PCA-TV-3302`, Chennai, 2011. It is a historical demographic baseline, not current population.
- The official OGD Chennai Health Infrastructure catalogue describes ward-wise facility, beds, doctors, physicians, nurses, and midwives; its listed publication date is 28 June 2019 and any export must retain that vintage.

## Local-input QC results

| Check | Result |
| --- | --- |
| Official 2025 GCC export present | Yes — preserved as `EDP_wardBoundary_2025.geojson` and validated separately in Step 1B |
| Existing GIS geometry | Official GCC FeatureServer geometry is now the permitted spatial backbone; the older Datameet file is not used for Phase 3 |
| Local Census data grain | 8,802 enumeration-block rows |
| Distinct Census ward IDs | 155 |
| Target current GCC wards | 200 |
| Existing ERA5 mapping | 200 unique wards, 4 assigned grids, no missing assignments (the weather archive retains 5 valid grids) |
| Official health export present | No |

The direct Census ward-number join fails: 155 historical Census wards cannot be represented as 200 current GCC wards by shared numeric IDs. Existing repository investigation also found many-to-many spatial relationships. Therefore a master table, population density, demographic percentages, and health-capacity aggregates would be scientifically unsupported at this point.

## Reproducible gate

Run `python scripts/phase3_step1_ward_data_foundation.py` to write the machine-readable preflight report under `data/validation/gis/`. It does not download data, mutate existing GIS/thermal datasets, recompute ERA5 mapping, or create a false join. Tests validate this stop condition and the existing mapping's 200-ward relational coverage.

## Required resolution

1. Preserve the official Census PCA-TV/HL-14 source files and inspect their exact fields/definitions.
2. Preserve the official OGD health export, including publication date and ward identifier schema.
3. Obtain an official delimitation crosswalk, or approve and validate a documented spatial-overlap allocation methodology before any 155-to-200 population allocation.

Until then: Census 2011 is not 2026 demographics; ERA5 remains grid-scale meteorology assigned relationally to wards; no health/mortality/vulnerability/HumanRisk model is implemented.
