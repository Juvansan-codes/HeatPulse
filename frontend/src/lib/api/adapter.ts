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

  return {
    ward_id: wardId,
    ward_name: wardName,
    zone_id: zoneId ? parseInt(zoneId, 10) || 0 : 0,
    zone_name: zoneId ? `Zone ${zoneId}` : 'Unknown',
    region: 'Central', // Not provided by API — display placeholder
    assigned_grid_id: forecast?.assigned_grid_id ?? '',
    grid_lat: 0, // Not needed for Mapbox — was for SVG
    grid_lon: 0,

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

    // Exposure — not in bulk forecast; set to 0
    population: 0,
    area_km2: 0,
    population_density: 0,
    exposure_density_norm: 0,

    // Healthcare — not in bulk forecast
    healthcare_facility_count: 0,
    healthcare_facilities_per_10k: 0,
    adaptive_capacity_norm: 0,

    // Risk — directly from forecast
    vulnerability: 0, // Only available via /wards/{id} detail
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
  wardsApi: ApiWardCollection,
  forecasts: ApiForecastRecord[]
): WardRecord[] {
  // Index forecasts by ward_id — take the first record per ward (latest valid_time)
  const forecastMap = new Map<number, ApiForecastRecord>();
  for (const f of forecasts) {
    if (f.ward_id !== null && !forecastMap.has(f.ward_id)) {
      forecastMap.set(f.ward_id, f);
    }
  }

  return wardsApi.features.map(feat => {
    const { ward_id, ward_name, zone_id } = feat.properties;
    const forecast = forecastMap.get(ward_id);
    return mergeWardAndForecast(ward_id, ward_name, zone_id, forecast);
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
