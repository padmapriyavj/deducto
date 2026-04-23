import { useState } from 'react'

import { Button } from '@/components/ui/Button'

type JoinCodeDisplayProps = {
  courseId: number
  code: string
}

function buildJoinUrl(courseId: number): string {
  if (typeof window === 'undefined') return `/join/${courseId}`
  return `${window.location.origin}/join/${courseId}`
}

export function JoinCodeDisplay({ courseId, code }: JoinCodeDisplayProps) {
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const joinUrl = buildJoinUrl(courseId)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = joinUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <div className="bg-primary/5 border-primary/20 flex w-full max-w-full flex-col gap-3 rounded-[var(--radius-md)] border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground/60 mb-1 text-xs font-medium uppercase tracking-wide">Join Code</p>
          <p className="text-primary font-mono text-2xl font-bold tracking-widest">{code}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => void copyCode()} className="shrink-0">
          {copiedCode ? '✓ Copied!' : 'Copy'}
        </Button>
      </div>
      <div className="border-primary/20 flex items-center justify-between gap-3 border-t pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-foreground/70 text-xs">Share link with students</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => void copyLink()}>
          {copiedLink ? '✓ Link copied!' : '🔗 Copy link'}
        </Button>
      </div>
    </div>
  )
}
