/** Normalized API base (no trailing slash). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL ?? ''
  return raw.replace(/\/$/, '')
}

/**
 * HTTP(S) origin for Socket.IO (browser upgrades to `ws:` on same host).
 * Hybrid: set to the Nginx entry (e.g. `http://localhost`), not :8000.
 * Omitted: derived from `VITE_API_BASE_URL` by stripping `/api/v1`.
 */
export function getSocketIoHttpOrigin(): string | undefined {
  const explicit = import.meta.env.VITE_WS_BASE_URL?.trim().replace(/\/$/, '')
  if (explicit) return explicit
  const api = getApiBaseUrl()
  if (!api) return undefined
  const withoutApiPrefix = api.replace(/\/api\/v1\/?$/i, '')
  return withoutApiPrefix || undefined
}
