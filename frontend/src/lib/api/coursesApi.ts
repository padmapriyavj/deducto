import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type {
  Course,
  CourseJoinInfo,
  CreateCourseRequest,
  EnrollRequest,
  Student,
  UpdateCourseRequest,
} from '@/lib/api/types/course'

async function authedFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

/** Public: course name for join page (no JWT). */
export async function getCourseJoinInfo(courseId: number): Promise<CourseJoinInfo> {
  return apiFetchJson<CourseJoinInfo>(`/courses/${courseId}/join-info`)
}

export async function getCourses(token: string): Promise<Course[]> {
  return authedFetch<Course[]>('/courses', token)
}

export async function getCourse(token: string, courseId: number): Promise<Course> {
  return authedFetch<Course>(`/courses/${courseId}`, token)
}

export async function createCourse(
  token: string,
  data: CreateCourseRequest,
): Promise<Course> {
  return authedFetch<Course>('/courses', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCourse(
  token: string,
  courseId: number,
  data: UpdateCourseRequest,
): Promise<Course> {
  return authedFetch<Course>(`/courses/${courseId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function enrollInCourse(
  token: string,
  courseId: number,
  data: EnrollRequest,
): Promise<Course> {
  return authedFetch<Course>(`/courses/${courseId}/enroll`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getCourseStudents(
  token: string,
  courseId: number,
): Promise<Student[]> {
  return authedFetch<Student[]>(`/courses/${courseId}/students`, token)
}

export type LeaderboardEntry = {
  id: number
  email: string
  display_name: string
  avatar_config: Record<string, unknown>
  course_coins: number
  tests_taken: number
}

export async function getCourseLeaderboard(
  token: string,
  courseId: number,
): Promise<LeaderboardEntry[]> {
  return authedFetch<LeaderboardEntry[]>(`/courses/${courseId}/leaderboard`, token)
}
