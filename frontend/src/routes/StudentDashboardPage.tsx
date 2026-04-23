import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { StudentCourseCard } from '@/components/courses/StudentCourseCard'
import { JoinCourseModal } from '@/components/courses/JoinCourseModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { Spinner } from '@/components/ui/Spinner'
import { useStudentDashboardQuery } from '@/lib/queries/dashboardQueries'
import { useCoursesQuery } from '@/lib/queries/courseQueries'
import { playFinnGreeting } from '@/lib/voice/playFinnGreeting'
import { useAuthStore } from '@/stores/authStore'

export function StudentDashboardPage() {
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  const user = useAuthStore((s) => s.user)
  const dashboard = useStudentDashboardQuery()
  const coursesFallback = useCoursesQuery()

  const greeting = useMutation({
    mutationFn: playFinnGreeting,
    onMutate: () => setVoiceError(null),
    onError: (err) =>
      setVoiceError(err instanceof Error ? err.message : 'Voice failed.'),
  })

  const mood: FinnMood = greeting.isPending ? 'speaking' : 'neutral'

  const welcomeMessage = user?.display_name
    ? `Hey ${user.display_name}! Ready to learn something new today?`
    : 'Hey there! Ready to learn something new today?'

  return (
    <div className="text-left">
      {/* Finn welcome section - centered */}
      <div className="mb-10 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => greeting.mutate()}
          disabled={greeting.isPending}
          className="group relative mb-4 focus:outline-none"
          aria-label="Play Finn's greeting"
        >
          <FinnMascot mood={mood} isSpeaking={greeting.isPending} size={120} />
          <span className="bg-primary/90 text-primary-foreground absolute -bottom-1 -right-1 rounded-full p-1.5 text-xs opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            🔊
          </span>
        </button>
        <div className="bg-surface border-divider/60 shadow-soft max-w-md rounded-2xl border px-6 py-4">
          <p className="text-foreground text-base font-medium">{welcomeMessage}</p>
          {voiceError ? (
            <p className="text-danger mt-2 text-xs">{voiceError}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-foreground text-xl sm:text-2xl">Your courses</h2>
      </div>

      {dashboard.isLoading ? <Spinner label="Loading dashboard…" /> : null}
      {dashboard.isError ? (
        <p className="text-danger mb-3 text-sm">
          Dashboard API unavailable — showing your enrolled courses from the courses list instead.
        </p>
      ) : null}

      {dashboard.isSuccess && dashboard.data.courses.length > 0 ? (
        <div className="space-y-4">
          {dashboard.data.courses.map((c) => (
            <StudentCourseCard
              key={c.id}
              course={{ id: c.id, name: c.name }}
              dashboardData={{
                tests_taken: c.tests_taken,
                coins_earned: c.coins_earned,
                top_weak_concept: c.top_weak_concept,
                upcoming_events: c.upcoming_events,
              }}
            />
          ))}
        </div>
      ) : null}

      {dashboard.isSuccess && dashboard.data.courses.length === 0 && coursesFallback.data && coursesFallback.data.length > 0 ? (
        <div className="space-y-4">
          {coursesFallback.data.map((c) => (
            <StudentCourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : null}

      {dashboard.isError && coursesFallback.data && coursesFallback.data.length > 0 ? (
        <div className="space-y-4">
          {coursesFallback.data.map((c) => (
            <StudentCourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : null}

      {dashboard.isSuccess &&
      dashboard.data.courses.length === 0 &&
      (!coursesFallback.data || coursesFallback.data.length === 0) &&
      !coursesFallback.isLoading ? (
        <div className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border p-8 text-center sm:p-10">
          <p className="text-foreground/70 mb-4 text-sm sm:text-base">
            You haven&apos;t joined any courses yet.
          </p>
          <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
            Join your first course
          </Button>
        </div>
      ) : null}

      {dashboard.isError &&
      (!coursesFallback.data || coursesFallback.data.length === 0) &&
      !coursesFallback.isLoading ? (
        <div className="bg-surface shadow-soft border-divider/60 rounded-[var(--radius-lg)] border p-8 text-center sm:p-10">
          <p className="text-foreground/70 mb-4 text-sm sm:text-base">
            You haven&apos;t joined any courses yet.
          </p>
          <Button type="button" onClick={() => setIsJoinModalOpen(true)}>
            Join your first course
          </Button>
        </div>
      ) : null}

      {/* Quick actions */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card padding="lg" className="flex flex-col items-center text-center">
          <span className="mb-3 text-3xl">🎯</span>
          <h3 className="font-heading text-foreground mb-2 text-lg">Practice</h3>
          <p className="text-foreground/70 mb-4 flex-1 text-sm">Take a practice test to sharpen your skills and earn coins.</p>
          <Link
            to="/student/practice"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors"
          >
            Start Practice
          </Link>
        </Card>
        <Card padding="lg" className="flex flex-col items-center text-center">
          <span className="mb-3 text-3xl">📚</span>
          <h3 className="font-heading text-foreground mb-2 text-lg">Join a Course</h3>
          <p className="text-foreground/70 mb-4 flex-1 text-sm">Enter a course code from your professor to enroll.</p>
          <Button type="button" fullWidth onClick={() => setIsJoinModalOpen(true)}>
            Join Course
          </Button>
        </Card>
      </div>

      <JoinCourseModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  )
}
