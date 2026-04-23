import { Link } from 'react-router'

import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useCoursesQuery } from '@/lib/queries/courseQueries'

export function PracticeHubPage() {
  const courses = useCoursesQuery()

  return (
    <section className="mx-auto max-w-2xl text-center">
      <PageHeader
        title="Practice test"
        description="Pick a course to open the practice lobby for solo runs or duels."
      />

      {courses.isLoading ? <Spinner label="Loading courses…" /> : null}
      {courses.isError ? (
        <p className="text-danger text-sm" role="alert">
          Could not load your courses. Try again from the dashboard after signing in.
        </p>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(courses.data ?? []).map((course) => (
          <li key={course.id}>
            <Card padding="md" className="h-full text-center">
              <h2 className="font-heading text-foreground text-lg">{course.name}</h2>
              <p className="text-foreground/70 mt-2 text-sm">Open the practice lobby for this course.</p>
              <Link
                to={`/student/practice/lobby/${course.id}`}
                state={{ courseName: course.name }}
                className="bg-primary text-surface shadow-soft border-primary/20 mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border px-6 text-sm font-semibold transition-opacity hover:opacity-95"
              >
                Open lobby
              </Link>
            </Card>
          </li>
        ))}
      </ul>
      {(courses.data?.length ?? 0) === 0 && courses.isSuccess ? (
        <p className="text-foreground/70 mt-4 text-sm">You are not enrolled in any courses yet.</p>
      ) : null}
    </section>
  )
}
