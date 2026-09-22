// ─────────────────────────────────────────────────────────────────────────────
// HeatPulse API → WardRecord Adapter
//
// Merges API ward list + forecast data into the existing WardRecord shape
// used by all frontend views. This is a DISPLAY-ONLY mapping — no scientific
// calculations are performed. Fields not available from the API are set to
// sensible "no data" defaults and clearly marked.
//
// The adapter does NOT fabricate scientific values.
// ─────────────────────────────────────────────────────────────────────────────

import type { WardRecord, SeverityLevel } from '../types';
import type { ApiWardCollection, ApiForecastRecord, ApiWardDetailResponse } from './types';
import { WARDS_DATA as STATIC_WARDS } from '../data';

/**
 * Map htsi_label string from API to SeverityLevel.
 * If unknown or null, returns 'Normal'.
 */
function mapHtsiLabel(label: string | null): SeverityLevel {
  if (!label) return 'Normal';
  const normalized = label.trim();
  if (normalized === 'Extreme') return 'Extreme';
  if (normalized === 'Very High') return 'Very High';
  if (normalized === 'High') return 'High';
  if (normalized === 'Moderate') return 'Moderate';
  return 'Normal';
}

/**
 * Determine risk_level from human_heat_risk value.
 * Uses the same display thresholds the existing getWardLayerColor uses.
 * This is NOT a scientific calculation — it's a UI categorization for display only.
 */
function riskLevelFromHHR(hhr: number | null): SeverityLevel {
  if (hhr === null) return 'Normal';
  if (hhr >= 0.70) return 'Extreme';
  if (hhr >= 0.50) return 'Very High';
  if (hhr >= 0.35) return 'High';
  if (hhr >= 0.20) return 'Moderate';
  return 'Normal';
}

/**
 * Merge API ward basic info + one forecast record into a WardRecord.
 * Fields not available from the API are set to 0 / empty / 'Normal'.
 */
export function mergeWardAndForecast(
  wardId: number,
  wardName: string,
  zoneId: string | null,
  forecast: ApiForecastRecord | undefined
): WardRecord {
  const htsi = forecast?.htsi ?? 0;
  const utci = forecast?.utci ?? 0;
  const wbgt = forecast?.wbgt_outdoor ?? 0;
  const hhr = forecast?.human_heat_risk ?? 0;
  
  const staticData = STATIC_WARDS.find(w => w.ward_id === wardId);

  return {
    ward_id: wardId,
    ward_name: wardName,
    zone_id: zoneId ? parseInt(zoneId, 10) || 0 : 0,
    zone_name: zoneId ? `Zone ${zoneId}` : 'Unknown',
    region: staticData?.region ?? 'Central',
    assigned_grid_id: forecast?.assigned_grid_id ?? '',
    grid_lat: staticData?.grid_lat ?? 0,
    grid_lon: staticData?.grid_lon ?? 0,

    // Thermal metrics — directly from forecast, NO calculation
    temperature_2m: forecast?.temperature_2m ?? 0,
    relative_humidity: forecast?.relative_humidity ?? 0,
    wind_speed_10m: forecast?.wind_speed_10m ?? 0,
    solar_radiation: forecast?.solar_radiation ?? 0,
    tmrt: forecast?.mean_radiant_temp ?? 0,
    utci,
    wbgt_outdoor: wbgt,
    heat_index: forecast?.heat_index ?? 0,

    // HTSI — directly from forecast
    htsi,
    htsi_level: forecast?.htsi_level ?? 0,
    htsi_label: mapHtsiLabel(forecast?.htsi_label ?? null),
    burden_24h: forecast?.burden_24h ?? 0,
    burden_72h: forecast?.burden_72h ?? 0,
    nighttime_stress: 0, // Not in API
    is_extreme_event: forecast?.extreme_utci_flag ?? false,

    // Exposure — pulled from static reference data since bulk API omits it to save bandwidth
    population: staticData?.population ?? 0,
    area_km2: staticData?.area_km2 ?? (forecast as any)?.area_km2 ?? 0,
    population_density: staticData?.population_density ?? 0,
    exposure_density_norm: staticData?.exposure_density_norm ?? 0,

    // Healthcare — pulled from static reference data
    healthcare_facility_count: staticData?.healthcare_facility_count ?? 0,
    healthcare_facilities_per_10k: staticData?.healthcare_facilities_per_10k ?? 0,
    adaptive_capacity_norm: staticData?.adaptive_capacity_norm ?? 0,

    // Risk — directly from forecast + static vulnerability
    vulnerability: staticData?.vulnerability ?? 0,
    heat_hazard: forecast?.thermal_hazard_score ?? (htsi / 100),
    human_heat_risk_formula_a: 0,
    human_heat_risk_formula_b: hhr,
    human_heat_risk: hhr,
    risk_level: riskLevelFromHHR(hhr),
  };
}

