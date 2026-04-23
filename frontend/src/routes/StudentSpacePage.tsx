import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { CoinCounter } from '@/components/dashboard/CoinCounter'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { SimpleModal } from '@/components/ui/SimpleModal'
import type { InventoryItemResponse } from '@/lib/api/shopSpaceApi'
import { saveMySpace, type SpacePlacement } from '@/lib/api/shopSpaceApi'
import type { SpaceSlot } from '@/lib/space/defaultLayout'
import { useDefaultSpaceLayoutQuery, useShopInventoryQuery } from '@/lib/queries/shopSpaceQueries'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'
import { useAuthStore } from '@/stores/authStore'

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

function getItemIcon(name: string): string {
  return ITEM_ICONS[name] ?? '📦'
}

function DraggableItem({ 
  id, 
  item, 
  slotId 
}: { 
  id: string
  item: InventoryItemResponse
  slotId: string 
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: 'item', item, fromSlotId: slotId },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      <span className="text-3xl">{getItemIcon(item.name)}</span>
    </div>
  )
}

function DroppableSlot({
  slot,
  item,
  onSlotClick,
  className,
  children,
}: {
  slot: SpaceSlot
  item: InventoryItemResponse | null
  onSlotClick: () => void
  className?: string
  children?: React.ReactNode
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slot.id,
    data: { type: 'slot', slotId: slot.id },
  })

  return (
    <motion.div
      ref={setNodeRef}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSlotClick}
      className={`cursor-pointer transition-all ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''} ${className}`}
    >
      {children ?? (
        <>
          <div className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all ${
            item 
              ? 'border-secondary/50 bg-surface/90 shadow-lg' 
              : 'border-dashed border-amber-600/40 bg-amber-100/30 hover:bg-amber-100/50'
          }`}>
            {item ? (
              <DraggableItem id={`item-${slot.id}`} item={item} slotId={slot.id} />
            ) : (
              <span className="text-2xl font-light text-amber-700/50">+</span>
            )}
          </div>
          <p className="mt-1 text-center text-xs font-medium text-amber-900/70">
            {item?.name || slot.label}
          </p>
        </>
      )}
    </motion.div>
  )
}

export function StudentSpacePage() {
  const [activeSlot, setActiveSlot] = useState<SpaceSlot | null>(null)
  const [finnMood, setFinnMood] = useState<FinnMood>('neutral')
  const [draggedItem, setDraggedItem] = useState<InventoryItemResponse | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'saving' | 'copied'>('idle')

  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)

  const coins = useStudentEconomyStore((s) => s.coins)
  const slotPlacements = useStudentEconomyStore((s) => s.slotPlacements)
  const placeInSlot = useStudentEconomyStore((s) => s.placeInSlot)
  const clearSlot = useStudentEconomyStore((s) => s.clearSlot)
  const clearAllSlots = useStudentEconomyStore((s) => s.clearAllSlots)
  const moveItemBetweenSlots = useStudentEconomyStore((s) => s.moveItemBetweenSlots)

  const layout = useDefaultSpaceLayoutQuery()
  const inventory = useShopInventoryQuery()

  const saveMutation = useMutation({
    mutationFn: async (placements: SpacePlacement[]) => {
      if (!token) throw new Error('Not authenticated')
      return saveMySpace(token, placements)
    },
  })

  const handleShare = async () => {
    if (!token || !user) return

    setShareStatus('saving')

    const placements: SpacePlacement[] = Object.entries(slotPlacements).map(([slot_id, invId]) => ({
      slot_id,
      inventory_item_id: invId ? parseInt(invId, 10) : null,
    }))

    try {
      await saveMutation.mutateAsync(placements)
      const shareUrl = `${window.location.origin}/space/${user.id}`
      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('copied')
      setFinnMood('celebrating')
      setTimeout(() => setShareStatus('idle'), 2500)
    } catch {
      setShareStatus('idle')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const placedInventoryIds = useMemo(() => {
    return new Set(
      Object.values(slotPlacements).filter((v): v is string => typeof v === 'string' && v.length > 0),
    )
  }, [slotPlacements])

  const hasAnyPlacements = placedInventoryIds.size > 0

  const rowById = useMemo(() => {
    const m = new Map<string, InventoryItemResponse>()
    for (const r of inventory.data ?? []) {
      m.set(String(r.id), r)
    }
    return m
  }, [inventory.data])

  const resolveItem = (id: string | null) => (id ? rowById.get(id) ?? null : null)

  const getSlotItem = (slotId: string) => {
    const placedId = slotPlacements[slotId] ?? null
    return resolveItem(placedId)
  }

  const place = (inventoryRowId: string) => {
    if (!activeSlot) return
    placeInSlot(activeSlot.id, inventoryRowId)
    setFinnMood('celebrating')
    setActiveSlot(null)
  }

  useEffect(() => {
    if (finnMood !== 'celebrating') return
    const t = setTimeout(() => setFinnMood('neutral'), 1500)
    return () => clearTimeout(t)
  }, [finnMood])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    if (active.data.current?.type === 'item') {
      setDraggedItem(active.data.current.item)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedItem(null)

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    if (activeData?.type === 'item' && overData?.type === 'slot') {
      const fromSlotId = activeData.fromSlotId
      const toSlotId = overData.slotId
      if (fromSlotId !== toSlotId) {
        moveItemBetweenSlots(fromSlotId, toSlotId)
        setFinnMood('celebrating')
      }
    }
  }

  const wallLeftItem = getSlotItem('wall-left')
  const wallRightItem = getSlotItem('wall-right')
  const deskItem = getSlotItem('desk-top')
  const floorItem = getSlotItem('floor-center')
  const nookItem = getSlotItem('corner-nook')

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <section className="flex flex-col items-center gap-6">
        {/* Header */}
        <div className="flex w-full max-w-4xl items-end justify-between px-4">
          <div>
            <h1 className="text-2xl font-semibold">Your Cozy Den</h1>
            <p className="text-foreground/60 text-sm">
              Drag items between slots to rearrange.{' '}
              <Link to="/student/shop" className="text-primary font-medium hover:underline">
                Visit the shop
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasAnyPlacements && (
              <button
                type="button"
                onClick={() => {
                  clearAllSlots()
                  setFinnMood('concerned')
                }}
                className="text-foreground/60 hover:text-danger border-divider hover:border-danger/30 inline-flex min-h-10 items-center rounded-md border px-3 text-sm transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={shareStatus === 'saving'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {shareStatus === 'saving' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : shareStatus === 'copied' ? (
                <>
                  <span>✓</span>
                  Link copied!
                </>
              ) : (
                <>
                  <span>🔗</span>
                  Share Space
                </>
              )}
            </button>
            <CoinCounter value={coins} />
          </div>
        </div>

        {/* THE ROOM */}
        <div 
          id="room-container"
          className="relative w-full max-w-4xl overflow-hidden rounded-3xl shadow-2xl" 
          style={{ height: '560px' }}
        >
          
          {/* === BACK WALL === */}
          <div 
            className="absolute inset-x-0 top-0 h-[65%]"
            style={{ 
              background: 'linear-gradient(180deg, #d4c4a8 0%, #c9b896 50%, #bfad84 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-10">
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute h-px w-full bg-amber-900/30" 
                  style={{ top: `${12 + i * 12}%` }} 
                />
              ))}
            </div>

            {/* Window */}
            <div className="absolute left-1/2 top-8 -translate-x-1/2">
              <div className="relative h-32 w-48 rounded-t-3xl border-8 border-amber-800/60 bg-gradient-to-b from-sky-300 to-sky-100 shadow-inner">
                <div className="absolute inset-2 border-4 border-amber-800/40" />
                <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-amber-800/40" />
                <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-amber-800/40" />
                <div className="absolute -left-4 top-0 h-full w-6 rounded-b-lg bg-gradient-to-r from-rose-200 to-rose-100 opacity-80" />
                <div className="absolute -right-4 top-0 h-full w-6 rounded-b-lg bg-gradient-to-l from-rose-200 to-rose-100 opacity-80" />
              </div>
              <div className="h-3 w-52 -translate-x-0.5 rounded-b bg-amber-800/70" />
            </div>
          </div>

          {/* === FLOOR === */}
          <div 
            className="absolute inset-x-0 bottom-0 h-[35%]"
            style={{ 
              background: 'linear-gradient(180deg, #8b7355 0%, #7a6548 50%, #6d5a3f 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute h-full w-px bg-amber-950" 
                  style={{ left: `${16 + i * 14}%` }} 
                />
              ))}
            </div>
            <div className="absolute bottom-8 left-1/2 h-24 w-80 -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-300/60 via-rose-200/70 to-rose-300/60 blur-sm" />
            <div className="absolute bottom-10 left-1/2 h-20 w-72 -translate-x-1/2 rounded-full border-4 border-rose-400/30 bg-gradient-to-r from-rose-200/50 via-amber-100/60 to-rose-200/50" />
          </div>

          {/* === DESK === */}
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="h-6 w-72 rounded-t-lg bg-gradient-to-b from-amber-700 to-amber-800 shadow-lg" />
              <div className="h-28 w-72 bg-gradient-to-b from-amber-800 to-amber-900 shadow-xl">
                <div className="absolute left-1/2 top-10 h-12 w-24 -translate-x-1/2 rounded border-2 border-amber-950/30 bg-amber-800/80">
                  <div className="absolute left-1/2 top-1/2 h-2 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-600" />
                </div>
              </div>
              <div className="absolute -bottom-8 left-4 h-8 w-4 bg-amber-900" />
              <div className="absolute -bottom-8 right-4 h-8 w-4 bg-amber-900" />

              {/* DESK SLOT */}
              {layout.data?.slots.find(s => s.id === 'desk-top') && (
                <DroppableSlot
                  slot={layout.data.slots.find(s => s.id === 'desk-top')!}
                  item={deskItem}
                  onSlotClick={() => setActiveSlot(layout.data!.slots.find(s => s.id === 'desk-top')!)}
                  className="absolute -top-12 left-1/2 -translate-x-1/2"
                />
              )}
            </div>
          </div>

          {/* === CHAIR === */}
          <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="absolute -top-16 left-1/2 h-16 w-14 -translate-x-1/2 rounded-t-2xl bg-gradient-to-b from-amber-600 to-amber-700" />
              <div className="h-4 w-16 rounded bg-amber-700 shadow-md" />
              <div className="absolute -bottom-6 left-1 h-6 w-2 bg-amber-800" />
              <div className="absolute -bottom-6 right-1 h-6 w-2 bg-amber-800" />
            </div>
          </div>

          {/* === LEFT WALL SHELF/FRAME === */}
          <div className="absolute left-8 top-20">
            <div className="h-3 w-28 rounded bg-amber-800/80 shadow-md" />
            {layout.data?.slots.find(s => s.id === 'wall-left') && (
              <DroppableSlot
                slot={layout.data.slots.find(s => s.id === 'wall-left')!}
                item={wallLeftItem}
                onSlotClick={() => setActiveSlot(layout.data!.slots.find(s => s.id === 'wall-left')!)}
                className="absolute -top-20 left-1/2 -translate-x-1/2"
              >
                <div className={`flex h-20 w-24 items-center justify-center rounded-lg border-4 transition-all ${
                  wallLeftItem 
                    ? 'border-amber-700 bg-amber-50 shadow-lg' 
                    : 'border-dashed border-amber-600/40 bg-amber-100/20 hover:bg-amber-100/40'
                }`}>
                  {wallLeftItem ? (
                    <DraggableItem id="item-wall-left" item={wallLeftItem} slotId="wall-left" />
                  ) : (
                    <span className="text-3xl font-light text-amber-700/50">+</span>
                  )}
                </div>
                <p className="mt-2 text-center text-xs font-medium text-amber-900/70">
                  {wallLeftItem?.name || 'Left wall'}
                </p>
              </DroppableSlot>
            )}
          </div>

          {/* === RIGHT WALL BOOKSHELF === */}
          <div className="absolute right-8 top-16">
            <div className="relative h-40 w-28 rounded border-4 border-amber-800 bg-amber-900/20">
              <div className="absolute left-0 top-1/3 h-1 w-full bg-amber-800" />
              <div className="absolute left-0 top-2/3 h-1 w-full bg-amber-800" />
              
              {layout.data?.slots.find(s => s.id === 'wall-right') && (
                <DroppableSlot
                  slot={layout.data.slots.find(s => s.id === 'wall-right')!}
                  item={wallRightItem}
                  onSlotClick={() => setActiveSlot(layout.data!.slots.find(s => s.id === 'wall-right')!)}
                  className="absolute inset-2 flex items-center justify-center"
                >
                  <div className={`flex h-full w-full items-center justify-center rounded transition-all ${
                    wallRightItem ? 'bg-amber-50/50' : 'hover:bg-amber-100/30'
                  }`}>
                    {wallRightItem ? (
                      <DraggableItem id="item-wall-right" item={wallRightItem} slotId="wall-right" />
                    ) : (
                      <span className="text-3xl font-light text-amber-700/50">+</span>
                    )}
                  </div>
                </DroppableSlot>
              )}
            </div>
            <p className="mt-2 text-center text-xs font-medium text-amber-900/70">
              {wallRightItem?.name || 'Bookshelf'}
            </p>
          </div>

          {/* === FLOOR PLANT/ITEM === */}
          {layout.data?.slots.find(s => s.id === 'floor-center') && (
            <DroppableSlot
              slot={layout.data.slots.find(s => s.id === 'floor-center')!}
              item={floorItem}
              onSlotClick={() => setActiveSlot(layout.data!.slots.find(s => s.id === 'floor-center')!)}
              className="absolute bottom-12 left-24"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                floorItem 
                  ? 'border-secondary/50 bg-surface/80 shadow-lg' 
                  : 'border-dashed border-amber-700/30 bg-amber-200/20 hover:bg-amber-200/40'
              }`}>
                {floorItem ? (
                  <DraggableItem id="item-floor-center" item={floorItem} slotId="floor-center" />
                ) : (
                  <span className="text-2xl font-light text-amber-100/70">+</span>
                )}
              </div>
              <p className="mt-1 text-center text-xs font-medium text-amber-100/80">
                {floorItem?.name || 'Floor'}
              </p>
            </DroppableSlot>
          )}

          {/* === READING NOOK / CORNER === */}
          {layout.data?.slots.find(s => s.id === 'corner-nook') && (
            <DroppableSlot
              slot={layout.data.slots.find(s => s.id === 'corner-nook')!}
              item={nookItem}
              onSlotClick={() => setActiveSlot(layout.data!.slots.find(s => s.id === 'corner-nook')!)}
              className="absolute bottom-12 right-16"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-xl border-2 transition-all ${
                nookItem 
                  ? 'border-secondary/50 bg-surface/80 shadow-lg' 
                  : 'border-dashed border-amber-700/30 bg-amber-200/20 hover:bg-amber-200/40'
              }`}>
                {nookItem ? (
                  <DraggableItem id="item-corner-nook" item={nookItem} slotId="corner-nook" />
                ) : (
                  <span className="text-2xl font-light text-amber-100/70">+</span>
                )}
              </div>
              <p className="mt-1 text-center text-xs font-medium text-amber-100/80">
                {nookItem?.name || 'Reading nook'}
              </p>
            </DroppableSlot>
          )}

          {/* === FINN === */}
          <div className="absolute bottom-4 left-4 z-10">
            <FinnMascot mood={finnMood} size={90} />
          </div>

          {/* === AMBIENT PARTICLES === */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-amber-200/40"
                initial={{ y: 400, x: 100 + Math.random() * 400, opacity: 0 }}
                animate={{ y: -20, opacity: [0, 0.5, 0] }}
                transition={{ duration: 10 + i * 2, repeat: Infinity, delay: i * 1.5 }}
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <p className="text-foreground/50 text-center text-xs">
          Tip: Drag items between slots to rearrange, or click a slot to place an item.
        </p>

        {/* BACK LINK */}
        <Link to="/student" className="text-primary text-sm font-medium hover:underline">
          Back to dashboard
        </Link>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {draggedItem && (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-primary bg-surface shadow-xl">
              <span className="text-3xl">{getItemIcon(draggedItem.name)}</span>
            </div>
          )}
        </DragOverlay>

        {/* MODAL */}
        <SimpleModal
          title={activeSlot?.label || 'Slot'}
          isOpen={!!activeSlot}
          onClose={() => setActiveSlot(null)}
        >
          {activeSlot ? (
            <div className="space-y-4">
              {(() => {
                const currentId = slotPlacements[activeSlot.id] ?? null
                const currentItem = resolveItem(currentId)
                return currentItem ? (
                  <div className="border-divider bg-surface flex items-center gap-4 rounded-lg border p-4">
                    <span className="text-4xl">{getItemIcon(currentItem.name)}</span>
                    <div className="flex-1">
                      <p className="text-foreground font-semibold">{currentItem.name}</p>
                      <p className="text-foreground/50 text-xs capitalize">
                        {currentItem.category.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        clearSlot(activeSlot.id)
                        setActiveSlot(null)
                      }}
                      className="text-danger border-danger/30 hover:bg-danger/10 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="border-divider bg-surface/50 flex items-center gap-3 rounded-lg border border-dashed p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-foreground/20 text-xl font-light text-foreground/40">+</span>
                    <p className="text-foreground/60 text-sm">
                      This slot is empty. Choose an item below to place.
                    </p>
                  </div>
                )
              })()}

              <div>
                <p className="text-foreground/60 mb-2 text-xs font-medium uppercase tracking-wide">
                  Your Inventory
                </p>
                {(inventory.data ?? []).length === 0 ? (
                  <p className="text-foreground/50 text-sm">
                    Nothing in inventory.{' '}
                    <Link to="/student/shop" className="text-primary font-medium hover:underline">
                      Visit the shop
                    </Link>{' '}
                    to buy items.
                  </p>
                ) : (
                  <ul className="max-h-52 space-y-2 overflow-y-auto">
                    {(inventory.data ?? []).map((row) => {
                      const isPlaced = placedInventoryIds.has(String(row.id))
                      return (
                        <li key={row.id}>
                          <button
                            type="button"
                            onClick={() => place(String(row.id))}
                            disabled={isPlaced}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                              isPlaced
                                ? 'border-divider bg-surface/50 cursor-not-allowed opacity-50'
                                : 'border-divider hover:border-secondary hover:bg-surface'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getItemIcon(row.name)}</span>
                              <div>
                                <span className="text-foreground font-medium">{row.name}</span>
                                <span className="text-foreground/50 ml-2 text-xs capitalize">
                                  {row.category.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                            <span className="text-foreground/50 text-xs">
                              {isPlaced ? 'In use' : 'Place'}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </SimpleModal>
      </section>
    </DndContext>
  )
}
