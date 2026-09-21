import { SeverityLevel } from './types';

/** Individual risk driver / feature contribution */
export interface RiskDriver {
  /** Feature identifier key */
  feature: string;
  /** Human-readable feature label */
  label: string;
  /** Current feature value */
  value: number;
  /** Unit string (e.g., "°C", "/100", "%") */
  unit: string;
  /** Contribution percentage to overall risk (0-100, dynamically computed) */
  contribution: number;
  /** Direction of impact on risk */
  direction: 'increasing' | 'decreasing' | 'neutral';
  /** Human-readable explanation for citizens */
  explanation: string;
  /** CSS color for the contribution bar */
  color: string;
  /** Icon identifier */
  icon: 'thermometer' | 'users' | 'shield' | 'sun' | 'trending-up' | 'moon' | 'wind' | 'activity' | 'heart';
  /** Risk impact points (scaled 0-100) */
  impactPoints: number;
}

/** Exposure data */
export interface ExposureData {
  population: number;
  density: number;
  densityNorm: number;
  areaKm2: number;
}

/** Vulnerability data */
export interface VulnerabilityData {
  score: number;
  adaptiveCapacity: number;
  healthcareFacilities: number;
  healthcarePer10k: number;
}

/** Forecast data for trend display */
export interface ForecastPoint {
  day: string;
  date: string;
  htsi: number;
  riskLevel: SeverityLevel;
  dayOffset: number;
}

export interface ForecastData {
  currentHtsi: number;
  nextDayHtsi: number;
  changePercent: number;
  trend: 'rising' | 'falling' | 'stable';
  points: ForecastPoint[];
}

/** Data source provenance */
export interface DataSourceInfo {
  name: string;
  description: string;
  badge: string;
  color: string;
}

/** Complete ward explanation payload */
export interface WardExplanation {
  wardId: number;
  wardName: string;
  zoneName: string;
  zoneId: number;
  region: string;
  riskLevel: SeverityLevel;
  riskScore: number;
  humanHeatRisk: number;
  timestamp: string;

  /** AI-generated plain-language summary */
  summary: string;

  /** Ranked risk drivers with contribution percentages */
  drivers: RiskDriver[];

  /** Thermal stress indicators */
  thermal: {
    htsi: number;
    htsiLevel: number;
    htsiLabel: SeverityLevel;
    heatIndex: number;
    wbgt: number;
    utci: number;
    tmrt: number;
    temperature: number;
    humidity: number;
    windSpeed: number;
    solarRadiation: number;
    burden24h: number;
    burden72h: number;
    nighttimeStress: number;
    isExtremeEvent: boolean;
  };

  /** Population exposure data */
  exposure: ExposureData;

  /** Vulnerability assessment */
  vulnerability: VulnerabilityData;

  /** Forecast trend */
  forecast: ForecastData;

  /** Context-aware recommendations */
  recommendations: {
    citizens: string[];
    authorities: string[];
  };

  /** Data provenance chain */
  dataSources: DataSourceInfo[];
}
