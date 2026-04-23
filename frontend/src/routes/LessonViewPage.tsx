import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useLessonQuery } from '@/lib/queries/lessonQueries'
import { useMaterialsQuery } from '@/lib/queries/materialQueries'

export function LessonViewPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const cid = parseInt(courseId ?? '', 10)
  const lid = parseInt(lessonId ?? '', 10)
  const navigate = useNavigate()
  const course = useCourseQuery(cid)
  const lessonQuery = useLessonQuery(lid)
  const materialsQuery = useMaterialsQuery(cid)

  const linkedFilename = useMemo(() => {
    const lesson = lessonQuery.data
    if (!lesson?.material_id) return null
    const m = materialsQuery.data?.find((x) => x.id === lesson.material_id)
    return m?.filename ?? null
  }, [lessonQuery.data, materialsQuery.data])

  if (lessonQuery.isLoading || materialsQuery.isLoading) {
    return <Spinner label="Loading lesson..." />
  }

  if (lessonQuery.isError || !lessonQuery.data || lessonQuery.data.course_id !== cid) {
    return (
      <p className="text-danger text-sm">
        Lesson not found.{' '}
        <Link to={`/student/course/${cid}`} className="text-primary underline">
          Back to course
        </Link>
      </p>
    )
  }

  const lesson = lessonQuery.data

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/student/course/${cid}`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to course
        </Link>
      </nav>

      <PageHeader
        title={lesson.title}
        description={
          <>
            Week {lesson.week_number}
            {course.data ? (
              <span className="text-foreground/60 mt-2 block text-sm">Course: {course.data.name}</span>
            ) : null}
          </>
        }
      />

      <Card padding="lg" className="mb-6">
        <h2 className="font-heading text-foreground mb-2 text-lg">Material</h2>
        <p className="text-foreground/80 text-sm">
          {linkedFilename ? (
            <>
              Linked file: <span className="text-foreground font-medium">{linkedFilename}</span>
            </>
          ) : (
            'No file linked to this lesson yet.'
          )}
        </p>
      </Card>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          navigate(`/student/practice/lobby/${String(lesson.course_id)}`, {
            state: { courseName: lesson.title },
          })
        }
      >
        Start practice test for this lesson
      </Button>
    </div>
  )
}
