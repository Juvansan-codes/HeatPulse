/**
 * HeatPulse Phase F11 — Backend API Data Contract Schemas
 *
 * Matches the FastAPI / Pydantic models served by the backend REST endpoints.
 * All frontend code interacts through these contracts via `adapter.ts`.
 */

export type BackendAlertLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';

export interface BackendWardSchema {
  ward_id: number;
  ward_name: string;
  zone: string;
  zone_id: number;
  region: 'North' | 'Central' | 'South';
  assigned_grid_id: string;
  grid_lat: number;
  grid_lon: number;
  
  population: number;
  population_density: number;
  vulnerability: number;
  healthcare_facility_count: number;
  healthcare_facilities_per_10k: number;
  
  timestamp: string;
  temperature: number;
  relative_humidity: number;
  wind_speed: number;
  solar_radiation: number;
  tmrt: number;
  
  utci: number;
  wbgt: number;
  heat_index: number;
  htsi: number;
  htsi_level: number;
  
  heat_hazard: number;
  exposure_density_norm: number;
  adaptive_capacity_norm: number;
  human_heat_risk_formula_a: number;
  human_heat_risk_formula_b: number;
  human_heat_risk: number;
  
  burden_24h: number;
  burden_72h: number;
  nighttime_stress: number;
  is_extreme_event: boolean;
  
  alert_level: BackendAlertLevel;
}

export interface BackendForecastSchema {
  day_offset: number;
  date: string;
  day_name: string;
  max_temperature: number;
  min_temperature: number;
  avg_rh: number;
  max_wind_speed: number;
  max_utci: number;
  max_wbgt: number;
  max_htsi: number;
  alert_level: BackendAlertLevel;
  nighttime_stress_flag: boolean;
  ml_lead_mae_temp: number;
  ml_lead_mae_htsi: number;
}

export interface BackendAlertSchema {
  alert_id: string;
  ward_id: number;
  ward_name: string;
  zone: string;
  alert_level: BackendAlertLevel;
  htsi_score: number;
  utci_temp: number;
  population_exposed: number;
  issued_at: string;
  summary: string;
  action_items: string[];
}

export interface BackendDriverSchema {
  feature: string;
  label: string;
  value: number;
  unit: string;
  contribution_pct: number;
  direction: 'increasing' | 'decreasing' | 'neutral';
  explanation: string;
}

export interface BackendExplanationSchema {
  ward_id: number;
  ward_name: string;
  zone_name: string;
  zone_id: number;
  region: string;
  alert_level: BackendAlertLevel;
  risk_score: number;
  human_heat_risk: number;
  timestamp: string;
  summary: string;
  top_drivers: BackendDriverSchema[];
  thermal: {
    htsi: number;
    utci: number;
    wbgt: number;
    heat_index: number;
  };
  exposure: {
    population: number;
    density: number;
  };
  vulnerability: {
    score: number;
    healthcare_count: number;
  };
  recommendations: {
    citizens: string[];
    authorities: string[];
  };
}
