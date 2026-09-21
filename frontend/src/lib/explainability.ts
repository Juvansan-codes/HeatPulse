/**
 * HeatPulse Phase F7 — Explainability Engine
 *
 * Computes ward-level risk explanations using sensitivity analysis on
 * Formula B: Risk = H × E × (0.5 + 0.5V)
 *
 * All contribution percentages are dynamically computed from the actual
 * risk components — never hardcoded.
 */

import { WardRecord, SeverityLevel } from './types';
import {
  WardExplanation,
  RiskDriver,
  ForecastPoint,
  DataSourceInfo,
} from './explainabilityTypes';
import { FORECAST_DAYS, FORECAST_TODAY, ALERT_PROTOCOLS } from './data';

// ─── Sensitivity Analysis ────────────────────────────────────────────────────
// Formula B: Risk = H × E × (0.5 + 0.5V)
//
// Partial derivatives (marginal contribution):
//   ∂Risk/∂H = E × (0.5 + 0.5V)
//   ∂Risk/∂E = H × (0.5 + 0.5V)
//   ∂Risk/∂V = H × E × 0.5
//
// Contribution of each factor = partial × value / Σ(partial × value)
// ─────────────────────────────────────────────────────────────────────────────

interface SensitivityResult {
  hazardContribution: number;
  exposureContribution: number;
  vulnerabilityContribution: number;
}

function computeSensitivity(H: number, E: number, V: number): SensitivityResult {
  const vulnTerm = 0.5 + 0.5 * V;

  const partialH = E * vulnTerm;
  const partialE = H * vulnTerm;
  const partialV = H * E * 0.5;

  const weightedH = partialH * H;
  const weightedE = partialE * E;
  const weightedV = partialV * V;

  const total = weightedH + weightedE + weightedV;

  if (total === 0) {
    return { hazardContribution: 33.3, exposureContribution: 33.3, vulnerabilityContribution: 33.4 };
  }

  return {
    hazardContribution: (weightedH / total) * 100,
    exposureContribution: (weightedE / total) * 100,
    vulnerabilityContribution: (weightedV / total) * 100,
  };
}

// ─── Sub-driver decomposition ────────────────────────────────────────────────
// Break hazard into sub-components: UTCI stress, WBGT stress, nighttime persistence
// Break vulnerability into: population sensitivity, healthcare access

interface SubDriverWeights {
  utciStress: number;
  wbgtStress: number;
  heatIndexStress: number;
  nighttimeLoad: number;
  burden: number;
  popDensity: number;
  healthcareAccess: number;
}

function computeSubDriverWeights(ward: WardRecord): SubDriverWeights {
  // Normalize each thermal sub-indicator to 0-1 range using realistic bounds
  const utciNorm = Math.min(1, Math.max(0, (ward.utci - 26) / (46 - 26)));
  const wbgtNorm = Math.min(1, Math.max(0, (ward.wbgt_outdoor - 25) / (35 - 25)));
  const hiNorm = Math.min(1, Math.max(0, (ward.heat_index - 27) / (54 - 27)));
  const nightNorm = ward.nighttime_stress / 100;
  const burdenNorm = Math.max(ward.burden_24h, ward.burden_72h) / 100;

  return {
    utciStress: utciNorm,
    wbgtStress: wbgtNorm,
    heatIndexStress: hiNorm,
    nighttimeLoad: nightNorm,
    burden: burdenNorm,
    popDensity: ward.exposure_density_norm,
    healthcareAccess: 1 - ward.adaptive_capacity_norm, // Inverted: low access = high risk
  };
}

// ─── Risk Driver Generation ──────────────────────────────────────────────────

