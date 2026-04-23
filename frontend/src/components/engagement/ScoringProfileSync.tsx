import { useEffect } from 'react'

import { useScoringMeQuery } from '@/lib/queries/dashboardQueries'
import { useAuthStore } from '@/stores/authStore'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

/** Keeps coin balance + streak fields in sync with ``GET /api/v1/scoring/me``. */
export function ScoringProfileSync() {
  const token = useAuthStore((s) => s.token)
  const patchUser = useAuthStore((s) => s.patchUser)
  const setCoinsFromBackend = useStudentEconomyStore((s) => s.setCoinsFromBackend)
  const { data, isSuccess } = useScoringMeQuery()

  useEffect(() => {
    if (!token || !isSuccess || !data) return
    setCoinsFromBackend(data.coins)
    patchUser({
      coins: data.coins,
      current_streak: data.current_streak,
      longest_streak: data.longest_streak,
    })
  }, [token, isSuccess, data, setCoinsFromBackend, patchUser])

  return null
}
