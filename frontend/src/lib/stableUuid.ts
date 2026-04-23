/** Deterministic UUID-shaped string from integer (for intelligence APIs expecting UUID). */
export function stableUuidFromInt(n: number): string {
  const tail = Math.max(0, Math.floor(n)).toString(16).padStart(12, '0').slice(-12)
  return `00000000-0000-4000-8000-${tail}`
}

/** Inverse of ``stableUuidFromInt`` when the UUID matches that pattern; otherwise ``null``. */
export function intFromStableUuid(uuid: string): number | null {
  const m = /^00000000-0000-4000-8000-([0-9a-f]{12})$/i.exec(uuid.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return Number.isFinite(n) ? n : null
}
