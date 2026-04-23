import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/FormField'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import {
  generateQuiz,
  listLessonConcepts,
  startStudentPracticeQuiz,
  type QuizGenerateBody,
} from '@/lib/api/intelligenceApi'
import type { BetchaMultiplier, QuizRunLocationState, QuizRunMode } from '@/lib/mocks/quizRun'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useCreateDuelAttemptMutation, useCreateDuelMutation, useJoinDuelMutation } from '@/lib/queries/duelQueries'
import { useLessonsQuery } from '@/lib/queries/lessonQueries'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'

function splitWeights(n: number): string[] {
  if (n <= 0) return []
  const base = Math.floor(100 / n)
  const rem = 100 - base * n
  return Array.from({ length: n }, (_, i) => String(base + (i < rem ? 1 : 0)))
}

export function PracticeLobbyPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const courseNumericId = parseInt(courseIdParam ?? '', 10)
  const courseQuery = useCourseQuery(Number.isFinite(courseNumericId) ? courseNumericId : 0)
  const lessonsQuery = useLessonsQuery(Number.isFinite(courseNumericId) ? courseNumericId : 0)
  const courseName =
    (location.state as { courseName?: string } | null)?.courseName ??
    courseQuery.data?.name ??
    (courseQuery.isLoading ? 'Loading…' : 'Practice')

  const sortedLessons = useMemo(() => {
    const rows = lessonsQuery.data ?? []
    return [...rows].sort((a, b) => {
      if (a.week_number !== b.week_number) return a.week_number - b.week_number
      return a.title.localeCompare(b.title)
    })
  }, [lessonsQuery.data])

  const [selectedLessonId, setSelectedLessonId] = useState<number | ''>('')
  const lessonIdStr = selectedLessonId === '' ? '' : String(selectedLessonId)

  const conceptsQuery = useQuery({
    queryKey: [...queryKeys.lessonConcepts(lessonIdStr), token ?? ''],
    queryFn: async () => {
      if (!token) throw new Error('Auth')
      return listLessonConcepts(token, lessonIdStr)
    },
    enabled: !!token && !!lessonIdStr,
    retry: false,
  })

  const concepts = conceptsQuery.data ?? []
  const conceptWeights = useMemo(() => splitWeights(concepts.length), [concepts.length])

  const [easy, setEasy] = useState(34)
  const [medium, setMedium] = useState(33)
  const [hard, setHard] = useState(33)
  const [numQuestions, setNumQuestions] = useState(5)
  const [timePerQ, setTimePerQ] = useState(45)
  const diffOk = easy + medium + hard === 100

  const [mode, setMode] = useState<QuizRunMode>('solo')
  const [betcha, setBetcha] = useState<BetchaMultiplier>(1)
  const [publishedQuizId, setPublishedQuizId] = useState('')
  const [duelRoomToJoin, setDuelRoomToJoin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const createDuel = useCreateDuelMutation(token)
  const joinDuel = useJoinDuelMutation(token)
  const duelAttempt = useCreateDuelAttemptMutation(token)

  const startSoloPractice = async () => {
    if (selectedLessonId === '') {
      setErr('Choose a lesson to practice.')
      return
    }
    if (!diffOk) {
      setErr('Difficulty percentages must sum to 100.')
      return
    }
    if (concepts.length === 0) {
      setErr('This lesson has no concepts yet — add concepts before generating a quiz.')
      return
    }
    if (!token) {
      setErr('Sign in to start practice.')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      const body: QuizGenerateBody = {
        course_id: courseNumericId,
        quiz_type: 'practice',
        config: {
          lesson_ids: [selectedLessonId],
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
      const gen = await generateQuiz(token, body)
      const started = await startStudentPracticeQuiz(token, gen.quiz_id)
      const roomId = `practice-${String(started.quiz_id)}`
      const state: QuizRunLocationState = {
        mode: 'solo',
        betcha,
        lessonId: lessonIdStr,
        courseName,
        api: { quizId: String(started.quiz_id), attemptId: String(started.attempt_id) },
      }
      navigate(`/student/quiz/${encodeURIComponent(roomId)}`, { state })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not generate or start practice quiz.')
    } finally {
      setBusy(false)
    }
  }

  const startDuelHost = async () => {
    const qid = publishedQuizId.trim()
    if (!qid) {
      setErr('Enter a published quiz ID (numeric) to host a duel.')
      return
    }
    if (!/^\d+$/.test(qid)) {
      setErr(
        'Quiz ID must be a whole number (e.g. 42). It is the quizzes.id in the database — not a lesson id. Use Solo mode first to generate a published quiz, then copy the id from the browser Network response or ask your professor.',
      )
      return
    }
    if (!token) {
      setErr('Sign in to host a duel.')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      const created = await createDuel.mutateAsync({ quiz_id: qid })
      const roomId = created.room_id
      const att = await duelAttempt.mutateAsync(roomId)
      const state: QuizRunLocationState = {
        mode: 'duel',
        betcha,
        lessonId: courseIdParam ?? 'unknown',
        courseName,
        api: { quizId: String(att.quiz_id), attemptId: String(att.attempt_id) },
        realtime: {
          quizId: String(created.quiz_id),
          mode: 'duel',
          attemptId: String(att.attempt_id),
        },
      }
      navigate(`/student/quiz/${encodeURIComponent(roomId)}`, { state })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create duel.')
    } finally {
      setBusy(false)
    }
  }

  const joinDuelRoom = async () => {
    const rid = duelRoomToJoin.trim()
    if (!rid) {
      setErr('Enter the duel room id your host shared.')
      return
    }
    if (!token) {
      setErr('Sign in to join a duel.')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      await joinDuel.mutateAsync(rid)
      const att = await duelAttempt.mutateAsync(rid)
      const state: QuizRunLocationState = {
        mode: 'duel',
        betcha,
        lessonId: courseIdParam ?? 'unknown',
        courseName,
        api: { quizId: String(att.quiz_id), attemptId: String(att.attempt_id) },
        realtime: {
          quizId: String(att.quiz_id),
          mode: 'duel',
          attemptId: String(att.attempt_id),
        },
      }
      navigate(`/student/quiz/${encodeURIComponent(rid)}`, { state })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not join duel.')
    } finally {
      setBusy(false)
    }
  }

  const startQuiz = () => {
    if (mode === 'solo') {
      void startSoloPractice()
      return
    }
    void startDuelHost()
  }

  const lessonsLoading = lessonsQuery.isLoading || courseQuery.isLoading

  return (
    <section className="text-left">
      <nav className="text-foreground/70 mb-4 text-sm">
        <Link to="/student/practice" className="text-primary inline-flex min-h-11 items-center hover:underline">
          Practice
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Lobby</span>
      </nav>
      <PageHeader title="Practice lobby" description={courseName} />

      <Card padding="md" className="mb-6">
        <fieldset>
          <legend className="text-foreground px-1 text-sm font-semibold">Mode</legend>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'solo'} onChange={() => setMode('solo')} />
              Solo practice (server quiz)
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'duel'} onChange={() => setMode('duel')} />
              Duel (live API + Socket.IO)
            </label>
          </div>
          {mode === 'solo' ? (
            <div className="mt-4 space-y-4">
              {lessonsLoading ? (
                <Spinner label="Loading course…" />
              ) : lessonsQuery.isError ? (
                <p className="text-foreground/70 text-sm">Could not load lessons for this course.</p>
              ) : (
                <label className="block text-sm font-medium">
                  <span className="text-foreground/80 mb-1 block">Lesson</span>
                  <select
                    className="border-border bg-background text-foreground focus:ring-primary w-full max-w-md rounded-md border px-3 py-2 text-sm outline-none focus:ring-2"
                    value={selectedLessonId === '' ? '' : String(selectedLessonId)}
                    onChange={(e) => {
                      const v = e.target.value
                      setSelectedLessonId(v === '' ? '' : parseInt(v, 10))
                    }}
                  >
                    <option value="">Select a lesson…</option>
                    {sortedLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        Week {l.week_number}: {l.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {lessonIdStr ? (
                <>
                  {conceptsQuery.isLoading ? (
                    <Spinner label="Loading concepts…" />
                  ) : conceptsQuery.isError ? (
                    <p className="text-foreground/70 text-sm">Could not load concepts for this lesson.</p>
                  ) : (
                    <div>
                      <h3 className="text-foreground mb-1 text-sm font-semibold">
                        Concepts ({concepts.length})
                      </h3>
                      <ul className="text-foreground/80 max-h-40 space-y-1 overflow-y-auto text-sm">
                        {concepts.map((c, i) => (
                          <li key={c.id}>
                            {c.name} — <span className="font-mono">{conceptWeights[i]}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="text-foreground mb-2 text-sm font-semibold">Difficulty</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <TextField
                        id="p-easy"
                        label="Easy %"
                        type="number"
                        min={0}
                        max={100}
                        value={String(easy)}
                        onChange={(e) => setEasy(parseInt(e.target.value, 10) || 0)}
                      />
                      <TextField
                        id="p-med"
                        label="Medium %"
                        type="number"
                        min={0}
                        max={100}
                        value={String(medium)}
                        onChange={(e) => setMedium(parseInt(e.target.value, 10) || 0)}
                      />
                      <TextField
                        id="p-hard"
                        label="Hard %"
                        type="number"
                        min={0}
                        max={100}
                        value={String(hard)}
                        onChange={(e) => setHard(parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    {!diffOk ? <p className="text-danger mt-1 text-sm">Difficulty must sum to 100.</p> : null}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField
                      id="p-num-q"
                      label="Number of questions"
                      type="number"
                      min={1}
                      max={50}
                      value={String(numQuestions)}
                      onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 1)}
                    />
                    <TextField
                      id="p-time-q"
                      label="Seconds per question"
                      type="number"
                      min={5}
                      max={600}
                      value={String(timePerQ)}
                      onChange={(e) => setTimePerQ(parseInt(e.target.value, 10) || 5)}
                    />
                  </div>
                </>
              ) : null}

              <p className="text-foreground/65 text-xs">
                Weights follow the professor flow (even split). Generation uses your enrollment for this course.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <TextField
                id="duel-quiz-id"
                label="Published quiz ID (number)"
                value={publishedQuizId}
                onChange={(e) => setPublishedQuizId(e.target.value)}
                placeholder="e.g. 42"
              />
              <p className="text-foreground/70 text-xs">
                Must be <strong className="text-foreground">published</strong> with at least one question. If you see{' '}
                <span className="font-mono">Not Found</span>, that id does not exist or is not published for this
                backend.
              </p>
              <TextField
                id="duel-join-room"
                label="Join existing duel (room id from host)"
                value={duelRoomToJoin}
                onChange={(e) => setDuelRoomToJoin(e.target.value)}
                placeholder="e.g. abc123 — from host’s quiz URL"
              />
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void joinDuelRoom()}>
                Join duel room
              </Button>
            </div>
          )}
        </fieldset>
      </Card>

      {err ? (
        <p className="text-danger mb-4 text-sm" role="alert">
          {err}
        </p>
      ) : null}

      {/* Betcha - Full width with emphasis */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 rounded-[var(--radius-lg)] border-2 p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🎰</span>
            <div>
              <h3 className="font-heading text-foreground text-lg font-bold">Place Your Betcha</h3>
              <p className="text-foreground/70 text-sm">How confident are you? Higher risk = higher reward!</p>
            </div>
          </div>
          <fieldset aria-disabled={false}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: 1 as const, label: '1× Safe', hint: 'Proportional payout', emoji: '🛡️' },
                { value: 3 as const, label: '3× Bold', hint: 'Need 70%+ for full multiplier', emoji: '⚡' },
                { value: 5 as const, label: '5× All-in', hint: 'Need 90%+ for full multiplier', emoji: '🔥' },
              ].map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer flex-col items-center rounded-[var(--radius-md)] border-2 p-4 text-center transition-all ${
                    betcha === o.value
                      ? 'border-primary bg-primary/15 shadow-md ring-2 ring-primary/30'
                      : 'border-divider bg-surface hover:border-primary/50 hover:shadow-sm'
                  }`}
                >
                  <span className="mb-2 text-3xl">{o.emoji}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="betcha"
                      value={o.value}
                      checked={betcha === o.value}
                      onChange={() => setBetcha(o.value)}
                      className="sr-only"
                    />
                    <span className="font-heading text-foreground text-lg font-bold">{o.label}</span>
                  </span>
                  <span className="text-foreground/65 mt-1 text-xs">{o.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <Button
        type="button"
        onClick={startQuiz}
        disabled={
          busy ||
          (mode === 'solo' &&
            (selectedLessonId === '' || !diffOk || concepts.length === 0 || conceptsQuery.isLoading))
        }
      >
        {busy ? 'Working…' : mode === 'solo' ? 'Generate & start quiz' : 'Host duel & start'}
      </Button>
    </section>
  )
}
