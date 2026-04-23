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
  return authedJson<StudentDashboardResponse>('/dashboard/student', token)
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
