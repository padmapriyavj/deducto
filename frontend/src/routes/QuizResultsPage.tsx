import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import type { QuizResultsLocationState } from '@/lib/mocks/quizRun'

export function QuizResultsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state as QuizResultsLocationState | null

  useEffect(() => {
    if (!data) return
    const pct = Math.round((data.correctCount / data.totalQuestions) * 100)
    if (pct >= 70) {
      void confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } })
    }
  }, [data])

  if (!data) {
    return (
      <section className="text-left">
        <p className="text-foreground/80 mb-4 text-sm">No results to show.</p>
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          Dashboard
        </Link>
      </section>
    )
  }

  const pct = Math.round((data.correctCount / data.totalQuestions) * 100)

  return (
    <section className="text-left">
      <PageHeader title="Quiz results" description={<span className="font-mono text-xs">Room {roomId}</span>} />

      <Card padding="lg" className="mx-auto mb-6 max-w-md">
        <p className="font-heading text-foreground text-4xl">{pct}%</p>
        <p className="text-foreground/80 mt-2 text-sm">
          {data.correctCount} / {data.totalQuestions} correct · Mode: {data.mode}
        </p>
        <p className="text-gold mt-3 font-mono text-lg">+{data.coinsEarned} coins</p>
        <p className="text-foreground/75 mt-3 text-sm">{data.betchaOutcome}</p>
        {data.serverScoringFailed ? (
          <p className="text-danger mt-4 text-sm" role="alert">
            Your score was not saved on the server, so your coin balance was not updated. Try again or contact
            support if this keeps happening.
          </p>
        ) : null}
      </Card>

      <Button type="button" onClick={() => navigate('/student')}>
        Back to dashboard
      </Button>
    </section>
  )
}
