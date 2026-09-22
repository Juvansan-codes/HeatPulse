// ─────────────────────────────────────────────────────────────────────────────
// HeatPulse Centralized API Client
// Reads NEXT_PUBLIC_API_BASE_URL. Never hardcodes the production URL.
// Typed ApiError. No `as any`.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  statusText: string;
  body: string;

  constructor(status: number, statusText: string, body: string) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}

/**
 * Centralized GET request to the HeatPulse FastAPI backend.
 * Returns parsed JSON typed as T.
 * Throws ApiError for non-2xx responses.
 * Throws Error for network/timeout/parse failures.
 */
export async function apiGet<T>(path: string, options?: { signal?: AbortSignal }): Promise<T> {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured');
  }

  const url = `${API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: options?.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new Error(`Network error fetching ${path}: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // ignore body read failure
    }
    throw new ApiError(response.status, response.statusText, body);
  }

  let data: T;
  try {
    data = await response.json() as T;
  } catch {
    throw new Error(`Malformed JSON response from ${path}`);
  }

  return data;
}
