import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/FormField'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { JOIN_CODE_MAX_LENGTH, parseInviteCourseId } from '@/lib/joinInvite'
import { useEnrollMutation } from '@/lib/queries/courseQueries'

type JoinCourseModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message)
      return parsed.detail || error.message
    } catch {
      return error.message
    }
  }
  return 'Something went wrong. Please try again.'
}

export function JoinCourseModal({ isOpen, onClose, onSuccess }: JoinCourseModalProps) {
  const [inviteLink, setInviteLink] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const enroll = useEnrollMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    const courseId = parseInviteCourseId(inviteLink)
    if (courseId == null) {
      setLocalError(
        'Paste the full invite link from your professor (it should contain /join/ and a number).',
      )
      return
    }
    if (!joinCode.trim()) return

    enroll.mutate(
      { courseId, data: { join_code: joinCode.trim() } },
      {
        onSuccess: () => {
          setInviteLink('')
          setJoinCode('')
          onSuccess?.()
          onClose()
        },
      },
    )
  }

  const handleClose = () => {
    setInviteLink('')
    setJoinCode('')
    setLocalError(null)
    enroll.reset()
    onClose()
  }

  const enrollError = enroll.isError ? parseApiError(enroll.error) : undefined

  return (
    <SimpleModal title="Join a course" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-foreground/70 text-sm">
          Paste the invite link your professor shared, then enter the join code.
        </p>
        <TextField
          id="join-invite-link"
          label="Invite link"
          type="url"
          inputMode="url"
          placeholder="https://…/join/123"
          value={inviteLink}
          onChange={(e) => {
            setInviteLink(e.target.value)
            setLocalError(null)
            enroll.reset()
          }}
          error={localError ?? undefined}
          inputClassName="font-sans text-sm"
        />
        <TextField
          id="join-code"
          label="Join code"
          type="text"
          required
          minLength={JOIN_CODE_MAX_LENGTH}
          maxLength={JOIN_CODE_MAX_LENGTH}
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value.toUpperCase())
            enroll.reset()
          }}
          placeholder="8 characters (A–Z, 0–9)"
          error={enrollError}
          inputClassName="font-mono uppercase tracking-widest"
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={enroll.isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={enroll.isPending || !joinCode.trim() || !inviteLink.trim()}>
            {enroll.isPending ? 'Joining...' : 'Join course'}
          </Button>
        </div>
      </form>
    </SimpleModal>
  )
}
