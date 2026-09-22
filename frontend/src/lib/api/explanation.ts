import { getMockExplanationContract } from '../explainability';
import { ExplanationContract } from '../types';
import { ApiResponse, fetchWardById } from './wards';

const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/** Fetch Phase F7 explainability payload for a given ward */
export async function fetchWardExplanation(wardId: number): Promise<ApiResponse<ExplanationContract>> {
  if (USE_LIVE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/wards/${wardId}/explanation`, { cache: 'no-store' });
      if (res.ok) {
        const rawBackendExp = await res.json();
        // Return computed or mapped explanation
        const wardRes = await fetchWardById(wardId);
        if (wardRes.data) {
          return {
            data: rawBackendExp as ExplanationContract,
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

  const payload = getMockExplanationContract(wardId);

  return {
    data: payload,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    isStale: false,
    source: 'mock_contract'
  };
}
