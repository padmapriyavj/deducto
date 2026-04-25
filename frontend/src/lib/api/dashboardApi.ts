import { apiFetch } from '@/lib/api/client'

async function authedJson<T>(path: string, token: string): Promise<T> {
  const res = await apiFetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`)
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export type StudentDashboardUser = {
  id: number
  display_name: string
  coins: number
  current_streak: number
  avatar_config: Record<string, unknown>
}

export type StudentDashboardCourse = {
  id: number
  name: string
  /** Spring enrolled-course summaries may include this; optional for stats-only rows. */
  description?: string | null
  tests_taken: number
  coins_earned: number
  top_weak_concept: string | null
  active_tempo: Record<string, unknown> | null
  upcoming_events: { id: string; title: string; date: string }[]
  completed_events: {
    id: string
    title: string
    attempted: number
    correct: number
    wrong: number
    concepts: string[]
    coins: number
    betcha: string | null
  }[]
}

export type StudentDashboardResponse = {
  user: StudentDashboardUser
  courses: StudentDashboardCourse[]
}

/** Spring Boot returns enrolled_courses + top-level coins/streak; FastAPI returns user + courses. */
function emptyStudentDashboard(): StudentDashboardResponse {
  return {
    user: { id: 0, display_name: '', coins: 0, current_streak: 0, avatar_config: {} },
    courses: [],
  }
}

function normalizeStudentDashboardPayload(raw: unknown): StudentDashboardResponse {
  if (!raw || typeof raw !== 'object') {
    return emptyStudentDashboard()
  }
  const o = raw as Record<string, unknown>
  if (Array.isArray(o.courses) && o.user && typeof o.user === 'object') {
    return raw as StudentDashboardResponse
  }
  const enrolled = o.enrolled_courses
  if (Array.isArray(enrolled)) {
    const temposRaw = o.upcoming_tempos
    const tempos = Array.isArray(temposRaw) ? temposRaw : []
    const courses: StudentDashboardCourse[] = enrolled.map((row) => {
      const c = row as Record<string, unknown>
      const desc = c.description
      const id = Number(c.id)
      const upcomingForCourse = tempos
        .filter((t) => {
          if (!t || typeof t !== 'object') return false
          const u = t as Record<string, unknown>
          return Number(u.course_id) === id
        })
        .map((t) => {
          const u = t as Record<string, unknown>
          return {
            id: String(u.id ?? ''),
            title: 'Scheduled tempo',
            date: u.scheduled_at != null ? String(u.scheduled_at) : '',
          }
        })
      return {
        id,
        name: String(c.name ?? 'Course'),
        description: typeof desc === 'string' && desc.trim() ? desc : null,
        tests_taken: typeof c.tests_taken === 'number' ? c.tests_taken : 0,
        coins_earned: typeof c.coins_earned === 'number' ? c.coins_earned : 0,
        top_weak_concept: null,
        active_tempo: null,
        upcoming_events: upcomingForCourse,
        completed_events: [],
      }
    })
    return {
      user: {
        id: 0,
        display_name: '',
        coins: typeof o.coins === 'number' ? o.coins : 0,
        current_streak: typeof o.current_streak === 'number' ? o.current_streak : 0,
        avatar_config: {},
      },
      courses,
    }
  }
  if (Array.isArray(o.courses)) {
    return {
      user: emptyStudentDashboard().user,
      courses: o.courses as StudentDashboardCourse[],
    }
  }
  return emptyStudentDashboard()
}

export type ProfessorDashboardUser = {
  id: number
  display_name: string
  email: string
}

export type ProfessorCourseOverview = {
  id: number
  name: string
  enrollment_count: number
  tempos_scheduled: number
  class_avg_score: number | null
}

export type ProfessorDashboardResponse = {
  user: ProfessorDashboardUser
  courses: ProfessorCourseOverview[]
}

export type StudentAnalytics = {
  id: number
  display_name: string
  email: string
  avatar_config: Record<string, unknown>
  coins: number
  current_streak: number
  quizzes_taken: number
  avg_score: number | null
  last_activity: string | null
}

export type ConceptMasteryCell = {
  student_id: number
  concept_id: string
  concept_name: string
  mastery_score: number
}

export type CourseAnalyticsResponse = {
  course_id: number
  course_name: string
  roster: StudentAnalytics[]
  concept_heatmap: ConceptMasteryCell[]
}

export async function getStudentDashboard(token: string): Promise<StudentDashboardResponse> {
  const raw = await authedJson<unknown>('/dashboard/student', token)
  return normalizeStudentDashboardPayload(raw)
}

export async function getProfessorDashboard(token: string): Promise<ProfessorDashboardResponse> {
  return authedJson<ProfessorDashboardResponse>('/dashboard/professor', token)
}

export async function getCourseAnalytics(
  token: string,
  courseId: number,
): Promise<CourseAnalyticsResponse> {
  return authedJson<CourseAnalyticsResponse>(
    `/dashboard/professor/courses/${courseId}/analytics`,
    token,
  )
}
