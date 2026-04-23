import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { components } from '@/lib/api/schema'
import { fetchCurrentUser } from '@/lib/authApi'

export type UserPublic = components['schemas']['UserResponse'] & {
  avatar_config?: Record<string, unknown>
  coins?: number
  current_streak?: number
  longest_streak?: number
  streak_freezes?: number
  created_at?: string
}

type AuthState = {
  token: string | null
  user: UserPublic | null
  isHydrated: boolean
  isInitialized: boolean
  setAuth: (token: string, user: UserPublic) => void
  clearAuth: () => void
  /** Merge fields into cached ``user`` (e.g. after ``GET /scoring/me``). */
  patchUser: (partial: Partial<UserPublic>) => void
  initialize: () => Promise<void>
  refreshUser: () => Promise<void>
  _setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isHydrated: false,
      isInitialized: false,
      
      setAuth: (token, user) => set({ 
        token, 
        user, 
        isHydrated: true,
        isInitialized: true,
      }),
      
      clearAuth: () => set({ 
        token: null, 
        user: null, 
        isInitialized: true,
      }),

      patchUser: (partial) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...partial } : null,
        })),
      
      initialize: async () => {
        const { isInitialized, isHydrated } = get()
        
        // Don't re-initialize if already done
        if (isInitialized) return
        
        // Wait for hydration if not yet hydrated
        if (!isHydrated) return
        
        const { token } = get()
        
        if (!token) {
          set({ isInitialized: true })
          return
        }
        
        try {
          const user = await fetchCurrentUser(token)
          set({ user, isInitialized: true })
        } catch {
          // Token is invalid/expired, clear it
          set({ token: null, user: null, isInitialized: true })
        }
      },
      
      refreshUser: async () => {
        const { token } = get()
        if (!token) return
        
        try {
          const user = await fetchCurrentUser(token)
          set({ user })
        } catch {
          set({ token: null, user: null })
        }
      },
      
      _setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'deductible-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Called when rehydration completes
        state?._setHydrated()
      },
    },
  ),
)
