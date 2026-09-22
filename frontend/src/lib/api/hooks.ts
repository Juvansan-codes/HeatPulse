// ─────────────────────────────────────────────────────────────────────────────
// HeatPulse React Data Hooks
//
// Production default: NEXT_PUBLIC_USE_MOCK_DATA=false → all data from FastAPI.
// If the API fails, an error state is shown. We NEVER silently fall back to fixtures.
// When NEXT_PUBLIC_USE_MOCK_DATA=true, fixtures are used for explicit dev/testing.
//
// Each hook returns { data, loading, error }.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiGet } from './client';
import type {
  ApiOverviewResponse,
  ApiWardCollection,
  ApiWardDetailResponse,
  ApiWardForecastResponse,
  ApiForecastListResponse,
  ApiAlertsResponse,
  ApiExplanationResponse,
} from './types';

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

// ── Generic fetch hook ──────────────────────────────────────────────────────

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useApi<T>(path: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(path !== null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (path === null || IS_MOCK) {
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    apiGet<T>(path, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [path]);

  return { data, loading, error };
}

// ── Specific endpoint hooks ─────────────────────────────────────────────────

export function useOverview(): UseApiResult<ApiOverviewResponse> {
  return useApi<ApiOverviewResponse>('/api/v1/overview');
}

export function useWards(): UseApiResult<ApiWardCollection> {
  return useApi<ApiWardCollection>('/api/v1/wards');
}

export function useWardDetail(wardId: number | null): UseApiResult<ApiWardDetailResponse> {
  const path = wardId !== null ? `/api/v1/wards/${wardId}` : null;
  return useApi<ApiWardDetailResponse>(path);
}

export function useWardForecast(wardId: number | null): UseApiResult<ApiWardForecastResponse> {
  const path = wardId !== null ? `/api/v1/wards/${wardId}/forecast` : null;
  return useApi<ApiWardForecastResponse>(path);
}

export function useForecastByDay(leadDay: number): UseApiResult<ApiForecastListResponse> {
  return useApi<ApiForecastListResponse>(`/api/v1/forecast?lead_day=${leadDay}`);
}

export function useAlerts(): UseApiResult<ApiAlertsResponse> {
  return useApi<ApiAlertsResponse>('/api/v1/alerts');
}

export function useWardExplanation(wardId: number | null): UseApiResult<ApiExplanationResponse> {
  const path = wardId !== null ? `/api/v1/wards/${wardId}/explanation?lead_day=1` : null;
  return useApi<ApiExplanationResponse>(path);
}

// ── Lazy-fetch helper (for on-demand fetches) ───────────────────────────────

export function useLazyApi<T>(): {
  data: T | null;
  loading: boolean;
  error: string | null;
  fetch: (path: string) => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((path: string) => {
    if (IS_MOCK) return;
    setLoading(true);
    setError(null);
    apiGet<T>(path)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, fetch: fetchData };
}

export { IS_MOCK };
