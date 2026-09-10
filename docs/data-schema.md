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
