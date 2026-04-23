import { useQuery } from '@tanstack/react-query'

import { getMyInventory, getShopItems } from '@/lib/api/shopSpaceApi'
import { queryKeys } from '@/lib/queryKeys'
import { defaultStudySpaceLayout } from '@/lib/space/defaultLayout'
import { useAuthStore } from '@/stores/authStore'

export async function fetchShopCatalog(token: string, category?: string | null) {
  return getShopItems(token, category ?? undefined)
}

export async function fetchStudentInventory(token: string) {
  return getMyInventory(token)
}

/** Space layout is static until the backend exposes layouts. */
export async function fetchDefaultSpaceLayout() {
  return defaultStudySpaceLayout
}

export function useShopCatalogQuery(category?: string | null) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [...queryKeys.shopCatalog(category), token ?? ''] as const,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return fetchShopCatalog(token, category)
    },
    enabled: !!token,
  })
}

export function useShopInventoryQuery() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [...queryKeys.shopInventory, token ?? ''] as const,
    queryFn: () => {
      if (!token) throw new Error('Not authenticated')
      return fetchStudentInventory(token)
    },
    enabled: !!token,
  })
}

export function useDefaultSpaceLayoutQuery() {
  return useQuery({
    queryKey: queryKeys.spaceLayout,
    queryFn: fetchDefaultSpaceLayout,
    staleTime: Infinity,
  })
}
