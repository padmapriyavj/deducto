import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { defaultStudySpaceLayout } from '@/lib/space/defaultLayout'

export type CustomSlot = {
  id: string
  label: string
  x: number
  y: number
}

function emptyPlacements(): Record<string, string | null> {
  return Object.fromEntries(
    defaultStudySpaceLayout.slots.map((s) => [s.id, null]),
  ) as Record<string, string | null>
}

type EconomyState = {
  coins: number
  slotPlacements: Record<string, string | null>
  customSlots: CustomSlot[]
  setCoinsFromBackend: (coins: number) => void
  placeInSlot: (slotId: string, inventoryItemId: string) => void
  clearSlot: (slotId: string) => void
  clearAllSlots: () => void
  addCustomSlot: (slot: CustomSlot) => void
  updateCustomSlotPosition: (slotId: string, x: number, y: number) => void
  removeCustomSlot: (slotId: string) => void
  moveItemBetweenSlots: (fromSlotId: string, toSlotId: string) => void
  resetEconomy: () => void
}

export const useStudentEconomyStore = create<EconomyState>()(
  persist(
    (set) => ({
      coins: 0,
      slotPlacements: emptyPlacements(),
      customSlots: [],

      setCoinsFromBackend: (coins) => set({ coins }),

      placeInSlot: (slotId, inventoryItemId) => {
        set((s) => {
          const placements = { ...s.slotPlacements }
          for (const [sid, val] of Object.entries(placements)) {
            if (val === inventoryItemId && sid !== slotId) placements[sid] = null
          }
          placements[slotId] = inventoryItemId
          return { slotPlacements: placements }
        })
      },

      clearSlot: (slotId) => {
        set((s) => ({
          slotPlacements: { ...s.slotPlacements, [slotId]: null },
        }))
      },

      clearAllSlots: () => {
        set((s) => {
          const placements: Record<string, string | null> = { ...emptyPlacements() }
          for (const slot of s.customSlots) {
            placements[slot.id] = null
          }
          return { slotPlacements: placements }
        })
      },

      addCustomSlot: (slot) => {
        set((s) => ({
          customSlots: [...s.customSlots, slot],
          slotPlacements: { ...s.slotPlacements, [slot.id]: null },
        }))
      },

      updateCustomSlotPosition: (slotId, x, y) => {
        set((s) => ({
          customSlots: s.customSlots.map((slot) =>
            slot.id === slotId ? { ...slot, x, y } : slot
          ),
        }))
      },

      removeCustomSlot: (slotId) => {
        set((s) => {
          const { [slotId]: _, ...remainingPlacements } = s.slotPlacements
          return {
            customSlots: s.customSlots.filter((slot) => slot.id !== slotId),
            slotPlacements: remainingPlacements,
          }
        })
      },

      moveItemBetweenSlots: (fromSlotId, toSlotId) => {
        set((s) => {
          const fromItem = s.slotPlacements[fromSlotId]
          const toItem = s.slotPlacements[toSlotId]
          return {
            slotPlacements: {
              ...s.slotPlacements,
              [fromSlotId]: toItem ?? null,
              [toSlotId]: fromItem ?? null,
            },
          }
        })
      },

      resetEconomy: () =>
        set({
          coins: 0,
          slotPlacements: emptyPlacements(),
          customSlots: [],
        }),
    }),
    {
      name: 'deductible-student-economy',
      version: 3,
      migrate: (persistedState, fromVersion) => {
        if (fromVersion < 3 && persistedState && typeof persistedState === 'object') {
          const p = persistedState as { coins?: number; slotPlacements?: Record<string, string | null> }
          return {
            coins: typeof p.coins === 'number' ? p.coins : 0,
            slotPlacements: p.slotPlacements ?? emptyPlacements(),
            customSlots: [],
          }
        }
        return persistedState as Partial<EconomyState>
      },
    },
  ),
)
