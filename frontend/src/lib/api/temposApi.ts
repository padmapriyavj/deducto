import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

/** Request body for POST /tempos/schedule (quiz ids are bigint). */
export type ScheduleTempoBody = {
  quiz_id: number
  scheduled_at: string
}
export type TempoJoinResponse = components['schemas']['TempoJoinResponse']
export type TempoFireResponse = components['schemas']['TempoFireResponse']

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/** POST …/tempos/schedule — body uses ISO datetime for ``scheduled_at`` (path is under ``VITE_API_BASE_URL``). */
export async function scheduleTempo(token: string, body: ScheduleTempoBody): Promise<void> {
  const res = await apiFetch('/tempos/schedule', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
}

/** GET …/tempos/upcoming (future scheduled — calendar only). */
export async function listUpcomingTempos(token: string): Promise<Record<string, unknown>[]> {
  const data = await apiFetchJson<Record<string, unknown>[]>('/tempos/upcoming', {
    headers: authHeaders(token),
  })
  return Array.isArray(data) ? data : []
}

/** GET …/tempos/joinable (scheduled start passed or unset — open quiz room). */
export async function listJoinableTempos(token: string): Promise<Record<string, unknown>[]> {
  const data = await apiFetchJson<Record<string, unknown>[]>('/tempos/joinable', {
    headers: authHeaders(token),
  })
  return Array.isArray(data) ? data : []
}

/** POST …/tempos/{quiz_id}/join */
export async function joinTempo(token: string, quizId: string): Promise<TempoJoinResponse> {
  return apiFetchJson<TempoJoinResponse>(`/tempos/${encodeURIComponent(quizId)}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

/** POST …/tempos/{quiz_id}/fire (dev) */
export async function devFireTempo(quizId: string): Promise<TempoFireResponse> {
  return apiFetchJson<TempoFireResponse>(`/tempos/${encodeURIComponent(quizId)}/fire`, {
    method: 'POST',
  })
}
