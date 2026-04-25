import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import {
  generateLessonConcepts,
  listLessonConcepts,
  type ConceptItem,
} from '@/lib/api/intelligenceApi'
import { queryKeys } from '@/lib/queryKeys'
import { useLessonQuery, useUpdateLessonMutation } from '@/lib/queries/lessonQueries'
import { useMaterialsQuery } from '@/lib/queries/materialQueries'
import { useAuthStore } from '@/stores/authStore'

type EditableConcept = { id: string; name: string; description: string }

function toEditable(c: ConceptItem): EditableConcept {
  return { id: String(c.id), name: c.name, description: c.description ?? '' }
}

export function ConceptReviewPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lid = lessonId ?? ''
  const lessonNumericId = parseInt(lid, 10)
  const token = useAuthStore((s) => s.token)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const lessonQuery = useLessonQuery(Number.isFinite(lessonNumericId) && lessonNumericId > 0 ? lessonNumericId : 0)
  const materialsQuery = useMaterialsQuery(lessonQuery.data?.course_id ?? 0)
  const updateLesson = useUpdateLessonMutation(
    Number.isFinite(lessonNumericId) && lessonNumericId > 0 ? lessonNumericId : 0,
    lessonQuery.data?.course_id ?? 0,
  )

  const [localConcepts, setLocalConcepts] = useState<EditableConcept[] | null>(null)
  const [materialChoice, setMaterialChoice] = useState<string>('')

  useEffect(() => {
    const mid = lessonQuery.data?.material_id
    if (mid != null) {
      setMaterialChoice(String(mid))
    }
  }, [lessonQuery.data?.material_id])

  const conceptsQuery = useQuery({
    queryKey: [...queryKeys.lessonConcepts(lid), token ?? ''],
    queryFn: async () => {
      if (!token) throw new Error('Auth')
      return listLessonConcepts(token, lid)
    },
    enabled: !!token && !!lid,
    retry: false,
  })

  const merged: EditableConcept[] =
    localConcepts ??
    (conceptsQuery.data?.length
      ? conceptsQuery.data.map(toEditable)
      : [])

  const generate = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Auth')
      return generateLessonConcepts(token, lid)
    },
    onSuccess: (data) => {
      const next = data.concepts.map(toEditable)
      setLocalConcepts(next)
      void queryClient.invalidateQueries({ queryKey: queryKeys.lessonConcepts(lid) })
    },
  })

  const updateConcept = (id: string, patch: Partial<EditableConcept>) => {
    setLocalConcepts((prev) => {
      const base = prev ?? merged
      return base.map((c) => (c.id === id ? { ...c, ...patch } : c))
    })
  }

  const removeConcept = (id: string) => {
    setLocalConcepts((prev) => {
      const base = prev ?? merged
      return base.filter((c) => c.id !== id)
    })
  }

  if (lessonQuery.isLoading) {
    return <Spinner label="Loading lesson..." />
  }

  if (lessonQuery.isError || !lessonQuery.data) {
    return (
      <p className="text-danger text-sm">
        Lesson not found.{' '}
        <Link to="/professor" className="text-primary underline">
          Dashboard
        </Link>
      </p>
    )
  }

  const lesson = lessonQuery.data

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/professor/course/${lesson.course_id}?tab=lessons`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to lessons
        </Link>
      </nav>

      <PageHeader
        title="Concept review"
        description={`${lesson.title} — choose the course material this lesson uses for AI, then generate concepts.`}
        actions={
          <Button
            type="button"
            onClick={() => generate.mutate()}
            disabled={generate.isPending || !lesson.material_id}
          >
            {generate.isPending ? 'Generating…' : 'Generate concepts'}
          </Button>
        }
      />

      <Card padding="md" className="mb-6">
        <h2 className="font-heading text-foreground mb-2 text-lg">Source material</h2>
        <p className="text-foreground/70 mb-3 text-sm">
          Concept generation uses the PDF or slides linked to <strong>this lesson</strong> (not only files
          listed under the course). Pick a processed file from the course, then save.
        </p>
        {materialsQuery.isLoading ? (
          <Spinner label="Loading materials…" />
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="lesson-material" className="mb-1 block text-sm font-medium">
                Material for this lesson
              </label>
              <select
                id="lesson-material"
                className="border-divider bg-surface w-full min-h-11 rounded-[var(--radius-sm)] border px-3 text-sm"
                value={materialChoice}
                onChange={(e) => setMaterialChoice(e.target.value)}
              >
                <option value="">Select a file…</option>
                {(materialsQuery.data ?? []).map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.filename}
                    {m.processing_status !== 'ready' ? ` (${m.processing_status})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              disabled={
                !materialChoice ||
                updateLesson.isPending ||
                (lesson.material_id != null && String(lesson.material_id) === materialChoice)
              }
              onClick={() => {
                const id = parseInt(materialChoice, 10)
                if (!Number.isFinite(id)) return
                updateLesson.mutate({ material_id: id })
              }}
            >
              {updateLesson.isPending ? 'Saving…' : 'Save link'}
            </Button>
          </div>
        )}
        {lesson.material_id != null && materialsQuery.data ? (
          <p className="text-foreground/60 mt-2 text-xs">
            Linked material id: {lesson.material_id} — you can use Generate when status is ready.
          </p>
        ) : null}
        {updateLesson.isError ? (
          <p className="text-danger mt-2 text-sm" role="alert">
            {updateLesson.error instanceof Error ? updateLesson.error.message : 'Could not save'}
          </p>
        ) : null}
      </Card>

      {conceptsQuery.isLoading ? <Spinner label="Loading concepts…" /> : null}
      {conceptsQuery.isError && !localConcepts ? (
        <p className="text-foreground/70 mb-4 text-sm">
          Server concepts unavailable — try Generate after the lesson has source material, or check your
          connection.
        </p>
      ) : null}

      <ul className="mb-8 space-y-4">
        {merged.map((c) => (
          <li key={c.id}>
            <Card padding="md" className="space-y-3">
              <TextField
                id={`cname-${c.id}`}
                label="Name"
                value={c.name}
                onChange={(e) => updateConcept(c.id, { name: e.target.value })}
              />
              <div className="space-y-1">
                <label htmlFor={`cdesc-${c.id}`} className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id={`cdesc-${c.id}`}
                  rows={2}
                  value={c.description}
                  onChange={(e) => updateConcept(c.id, { description: e.target.value })}
                  className="border-divider bg-surface min-h-11 w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm"
                />
              </div>
              <Button type="button" variant="danger" size="sm" onClick={() => removeConcept(c.id)}>
                Remove
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        disabled={merged.length === 0}
        onClick={() => navigate(`/professor/lesson/${lid}/weightage`)}
      >
        Continue to weightages
      </Button>
    </div>
  )
}
