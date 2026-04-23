import { apiFetch, apiFetchJson } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

export type ShopItemResponse = components['schemas']['ShopItemResponse']
export type InventoryItemResponse = components['schemas']['InventoryItemResponse']
export type PurchaseResponse = components['schemas']['PurchaseResponse']

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

/** GET /api/v1/shop/items */
export async function getShopItems(
  token: string,
  category?: string | null,
): Promise<ShopItemResponse[]> {
  const q =
    category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
  const res = await apiFetch(`/shop/items${q}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<ShopItemResponse[]>
}

/** POST /api/v1/shop/purchase */
export async function postShopPurchase(
  token: string,
  itemId: number,
): Promise<PurchaseResponse> {
  return apiFetchJson<PurchaseResponse>('/shop/purchase', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ item_id: itemId }),
  })
}

/** GET /api/v1/me/inventory */
export async function getMyInventory(token: string): Promise<InventoryItemResponse[]> {
  const res = await apiFetch('/me/inventory', {
    headers: authHeaders(token),
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<InventoryItemResponse[]>
}

export type SpacePlacement = {
  slot_id: string
  inventory_item_id: number | null
}

export type PublicSpaceResponse = {
  user_id: number
  display_name: string
  placements: Array<{
    slot_id: string
    item_name: string
    item_category: string
    item_asset_url: string
  }>
}

/** POST /api/v1/me/space - Save space placements */
export async function saveMySpace(
  token: string,
  placements: SpacePlacement[],
): Promise<{ success: boolean }> {
  return apiFetchJson<{ success: boolean }>('/me/space', {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ placements }),
  })
}

/** GET /api/v1/space/:userId - Get public space (no auth required) */
export async function getPublicSpace(userId: number): Promise<PublicSpaceResponse> {
  const res = await apiFetch(`/space/${userId}`, {})
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<PublicSpaceResponse>
}
