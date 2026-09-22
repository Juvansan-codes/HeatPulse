// ─────────────────────────────────────────────────────────────────────────────
// HeatPulse API Types — Strict TypeScript contracts matching FastAPI Pydantic schemas
// Source of truth: backend/app/models/schemas.py
// DO NOT invent fields. DO NOT calculate scientific values.
// ─────────────────────────────────────────────────────────────────────────────

// ── Health ──
export interface ApiHealthResponse {
  status: string;
  database: string;
}

// ── Overview ──
export interface ApiHighestRiskByDay {
  valid_time: string;
  max_risk: number;
  ward_id: number | null;
  max_htsi_level: number | null;
}

export interface ApiOverviewResponse {
  initialization_time: string | null;
  ward_count: number;
  active_alerts_count: number;
  available_horizons_hours: number[];
  highest_risk_by_day: ApiHighestRiskByDay[];
}

// ── Ward (GeoJSON FeatureCollection) ──
export interface ApiWardFeatureProperties {
  ward_id: number;
  ward_name: string;
  zone_id: string | null;
  area_km2: number | null;
}

export interface ApiWardFeature {
  type: 'Feature';
  properties: ApiWardFeatureProperties;
  geometry: GeoJSON.Geometry;
}

export interface ApiWardCollection {
  type: 'FeatureCollection';
  features: ApiWardFeature[];
}

// ── Ward Detail ──
export interface ApiWardDetailResponse {
  ward_id: number;
  ward_name: string;
  zone_id: string | null;
  area_km2: number | null;
  population: number | null;
  population_density: number | null;
  population_source: string | null;
  population_vintage: number | null;
  healthcare_facility_count: number | null;
  healthcare_facilities_per_10000_derived_population: number | null;
  vulnerability: number | null;
  vulnerability_model: string | null;
}

// ── Forecast ──
export interface ApiForecastRecord {
  initialization_time: string;
  valid_time: string;
  lead_day: number;
  lead_hours: number;
  assigned_grid_id: string;
  temperature_2m: number | null;
  relative_humidity: number | null;
  wind_speed_10m: number | null;
  solar_radiation: number | null;
  mean_radiant_temp: number | null;
  wbgt_outdoor: number | null;
  utci: number | null;
  heat_index: number | null;
  thermal_hazard_score: number | null;
  burden_24h: number | null;
  burden_72h: number | null;
  htsi: number | null;
  htsi_level: number | null;
  htsi_label: string | null;
  human_heat_risk: number | null;
  extreme_utci_flag: boolean | null;
  ward_id: number | null;
}

export interface ApiWardForecastResponse {
  ward_id: number;
  forecast: ApiForecastRecord[];
}

export interface ApiForecastListResponse {
  forecasts: ApiForecastRecord[];
  count: number;
}

// ── Alerts ──
export interface ApiAlertRecord {
  ward_id: number;
  start_time: string;
  end_time: string;
  peak_time: string | null;
  maximum_alert_level: number | null;
  peak_htsi: number | null;
  peak_utci: number | null;
  peak_risk: number | null;
  extreme_utci_flag: boolean | null;
}

export interface ApiAlertsResponse {
  alerts: ApiAlertRecord[];
  count: number;
}

// ── Horizon ──
export interface ApiHorizonResponse {
  initialization_time: string | null;
  valid_times: string[];
  lead_hours: number[];
  number_of_grids: number;
  number_of_wards: number;
  horizon_length_hours: number;
}

// ── Explainability ──
export interface ApiExplanationRisk {
  human_heat_risk: number | null;
  heat_hazard: number | null;
}

export interface ApiExplanationHeatHazard {
  htsi: number | null;
  htsi_level: number | null;
  htsi_label: string | null;
  utci: number | null;
  wbgt: number | null;
  heat_index: number | null;
  tmrt: number | null;
  burden_24h: number | null;
  burden_72h: number | null;
  extreme_utci_flag: boolean | null;
}

export interface ApiExplanationExposure {
  population: number | null;
  population_density: number | null;
  population_density_city_percentile: number | null;
}

export interface ApiExplanationVulnerability {
  vulnerability: number | null;
  vulnerability_city_percentile: number | null;
  healthcare_facility_count: number | null;
  healthcare_facilities_per_10000: number | null;
  healthcare_availability_city_percentile: number | null;
}

export interface ApiExplanationDriver {
  category: string;
  label: string;
  value: number | null;
  unit: string | null;
  description: string;
}

export interface ApiExplanationResponse {
  ward_id: number;
  ward_name: string | null;
  initialization_time: string | null;
  valid_time: string | null;
  lead_hours: number | null;
  risk: ApiExplanationRisk;
  heat_hazard: ApiExplanationHeatHazard;
  exposure: ApiExplanationExposure;
  vulnerability: ApiExplanationVulnerability;
  drivers: ApiExplanationDriver[];
  summary: string;
}
