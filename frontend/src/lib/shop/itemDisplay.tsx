import { useState } from 'react'

import {
  getInventoryRowFields,
  type InventoryItemResponse,
  type ShopItemResponse,
} from '@/lib/api/shopSpaceApi'

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

const CATEGORY_ICONS: Record<string, string> = {
  finn_skin: '🦊',
  space_item: '📦',
  backdrop: '🖼️',
  streak_freeze: '❄️',
}

/** Emoji fallback when `asset_url` is missing or not a usable image URL. */
export function getItemIcon(name: string, category: string = ''): string {
  return ITEM_ICONS[name] ?? CATEGORY_ICONS[category] ?? '📦'
}

function mayBeRemoteOrAbsoluteImageUrl(url: string): boolean {
  const u = url.trim()
  if (!u) return false
  // `data:` and `blob:` are real image payloads; http(s)/relative may still 404 — handled via onError.
  return (
    u.startsWith('http://') ||
    u.startsWith('https://') ||
    u.startsWith('/') ||
    u.startsWith('data:') ||
    u.startsWith('blob:')
  )
}

type ItemMediaProps = {
  name: string
  category?: string
  assetUrl?: string
  className?: string
  /** Tailwind for emoji span (e.g. text-3xl) */
  emojiClassName?: string
  alt?: string
}

/**
 * Tries `asset_url` as an image; on load failure (404, CORS, bad path) falls back to emoji
 * so the UI never shows a broken `<img>`.
 */
export function ItemMedia({
  name,
  category = '',
  assetUrl = '',
  className = 'h-8 w-8',
  emojiClassName = 'text-3xl',
  alt,
}: ItemMediaProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const tryUrl = (assetUrl ?? '').trim()
  const shouldTryImg = !imgFailed && tryUrl.length > 0 && mayBeRemoteOrAbsoluteImageUrl(tryUrl)

  if (shouldTryImg) {
    return (
      <img
        src={tryUrl}
        alt=""
        className={`object-contain ${className}`}
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
      />
    )
  }
  return (
    <span className={emojiClassName} role="img" aria-label={alt ?? name}>
      {getItemIcon(name, category)}
    </span>
  )
}

type InventoryItemMediaProps = {
  item: InventoryItemResponse & { item?: ShopItemResponse; user_id?: number }
} & Pick<ItemMediaProps, 'className' | 'emojiClassName' | 'alt'>

export function InventoryItemMedia({ item, className, emojiClassName, alt }: InventoryItemMediaProps) {
  const d = getInventoryRowFields(item)
  return (
    <ItemMedia
      name={d.name}
      category={d.category}
      assetUrl={d.asset_url}
      className={className}
      emojiClassName={emojiClassName}
      alt={alt}
    />
  )
}
