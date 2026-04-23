import { useMutation, useQuery } from '@tanstack/react-query'

import {
  devFireTempo,
  joinTempo,
  listJoinableTempos,
  listUpcomingTempos,
  scheduleTempo,
  type ScheduleTempoBody,
} from '@/lib/api/temposApi'
import { queryKeys } from '@/lib/queryKeys'

export function useUpcomingTemposQuery(token: string | null) {
  return useQuery({
    queryKey: queryKeys.temposUpcoming,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return listUpcomingTempos(token)
    },
    enabled: !!token,
  })
}

export function useJoinableTemposQuery(token: string | null) {
  return useQuery({
    queryKey: queryKeys.temposJoinable,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return listJoinableTempos(token)
    },
    enabled: !!token,
  })
}

export function useScheduleTempoMutation(token: string | null) {
  return useMutation({
    mutationFn: (body: ScheduleTempoBody) => {
      if (!token) throw new Error('Not authenticated')
      return scheduleTempo(token, body)
    },
  })
}

export function useJoinTempoMutation(token: string | null) {
  return useMutation({
    mutationFn: (quizId: string) => {
      if (!token) throw new Error('Not authenticated')
      return joinTempo(token, quizId)
    },
  })
}

export function useDevFireTempoMutation() {
  return useMutation({
    mutationFn: (quizId: string) => devFireTempo(quizId),
  })
}
