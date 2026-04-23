import { apiFetch } from '@/lib/api/client'
import type { CreateLessonBody, Lesson, UpdateLessonBody } from '@/lib/api/types/lesson'

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
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`)
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export async function listLessons(token: string, courseId: number): Promise<Lesson[]> {
  return authedJson<Lesson[]>(`/courses/${courseId}/lessons`, token)
}

export async function createLesson(
  token: string,
  courseId: number,
  body: CreateLessonBody,
): Promise<Lesson> {
  return authedJson<Lesson>(`/courses/${courseId}/lessons`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function getLesson(token: string, lessonId: number): Promise<Lesson> {
  return authedJson<Lesson>(`/lessons/${lessonId}`, token)
}

export async function updateLesson(
  token: string,
  lessonId: number,
  body: UpdateLessonBody,
): Promise<Lesson> {
  return authedJson<Lesson>(`/lessons/${lessonId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
