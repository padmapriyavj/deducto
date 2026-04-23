import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { connectQuizRoom, disconnectQuizRoom, type QuizRoomSocket } from '@/lib/realtime/quizRoom'
import type { TempoFirePayload } from '@/lib/realtime/protocol'
import { useAuthStore } from '@/stores/authStore'

/**
 * Lightweight Socket.IO connection to hear ``tempo:fire`` broadcasts (namespace ``/quiz-room``).
 * Navigates students to the Tempo join screen for the fired quiz.
 */
export function useTempoFireListener() {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  const role = useAuthStore((s) => s.user?.role)
  const navigate = useNavigate()
  const socketRef = useRef<QuizRoomSocket | null>(null)

  useEffect(() => {
    if (role !== 'student') return
    if (!token && userId == null) return

    const socket = connectQuizRoom(undefined, {
      token: token ?? undefined,
      userId: userId ?? undefined,
    })
    socketRef.current = socket
    if (!socket) return

    const onFire = (payload: unknown) => {
      const p = payload as TempoFirePayload
      if (!p?.quiz_id) return
      if (import.meta.env.DEV) {
        console.info('[tempo:fire]', p)
      }
      const cid =
        p.course_id != null && String(p.course_id).trim() !== ''
          ? parseInt(String(p.course_id), 10)
          : NaN
      navigate(`/student/tempo/${encodeURIComponent(p.quiz_id)}`, {
        state: Number.isFinite(cid) && cid > 0 ? { courseId: cid } : undefined,
      })
    }

    socket.on('tempo:fire', onFire)
    return () => {
      socket.off('tempo:fire', onFire)
      disconnectQuizRoom(socket)
      socketRef.current = null
    }
  }, [token, userId, role, navigate])
}
