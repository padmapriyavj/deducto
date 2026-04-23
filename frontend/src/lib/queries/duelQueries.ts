import { useMutation } from '@tanstack/react-query'

import {
  createDuel,
  createDuelAttempt,
  joinDuel,
  markDuelActive,
  settleDuel,
  type DuelCreateBody,
  type DuelSettleBody,
} from '@/lib/api/duelsApi'

export function useCreateDuelMutation(token: string | null) {
  return useMutation({
    mutationFn: (body: DuelCreateBody) => {
      if (!token) throw new Error('Not authenticated')
      return createDuel(token, body)
    },
  })
}

export function useJoinDuelMutation(token: string | null) {
  return useMutation({
    mutationFn: (roomId: string) => {
      if (!token) throw new Error('Not authenticated')
      return joinDuel(token, roomId)
    },
  })
}

export function useCreateDuelAttemptMutation(token: string | null) {
  return useMutation({
    mutationFn: (roomId: string) => {
      if (!token) throw new Error('Not authenticated')
      return createDuelAttempt(token, roomId)
    },
  })
}

export function useMarkDuelActiveMutation() {
  return useMutation({
    mutationFn: (roomId: string) => markDuelActive(roomId),
  })
}

export function useSettleDuelMutation(token: string | null) {
  return useMutation({
    mutationFn: ({ roomId, body }: { roomId: string; body: DuelSettleBody }) => {
      if (!token) throw new Error('Not authenticated')
      return settleDuel(token, roomId, body)
    },
  })
}
