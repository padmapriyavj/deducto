import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import { generateQuiz, listLessonConcepts, type QuizGenerateBody } from '@/lib/api/intelligenceApi'
import { queryKeys } from '@/lib/queryKeys'
import { useLessonQuery } from '@/lib/queries/lessonQueries'
import { useAuthStore } from '@/stores/authStore'

function splitWeights(n: number): string[] {
  if (n <= 0) return []
  const base = Math.floor(100 / n)
  const rem = 100 - base * n
  return Array.from({ length: n }, (_, i) => String(base + (i < rem ? 1 : 0)))
}

export function WeightageFormPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lid = lessonId ?? ''
  const lessonNumericId = parseInt(lid, 10)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const lessonQuery = useLessonQuery(Number.isFinite(lessonNumericId) && lessonNumericId > 0 ? lessonNumericId : 0)

  const conceptsQuery = useQuery({
    queryKey: [...queryKeys.lessonConcepts(lid), token ?? ''],
    queryFn: async () => {
      if (!token) throw new Error('Auth')
      return listLessonConcepts(token, lid)
    },
    enabled: !!token && !!lid,
    retry: false,
  })

  const concepts = conceptsQuery.data ?? []

  const [easy, setEasy] = useState(34)
  const [medium, setMedium] = useState(33)
  const [hard, setHard] = useState(33)
  const [numQuestions, setNumQuestions] = useState(5)
  const [timePerQ, setTimePerQ] = useState(45)

  const conceptWeights = useMemo(() => splitWeights(concepts.length), [concepts.length])

  const diffOk = easy + medium + hard === 100

  const gen = useMutation({
    mutationFn: async () => {
      if (!token || !lessonQuery.data) throw new Error('Missing auth or lesson')
      const body: QuizGenerateBody = {
        course_id: lessonQuery.data.course_id,
        quiz_type: 'practice',
        config: {
          lesson_ids: [lessonQuery.data.id],
          concepts: concepts.map((c, i) => ({
            concept_id: typeof c.id === 'number' ? c.id : parseInt(String(c.id), 10),
            weight: conceptWeights[i] ?? '0',
          })),
          difficulty_weights: {
            easy: String(easy),
            medium: String(medium),
            hard: String(hard),
          },
          num_questions: numQuestions,
          time_per_question: timePerQ,
        },
      }
      return generateQuiz(token, body)
    },
    onSuccess: (data) => {
      navigate(`/professor/quiz/${data.quiz_id}/review`)
    },
  })

  if (lessonQuery.isLoading || conceptsQuery.isLoading) {
    return <Spinner label="Loading…" />
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

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/professor/lesson/${lid}/concepts`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to concepts
        </Link>
      </nav>

      <PageHeader
        title="Quiz weightages"
        description="Concept weights are split evenly (edit flow can add sliders later). Difficulty must sum to 100."
      />

      <div className="mx-auto max-w-xl space-y-6">
        <section>
          <h2 className="font-heading mb-2 text-lg">Concepts ({concepts.length})</h2>
          {conceptsQuery.isError ? (
            <p className="text-foreground/70 text-sm">
              Could not load concepts from the server. Go back and generate concepts first.
            </p>
          ) : null}
          <ul className="text-foreground/80 space-y-1 text-sm">
            {concepts.map((c, i) => (
              <li key={c.id}>
                {c.name} — <span className="font-mono">{conceptWeights[i]}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg">Difficulty</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              id="w-easy"
              label="Easy %"
              type="number"
              min={0}
              max={100}
              value={String(easy)}
              onChange={(e) => setEasy(parseInt(e.target.value, 10) || 0)}
            />
            <TextField
              id="w-med"
              label="Medium %"
              type="number"
              min={0}
              max={100}
              value={String(medium)}
              onChange={(e) => setMedium(parseInt(e.target.value, 10) || 0)}
            />
            <TextField
              id="w-hard"
              label="Hard %"
              type="number"
              min={0}
              max={100}
              value={String(hard)}
              onChange={(e) => setHard(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          {!diffOk ? <p className="text-danger text-sm">Difficulty must sum to 100.</p> : null}
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            id="num-q"
            label="Number of questions"
            type="number"
            min={1}
            max={50}
            value={String(numQuestions)}
            onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)}
          />
          <TextField
            id="time-q"
            label="Seconds per question"
            type="number"
            min={5}
            max={600}
            value={String(timePerQ)}
            onChange={(e) => setTimePerQ(parseInt(e.target.value, 10) || 5)}
          />
        </section>

        {gen.isError ? (
          <p className="text-danger text-sm" role="alert">
            {gen.error instanceof Error ? gen.error.message : 'Quiz generation failed'}
          </p>
        ) : null}

        <Button
          type="button"
          disabled={!diffOk || concepts.length === 0 || gen.isPending}
          onClick={() => gen.mutate()}
        >
          {gen.isPending ? 'Generating…' : 'Generate quiz'}
        </Button>
      </div>
    </div>
  )
}
