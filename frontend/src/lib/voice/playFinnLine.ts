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
 *
 * Never throws for network or TTS failures (invalid key, quota, etc.) so quiz scoring
 * and navigation are not coupled to voice.
 */
export async function playFinnVoiceLine({
  trigger,
  text,
}: PlayFinnVoiceLineArgs): Promise<void> {
  const cached = getVoiceCacheUrl(trigger)
  if (cached) {
    try {
      await playFromUrl(cached)
      return
    } catch {
      /* fall through to ElevenLabs / Web Speech */
    }
  }

  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY?.trim()
  const voiceId =
    import.meta.env.VITE_ELEVENLABS_VOICE_ID?.trim() ||
    'JBFqnCBsd6RMkjVDRZzb'

  if (apiKey) {
    try {
      await playElevenLabsTts(apiKey, voiceId, text)
      return
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[Finn voice] ElevenLabs TTS failed; using Web Speech if available.', e)
      }
    }
  }

  try {
    await playSpeechFallback(text)
  } catch {
    /* Web Speech unavailable — still do not fail callers */
  }
}
