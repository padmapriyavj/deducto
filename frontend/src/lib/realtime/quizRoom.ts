/**
 * Socket.IO `/quiz-room` namespace (PRD §8.4).
 *
 * Server → client: ``room:state``, ``room:error``, ``quiz:question``, ``quiz:peer_answered``,
 * ``quiz:next``, ``quiz:complete``, ``tempo:fire``
 * Client → server: ``room:join``, ``quiz:start``, ``quiz:answer``, ``room:leave``
 *
 * Auth: JWT in ``auth.token`` (validated server-side); optional ``user_id`` fallback for dev.
 */

import { io, type Socket } from 'socket.io-client'

import { getSocketIoHttpOrigin } from '@/lib/env'

export const QUIZ_SERVER_EVENTS = [
  'room:state',
  'room:error',
  'quiz:question',
  'quiz:peer_answered',
  'quiz:next',
  'quiz:complete',
  'tempo:fire',
] as const

export const QUIZ_CLIENT_EVENTS = ['room:join', 'quiz:start', 'quiz:answer', 'room:leave'] as const

export type QuizServerEvent = (typeof QUIZ_SERVER_EVENTS)[number]
export type QuizClientEvent = (typeof QUIZ_CLIENT_EVENTS)[number]

/** HTTP(S) origin for Socket.IO (see {@link getSocketIoHttpOrigin}). */
function getHttpOrigin(): string | undefined {
  return getSocketIoHttpOrigin()
}

export type QuizRoomSocket = Socket

export type ConnectQuizRoomOpts = {
  /** JWT access token (preferred). */
  token?: string
  /** Dev-only fallback when no token. */
  userId?: string | number
}

export function connectQuizRoom(
  roomId: string | undefined,
  opts: ConnectQuizRoomOpts = {},
): QuizRoomSocket | null {
  const origin = getHttpOrigin()
  if (!origin) {
    console.info(
      '[quiz-room] Set VITE_WS_BASE_URL or VITE_API_BASE_URL to enable Socket.IO.',
    )
    return null
  }
  const auth: Record<string, string> = {}
  if (opts.token?.trim()) {
    auth.token = opts.token.trim()
  } else if (opts.userId != null && String(opts.userId).trim()) {
    auth.user_id = String(opts.userId).trim()
  }
  const q = roomId?.trim() ? { room_id: roomId.trim() } : undefined
  const socket = io(`${origin}/quiz-room`, {
    path: '/socket.io',
    auth,
    ...(q ? { query: q } : {}),
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 800,
    reconnectionDelayMax: 12_000,
    timeout: 25_000,
    transports: ['websocket', 'polling'],
  })
  return socket
}

export function disconnectQuizRoom(socket: QuizRoomSocket | null): void {
  socket?.disconnect()
}
