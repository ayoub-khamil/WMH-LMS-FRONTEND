import { reportError } from './logger';
import { ApiError } from './ApiError';

/**
 * Centralized HTTP client for real API integration.
 *
 * - Base URL comes from `VITE_API_BASE_URL` (e.g. https://api.example.com/v1).
 *   Falls back to `/api` so a Vite dev-server proxy can be used.
 * - Attaches `Authorization: Bearer <JWT>` when a token is available.
 * - Throws `ApiError` with `status`, `payload` and the `correlationId` the
 *   server logged the request under.
 * - Dispatches `auth:unauthorized` on 401 so AuthContext can log out.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const TOKEN_KEY = 'wmh_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    reportError(e);
  }
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v == null) continue;
    qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

export async function request(path, { method = 'GET', body, auth = true, params } = {}) {
  const token = auth ? getToken() : null;
  const url = `${BASE_URL}${path}${params ? buildQuery(params) : ''}`;

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (e) {
    throw new ApiError('Network error. Please check your connection and try again.', {
      status: 0,
      payload: null,
      correlationId: null
    });
  }

  if (res.status === 401 && auth) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  const text = await res.text();
  const payload = text ? safeJson(text) : null;
  const correlationId = res.headers.get('X-Correlation-Id') || null;

  if (!res.ok) {
    const message =
      payload?.message || payload?.error || `Request failed (${res.status})`;
    throw new ApiError(message, { status: res.status, payload, correlationId });
  }

  return payload;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, body, opts) => request(path, { ...opts, method: 'DELETE', body })
};

export { BASE_URL };
