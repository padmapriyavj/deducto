import { apiFetch } from '@/lib/api/client'

/** FastAPI often returns `{ "detail": "..." }` — show the message, not raw JSON. */
function errorFromResponseBody(body: string, status: number): Error {
  const raw = body.trim() || `${status}`
  if (raw.startsWith('{')) {
    try {
      const j = JSON.parse(raw) as { detail?: unknown }
      if (typeof j.detail === 'string') return new Error(j.detail)
      if (Array.isArray(j.detail) && j.detail[0] && typeof j.detail[0] === 'object' && j.detail[0] !== null) {
        const first = j.detail[0] as { msg?: string }
        if (typeof first.msg === 'string') return new Error(first.msg)
      }
    } catch {
      /* fall through */
    }
  }
  return new Error(raw)
}

async function authedJson<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  const text = await res.text()
  if (!res.ok) throw errorFromResponseBody(text, res.status)
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export type ConceptItem = {
  id: number | string
  lesson_id: number | string
  name: string
  description?: string | null
}

export async function listLessonConcepts(token: string, lessonId: string): Promise<ConceptItem[]> {
  const pathId = encodeURIComponent(lessonId.trim())
  const data = await authedJson<{ concepts: ConceptItem[] }>(`/lessons/${pathId}/concepts`, token)
  return data.concepts ?? []
}

export async function generateLessonConcepts(
  token: string,
  lessonId: string,
): Promise<{ concepts: ConceptItem[] }> {
  const pathId = encodeURIComponent(lessonId.trim())
  return authedJson(`/lessons/${pathId}/concepts/generate`, token, { method: 'POST' })
}

export type ChoiceItem = { key: string; text: string }

export type QuizGenerateBody = {
  course_id: number
  quiz_type?: 'tempo' | 'practice'
  config: {
    lesson_ids: number[]
    concepts: { concept_id: number; weight: string }[]
    difficulty_weights: { easy: string; medium: string; hard: string }
    num_questions: number
    time_per_question: number
    knowledge_base_ref?: { material_id: string | null; chunk_start: number | null; chunk_end: number | null }
  }
}

export type QuizGenerateResponse = {
  quiz_id: number
  status: string
  questions: Record<string, unknown>[]
}

export async function generateQuiz(token: string, body: QuizGenerateBody): Promise<QuizGenerateResponse> {
  return authedJson('/quizzes/generate', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getQuiz(token: string, quizId: string): Promise<Record<string, unknown>> {
  return authedJson(`/quizzes/${quizId}`, token)
}

function isLikelyQuizNotFoundError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e)
  return /\b404\b/.test(msg) || msg.includes('Quiz not found')
}

/** GET quiz with short retries on 404 (read-after-write / cache lag after publish). */
export async function getQuizWithRetry(
  token: string,
  quizId: string,
  opts?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<Record<string, unknown>> {
  const maxAttempts = opts?.maxAttempts ?? 3
  const baseDelayMs = opts?.baseDelayMs ?? 200
  let last: unknown
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await getQuiz(token, quizId)
    } catch (e) {
      last = e
      if (!isLikelyQuizNotFoundError(e) || i === maxAttempts - 1) {
        throw e
      }
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)))
    }
  }
  throw last
}

export async function approveQuestion(token: string, questionId: string): Promise<Record<string, unknown>> {
  return authedJson(`/questions/${questionId}/approve`, token, { method: 'POST' })
}

export async function regenerateQuestion(
  token: string,
  questionId: string,
  body?: Record<string, unknown> | null,
): Promise<Record<string, unknown>> {
  return authedJson(`/questions/${questionId}/regenerate`, token, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  })
}

export async function patchQuestion(
  token: string,
  questionId: string,
  body: { text?: string; choices?: ChoiceItem[]; correct_choice?: string },
): Promise<Record<string, unknown>> {
  return authedJson(`/questions/${questionId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function publishQuiz(token: string, quizId: string): Promise<{ quiz_id: string; status: string }> {
  return authedJson(`/quizzes/${quizId}/publish`, token, { method: 'POST' })
}

export type StudentPracticeStartResponse = {
  quiz_id: number
  attempt_id: number
}

export async function startStudentPracticeQuiz(
  token: string,
  quizId: string | number,
): Promise<StudentPracticeStartResponse> {
  return authedJson(`/quizzes/${String(quizId)}/student-practice/start`, token, { method: 'POST' })
}

export type ScoreAnswerInput = {
  question_id: string
  selected_choice: string
  time_taken_ms?: number
}

export type ScoreAttemptResult = {
  quiz_id: string
  attempt_id: string
  score_pct: string | number
  correct_count: number
  total_questions: number
  base_coins: number
  payout_coins?: number | null
  betcha_effective_factor?: number | null
  betcha_applied: boolean
  current_streak?: number | null
  streak_milestone_bonus_coins?: number
  streak_already_active_today?: boolean
}

export async function scoreQuizAttempt(
  token: string,
  attemptId: string,
  answers: ScoreAnswerInput[],
): Promise<ScoreAttemptResult> {
  return authedJson<ScoreAttemptResult>(`/quiz-attempts/${attemptId}/score`, token, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })
}

export type PlaceBetchaBody = {
  attempt_id: number
  multiplier: '1x' | '3x' | '5x'
}

export type PlaceBetchaResponse = {
  attempt_id: number
  multiplier: string
  coins_balance_after: number
}

export async function placeBetcha(
  token: string,
  quizId: string,
  body: PlaceBetchaBody,
): Promise<PlaceBetchaResponse> {
  return authedJson<PlaceBetchaResponse>(`/quizzes/${quizId}/betcha`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export type FinalizeBetchaBody = {
  score_percent: string | number
  base_coins: number
}

export type FinalizeBetchaResponse = {
  attempt_id: string
  betcha_applied: boolean
  payout_coins?: number | null
  effective_factor?: number | null
}

/** Use when not using ``POST /quiz-attempts/{id}/score`` (that path already resolves Betcha). */
export async function finalizeBetcha(
  token: string,
  attemptId: string,
  body: FinalizeBetchaBody,
): Promise<FinalizeBetchaResponse> {
  return authedJson<FinalizeBetchaResponse>(`/quiz-attempts/${attemptId}/finalize`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
