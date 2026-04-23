import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCourse,
  enrollInCourse,
  getCourse,
  getCourseJoinInfo,
  getCourseLeaderboard,
  getCourses,
  getCourseStudents,
  updateCourse,
} from '@/lib/api/coursesApi'
import type {
  Course,
  CreateCourseRequest,
  EnrollRequest,
  UpdateCourseRequest,
} from '@/lib/api/types/course'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'

export function useCourseJoinInfoQuery(courseId: number) {
  return useQuery({
    queryKey: queryKeys.courseJoinInfo(courseId),
    queryFn: () => getCourseJoinInfo(courseId),
    enabled: courseId > 0 && !Number.isNaN(courseId),
  })
}

export function useCoursesQuery() {
  const token = useAuthStore((s) => s.token)
  
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getCourses(token)
    },
    enabled: !!token,
  })
}

export function useCourseQuery(courseId: number) {
  const token = useAuthStore((s) => s.token)
  
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getCourse(token, courseId)
    },
    enabled: !!token && courseId > 0,
  })
}

export function useCourseStudentsQuery(courseId: number) {
  const token = useAuthStore((s) => s.token)
  
  return useQuery({
    queryKey: queryKeys.courseStudents(courseId),
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getCourseStudents(token, courseId)
    },
    enabled: !!token && courseId > 0,
  })
}

export function useCourseLeaderboardQuery(courseId: number) {
  const token = useAuthStore((s) => s.token)
  
  return useQuery({
    queryKey: [...queryKeys.courseStudents(courseId), 'leaderboard'],
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getCourseLeaderboard(token, courseId)
    },
    enabled: !!token && courseId > 0,
  })
}

export function useCreateCourseMutation() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCourseRequest) => {
      if (!token) throw new Error('Not authenticated')
      return createCourse(token, data)
    },
    onSuccess: (newCourse) => {
      queryClient.setQueryData<Course[]>(queryKeys.courses, (old) =>
        old ? [...old, newCourse] : [newCourse],
      )
    },
  })
}

export function useUpdateCourseMutation(courseId: number) {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdateCourseRequest) => {
      if (!token) throw new Error('Not authenticated')
      return updateCourse(token, courseId, data)
    },
    onSuccess: (updatedCourse) => {
      queryClient.setQueryData<Course>(queryKeys.course(courseId), updatedCourse)
      queryClient.setQueryData<Course[]>(queryKeys.courses, (old) =>
        old?.map((c) => (c.id === courseId ? updatedCourse : c)),
      )
    },
  })
}

export function useEnrollMutation() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number; data: EnrollRequest }) => {
      if (!token) throw new Error('Not authenticated')
      return enrollInCourse(token, courseId, data)
    },
    onSuccess: (enrolledCourse) => {
      queryClient.setQueryData<Course[]>(queryKeys.courses, (old) =>
        old ? [...old, enrolledCourse] : [enrolledCourse],
      )
    },
  })
}
