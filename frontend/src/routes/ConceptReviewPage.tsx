import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
import { useLessonQuery } from '@/lib/queries/lessonQueries'
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

  const [localConcepts, setLocalConcepts] = useState<EditableConcept[] | null>(null)

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
        description={`${lesson.title} — generate or edit concepts, then set weightages for quiz generation.`}
        actions={
          <Button type="button" onClick={() => generate.mutate()} disabled={generate.isPending}>
            {generate.isPending ? 'Generating…' : 'Generate concepts'}
          </Button>
        }
      />

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
