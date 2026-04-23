import { getApiBaseUrl } from '@/lib/env'

export type ApiRequestInit = RequestInit & {
  /** When false, do not send credentials (default true for cookie auth later). */
  withCredentials?: boolean
}

/**
 * Fetch relative to `VITE_API_BASE_URL`.
 * Typed paths can use generated types from `@/lib/api/schema`.
 */
export async function apiFetch(
  path: string,
  init: ApiRequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
  const { withCredentials = true, ...rest } = init
  return fetch(url, {
    ...rest,
    credentials: withCredentials ? 'include' : 'omit',
  })
}

export async function apiFetchJson<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function apiFetchAuthed(
  path: string,
  token: string,
  init: ApiRequestInit = {},
): Promise<Response> {
  return apiFetch(path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  })
}
