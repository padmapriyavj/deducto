import { Link, useParams } from 'react-router'

import { AvatarImg } from '@/components/ui/AvatarImg'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useCourseQuery, useCourseLeaderboardQuery } from '@/lib/queries/courseQueries'
import { useAuthStore } from '@/stores/authStore'

export function LeaderboardPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const selfId = useAuthStore((s) => s.user?.id)
  const course = useCourseQuery(id)
  const leaderboard = useCourseLeaderboardQuery(id)

  function rowInitials(displayName: string, email: string) {
    const n = displayName.trim()
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean)
      if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
      return n.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  if (course.isLoading || leaderboard.isLoading) return <Spinner label="Loading…" />

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/student/course/${id}`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to course
        </Link>
      </nav>

      <PageHeader
        title="Leaderboard"
        description={course.data ? `${course.data.name} — ranked by coins earned in this course.` : 'Course leaderboard'}
      />

      {leaderboard.isError ? (
        <p className="text-danger text-sm">Could not load leaderboard.</p>
      ) : (
        <ol className="space-y-2">
          {(leaderboard.data ?? []).map((s, idx) => {
            const rank = idx + 1
            const rankLabel = rank <= 3 ? `${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : 'rd'}` : String(rank)
            const isSelf = s.id === selfId
            return (
              <li key={s.id}>
                <Card
                  padding="md"
                  className={`flex items-center justify-between gap-3 ${isSelf ? 'ring-secondary ring-2' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 font-mono text-sm font-bold ${rank === 1 ? 'text-gold' : rank === 2 ? 'text-foreground/70' : rank === 3 ? 'text-amber-700' : 'text-foreground/50'}`}>
                      {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rankLabel}
                    </span>
                    <AvatarImg
                      user={{ id: s.id, email: s.email }}
                      fallbackInitials={rowInitials(s.display_name, s.email)}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{s.display_name}</p>
                      <p className="text-foreground/60 text-xs">{s.tests_taken} tests taken</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-gold font-mono text-sm font-bold tabular-nums">{s.course_coins}</span>
                    <p className="text-foreground/60 text-xs">coins</p>
                  </div>
                </Card>
              </li>
            )
          })}
          {(leaderboard.data ?? []).length === 0 ? (
            <Card padding="lg" className="text-center">
              <p className="text-foreground/70 text-sm">No one has earned coins in this course yet. Be the first!</p>
            </Card>
          ) : null}
        </ol>
      )}
    </div>
  )
}
