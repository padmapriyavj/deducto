import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type DuelCreateBody = components['schemas']['DuelCreateBody']
export type DuelCreateResponse = components['schemas']['DuelCreateResponse']
export type DuelRoomInfoResponse = {
  room_id: string
  quiz_id: number
  status: string
}

export type DuelJoinResponse = components['schemas']['DuelJoinResponse']
export type DuelAttemptResponse = components['schemas']['DuelAttemptResponse']
export type DuelSettleBody = components['schemas']['DuelSettleBody']
export type DuelSettleResponse = components['schemas']['DuelSettleResponse']

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/** GET /api/v1/duels/{room_id} */
export async function getDuelRoom(token: string, roomId: string): Promise<DuelRoomInfoResponse> {
  return apiFetchJson<DuelRoomInfoResponse>(`/duels/${encodeURIComponent(roomId)}`, {
    headers: authHeaders(token),
  })
}

/** POST /api/v1/duels */
export async function createDuel(token: string, body: DuelCreateBody): Promise<DuelCreateResponse> {
  return apiFetchJson<DuelCreateResponse>('/duels', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/** POST /api/v1/duels/{room_id}/join */
export async function joinDuel(token: string, roomId: string): Promise<DuelJoinResponse> {
  return apiFetchJson<DuelJoinResponse>(`/duels/${encodeURIComponent(roomId)}/join`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

/** POST /api/v1/duels/{room_id}/attempts */
export async function createDuelAttempt(token: string, roomId: string): Promise<DuelAttemptResponse> {
  return apiFetchJson<DuelAttemptResponse>(`/duels/${encodeURIComponent(roomId)}/attempts`, {
    method: 'POST',
    headers: authHeaders(token),
  })
}

/** POST /api/v1/duels/{room_id}/mark-active */
export async function markDuelActive(roomId: string): Promise<void> {
  const res = await apiFetch(`/duels/${encodeURIComponent(roomId)}/mark-active`, {
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
}

/** POST /api/v1/duels/{room_id}/settle */
export async function settleDuel(
  token: string,
  roomId: string,
  body: DuelSettleBody,
): Promise<DuelSettleResponse> {
  return apiFetchJson<DuelSettleResponse>(`/duels/${encodeURIComponent(roomId)}/settle`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
