import { SeverityLevel } from './types';

/** Standardized HeatPulse Severity Risk Tokens */
export interface RiskToken {
  level: SeverityLevel;
  code: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EXTREME';
  label: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  glowColor: string;
}

export const RISK_TOKENS: Record<SeverityLevel, RiskToken> = {
  Normal: {
    level: 'Normal',
    code: 'LOW',
    label: 'LOW RISK',
    hex: '#10b981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    badgeBg: '#ecfdf5',
    badgeText: '#047857',
    badgeBorder: '#a7f3d0',
    dotColor: '#10b981',
    glowColor: 'rgba(16,185,129,0.15)'
  },
  Moderate: {
    level: 'Moderate',
    code: 'MODERATE',
    label: 'MODERATE RISK',
    hex: '#f59e0b',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    badgeBg: '#fffbeb',
    badgeText: '#b45309',
    badgeBorder: '#fde68a',
    dotColor: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.15)'
  },
  High: {
    level: 'High',
    code: 'HIGH',
    label: 'HIGH RISK',
    hex: '#f97316',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200',
    badgeBg: '#fff7ed',
    badgeText: '#c2410c',
    badgeBorder: '#ffedd5',
    dotColor: '#f97316',
    glowColor: 'rgba(249,115,22,0.15)'
  },
  'Very High': {
    level: 'Very High',
    code: 'VERY_HIGH',
    label: 'VERY HIGH RISK',
    hex: '#ef4444',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    badgeBg: '#fef2f2',
    badgeText: '#b91c1c',
    badgeBorder: '#fecaca',
    dotColor: '#ef4444',
    glowColor: 'rgba(239,68,68,0.15)'
  },
  Extreme: {
    level: 'Extreme',
    code: 'EXTREME',
    label: 'EXTREME RISK',
    hex: '#7c3aed',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-200',
    badgeBg: '#faf5ff',
    badgeText: '#6b21a8',
    badgeBorder: '#e9d5ff',
    dotColor: '#7c3aed',
    glowColor: 'rgba(124,58,237,0.15)'
  }
};

/** Thermal Metric Definitions */
export interface ThermalMetricDef {
  key: string;
  name: string;
  shortName: string;
  unit: string;
  description: string;
  accentColor: string;
}

export const THERMAL_METRICS: Record<string, ThermalMetricDef> = {
  htsi: {
    key: 'htsi',
    name: 'Human Thermal Stress Index',
    shortName: 'HTSI',
    unit: 'pts',
    description: 'Project-specific continuous operational thermal hazard score (0–100).',
    accentColor: '#F47C20'
  },
  utci: {
    key: 'utci',
    name: 'Universal Thermal Climate Index',
    shortName: 'UTCI',
    unit: '°C',
    description: 'Biophysical equivalent temperature accounting for radiation balance & wind.',
    accentColor: '#dc2626'
  },
  wbgt: {
    key: 'wbgt',
    name: 'Liljegren Outdoor WBGT',
    shortName: 'WBGT',
    unit: '°C',
    description: 'Outdoor wet bulb globe temperature modeling non-linear mass transfer.',
    accentColor: '#ea580c'
  },
  heatIndex: {
    key: 'heatIndex',
    name: 'NOAA Heat Index',
    shortName: 'Heat Index',
    unit: '°C',
    description: 'Rothfusz apparent shade temperature.',
    accentColor: '#d97706'
  },
  temperature: {
    key: 'temperature',
    name: '2m Air Temperature',
    shortName: 'T2m',
    unit: '°C',
    description: 'Ambient 2m dry-bulb air temperature.',
    accentColor: '#2563eb'
  },
  humidity: {
    key: 'humidity',
    name: 'Relative Humidity',
    shortName: 'RH',
    unit: '%',
    description: 'Surface atmospheric moisture percentage.',
    accentColor: '#0891b2'
  }
};

/** UI State Styling Presets */
export const UI_STATE_TOKENS = {
  loading: {
    skeletonBg: 'bg-slate-200 animate-pulse',
    skeletonBorder: 'border-slate-200'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800'
  },
  empty: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-500'
  },
  stale: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800'
  }
};
