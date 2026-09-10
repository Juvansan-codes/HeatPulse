# Canonical Environmental Data Schema

| Column | Type | Unit / Format | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | `datetime64[ns, UTC]` | ISO 8601 | Observation timestamp |
| `location_id` | `string` | ID | Ward/grid/sensor identifier |
| `latitude` | `float` | Decimal degrees | Observation/grid/ward location |
| `longitude` | `float` | Decimal degrees | Observation/grid/ward location |
| `temperature_2m` | `float` | °C | 2m air temperature |
| `dew_point_2m` | `float` | °C | 2m dewpoint |
| `relative_humidity` | `float` | % | Derived from temperature/dewpoint |
| `wind_u_10m` | `float` | m/s | 10m east-west wind component |
| `wind_v_10m` | `float` | m/s | 10m north-south wind component |
| `wind_speed_10m` | `float` | m/s | Derived wind-speed magnitude |
| `solar_radiation` | `float` | W/m² | Downward surface solar radiation (calculated as ARCO SSRD [J/m²] / 3600 to yield hourly average flux) |
| `surface_pressure` | `float` | hPa | Surface pressure |
| `source` | `string` | categorical | e.g. `era5-land`, `nasa-power`, `iot` |
| `is_imputed` | `boolean` | True/False | Missing-data/imputation flag |
| `heat_index` | `float` | °C | NOAA NWS formulation |
| `wbgt` | `float` | °C | BOM Shaded WBGT approximation |
| `utci` | `float` | °C | Operational regression approximation |

## HTSI derived weather fact table

`data/processed/weather/htsi_2014_2023.parquet` is a separate, grid-level fact table. It contains `timestamp`, `grid_id`, `latitude`, `longitude`, `utci`, `utci_score`, `wbgt_outdoor`, `wbgt_percentile`, `wbgt_score`, `heat_index`, `burden_24h`, `burden_72h`, `is_night_ist`, `nighttime_temp_percentile`, `nighttime_stress`, `thermal_hazard_score`, `htsi`, `htsi_level`, `htsi_label`, `extreme_thermal_event`, and `data_quality`. It has one record per UTC timestamp/grid, not one record per ward. Ward presentation/risk joins this fact table through the existing mapping's `assigned_grid_id`.

## Phase 3 ward products

All Phase 3 ward products contain exactly 200 unique current GCC ward IDs.

- `data/processed/gis/ward_exposure_200.csv`: derived WorldPop R2025A 2020 population and `population_density`, aggregated to current GCC 2025 wards. This is modeled exposure, not official current population.
- `data/processed/gis/ward_healthcare_access_200.csv`: HWC/UPHC availability proxy from the GCC 140-facility PDF. `healthcare_facility_count` and `healthcare_facilities_per_10000_derived_population` do not represent hospital capacity.
- `data/processed/risk/ward_vulnerability_200.csv`: reduced vulnerability model with normalized population-density sensitivity and normalized healthcare availability adaptive-capacity proxy. It is not a complete demographic vulnerability assessment.
- `data/processed/risk/ward_heat_risk_latest_snapshot.csv`: one latest-available HTSI grid snapshot joined relationally to each ward through the existing nearest-grid mapping. `human_heat_risk` is an operational prioritization score, not mortality, hospitalization, or medical risk.

Green/cooling and slum/informal-settlement variables are intentionally omitted because current ward-compatible authoritative spatial sources were not available. Elderly, disability, chronic-disease, mortality, hospitalization, and other observed-health variables were not fabricated.
