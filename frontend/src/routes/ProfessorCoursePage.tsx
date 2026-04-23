import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { UploadMaterialModal } from '@/components/materials/UploadMaterialModal'
import { CourseForm } from '@/components/courses/CourseForm'
import { JoinCodeDisplay } from '@/components/courses/JoinCodeDisplay'
import { AvatarImg } from '@/components/ui/AvatarImg'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { Spinner } from '@/components/ui/Spinner'
import type { Student, UpdateCourseRequest } from '@/lib/api/types/course'
import {
  useCourseAnalyticsQuery,
  type CourseAnalyticsResponse,
} from '@/lib/queries/dashboardQueries'
import {
  useCourseQuery,
  useCourseStudentsQuery,
  useUpdateCourseMutation,
} from '@/lib/queries/courseQueries'
import { useDeleteMaterialMutation, useMaterialsQuery } from '@/lib/queries/materialQueries'
import { useLessonsQuery } from '@/lib/queries/lessonQueries'

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message)
      return parsed.detail || error.message
    } catch {
      return error.message
    }
  }
  return 'Something went wrong. Please try again.'
}

const rosterCell = 'px-4 py-3.5 align-middle sm:px-5 sm:py-4'

function studentRowInitials(student: Student) {
  const n = student.display_name.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  return student.email.slice(0, 2).toUpperCase()
}

function StudentRow({ student }: { student: Student }) {
  return (
    <tr className="border-divider/40 border-b last:border-0">
      <td className={rosterCell}>
        <div className="flex items-center gap-3">
          <AvatarImg
            user={{ id: student.id, email: student.email }}
            fallbackInitials={studentRowInitials(student)}
            size="sm"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium">{student.display_name}</p>
            <p className="text-foreground/60 truncate text-xs">{student.email}</p>
          </div>
        </div>
      </td>
      <td className={`${rosterCell} font-mono text-sm tabular-nums`}>{student.coins}</td>
      <td className={`${rosterCell} font-mono text-sm tabular-nums`}>{student.current_streak} days</td>
    </tr>
  )
}

type Tab = 'students' | 'materials' | 'lessons' | 'analytics'

