# Phase 3: WorldPop exposure layer

## Result

`data/processed/gis/ward_exposure_200.csv` contains 200 derived population-exposure estimates, one for every current GCC ward (IDs 1--200). This is **not** an official 2026 population count.

The total derived 2020 population is **4,356,504.51**. Ward population ranges from **6,496.83** to **64,364.43** (median **19,814.61**); derived density ranges from **1,759.22** to **17,576.29 people/km2** (median **13,706.76**).

## Input and aggregation

- **Target geography:** the official GCC 2025 200-ward GeoJSON, in EPSG:4326.
- **Population product:** WorldPop R2025A, 2020, 100 m product, queried through the public WorldPop v2 polygon API.
- **Units:** modeled people per raster grid cell. The API returns `total_population` for the submitted ward polygon; it is treated as a population count, not a density.
- **Method:** direct polygonal zonal aggregation of the 100 m modeled cells using each official ward polygon. `population_density` is calculated as `population / area_km2`, where `area_km2` is the authoritative `Shape__Area` geometry attribute converted to square kilometres.
- **Status:** `population_is_derived=True` and `population_confidence=MEDIUM` for every record.

The script uses three concurrent API requests, retries transient failures, writes every successful ward response to `data/validation/gis/worldpop_2020_ward_cache.json`, and resumes from that cache. This prevents an interrupted public-API session from restarting completed polygons. The generated machine-readable summary is `data/validation/gis/ward_exposure_200_metadata.json` and includes total/min/max/median values plus the top and bottom ten wards by population.

## Validation

The integrity test verifies 200 unique and complete ward IDs, non-negative population and density, positive area, the density formula, populated provenance fields, a 2020 vintage, and explicit derived status.

No independent GHSL comparison was run in this execution. It is therefore a documented validation limitation, not an accuracy claim.

## Scope and limitations

WorldPop is a modeled gridded population estimate rather than an official Census enumeration. Values should be described as **derived WorldPop 2020 population estimates aggregated to current 2025 GCC wards**. They do not support household, child, slum, health-care, sensitivity, adaptive-capacity, vulnerability, human-risk, physiological, or medical conclusions. No Census 155-to-200 crosswalk was used.

Sources: [WorldPop API v2](https://api.worldpop.org/v2/) and [WorldPop R2025A 2020 India product](https://hub.worldpop.org/geodata/summary?id=10127).
