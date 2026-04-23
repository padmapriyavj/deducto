import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { ScheduleTempoModal } from '@/components/tempo/ScheduleTempoModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import {
  approveQuestion,
  getQuiz,
  patchQuestion,
  publishQuiz,
  regenerateQuestion,
} from '@/lib/api/intelligenceApi'
import { intFromStableUuid } from '@/lib/stableUuid'
import { queryKeys } from '@/lib/queryKeys'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useLessonQuery } from '@/lib/queries/lessonQueries'
import { useAuthStore } from '@/stores/authStore'

type Choice = { key: string; text: string }

type QRow = {
  id: string | number
  text: string
  choices: Choice[]
  correct_choice: string
  approved: boolean
  difficulty?: string
  /** From DB; changes after regenerate so we can remount uncontrolled fields. */
  updated_at?: string
}

export function QuizReviewPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const qid = quizId ?? ''
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const quizQuery = useQuery({
    queryKey: queryKeys.quizDetail(qid),
    queryFn: async () => {
      if (!token) throw new Error('Auth')
      return (await getQuiz(token, qid)) as Record<string, unknown>
    },
    enabled: !!token && !!qid,
  })

  const questions: QRow[] = (quizQuery.data?.questions as QRow[] | undefined) ?? []

  const platformLessonId = useMemo(() => {
    const raw = quizQuery.data?.lesson_id
    if (raw == null) return null
    const s = String(raw).trim()
    if (/^\d+$/.test(s)) return parseInt(s, 10)
    return intFromStableUuid(s)
  }, [quizQuery.data?.lesson_id])

  const lessonQuery = useLessonQuery(
    platformLessonId != null && platformLessonId > 0 ? platformLessonId : 0,
  )

  const courseQuery = useCourseQuery(lessonQuery.data?.course_id ?? 0)

  const meta = useMemo(() => {
    if (!lessonQuery.data) return null
    return {
      courseId: lessonQuery.data.course_id,
      lessonId: String(lessonQuery.data.id),
      courseName: courseQuery.data?.name ?? 'Course',
    }
  }, [lessonQuery.data, courseQuery.data?.name])

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.quizDetail(qid) })

  const approve = useMutation({
    mutationFn: (id: string | number) => {
      if (!token) throw new Error('Auth')
      return approveQuestion(token, String(id))
    },
    onSuccess: invalidate,
  })

  const regen = useMutation({
    mutationFn: (id: string | number) => {
      if (!token) throw new Error('Auth')
      return regenerateQuestion(token, String(id), null)
    },
    onSuccess: invalidate,
  })

  const saveText = useMutation({
    mutationFn: ({ id, text }: { id: string | number; text: string }) => {
      if (!token) throw new Error('Auth')
      return patchQuestion(token, String(id), { text })
    },
    onSuccess: invalidate,
  })

  const publish = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Auth')
      return publishQuiz(token, qid)
    },
    onSuccess: () => setScheduleOpen(true),
  })

  if (quizQuery.isLoading) return <Spinner label="Loading quiz…" />
  if (quizQuery.isError || !quizQuery.data) {
    return (
      <p className="text-danger text-sm">
        Could not load quiz.{' '}
        <Link to="/professor" className="text-primary underline">
          Dashboard
        </Link>
      </p>
    )
  }

  const allApproved = questions.length > 0 && questions.every((q) => q.approved)

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link to="/professor" className="text-primary inline-flex min-h-11 items-center text-sm underline">
          &larr; Dashboard
        </Link>
      </nav>

      <PageHeader
        title="Quiz review"
        description="Approve, edit, or regenerate each question. Publish when ready."
      />

      <ul className="mb-8 space-y-4">
        {questions.map((q) => (
          <li key={`${String(q.id)}-${q.updated_at ?? ''}`}>
            <Card padding="md" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground/60 text-xs uppercase">{q.difficulty ?? 'mixed'}</span>
                <span className={q.approved ? 'text-success text-xs font-medium' : 'text-warning text-xs'}>
                  {q.approved ? 'Approved' : 'Draft'}
                </span>
              </div>
              <label className="block text-sm font-medium" htmlFor={`qt-${q.id}`}>
                Question
              </label>
              <textarea
                id={`qt-${String(q.id)}`}
                className="border-divider bg-surface w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
                rows={3}
                key={`qt-body-${String(q.id)}-${q.updated_at ?? q.text}`}
                defaultValue={q.text}
                onBlur={(e) => {
                  if (e.target.value !== q.text) saveText.mutate({ id: q.id, text: e.target.value })
                }}
              />
              <ul className="space-y-1 text-sm">
                {q.choices.map((c) => (
                  <li key={c.key} className="flex gap-2">
                    <span className="font-mono text-foreground/60">{c.key}</span>
                    <span>{c.text}</span>
                    {c.key === q.correct_choice ? (
                      <span className="text-success text-xs">(correct)</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={q.approved || approve.isPending}
                  onClick={() => approve.mutate(q.id)}
                >
                  Approve
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => regen.mutate(q.id)}>
                  Regenerate
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={!allApproved || publish.isPending} onClick={() => publish.mutate()}>
          {publish.isPending ? 'Publishing…' : 'Publish quiz'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate('/professor')}>
          Done later
        </Button>
      </div>

      {publish.isError ? (
        <p className="text-danger mt-4 text-sm" role="alert">
          {publish.error instanceof Error ? publish.error.message : 'Publish failed'}
        </p>
      ) : null}

      {meta ? (
        <ScheduleTempoModal
          courseId={meta.courseId}
          lessonId={meta.lessonId}
          courseName={meta.courseName}
          quizId={qid}
          isOpen={scheduleOpen}
          onClose={() => {
            setScheduleOpen(false)
            navigate(`/professor/course/${meta.courseId}?tab=lessons`)
          }}
        />
      ) : null}
    </div>
  )
}
