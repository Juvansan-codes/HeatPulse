# HeatPulse API Contract

## Architecture
**Scientific pipeline → Validated Parquet → Production serving DB → FastAPI READ API → Next.js / Flutter clients**

This FastAPI backend serves strictly as a **read-only** presentation layer over the production Supabase PostgreSQL serving database. It does not perform scientific computation, retrain models, or mutate the database.

## Terminology
* **HTSI**: Human Thermal Stress Index. A project-specific operational thermal hazard score. Its levels are historical operational severity bands based on project methodology. They are NOT official IMD warning categories.
* **Human Heat Risk**: An operational heat-impact risk score combining hazard, exposure, and vulnerability. It is NOT mortality prediction, medical diagnosis, or clinical risk.

## Endpoints

### 1. `GET /api/v1/health`
Checks whether the application and the production database are available.
**Response (200 OK):**
```json
{
  "status": "ok",
  "database": "ok"
}
```
**Error (503):** Database connectivity failed.

### 2. `GET /api/v1/overview`
Provides high-level HeatPulse dashboard statistics.
**Response (200 OK):**
```json
{
  "initialization_time": "2025-12-26T23:00:00Z",
  "ward_count": 200,
  "active_alerts_count": 0,
  "available_horizons_hours": [24, 48, 72, 96, 120],
  "highest_risk_by_day": [
    {
      "valid_time": "2025-12-27T23:00:00Z",
      "max_risk": 0.42,
      "ward_id": 15,
      "max_htsi_level": 3
    }
  ]
}
```

### 3. `GET /api/v1/wards`
Returns all wards as a GeoJSON `FeatureCollection`, directly serialized via Supabase PostgREST's native geometry casting.
**Response (200 OK):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "ward_id": 1,
        "ward_name": "Ward 1",
        "zone_id": "1",
        "area_km2": 3.4
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

### 4. `GET /api/v1/wards/{ward_id}`
Returns combined static intelligence (exposure, vulnerability) for a specific ward.
**Response (200 OK):**
```json
{
  "ward_id": 1,
  "ward_name": "Ward 1",
  "zone_id": "1",
  "area_km2": 3.4,
  "population": 15400,
  "population_density": 4529.4,
  "population_source": "WorldPop 2020 Derived",
  "population_vintage": 2020,
  "healthcare_facility_count": 3,
  "healthcare_facilities_per_10000_derived_population": 1.9,
  "vulnerability": 0.35,
  "vulnerability_model": "Phase 3 Standard"
}
```
**Error (404):** Ward not found.

### 5. `GET /api/v1/wards/{ward_id}/forecast`
Returns the 5-horizon predictive arrays (weather parameters and operational risks) for the ward.
**Response (200 OK):**
```json
{
  "ward_id": 1,
  "forecast": [
    {
      "initialization_time": "2025-12-26T23:00:00Z",
      "valid_time": "2025-12-27T23:00:00Z",
      "lead_day": 1,
      "lead_hours": 24,
      "assigned_grid_id": "grid_13_0_80_2",
      "temperature_2m": 32.5,
      "utci": 34.2,
      "htsi": 2.1,
      "htsi_level": 3,
      "htsi_label": "High",
      "human_heat_risk": 0.25,
      "extreme_utci_flag": false
    }
  ]
}
```

### 6. `GET /api/v1/forecast`
Lists forecasts across all wards filtered by time or lead day.
**Parameters:**
- `lead_day` (int, 1-5)
- `valid_time` (ISO-8601 string)
*(At least one filter is required).*

### 7. `GET /api/v1/alerts`
Returns predicted operational alerts.
**Note on Empty State:** If there are no active alerts for the current operational window, it is valid and correct for this endpoint to return an empty list and count zero.
**Response (200 OK):**
```json
{
  "alerts": [],
  "count": 0
}
```

### 8. `GET /api/v1/forecast/horizon`
Returns timeline slider metadata for the frontend.
**Response (200 OK):**
```json
{
  "initialization_time": "2025-12-26T23:00:00Z",
  "valid_times": [
    "2025-12-27T23:00:00Z",
    "2025-12-28T23:00:00Z"
  ],
  "lead_hours": [24, 48, 72, 96, 120],
  "number_of_grids": 5,
  "number_of_wards": 200,
  "horizon_length_hours": 120
}
```
