import { useEffect, useState } from 'react'

import {
  connectQuizRoom,
  disconnectQuizRoom,
  type QuizRoomSocket,
} from '@/lib/realtime/quizRoom'
import { useAuthStore } from '@/stores/authStore'

export type UseQuizRoomConnectionOptions = {
  /** When true, do not open a socket (e.g. offline demo). */
  skip?: boolean
}

/**
 * Live Socket.IO client for ``/quiz-room``. Skips ``mock-*`` room ids for local-only demos.
 * Uses JWT ``auth.token`` when available, else ``user_id`` from the auth store for dev.
 */
export function useQuizRoomConnection(
  roomId: string | undefined,
  opts: UseQuizRoomConnectionOptions = {},
): QuizRoomSocket | null {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  const [socket, setSocket] = useState<QuizRoomSocket | null>(null)

  useEffect(() => {
    if (opts.skip || !roomId || roomId.startsWith('mock-')) {
      const clearId = requestAnimationFrame(() => setSocket(null))
      return () => cancelAnimationFrame(clearId)
    }

    const s = connectQuizRoom(roomId, {
      token: token ?? undefined,
      userId: userId ?? undefined,
    })
    const setId = requestAnimationFrame(() => setSocket(s))
    return () => {
      cancelAnimationFrame(setId)
      disconnectQuizRoom(s)
      requestAnimationFrame(() => setSocket(null))
    }
  }, [roomId, token, userId, opts.skip])

  return socket
}
