import { useEffect, useRef, useState } from 'react'

type Props = {
  seconds: number
  onExpire?: () => void
  paused?: boolean
}

export function CountdownTimer({ seconds, onExpire, paused }: Props) {
  /** Parent should change `key` when the countdown should fully reset. */
  const [left, setLeft] = useState(seconds)
  const [srTick, setSrTick] = useState('')
  const expired = useRef(false)

  useEffect(() => {
    if (paused || left <= 0) {
      if (left <= 0 && !expired.current) {
        expired.current = true
        const announceId = requestAnimationFrame(() => setSrTick('Time is up.'))
        onExpire?.()
        return () => cancelAnimationFrame(announceId)
      }
      return
    }
    const t = window.setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => window.clearTimeout(t)
  }, [left, paused, onExpire])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (left <= 0 || left > 5) {
        if (left > 5) setSrTick('')
        return
      }
      setSrTick(`${left} seconds remaining.`)
    })
    return () => cancelAnimationFrame(id)
  }, [left])

  const urgent = left <= 5 && left > 0
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {srTick}
      </span>
      <div
        className={`font-mono text-2xl tabular-nums ${urgent ? 'text-danger' : 'text-foreground'}`}
        aria-hidden
      >
        {left}s
      </div>
    </div>
  )
}

