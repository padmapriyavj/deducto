import { Link } from 'react-router'

import { Card } from '@/components/ui/Card'
import type { Course } from '@/lib/api/types/course'

type DashboardCourseData = {
  tests_taken?: number
  coins_earned?: number
  top_weak_concept?: string | null
  upcoming_events?: { id: string; title: string; date: string }[]
}

type Props = {
  course: Pick<Course, 'id' | 'name'> & { description?: string | null }
  dashboardData?: DashboardCourseData
}

export function StudentCourseCard({ course, dashboardData }: Props) {
  const testsTaken = dashboardData?.tests_taken ?? 0
  const coinsEarned = dashboardData?.coins_earned ?? 0
  const weakConcept = dashboardData?.top_weak_concept
  const upcomingCount = dashboardData?.upcoming_events?.length ?? 0

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              to={`/student/course/${course.id}`}
              className="font-heading text-foreground hover:text-primary text-lg transition-colors sm:text-xl"
            >
              {course.name}
            </Link>
            {course.description ? (
              <p className="text-foreground/70 mt-1 text-sm leading-relaxed">{course.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to={`/student/practice/lobby/${course.id}`}
              state={{ courseName: course.name }}
              className="bg-secondary text-surface hover:opacity-95 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-center text-sm font-semibold transition-opacity"
            >
              Practice
            </Link>
            <Link
              to={`/student/course/${course.id}`}
              className="border-divider bg-surface text-foreground hover:border-primary/50 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-sm)] border px-4 text-sm font-medium transition-colors"
            >
              Details
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="border-divider/40 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <div>
              <p className="text-foreground font-mono text-sm font-semibold">{testsTaken}</p>
              <p className="text-foreground/60 text-xs">Tests taken</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🪙</span>
            <div>
              <p className="text-gold font-mono text-sm font-semibold">{coinsEarned}</p>
              <p className="text-foreground/60 text-xs">Coins earned</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-foreground font-mono text-sm font-semibold">{upcomingCount}</p>
              <p className="text-foreground/60 text-xs">Upcoming</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-foreground truncate text-sm font-medium" title={weakConcept ?? undefined}>
                {weakConcept || '—'}
              </p>
              <p className="text-foreground/60 text-xs">Focus area</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