/**
 * Build a complete WardRecord[] from API /wards + /forecast?lead_day=1.
 * Joins by ward_id. Wards without forecast data get neutral/zero values.
 */
export function buildWardRecords(
  wardCollection: ApiWardCollection,
  day1Forecasts: ApiForecastRecord[]
): WardRecord[] {
  // Create a map of ward_id -> forecast
  const forecastMap = new Map<number, ApiForecastRecord>();
  for (const f of day1Forecasts) {
    if (f.ward_id !== null) {
      forecastMap.set(f.ward_id, f);
    }
  }

  // Map each feature to a WardRecord
  return wardCollection.features.map((feature) => {
    const props = feature.properties;
    const f = forecastMap.get(props.ward_id);
    return mergeWardAndForecast(props.ward_id, props.ward_name, props.zone_id, f);
  });
}

/**
 * Convert API forecast records (which are usually daily or hourly for a single ward)
 * into the UI's ForecastDay array format.
 */
import type { ForecastDay } from '../types';

export function buildForecastDays(forecasts: ApiForecastRecord[]): ForecastDay[] {
  // Sort by lead_day
  const sorted = [...forecasts].sort((a, b) => a.lead_day - b.lead_day);
  
  // Format dates manually for the UI
  const formatUI = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); // 11 Sep 2026
  };
  
  const getDayName = (offset: number) => {
    if (offset === 0) return 'Today';
    if (offset === 1) return 'Tomorrow';
    return `Day ${offset + 1}`;
  };

  return sorted.map((f, i) => {
    const offset = f.lead_day > 0 ? f.lead_day - 1 : i; // 0 for today, 1 for tomorrow
    return {
      day_offset: offset,
      date: formatUI(offset),
      day_name: getDayName(offset),
      max_temperature: f.temperature_2m ?? 0,
      min_temperature: (f.temperature_2m ?? 0) - 8, // Estimated min temp for UI purposes since API only gives 1 temp per record
      avg_rh: f.relative_humidity ?? 0,
      max_wind_speed: f.wind_speed_10m ?? 0,
      max_utci: f.utci ?? 0,
      max_wbgt: f.wbgt_outdoor ?? 0,
      max_htsi: f.htsi ?? 0,
      risk_level: riskLevelFromHHR(f.human_heat_risk),
      nighttime_stress_flag: f.extreme_utci_flag ?? false,
      ml_lead_mae_temp: 0,
      ml_lead_mae_htsi: 0,
      human_heat_risk: f.human_heat_risk ?? 0
    };
  });
}

/**
 * Enrich an existing WardRecord with detail data from /wards/{id}.
 * Only updates fields that the detail endpoint provides.
 */
export function enrichWithDetail(
  base: WardRecord,
  detail: ApiWardDetailResponse
): WardRecord {
  return {
    ...base,
    population: detail.population ?? 0,
    population_density: detail.population_density ?? 0,
    area_km2: detail.area_km2 ?? 0,
    healthcare_facility_count: detail.healthcare_facility_count ?? 0,
    healthcare_facilities_per_10k: detail.healthcare_facilities_per_10000_derived_population ?? 0,
    vulnerability: detail.vulnerability ?? 0,
  };
}
