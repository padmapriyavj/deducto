import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TextField } from '@/components/ui/FormField'
import { PageContainer } from '@/components/ui/PageContainer'
import { Spinner } from '@/components/ui/Spinner'
import { useCourseJoinInfoQuery, useEnrollMutation } from '@/lib/queries/courseQueries'
import { useAuthStore } from '@/stores/authStore'

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

export function JoinCoursePage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>()
  const courseId = parseInt(courseIdParam ?? '', 10)
  const [joinCode, setJoinCode] = useState('')
  const navigate = useNavigate()

  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  const joinInfo = useCourseJoinInfoQuery(courseId)
  const enroll = useEnrollMutation()

  const joinPath =
    !Number.isNaN(courseId) && courseId > 0 ? `/join/${courseId}` : '/join'

  if (!isInitialized) {
    return <Spinner label="Loading..." />
  }

  if (Number.isNaN(courseId) || courseId <= 0) {
    return (
      <PageContainer narrow centered>
        <Card padding="lg" className="mx-auto text-left">
          <h1 className="mb-2 text-xl sm:text-2xl">Invalid link</h1>
          <p className="text-foreground/70 mb-6 text-sm">This invite link is not valid.</p>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Go to log in
          </Button>
        </Card>
      </PageContainer>
    )
  }

  if (joinInfo.isLoading) {
    return <Spinner label="Loading course..." />
  }

  if (joinInfo.isError || !joinInfo.data) {
    return (
      <PageContainer narrow centered>
        <Card padding="lg" className="mx-auto text-left">
          <h1 className="mb-2 text-xl sm:text-2xl">Course not found</h1>
          <p className="text-foreground/70 mb-6 text-sm leading-relaxed">
            We could not find a course for this link. Ask your professor for an updated invite.
          </p>
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Go to log in
          </Button>
        </Card>
      </PageContainer>
    )
  }

  if (!token || !user) {
    return (
      <PageContainer narrow centered>
        <Card padding="lg" className="mx-auto text-left">
          <h1 className="mb-2 text-2xl sm:text-3xl">Join course</h1>
          <p className="text-foreground/80 mb-6 text-sm leading-relaxed sm:text-base">
            You are joining <strong>{joinInfo.data.name}</strong>. Log in with a student account,
            then come back to this page and enter your join code.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              state={{ from: joinPath }}
              className="bg-primary text-surface hover:opacity-95 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-sm)] px-4 py-2.5 text-center text-sm font-semibold transition-opacity sm:flex-1"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              state={{ from: joinPath }}
              className="border-divider text-foreground hover:bg-background inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border px-4 py-2.5 text-center text-sm font-medium transition-colors sm:flex-1"
            >
              Sign up
            </Link>
          </div>
        </Card>
      </PageContainer>
    )
  }

  if (user.role !== 'student') {
    return (
      <PageContainer narrow centered>
        <Card padding="lg" className="mx-auto text-left">
          <h1 className="mb-2 text-xl sm:text-2xl">Student accounts only</h1>
          <p className="text-foreground/70 mb-6 text-sm leading-relaxed">
            Only students can join a course with an invite link. Switch to a student account or
            open this link in a private window after signing up as a student.
          </p>
          <Button variant="secondary" onClick={() => navigate('/professor')}>
            Go to professor dashboard
          </Button>
        </Card>
      </PageContainer>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    enroll.mutate(
      { courseId, data: { join_code: joinCode.trim() } },
      {
        onSuccess: () => {
          setJoinCode('')
          navigate('/student', { replace: true })
        },
      },
    )
  }

  return (
    <PageContainer narrow centered>
      <Card padding="lg" className="mx-auto text-left">
        <h1 className="mb-2 text-2xl sm:text-3xl">Join course</h1>
        <p className="text-foreground/80 mb-6 text-sm leading-relaxed sm:text-base">
          Enter the join code for <strong>{joinInfo.data.name}</strong>.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="join-page-code"
            label="Join code"
            type="text"
            required
            minLength={6}
            maxLength={6}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC123"
            inputClassName="font-mono uppercase tracking-widest"
            autoComplete="off"
            error={enroll.isError ? parseApiError(enroll.error) : undefined}
          />
          <Button type="submit" fullWidth disabled={enroll.isPending || !joinCode.trim()}>
            {enroll.isPending ? 'Joining...' : 'Join course'}
          </Button>
        </form>
        <p className="text-foreground/70 mt-6 text-center text-sm">
          <Link to="/student" className="text-primary font-medium underline-offset-2 hover:underline">
            Back to dashboard
          </Link>
        </p>
      </Card>
    </PageContainer>
  )
}
