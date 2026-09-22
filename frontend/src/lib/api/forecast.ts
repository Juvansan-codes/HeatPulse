import { ForecastDay } from '../types';
import { ApiResponse } from './wards';
import { BackendForecastSchema } from './schema';
import { transformBackendForecastToForecastDay } from './adapter';
import mockDataJson from './mockData.json';

const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Fetch 5-day calibrated thermal forecast using backend data contract */
export async function fetchForecast(): Promise<ApiResponse<ForecastDay[]>> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/forecast`, { cache: 'no-store' });
      if (res.ok) {
        const backendForecast: BackendForecastSchema[] = await res.json();
        const transformed = backendForecast.map(transformBackendForecastToForecastDay);
        return {
          data: transformed,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
          isStale: false,
          source: 'production_api'
        };
      }
    } catch (e) {
      console.warn('[HeatPulse API] Live forecast fetch failed, falling back to mock contract:', e);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const backendForecast = (mockDataJson.forecast || []) as BackendForecastSchema[];
      const transformed = backendForecast.map(transformBackendForecastToForecastDay);
      resolve({
        data: transformed,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        isStale: false,
        source: 'mock_contract'
      });
    }, 120);
  });
}

