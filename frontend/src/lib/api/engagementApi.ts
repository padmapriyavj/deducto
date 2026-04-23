import { apiFetch } from '@/lib/api/client'

export type ScoringMeResponse = {
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  coins: number
}

export async function getMyScoring(token: string): Promise<ScoringMeResponse> {
  const res = await apiFetch('/scoring/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `${res.status} ${res.statusText}`)
  return JSON.parse(text) as ScoringMeResponse
}
