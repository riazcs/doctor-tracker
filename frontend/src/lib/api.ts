/**
 * Thin fetch wrapper. All calls go to same-origin `/api/*`, whose server route proxies to
 * the Express server — so the httpOnly session cookie is first-party
 * and no token ever touches JavaScript.
 */
export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: FieldError[],
  ) {
    super(message);
  }
}

type Params = Record<string, string | number | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Params;
  signal?: AbortSignal;
}

export function toQueryString(params?: Params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function api<T>(path: string, { method = 'GET', body, params, signal }: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}${toQueryString(params)}`, {
      method,
      signal,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const error = json?.error;
    if (res.status === 401 && !path.startsWith('/auth/') && typeof window !== 'undefined') {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Full reload on purpose: wipes every in-memory cache of patient data before showing login.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/login?next=${next}&expired=1`);
    }
    throw new ApiError(res.status, error?.message ?? 'Request failed', error?.code, error?.details);
  }
  return json as T;
}

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';