function generateRiskDrivers(ward: WardRecord, sensitivity: SensitivityResult): RiskDriver[] {
  const sub = computeSubDriverWeights(ward);

  // Distribute hazard contribution among thermal sub-components
  const thermalTotal = sub.utciStress + sub.wbgtStress + sub.heatIndexStress + sub.nighttimeLoad + sub.burden;
  const hazardPct = sensitivity.hazardContribution;

  const utciPct = thermalTotal > 0 ? (sub.utciStress / thermalTotal) * hazardPct : hazardPct / 5;
  const wbgtPct = thermalTotal > 0 ? (sub.wbgtStress / thermalTotal) * hazardPct : hazardPct / 5;
  const hiPct = thermalTotal > 0 ? (sub.heatIndexStress / thermalTotal) * hazardPct : hazardPct / 5;
  const nightPct = thermalTotal > 0 ? (sub.nighttimeLoad / thermalTotal) * hazardPct : hazardPct / 5;
  const burdenPct = thermalTotal > 0 ? (sub.burden / thermalTotal) * hazardPct : hazardPct / 5;

  const drivers: RiskDriver[] = [
    {
      feature: 'HTSI',
      label: 'Thermal Stress Index (HTSI)',
      value: ward.htsi,
      unit: '/100',
      contribution: utciPct + wbgtPct * 0.3, // HTSI absorbs most thermal
      direction: ward.htsi >= 65 ? 'increasing' : ward.htsi >= 50 ? 'neutral' : 'decreasing',
      explanation: ward.htsi >= 72
        ? `Very high thermal stress (HTSI ${ward.htsi.toFixed(1)}) is the primary driver of current risk. Outdoor activities pose serious health danger.`
        : ward.htsi >= 65
        ? `Elevated thermal stress (HTSI ${ward.htsi.toFixed(1)}) is significantly contributing to risk conditions in this ward.`
        : ward.htsi >= 50
        ? `Moderate thermal stress (HTSI ${ward.htsi.toFixed(1)}) is present but within manageable levels.`
        : `Thermal stress is relatively low (HTSI ${ward.htsi.toFixed(1)}).`,
      color: '#ef4444',
      icon: 'thermometer',
      impactPoints: Math.round(ward.htsi * 0.8),
    },
    {
      feature: 'WBGT',
      label: 'Wet Bulb Globe Temperature',
      value: ward.wbgt_outdoor,
      unit: '°C',
      contribution: wbgtPct * 0.7,
      direction: ward.wbgt_outdoor >= 31 ? 'increasing' : 'neutral',
      explanation: ward.wbgt_outdoor >= 33
        ? `Dangerous WBGT of ${ward.wbgt_outdoor}°C — outdoor labor must be suspended. Risk of heat stroke is imminent.`
        : ward.wbgt_outdoor >= 31
        ? `High WBGT of ${ward.wbgt_outdoor}°C indicates significant occupational heat stress for outdoor workers.`
        : `WBGT of ${ward.wbgt_outdoor}°C indicates moderate thermal conditions.`,
      color: '#f97316',
      icon: 'sun',
      impactPoints: Math.round((ward.wbgt_outdoor - 25) * 5),
    },
    {
      feature: 'UTCI',
      label: 'Universal Thermal Climate Index',
      value: ward.utci,
      unit: '°C',
      contribution: utciPct * 0.4,
      direction: ward.utci >= 38 ? 'increasing' : 'neutral',
      explanation: ward.utci >= 42
        ? `UTCI of ${ward.utci}°C (Very Strong stress) — prolonged exposure causes significant physiological strain.`
        : ward.utci >= 38
        ? `UTCI of ${ward.utci}°C (Strong stress) — sustained outdoor exposure causes measurable thermal strain.`
        : `UTCI of ${ward.utci}°C indicates moderate thermal comfort conditions.`,
      color: '#dc2626',
      icon: 'activity',
      impactPoints: Math.round((ward.utci - 26) * 3),
    },
    {
      feature: 'population_density',
      label: 'Population Exposure',
      value: ward.population_density,
      unit: '/km²',
      contribution: sensitivity.exposureContribution,
      direction: ward.exposure_density_norm >= 0.6 ? 'increasing' : 'neutral',
      explanation: ward.exposure_density_norm >= 0.8
        ? `Extremely high population density (${ward.population_density.toLocaleString()}/km²) means ${ward.population.toLocaleString()} residents are exposed. Urban crowding amplifies heat impact.`
        : ward.exposure_density_norm >= 0.5
        ? `Moderate-high population density (${ward.population_density.toLocaleString()}/km²) exposes ${ward.population.toLocaleString()} residents to thermal stress.`
        : `Relatively lower population density (${ward.population_density.toLocaleString()}/km²) limits the total exposed population.`,
      color: '#f59e0b',
      icon: 'users',
      impactPoints: Math.round(ward.exposure_density_norm * 50),
    },
    {
      feature: 'vulnerability',
      label: 'Vulnerability Score',
      value: ward.vulnerability,
      unit: '/ 1.00',
      contribution: sensitivity.vulnerabilityContribution,
      direction: ward.vulnerability >= 0.6 ? 'increasing' : ward.vulnerability >= 0.4 ? 'neutral' : 'decreasing',
      explanation: ward.vulnerability >= 0.7
        ? `High vulnerability (${ward.vulnerability.toFixed(2)}) due to limited healthcare access (${ward.healthcare_facilities_per_10k.toFixed(2)} HWC per 10,000). Residents are less able to cope with heat stress.`
        : ward.vulnerability >= 0.5
        ? `Moderate vulnerability (${ward.vulnerability.toFixed(2)}). Healthcare access is limited but not critically so.`
        : `Lower vulnerability (${ward.vulnerability.toFixed(2)}) — better healthcare access and adaptive capacity reduce risk.`,
      color: '#8b5cf6',
      icon: 'shield',
      impactPoints: Math.round(ward.vulnerability * 40),
    },
    {
      feature: 'nighttime_stress',
      label: 'Nighttime Heat Persistence',
      value: ward.nighttime_stress,
      unit: 'percentile',
      contribution: nightPct,
      direction: ward.nighttime_stress >= 75 ? 'increasing' : 'neutral',
      explanation: ward.nighttime_stress >= 80
        ? `Severe nocturnal heat persistence (P${ward.nighttime_stress.toFixed(0)}) prevents physiological recovery during sleep hours (22:00–06:00 IST).`
        : ward.nighttime_stress >= 60
        ? `Elevated nighttime temperatures (P${ward.nighttime_stress.toFixed(0)}) reduce the body's ability to recover from daytime heat stress.`
        : `Nighttime conditions (P${ward.nighttime_stress.toFixed(0)}) allow adequate physiological recovery.`,
      color: '#6366f1',
      icon: 'moon',
      impactPoints: Math.round(ward.nighttime_stress * 0.35),
    },
    {
      feature: 'burden_72h',
      label: 'Multi-Day Heat Accumulation',
      value: ward.burden_72h,
      unit: '/ 100',
      contribution: burdenPct,
      direction: ward.burden_72h >= 35 ? 'increasing' : 'neutral',
      explanation: ward.burden_72h >= 40
        ? `Sustained 72-hour heat burden (${ward.burden_72h.toFixed(1)}/100) indicates multi-day thermal accumulation that compounds health risks.`
        : ward.burden_72h >= 25
        ? `Moderate trailing heat burden (${ward.burden_72h.toFixed(1)}/100) suggests ongoing heat exposure over recent days.`
        : `Low trailing heat burden (${ward.burden_72h.toFixed(1)}/100) — no significant multi-day heat accumulation.`,
      color: '#a855f7',
      icon: 'trending-up',
      impactPoints: Math.round(ward.burden_72h * 0.4),
    },
  ];

  // Sort by contribution descending
  drivers.sort((a, b) => b.contribution - a.contribution);

  // Normalize contributions to sum to 100%
  const totalContrib = drivers.reduce((sum, d) => sum + d.contribution, 0);
  if (totalContrib > 0) {
    drivers.forEach((d) => {
      d.contribution = (d.contribution / totalContrib) * 100;
    });
  }

  return drivers;
}

