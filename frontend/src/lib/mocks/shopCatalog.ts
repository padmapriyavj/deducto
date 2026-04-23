export type ShopCategory = 'decor' | 'desk' | 'plant'

export type ShopCatalogItem = {
  id: string
  name: string
  description: string
  price: number
  category: ShopCategory
}

export const shopCatalogFixture: ShopCatalogItem[] = [
  {
    id: 'poster-math',
    name: 'Proof poster',
    description: 'Keep induction honest.',
    price: 25,
    category: 'decor',
  },
  {
    id: 'plant-fern',
    name: 'Desk fern',
    description: 'Photosynthesis for morale.',
    price: 40,
    category: 'plant',
  },
  {
    id: 'lamp-desk',
    name: 'Warm desk lamp',
    description: 'Late-night tempo companion.',
    price: 55,
    category: 'desk',
  },
  {
    id: 'rug-round',
    name: 'Round rug',
    description: 'Defines your study zone.',
    price: 70,
    category: 'decor',
  },
  {
    id: 'trophy-small',
    name: 'Tiny trophy',
    description: 'For the quiz you almost aced.',
    price: 90,
    category: 'decor',
  },
]

export function getShopItemById(id: string): ShopCatalogItem | undefined {
  return shopCatalogFixture.find((i) => i.id === id)
}
