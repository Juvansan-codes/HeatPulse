import { SeverityLevel, WardRecord, ForecastDay } from '../types';
import { BackendWardSchema, BackendForecastSchema, BackendAlertLevel } from './schema';

/** Map backend alert_level enum ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH', 'EXTREME') to frontend SeverityLevel */
export function mapBackendAlertLevelToSeverity(level: BackendAlertLevel): SeverityLevel {
  switch (level) {
    case 'LOW':
      return 'Normal';
    case 'MODERATE':
      return 'Moderate';
    case 'HIGH':
      return 'High';
    case 'VERY_HIGH':
      return 'Very High';
    case 'EXTREME':
      return 'Extreme';
    default:
      return 'Normal';
  }
}

/** Map frontend SeverityLevel to backend alert_level enum */
export function mapSeverityToBackendAlertLevel(severity: SeverityLevel): BackendAlertLevel {
  switch (severity) {
    case 'Normal':
      return 'LOW';
    case 'Moderate':
      return 'MODERATE';
    case 'High':
      return 'HIGH';
    case 'Very High':
      return 'VERY_HIGH';
    case 'Extreme':
      return 'EXTREME';
    default:
      return 'LOW';
  }
}

/** Transform raw backend JSON schema object to frontend UI WardRecord */
export function transformBackendWardToWardRecord(b: BackendWardSchema): WardRecord {
  return {
    ward_id: b.ward_id,
    ward_name: b.ward_name,
    zone_id: b.zone_id,
    zone_name: b.zone,
    region: b.region,
    assigned_grid_id: b.assigned_grid_id,
    grid_lat: b.grid_lat,
    grid_lon: b.grid_lon,
    
    temperature_2m: b.temperature,
    relative_humidity: b.relative_humidity,
    wind_speed_10m: b.wind_speed,
    solar_radiation: b.solar_radiation,
    tmrt: b.tmrt,
    utci: b.utci,
    wbgt_outdoor: b.wbgt,
    heat_index: b.heat_index,
    
    htsi: b.htsi,
    htsi_level: b.htsi_level,
    htsi_label: mapBackendAlertLevelToSeverity(b.alert_level),
    burden_24h: b.burden_24h,
    burden_72h: b.burden_72h,
    nighttime_stress: b.nighttime_stress,
    is_extreme_event: b.is_extreme_event,
    
    population: b.population,
    area_km2: Number((b.population / (b.population_density || 1)).toFixed(2)),
    population_density: b.population_density,
    exposure_density_norm: b.exposure_density_norm,
    
    healthcare_facility_count: b.healthcare_facility_count,
    healthcare_facilities_per_10k: b.healthcare_facilities_per_10k,
    adaptive_capacity_norm: b.adaptive_capacity_norm,
    
    vulnerability: b.vulnerability,
    heat_hazard: b.heat_hazard,
    human_heat_risk_formula_a: b.human_heat_risk_formula_a,
    human_heat_risk_formula_b: b.human_heat_risk_formula_b,
    human_heat_risk: b.human_heat_risk,
    risk_level: mapBackendAlertLevelToSeverity(b.alert_level)
  };
}

/** Transform frontend WardRecord to raw backend JSON schema object */
export function transformWardRecordToBackendWard(w: WardRecord): BackendWardSchema {
  return {
    ward_id: w.ward_id,
    ward_name: w.ward_name,
    zone: w.zone_name,
    zone_id: w.zone_id,
    region: w.region,
    assigned_grid_id: w.assigned_grid_id,
    grid_lat: w.grid_lat,
    grid_lon: w.grid_lon,
    
    population: w.population,
    population_density: w.population_density,
    vulnerability: w.vulnerability,
    healthcare_facility_count: w.healthcare_facility_count,
    healthcare_facilities_per_10k: w.healthcare_facilities_per_10k,
    
    timestamp: new Date().toISOString(),
    temperature: w.temperature_2m,
    relative_humidity: w.relative_humidity,
    wind_speed: w.wind_speed_10m,
    solar_radiation: w.solar_radiation,
    tmrt: w.tmrt,
    
    utci: w.utci,
    wbgt: w.wbgt_outdoor,
    heat_index: w.heat_index,
    htsi: w.htsi,
    htsi_level: w.htsi_level,
    
    heat_hazard: w.heat_hazard,
    exposure_density_norm: w.exposure_density_norm,
    adaptive_capacity_norm: w.adaptive_capacity_norm,
    human_heat_risk_formula_a: w.human_heat_risk_formula_a,
    human_heat_risk_formula_b: w.human_heat_risk_formula_b,
    human_heat_risk: w.human_heat_risk,
    
    burden_24h: w.burden_24h,
    burden_72h: w.burden_72h,
    nighttime_stress: w.nighttime_stress,
    is_extreme_event: w.is_extreme_event,
    
    alert_level: mapSeverityToBackendAlertLevel(w.risk_level)
  };
}

/** Transform raw backend forecast JSON object to frontend ForecastDay */
export function transformBackendForecastToForecastDay(f: BackendForecastSchema): ForecastDay {
  return {
    day_offset: f.day_offset,
    date: f.date,
    day_name: f.day_name,
    max_temperature: f.max_temperature,
    min_temperature: f.min_temperature,
    avg_rh: f.avg_rh,
    max_wind_speed: f.max_wind_speed,
    max_utci: f.max_utci,
    max_wbgt: f.max_wbgt,
    max_htsi: f.max_htsi,
    human_heat_risk: Number((f.max_htsi / 100 * 0.55).toFixed(3)),
    risk_level: mapBackendAlertLevelToSeverity(f.alert_level),
    nighttime_stress_flag: f.nighttime_stress_flag,
    ml_lead_mae_temp: f.ml_lead_mae_temp,
    ml_lead_mae_htsi: f.ml_lead_mae_htsi
  };
}