// ─── Summary Generator ───────────────────────────────────────────────────────

function generateSummary(ward: WardRecord, drivers: RiskDriver[]): string {
  const top3 = drivers.slice(0, 3);
  const riskAdj = getRiskAdjective(ward.risk_level);

  const driverDescriptions = top3.map((d, i) => {
    if (d.feature === 'HTSI') return `elevated thermal stress (HTSI ${ward.htsi.toFixed(1)}/100)`;
    if (d.feature === 'population_density') return `high population density (${ward.population_density.toLocaleString()}/km² exposing ${ward.population.toLocaleString()} residents)`;
    if (d.feature === 'vulnerability') return `vulnerability from limited healthcare access (${ward.healthcare_facilities_per_10k.toFixed(2)} HWC per 10,000)`;
    if (d.feature === 'WBGT') return `dangerous wet-bulb globe temperature (${ward.wbgt_outdoor}°C)`;
    if (d.feature === 'nighttime_stress') return `persistent nighttime heat (P${ward.nighttime_stress.toFixed(0)})`;
    if (d.feature === 'burden_72h') return `sustained multi-day heat accumulation`;
    if (d.feature === 'UTCI') return `strong thermal stress (UTCI ${ward.utci}°C)`;
    return d.label.toLowerCase();
  });

  const joinedDrivers = driverDescriptions.length === 1
    ? driverDescriptions[0]
    : driverDescriptions.length === 2
    ? `${driverDescriptions[0]} and ${driverDescriptions[1]}`
    : `${driverDescriptions.slice(0, -1).join(', ')}, and ${driverDescriptions[driverDescriptions.length - 1]}`;

  return `Ward ${ward.ward_id} (${ward.ward_name}) is at ${ward.risk_level.toUpperCase()} risk ${riskAdj}. The primary factors are ${joinedDrivers}. The combined Human Heat Impact Risk score is ${ward.human_heat_risk.toFixed(3)} using Formula B (H × E × (0.5 + 0.5V)).`;
}