function ConceptHeatmapSection({ data }: { data: CourseAnalyticsResponse }) {
  const concepts = useMemo(() => {
    const names = new Map<string, string>()
    for (const c of data.concept_heatmap) {
      names.set(c.concept_id, c.concept_name)
    }
    return [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [data.concept_heatmap])

  const byStudent = useMemo(() => {
    const m = new Map<number, Map<string, number>>()
    for (const cell of data.concept_heatmap) {
      if (!m.has(cell.student_id)) m.set(cell.student_id, new Map())
      m.get(cell.student_id)!.set(cell.concept_id, cell.mastery_score)
    }
    return m
  }, [data.concept_heatmap])

  if (concepts.length === 0 || data.roster.length === 0) {
    return (
      <Card padding="md">
        <p className="text-foreground/70 text-sm">
          No concept mastery data yet. As students complete quizzes, a heatmap will appear here.
        </p>
      </Card>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-divider/60 bg-surface">
      <table className="text-foreground/85 w-full min-w-[480px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-divider/60 bg-background/50 border-b">
            <th className="sticky left-0 z-[1] border-divider/60 border-r bg-background/95 px-3 py-2 font-medium">
              Student
            </th>
            {concepts.map(([cid, label]) => (
              <th key={cid} className="max-w-[8rem] px-2 py-2 font-medium" title={label}>
                <span className="line-clamp-2">{label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.roster.map((student) => (
            <tr key={student.id} className="border-divider/40 border-b last:border-0">
              <td className="sticky left-0 z-[1] border-divider/60 border-r bg-surface px-3 py-2 font-medium">
                {student.display_name}
              </td>
              {concepts.map(([cid]) => {
                const score = byStudent.get(student.id)?.get(cid)
                const pct = score != null ? Math.max(0, Math.min(1, score)) * 100 : 0
                const bg =
                  score == null
                    ? 'bg-background/40'
                    : pct >= 70
                      ? 'bg-emerald-500/35'
                      : pct >= 40
                        ? 'bg-amber-500/30'
                        : 'bg-rose-500/25'
                return (
                  <td key={cid} className={`px-2 py-2 text-center tabular-nums ${bg}`} title={score?.toFixed(2)}>
                    {score != null ? Math.round(pct) : '—'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ProfessorCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) || 'students'
  const setTab = (t: Tab) => {
    const next = new URLSearchParams(searchParams)
    if (t === 'students') next.delete('tab')
    else next.set('tab', t)
    setSearchParams(next)
  }

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const course = useCourseQuery(id)
  const students = useCourseStudentsQuery(id)
  const updateCourse = useUpdateCourseMutation(id)
  const materialsQuery = useMaterialsQuery(id)
  const lessonsQuery = useLessonsQuery(id)
  const deleteMaterialMut = useDeleteMaterialMutation(id)
  const analyticsQuery = useCourseAnalyticsQuery(id)

  const materials = materialsQuery.data ?? []
  const lessons = lessonsQuery.data ?? []

  const materialNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const row of materials) {
      m.set(row.id, row.filename)
    }
    return m
  }, [materials])

  const handleUpdate = (data: UpdateCourseRequest) => {
    updateCourse.mutate(data, {
      onSuccess: () => setIsEditModalOpen(false),
    })
  }

  if (course.isLoading) {
    return <Spinner label="Loading course..." />
  }

  if (course.isError || !course.data) {
    return (
      <div className="text-left">
        <p className="text-danger mb-4 text-sm" role="alert">
          Could not load course.
        </p>
        <Link
          to="/professor"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const c = course.data

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => setTab(t)}
      className={`min-h-11 rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium transition-colors ${
        tab === t
          ? 'border-secondary bg-secondary text-surface'
          : 'border-divider text-foreground hover:bg-background'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to="/professor"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
      </nav>

      <PageHeader
        title={c.name}
        description={
          <>
            {c.description ? (
              <span className="text-foreground/70 block max-w-2xl text-sm">{c.description}</span>
            ) : null}
            <span className="text-foreground/60 mt-2 block text-xs">
              Created: {new Date(c.created_at).toLocaleDateString()}
            </span>
          </>
        }
        actions={
          <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(true)} className="w-full sm:w-auto">
            Edit course
          </Button>
        }
      />

      <div className="mb-8 w-full max-w-full">
        <JoinCodeDisplay courseId={c.id} code={c.join_code} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Course sections">
        {tabBtn('students', 'Students')}
        {tabBtn('materials', 'Materials')}
        {tabBtn('lessons', 'Lessons')}
        {tabBtn('analytics', 'Analytics')}
      </div>

      {tab === 'students' ? (
        <section>
          <h2 className="font-heading text-foreground mb-4 text-lg">
            Enrolled students ({students.data?.length ?? 0})
          </h2>

          {students.isLoading ? <Spinner label="Loading students..." /> : null}
          {students.isError ? (
            <p className="text-danger text-sm" role="alert">
              Could not load students.
            </p>
          ) : null}

          {students.data ? (
            students.data.length > 0 ? (
              <div className="bg-surface shadow-soft border-divider/60 overflow-hidden rounded-[var(--radius-lg)] border">
                <div className="overflow-x-auto p-4 sm:p-5">
                  <table className="text-foreground/85 w-full min-w-[400px] border-collapse text-sm">
                    <thead>
                      <tr className="border-divider/60 bg-background/50 text-foreground/60 border-b text-left text-xs uppercase tracking-wide">
                        <th className={`${rosterCell} font-medium`}>Student</th>
                        <th className={`${rosterCell} font-medium`}>Coins</th>
                        <th className={`${rosterCell} font-medium`}>Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.data.map((student) => (
                        <StudentRow key={student.id} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card padding="lg" className="text-center">
                <p className="text-foreground/70 text-sm">
                  No students enrolled yet. Share the join code with your students.
                </p>
              </Card>
            )
          ) : null}
        </section>
      ) : null}

      {tab === 'materials' ? (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-foreground text-lg">Materials</h2>
            <Button type="button" onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
              Upload material
            </Button>
          </div>
          {materialsQuery.isLoading ? <Spinner label="Loading materials..." /> : null}
          {materialsQuery.isError ? (
            <p className="text-danger text-sm" role="alert">
              Could not load materials.
            </p>
          ) : null}
          {materials.length === 0 && !materialsQuery.isLoading ? (
            <Card padding="lg">
              <p className="text-foreground/70 text-sm">
                No materials yet. Upload a PDF or PowerPoint file (.pdf, .ppt, .pptx).
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {materials.map((m) => (
                <li key={m.id}>
                  <Card padding="md" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{m.filename}</p>
                      <p className="text-foreground/60 text-xs uppercase">
                        {m.type} · {m.processing_status}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deleteMaterialMut.isPending}
                      onClick={() => {
                        if (confirm('Remove this material from the course?')) {
                          deleteMaterialMut.mutate(m.id)
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'lessons' ? (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-foreground text-lg">Lessons</h2>
            <Button
              type="button"
              fullWidth
              className="sm:w-auto"
              onClick={() => navigate(`/professor/course/${c.id}/lessons/new`)}
            >
              Create lesson
            </Button>
          </div>
          {lessonsQuery.isLoading ? <Spinner label="Loading lessons..." /> : null}
          {lessonsQuery.isError ? (
            <p className="text-danger text-sm" role="alert">
              Could not load lessons.
            </p>
          ) : null}
          {lessons.length === 0 && !lessonsQuery.isLoading ? (
            <Card padding="lg">
              <p className="text-foreground/70 text-sm">
                No lessons yet. Create a weekly lesson and upload a PDF or deck linked to it.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {lessons.map((lesson) => {
                const linkedName =
                  lesson.material_id != null ? materialNameById.get(lesson.material_id) : undefined
                return (
                  <li key={lesson.id}>
                    <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-heading font-medium">{lesson.title}</p>
                        <p className="text-foreground/60 text-sm">Week {lesson.week_number}</p>
                        {linkedName ? (
                          <p className="text-foreground/70 mt-1 truncate text-xs">File: {linkedName}</p>
                        ) : (
                          <p className="text-foreground/50 mt-1 text-xs">No file linked</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/professor/lesson/${lesson.id}/concepts`)}
                        >
                          Concepts
                        </Button>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'analytics' ? (
        <section>
          <h2 className="font-heading text-foreground mb-4 text-lg">Course analytics</h2>
          {analyticsQuery.isLoading ? <Spinner label="Loading analytics..." /> : null}
          {analyticsQuery.isError ? (
            <p className="text-danger text-sm" role="alert">
              Could not load analytics.
            </p>
          ) : null}
          {analyticsQuery.data ? (
            <div className="space-y-6">
              <Card padding="md">
                <p className="text-foreground/80 text-sm">
                  <span className="font-medium">{analyticsQuery.data.course_name}</span> — roster{' '}
                  {analyticsQuery.data.roster.length} students, {analyticsQuery.data.concept_heatmap.length} mastery
                  cells.
                </p>
              </Card>
              <ConceptHeatmapSection data={analyticsQuery.data} />
            </div>
          ) : null}
        </section>
      ) : null}

      <UploadMaterialModal courseId={c.id} isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />

      <SimpleModal title="Edit course" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="space-y-4">
          {updateCourse.isError ? (
            <p className="text-danger text-sm" role="alert">
              {parseApiError(updateCourse.error)}
            </p>
          ) : null}
          <CourseForm
            key={`edit-${c.id}`}
            initialValues={{
              name: c.name,
              description: c.description,
              schedule: c.schedule,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isSubmitting={updateCourse.isPending}
            submitLabel="Update course"
          />
        </div>
      </SimpleModal>
    </div>
  )
}
