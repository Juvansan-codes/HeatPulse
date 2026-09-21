import { computeWardExplanation } from '../explainability';
import { WardExplanation } from '../explainabilityTypes';
import { ApiResponse, fetchWardById } from './wards';
import { BackendExplanationSchema } from './schema';

const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Fetch Phase F7 explainability payload for a given ward */
export async function fetchWardExplanation(wardId: number): Promise<ApiResponse<WardExplanation>> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/wards/${wardId}/explanation`, { cache: 'no-store' });
      if (res.ok) {
        const rawBackendExp: BackendExplanationSchema = await res.json();
        // Return computed or mapped explanation
        const wardRes = await fetchWardById(wardId);
        if (wardRes.data) {
          return {
            data: computeWardExplanation(wardRes.data),
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
            isStale: false,
            source: 'production_api'
          };
        }
      }
    } catch (e) {
      console.warn(`[HeatPulse API] Live explanation fetch for ward ${wardId} failed:`, e);
    }
  }

  const wardRes = await fetchWardById(wardId);
  const ward = wardRes.data!;
  const payload = computeWardExplanation(ward);

  return {
    data: payload,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    isStale: false,
    source: wardRes.source
  };
}