function getRiskAdjective(level: SeverityLevel): string {
  switch (level) {
    case 'Extreme': return 'requiring immediate emergency action';
    case 'Very High': return 'requiring urgent municipal intervention';
    case 'High': return 'requiring active monitoring and precautionary measures';
    case 'Moderate': return 'with standard precautionary measures advised';
    case 'Normal': return 'with standard conditions prevailing';
    default: return '';
  }
}

// ─── Forecast Trend ──────────────────────────────────────────────────────────

function generateForecast(ward: WardRecord): {
  currentHtsi: number;
  nextDayHtsi: number;
  changePercent: number;
  trend: 'rising' | 'falling' | 'stable';
  points: ForecastPoint[];
} {
  // Scale city-level forecast to ward-level using ward's relative HTSI position
  const cityMaxHtsi = FORECAST_TODAY.max_htsi;
  const wardScale = cityMaxHtsi > 0 ? ward.htsi / cityMaxHtsi : 1;

  const points: ForecastPoint[] = [
    {
      day: 'Today',
      date: FORECAST_TODAY.date,
      htsi: ward.htsi,
      riskLevel: ward.htsi_label,
      dayOffset: 0,
    },
    ...FORECAST_DAYS.map((f) => ({
      day: f.day_name,
      date: f.date,
      htsi: Math.round(f.max_htsi * wardScale * 10) / 10,
      riskLevel: f.risk_level,
      dayOffset: f.day_offset,
    })),
  ];

  const nextDayHtsi = points[1]?.htsi ?? ward.htsi;
  const changePercent = ward.htsi > 0 ? ((nextDayHtsi - ward.htsi) / ward.htsi) * 100 : 0;

  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  if (changePercent > 2) trend = 'rising';
  else if (changePercent < -2) trend = 'falling';

  return {
    currentHtsi: ward.htsi,
    nextDayHtsi,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
    points,
  };
}

// ─── Recommendations ─────────────────────────────────────────────────────────

