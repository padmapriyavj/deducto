import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  speakDuelIntro,
  speakDuelPeerCommentary,
  speakDuelQuestionRead,
  speakDuelWinnerCallout,
} from '@/lib/voice/quizVoice'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Preview Finn duel voice lines before Socket.IO QuizRunner exists.
 * Wire `quizVoice` helpers from real duel room events when `/quiz-room` ships.
 */
async function runDuelVoiceShowcase(): Promise<void> {
  await speakDuelIntro(
    "Welcome both of you! I'm Finn — I'll host this practice duel. First question coming up.",
  )
  await delay(600)
  await speakDuelQuestionRead(
    'Question one: Which of the following best describes a directed graph?',
  )
  await delay(600)
  await speakDuelPeerCommentary('Your classmate just locked in an answer — no pressure!')
  await delay(600)
  await speakDuelWinnerCallout(
    'Time! That was a close one — great work from both of you. Check the board for coins.',
  )
}

export function DuelVoicePreviewPage() {
  const [err, setErr] = useState<string | null>(null)
  const run = useMutation({
    mutationFn: runDuelVoiceShowcase,
    onMutate: () => setErr(null),
    onError: (e) => setErr(e instanceof Error ? e.message : 'Playback failed.'),
  })

  return (
    <section className="text-left">
      <PageHeader
        title="Practice duel — Finn voice"
        description="Plays a short sequence using the same quiz voice helpers the live duel QuizRunner will call after socket events are wired. Audio resolves: cached clip, ElevenLabs TTS, then Web Speech."
      />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={() => run.mutate()} disabled={run.isPending}>
          {run.isPending ? 'Playing showcase…' : 'Run duel voice showcase'}
        </Button>
        <Link
          to="/student"
          className="border-divider text-foreground inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] border px-4 text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
      {err ? (
        <p className="text-danger max-w-xl text-sm" role="alert">
          {err}
        </p>
      ) : null}
    </section>
  )
}
