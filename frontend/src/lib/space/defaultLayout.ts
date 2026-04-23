/** Default study-space slots (client-side until a space layout API exists). */
export type SpaceSlotRegion = 'wall' | 'floor' | 'desk'

export type SpaceSlot = {
  id: string
  label: string
  region: SpaceSlotRegion
}

export type SpaceLayout = {
  layoutId: string
  title: string
  slots: SpaceSlot[]
}

export const defaultStudySpaceLayout: SpaceLayout = {
  layoutId: 'default',
  title: 'Your study space',
  slots: [
    { id: 'wall-left', label: 'Left wall', region: 'wall' },
    { id: 'wall-right', label: 'Right wall', region: 'wall' },
    { id: 'desk-top', label: 'Desk surface', region: 'desk' },
    { id: 'floor-center', label: 'Floor center', region: 'floor' },
    { id: 'corner-nook', label: 'Reading nook', region: 'floor' },
  ],
}
