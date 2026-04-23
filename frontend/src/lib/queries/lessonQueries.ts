import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createLesson, getLesson, listLessons, updateLesson } from '@/lib/api/lessonsApi'
import type { CreateLessonBody, Lesson, UpdateLessonBody } from '@/lib/api/types/lesson'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'

export function useLessonsQuery(courseId: number) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: queryKeys.courseLessons(courseId),
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return listLessons(token, courseId)
    },
    enabled: !!token && courseId > 0,
  })
}

export function useLessonQuery(lessonId: number) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: queryKeys.lesson(lessonId),
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getLesson(token, lessonId)
    },
    enabled: !!token && lessonId > 0,
  })
}

export function useCreateLessonMutation(courseId: number) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateLessonBody) => {
      if (!token) throw new Error('Not authenticated')
      return createLesson(token, courseId, body)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courseLessons(courseId) })
    },
  })
}

export function useUpdateLessonMutation(lessonId: number, courseId: number) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateLessonBody) => {
      if (!token) throw new Error('Not authenticated')
      return updateLesson(token, lessonId, body)
    },
    onSuccess: (lesson: Lesson) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.courseLessons(courseId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lessonId) })
      void queryClient.setQueryData<Lesson>(queryKeys.lesson(lessonId), lesson)
    },
  })
}
