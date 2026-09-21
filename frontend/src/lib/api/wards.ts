import { WARDS_DATA } from '../data';
import { WardRecord } from '../types';
import { BackendWardSchema } from './schema';
import { transformBackendWardToWardRecord, transformWardRecordToBackendWard } from './adapter';
import mockDataJson from './mockData.json';

/** API Response wrapper with timestamp metadata */
export interface ApiResponse<T> {
  data: T;
  timestamp: string;
  isStale: boolean;
  source: 'production_api' | 'cached_data' | 'mock_contract';
}

const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Helper to retrieve wards conforming to BackendWardSchema data contract.
 * Priority: Live API -> mockData.json contract -> Fallback WARDS_DATA converted via contract adapter.
 */
function getContractWards(): WardRecord[] {
  const mockWardsMap = new Map<number, WardRecord>();

  // Parse mock JSON schema entries
  const mockBackendWards = (mockDataJson.wards || []) as BackendWardSchema[];
  for (const bw of mockBackendWards) {
    mockWardsMap.set(bw.ward_id, transformBackendWardToWardRecord(bw));
  }

  // Combine with fallback dataset, ensuring every single record flows through contract adapter
  return WARDS_DATA.map((fallbackWard) => {
    if (mockWardsMap.has(fallbackWard.ward_id)) {
      return mockWardsMap.get(fallbackWard.ward_id)!;
    }
    // Round-trip through BackendWardSchema to guarantee schema contract enforcement
    const backendSchema = transformWardRecordToBackendWard(fallbackWard);
    return transformBackendWardToWardRecord(backendSchema);
  });
}

/** Fetch all 200 GCC ward records */
export async function fetchWards(): Promise<ApiResponse<WardRecord[]>> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/wards`, { cache: 'no-store' });
      if (res.ok) {
        const backendWards: BackendWardSchema[] = await res.json();
        const transformed = backendWards.map(transformBackendWardToWardRecord);
        return {
          data: transformed,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
          isStale: false,
          source: 'production_api'
        };
      }
    } catch (e) {
      console.warn('[HeatPulse API] Live FastAPI connection failed, falling back to mock contract:', e);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: getContractWards(),
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        isStale: false,
        source: 'mock_contract'
      });
    }, 150);
  });
}

/** Fetch a single ward record by ID */
export async function fetchWardById(wardId: number): Promise<ApiResponse<WardRecord | null>> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/wards/${wardId}`, { cache: 'no-store' });
      if (res.ok) {
        const backendWard: BackendWardSchema = await res.json();
        return {
          data: transformBackendWardToWardRecord(backendWard),
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
          isStale: false,
          source: 'production_api'
        };
      }
    } catch (e) {
      console.warn(`[HeatPulse API] Live fetch for ward ${wardId} failed, falling back to mock contract:`, e);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const allWards = getContractWards();
      const ward = allWards.find((w) => w.ward_id === wardId) || allWards[0];
      resolve({
        data: ward || null,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        isStale: false,
        source: 'mock_contract'
      });
    }, 100);
  });
}

