import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { CoinCounter } from '@/components/dashboard/CoinCounter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { Spinner } from '@/components/ui/Spinner'
import type { ShopItemResponse } from '@/lib/api/shopSpaceApi'
import { postShopPurchase } from '@/lib/api/shopSpaceApi'
import { queryKeys } from '@/lib/queryKeys'
import { useShopCatalogQuery, useShopInventoryQuery } from '@/lib/queries/shopSpaceQueries'
import { useAuthStore } from '@/stores/authStore'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

const CATEGORY_FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'finn_skin', label: 'Finn skins' },
  { id: 'backdrop', label: 'Backdrops' },
  { id: 'streak_freeze', label: 'Streak freeze' },
] as const

type FilterId = (typeof CATEGORY_FILTERS)[number]['id']

const CATEGORY_ICONS: Record<string, string> = {
  finn_skin: '🦊',
  backdrop: '🖼️',
  streak_freeze: '❄️',
}

const ITEM_ICONS: Record<string, string> = {
  'Cool Fox': '🦊',
  'Party Fox': '🎉',
  'Space Fox': '🚀',
  'Cozy Bookshelf': '📚',
  'Study Chair': '🪑',
  'Warm Desk Lamp': '💡',
  'Spinning Globe': '🌍',
  'Coffee Maker': '☕',
  'Mountain View': '🏔️',
  'City Night': '🌃',
  'Enchanted Forest': '🌲',
  'Ocean Waves': '🌊',
  'Streak Freeze': '❄️',
}

function getItemIcon(name: string, category: string): string {
  return ITEM_ICONS[name] ?? CATEGORY_ICONS[category] ?? '📦'
}

