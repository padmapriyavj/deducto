import { useQuery } from '@tanstack/react-query'

import {
  getCourseAnalytics,
  getProfessorDashboard,
  getStudentDashboard,
  type CourseAnalyticsResponse,
  type ProfessorDashboardResponse,
  type StudentDashboardResponse,
} from '@/lib/api/dashboardApi'
import { getMyScoring, type ScoringMeResponse } from '@/lib/api/engagementApi'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/authStore'

export function useStudentDashboardQuery() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getStudentDashboard(token)
    },
    enabled: !!token && role === 'student',
  })
}

export function useProfessorDashboardQuery() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: queryKeys.professorDashboard,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getProfessorDashboard(token)
    },
    enabled: !!token && role === 'professor',
  })
}

export function useCourseAnalyticsQuery(courseId: number) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  return useQuery({
    queryKey: queryKeys.courseAnalytics(courseId),
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getCourseAnalytics(token, courseId)
    },
    enabled: !!token && role === 'professor' && courseId > 0,
  })
}

export type { CourseAnalyticsResponse, ProfessorDashboardResponse, StudentDashboardResponse }

export function useScoringMeQuery() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: queryKeys.scoringMe,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return getMyScoring(token)
    },
    enabled: !!token,
  })
}

export type { ScoringMeResponse }
