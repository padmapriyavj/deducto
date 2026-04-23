import { playElevenLabsTts } from '@/lib/voice/elevenLabsTts'
import type { FinnVoiceTrigger } from '@/lib/voice/prdTriggers'
import { playFromUrl, playSpeechFallback } from '@/lib/voice/playback'
import { getVoiceCacheUrl } from '@/lib/voice/voiceCache'

export type PlayFinnVoiceLineArgs = {
  trigger: FinnVoiceTrigger
  /** Spoken text when using TTS or Web Speech (ignored if cache URL plays). */
  text: string
}

/**
 * Resolve audio for a Finn line: **cached URL → ElevenLabs TTS → Web Speech** (PRD §14.3).
 * QuizRunner / Tempo / duel UI should call this (or helpers in quizVoice.ts).
 */
export async function playFinnVoiceLine({
  trigger,
  text,
}: PlayFinnVoiceLineArgs): Promise<void> {
  const cached = getVoiceCacheUrl(trigger)
  if (cached) {
    await playFromUrl(cached)
    return
  }

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY?.trim()
  const voiceId =
    import.meta.env.VITE_ELEVENLABS_VOICE_ID?.trim() ||
    'JBFqnCBsd6RMkjVDRZzb'

  if (apiKey) {
    await playElevenLabsTts(apiKey, voiceId, text)
    return
  }

  await playSpeechFallback(text)
}
