import { apiFetch, apiFetchJson } from '@/lib/api/client'

/** @deprecated Legacy REST quiz-room stub; realtime uses Socket.IO ``/quiz-room``. */
export type CreateQuizRoomBody = Record<string, unknown>
export type CreateQuizRoomResult = Record<string, unknown>
export type QuizRoomPublic = Record<string, unknown>

/** POST /quiz-rooms */
export async function createQuizRoom(
  body: CreateQuizRoomBody,
  token: string,
): Promise<CreateQuizRoomResult> {
  return apiFetchJson<CreateQuizRoomResult>('/quiz-rooms', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getQuizRoom(roomId: string, token: string): Promise<QuizRoomPublic> {
  const res = await apiFetch(`/quiz-rooms/${encodeURIComponent(roomId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<QuizRoomPublic>
}
