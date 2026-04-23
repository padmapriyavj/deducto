import { useState } from 'react'
import { Link } from 'react-router'

import { CreateCourseModal } from '@/components/courses/CreateCourseModal'
import { JoinCodeDisplay } from '@/components/courses/JoinCodeDisplay'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import type { Course } from '@/lib/api/types/course'
import { useProfessorDashboardQuery } from '@/lib/queries/dashboardQueries'
import { useCoursesQuery } from '@/lib/queries/courseQueries'

function ProfessorCourseCardReal({
  course,
  enrollmentCount,
  classAvg,
}: {
  course: Course
  enrollmentCount?: number
  classAvg?: number | null
}) {
  return (
    <Card padding="none" className="text-left overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              to={`/professor/course/${course.id}`}
              className="font-heading text-foreground hover:text-primary text-lg transition-colors sm:text-xl"
            >
              {course.name}
            </Link>
            {course.description ? (
              <p className="text-foreground/70 mt-1 text-sm">{course.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to={`/professor/course/${course.id}`}
              className="bg-secondary text-surface hover:opacity-95 inline-flex min-h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-center text-sm font-semibold transition-opacity"
            >
              Manage
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="border-divider/40 mb-4 grid grid-cols-3 gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <div>
              <p className="text-foreground font-mono text-sm font-semibold">{enrollmentCount ?? 0}</p>
              <p className="text-foreground/60 text-xs">Students</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <div>
              <p className="text-foreground font-mono text-sm font-semibold">
                {classAvg != null ? `${Number(classAvg).toFixed(0)}%` : '—'}
              </p>
              <p className="text-foreground/60 text-xs">Class avg</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-foreground text-sm font-medium">
                {new Date(course.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-foreground/60 text-xs">Created</p>
            </div>
          </div>
        </div>

        {/* Join code section */}
        <JoinCodeDisplay courseId={course.id} code={course.join_code} />
      </div>
    </Card>
  )
}

export function ProfessorDashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const courses = useCoursesQuery()
  const dashboard = useProfessorDashboardQuery()

  const dashById = new Map(
    (dashboard.data?.courses ?? []).map((c) => [
      c.id,
      { enrollment_count: c.enrollment_count, class_avg_score: c.class_avg_score },
    ]),
  )

  return (
    <div className="text-left">
      <PageHeader
        title="Professor dashboard"
        description="Manage your courses, view enrolled students, and share join codes."
        actions={
          <Button type="button" onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            Create course
          </Button>
        }
      />

      {courses.isLoading ? <Spinner label="Loading courses..." /> : null}
      {courses.isError ? (
        <p className="text-danger text-sm" role="alert">
          Could not load courses. Please try again.
        </p>
      ) : null}
      {dashboard.isError ? (
        <p className="text-foreground/70 text-sm">Dashboard stats unavailable (showing courses only).</p>
      ) : null}

      {courses.data ? (
        courses.data.length > 0 ? (
          <div className="space-y-4">
            {courses.data.map((c) => {
              const d = dashById.get(c.id)
              return (
                <ProfessorCourseCardReal
                  key={c.id}
                  course={c}
                  enrollmentCount={d?.enrollment_count}
                  classAvg={d?.class_avg_score ?? null}
                />
              )
            })}
          </div>
        ) : (
          <Card padding="lg" className="text-center">
            <p className="text-foreground/70 mb-4 text-sm">You have not created any courses yet.</p>
            <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
              Create your first course
            </Button>
          </Card>
        )
      ) : null}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