function generateRecommendations(ward: WardRecord): { citizens: string[]; authorities: string[] } {
  const protocol = ALERT_PROTOCOLS.find((p) => p.level === ward.risk_level);
  if (!protocol) {
    return {
      citizens: ['Follow standard heat safety precautions.'],
      authorities: ['Continue routine monitoring.'],
    };
  }

  return {
    citizens: protocol.vulnerable_public,
    authorities: [...protocol.gcc_administration, ...protocol.uphc_healthcare.slice(0, 1)],
  };
}

// ─── Data Sources ────────────────────────────────────────────────────────────

const DATA_SOURCES: DataSourceInfo[] = [
  { name: 'ERA5-Land', description: 'ECMWF Climate Reanalysis (0.1° grid, hourly)', badge: 'METEOROLOGICAL', color: '#3b82f6' },
  { name: 'WorldPop R2025A', description: '100m population grid, 2020 estimates', badge: 'POPULATION', color: '#f59e0b' },
  { name: 'GCC 140 HWC/UPHC', description: 'Chennai municipal healthcare facility registry', badge: 'HEALTHCARE', color: '#10b981' },
  { name: 'XGBoost Calibration', description: 'ML-calibrated temperature, RH, wind, radiation', badge: 'ML MODEL', color: '#8b5cf6' },
  { name: 'HTSI Formulation', description: 'Human Thermal Stress Index (UTCI + WBGT + Burden + Night)', badge: 'INDEX', color: '#ef4444' },
  { name: 'GCC Ward Boundaries', description: '200 official ward polygons (2025 delimitation)', badge: 'GIS', color: '#06b6d4' },
];

// ─── Main Computation ────────────────────────────────────────────────────────

/**
 * Compute the full explainability payload for a ward.
 *
 * This function derives all explanations from the SAME data and formula
 * that produced the ward's risk score. No separate explanation layer.
 */
export function computeWardExplanation(ward: WardRecord): WardExplanation {
  const H = ward.heat_hazard;
  const E = ward.exposure_density_norm;
  const V = ward.vulnerability;

  // Step 1: Sensitivity analysis
  const sensitivity = computeSensitivity(H, E, V);

  // Step 2: Generate detailed risk drivers
  const drivers = generateRiskDrivers(ward, sensitivity);

  // Step 3: Generate natural-language summary
  const summary = generateSummary(ward, drivers);

  // Step 4: Forecast trend
  const forecast = generateForecast(ward);

  // Step 5: Context-aware recommendations
  const recommendations = generateRecommendations(ward);

  return {
    wardId: ward.ward_id,
    wardName: ward.ward_name,
    zoneName: ward.zone_name,
    zoneId: ward.zone_id,
    region: ward.region,
    riskLevel: ward.risk_level,
    riskScore: Math.round(ward.htsi),
    humanHeatRisk: ward.human_heat_risk,
    timestamp: new Date().toISOString(),

    summary,
    drivers,

    thermal: {
      htsi: ward.htsi,
      htsiLevel: ward.htsi_level,
      htsiLabel: ward.htsi_label,
      heatIndex: ward.heat_index,
      wbgt: ward.wbgt_outdoor,
      utci: ward.utci,
      tmrt: ward.tmrt,
      temperature: ward.temperature_2m,
      humidity: ward.relative_humidity,
      windSpeed: ward.wind_speed_10m,
      solarRadiation: ward.solar_radiation,
      burden24h: ward.burden_24h,
      burden72h: ward.burden_72h,
      nighttimeStress: ward.nighttime_stress,
      isExtremeEvent: ward.is_extreme_event,
    },

    exposure: {
      population: ward.population,
      density: ward.population_density,
      densityNorm: ward.exposure_density_norm,
      areaKm2: ward.area_km2,
    },

    vulnerability: {
      score: ward.vulnerability,
      adaptiveCapacity: ward.adaptive_capacity_norm,
      healthcareFacilities: ward.healthcare_facility_count,
      healthcarePer10k: ward.healthcare_facilities_per_10k,
    },

    forecast,
    recommendations,
    dataSources: DATA_SOURCES,
  };
}
