/**
 * DiceBear avatars via HTTP API (PRD §8.1).
 * Single app-wide style; seed derived from user id/email (not user-editable).
 * @see https://www.dicebear.com/guides/use-the-http-api/
 */
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x'

/** Matches backend signup default in `app_platform/auth/router.py`. */
export const APP_AVATAR_STYLE = 'adventurer' as const

export type AvatarStyle = typeof APP_AVATAR_STYLE | 'avataaars' | 'bottts' | 'lorelei'

export type AvatarUserLike = {
  id?: number
  email?: string
}

export function getAvatarSeed(user: AvatarUserLike): string {
  if (user.id != null && Number.isFinite(user.id)) {
    return `user-${user.id}`
  }
  const e = user.email?.trim().toLowerCase()
  if (e) return e
  return 'anonymous'
}

export function dicebearAvatarUrl(
  style: AvatarStyle,
  seed: string,
  options?: Record<string, string>,
): string {
  const params = new URLSearchParams({ seed, ...options })
  return `${DICEBEAR_BASE}/${style}/svg?${params.toString()}`
}

export function userAvatarUrl(user: AvatarUserLike): string {
  return dicebearAvatarUrl(APP_AVATAR_STYLE, getAvatarSeed(user))
}
