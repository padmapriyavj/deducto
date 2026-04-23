import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import type { BetchaMultiplier, QuizRunLocationState } from '@/lib/mocks/quizRun'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useJoinTempoMutation } from '@/lib/queries/tempoQueries'
import { useAuthStore } from '@/stores/authStore'

type TempoNavState = {
  courseName?: string
  courseId?: number
}

/**
 * Tempo delivery: Betcha first, then join tempo quiz room via API + Socket.IO runner.
 */
export function TempoScreenPage() {
  const { instanceId } = useParams<{ instanceId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const nav = (location.state as TempoNavState | null) ?? null
  const token = useAuthStore((s) => s.token)
  const courseIdNav = nav?.courseId != null && nav.courseId > 0 ? nav.courseId : 0
  const courseQuery = useCourseQuery(courseIdNav)
  const resolvedCourseName = nav?.courseName?.trim() || courseQuery.data?.name
  const [betcha, setBetcha] = useState<BetchaMultiplier>(1)
  const [err, setErr] = useState<string | null>(null)
  const joinMut = useJoinTempoMutation(token)

  const joinTempo = () => {
    const quizId = (instanceId ?? '').trim()
    if (!quizId) {
      setErr('Missing quiz id in URL.')
      return
    }
    if (!token) {
      setErr('Sign in to join this Tempo.')
      return
    }
    setErr(null)
    joinMut.mutate(quizId, {
      onSuccess: (res) => {
        const roomId = res.realtime_room_id
        const courseName = resolvedCourseName?.trim() || `Quiz ${res.quiz_id}`
        const state: QuizRunLocationState = {
          mode: 'tempo',
          betcha,
          lessonId: String(res.quiz_id),
          courseName,
          realtime: {
            quizId: String(res.quiz_id),
            mode: 'tempo',
          },
        }
        navigate(`/student/quiz/${encodeURIComponent(roomId)}`, { state })
      },
      onError: (e) => {
        setErr(e instanceof Error ? e.message : 'Could not join Tempo.')
      },
    })
  }

  return (
    <section className="text-left">
      <nav className="text-foreground/70 mb-4 text-sm">
        <Link to="/student" className="text-primary inline-flex min-h-11 items-center hover:underline">
          Dashboard
        </Link>
      </nav>
      <PageHeader
        title="Tempo"
        description={
          <>
            Quiz <span className="font-mono">{instanceId}</span>
            {resolvedCourseName ? (
              <>
                {' '}
                · <span className="font-medium">{resolvedCourseName}</span>
              </>
            ) : null}
            . Place Betcha, then join opens the live quiz room (Socket.IO{' '}
            <span className="font-mono">/quiz-room</span>).
          </>
        }
      />
      {err ? (
        <p className="text-danger mb-4 text-sm" role="alert">
          {err}
        </p>
      ) : null}
      <div className="mb-6 max-w-lg">
        <BetchaSelector value={betcha} onChange={setBetcha} />
      </div>
      <Button type="button" onClick={joinTempo} disabled={joinMut.isPending}>
        {joinMut.isPending ? 'Joining…' : 'Join Tempo quiz'}
      </Button>
    </section>
  )
}
