export type SeverityLevel = 'Normal' | 'Moderate' | 'High' | 'Very High' | 'Extreme';

export interface WardRecord {
  ward_id: number;
  ward_name: string;
  zone_id: number;
  zone_name: string;
  region: 'North' | 'Central' | 'South';
  assigned_grid_id: string; // e.g. "grid_13.0_80.2"
  grid_lat: number;
  grid_lon: number;
  
  // Meteorological & Thermal Inputs
  temperature_2m: number; // °C
  relative_humidity: number; // %
  wind_speed_10m: number; // m/s
  solar_radiation: number; // W/m²
  tmrt: number; // Mean Radiant Temp °C
  utci: number; // Universal Thermal Climate Index °C
  wbgt_outdoor: number; // Liljegren Outdoor WBGT °C
  heat_index: number; // NOAA Heat Index °C
  
  // HTSI Components
  htsi: number; // Continuous score 0-100
  htsi_level: number; // 1-5
  htsi_label: SeverityLevel;
  burden_24h: number; // Trailing 24h burden
  burden_72h: number; // Trailing 72h burden
  nighttime_stress: number; // IST Nighttime stress N
  is_extreme_event: boolean; // UTCI >= 46°C
  
  // Exposure & Vulnerability
  population: number; // Derived WorldPop R2025A 2020 count
  area_km2: number;
  population_density: number; // people / km²
  exposure_density_norm: number; // Normalized E in [0, 1]
  
  // Healthcare Adaptive Capacity Proxy
  healthcare_facility_count: number; // Local GCC 140 HWC/UPHC PDF
  healthcare_facilities_per_10k: number;
  adaptive_capacity_norm: number; // Normalized A in [0, 1]
  
  // Reduced Vulnerability & Human Heat Risk
  vulnerability: number; // V = 0.5*S + 0.5*(1-A)
  heat_hazard: number; // H = HTSI / 100
  human_heat_risk_formula_a: number; // H * E * V
  human_heat_risk_formula_b: number; // Selected: H * E * (0.5 + 0.5V)
  human_heat_risk: number; // Equal to Formula B
  risk_level: SeverityLevel;
}

export interface ZoneSummary {
  zone_id: number;
  zone_name: string;
  region: 'North' | 'Central' | 'South';
  total_wards: number;
  total_derived_pop: number;
  max_risk_level: SeverityLevel;
  avg_htsi: number;
  hwc_count: number;
}

export interface ForecastDay {
  day_offset: number; // 1 to 5
  date: string;
  day_name: string;
  max_temperature: number; // °C (XGBoost Calibrated)
  min_temperature: number;
  avg_rh: number;
  max_wind_speed: number;
  max_utci: number; // °C (XGBoost Calibrated)
  max_wbgt: number; // °C (XGBoost Calibrated)
  max_htsi: number; // 0-100 (Mean Bias Calibrated)
  risk_level: SeverityLevel;
  nighttime_stress_flag: boolean;
  ml_lead_mae_temp: number; // e.g. 0.85 at D1, 0.95 at D5
  ml_lead_mae_htsi: number; // e.g. 3.02 at D1, 3.45 at D5
}

export interface AlertProtocol {
  level: SeverityLevel;
  color_hex: string;
  htsi_range: string;
  utci_range: string;
  status_summary: string;
  gcc_administration: string[];
  uphc_healthcare: string[];
  labor_contractors: string[];
  vulnerable_public: string[];
  tamil_summary: string;
}
