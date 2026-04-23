import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

import { FinnMascot } from '@/components/finn/FinnMascot'
import { getPublicSpace, type PublicSpaceResponse } from '@/lib/api/shopSpaceApi'

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

function SlotDisplay({ itemName }: { itemName: string }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-secondary/50 bg-surface/90 shadow-lg">
      <span className="text-3xl">{getItemIcon(itemName)}</span>
    </div>
  )
}

function EmptySlot({ label }: { label: string }) {
  return (
    <>
      <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-amber-600/40 bg-amber-100/30">
        <span className="text-2xl font-light text-amber-700/50">+</span>
      </div>
      <p className="mt-1 text-center text-xs font-medium text-amber-900/70">{label}</p>
    </>
  )
}

export function PublicSpacePage() {
  const { userId } = useParams<{ userId: string }>()
  const numericUserId = userId ? parseInt(userId, 10) : 0

  const {
    data: space,
    isLoading,
    error,
  } = useQuery<PublicSpaceResponse>({
    queryKey: ['public-space', numericUserId],
    queryFn: () => getPublicSpace(numericUserId),
    enabled: numericUserId > 0,
  })

  const getSlotItem = (slotId: string) => {
    const placement = space?.placements.find((p) => p.slot_id === slotId)
    return placement ?? null
  }

  const wallLeftItem = getSlotItem('wall-left')
  const wallRightItem = getSlotItem('wall-right')
  const deskItem = getSlotItem('desk-top')
  const floorItem = getSlotItem('floor-center')
  const nookItem = getSlotItem('corner-nook')

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-foreground/60">Loading space...</p>
      </section>
    )
  }

  if (error || !space) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <span className="text-6xl">🦊</span>
        <h2 className="text-xl font-semibold">Space not found</h2>
        <p className="text-foreground/60">This space doesn't exist or hasn't been shared yet.</p>
        <Link to="/" className="text-primary mt-4 font-medium hover:underline">
          Go home
        </Link>
      </section>
    )
  }

  return (
    <section className="flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex w-full max-w-4xl flex-col items-center px-4 text-center">
        <h1 className="text-2xl font-semibold">{space.display_name}'s Cozy Den</h1>
        <p className="text-foreground/60 text-sm">A peek into their study space ✨</p>
      </div>

      {/* THE ROOM (read-only) */}
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
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              {deskItem ? (
                <>
                  <SlotDisplay itemName={deskItem.item_name} />
                  <p className="mt-1 text-center text-xs font-medium text-amber-900/70">
                    {deskItem.item_name}
                  </p>
                </>
              ) : (
                <EmptySlot label="Desk" />
              )}
            </div>
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
          <div className="absolute -top-20 left-1/2 -translate-x-1/2">
            {wallLeftItem ? (
              <>
                <div className="flex h-20 w-24 items-center justify-center rounded-lg border-4 border-amber-700 bg-amber-50 shadow-lg">
                  <span className="text-3xl">{getItemIcon(wallLeftItem.item_name)}</span>
                </div>
                <p className="mt-2 text-center text-xs font-medium text-amber-900/70">
                  {wallLeftItem.item_name}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-20 w-24 items-center justify-center rounded-lg border-4 border-dashed border-amber-600/40 bg-amber-100/20">
                  <span className="text-3xl font-light text-amber-700/50">+</span>
                </div>
                <p className="mt-2 text-center text-xs font-medium text-amber-900/70">Left wall</p>
              </>
            )}
          </div>
        </div>

        {/* === RIGHT WALL BOOKSHELF === */}
        <div className="absolute right-8 top-16">
          <div className="relative flex h-40 w-28 items-center justify-center rounded border-4 border-amber-800 bg-amber-900/20">
            <div className="absolute left-0 top-1/3 h-1 w-full bg-amber-800" />
            <div className="absolute left-0 top-2/3 h-1 w-full bg-amber-800" />

            {wallRightItem ? (
              <span className="text-3xl">{getItemIcon(wallRightItem.item_name)}</span>
            ) : (
              <span className="text-3xl font-light text-amber-700/50">+</span>
            )}
          </div>
          <p className="mt-2 text-center text-xs font-medium text-amber-900/70">
            {wallRightItem?.item_name || 'Bookshelf'}
          </p>
        </div>

        {/* === FLOOR PLANT/ITEM === */}
        <div className="absolute bottom-12 left-24">
          {floorItem ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-secondary/50 bg-surface/80 shadow-lg">
                <span className="text-3xl">{getItemIcon(floorItem.item_name)}</span>
              </div>
              <p className="mt-1 text-center text-xs font-medium text-amber-100/80">
                {floorItem.item_name}
              </p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-amber-700/30 bg-amber-200/20">
                <span className="text-2xl font-light text-amber-100/70">+</span>
              </div>
              <p className="mt-1 text-center text-xs font-medium text-amber-100/80">Floor</p>
            </>
          )}
        </div>

        {/* === READING NOOK / CORNER === */}
        <div className="absolute bottom-12 right-16">
          {nookItem ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-secondary/50 bg-surface/80 shadow-lg">
                <span className="text-3xl">{getItemIcon(nookItem.item_name)}</span>
              </div>
              <p className="mt-1 text-center text-xs font-medium text-amber-100/80">
                {nookItem.item_name}
              </p>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-amber-700/30 bg-amber-200/20">
                <span className="text-2xl font-light text-amber-100/70">+</span>
              </div>
              <p className="mt-1 text-center text-xs font-medium text-amber-100/80">Reading nook</p>
            </>
          )}
        </div>

        {/* === FINN === */}
        <div className="absolute bottom-4 left-4 z-10">
          <FinnMascot mood="neutral" size={90} />
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

      {/* Share info */}
      <div className="bg-surface/60 border-divider flex items-center gap-3 rounded-xl border px-4 py-3">
        <span className="text-2xl">🔗</span>
        <div>
          <p className="text-foreground text-sm font-medium">Want your own cozy space?</p>
          <p className="text-foreground/60 text-xs">
            Sign up and customize your study den with items from the shop!
          </p>
        </div>
        <Link
          to="/signup"
          className="bg-primary text-primary-foreground ml-auto rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/90"
        >
          Get started
        </Link>
      </div>

      {/* Back link */}
      <Link to="/" className="text-primary text-sm font-medium hover:underline">
        Go to homepage
      </Link>
    </section>
  )
}
