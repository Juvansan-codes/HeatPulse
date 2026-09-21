import { WardRecord } from '../types';
import { ApiResponse, fetchWards } from './wards';
import { BackendAlertSchema } from './schema';
import mockDataJson from './mockData.json';

const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface HeatAlertItem {
  alert_id: string;
  ward_id: number;
  ward_name: string;
  zone: string;
  alert_level: string;
  htsi_score: number;
  utci_temp: number;
  population_exposed: number;
  issued_at: string;
  summary: string;
  action_items: string[];
}

/** Fetch active heat alert items matching backend BackendAlertSchema contract */
export async function fetchAlertItems(): Promise<ApiResponse<HeatAlertItem[]>> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, { cache: 'no-store' });
      if (res.ok) {
        const backendAlerts: BackendAlertSchema[] = await res.json();
        return {
          data: backendAlerts,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
          isStale: false,
          source: 'production_api'
        };
      }
    } catch (e) {
      console.warn('[HeatPulse API] Live alerts fetch failed, falling back to mock contract:', e);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const backendAlerts = (mockDataJson.alerts || []) as BackendAlertSchema[];
      resolve({
        data: backendAlerts,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        isStale: false,
        source: 'mock_contract'
      });
    }, 100);
  });
}

/** Fetch active heat alert wards (for map & UI list highlights) */
export async function fetchAlerts(): Promise<ApiResponse<WardRecord[]>> {
  const wardsRes = await fetchWards();
  const alertWards = wardsRes.data.filter(
    (w) => w.risk_level === 'Extreme' || w.risk_level === 'Very High' || w.risk_level === 'High'
  ).sort((a, b) => b.human_heat_risk - a.human_heat_risk);

  return {
    data: alertWards,
    timestamp: wardsRes.timestamp,
    isStale: wardsRes.isStale,
    source: wardsRes.source
  };
}

