/** Extract course id from a pasted invite URL (path must contain `/join/<id>`). */
export function parseInviteCourseId(input: string): number | null {
  const t = input.trim()
  const m = t.match(/\/join\/(\d+)/i)
  if (!m?.[1]) return null
  const n = parseInt(m[1], 10)
  return n > 0 && !Number.isNaN(n) ? n : null
}