export function StudentShopPage() {
  const [filter, setFilter] = useState<FilterId>('all')
  const [confirmItem, setConfirmItem] = useState<ShopItemResponse | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const token = useAuthStore((s) => s.token)
  const patchUser = useAuthStore((s) => s.patchUser)
  const coins = useStudentEconomyStore((s) => s.coins)
  const setCoinsFromBackend = useStudentEconomyStore((s) => s.setCoinsFromBackend)
  const queryClient = useQueryClient()

  const catalog = useShopCatalogQuery(filter === 'all' ? null : filter)
  const inventory = useShopInventoryQuery()

  const ownedByShopItemId = useMemo(() => {
    const m = new Map<number, number>()
    for (const row of inventory.data ?? []) {
      m.set(row.shop_item_id, (m.get(row.shop_item_id) ?? 0) + 1)
    }
    return m
  }, [inventory.data])

  const purchaseMut = useMutation({
    mutationFn: async (item: ShopItemResponse) => {
      if (!token) throw new Error('Sign in to purchase.')
      return postShopPurchase(token, item.id)
    },
    onSuccess: (res) => {
      setCoinsFromBackend(res.new_balance)
      patchUser({ coins: res.new_balance })
      void queryClient.invalidateQueries({ queryKey: queryKeys.shopInventory })
      void queryClient.invalidateQueries({ queryKey: queryKeys.scoringMe })
      setConfirmItem(null)
      setPurchaseError(null)
    },
    onError: (e) => {
      setPurchaseError(e instanceof Error ? e.message : 'Purchase failed.')
    },
  })

  const tryPurchase = () => {
    if (!confirmItem) return
    setPurchaseError(null)
    if (coins < confirmItem.price_coins) {
      setPurchaseError('Not enough coins for this item.')
      return
    }
    purchaseMut.mutate(confirmItem)
  }

  const items = catalog.data ?? []

  return (
    <section className="text-left">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          className="mb-0 flex-1 sm:mb-0"
          title="Shop and inventory"
          description={
            <>
              Spend coins on items from the server catalog.{' '}
              <Link to="/student/space" className="text-primary font-medium underline-offset-2 hover:underline">
                Open your space
              </Link>{' '}
              to place decor.
            </>
          }
        />
        <div className="shrink-0 md:pb-1">
          <CoinCounter value={coins} />
        </div>
      </div>

      {catalog.isLoading ? <Spinner label="Loading catalog…" /> : null}
      {catalog.isError ? (
        <p className="text-danger text-sm" role="alert">
          Could not load the shop catalog.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-11 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors ${
              filter === f.id
                ? 'border-secondary bg-secondary text-surface'
                : 'border-divider text-foreground hover:bg-background'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 && catalog.isSuccess ? (
        <p className="text-foreground/70 text-sm">No items match this filter.</p>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const owned = ownedByShopItemId.get(item.id) ?? 0
          const icon = getItemIcon(item.name, item.category)
          return (
            <li key={item.id}>
              <Card padding="md" className="flex h-full flex-col">
                <div className="mb-3 flex items-center justify-center">
                  <span className="text-5xl" role="img" aria-label={item.name}>
                    {icon}
                  </span>
                </div>
                <p className="text-foreground/60 text-xs uppercase tracking-wide">{item.category.replace('_', ' ')}</p>
                <h2 className="font-heading mt-1 text-lg">{item.name}</h2>
                <p className="text-foreground/75 mt-2 flex-1 text-sm capitalize">{item.rarity} rarity</p>
                <p className="text-foreground mt-3 font-mono text-sm">
                  {item.price_coins} coins {owned > 0 ? `· owned ×${owned}` : null}
                </p>
                <Button
                  type="button"
                  className="mt-3"
                  fullWidth
                  disabled={coins < item.price_coins || purchaseMut.isPending}
                  onClick={() => {
                    setPurchaseError(null)
                    setConfirmItem(item)
                  }}
                >
                  {coins < item.price_coins ? 'Not enough coins' : 'Buy'}
                </Button>
              </Card>
            </li>
          )
        })}
      </ul>

      <div className="border-divider mt-10 border-t pt-6">
        <h2 className="font-heading mb-3 text-lg">Inventory</h2>
        {inventory.isLoading ? <Spinner label="Loading inventory…" /> : null}
        {inventory.isError ? (
          <p className="text-danger text-sm" role="alert">
            Could not load your inventory.
          </p>
        ) : null}
        {inventory.data && inventory.data.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from(ownedByShopItemId.entries()).map(([shopId, n]) => {
              const item = inventory.data?.find((r) => r.shop_item_id === shopId)
              const label = item?.name ?? `Item #${shopId}`
              const category = item?.category ?? ''
              const icon = getItemIcon(label, category)
              return (
                <li
                  key={shopId}
                  className="bg-background border-divider flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="text-3xl" role="img" aria-label={label}>
                    {icon}
                  </span>
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{label}</p>
                    <p className="text-foreground/60 text-xs capitalize">{category.replace('_', ' ')}</p>
                  </div>
                  <span className="text-foreground/70 font-mono text-sm">×{n}</span>
                </li>
              )
            })}
          </ul>
        ) : null}
        {inventory.isSuccess && (inventory.data?.length ?? 0) === 0 ? (
          <p className="text-foreground/70 text-sm">You do not own any items yet.</p>
        ) : null}
      </div>

      <p className="text-foreground/65 mt-8 text-sm">
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </p>

      <SimpleModal
        title="Confirm purchase"
        isOpen={!!confirmItem}
        onClose={() => {
          setConfirmItem(null)
          setPurchaseError(null)
        }}
      >
        {confirmItem ? (
          <>
            <div className="mb-4 flex justify-center">
              <span className="text-6xl" role="img" aria-label={confirmItem.name}>
                {getItemIcon(confirmItem.name, confirmItem.category)}
              </span>
            </div>
            <p className="text-foreground/85 text-sm">
              Buy <strong>{confirmItem.name}</strong> for{' '}
              <span className="font-mono">{confirmItem.price_coins}</span> coins?
            </p>
            {purchaseError ? (
              <p className="text-danger mt-3 text-sm" role="alert">
                {purchaseError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" variant="secondary" onClick={tryPurchase} disabled={purchaseMut.isPending}>
                {purchaseMut.isPending ? 'Purchasing…' : 'Confirm'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmItem(null)
                  setPurchaseError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : null}
      </SimpleModal>
    </section>
  )
}
